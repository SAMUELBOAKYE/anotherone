const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('../config/constants');
const logger = require('./logger');

/**
 * KAAF University Noticeboard System Helpers
 * Collection of utility functions for the application
 * @version 2.0.0
 * @author Boakye Samuel Yiadom
 */

// ============================
// JWT HELPERS
// ============================

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @returns {string} - JWT token
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE
    }
  );
};

/**
 * Generate refresh token
 * @param {string} id - User ID
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (id) => {
  return jwt.sign(
    { id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE
    }
  );
};

/**
 * Send token response
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @returns {Object} - Response with token and user data
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const userResponse = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    department: user.department,
    studentId: user.studentId,
    avatar: user.avatar,
    isActive: user.isActive,
    isVerified: user.isVerified,
    profileCompleteness: user.profileCompleteness
  };

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: userResponse,
    expiresIn: process.env.JWT_EXPIRE || JWT_CONFIG.ACCESS_TOKEN_EXPIRY
  });
};

// ============================
// DATE & TIME HELPERS
// ============================

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type (full, short, iso)
 * @returns {string|null} - Formatted date
 */
const formatDate = (date, format = 'full') => {
  if (!date) return null;
  const dateObj = new Date(date);
  
  const formats = {
    full: { year: 'numeric', month: 'long', day: 'numeric' },
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    numeric: { year: 'numeric', month: '2-digit', day: '2-digit' },
    month: { month: 'long', year: 'numeric' }
  };
  
  const options = formats[format] || formats.full;
  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Format time for display
 * @param {string} time - Time string (HH:MM format)
 * @param {boolean} includeSeconds - Whether to include seconds
 * @returns {string|null} - Formatted time
 */
const formatTime = (time, includeSeconds = false) => {
  if (!time) return null;
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes), includeSeconds ? 0 : undefined);
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true
  });
};

/**
 * Format datetime for display
 * @param {Date|string} dateTime - DateTime to format
 * @returns {string|null} - Formatted datetime
 */
const formatDateTime = (dateTime) => {
  if (!dateTime) return null;
  const date = new Date(dateTime);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Check if date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
const isPastDate = (date) => {
  return new Date(date) < new Date();
};

/**
 * Check if date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in the future
 */
const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to get relative time for
 * @returns {string} - Relative time string
 */
const getRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffSecs > 0) return `${diffSecs} second${diffSecs > 1 ? 's' : ''} ago`;
  return 'just now';
};

// ============================
// VALIDATION HELPERS
// ============================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if phone is valid
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - True if ID is valid ObjectId
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

// ============================
// STRING HELPERS
// ============================

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add
 * @returns {string} - Truncated text
 */
const truncate = (text, length = 100, suffix = '...') => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
};

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
const capitalizeWords = (str) => {
  if (!str) return '';
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Generate random string
 * @param {number} length - Length of random string
 * @param {string} type - Type of characters (alphanumeric, numeric, alphabetic)
 * @returns {string} - Random string
 */
const generateRandomString = (length = 8, type = 'alphanumeric') => {
  const chars = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    numeric: '0123456789',
    alphabetic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  };
  
  const characterSet = chars[type] || chars.alphanumeric;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characterSet.charAt(Math.floor(Math.random() * characterSet.length));
  }
  return result;
};

/**
 * Slugify a string (convert to URL-friendly format)
 * @param {string} str - String to slugify
 * @returns {string} - Slugified string
 */
const slugify = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ============================
// ARRAY HELPERS
// ============================

/**
 * Remove duplicates from array
 * @param {Array} arr - Array to process
 * @returns {Array} - Array with unique values
 */
const uniqueArray = (arr) => {
  return [...new Set(arr)];
};

/**
 * Chunk array into smaller arrays
 * @param {Array} arr - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} - Chunked array
 */
const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

// ============================
// OBJECT HELPERS
// ============================

/**
 * Pick specific properties from object
 * @param {Object} obj - Source object
 * @param {Array} keys - Keys to pick
 * @returns {Object} - New object with picked properties
 */
const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

/**
 * Omit specific properties from object
 * @param {Object} obj - Source object
 * @param {Array} keys - Keys to omit
 * @returns {Object} - New object without omitted properties
 */
const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// ============================
// EXPORTS
// ============================

module.exports = {
  // JWT helpers
  generateToken,
  generateRefreshToken,
  sendTokenResponse,
  
  // Date & time helpers
  formatDate,
  formatTime,
  formatDateTime,
  isPastDate,
  isFutureDate,
  getRelativeTime,
  
  // Validation helpers
  isValidEmail,
  isValidPhone,
  isValidObjectId,
  
  // String helpers
  truncate,
  capitalizeWords,
  generateRandomString,
  slugify,
  
  // Array helpers
  uniqueArray,
  chunkArray,
  
  // Object helpers
  pick,
  omit,
  deepClone
};