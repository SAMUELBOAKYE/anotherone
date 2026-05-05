// backend/config/constants.js
// KAAF University Noticeboard System Constants
// Centralized constants for the entire application
// @version 2.4.0 - Added Admin Notification Types and enhanced notification constants

"use strict";

// ============================================================
// HTTP STATUS CODES
// ============================================================

const HTTP_STATUS = {
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
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// ============================================================
// USER MANAGEMENT
// ============================================================

const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  FACULTY: "faculty",
  STAFF: "staff",
  STUDENT: "student",
  GUEST: "guest",
};

const USER_ROLE_HIERARCHY = {
  [USER_ROLES.SUPER_ADMIN]: 5,
  [USER_ROLES.ADMIN]: 4,
  [USER_ROLES.FACULTY]: 3,
  [USER_ROLES.STAFF]: 2,
  [USER_ROLES.STUDENT]: 1,
  [USER_ROLES.GUEST]: 0,
};

const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  SUSPENDED: "suspended",
  BLOCKED: "blocked",
  BANNED: "banned",
  DELETED: "deleted",
};

const USER_VERIFICATION = {
  VERIFIED: "verified",
  UNVERIFIED: "unverified",
  PENDING: "pending",
};

// ============================================================
// NOTICE MANAGEMENT
// ============================================================

const NOTICE_CATEGORIES = {
  ACADEMIC: "academic",
  ADMINISTRATIVE: "administrative",
  EVENT: "event",
  EMERGENCY: "emergency",
  GENERAL: "general",
  ANNOUNCEMENT: "announcement",
};

const NOTICE_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

const NOTICE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  DELETED: "deleted",
};

// Alias for backward compatibility
const NOTICE_PRIORITY = NOTICE_PRIORITIES;
const NOTICE_TYPES = NOTICE_CATEGORIES;

// ============================================================
// EVENT MANAGEMENT
// ============================================================

const EVENT_TYPES = {
  ACADEMIC: "academic",
  CULTURAL: "cultural",
  SPORTS: "sports",
  SEMINAR: "seminar",
  WORKSHOP: "workshop",
  SOCIAL: "social",
};

const EVENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  POSTPONED: "postponed",
};

const EVENT_PARTICIPATION = {
  ONLINE: "online",
  OFFLINE: "offline",
  HYBRID: "hybrid",
};

// ============================================================
// REGISTRATION MANAGEMENT
// ============================================================

const REGISTRATION_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  REGISTERED: "registered",
  WAITLISTED: "waitlisted",
  CHECKED_IN: "checked_in",
  CANCELLED: "cancelled",
  ATTENDED: "attended",
  NO_SHOW: "no_show",
};

const REGISTRATION_METHOD = {
  SELF: "self",
  ADMIN: "admin",
  BULK_IMPORT: "bulk_import",
};

const CHECKIN_METHOD = {
  QR_CODE: "qr_code",
  MANUAL: "manual",
  SELF: "self",
};

const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  REFUNDED: "refunded",
  WAIVED: "waived",
};

const PAYMENT_METHOD = {
  CASH: "cash",
  CARD: "card",
  MOBILE_MONEY: "mobile_money",
  BANK_TRANSFER: "bank_transfer",
  ONLINE: "online",
};

// ============================================================
// DEPARTMENT MANAGEMENT
// ============================================================

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Engineering",
  "Business Administration",
  "Health Sciences",
  "Law",
  "Arts",
  "Sciences",
  "Academic Affairs",
  "Student Affairs",
  "Finance",
  "Human Resources",
  "Administration",
  "General",
];

const DEPARTMENT_CODES = {
  "Computer Science": "CS",
  "Information Technology": "IT",
  Engineering: "ENG",
  "Business Administration": "BUS",
  "Health Sciences": "HS",
  Law: "LAW",
  Arts: "ART",
  Sciences: "SCI",
  "Academic Affairs": "AA",
  "Student Affairs": "SA",
  Finance: "FIN",
  "Human Resources": "HR",
  Administration: "ADM",
  General: "GEN",
};

// ============================================================
// NOTIFICATION TYPES & CHANNELS (ENHANCED)
// ============================================================

// Admin Notification Types for manual/admin-initiated notifications
const ADMIN_NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  SYSTEM: "system",
  NOTICE: "notice",
  EVENT: "event",
  REMINDER: "reminder",
  ALERT: "alert",
  PROMOTION: "promotion",
  MAINTENANCE: "maintenance",
  UPDATE: "update",
  SECURITY: "security",
  POLICY: "policy",
  HOLIDAY: "holiday",
};

// Admin Notification Audiences
const ADMIN_NOTIFICATION_AUDIENCES = {
  ALL: "all",
  STUDENTS: "students",
  STAFF: "staff",
  ADMINS: "admins",
  SPECIFIC: "specific",
  FACULTY: "faculty",
  SUPER_ADMINS: "super_admins",
};

// Admin Notification Priorities
const ADMIN_NOTIFICATION_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
  CRITICAL: "critical",
};

// Delivery Channels
const DELIVERY_CHANNELS = {
  IN_APP: "inApp",
  EMAIL: "email",
  PUSH: "push",
  SMS: "sms",
  WEBHOOK: "webhook",
};

// Delivery Statuses
const DELIVERY_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
  BOUNCED: "bounced",
  BLOCKED: "blocked",
};

// System Notification Types (auto-generated by system)
const SYSTEM_NOTIFICATION_TYPES = {
  // Notice related
  NOTICE_CREATED: "notice_created",
  NOTICE_UPDATED: "notice_updated",
  NEW_NOTICE: "new_notice",

  // Event related
  EVENT_CREATED: "event_created",
  EVENT_REMINDER: "event_reminder",
  EVENT_UPDATE: "event_update",
  EVENT_CANCELLED: "event_cancelled",

  // Registration related
  REGISTRATION_CONFIRMED: "registration_confirmed",
  REGISTRATION_CONFIRMATION: "registration_confirmation",
  CHECKIN_CONFIRMATION: "checkin_confirmation",
  CERTIFICATE_AVAILABLE: "certificate_available",
  WAITLIST_PROMOTION: "waitlist_promotion",

  // Account related
  ACCOUNT_VERIFIED: "account_verified",
  ACCOUNT_VERIFICATION: "account_verification",
  ACCOUNT_APPROVED: "account_approved",
  ACCOUNT_REJECTED: "account_rejected",
  ACCOUNT_LOCKED: "account_locked",
  ACCOUNT_UNLOCKED: "account_unlocked",

  // Authentication related
  PASSWORD_CHANGED: "password_changed",
  PASSWORD_RESET: "password_reset",
  TWO_FACTOR_CODE: "two_factor_code",

  // System related
  SYSTEM_ALERT: "system_alert",
  SYSTEM_MAINTENANCE: "system_maintenance",
  BACKUP_COMPLETED: "backup_completed",
  BACKUP_FAILED: "backup_failed",

  // Interaction related
  COMMENT_REPLY: "comment_reply",
  MENTION: "mention",
  APPROVAL: "approval",
  REJECTION: "rejection",
};

// Combine all notification types
const NOTIFICATION_TYPES = {
  ...ADMIN_NOTIFICATION_TYPES,
  ...SYSTEM_NOTIFICATION_TYPES,
};

const NOTIFICATION_CHANNELS = {
  EMAIL: "email",
  SMS: "sms",
  PUSH: "push",
  IN_APP: "in_app",
};

// ============================================================
// AUDIT LOG ACTIONS
// ============================================================

const AUDIT_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  VIEW: "view",
  LOGIN: "login",
  LOGOUT: "logout",
  EXPORT: "export",
  IMPORT: "import",
  SEND_NOTIFICATION: "send_notification",
  BULK_SEND: "bulk_send",
  SCHEDULE_NOTIFICATION: "schedule_notification",
  RESEND_NOTIFICATION: "resend_notification",
};

// ============================================================
// FILE TYPES & MAX SIZES
// ============================================================

const FILE_TYPES = {
  IMAGE: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  DOCUMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  VIDEO: ["video/mp4", "video/webm", "video/quicktime"],
  AUDIO: ["audio/mpeg", "audio/wav", "audio/ogg"],
};

const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  AUDIO: 20 * 1024 * 1024, // 20MB
  AVATAR: 2 * 1024 * 1024, // 2MB
};

// ============================================================
// UPLOAD SETTINGS (Detailed)
// ============================================================

const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_TOTAL_SIZE: 25 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: FILE_TYPES.IMAGE,
  ALLOWED_DOCUMENT_TYPES: FILE_TYPES.DOCUMENT,
  ALLOWED_VIDEO_TYPES: FILE_TYPES.VIDEO,
  ALLOWED_AVATAR_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_ID_CARD_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
  EVENT_POSTER_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  EVENT_POSTER_MAX_SIZE: 5 * 1024 * 1024,
  EVENT_GALLERY_MAX_FILES: 20,
  EVENT_GALLERY_MAX_SIZE: 2 * 1024 * 1024,
  CERTIFICATE_TYPES: ["application/pdf"],
  CERTIFICATE_MAX_SIZE: 2 * 1024 * 1024,
  ID_CARD_MAX_SIZE: 3 * 1024 * 1024,
  MAX_FILES_PER_UPLOAD: 5,
  MAX_IMAGE_WIDTH: 4096,
  MAX_IMAGE_HEIGHT: 4096,
  MAX_AVATAR_SIZE: 2 * 1024 * 1024,
  AVATAR_DIMENSIONS: {
    width: 500,
    height: 500,
  },
  PATHS: {
    NOTICES: "uploads/notices",
    EVENTS: "uploads/events",
    PROFILES: "uploads/profiles",
    AVATARS: "uploads/avatars",
    CERTIFICATES: "uploads/certificates",
    ID_CARDS: "uploads/id-cards",
    TEMP: "uploads/temp",
  },
};

// ============================================================
// PAGINATION DEFAULTS
// ============================================================

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
};

const SORT_ORDERS = {
  ASC: 1,
  DESC: -1,
};

const FILTER_OPERATORS = {
  EQ: "eq",
  NE: "ne",
  GT: "gt",
  GTE: "gte",
  LT: "lt",
  LTE: "lte",
  IN: "in",
  NIN: "nin",
  LIKE: "like",
};

// ============================================================
// TOKEN EXPIRY (in seconds)
// ============================================================

const TOKEN_EXPIRY = {
  ACCESS: 15 * 60, // 15 minutes (in seconds)
  REFRESH: 7 * 24 * 60 * 60, // 7 days
  EMAIL_VERIFICATION: 24 * 60 * 60, // 24 hours
  PASSWORD_RESET: 60 * 60, // 1 hour
  VERIFICATION_CODE: 10 * 60, // 10 minutes
};

// ============================================================
// JWT CONFIGURATION
// ============================================================

const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
  RESET_TOKEN_EXPIRY: "1h",
  VERIFY_TOKEN_EXPIRY: "24h",
  ISSUER: process.env.JWT_ISSUER || "kaaf-noticeboard",
  AUDIENCE: process.env.JWT_AUDIENCE || "kaaf-university",
};

// ============================================================
// CACHE CONFIGURATION
// ============================================================

const CACHE_KEYS = {
  NOTICES: "notices",
  EVENTS: "events",
  USERS: "users",
  STATISTICS: "statistics",
  SESSIONS: "sessions",
  RATE_LIMIT: "rate_limit",
  REGISTRATIONS: "registrations",
  VERIFICATION_CODES: "verification_codes",
  PASSWORD_RESET: "password_reset",
  NOTIFICATIONS: "notifications",
  ADMIN_NOTIFICATIONS: "admin_notifications",
  NOTIFICATION_STATS: "notification_stats",
};

const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours

  // Specific cache durations
  NOTICES: 300,
  EVENTS: 600,
  USERS: 1800,
  STATISTICS: 3600,
  SESSIONS: 7200,
  RATE_LIMIT: 60,
  REGISTRATIONS: 300,
  VERIFICATION_CODES: 600,
  PASSWORD_RESET: 3600,
  NOTIFICATIONS: 300,
  NOTIFICATION_STATS: 600,
};

// ============================================================
// RATE LIMIT DEFAULTS
// ============================================================

const RATE_LIMITS = {
  GLOBAL: { windowMs: 60 * 1000, max: 100 },
  AUTH: { windowMs: 15 * 60 * 1000, max: 5 },
  API: { windowMs: 60 * 1000, max: 200 },
  ADMIN: { windowMs: 60 * 1000, max: 50 },
};

const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000,
  MAX_REQUESTS: 100,
  SKIP_SUCCESSFUL_REQUESTS: false,
  STANDARD_HEADERS: true,
  LEGACY_HEADERS: false,
  AUTH: {
    LOGIN: { windowMs: 15 * 60 * 1000, max: 5 },
    REGISTER: { windowMs: 60 * 60 * 1000, max: 3 },
    PASSWORD_RESET: { windowMs: 60 * 60 * 1000, max: 3 },
    VERIFICATION: { windowMs: 60 * 60 * 1000, max: 10 },
  },
  REGISTRATION: {
    CREATE: { windowMs: 60 * 60 * 1000, max: 10 },
    CHECKIN: { windowMs: 60 * 60 * 1000, max: 30 },
  },
  NOTIFICATIONS: {
    SEND: { windowMs: 60 * 1000, max: 20 }, // 20 notifications per minute per admin
    BULK_SEND: { windowMs: 60 * 60 * 1000, max: 5 }, // 5 bulk sends per hour
    RESEND: { windowMs: 60 * 1000, max: 10 }, // 10 resends per minute
  },
};

// ============================================================
// DATE & TIME FORMATS
// ============================================================

const DATE_FORMATS = {
  DEFAULT: "YYYY-MM-DD HH:mm:ss",
  DISPLAY: "MMMM DD, YYYY",
  DISPLAY_WITH_TIME: "MMMM DD, YYYY HH:mm",
  API: "YYYY-MM-DD",
  TIME: "HH:mm",
  ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ",
  SHORT: "MM/DD/YYYY",
  DATETIME_LOCAL: "YYYY-MM-DDTHH:mm",
};

// ============================================================
// ID CARD VERIFICATION SETTINGS
// ============================================================

const ID_VERIFICATION = {
  // Master switch - set to false to disable all ID verification
  ENABLED: process.env.NODE_ENV === "production" ? true : false,

  // Development mode settings
  DEVELOPMENT: {
    SKIP_VERIFICATION: true,
    AUTO_APPROVE: true,
    MOCK_VALID_ID: true,
    ALLOW_TEST_IDS: true,
  },

  // Production mode settings
  PRODUCTION: {
    REQUIRED: true,
    STRICT_MODE: true,
    AI_VALIDATION: true,
    MANUAL_REVIEW_THRESHOLD: 0.7,
  },

  // AI/ML Validation settings
  AI_VALIDATION: {
    ENABLED: process.env.NODE_ENV === "production" ? true : false,
    CONFIDENCE_THRESHOLD: 0.75,
    FEATURES: ["text_detection", "logo_detection", "template_matching"],
  },

  // Manual review settings
  MANUAL_REVIEW: {
    REQUIRED_FOR_LOW_CONFIDENCE: true,
    REVIEW_TIMEOUT_HOURS: 48,
    NOTIFY_ADMIN_ON_REVIEW: true,
  },

  // Accepted ID types
  ACCEPTED_ID_TYPES: ["student_id", "faculty_id", "staff_id"],

  // Required fields to detect
  REQUIRED_FIELDS: ["name", "id_number", "institution_name"],

  // Institution names to look for
  INSTITUTION_NAMES: ["KAAF University", "KAAF", "KAAF University College"],

  // Student ID pattern validation
  STUDENT_ID_PATTERN: /^KAAF\/\d{4}\/(STU|FAC|ADM)\/\d{5}$/,

  // Test IDs that are automatically accepted (development only)
  TEST_IDS: [
    "KAAF/2026/STU/00001",
    "KAAF/2026/STU/12345",
    "KAAF/2026/FAC/00001",
    "KAAF/2026/ADM/00001",
  ],

  // Error messages
  ERRORS: {
    INVALID_FORMAT: "Invalid ID card format. Please upload a clear image.",
    NO_TEXT_DETECTED:
      "No text detected. Please ensure the ID card is clearly visible.",
    WRONG_INSTITUTION: "This does not appear to be a KAAF University ID card.",
    MISSING_FIELDS: "Required information missing from ID card.",
    LOW_QUALITY: "Image quality too low. Please take a clearer photo.",
    EXCEEDS_MAX_SIZE: `ID card image exceeds maximum size of ${MAX_FILE_SIZES.IMAGE / (1024 * 1024)}MB`,
  },
};

// ============================================================
// VALIDATION RULES
// ============================================================

const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 100,
  PASSWORD_PATTERN:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  NAME_PATTERN: /^[a-zA-Z\s\-']+$/,
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 5000,
  SUMMARY_MAX_LENGTH: 500,
  TAGS_MAX_COUNT: 10,
  MAX_COMMENT_LENGTH: 1000,
  EVENT_TITLE_MIN_LENGTH: 5,
  EVENT_TITLE_MAX_LENGTH: 200,
  EVENT_DESCRIPTION_MIN_LENGTH: 10,
  EVENT_DESCRIPTION_MAX_LENGTH: 5000,
  EVENT_SUMMARY_MAX_LENGTH: 500,
  EVENT_TAGS_MAX_COUNT: 10,
  EVENT_MAX_CAPACITY: 10000,
  EVENT_MIN_CAPACITY: 1,
  EVENT_MAX_FEE: 10000,
  MAX_WAITLIST_SIZE: 500,
  CHECKIN_WINDOW_HOURS: 2,
  EMAIL_MAX_LENGTH: 254,
  EMAIL_PATTERN: /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/,
  ALLOWED_EMAIL_DOMAINS: [
    "kaaf.edu.gh",
    "student.kaaf.edu.gh",
    "staff.kaaf.edu.gh",
    "gmail.com",
    "yahoo.com",
  ],
  PHONE_PATTERN: /^\+?[\d\s-]{10,}$/,
  STUDENT_ID_PATTERN: ID_VERIFICATION.STUDENT_ID_PATTERN,
  MAX_FUTURE_DATE_DAYS: 365,
  MAX_PAST_DATE_DAYS: 30,
  MAX_LOGIN_ATTEMPTS: 10,
  ACCOUNT_LOCK_DURATION: 30 * 60 * 1000,
  PASSWORD_RESET_MAX_ATTEMPTS: 5,
  PASSWORD_RESET_LOCK_DURATION: 60 * 60 * 1000,
  EMAIL_VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60 * 1000,
  EMAIL_RESET_TOKEN_EXPIRY: 60 * 60 * 1000,
  VERIFICATION_CODE_EXPIRY: 10 * 60 * 1000,
  VERIFICATION_CODE_LENGTH: 6,
  MAX_VERIFICATION_ATTEMPTS: 5,
  VERIFICATION_ATTEMPT_LOCKOUT: 30 * 60 * 1000,
  DEPARTMENTS: DEPARTMENTS,

  // Notification specific validation
  NOTIFICATION_TITLE_MAX_LENGTH: 100,
  NOTIFICATION_MESSAGE_MAX_LENGTH: 500,
  NOTIFICATION_MAX_BATCH_SIZE: 1000,

  // ID Verification specific validation
  ID_VERIFICATION: {
    REQUIRED: process.env.NODE_ENV === "production" ? true : false,
    STRICT_MODE: process.env.NODE_ENV === "production" ? true : false,
    AI_CHECK_ENABLED: process.env.NODE_ENV === "production" ? true : false,
    MANUAL_OVERRIDE_ALLOWED: true,
    SKIP_FOR_TEST_IDS: true,
    ALLOWED_FILE_TYPES: UPLOAD.ALLOWED_ID_CARD_TYPES,
    MAX_FILE_SIZE: MAX_FILE_SIZES.IMAGE,
  },
};

// ============================================================
// VERIFICATION SETTINGS
// ============================================================

const VERIFICATION = {
  CODE_LENGTH: 6,
  CODE_EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
  RESEND_COOLDOWN_SECONDS: 60,
};

// ============================================================
// USER PREFERENCES
// ============================================================

const USER_PREFERENCES = {
  THEMES: ["light", "dark", "system"],
  LANGUAGES: ["en", "fr", "es", "zh"],
  NOTIFICATION_CHANNELS: ["email", "push", "sms"],
  DEFAULT_NOTIFICATIONS: {
    email: true,
    push: true,
    sms: false,
  },
};

// ============================================================
// LOGGING CONFIGURATION
// ============================================================

const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  HTTP: "http",
  VERBOSE: "verbose",
  DEBUG: "debug",
  SILLY: "silly",
};

// ============================================================
// API RESPONSE MESSAGES (UPDATED)
// ============================================================

const MESSAGES = {
  SUCCESS: {
    CREATED: "Resource created successfully",
    UPDATED: "Resource updated successfully",
    DELETED: "Resource deleted successfully",
    FETCHED: "Resource fetched successfully",
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESS: "Logout successful",
    REGISTRATION_SUCCESS: "Registration successful",
    CHECKIN_SUCCESS: "Check-in successful",
    CERTIFICATE_ISSUED: "Certificate issued successfully",
    ACCOUNT_VERIFIED: "Account verified successfully",
    APPROVED: "Account approved successfully",
    REJECTED: "Account rejected successfully",
    ID_VERIFIED: "ID card verified successfully",
    ID_UPLOADED: "ID card uploaded successfully",
    // Notification specific
    NOTIFICATION_SENT: "Notification sent successfully",
    NOTIFICATION_SCHEDULED: "Notification scheduled successfully",
    NOTIFICATION_DELETED: "Notification deleted successfully",
    NOTIFICATION_RESENT: "Notification resent successfully",
    BULK_NOTIFICATION_SENT: "Bulk notifications sent successfully",
  },
  ERROR: {
    NOT_FOUND: "Resource not found",
    UNAUTHORIZED: "Unauthorized access - Please login",
    FORBIDDEN: "Access forbidden - Insufficient permissions",
    VALIDATION: "Validation error - Please check your input",
    SERVER: "Internal server error - Please try again later",
    DUPLICATE: "Duplicate entry - Resource already exists",
    RATE_LIMIT: "Too many requests - Please slow down",
    INVALID_CREDENTIALS: "Invalid email or password",
    ACCOUNT_LOCKED: "Account is locked due to too many failed attempts",
    ACCOUNT_INACTIVE: "Account is inactive. Please contact administrator",
    ACCOUNT_SUSPENDED: "Account has been suspended",
    EMAIL_NOT_VERIFIED: "Please verify your email address first",
    REGISTRATION_CLOSED: "Registration is closed for this event",
    EVENT_FULL: "Event has reached maximum capacity",
    ALREADY_REGISTERED: "User is already registered for this event",
    ALREADY_CHECKED_IN: "User has already checked in",
    CERTIFICATE_ALREADY_ISSUED:
      "Certificate already issued for this registration",
    TOKEN_EXPIRED: "Token expired. Please login again",
    TOKEN_INVALID: "Invalid token",
    PASSWORD_CHANGED: "Password recently changed. Please login again",
    ACCOUNT_DELETED: "Account has been deleted",
    ACCOUNT_PENDING: "Your account is pending approval",
    FILE_TOO_LARGE: "File too large. Maximum size is 5MB",
    TOO_MANY_FILES: "Too many files uploaded",
    UNEXPECTED_FILE: "Unexpected file field",
    UPLOAD_ERROR: "Error uploading file",
    INVALID_ID: "Invalid ID format",
    DUPLICATE_KEY: "Duplicate entry",
    INVALID_VERIFICATION_CODE: "Invalid or expired verification code",
    VERIFICATION_FAILED: "Account verification failed",
    APPROVAL_REQUIRED: "Account requires approval before login",
    // Notification specific
    NOTIFICATION_FAILED: "Failed to send notification",
    INVALID_AUDIENCE: "Invalid audience specified",
    NO_USERS_FOUND: "No users found for the selected audience",
    NOTIFICATION_EXPIRED: "Notification has expired",
    SCHEDULED_DATE_INVALID: "Scheduled date must be in the future",
    // ID Verification specific errors
    ID_VERIFICATION_FAILED: ID_VERIFICATION.ERRORS.INVALID_FORMAT,
    ID_NO_TEXT: ID_VERIFICATION.ERRORS.NO_TEXT_DETECTED,
    ID_WRONG_INSTITUTION: ID_VERIFICATION.ERRORS.WRONG_INSTITUTION,
    ID_MISSING_FIELDS: ID_VERIFICATION.ERRORS.MISSING_FIELDS,
    ID_LOW_QUALITY: ID_VERIFICATION.ERRORS.LOW_QUALITY,
  },
  INFO: {
    PENDING_APPROVAL: "Your account is pending approval",
    EMAIL_SENT: "Email sent successfully",
    PASSWORD_RESET: "Password reset email sent",
    EMAIL_VERIFICATION_SENT: "Verification email sent",
    WAITLISTED: "Added to waitlist",
    PROMOTED_FROM_WAITLIST: "Promoted from waitlist to registered",
    VERIFICATION_CODE_SENT: "Verification code sent to your email",
    ACCOUNT_VERIFIED: "Your account has been verified",
    ACCOUNT_APPROVED: "Your account has been approved",
    ACCOUNT_REJECTED: "Your account has been rejected",
    ID_PENDING_REVIEW: "ID card uploaded and pending review",
    ID_AUTO_APPROVED: "ID card auto-approved (development mode)",
    // Notification specific
    NOTIFICATION_QUEUED: "Notification queued for delivery",
    NOTIFICATION_SCHEDULED: "Notification scheduled for future delivery",
    NOTIFICATION_BULK_SENT: (count) => `${count} notifications sent`,
    NO_NOTIFICATIONS: "No notifications found",
  },
  EMAIL: {
    SENT: "Email sent successfully",
    FAILED: "Failed to send email",
    VERIFIED: "Email verified successfully",
    ALREADY_VERIFIED: "Email already verified",
    WELCOME_SUBJECT: "Welcome to KAAF University Noticeboard",
    PASSWORD_RESET_SUBJECT: "Password Reset Request",
    EVENT_REGISTRATION_SUBJECT: "Event Registration Confirmed",
    EVENT_CANCELLED_SUBJECT: "Event Cancelled",
    NEW_NOTICE_SUBJECT: "New Notice Published",
    EVENT_REMINDER_SUBJECT: "Event Reminder",
    VERIFICATION_SUBJECT: "Verify Your Account - KAAF University",
    ACCOUNT_APPROVED_SUBJECT: "Account Approved - KAAF University",
    ACCOUNT_REJECTED_SUBJECT: "Account Update - KAAF University",
    TWO_FACTOR_CODE_SUBJECT: "Your Two-Factor Authentication Code",
    ID_VERIFIED_SUBJECT: "ID Card Verified - KAAF University",
    ID_REJECTED_SUBJECT: "ID Card Verification Failed - KAAF University",
    NEW_NOTIFICATION_SUBJECT: "New Notification from KAAF University",
  },
};

// ============================================================
// NOTIFICATION DEFAULTS
// ============================================================

const NOTIFICATION_DEFAULTS = {
  TITLE_MAX_LENGTH: 100,
  MESSAGE_MAX_LENGTH: 500,
  TYPES: ADMIN_NOTIFICATION_TYPES,
  PRIORITIES: ADMIN_NOTIFICATION_PRIORITIES,
  AUDIENCES: ADMIN_NOTIFICATION_AUDIENCES,
  CHANNELS: DELIVERY_CHANNELS,
  DEFAULT_CHANNELS: [DELIVERY_CHANNELS.IN_APP],
  DEFAULT_PRIORITY: ADMIN_NOTIFICATION_PRIORITIES.MEDIUM,
  DEFAULT_TYPE: ADMIN_NOTIFICATION_TYPES.INFO,
  BATCH_SIZE: 100,
  SCHEDULER_INTERVAL_MS: 60000, // Check every minute
  CLEANUP_DAYS: 30, // Delete notifications older than 30 days
  MAX_RESEND_ATTEMPTS: 3,
  RESEND_DELAY_MS: 5000, // 5 seconds between retries
};

// ============================================================
// FREEZE IN PRODUCTION
// ============================================================

if (process.env.NODE_ENV === "production") {
  Object.freeze(HTTP_STATUS);
  Object.freeze(USER_ROLES);
  Object.freeze(USER_ROLE_HIERARCHY);
  Object.freeze(USER_STATUS);
  Object.freeze(USER_VERIFICATION);
  Object.freeze(USER_PREFERENCES);
  Object.freeze(NOTICE_CATEGORIES);
  Object.freeze(NOTICE_PRIORITIES);
  Object.freeze(NOTICE_STATUS);
  Object.freeze(EVENT_TYPES);
  Object.freeze(EVENT_STATUS);
  Object.freeze(EVENT_PARTICIPATION);
  Object.freeze(REGISTRATION_STATUS);
  Object.freeze(REGISTRATION_METHOD);
  Object.freeze(CHECKIN_METHOD);
  Object.freeze(PAYMENT_STATUS);
  Object.freeze(PAYMENT_METHOD);
  Object.freeze(DEPARTMENTS);
  Object.freeze(DEPARTMENT_CODES);
  Object.freeze(ADMIN_NOTIFICATION_TYPES);
  Object.freeze(ADMIN_NOTIFICATION_AUDIENCES);
  Object.freeze(ADMIN_NOTIFICATION_PRIORITIES);
  Object.freeze(DELIVERY_CHANNELS);
  Object.freeze(DELIVERY_STATUS);
  Object.freeze(NOTIFICATION_TYPES);
  Object.freeze(NOTIFICATION_CHANNELS);
  Object.freeze(AUDIT_ACTIONS);
  Object.freeze(FILE_TYPES);
  Object.freeze(MAX_FILE_SIZES);
  Object.freeze(UPLOAD);
  Object.freeze(PAGINATION);
  Object.freeze(SORT_ORDERS);
  Object.freeze(FILTER_OPERATORS);
  Object.freeze(TOKEN_EXPIRY);
  Object.freeze(JWT_CONFIG);
  Object.freeze(CACHE_KEYS);
  Object.freeze(CACHE_TTL);
  Object.freeze(RATE_LIMITS);
  Object.freeze(RATE_LIMIT);
  Object.freeze(DATE_FORMATS);
  Object.freeze(VALIDATION);
  Object.freeze(VERIFICATION);
  Object.freeze(LOG_LEVELS);
  Object.freeze(MESSAGES);
  Object.freeze(ID_VERIFICATION);
  Object.freeze(NOTIFICATION_DEFAULTS);
}

// ============================================================
// EXPORTS (UPDATED)
// ============================================================

module.exports = {
  // HTTP & API
  HTTP_STATUS,
  MESSAGES,

  // User Management
  USER_ROLES,
  USER_ROLE_HIERARCHY,
  USER_STATUS,
  USER_VERIFICATION,
  USER_PREFERENCES,

  // Notice Management
  NOTICE_CATEGORIES,
  NOTICE_TYPES,
  NOTICE_PRIORITIES,
  NOTICE_PRIORITY,
  NOTICE_STATUS,

  // Event Management
  EVENT_TYPES,
  EVENT_STATUS,
  EVENT_PARTICIPATION,

  // Registration Management
  REGISTRATION_STATUS,
  REGISTRATION_METHOD,
  CHECKIN_METHOD,
  PAYMENT_STATUS,
  PAYMENT_METHOD,

  // Department Management
  DEPARTMENTS,
  DEPARTMENT_CODES,

  // Notifications (Enhanced)
  ADMIN_NOTIFICATION_TYPES,
  ADMIN_NOTIFICATION_AUDIENCES,
  ADMIN_NOTIFICATION_PRIORITIES,
  DELIVERY_CHANNELS,
  DELIVERY_STATUS,
  SYSTEM_NOTIFICATION_TYPES,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_DEFAULTS,

  // Audit
  AUDIT_ACTIONS,

  // File Management
  FILE_TYPES,
  MAX_FILE_SIZES,
  UPLOAD,

  // Pagination & Query
  PAGINATION,
  SORT_ORDERS,
  FILTER_OPERATORS,

  // Token & JWT
  TOKEN_EXPIRY,
  JWT_CONFIG,

  // Cache
  CACHE_KEYS,
  CACHE_TTL,

  // Rate Limiting
  RATE_LIMITS,
  RATE_LIMIT,

  // Date & Time
  DATE_FORMATS,

  // Validation
  VALIDATION,

  // Verification
  VERIFICATION,

  // Logging
  LOG_LEVELS,

  // ID Verification
  ID_VERIFICATION,
};
