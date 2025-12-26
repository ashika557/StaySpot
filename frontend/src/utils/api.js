/**
 * API Utility Functions
 */

import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

/**
 * Fetch CSRF token from backend
 * @returns {Promise<string>} CSRF token
 */
export const getCsrfToken = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CSRF}`, {
      credentials: 'include',
    });
    const data = await response.json();
    return data.csrfToken || '';
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return '';
  }
};

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @param {string} csrfToken - CSRF token
 * @returns {Promise<Response>} Fetch response
 */
export const apiRequest = async (endpoint, options = {}, csrfToken = '') => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  };
  
  // Ensure CSRF token is in headers even if options.headers was provided
  if (csrfToken && defaultOptions.headers) {
    defaultOptions.headers['X-CSRFToken'] = csrfToken;
  }

  return fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
};

