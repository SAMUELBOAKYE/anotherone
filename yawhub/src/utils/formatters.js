// src/utils/formatters.js

import {
  format,
  formatDistanceToNow,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  isThisWeek,
  isThisYear,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";

// ================================
// Date Formatters
// ================================

/**
 * Format date with smart relative formatting
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "N/A";
  const dateObj = new Date(date);

  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, "h:mm a")}`;
  }
  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, "h:mm a")}`;
  }

  return format(dateObj, "MMM d, yyyy");
};

/**
 * Format date and time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, yyyy h:mm a");
};

/**
 * Format date with full details
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted full date string
 */
export const formatFullDate = (date) => {
  if (!date) return "N/A";
  const dateObj = new Date(date);
  return format(dateObj, "EEEE, MMMM d, yyyy");
};

/**
 * Format date for API requests
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date for API (YYYY-MM-DD)
 */
export const formatDateForAPI = (date) => {
  if (!date) return "";
  const dateObj = new Date(date);
  return format(dateObj, "yyyy-MM-dd");
};

/**
 * Format time only
 * @param {string} time - Time string (e.g., "14:30:00")
 * @returns {string} Formatted time string
 */
export const formatTime = (time) => {
  if (!time) return "N/A";
  return format(new Date(`2000-01-01T${time}`), "h:mm a");
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return "N/A";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Format strict relative time (no "about", "almost")
 * @param {string|Date} date - Date to format
 * @returns {string} Strict relative time string
 */
export const formatStrictRelativeTime = (date) => {
  if (!date) return "N/A";
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
};

/**
 * Get smart date format based on time difference
 * @param {string|Date} date - Date to format
 * @returns {string} Smart formatted date
 */
export const formatSmartDate = (date) => {
  if (!date) return "N/A";
  const dateObj = new Date(date);
  const now = new Date();
  const diffMinutes = differenceInMinutes(now, dateObj);
  const diffHours = differenceInHours(now, dateObj);
  const diffDays = differenceInDays(now, dateObj);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (isThisWeek(dateObj)) return format(dateObj, "EEEE");
  if (isThisYear(dateObj)) return format(dateObj, "MMM d");
  return format(dateObj, "MMM d, yyyy");
};

/**
 * Format date range
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return "N/A";
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
    return `${format(start, "MMM d, yyyy")} (${format(start, "h:mm a")} - ${format(end, "h:mm a")})`;
  }

  return `${format(start, "MMM d, yyyy h:mm a")} - ${format(end, "MMM d, yyyy h:mm a")}`;
};

// ================================
// Text Formatters
// ================================

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Truncate text from middle
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateMiddle = (text, maxLength = 50) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  const start = text.substring(0, maxLength / 2);
  const end = text.substring(text.length - maxLength / 2);
  return `${start}...${end}`;
};

/**
 * Capitalize first letter of string
 * @param {string} string - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

/**
 * Capitalize each word in string
 * @param {string} string - String to capitalize
 * @returns {string} Title cased string
 */
export const titleCase = (string) => {
  if (!string) return "";
  return string
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Convert to slug (URL-friendly)
 * @param {string} text - Text to convert
 * @returns {string} Slug
 */
export const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

/**
 * Extract initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return "";
  const names = name.trim().split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// ================================
// Number Formatters
// ================================

/**
 * Format number with locale
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (number) => {
  if (!number && number !== 0) return "0";
  return number.toLocaleString();
};

/**
 * Format compact number (e.g., 1.2K, 1.5M)
 * @param {number} number - Number to format
 * @returns {string} Compact formatted number
 */
export const formatCompactNumber = (number) => {
  if (!number && number !== 0) return "0";
  const formatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  });
  return formatter.format(number);
};

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (typeof value !== "number") return "0%";
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: GHS)
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = "GHS") => {
  if (typeof amount !== "number") return "₵0.00";
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format duration in seconds to readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
  if (!seconds) return "0 seconds";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  if (secs > 0 || parts.length === 0)
    parts.push(`${secs} second${secs === 1 ? "" : "s"}`);

  return parts.join(" ");
};

// ================================
// HTML & Content Formatters
// ================================

/**
 * Strip HTML tags from string
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export const stripHtml = (html) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

/**
 * Format content preview
 * @param {string} content - HTML content
 * @param {number} maxLength - Maximum length
 * @returns {string} Plain text preview
 */
export const formatContentPreview = (content, maxLength = 200) => {
  const plainText = stripHtml(content);
  return truncateText(plainText, maxLength);
};

/**
 * Highlight search terms in text
 * @param {string} text - Text to highlight
 * @param {string|Array} terms - Search term(s)
 * @returns {string} HTML with highlighted terms
 */
export const highlightText = (text, terms) => {
  if (!text || !terms) return text;

  const searchTerms = Array.isArray(terms) ? terms : [terms];
  let highlightedText = text;

  searchTerms.forEach((term) => {
    const regex = new RegExp(`(${term})`, "gi");
    highlightedText = highlightedText.replace(regex, "<mark>$1</mark>");
  });

  return highlightedText;
};

// ================================
// Color & Status Formatters
// ================================

/**
 * Get color for notice priority
 * @param {string} priority - Priority level
 * @returns {string} Color code
 */
export const getPriorityColor = (priority) => {
  const colors = {
    low: "#4caf50",
    medium: "#ff9800",
    high: "#f44336",
    urgent: "#9c27b0",
  };
  return colors[priority?.toLowerCase()] || "#757575";
};

/**
 * Get color for notice category
 * @param {string} category - Category ID
 * @returns {string} Color code
 */
export const getCategoryColor = (category) => {
  const colors = {
    academic: "#2196f3",
    administrative: "#4caf50",
    event: "#ff9800",
    announcement: "#9c27b0",
    examination: "#f44336",
    scholarship: "#ffc107",
    job: "#795548",
    library: "#607d8b",
  };
  return colors[category?.toLowerCase()] || "#757575";
};

/**
 * Format status badge text
 * @param {string} status - Status value
 * @returns {string} Formatted status
 */
export const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status
    .split("_")
    .map((word) => capitalizeFirstLetter(word))
    .join(" ");
};

// ================================
// Export all formatters
// ================================

export default {
  // Date formatters
  formatDate,
  formatDateTime,
  formatFullDate,
  formatDateForAPI,
  formatTime,
  formatRelativeTime,
  formatStrictRelativeTime,
  formatSmartDate,
  formatDateRange,

  // Text formatters
  truncateText,
  truncateMiddle,
  capitalizeFirstLetter,
  titleCase,
  slugify,
  getInitials,
  formatPhoneNumber,

  // Number formatters
  formatNumber,
  formatCompactNumber,
  formatPercentage,
  formatCurrency,
  formatFileSize,
  formatDuration,

  // HTML & content formatters
  stripHtml,
  formatContentPreview,
  highlightText,

  // Color & status formatters
  getPriorityColor,
  getCategoryColor,
  formatStatus,
};
