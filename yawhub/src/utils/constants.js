// src/utils/constants.js

/**
 * Application Constants
 * @module Constants
 * @description Centralized configuration and constants for the KAAF University Noticeboard
 * @version 2.0.0
 */

// ================================
// API Configuration
// ================================

/**
 * API Endpoints Configuration
 * @constant
 * @type {Object}
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh-token",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_EMAIL: "/auth/verify-email",
    CHANGE_PASSWORD: "/auth/change-password",
  },
  NOTICES: {
    BASE: "/notices",
    BY_ID: (id) => `/notices/${id}`,
    BY_CATEGORY: (category) => `/notices/category/${category}`,
    FEATURED: "/notices/featured",
    ARCHIVED: "/notices/archived",
    SEARCH: "/notices/search",
    PINNED: "/notices/pinned",
    BY_USER: "/notices/my-notices",
  },
  EVENTS: {
    BASE: "/events",
    BY_ID: (id) => `/events/${id}`,
    UPCOMING: "/events/upcoming",
    PAST: "/events/past",
    REGISTER: (id) => `/events/${id}/register`,
    MY_REGISTRATIONS: "/events/registrations/my",
    CANCEL_REGISTRATION: (id) => `/events/registrations/${id}/cancel`,
    CALENDAR: "/events/calendar",
  },
  USERS: {
    BASE: "/users",
    BY_ID: (id) => `/users/${id}`,
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    CHANGE_PASSWORD: "/users/change-password",
    UPDATE_PREFERENCES: "/users/preferences",
    DEACTIVATE: "/users/deactivate",
    UPLOAD_AVATAR: "/users/avatar",
    NOTIFICATION_SETTINGS: "/users/notification-settings",
  },
  NOTIFICATIONS: {
    BASE: "/notifications",
    BY_ID: (id) => `/notifications/${id}`,
    UNREAD_COUNT: "/notifications/unread/count",
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: "/notifications/mark-all-read",
    PREFERENCES: "/notifications/preferences",
    SUBSCRIBE: "/notifications/subscribe",
    UNSUBSCRIBE: "/notifications/unsubscribe",
  },
  ANALYTICS: {
    BASE: "/analytics",
    DASHBOARD: "/analytics/dashboard",
    NOTICE_STATS: "/analytics/notices",
    USER_STATS: "/analytics/users",
    ENGAGEMENT: "/analytics/engagement",
    EXPORT: "/analytics/export",
  },
  ADMIN: {
    BASE: "/admin",
    USERS: "/admin/users",
    REPORTS: "/admin/reports",
    SYSTEM_STATUS: "/admin/system-status",
    BACKUP: "/admin/backup",
    CLEAR_CACHE: "/admin/clear-cache",
  },
  UPLOADS: {
    BASE: "/uploads",
    IMAGE: "/uploads/image",
    DOCUMENT: "/uploads/document",
    AVATAR: "/uploads/avatar",
    DELETE: "/uploads/delete",
  },
};

// ================================
// Application Configuration
// ================================

/**
 * Application Metadata
 * @constant
 * @type {Object}
 */
export const APP_CONFIG = {
  NAME: "KAAF University Noticeboard",
  SHORT_NAME: "KAAF Noticeboard",
  VERSION: "2.0.0",
  DESCRIPTION:
    "Centralized noticeboard and event management system for KAAF University College",
  AUTHOR: "KAAF University IT Department",
  YEAR: new Date().getFullYear(),
  DOMAIN: "kaafuniversity.edu.gh",
  SUPPORT_EMAIL: "support@kaafuniversity.edu.gh",
  NOREPLY_EMAIL: "noreply@kaafuniversity.edu.gh",
  API_VERSION: "v1",
  API_PREFIX: "/api/v1",
};

/**
 * API Configuration
 * @constant
 * @type {Object}
 */
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  CACHE_TTL: 300000, // 5 minutes
  MAX_PAYLOAD_SIZE: 5 * 1024 * 1024, // 5MB
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    TIME_WINDOW: 60000, // 1 minute
  },
};

// ================================
// Authentication & Security
// ================================

/**
 * Authentication Configuration
 * @constant
 * @type {Object}
 */
export const AUTH_CONFIG = {
  TOKEN_KEY: "access_token",
  REFRESH_TOKEN_KEY: "refresh_token",
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_PATTERN:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

/**
 * Storage Keys
 * @constant
 * @type {Object}
 */
export const STORAGE_KEYS = {
  TOKEN: "kaaf_auth_token",
  REFRESH_TOKEN: "kaaf_refresh_token",
  USER: "kaaf_user_data",
  THEME: "kaaf_theme_preference",
  LANGUAGE: "kaaf_language",
  NOTIFICATIONS: "kaaf_notifications",
  PREFERENCES: "kaaf_user_preferences",
  LAST_VISIT: "kaaf_last_visit",
  SESSION_ID: "kaaf_session_id",
  DEVICE_ID: "kaaf_device_id",
};

// ================================
// UI Configuration
// ================================

/**
 * Theme Configuration
 * @constant
 * @type {Object}
 */
export const THEME_CONFIG = {
  DEFAULT_THEME: "light",
  AVAILABLE_THEMES: ["light", "dark", "system"],
  COLOR_SCHEMES: {
    light: {
      primary: "#1976d2",
      secondary: "#dc004e",
      background: "#ffffff",
      surface: "#f5f5f5",
      error: "#f44336",
      warning: "#ff9800",
      info: "#2196f3",
      success: "#4caf50",
    },
    dark: {
      primary: "#90caf9",
      secondary: "#f48fb1",
      background: "#121212",
      surface: "#1e1e1e",
      error: "#f44336",
      warning: "#ff9800",
      info: "#2196f3",
      success: "#4caf50",
    },
  },
};

/**
 * Pagination Configuration
 * @constant
 * @type {Object}
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  LIMITS: [10, 20, 30, 50, 100],
  OFFSET_LIMIT: 1000,
};

// ================================
// Domain Models
// ================================

/**
 * Notice Categories
 * @constant
 * @type {Object}
 */
export const NOTICE_CATEGORIES = {
  ACADEMIC: {
    id: "academic",
    label: "Academic",
    icon: "📚",
    color: "#2196f3",
    description: "Academic notices, schedules, and announcements",
  },
  ADMINISTRATIVE: {
    id: "administrative",
    label: "Administrative",
    icon: "📋",
    color: "#4caf50",
    description: "Administrative updates and official communications",
  },
  EVENT: {
    id: "event",
    label: "Events",
    icon: "🎉",
    color: "#ff9800",
    description: "Campus events, workshops, and seminars",
  },
  ANNOUNCEMENT: {
    id: "announcement",
    label: "Announcements",
    icon: "📢",
    color: "#9c27b0",
    description: "General announcements and news",
  },
  EXAMINATION: {
    id: "examination",
    label: "Examinations",
    icon: "📝",
    color: "#f44336",
    description: "Exam schedules, results, and guidelines",
  },
  SCHOLARSHIP: {
    id: "scholarship",
    label: "Scholarships",
    icon: "💰",
    color: "#ffc107",
    description: "Scholarship opportunities and applications",
  },
  JOB: {
    id: "job",
    label: "Jobs & Careers",
    icon: "💼",
    color: "#795548",
    description: "Job postings and career opportunities",
  },
  LIBRARY: {
    id: "library",
    label: "Library",
    icon: "📖",
    color: "#607d8b",
    description: "Library updates and resources",
  },
};

/**
 * User Roles
 * @constant
 * @type {Object}
 */
export const USER_ROLES = {
  STUDENT: {
    id: "student",
    label: "Student",
    level: 1,
    permissions: ["view_notices", "view_events", "register_events"],
  },
  STAFF: {
    id: "staff",
    label: "Staff",
    level: 2,
    permissions: [
      "view_notices",
      "view_events",
      "register_events",
      "create_notices",
      "manage_events",
    ],
  },
  ADMIN: {
    id: "admin",
    label: "Administrator",
    level: 3,
    permissions: ["*"], // All permissions
  },
  SUPER_ADMIN: {
    id: "super_admin",
    label: "Super Administrator",
    level: 4,
    permissions: ["*"],
  },
};

/**
 * Notice Priorities
 * @constant
 * @type {Object}
 */
export const NOTICE_PRIORITIES = {
  LOW: {
    id: "low",
    label: "Low",
    color: "#4caf50",
    icon: "🔵",
  },
  MEDIUM: {
    id: "medium",
    label: "Medium",
    color: "#ff9800",
    icon: "🟠",
  },
  HIGH: {
    id: "high",
    label: "High",
    color: "#f44336",
    icon: "🔴",
  },
  URGENT: {
    id: "urgent",
    label: "Urgent",
    color: "#9c27b0",
    icon: "⚠️",
  },
};

// ================================
// Date & Time Configuration
// ================================

/**
 * Date Formats
 * @constant
 * @type {Object}
 */
export const DATE_FORMATS = {
  FULL: "EEEE, MMMM d, yyyy",
  LONG: "MMMM d, yyyy",
  MEDIUM: "MMM d, yyyy",
  SHORT: "MM/dd/yyyy",
  DATE_TIME: "MMM d, yyyy h:mm a",
  TIME: "h:mm a",
  TIME_24H: "HH:mm",
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  API: "yyyy-MM-dd",
  DISPLAY: "MMMM dd, yyyy",
  RELATIVE: "relative",
};

/**
 * Time Constants (in milliseconds)
 * @constant
 * @type {Object}
 */
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
};

// ================================
// Notification Configuration
// ================================

/**
 * Notification Types
 * @constant
 * @type {Object}
 */
export const NOTIFICATION_TYPES = {
  INFO: {
    id: "info",
    label: "Information",
    icon: "ℹ️",
    color: "#2196f3",
  },
  SUCCESS: {
    id: "success",
    label: "Success",
    icon: "✅",
    color: "#4caf50",
  },
  WARNING: {
    id: "warning",
    label: "Warning",
    icon: "⚠️",
    color: "#ff9800",
  },
  ERROR: {
    id: "error",
    label: "Error",
    icon: "❌",
    color: "#f44336",
  },
};

/**
 * Notification Settings
 * @constant
 * @type {Object}
 */
export const NOTIFICATION_SETTINGS = {
  DEFAULT_DURATION: 5000,
  MAX_STACK: 5,
  SOUND_ENABLED: true,
  DESKTOP_NOTIFICATIONS: true,
  POLLING_INTERVAL: 30000, // 30 seconds
  WEBSOCKET_RECONNECT_DELAY: 3000,
  WEBSOCKET_MAX_RECONNECT_ATTEMPTS: 5,
};

// ================================
// Validation Rules
// ================================

/**
 * Validation Patterns
 * @constant
 * @type {Object}
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\+?[0-9]{10,15}$/,
  STUDENT_ID: /^[A-Z]{2}[0-9]{6}$/,
  STAFF_ID: /^[A-Z]{3}[0-9]{4}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
  NAME: /^[a-zA-Z\s]{2,50}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
};

/**
 * Validation Limits
 * @constant
 * @type {Object}
 */
export const VALIDATION_LIMITS = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 50,
  MAX_BIO_LENGTH: 500,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_COMMENT_LENGTH: 1000,
  MAX_TAGS: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

// ================================
// HTTP Status Codes
// ================================

/**
 * HTTP Status Codes
 * @constant
 * @type {Object}
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Error Messages
 * @constant
 * @type {Object}
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNAUTHORIZED: "Please log in to continue.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later.",
  FILE_TOO_LARGE: "File size exceeds the maximum limit.",
  INVALID_FILE_TYPE: "File type is not supported.",
  // Auth specific
  INVALID_CREDENTIALS: "Invalid email or password.",
  ACCOUNT_LOCKED: "Account is locked. Please contact support.",
  EMAIL_NOT_VERIFIED: "Please verify your email address.",
  PASSWORD_WEAK: "Password does not meet security requirements.",
};

// ================================
// Feature Flags
// ================================

/**
 * Feature Flags for gradual rollout
 * @constant
 * @type {Object}
 */
export const FEATURES = {
  ENABLE_WEBSOCKET: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_SOCIAL_SHARE: true,
  ENABLE_COMMENTS: true,
  ENABLE_RATINGS: true,
  ENABLE_SEARCH: true,
  ENABLE_EXPORT: true,
  ENABLE_BACKUP: true,
  ENABLE_AUDIT_LOG: true,
};

// ================================
// Environment Configuration
// ================================

/**
 * Environment Variables
 * @constant
 * @type {Object}
 */
export const ENV = {
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production",
  TEST: "test",
  CURRENT: import.meta.env.MODE || "development",
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  WS_URL: import.meta.env.VITE_WS_URL || "ws://localhost:5000",
  APP_URL: import.meta.env.VITE_APP_URL || "http://localhost:5173",
};

// ================================
// Helper Functions
// ================================

/**
 * Get category by ID
 * @param {string} id - Category ID
 * @returns {Object|null} Category object or null
 */
export const getCategoryById = (id) => {
  return NOTICE_CATEGORIES[id] || null;
};

/**
 * Get role by ID
 * @param {string} id - Role ID
 * @returns {Object|null} Role object or null
 */
export const getRoleById = (id) => {
  return USER_ROLES[id] || null;
};

/**
 * Check if user has permission
 * @param {string} role - User role
 * @param {string} permission - Required permission
 * @returns {boolean} Has permission or not
 */
export const hasPermission = (role, permission) => {
  const roleConfig = USER_ROLES[role];
  if (!roleConfig) return false;
  return (
    roleConfig.permissions.includes("*") ||
    roleConfig.permissions.includes(permission)
  );
};

/**
 * Get all categories as array
 * @returns {Array} Array of categories
 */
export const getCategoriesArray = () => {
  return Object.values(NOTICE_CATEGORIES);
};

/**
 * Get all roles as array
 * @returns {Array} Array of roles
 */
export const getRolesArray = () => {
  return Object.values(USER_ROLES);
};

// ================================
// Default Export
// ================================

export default {
  API_ENDPOINTS,
  APP_CONFIG,
  API_CONFIG,
  AUTH_CONFIG,
  STORAGE_KEYS,
  THEME_CONFIG,
  PAGINATION,
  NOTICE_CATEGORIES,
  USER_ROLES,
  NOTICE_PRIORITIES,
  DATE_FORMATS,
  TIME_CONSTANTS,
  NOTIFICATION_TYPES,
  NOTIFICATION_SETTINGS,
  VALIDATION_PATTERNS,
  VALIDATION_LIMITS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  FEATURES,
  ENV,
  getCategoryById,
  getRoleById,
  hasPermission,
  getCategoriesArray,
  getRolesArray,
};
