// src/utils/eventValidation.js - Complete Event Validation Utilities

// ============================================================
// MAIN VALIDATION FUNCTIONS
// ============================================================

/**
 * Validate event data
 * @param {Object} eventData - Event data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export const validateEventData = (eventData) => {
  const errors = [];

  // Title validation
  if (!eventData.title || eventData.title.trim().length === 0) {
    errors.push("Event title is required");
  } else if (eventData.title.trim().length < 3) {
    errors.push("Title must be at least 3 characters long");
  } else if (eventData.title.trim().length > 200) {
    errors.push("Title cannot exceed 200 characters");
  }

  // Description validation
  if (!eventData.description || eventData.description.trim().length === 0) {
    errors.push("Event description is required");
  } else if (eventData.description.trim().length < 10) {
    errors.push("Description must be at least 10 characters long");
  } else if (eventData.description.trim().length > 5000) {
    errors.push("Description cannot exceed 5000 characters");
  }

  // Date validation
  if (!eventData.date) {
    errors.push("Event date is required");
  } else {
    const eventDate = new Date(eventData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(eventDate.getTime())) {
      errors.push("Invalid event date format");
    } else if (eventDate < today) {
      errors.push("Event date must be in the future");
    }
  }

  // Time validation
  if (!eventData.time && !eventData.startTime) {
    errors.push("Event time is required");
  } else if (eventData.time) {
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(eventData.time)) {
      errors.push("Invalid time format. Use HH:MM (24-hour format)");
    }
  }

  // Location validation
  if (!eventData.location || eventData.location.trim().length === 0) {
    errors.push("Event location is required");
  } else if (eventData.location.trim().length < 2) {
    errors.push("Location must be at least 2 characters long");
  } else if (eventData.location.trim().length > 255) {
    errors.push("Location cannot exceed 255 characters");
  }

  // Category validation - IMPROVED VERSION
  const validCategories = [
    "conference",
    "workshop",
    "seminar",
    "webinar",
    "social",
    "sports",
    "career",
    "academic",
    "cultural",
    "general",
    "other",
  ];

  // Check if category exists AND is not empty string
  if (!eventData.category || eventData.category.trim() === "") {
    errors.push("Event category is required");
  } else if (!validCategories.includes(eventData.category.toLowerCase())) {
    errors.push(`Invalid category. Allowed: ${validCategories.join(", ")}`);
  }

  // Capacity validation
  if (
    eventData.capacity !== undefined &&
    eventData.capacity !== null &&
    eventData.capacity !== ""
  ) {
    const capacity = parseInt(eventData.capacity);
    if (isNaN(capacity)) {
      errors.push("Capacity must be a valid number");
    } else if (capacity < 1) {
      errors.push("Capacity must be at least 1");
    } else if (capacity > 10000) {
      errors.push("Capacity cannot exceed 10,000");
    }
  }

  // Price validation
  if (eventData.price && !eventData.isFree) {
    const price = parseFloat(eventData.price);
    if (isNaN(price)) {
      errors.push("Price must be a valid number");
    } else if (price < 0) {
      errors.push("Price cannot be negative");
    } else if (price > 10000) {
      errors.push("Price cannot exceed 10,000");
    }
  }

  // Virtual link validation
  if (eventData.isVirtual && eventData.virtualLink) {
    const urlPattern =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(eventData.virtualLink)) {
      errors.push("Please enter a valid URL for the virtual event link");
    }
  }

  // Contact email validation
  if (eventData.contactEmail) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(eventData.contactEmail)) {
      errors.push("Please enter a valid contact email address");
    }
  }

  // Registration deadline validation
  if (eventData.registrationDeadline) {
    const deadline = new Date(eventData.registrationDeadline);
    const eventDate = new Date(eventData.date);

    if (isNaN(deadline.getTime())) {
      errors.push("Invalid registration deadline date format");
    } else if (deadline > eventDate) {
      errors.push("Registration deadline must be before the event date");
    } else if (deadline < new Date()) {
      errors.push("Registration deadline cannot be in the past");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    errorCount: errors.length,
  };
};

/**
 * Sanitize event data - Remove dangerous characters and trim
 * @param {Object} eventData - Raw event data
 * @returns {Object} Sanitized event data
 */
export const sanitizeEventData = (eventData) => {
  const sanitized = {};

  // String fields - trim and remove dangerous characters
  const stringFields = [
    "title",
    "description",
    "summary",
    "location",
    "venue",
    "virtualLink",
    "contactEmail",
    "contactPhone",
    "additionalInfo",
  ];

  for (const field of stringFields) {
    if (eventData[field] !== undefined && eventData[field] !== null) {
      let value =
        typeof eventData[field] === "string"
          ? eventData[field].trim()
          : String(eventData[field]);
      // Remove HTML tags and dangerous characters
      value = value.replace(/[<>]/g, "");
      sanitized[field] = value;
    }
  }

  // Numeric fields
  if (
    eventData.capacity !== undefined &&
    eventData.capacity !== null &&
    eventData.capacity !== ""
  ) {
    sanitized.capacity = parseInt(eventData.capacity);
    if (isNaN(sanitized.capacity)) {
      sanitized.capacity = null;
    }
  }

  if (
    eventData.price !== undefined &&
    eventData.price !== null &&
    !eventData.isFree
  ) {
    sanitized.price = parseFloat(eventData.price);
    if (isNaN(sanitized.price)) {
      sanitized.price = 0;
    }
  } else {
    sanitized.price = 0;
  }

  // Boolean fields
  sanitized.isFree = eventData.isFree === true || eventData.isFree === "true";
  sanitized.isVirtual =
    eventData.isVirtual === true || eventData.isVirtual === "true";
  sanitized.isPublished = eventData.isPublished !== false;

  // Date fields
  if (eventData.date) {
    sanitized.date = new Date(eventData.date);
    if (isNaN(sanitized.date.getTime())) {
      delete sanitized.date;
    }
  }

  if (eventData.endDate) {
    sanitized.endDate = new Date(eventData.endDate);
    if (isNaN(sanitized.endDate.getTime())) {
      delete sanitized.endDate;
    }
  }

  // Handle time
  if (eventData.time || eventData.startTime) {
    const timeValue = eventData.time || eventData.startTime;
    const [hours, minutes] = timeValue.split(":");
    if (sanitized.date && hours && minutes) {
      sanitized.date.setHours(parseInt(hours), parseInt(minutes));
    }
  }

  if (eventData.registrationDeadline) {
    sanitized.registrationDeadline = new Date(eventData.registrationDeadline);
    if (isNaN(sanitized.registrationDeadline.getTime())) {
      delete sanitized.registrationDeadline;
    }
  }

  // Array fields
  if (eventData.speakers && Array.isArray(eventData.speakers)) {
    sanitized.speakers = eventData.speakers
      .filter((s) => s && typeof s === "string" && s.trim())
      .map((s) => s.trim().substring(0, 100));
  }

  if (eventData.tags && Array.isArray(eventData.tags)) {
    sanitized.tags = eventData.tags
      .filter((t) => t && typeof t === "string" && t.trim())
      .map((t) => t.trim().toLowerCase().substring(0, 30));
  }

  // Category - IMPROVED VERSION with "general" as default
  const validCategories = [
    "conference",
    "workshop",
    "seminar",
    "webinar",
    "social",
    "sports",
    "career",
    "academic",
    "cultural",
    "general",
    "other",
  ];

  if (
    eventData.category &&
    validCategories.includes(eventData.category.toLowerCase())
  ) {
    sanitized.category = eventData.category.toLowerCase();
  } else if (!eventData.category || eventData.category.trim() === "") {
    // Set default category if none provided
    sanitized.category = "general";
  } else {
    sanitized.category = "general"; // Default fallback
  }

  // Status
  const validStatuses = [
    "upcoming",
    "ongoing",
    "completed",
    "cancelled",
    "draft",
  ];
  if (eventData.status && validStatuses.includes(eventData.status)) {
    sanitized.status = eventData.status;
  } else {
    sanitized.status = "draft";
  }

  // Participation mode
  const validParticipationModes = ["physical", "virtual", "hybrid"];
  if (
    eventData.participationMode &&
    validParticipationModes.includes(eventData.participationMode)
  ) {
    sanitized.participationMode = eventData.participationMode;
  } else if (eventData.isVirtual) {
    sanitized.participationMode = "virtual";
  } else {
    sanitized.participationMode = "physical";
  }

  // Organizer
  if (eventData.organizer) {
    sanitized.organizer = eventData.organizer.trim().substring(0, 100);
  }

  if (eventData.organizerEmail) {
    sanitized.organizerEmail = eventData.organizerEmail.trim().toLowerCase();
  }

  return sanitized;
};

/**
 * Validate image file
 * @param {File} file - Image file
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateImageFile = (file, options = {}) => {
  const maxSize = options.maxSize || 5 * 1024 * 1024;
  const allowedTypes = options.allowedTypes || [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ];

  if (!file) {
    return { isValid: false, error: "No file selected" };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size too large. Maximum: ${maxSizeMB}MB (Your file: ${fileSizeMB}MB)`,
    };
  }

  return { isValid: true, error: null };
};

// ============================================================
// ADDITIONAL VALIDATION FUNCTIONS
// ============================================================

/**
 * Validate event dates
 * @param {Object} dates - Date object with start and end dates
 * @returns {Object} Validation result
 */
export const validateEventDates = (dates) => {
  const errors = [];

  if (!dates.startDate) {
    errors.push("Start date is required");
  }

  if (!dates.endDate) {
    errors.push("End date is required");
  }

  if (dates.startDate && dates.endDate) {
    const start = new Date(dates.startDate);
    const end = new Date(dates.endDate);

    if (start > end) {
      errors.push("End date must be after start date");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      errors.push("Start date cannot be in the past");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate event capacity
 * @param {number} capacity - Event capacity
 * @param {number} maxCapacity - Maximum allowed capacity
 * @returns {Object} Validation result
 */
export const validateEventCapacity = (capacity, maxCapacity = 10000) => {
  const errors = [];

  if (capacity === undefined || capacity === null) {
    return { isValid: true, errors: [] };
  }

  const numCapacity = parseInt(capacity);

  if (isNaN(numCapacity)) {
    errors.push("Capacity must be a valid number");
  } else if (numCapacity < 1) {
    errors.push("Capacity must be at least 1");
  } else if (numCapacity > maxCapacity) {
    errors.push(`Capacity cannot exceed ${maxCapacity.toLocaleString()}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: numCapacity,
  };
};

/**
 * Validate event registration
 * @param {Object} registrationData - Registration data
 * @returns {Object} Validation result
 */
export const validateRegistration = (registrationData) => {
  const errors = [];

  if (
    !registrationData.fullName ||
    registrationData.fullName.trim().length < 2
  ) {
    errors.push("Full name is required (minimum 2 characters)");
  }

  if (!registrationData.email) {
    errors.push("Email address is required");
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(registrationData.email)) {
      errors.push("Please enter a valid email address");
    }
  }

  if (!registrationData.phone) {
    errors.push("Phone number is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get field validation rules
 * @returns {Object} Validation rules for each field
 */
export const getValidationRules = () => {
  return {
    title: {
      required: true,
      minLength: 3,
      maxLength: 200,
      message: "Title must be between 3 and 200 characters",
    },
    description: {
      required: true,
      minLength: 10,
      maxLength: 5000,
      message: "Description must be between 10 and 5000 characters",
    },
    date: {
      required: true,
      future: true,
      message: "Event date must be in the future",
    },
    location: {
      required: true,
      minLength: 2,
      maxLength: 255,
      message: "Location must be between 2 and 255 characters",
    },
    category: {
      required: true,
      defaultValue: "general",
      message: "Category is required",
    },
    capacity: {
      required: false,
      min: 1,
      max: 10000,
      message: "Capacity must be between 1 and 10,000",
    },
  };
};

/**
 * Get list of valid categories
 * @returns {Array} List of valid categories
 */
export const getValidCategories = () => {
  return [
    { value: "conference", label: "Conference" },
    { value: "workshop", label: "Workshop" },
    { value: "seminar", label: "Seminar" },
    { value: "webinar", label: "Webinar" },
    { value: "social", label: "Social Event" },
    { value: "sports", label: "Sports" },
    { value: "career", label: "Career Fair" },
    { value: "academic", label: "Academic" },
    { value: "cultural", label: "Cultural" },
    { value: "general", label: "General" },
    { value: "other", label: "Other" },
  ];
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

const eventValidation = {
  validateEventData,
  sanitizeEventData,
  validateImageFile,
  validateEventDates,
  validateEventCapacity,
  validateRegistration,
  getValidationRules,
  getValidCategories,
};

export default eventValidation;
