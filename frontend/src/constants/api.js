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
  ROOMS: '/rooms/', // Add this for room management
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  OWNER_DASHBOARD: '/owner/dashboard',    
  OWNER_ROOMS: '/owner/rooms',
  TENANT_DASHBOARD: '/tenant/dashboard',   
};