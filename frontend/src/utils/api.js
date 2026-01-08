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
 * Make an authenticated API request with Django session authentication
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @param {string} csrfToken - CSRF token (optional)
 * @returns {Promise<Response>} Fetch response
 */
export const apiRequest = async (endpoint, options = {}, csrfToken = '') => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
      ...(options.headers || {}),
    },
    credentials: 'include', // Important: This sends cookies with every request
    ...options,
  };

  return fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
};

/**
 * Room Service - All room-related API calls
 */
export const roomService = {
  /**
   * Get all rooms for the authenticated owner
   * @returns {Promise<Array>} Array of room objects
   */
  getAllRooms: async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.ROOMS);
      if (!response.ok) throw new Error('Failed to fetch rooms');
      return await response.json();
    } catch (error) {
      console.error('Error in getAllRooms:', error);
      throw error;
    }
  },

  /**
   * Create a new room
   * @param {Object} roomData - Room data including images
   * @returns {Promise<Object>} Created room object
   */
  createRoom: async (roomData) => {
    try {
      const csrfToken = await getCsrfToken();
      const formData = new FormData();
      
      // Add room data to FormData
      Object.keys(roomData).forEach(key => {
        if (key === 'images' && roomData[key]) {
          // Add multiple images
          roomData[key].forEach((file) => {
            formData.append('images', file);
          });
        } else {
          formData.append(key, roomData[key]);
        }
      });

      const response = await apiRequest(
        API_ENDPOINTS.ROOMS,
        {
          method: 'POST',
          body: formData,
          headers: {}, // Let browser set Content-Type for FormData (includes boundary)
        },
        csrfToken
      );

      if (!response.ok) throw new Error('Failed to create room');
      return await response.json();
    } catch (error) {
      console.error('Error in createRoom:', error);
      throw error;
    }
  },

  /**
   * Update an existing room
   * @param {number} roomId - Room ID
   * @param {Object} roomData - Updated room data
   * @returns {Promise<Object>} Updated room object
   */
  updateRoom: async (roomId, roomData) => {
    try {
      const csrfToken = await getCsrfToken();
      const formData = new FormData();
      
      // Add room data to FormData
      Object.keys(roomData).forEach(key => {
        if (key === 'images' && roomData[key]) {
          // Add multiple images
          roomData[key].forEach((file) => {
            formData.append('images', file);
          });
        } else {
          formData.append(key, roomData[key]);
        }
      });

      const response = await apiRequest(
        `${API_ENDPOINTS.ROOMS}${roomId}/`,
        {
          method: 'PUT',
          body: formData,
          headers: {}, // Let browser set Content-Type for FormData
        },
        csrfToken
      );

      if (!response.ok) throw new Error('Failed to update room');
      return await response.json();
    } catch (error) {
      console.error('Error in updateRoom:', error);
      throw error;
    }
  },

  /**
   * Delete a room
   * @param {number} roomId - Room ID
   * @returns {Promise<boolean>} Success status
   */
  deleteRoom: async (roomId) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await apiRequest(
        `${API_ENDPOINTS.ROOMS}${roomId}/`,
        {
          method: 'DELETE',
        },
        csrfToken
      );

      if (!response.ok) throw new Error('Failed to delete room');
      return true;
    } catch (error) {
      console.error('Error in deleteRoom:', error);
      throw error;
    }
  },
};