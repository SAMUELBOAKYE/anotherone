// routes/noticeRoutes.js
// Enterprise-Grade Notice Routes for KAAF Noticeboard System
// Handles all notice-related endpoints with proper validation and authorization
// @version 2.1.0
// @author Boakye Samuel Yiadom

const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const {
  getNotices,
  getMyNotices,
  getNotice,
  getNoticeBySlug,
  createNotice,
  updateNotice,
  deleteNotice,
  publishNotice,
  archiveNotice,
  togglePin,
  toggleLike,
  addComment,
  getComments,
  getNoticeStats,
  getAdminNotices,
  resendSMSNotifications,
} = require("../controllers/noticeController");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  NOTICE_CATEGORIES,
  NOTICE_PRIORITY,
  VALIDATION,
} = require("../config/constants");

// ============================================================
// VALIDATION RULES
// ============================================================

const createNoticeValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({
      min: VALIDATION.TITLE_MIN_LENGTH,
      max: VALIDATION.TITLE_MAX_LENGTH,
    })
    .withMessage(
      `Title must be between ${VALIDATION.TITLE_MIN_LENGTH} and ${VALIDATION.TITLE_MAX_LENGTH} characters`,
    )
    .trim(),

  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isLength({
      min: VALIDATION.DESCRIPTION_MIN_LENGTH,
      max: VALIDATION.DESCRIPTION_MAX_LENGTH,
    })
    .withMessage(
      `Content must be between ${VALIDATION.DESCRIPTION_MIN_LENGTH} and ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`,
    )
    .trim(),

  body("summary")
    .optional()
    .isLength({ max: VALIDATION.SUMMARY_MAX_LENGTH })
    .withMessage(
      `Summary cannot exceed ${VALIDATION.SUMMARY_MAX_LENGTH} characters`,
    )
    .trim(),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn(Object.values(NOTICE_CATEGORIES))
    .withMessage("Invalid category"),

  body("priority")
    .optional()
    .isIn(Object.values(NOTICE_PRIORITY))
    .withMessage("Invalid priority"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array")
    .isLength({ max: VALIDATION.TAGS_MAX_COUNT })
    .withMessage(`Maximum ${VALIDATION.TAGS_MAX_COUNT} tags allowed`),

  body("targetDepartments")
    .optional()
    .isArray()
    .withMessage("Target departments must be an array"),

  body("targetRoles")
    .optional()
    .isArray()
    .withMessage("Target roles must be an array"),

  body("expiresAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format")
    .toDate(),

  body("isImportant")
    .optional()
    .isBoolean()
    .withMessage("isImportant must be a boolean"),

  body("isPinned")
    .optional()
    .isBoolean()
    .withMessage("isPinned must be a boolean"),
];

const updateNoticeValidation = [
  param("id").isMongoId().withMessage("Invalid notice ID"),

  body("title")
    .optional()
    .isLength({
      min: VALIDATION.TITLE_MIN_LENGTH,
      max: VALIDATION.TITLE_MAX_LENGTH,
    })
    .withMessage(
      `Title must be between ${VALIDATION.TITLE_MIN_LENGTH} and ${VALIDATION.TITLE_MAX_LENGTH} characters`,
    )
    .trim(),

  body("content")
    .optional()
    .isLength({
      min: VALIDATION.DESCRIPTION_MIN_LENGTH,
      max: VALIDATION.DESCRIPTION_MAX_LENGTH,
    })
    .withMessage(
      `Content must be between ${VALIDATION.DESCRIPTION_MIN_LENGTH} and ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`,
    )
    .trim(),

  body("category")
    .optional()
    .isIn(Object.values(NOTICE_CATEGORIES))
    .withMessage("Invalid category"),

  body("priority")
    .optional()
    .isIn(Object.values(NOTICE_PRIORITY))
    .withMessage("Invalid priority"),
];

const getNoticesValidation = [
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

  query("category")
    .optional()
    .isIn(Object.values(NOTICE_CATEGORIES))
    .withMessage("Invalid category"),

  query("priority")
    .optional()
    .isIn(Object.values(NOTICE_PRIORITY))
    .withMessage("Invalid priority"),

  query("search").optional().trim(),

  query("sort")
    .optional()
    .isIn(["latest", "oldest", "priority", "views"])
    .withMessage("Invalid sort option"),
];

const addCommentValidation = [
  param("id").isMongoId().withMessage("Invalid notice ID"),

  body("content")
    .notEmpty()
    .withMessage("Comment content is required")
    .isLength({ max: VALIDATION.MAX_COMMENT_LENGTH })
    .withMessage(
      `Comment cannot exceed ${VALIDATION.MAX_COMMENT_LENGTH} characters`,
    )
    .trim(),
];

const idParamValidation = [
  param("id").isMongoId().withMessage("Invalid notice ID"),
];

const slugParamValidation = [
  param("slug").notEmpty().withMessage("Slug is required").trim(),
];

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================

router.get("/", getNoticesValidation, getNotices);
router.get("/slug/:slug", slugParamValidation, getNoticeBySlug);
router.get("/:id", idParamValidation, getNotice);
router.get("/:id/comments", idParamValidation, getComments);

// ============================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================

router.use(protect);

// User routes
router.get("/my-notices", getMyNotices);
router.post("/:id/like", idParamValidation, toggleLike);
router.post("/:id/comments", addCommentValidation, addComment);

// ============================================================
// ADMIN ROUTES (Admin only)
// ============================================================

router.get("/admin", authorize("admin", "super_admin"), getAdminNotices);
router.get("/stats", authorize("admin", "super_admin"), getNoticeStats);
router.post(
  "/:id/resend-sms",
  authorize("admin", "super_admin"),
  idParamValidation,
  resendSMSNotifications,
);

// ============================================================
// ADMIN & FACULTY ROUTES
// ============================================================

router.post(
  "/",
  authorize("admin", "faculty"),
  createNoticeValidation,
  createNotice,
);
router.put(
  "/:id",
  authorize("admin", "faculty"),
  updateNoticeValidation,
  updateNotice,
);
router.delete("/:id", authorize("admin", "super_admin"), idParamValidation, deleteNotice);
router.put(
  "/:id/publish",
  authorize("admin", "faculty"),
  idParamValidation,
  publishNotice,
);
router.put(
  "/:id/archive",
  authorize("admin", "faculty"),
  idParamValidation,
  archiveNotice,
);
router.put(
  "/:id/pin",
  authorize("admin", "faculty"),
  idParamValidation,
  togglePin,
);

module.exports = router;

