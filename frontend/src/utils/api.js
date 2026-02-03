/**
 * API Utility Functions - Django Session Authentication
 */

import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

/**
 * Save user data to localStorage
 * @param {Object} user - User data
 */
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Get user data from localStorage
 * @returns {Object|null} User data
 */
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Remove user data from localStorage
 */
export const removeUser = () => {
  localStorage.removeItem('user');
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return getUser() !== null;
};

/**
 * Fetch CSRF token from backend
 * @returns {Promise<string>} CSRF token
 */
/**
 * Fetch CSRF token from backend
 * @returns {Promise<string>} CSRF token
 */
export const getCsrfToken = async () => {
  try {
    // 1. Try to get it from the JSON endpoint
    console.log(`[CSRF] Fetching from endpoint: ${API_BASE_URL}${API_ENDPOINTS.CSRF}`);
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CSRF}`, {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.csrfToken) {
        console.log('[CSRF] Got token from JSON endpoint');
        return data.csrfToken;
      }
    }

    // 2. Fallback: Try to read from document.cookie (if HTTP-only is false)
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }

    if (cookieValue) {
      console.log('[CSRF] Got token from document.cookie fallback');
      return cookieValue;
    }

    console.error('[CSRF] FAILED to get token from both endpoint and cookies');
    return '';
  } catch (error) {
    console.error('[CSRF] Error during token acquisition:', error);
    return '';
  }
};

/**
 * Make an authenticated API request with Django session authentication
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  let token = '';

  // Automatically fetch CSRF token for state-changing methods
  if (method !== 'GET') {
    console.log(`[API] ${method} request detected. Fetching CSRF token...`);
    token = await getCsrfToken();
    if (!token) {
      console.warn('[API] Warning: CSRF token is empty or missing!');
    }
  }

  const defaultOptions = {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token && { 'X-CSRFToken': token }),
      ...(options.headers || {}),
    },
    credentials: 'include', // Important: This sends cookies (sessionid, csrftoken) with every request
  };

  console.log(`[API] Sending ${method} to ${endpoint}`);
  if (token) {
    console.log(`[API] Header X-CSRFToken: ${token.substring(0, 10)}... (Length: ${token.length})`);
  } else if (method !== 'GET') {
    console.warn('[API] Header X-CSRFToken: MISSING');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);

    if (!response.ok) {
      console.error(`[API] Error ${response.status}: ${response.statusText}`);
      console.log(`[API] Requested Endpoint: ${endpoint}`);

      // Clone the response so we can read it for logging without exhausting the main stream
      const responseClone = response.clone();
      const errorText = await responseClone.text();
      console.error('[API] Server Response:', errorText);

      // Try to parse as JSON for cleaner logging
      try {
        const errorJson = JSON.parse(errorText);
        console.error('[API] Parsed Error JSON:', errorJson);
      } catch (e) {
        // Not JSON, already logged as text
      }
    }

    return response;
  } catch (error) {
    console.error(`[API] FETCH ERROR: ${error.message}`);
    throw error;
  }
};
