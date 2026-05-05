// backend/routes/events.js - Fully Fixed Version
const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const {
  getEvents,
  getMyEvents,
  getEvent,
  getEventBySlug,
  createEvent,
  updateEvent,
  deleteEvent,
  cancelEvent,
  publishEvent,
  registerForEvent,
  cancelRegistration,
  checkIn,
  getRegistrations,
  getRegistrationStatus,
  submitFeedback,
  getEventStats,
} = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  EVENT_TYPES,
  EVENT_PARTICIPATION,
  EVENT_STATUS,
  VALIDATION,
} = require("../config/constants");

// ============================
// VALIDATION RULES
// ============================

const createEventValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({
      min: VALIDATION.EVENT_TITLE_MIN_LENGTH,
      max: VALIDATION.EVENT_TITLE_MAX_LENGTH,
    })
    .withMessage(
      `Title must be between ${VALIDATION.EVENT_TITLE_MIN_LENGTH} and ${VALIDATION.EVENT_TITLE_MAX_LENGTH} characters`,
    )
    .trim(),

  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({
      min: VALIDATION.EVENT_DESCRIPTION_MIN_LENGTH,
      max: VALIDATION.EVENT_DESCRIPTION_MAX_LENGTH,
    })
    .withMessage(
      `Description must be between ${VALIDATION.EVENT_DESCRIPTION_MIN_LENGTH} and ${VALIDATION.EVENT_DESCRIPTION_MAX_LENGTH} characters`,
    )
    .trim(),

  body("summary")
    .optional()
    .isLength({ max: VALIDATION.EVENT_SUMMARY_MAX_LENGTH })
    .withMessage(
      `Summary cannot exceed ${VALIDATION.EVENT_SUMMARY_MAX_LENGTH} characters`,
    )
    .trim(),

  body("eventType")
    .notEmpty()
    .withMessage("Event type is required")
    .isIn(Object.values(EVENT_TYPES))
    .withMessage("Invalid event type"),

  body("participationMode")
    .optional()
    .isIn(Object.values(EVENT_PARTICIPATION))
    .withMessage("Invalid participation mode"),

  body("venue").notEmpty().withMessage("Venue is required").trim(),

  body("onlineLink").optional().isURL().withMessage("Invalid URL format"),

  body("eventDate")
    .notEmpty()
    .withMessage("Event date is required")
    .isISO8601()
    .withMessage("Invalid date format")
    .toDate()
    .custom((value) => value > new Date())
    .withMessage("Event date must be in the future"),

  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),

  body("endTime")
    .notEmpty()
    .withMessage("End time is required")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),

  body("capacity")
    .optional()
    .isInt({
      min: VALIDATION.EVENT_MIN_CAPACITY,
      max: VALIDATION.EVENT_MAX_CAPACITY,
    })
    .withMessage(
      `Capacity must be between ${VALIDATION.EVENT_MIN_CAPACITY} and ${VALIDATION.EVENT_MAX_CAPACITY}`,
    )
    .toInt(),

  body("registrationDeadline")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format")
    .toDate(),

  body("registrationFee")
    .optional()
    .isFloat({ min: 0, max: VALIDATION.EVENT_MAX_FEE })
    .withMessage(`Registration fee cannot exceed ${VALIDATION.EVENT_MAX_FEE}`)
    .toFloat(),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array")
    .isLength({ max: VALIDATION.EVENT_TAGS_MAX_COUNT })
    .withMessage(`Maximum ${VALIDATION.EVENT_TAGS_MAX_COUNT} tags allowed`),

  body("targetDepartments")
    .optional()
    .isArray()
    .withMessage("Target departments must be an array"),

  body("targetRoles")
    .optional()
    .isArray()
    .withMessage("Target roles must be an array"),
];

const updateEventValidation = [
  param("id").isMongoId().withMessage("Invalid event ID"),

  body("title")
    .optional()
    .isLength({
      min: VALIDATION.EVENT_TITLE_MIN_LENGTH,
      max: VALIDATION.EVENT_TITLE_MAX_LENGTH,
    })
    .withMessage(
      `Title must be between ${VALIDATION.EVENT_TITLE_MIN_LENGTH} and ${VALIDATION.EVENT_TITLE_MAX_LENGTH} characters`,
    )
    .trim(),

  body("eventType")
    .optional()
    .isIn(Object.values(EVENT_TYPES))
    .withMessage("Invalid event type"),

  body("capacity")
    .optional()
    .isInt({
      min: VALIDATION.EVENT_MIN_CAPACITY,
      max: VALIDATION.EVENT_MAX_CAPACITY,
    })
    .withMessage(
      `Capacity must be between ${VALIDATION.EVENT_MIN_CAPACITY} and ${VALIDATION.EVENT_MAX_CAPACITY}`,
    )
    .toInt(),
];

const getEventsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("eventType")
    .optional()
    .isIn(Object.values(EVENT_TYPES))
    .withMessage("Invalid event type"),

  query("participationMode")
    .optional()
    .isIn(Object.values(EVENT_PARTICIPATION))
    .withMessage("Invalid participation mode"),

  query("status")
    .optional()
    .isIn(Object.values(EVENT_STATUS))
    .withMessage("Invalid status"),

  query("search").optional().trim(),

  query("fromDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format")
    .toDate(),

  query("toDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format")
    .toDate(),

  query("sort")
    .optional()
    .isIn(["latest", "oldest", "popular"])
    .withMessage("Invalid sort option"),
];

const registerValidation = [
  param("id").isMongoId().withMessage("Invalid event ID"),
];

const cancelRegistrationValidation = [
  param("id").isMongoId().withMessage("Invalid event ID"),
];

const checkInValidation = [
  param("id").isMongoId().withMessage("Invalid event ID"),
  body("userId").isMongoId().withMessage("Invalid user ID"),
  body("location").optional().trim(),
];

const submitFeedbackValidation = [
  param("id").isMongoId().withMessage("Invalid event ID"),
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5")
    .toInt(),
  body("comment")
    .optional()
    .isLength({ max: VALIDATION.MAX_COMMENT_LENGTH })
    .withMessage(
      `Comment cannot exceed ${VALIDATION.MAX_COMMENT_LENGTH} characters`,
    )
    .trim(),
  body("isAnonymous")
    .optional()
    .isBoolean()
    .withMessage("isAnonymous must be a boolean"),
];

const idParamValidation = [
  param("id").isMongoId().withMessage("Invalid event ID"),
];

const slugParamValidation = [
  param("slug").notEmpty().withMessage("Slug is required").trim(),
];

// ============================
// PUBLIC ROUTES (No authentication required)
// ============================
router.get("/", getEventsValidation, getEvents);
router.get("/stats", getEventStats);
router.get("/slug/:slug", slugParamValidation, getEventBySlug);
router.get("/:id", idParamValidation, getEvent);

// ============================
// PROTECTED ROUTES (Authentication required)
// ============================
router.use(protect);

// User routes
router.get("/my-events", getMyEvents);
router.post("/:id/register", registerValidation, registerForEvent);
router.delete(
  "/:id/register",
  cancelRegistrationValidation,
  cancelRegistration,
);
router.get(
  "/:id/registration-status",
  idParamValidation,
  getRegistrationStatus,
);
router.post("/:id/feedback", submitFeedbackValidation, submitFeedback);

// ============================
// ADMIN / FACULTY / SUPER_ADMIN ROUTES
// FIX: "super_admin" added to every authorize() call below.
// Previously only "admin" and "faculty" were listed, which
// caused super_admin users to receive a 403 on all write
// operations (create, update, publish, cancel, checkin).
// ============================

router.post(
  "/",
  authorize("admin", "super_admin", "faculty"),
  createEventValidation,
  createEvent,
);

router.put(
  "/:id",
  authorize("admin", "super_admin", "faculty"),
  updateEventValidation,
  updateEvent,
);

router.put(
  "/:id/cancel",
  authorize("admin", "super_admin", "faculty"),
  idParamValidation,
  cancelEvent,
);

router.put(
  "/:id/publish",
  authorize("admin", "super_admin", "faculty"),
  idParamValidation,
  publishEvent,
);

router.get(
  "/:id/registrations",
  authorize("admin", "super_admin", "faculty"),
  idParamValidation,
  getRegistrations,
);

router.put(
  "/:id/checkin",
  authorize("admin", "super_admin", "faculty"),
  checkInValidation,
  checkIn,
);

// Delete — admin and super_admin only (faculty excluded intentionally)
router.delete(
  "/:id",
  authorize("admin", "super_admin"),
  idParamValidation,
  deleteEvent,
);

module.exports = router;
