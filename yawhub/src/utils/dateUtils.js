v; // src/utils/dateUtils.js - Professional Date Utilities
import {
  format,
  formatDistance,
  formatRelative,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  isThisWeek,
  isThisMonth,
  isThisYear,
} from "date-fns";

// ============================================================
// CONSTANTS
// ============================================================

export const DATE_FORMATS = {
  // Display formats
  DISPLAY_DATE: "dd MMM yyyy",
  DISPLAY_TIME: "hh:mm a",
  DISPLAY_DATETIME: "dd MMM yyyy, hh:mm a",
  DISPLAY_FULL_DATE: "EEEE, dd MMMM yyyy",
  DISPLAY_FULL_DATETIME: "EEEE, dd MMMM yyyy, hh:mm a",

  // API formats
  API_DATE: "yyyy-MM-dd",
  API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",

  // Storage formats
  STORAGE_DATE: "yyyy-MM-dd",
  STORAGE_DATETIME: "yyyy-MM-dd HH:mm:ss",

  // Input formats
  INPUT_DATE: "yyyy-MM-dd",
  INPUT_TIME: "HH:mm",
  INPUT_DATETIME_LOCAL: "yyyy-MM-dd'T'HH:mm",
};

export const DEFAULT_DATE_CONFIG = {
  locale: "en-GB",
  timezone: "UTC",
  fallbackValue: "TBD",
};

// ============================================================
// CORE FORMATTING FUNCTIONS
// ============================================================

/**
 * Format date to specified format
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string (default: DISPLAY_DATE)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = DATE_FORMATS.DISPLAY_DATE) => {
  if (!date) return DEFAULT_DATE_CONFIG.fallbackValue;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return DEFAULT_DATE_CONFIG.fallbackValue;
  return format(dateObj, formatStr);
};

/**
 * Format time only
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  if (!date) return DEFAULT_DATE_CONFIG.fallbackValue;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return DEFAULT_DATE_CONFIG.fallbackValue;
  return format(dateObj, DATE_FORMATS.DISPLAY_TIME);
};

/**
 * Format date and time together
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return DEFAULT_DATE_CONFIG.fallbackValue;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return DEFAULT_DATE_CONFIG.fallbackValue;
  return format(dateObj, DATE_FORMATS.DISPLAY_DATETIME);
};

/**
 * Format full date with weekday and month name
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted full date string
 */
export const formatFullDate = (date) => {
  if (!date) return DEFAULT_DATE_CONFIG.fallbackValue;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return DEFAULT_DATE_CONFIG.fallbackValue;
  return format(dateObj, DATE_FORMATS.DISPLAY_FULL_DATE);
};

/**
 * Format full datetime with weekday and month name
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted full datetime string
 */
export const formatFullDateTime = (date) => {
  if (!date) return DEFAULT_DATE_CONFIG.fallbackValue;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return DEFAULT_DATE_CONFIG.fallbackValue;
  return format(dateObj, DATE_FORMATS.DISPLAY_FULL_DATETIME);
};

/**
 * Format date for API submission
 * @param {string|Date} date - Date to format
 * @returns {string} API formatted date string
 */
export const formatForAPI = (date) => {
  if (!date) return null;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return null;
  return format(dateObj, DATE_FORMATS.API_DATETIME);
};

/**
 * Format date for input fields
 * @param {string|Date} date - Date to format
 * @returns {string} Input formatted date string
 */
export const formatForInput = (date) => {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "";
  return format(dateObj, DATE_FORMATS.INPUT_DATE);
};

/**
 * Format time for input fields
 * @param {string|Date} date - Date to format
 * @returns {string} Input formatted time string
 */
export const formatTimeForInput = (date) => {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "";
  return format(dateObj, DATE_FORMATS.INPUT_TIME);
};

// ============================================================
// RELATIVE TIME FUNCTIONS
// ============================================================

/**
 * Get relative time from now (e.g., "2 days ago", "in 3 hours")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return DEFAULT_DATE_CONFIG.fallbackValue;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return DEFAULT_DATE_CONFIG.fallbackValue;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
};

/**
 * Get human-readable relative time
 * @param {string|Date} date - Date to compare
 * @returns {string} Human readable time
 */
export const getRelativeTimeHuman = (date) => {
  if (!date) return DEFAULT_DATE_CONFIG.fallbackValue;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return DEFAULT_DATE_CONFIG.fallbackValue;

  if (isToday(dateObj)) return "Today";
  if (isTomorrow(dateObj)) return "Tomorrow";
  if (isYesterday(dateObj)) return "Yesterday";

  const daysDiff = differenceInDays(dateObj, new Date());
  if (Math.abs(daysDiff) < 7) {
    return formatRelative(dateObj, new Date());
  }

  return formatDate(dateObj);
};

/**
 * Get time ago string (e.g., "5 minutes ago")
 * @param {string|Date} date - Date to compare
 * @returns {string} Time ago string
 */
export const timeAgo = (date) => {
  if (!date) return DEFAULT_DATE_CONFIG.fallbackValue;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return DEFAULT_DATE_CONFIG.fallbackValue;

  const minutes = differenceInMinutes(new Date(), dateObj);
  const hours = differenceInHours(new Date(), dateObj);
  const days = differenceInDays(new Date(), dateObj);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;

  return formatDate(dateObj);
};

// ============================================================
// DATE COMPARISON FUNCTIONS
// ============================================================

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isDateToday = (date) => {
  if (!date) return false;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isToday(dateObj);
};

/**
 * Check if date is tomorrow
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is tomorrow
 */
export const isDateTomorrow = (date) => {
  if (!date) return false;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isTomorrow(dateObj);
};

/**
 * Check if date is yesterday
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is yesterday
 */
export const isDateYesterday = (date) => {
  if (!date) return false;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isYesterday(dateObj);
};

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isDatePast = (date) => {
  if (!date) return false;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isPast(dateObj);
};

/**
 * Check if date is in the future
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export const isDateFuture = (date) => {
  if (!date) return false;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isFuture(dateObj);
};

/**
 * Check if date is within current week
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is within current week
 */
export const isDateThisWeek = (date) => {
  if (!date) return false;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isThisWeek(dateObj);
};

/**
 * Check if date is within current month
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is within current month
 */
export const isDateThisMonth = (date) => {
  if (!date) return false;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isThisMonth(dateObj);
};

/**
 * Check if date is within current year
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is within current year
 */
export const isDateThisYear = (date) => {
  if (!date) return false;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isThisYear(dateObj);
};

// ============================================================
// EVENT STATUS FUNCTIONS
// ============================================================

/**
 * Check if event is upcoming
 * @param {string|Date} date - Event date
 * @returns {boolean} True if event is upcoming
 */
export const isUpcoming = (date) => {
  if (!date) return false;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isFuture(dateObj);
};

/**
 * Check if event is ongoing
 * @param {string|Date} startDate - Event start date
 * @param {string|Date} endDate - Event end date
 * @returns {boolean} True if event is ongoing
 */
export const isOngoing = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const now = new Date();
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  return now >= start && now <= end;
};

/**
 * Check if event is completed
 * @param {string|Date} endDate - Event end date
 * @returns {boolean} True if event is completed
 */
export const isCompleted = (endDate) => {
  if (!endDate) return false;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  return isPast(end);
};

/**
 * Get event status based on dates
 * @param {string|Date} startDate - Event start date
 * @param {string|Date} endDate - Event end date
 * @returns {string} Event status (upcoming, ongoing, completed)
 */
export const getEventStatus = (startDate, endDate) => {
  if (isOngoing(startDate, endDate)) return "ongoing";
  if (isCompleted(endDate)) return "completed";
  if (isUpcoming(startDate)) return "upcoming";
  return "unknown";
};

// ============================================================
// DATE RANGE FUNCTIONS
// ============================================================

/**
 * Get date range string (e.g., "15 Jan - 20 Jan 2024")
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Date range string
 */
export const getDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return DEFAULT_DATE_CONFIG.fallbackValue;
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, "dd")} - ${format(end, "dd MMM yyyy")}`;
    }
    return `${format(start, "dd MMM")} - ${format(end, "dd MMM yyyy")}`;
  }
  return `${format(start, "dd MMM yyyy")} - ${format(end, "dd MMM yyyy")}`;
};

/**
 * Get time range string (e.g., "10:00 AM - 5:00 PM")
 * @param {string|Date} startTime - Start time
 * @param {string|Date} endTime - End time
 * @returns {string} Time range string
 */
export const getTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return DEFAULT_DATE_CONFIG.fallbackValue;
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

// ============================================================
// DATE MANIPULATION FUNCTIONS
// ============================================================

/**
 * Add days to a date
 * @param {string|Date} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
export const addDays = (date, days) => {
  const dateObj = typeof date === "string" ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

/**
 * Subtract days from a date
 * @param {string|Date} date - Base date
 * @param {number} days - Number of days to subtract
 * @returns {Date} New date
 */
export const subtractDays = (date, days) => {
  return addDays(date, -days);
};

/**
 * Get start of day (00:00:00)
 * @param {string|Date} date - Date
 * @returns {Date} Start of day
 */
export const startOfDay = (date) => {
  const dateObj = typeof date === "string" ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

/**
 * Get end of day (23:59:59)
 * @param {string|Date} date - Date
 * @returns {Date} End of day
 */
export const endOfDay = (date) => {
  const dateObj = typeof date === "string" ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
};

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Check if date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if date is valid
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Check if date range is valid
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {boolean} True if date range is valid
 */
export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  return start <= end;
};

/**
 * Check if registration deadline is valid
 * @param {string|Date} deadline - Registration deadline
 * @param {string|Date} eventDate - Event date
 * @returns {boolean} True if deadline is valid
 */
export const isValidRegistrationDeadline = (deadline, eventDate) => {
  if (!deadline) return true;
  const deadlineDate =
    typeof deadline === "string" ? new Date(deadline) : deadline;
  const event = typeof eventDate === "string" ? new Date(eventDate) : eventDate;
  return deadlineDate <= event;
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get days remaining until event
 * @param {string|Date} date - Event date
 * @returns {number} Days remaining (negative if past)
 */
export const getDaysRemaining = (date) => {
  if (!date) return 0;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return differenceInDays(dateObj, new Date());
};

/**
 * Get days passed since event
 * @param {string|Date} date - Event date
 * @returns {number} Days passed
 */
export const getDaysPassed = (date) => {
  if (!date) return 0;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return Math.abs(differenceInDays(new Date(), dateObj));
};

/**
 * Format duration in hours and minutes
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "0 min";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  return `${hours}h ${mins}m`;
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

const dateUtils = {
  // Constants
  DATE_FORMATS,
  DEFAULT_DATE_CONFIG,

  // Core formatting
  formatDate,
  formatTime,
  formatDateTime,
  formatFullDate,
  formatFullDateTime,
  formatForAPI,
  formatForInput,
  formatTimeForInput,

  // Relative time
  getRelativeTime,
  getRelativeTimeHuman,
  timeAgo,

  // Date comparison
  isDateToday,
  isDateTomorrow,
  isDateYesterday,
  isDatePast,
  isDateFuture,
  isDateThisWeek,
  isDateThisMonth,
  isDateThisYear,

  // Event status
  isUpcoming,
  isOngoing,
  isCompleted,
  getEventStatus,

  // Date ranges
  getDateRange,
  getTimeRange,

  // Date manipulation
  addDays,
  subtractDays,
  startOfDay,
  endOfDay,

  // Validation
  isValidDate,
  isValidDateRange,
  isValidRegistrationDeadline,

  // Utility
  getDaysRemaining,
  getDaysPassed,
  formatDuration,
};

export default dateUtils;
