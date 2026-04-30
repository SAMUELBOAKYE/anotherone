/**
 * API Endpoints Configuration
 * @version 2.0.0
 * @description Centralized API endpoint definitions for the KAAF University Noticeboard System
 */

export const API_VERSION = 'v1';
export const API_BASE = `/api/${API_VERSION}`;

export const API_ENDPOINTS = {
  // Authentication & Authorization
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    VERIFY_MFA: '/auth/verify-mfa',
    ENABLE_MFA: '/auth/enable-mfa',
    DISABLE_MFA: '/auth/disable-mfa',
    SOCIAL_LOGIN: (provider) => `/auth/social/${provider}`,
  },

  // User Management
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    SESSIONS: '/users/sessions',
    TERMINATE_SESSION: (sessionId) => `/users/sessions/${sessionId}`,
    TERMINATE_ALL_SESSIONS: '/users/sessions/terminate-all',
    GET_ALL: '/users',
    GET_BY_ID: (id) => `/users/${id}`,
    UPDATE_BY_ID: (id) => `/users/${id}`,
    DELETE_BY_ID: (id) => `/users/${id}`,
    UPDATE_ROLE: (id) => `/users/${id}/role`,
    UPDATE_STATUS: (id) => `/users/${id}/status`,
  },

  // Notice Management
  NOTICES: {
    GET_ALL: '/notices',
    GET_PUBLISHED: '/notices/published',
    GET_BY_ID: (id) => `/notices/${id}`,
    CREATE: '/notices',
    UPDATE: (id) => `/notices/${id}`,
    DELETE: (id) => `/notices/${id}`,
    PUBLISH: (id) => `/notices/${id}/publish`,
    ARCHIVE: (id) => `/notices/${id}/archive`,
    RESTORE: (id) => `/notices/${id}/restore`,
    INCREMENT_VIEWS: (id) => `/notices/${id}/views`,
    GET_BY_CATEGORY: (category) => `/notices/category/${category}`,
    GET_BY_PRIORITY: (priority) => `/notices/priority/${priority}`,
    SEARCH: '/notices/search',
    RSS_FEED: '/notices/rss',
  },

  // Event Management
  EVENTS: {
    GET_ALL: '/events',
    GET_UPCOMING: '/events/upcoming',
    GET_ONGOING: '/events/ongoing',
    GET_COMPLETED: '/events/completed',
    GET_BY_ID: (id) => `/events/${id}`,
    CREATE: '/events',
    UPDATE: (id) => `/events/${id}`,
    DELETE: (id) => `/events/${id}`,
    PUBLISH: (id) => `/events/${id}/publish`,
    CANCEL: (id) => `/events/${id}/cancel`,
    REGISTER: (id) => `/events/${id}/register`,
    CANCEL_REGISTRATION: (id) => `/events/${id}/cancel-registration`,
    CHECK_IN: (id, registrationId) => `/events/${id}/check-in/${registrationId}`,
    GET_REGISTRATIONS: (id) => `/events/${id}/registrations`,
    GET_MY_REGISTRATIONS: '/events/my-registrations',
    GENERATE_CERTIFICATE: (id, registrationId) => `/events/${id}/certificate/${registrationId}`,
    EXPORT_ATTENDEES: (id) => `/events/${id}/export-attendees`,
    GET_BY_TYPE: (type) => `/events/type/${type}`,
    SEARCH: '/events/search',
  },

  // Notifications
  NOTIFICATIONS: {
    GET_ALL: '/notifications',
    GET_UNREAD: '/notifications/unread',
    MARK_AS_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_AS_READ: '/notifications/read-all',
    DELETE: (id) => `/notifications/${id}`,
    DELETE_ALL: '/notifications/delete-all',
    PREFERENCES: '/notifications/preferences',
    UPDATE_PREFERENCES: '/notifications/preferences',
    SUBSCRIBE_PUSH: '/notifications/subscribe',
    UNSUBSCRIBE_PUSH: '/notifications/unsubscribe',
  },

  // Dashboard & Analytics
  DASHBOARD: {
    STATISTICS: '/dashboard/statistics',
    USER_STATS: '/dashboard/user-stats',
    NOTICE_STATS: '/dashboard/notice-stats',
    EVENT_STATS: '/dashboard/event-stats',
    ACTIVITY_LOG: '/dashboard/activity-log',
    RECENT_ACTIVITIES: '/dashboard/recent-activities',
    ANALYTICS: '/dashboard/analytics',
    EXPORT_DATA: '/dashboard/export',
  },

  // File Upload
  UPLOADS: {
    SINGLE: '/uploads',
    MULTIPLE: '/uploads/multiple',
    IMAGE: '/uploads/image',
    DOCUMENT: '/uploads/document',
    DELETE: (filename) => `/uploads/${filename}`,
    GET: (filename) => `/uploads/${filename}`,
  },

  // System & Health
  SYSTEM: {
    HEALTH: '/health',
    STATUS: '/status',
    CONFIG: '/config',
    INFO: '/info',
    METRICS: '/metrics',
  },
};

// Helper function to build URLs with query parameters
export const buildUrl = (endpoint, params = {}) => {
  const url = new URL(endpoint, window.location.origin);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.pathname + url.search;
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  return `${baseUrl}${endpoint}`;
};

export default API_ENDPOINTS;
