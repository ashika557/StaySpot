/**
 * API Configuration Constants
 */

export const API_BASE_URL = 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  REGISTER: '/register/',
  LOGIN: '/login/',
  LOGOUT: '/logout/',
  USER: '/user/',
  CSRF: '/csrf/',
  FORGOT_PASSWORD: '/forgot-password/',
  RESET_PASSWORD: '/reset-password/',
  VERIFY_EMAIL: '/verify-email/',
  VERIFY_OTP: '/verify-otp/',
  RESEND_OTP: '/resend-otp/',
  ROOMS: '/rooms/',
  CHAT: '/chat/',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email/:token',
  OWNER_DASHBOARD: '/owner/dashboard',
  OWNER_ROOMS: '/owner/rooms',
  TENANT_DASHBOARD: '/tenant/dashboard',
  TENANT_SEARCH: '/tenant/search',
  CHAT: '/chat',
};

/**
 * Helper to get the full URL for media files
 * @param {string} path - The relative or absolute path to the media file
 * @returns {string} The full URL to the media file
 */
export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  // Remove leading slash if it exists
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // Determine backend base URL (remove /api if it exists)
  const backendUrl = API_BASE_URL.replace('/api', '');
  return `${backendUrl}/${cleanPath}`;
};