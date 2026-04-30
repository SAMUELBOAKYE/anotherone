// src/utils/validators.js

import { VALIDATION_PATTERNS, VALIDATION_LIMITS } from "./constants";

// ================================
// Validation Result Class
// ================================

/**
 * Validation result object
 * @class ValidationResult
 */
export class ValidationResult {
  constructor(isValid = true, errors = []) {
    this.isValid = isValid;
    this.errors = Array.isArray(errors) ? errors : [errors];
  }

  addError(error) {
    this.errors.push(error);
    this.isValid = false;
    return this;
  }

  merge(result) {
    if (!result.isValid) {
      this.isValid = false;
      this.errors.push(...result.errors);
    }
    return this;
  }

  toString() {
    return this.errors.join(", ");
  }
}

// ================================
// Basic Validators
// ================================

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @param {Object} options - Validation options
 * @returns {boolean|ValidationResult} Validation result
 */
export const validateEmail = (email, options = {}) => {
  const { returnResult = false, required = true } = options;

  if (!email && !required) {
    return returnResult ? new ValidationResult(true) : true;
  }

  if (!email || email.trim() === "") {
    if (returnResult) return new ValidationResult(false, "Email is required");
    return false;
  }

  const pattern = VALIDATION_PATTERNS?.EMAIL || /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = pattern.test(email);

  if (returnResult) {
    return isValid
      ? new ValidationResult(true)
      : new ValidationResult(false, "Please enter a valid email address");
  }

  return isValid;
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {boolean|Object} Validation result or object with details
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = VALIDATION_LIMITS?.MIN_PASSWORD_LENGTH || 6,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecialChar = false,
    returnDetails = false,
  } = options;

  if (!password) {
    if (returnDetails) {
      return {
        isValid: false,
        errors: ["Password is required"],
        strength: "none",
      };
    }
    return false;
  }

  const errors = [];
  let strength = "weak";

  // Length check
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  // Uppercase check
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Lowercase check
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Number check
  if (requireNumber && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Special character check
  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Calculate password strength
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score >= 5) strength = "strong";
  else if (score >= 3) strength = "medium";
  else strength = "weak";

  const isValid = errors.length === 0;

  if (returnDetails) {
    return {
      isValid,
      errors,
      strength,
      score,
    };
  }

  return isValid;
};

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {boolean|Object} Validation result
 */
export const validatePasswordMatch = (
  password,
  confirmPassword,
  returnResult = false,
) => {
  const isValid = password === confirmPassword;

  if (returnResult) {
    return isValid
      ? new ValidationResult(true)
      : new ValidationResult(false, "Passwords do not match");
  }

  return isValid;
};

/**
 * Validate name (person name)
 * @param {string} name - Name to validate
 * @param {Object} options - Validation options
 * @returns {boolean|ValidationResult} Validation result
 */
export const validateName = (name, options = {}) => {
  const {
    minLength = VALIDATION_LIMITS?.MIN_NAME_LENGTH || 2,
    maxLength = VALIDATION_LIMITS?.MAX_NAME_LENGTH || 50,
    allowSpaces = true,
    returnResult = false,
  } = options;

  if (!name || name.trim() === "") {
    if (returnResult) return new ValidationResult(false, "Name is required");
    return false;
  }

  const trimmedName = name.trim();
  const errors = [];

  if (trimmedName.length < minLength) {
    errors.push(`Name must be at least ${minLength} characters`);
  }

  if (trimmedName.length > maxLength) {
    errors.push(`Name cannot exceed ${maxLength} characters`);
  }

  if (!allowSpaces && trimmedName.includes(" ")) {
    errors.push("Name cannot contain spaces");
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const validPattern = /^[a-zA-Z\s\-']+$/;
  if (!validPattern.test(trimmedName)) {
    errors.push(
      "Name can only contain letters, spaces, hyphens, and apostrophes",
    );
  }

  const isValid = errors.length === 0;

  if (returnResult) {
    return isValid
      ? new ValidationResult(true)
      : new ValidationResult(false, errors);
  }

  return isValid;
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @param {Object} options - Validation options
 * @returns {boolean|ValidationResult} Validation result
 */
export const validatePhone = (phone, options = {}) => {
  const {
    required = false,
    returnResult = false,
    countryCode = "GH", // Ghana by default
  } = options;

  if (!phone && !required) {
    return returnResult ? new ValidationResult(true) : true;
  }

  if (!phone) {
    if (returnResult)
      return new ValidationResult(false, "Phone number is required");
    return false;
  }

  // Ghana phone number pattern
  const ghanaPattern = /^(233|0)[2-9]\d{7,8}$/;
  // International pattern
  const internationalPattern =
    /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;

  let isValid;
  if (countryCode === "GH") {
    isValid = ghanaPattern.test(phone.replace(/\s/g, ""));
  } else {
    isValid = internationalPattern.test(phone);
  }

  if (returnResult) {
    return isValid
      ? new ValidationResult(true)
      : new ValidationResult(false, "Please enter a valid phone number");
  }

  return isValid;
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @returns {boolean|ValidationResult} Validation result
 */
export const validateURL = (url, options = {}) => {
  const {
    required = false,
    returnResult = false,
    protocols = ["http:", "https:"],
  } = options;

  if (!url && !required) {
    return returnResult ? new ValidationResult(true) : true;
  }

  if (!url) {
    if (returnResult) return new ValidationResult(false, "URL is required");
    return false;
  }

  try {
    const urlObj = new URL(url);
    const isValidProtocol = protocols.includes(urlObj.protocol);

    if (returnResult) {
      return isValidProtocol
        ? new ValidationResult(true)
        : new ValidationResult(
            false,
            `URL must use one of these protocols: ${protocols.join(", ")}`,
          );
    }

    return isValidProtocol;
  } catch {
    if (returnResult)
      return new ValidationResult(false, "Please enter a valid URL");
    return false;
  }
};

// ================================
// Advanced Validators
// ================================

/**
 * Validate student ID
 * @param {string} studentId - Student ID to validate
 * @returns {boolean|ValidationResult} Validation result
 */
export const validateStudentId = (studentId, returnResult = false) => {
  // Pattern: Two letters followed by 6 digits (e.g., CS123456)
  const pattern = /^[A-Z]{2}[0-9]{6}$/;
  const isValid = pattern.test(studentId?.toUpperCase());

  if (returnResult) {
    return isValid
      ? new ValidationResult(true)
      : new ValidationResult(
          false,
          "Student ID must be 2 letters followed by 6 digits (e.g., CS123456)",
        );
  }

  return isValid;
};

/**
 * Validate staff ID
 * @param {string} staffId - Staff ID to validate
 * @returns {boolean|ValidationResult} Validation result
 */
export const validateStaffId = (staffId, returnResult = false) => {
  // Pattern: Three letters followed by 4 digits (e.g., STA1234)
  const pattern = /^[A-Z]{3}[0-9]{4}$/;
  const isValid = pattern.test(staffId?.toUpperCase());

  if (returnResult) {
    return isValid
      ? new ValidationResult(true)
      : new ValidationResult(
          false,
          "Staff ID must be 3 letters followed by 4 digits (e.g., STA1234)",
        );
  }

  return isValid;
};

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @param {Object} options - Validation options
 * @returns {boolean|ValidationResult} Validation result
 */
export const validateDate = (date, options = {}) => {
  const {
    required = true,
    minDate = null,
    maxDate = null,
    returnResult = false,
  } = options;

  if (!date && !required) {
    return returnResult ? new ValidationResult(true) : true;
  }

  if (!date) {
    if (returnResult) return new ValidationResult(false, "Date is required");
    return false;
  }

  const dateObj = new Date(date);
  const isValid = !isNaN(dateObj.getTime());

  if (!isValid) {
    if (returnResult)
      return new ValidationResult(false, "Please enter a valid date");
    return false;
  }

  const errors = [];

  if (minDate && dateObj < new Date(minDate)) {
    errors.push(`Date must be after ${new Date(minDate).toLocaleDateString()}`);
  }

  if (maxDate && dateObj > new Date(maxDate)) {
    errors.push(
      `Date must be before ${new Date(maxDate).toLocaleDateString()}`,
    );
  }

  if (returnResult) {
    return errors.length === 0
      ? new ValidationResult(true)
      : new ValidationResult(false, errors);
  }

  return errors.length === 0;
};

/**
 * Validate number
 * @param {*} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {boolean|ValidationResult} Validation result
 */
export const validateNumber = (value, options = {}) => {
  const {
    required = true,
    min = null,
    max = null,
    integer = false,
    positive = false,
    returnResult = false,
  } = options;

  if ((value === null || value === undefined || value === "") && !required) {
    return returnResult ? new ValidationResult(true) : true;
  }

  if (value === null || value === undefined || value === "") {
    if (returnResult) return new ValidationResult(false, "Number is required");
    return false;
  }

  const num = Number(value);
  const isValid = !isNaN(num) && isFinite(num);

  if (!isValid) {
    if (returnResult)
      return new ValidationResult(false, "Please enter a valid number");
    return false;
  }

  const errors = [];

  if (integer && !Number.isInteger(num)) {
    errors.push("Number must be an integer");
  }

  if (positive && num <= 0) {
    errors.push("Number must be positive");
  }

  if (min !== null && num < min) {
    errors.push(`Number must be at least ${min}`);
  }

  if (max !== null && num > max) {
    errors.push(`Number must be at most ${max}`);
  }

  if (returnResult) {
    return errors.length === 0
      ? new ValidationResult(true)
      : new ValidationResult(false, errors);
  }

  return errors.length === 0;
};

/**
 * Validate that value is not empty
 * @param {*} value - Value to check
 * @param {string} fieldName - Field name for error message
 * @returns {boolean|ValidationResult} Validation result
 */
export const validateNotEmpty = (
  value,
  fieldName = "This field",
  returnResult = false,
) => {
  const isValid =
    value !== null &&
    value !== undefined &&
    value !== "" &&
    (typeof value !== "string" || value.trim().length > 0);

  if (returnResult) {
    return isValid
      ? new ValidationResult(true)
      : new ValidationResult(false, `${fieldName} is required`);
  }

  return isValid;
};

/**
 * Validate minimum length
 * @param {string} value - String to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean|ValidationResult} Validation result
 */
export const validateMinLength = (value, minLength, returnResult = false) => {
  const isValid = value && value.length >= minLength;

  if (returnResult) {
    return isValid
      ? new ValidationResult(true)
      : new ValidationResult(false, `Must be at least ${minLength} characters`);
  }

  return isValid;
};

/**
 * Validate maximum length
 * @param {string} value - String to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean|ValidationResult} Validation result
 */
export const validateMaxLength = (value, maxLength, returnResult = false) => {
  const isValid = value && value.length <= maxLength;

  if (returnResult) {
    return isValid
      ? new ValidationResult(true)
      : new ValidationResult(false, `Cannot exceed ${maxLength} characters`);
  }

  return isValid;
};

// ================================
// Specialized Validators
// ================================

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {boolean|Object} Validation result
 */
export const validateUsername = (username, returnDetails = false) => {
  if (!username) {
    if (returnDetails)
      return { isValid: false, errors: ["Username is required"] };
    return false;
  }

  const errors = [];

  if (username.length < 3) {
    errors.push("Username must be at least 3 characters");
  }

  if (username.length > 20) {
    errors.push("Username cannot exceed 20 characters");
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, and underscores");
  }

  if (/^\d/.test(username)) {
    errors.push("Username cannot start with a number");
  }

  const isValid = errors.length === 0;

  if (returnDetails) {
    return { isValid, errors };
  }

  return isValid;
};

/**
 * Validate file
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = VALIDATION_LIMITS?.MAX_FILE_SIZE || 5 * 1024 * 1024,
    allowedTypes = VALIDATION_LIMITS?.ALLOWED_IMAGE_TYPES || [],
    required = false,
  } = options;

  if (!file && !required) {
    return { isValid: true, errors: [] };
  }

  if (!file) {
    return { isValid: false, errors: ["File is required"] };
  }

  const errors = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(
      `File size cannot exceed ${(maxSize / (1024 * 1024)).toFixed(2)} MB`,
    );
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    size: file.size,
    type: file.type,
    name: file.name,
  };
};

/**
 * Validate array
 * @param {Array} array - Array to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateArray = (array, options = {}) => {
  const {
    required = true,
    minLength = 0,
    maxLength = Infinity,
    unique = false,
  } = options;

  if (!array && !required) {
    return { isValid: true, errors: [] };
  }

  if (!array || !Array.isArray(array)) {
    return { isValid: false, errors: ["Must be an array"] };
  }

  const errors = [];

  if (array.length < minLength) {
    errors.push(`Must have at least ${minLength} item(s)`);
  }

  if (array.length > maxLength) {
    errors.push(`Cannot have more than ${maxLength} item(s)`);
  }

  if (unique && array.length !== new Set(array).size) {
    errors.push("Items must be unique");
  }

  return {
    isValid: errors.length === 0,
    errors,
    length: array.length,
  };
};

/**
 * Validate object properties
 * @param {Object} obj - Object to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result
 */
export const validateObject = (obj, schema) => {
  const errors = {};
  let isValid = true;

  for (const [field, validators] of Object.entries(schema)) {
    const value = obj[field];
    const fieldErrors = [];

    for (const validator of validators) {
      const result = validator(value, true);
      if (!result.isValid) {
        fieldErrors.push(...result.errors);
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// ================================
// Form Validation Helper
// ================================

/**
 * Create a form validator
 * @param {Object} rules - Validation rules
 * @returns {Function} Validator function
 */
export const createValidator = (rules) => {
  return (data) => {
    const errors = {};
    let isValid = true;

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      const result = rule(value, true);

      if (!result.isValid) {
        errors[field] = result.errors;
        isValid = false;
      }
    }

    return { isValid, errors };
  };
};

// ================================
// Export all validators
// ================================

export default {
  // Classes
  ValidationResult,

  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateName,
  validatePhone,
  validateURL,
  validateNotEmpty,
  validateMinLength,
  validateMaxLength,

  validateStudentId,
  validateStaffId,
  validateDate,
  validateNumber,
  validateUsername,
  validateFile,
  validateArray,
  validateObject,

  createValidator,
};
