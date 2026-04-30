// src/utils/settingsValidation.js

/**
 * Settings Validation and Sanitization Module
 * Provides comprehensive validation, sanitization, and normalization for user settings
 *
 * @version 1.0.0
 * @module utils/settingsValidation
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Valid theme options
 */
const VALID_THEMES = ["light", "dark", "system"];

/**
 * Valid language codes (ISO 639-1)
 */
const VALID_LANGUAGES = ["en", "es", "fr", "de", "zh", "ja"];

/**
 * Valid date format patterns
 */
const VALID_DATE_FORMATS = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];

/**
 * Valid time formats
 */
const VALID_TIME_FORMATS = ["12h", "24h"];

/**
 * Valid notification sounds
 */
const VALID_NOTIFICATION_SOUNDS = ["none", "default", "subtle", "prominent"];

/**
 * Valid profile visibility options
 */
const VALID_VISIBILITY_OPTIONS = ["public", "private", "contacts"];

/**
 * Valid timezone list (from Intl API)
 */
const VALID_TIMEZONES =
  typeof Intl !== "undefined"
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"];

/**
 * Configuration ranges
 */
const CONFIG = {
  MIN_FONT_SIZE: 12,
  MAX_FONT_SIZE: 20,
  DEFAULT_FONT_SIZE: 16,
  MIN_SESSION_TIMEOUT: 5,
  MAX_SESSION_TIMEOUT: 120,
  DEFAULT_SESSION_TIMEOUT: 30,
  MAX_LANGUAGE_LENGTH: 10,
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Validation rule interface
 */
class ValidationRule {
  constructor(field, validate, message) {
    this.field = field;
    this.validate = validate;
    this.message = message;
  }
}

/**
 * Validation rules for settings object
 */
const validationRules = [
  new ValidationRule(
    "language",
    (value) => !value || typeof value === "string",
    "Language must be a string",
  ),
  new ValidationRule(
    "language",
    (value) => !value || VALID_LANGUAGES.includes(value),
    `Language must be one of: ${VALID_LANGUAGES.join(", ")}`,
  ),
  new ValidationRule(
    "dateFormat",
    (value) => !value || VALID_DATE_FORMATS.includes(value),
    `Date format must be one of: ${VALID_DATE_FORMATS.join(", ")}`,
  ),
  new ValidationRule(
    "timeFormat",
    (value) => !value || VALID_TIME_FORMATS.includes(value),
    `Time format must be one of: ${VALID_TIME_FORMATS.join(", ")}`,
  ),
  new ValidationRule(
    "timezone",
    (value) => !value || VALID_TIMEZONES.includes(value),
    "Invalid timezone",
  ),
];

/**
 * Validation rules for display settings
 */
const displayValidationRules = [
  new ValidationRule(
    "theme",
    (value) => !value || VALID_THEMES.includes(value),
    `Theme must be one of: ${VALID_THEMES.join(", ")}`,
  ),
  new ValidationRule(
    "fontSize",
    (value) =>
      !value ||
      (value >= CONFIG.MIN_FONT_SIZE && value <= CONFIG.MAX_FONT_SIZE),
    `Font size must be between ${CONFIG.MIN_FONT_SIZE} and ${CONFIG.MAX_FONT_SIZE}px`,
  ),
  new ValidationRule(
    "compactMode",
    (value) => typeof value === "boolean",
    "Compact mode must be a boolean",
  ),
];

/**
 * Validation rules for notification settings
 */
const notificationValidationRules = [
  new ValidationRule(
    "sound",
    (value) => !value || VALID_NOTIFICATION_SOUNDS.includes(value),
    `Notification sound must be one of: ${VALID_NOTIFICATION_SOUNDS.join(", ")}`,
  ),
];

/**
 * Validation rules for privacy settings
 */
const privacyValidationRules = [
  new ValidationRule(
    "profileVisibility",
    (value) => !value || VALID_VISIBILITY_OPTIONS.includes(value),
    `Profile visibility must be one of: ${VALID_VISIBILITY_OPTIONS.join(", ")}`,
  ),
  new ValidationRule(
    "shareAnalytics",
    (value) => typeof value === "boolean",
    "Share analytics must be a boolean",
  ),
];

/**
 * Validation rules for security settings
 */
const securityValidationRules = [
  new ValidationRule(
    "sessionTimeout",
    (value) =>
      !value ||
      (value >= CONFIG.MIN_SESSION_TIMEOUT &&
        value <= CONFIG.MAX_SESSION_TIMEOUT),
    `Session timeout must be between ${CONFIG.MIN_SESSION_TIMEOUT} and ${CONFIG.MAX_SESSION_TIMEOUT} minutes`,
  ),
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a value is a valid object
 * @param {any} obj - Object to check
 * @returns {boolean} True if valid object
 */
const isValidObject = (obj) => {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
};

/**
 * Safely get nested property
 * @param {Object} obj - Source object
 * @param {string} path - Dot notation path
 * @returns {any} Property value or undefined
 */
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((current, key) => {
    return current && isValidObject(current) ? current[key] : undefined;
  }, obj);
};

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
const deepMerge = (target, source) => {
  const result = { ...target };

  for (const key in source) {
    if (isValidObject(source[key]) && isValidObject(target[key])) {
      result[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }

  return result;
};

// ============================================================================
// MAIN VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate settings object
 * @param {Object} settings - Settings object to validate
 * @returns {Object} Validation result with isValid and errors array
 */
export const validateSettings = (settings) => {
  const errors = [];

  // Check if settings is a valid object
  if (!settings || !isValidObject(settings)) {
    errors.push("Invalid settings object");
    return { isValid: false, errors, warnings: [] };
  }

  // Validate top-level fields
  for (const rule of validationRules) {
    const value = getNestedValue(settings, rule.field);
    if (value !== undefined && !rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  // Validate display settings
  if (settings.display) {
    for (const rule of displayValidationRules) {
      const value = settings.display[rule.field];
      if (value !== undefined && !rule.validate(value)) {
        errors.push(`display.${rule.message.toLowerCase()}`);
      }
    }
  }

  // Validate notification settings
  if (settings.notifications) {
    for (const rule of notificationValidationRules) {
      const value = settings.notifications[rule.field];
      if (value !== undefined && !rule.validate(value)) {
        errors.push(`notifications.${rule.message.toLowerCase()}`);
      }
    }
  }

  // Validate privacy settings
  if (settings.privacy) {
    for (const rule of privacyValidationRules) {
      const value = settings.privacy[rule.field];
      if (value !== undefined && !rule.validate(value)) {
        errors.push(`privacy.${rule.message.toLowerCase()}`);
      }
    }
  }

  // Validate security settings
  if (settings.security) {
    for (const rule of securityValidationRules) {
      const value = settings.security[rule.field];
      if (value !== undefined && !rule.validate(value)) {
        errors.push(`security.${rule.message.toLowerCase()}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
};

/**
 * Validate a single setting field
 * @param {string} category - Setting category
 * @param {string} field - Field name
 * @param {any} value - Value to validate
 * @returns {Object} Validation result
 */
export const validateSettingField = (category, field, value) => {
  let rules = [];

  switch (category) {
    case "display":
      rules = displayValidationRules;
      break;
    case "notifications":
      rules = notificationValidationRules;
      break;
    case "privacy":
      rules = privacyValidationRules;
      break;
    case "security":
      rules = securityValidationRules;
      break;
    default:
      rules = validationRules;
  }

  const rule = rules.find((r) => r.field === field);

  if (!rule) {
    return { isValid: true, error: null };
  }

  const isValid = rule.validate(value);

  return {
    isValid,
    error: isValid ? null : rule.message,
  };
};

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize a string value
 * @param {string} value - String to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized string
 */
const sanitizeString = (value, maxLength = 100) => {
  if (typeof value !== "string") return "";
  return value.trim().substring(0, maxLength);
};

/**
 * Sanitize a number within range
 * @param {any} value - Value to sanitize
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} defaultValue - Default value
 * @returns {number} Sanitized number
 */
const sanitizeNumber = (value, min, max, defaultValue) => {
  let num = typeof value === "number" ? value : parseInt(value, 10);
  if (isNaN(num)) return defaultValue;
  return Math.min(max, Math.max(min, num));
};

/**
 * Sanitize a boolean value
 * @param {any} value - Value to sanitize
 * @param {boolean} defaultValue - Default value
 * @returns {boolean} Sanitized boolean
 */
const sanitizeBoolean = (value, defaultValue = false) => {
  if (typeof value === "boolean") return value;
  return defaultValue;
};

/**
 * Sanitize an enum value
 * @param {any} value - Value to sanitize
 * @param {Array} validValues - Array of valid values
 * @param {any} defaultValue - Default value
 * @returns {any} Sanitized enum value
 */
const sanitizeEnum = (value, validValues, defaultValue) => {
  if (validValues.includes(value)) return value;
  return defaultValue;
};

/**
 * Sanitize settings object to prevent XSS and invalid data
 * @param {Object} settings - Settings object to sanitize
 * @returns {Object} Sanitized settings object
 */
export const sanitizeSettings = (settings) => {
  if (!settings || !isValidObject(settings)) {
    return getDefaultSettings();
  }

  const sanitized = {};

  // Sanitize top-level fields
  sanitized.language = sanitizeEnum(settings.language, VALID_LANGUAGES, "en");

  sanitized.dateFormat = sanitizeEnum(
    settings.dateFormat,
    VALID_DATE_FORMATS,
    "MM/DD/YYYY",
  );

  sanitized.timeFormat = sanitizeEnum(
    settings.timeFormat,
    VALID_TIME_FORMATS,
    "12h",
  );

  sanitized.timezone = sanitizeEnum(
    settings.timezone,
    VALID_TIMEZONES,
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );

  // Sanitize display settings
  sanitized.display = {
    theme: sanitizeEnum(settings.display?.theme, VALID_THEMES, "light"),
    fontSize: sanitizeNumber(
      settings.display?.fontSize,
      CONFIG.MIN_FONT_SIZE,
      CONFIG.MAX_FONT_SIZE,
      CONFIG.DEFAULT_FONT_SIZE,
    ),
    compactMode: sanitizeBoolean(settings.display?.compactMode, false),
  };

  // Sanitize notification settings
  sanitized.notifications = {
    email: {
      eventReminders: sanitizeBoolean(
        settings.notifications?.email?.eventReminders,
        true,
      ),
      newsletter: sanitizeBoolean(
        settings.notifications?.email?.newsletter,
        false,
      ),
      promotions: sanitizeBoolean(
        settings.notifications?.email?.promotions,
        false,
      ),
    },
    push: {
      enabled: sanitizeBoolean(settings.notifications?.push?.enabled, true),
    },
    sound: sanitizeEnum(
      settings.notifications?.sound,
      VALID_NOTIFICATION_SOUNDS,
      "default",
    ),
  };

  // Sanitize privacy settings
  sanitized.privacy = {
    profileVisibility: sanitizeEnum(
      settings.privacy?.profileVisibility,
      VALID_VISIBILITY_OPTIONS,
      "public",
    ),
    shareAnalytics: sanitizeBoolean(settings.privacy?.shareAnalytics, true),
  };

  // Sanitize security settings
  sanitized.security = {
    sessionTimeout: sanitizeNumber(
      settings.security?.sessionTimeout,
      CONFIG.MIN_SESSION_TIMEOUT,
      CONFIG.MAX_SESSION_TIMEOUT,
      CONFIG.DEFAULT_SESSION_TIMEOUT,
    ),
  };

  return sanitized;
};

/**
 * Sanitize a single setting field
 * @param {string} category - Setting category
 * @param {string} field - Field name
 * @param {any} value - Value to sanitize
 * @returns {any} Sanitized value
 */
export const sanitizeSettingField = (category, field, value) => {
  switch (category) {
    case "language":
      return sanitizeEnum(value, VALID_LANGUAGES, "en");

    case "dateFormat":
      return sanitizeEnum(value, VALID_DATE_FORMATS, "MM/DD/YYYY");

    case "timeFormat":
      return sanitizeEnum(value, VALID_TIME_FORMATS, "12h");

    case "timezone":
      return sanitizeEnum(value, VALID_TIMEZONES, "UTC");

    case "display":
      switch (field) {
        case "theme":
          return sanitizeEnum(value, VALID_THEMES, "light");
        case "fontSize":
          return sanitizeNumber(
            value,
            CONFIG.MIN_FONT_SIZE,
            CONFIG.MAX_FONT_SIZE,
            CONFIG.DEFAULT_FONT_SIZE,
          );
        case "compactMode":
          return sanitizeBoolean(value, false);
        default:
          return value;
      }

    case "notifications":
      switch (field) {
        case "sound":
          return sanitizeEnum(value, VALID_NOTIFICATION_SOUNDS, "default");
        default:
          return sanitizeBoolean(value, true);
      }

    case "privacy":
      switch (field) {
        case "profileVisibility":
          return sanitizeEnum(value, VALID_VISIBILITY_OPTIONS, "public");
        default:
          return sanitizeBoolean(value, true);
      }

    case "security":
      if (field === "sessionTimeout") {
        return sanitizeNumber(
          value,
          CONFIG.MIN_SESSION_TIMEOUT,
          CONFIG.MAX_SESSION_TIMEOUT,
          CONFIG.DEFAULT_SESSION_TIMEOUT,
        );
      }
      return value;

    default:
      return value;
  }
};

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

/**
 * Get default settings
 * @returns {Object} Default settings object
 */
export const getDefaultSettings = () => {
  return {
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    timezone:
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC",
    display: {
      theme: "light",
      fontSize: CONFIG.DEFAULT_FONT_SIZE,
      compactMode: false,
    },
    notifications: {
      email: {
        eventReminders: true,
        newsletter: false,
        promotions: false,
      },
      push: {
        enabled: true,
      },
      sound: "default",
    },
    privacy: {
      profileVisibility: "public",
      shareAnalytics: true,
    },
    security: {
      sessionTimeout: CONFIG.DEFAULT_SESSION_TIMEOUT,
    },
  };
};

/**
 * Get default settings for a specific category
 * @param {string} category - Settings category
 * @returns {Object} Default settings for category
 */
export const getDefaultCategorySettings = (category) => {
  const defaults = getDefaultSettings();
  return defaults[category] || {};
};

// ============================================================================
// SETTINGS COMPARISON & DIFF
// ============================================================================

/**
 * Compare two settings objects and return differences
 * @param {Object} oldSettings - Old settings
 * @param {Object} newSettings - New settings
 * @returns {Object} Object containing added, removed, and changed fields
 */
export const compareSettings = (oldSettings, newSettings) => {
  const changes = {
    added: {},
    removed: {},
    changed: {},
  };

  const getAllKeys = (obj, prefix = "") => {
    let keys = {};
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (isValidObject(obj[key]) && !Array.isArray(obj[key])) {
        keys = { ...keys, ...getAllKeys(obj[key], fullKey) };
      } else {
        keys[fullKey] = obj[key];
      }
    }
    return keys;
  };

  const oldKeys = getAllKeys(oldSettings);
  const newKeys = getAllKeys(newSettings);

  // Find added and changed fields
  for (const key in newKeys) {
    if (!(key in oldKeys)) {
      changes.added[key] = newKeys[key];
    } else if (JSON.stringify(oldKeys[key]) !== JSON.stringify(newKeys[key])) {
      changes.changed[key] = {
        old: oldKeys[key],
        new: newKeys[key],
      };
    }
  }

  // Find removed fields
  for (const key in oldKeys) {
    if (!(key in newKeys)) {
      changes.removed[key] = oldKeys[key];
    }
  }

  return changes;
};

/**
 * Check if settings are valid and return normalized version
 * @param {Object} settings - Settings to normalize
 * @returns {Object} Normalized settings
 */
export const normalizeSettings = (settings) => {
  const validation = validateSettings(settings);

  if (!validation.isValid) {
    console.warn("Settings validation failed:", validation.errors);
  }

  return sanitizeSettings(settings);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  validateSettings,
  validateSettingField,
  sanitizeSettings,
  sanitizeSettingField,
  getDefaultSettings,
  getDefaultCategorySettings,
  compareSettings,
  normalizeSettings,
};
