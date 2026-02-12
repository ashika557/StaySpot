/**
 * API Configuration Constants
 */

export const API_BASE_URL = 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  REGISTER: '/register/',
  REQUEST_REGISTRATION_OTP: '/request-registration-otp/',
  VERIFY_REGISTRATION_OTP: '/verify-registration-otp/',
  VERIFY_FORGOT_PASSWORD_OTP: '/verify-forgot-password-otp/',
  LOGIN: '/login/',
  LOGOUT: '/logout/',
  USER: '/user/',
  GET_USER: '/user/',
  CSRF: '/csrf/',
  FORGOT_PASSWORD: '/forgot-password/',
  RESET_PASSWORD: '/reset-password/',
  VERIFY_EMAIL: '/verify-email/',
  VERIFY_OTP: '/verify-otp/',
  RESEND_OTP: '/resend-otp/',
  UPDATE_PROFILE: '/update-profile/',
  ROOMS: '/rooms/',
  CHAT: '/chat/',
  NOTIFICATIONS: '/notifications/',
  REVIEWS: '/reviews/',
  COMPLAINTS: '/complaints/',
  OWNER_TENANTS: '/owner/tenants/',
  OWNER_FINANCIALS: '/owner/financial/dashboard/',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email/:token',
  PROFILE: '/profile',
  VERIFICATION_REQUEST: '/verification-request',
  OWNER_DASHBOARD: '/owner/dashboard',
  OWNER_ROOMS: '/owner/rooms',
  OWNER_BOOKINGS: '/owner/bookings',
  OWNER_TENANTS: '/owner/tenants',
  OWNER_PAYMENTS: '/owner/payments',
  TENANT_DASHBOARD: '/tenant/dashboard',
  TENANT_SEARCH: '/tenant/search',
  TENANT_BOOKINGS: '/tenant/bookings',
  TENANT_PAYMENTS: '/tenant/payments',
  ROOM_DETAILS: '/room/:id',
  CHAT: '/chat',
  TENANT_COMPLAINTS: '/tenant/complaints',
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