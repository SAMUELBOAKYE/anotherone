// backend/routes/auth.js
// PROFESSIONAL AUTHENTICATION ROUTES
// @version 2.0.0

const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");

// ============================================================
// IMPORTS
// ============================================================

const authController = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");
const { HTTP_STATUS, USER_ROLES } = require("../config/constants");
const rateLimit = require("../middleware/rateLimit");

// ============================================================
// MULTER CONFIGURATION FOR ID UPLOADS
// ============================================================

// Ensure upload directory exists SYNCHRONOUSLY
const uploadDir = path.join(__dirname, "../uploads/temp");
if (!fsSync.existsSync(uploadDir)) {
  fsSync.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ Created upload directory:", uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `id-${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
      ),
      false,
    );
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "File is too large. Maximum size is 5MB.",
      });
    }
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

// ============================================================
// VALIDATION RULES
// ============================================================

/**
 * Registration validation rules
 */
const registerValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[A-Za-z\s\-']+$/)
    .withMessage("First name contains invalid characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[A-Za-z\s\-']+$/)
    .withMessage("Last name contains invalid characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      "Password must contain uppercase, lowercase, number, and special character",
    ),

  body("phone")
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage("Invalid phone number format"),

  body("role")
    .optional()
    .isIn(["student", "faculty"])
    .withMessage("Role must be either 'student' or 'faculty'"),

  body("yearOfStudy")
    .if(body("role").equals("student"))
    .notEmpty()
    .withMessage("Year of study is required for students")
    .isInt({ min: 1, max: 6 })
    .withMessage("Year of study must be between 1 and 6"),

  body("designation")
    .if(body("role").equals("faculty"))
    .notEmpty()
    .withMessage("Designation is required for faculty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Designation must be between 2 and 100 characters"),

  body("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department name is too long"),

  body("idVerified")
    .if(body("role").equals("student"))
    .notEmpty()
    .withMessage("ID verification is required")
    .equals("true")
    .withMessage("Student ID must be verified before registration"),
];

/**
 * Login validation rules
 */
const loginValidation = [
  body("identifier")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email or username is required"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Password reset validation
 */
const forgotPasswordValidation = [
  body("identifier")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email or username is required"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
];

/**
 * Reset password validation
 */
const resetPasswordValidation = [
  param("token")
    .notEmpty()
    .withMessage("Reset token is required")
    .isLength({ min: 10 })
    .withMessage("Invalid reset token"),

  body("password")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      "Password must contain uppercase, lowercase, number, and special character",
    ),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
];

/**
 * Change password validation
 */
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      "Password must contain uppercase, lowercase, number, and special character",
    ),

  body("confirmNewPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Passwords do not match"),
];

/**
 * Update profile validation
 */
const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[A-Za-z\s\-']+$/)
    .withMessage("First name contains invalid characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[A-Za-z\s\-']+$/)
    .withMessage("Last name contains invalid characters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage("Invalid phone number format"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must not exceed 500 characters"),

  body("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department name is too long"),

  body("designation")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Designation is too long"),
];

/**
 * Email verification validation
 */
const emailVerificationValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
];

// ============================================================
// PUBLIC ROUTES (NO AUTHENTICATION REQUIRED)
// ============================================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/register",
  rateLimit.auth.register,
  registerValidation,
  authController.register,
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get tokens
 * @access  Public
 */
router.post(
  "/login",
  rateLimit.auth.login,
  loginValidation,
  authController.login,
);

/**
 * @route   POST /api/auth/verify-student-id
 * @desc    Verify student ID using AI vision
 * @access  Public
 */
router.post(
  "/verify-student-id",
  rateLimit.api.standard,
  (req, res, next) => {
    upload.single("idImage")(req, res, (err) => {
      handleMulterError(err, req, res, next);
    });
  },
  authController.verifyStudentId,
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  "/forgot-password",
  rateLimit.auth.passwordReset,
  forgotPasswordValidation,
  authController.forgotPassword,
);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
router.post(
  "/reset-password/:token",
  rateLimit.auth.passwordReset,
  resetPasswordValidation,
  authController.resetPassword,
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get("/verify-email/:token", authController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post(
  "/resend-verification",
  rateLimit.auth.standard,
  emailVerificationValidation,
  authController.resendVerification,
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  "/refresh-token",
  rateLimit.auth.standard,
  authController.refreshToken,
);

// ============================================================
// PROTECTED ROUTES (AUTHENTICATION REQUIRED)
// ============================================================

// Apply authentication middleware to all routes below
router.use(protect);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authController.getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put("/profile", updateProfileValidation, authController.updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated)
 * @access  Private
 */
router.post(
  "/change-password",
  changePasswordValidation,
  authController.changePassword,
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate tokens
 * @access  Private
 */
router.post("/logout", authController.logout);

/**
 * @route   POST /api/auth/avatar
 * @desc    Upload profile avatar
 * @access  Private
 */
router.post(
  "/avatar",
  (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      handleMulterError(err, req, res, next);
    });
  },
  authController.uploadAvatar,
);

/**
 * @route   DELETE /api/auth/avatar
 * @desc    Delete profile avatar
 * @access  Private
 */
router.delete("/avatar", authController.deleteAvatar);

// ============================================================
// ADMIN ROUTES (ADMIN/FACULTY ONLY)
// ============================================================

/**
 * @route   POST /api/auth/admin/verify-account/:userId
 * @desc    Verify user account (admin only)
 * @access  Private (Admin, Faculty)
 */
router.post(
  "/admin/verify-account/:userId",
  authorize(USER_ROLES.ADMIN, USER_ROLES.FACULTY),
  authController.verifyAccount,
);

/**
 * @route   POST /api/auth/admin/verify-student/:userId
 * @desc    Verify student account (admin only)
 * @access  Private (Admin, Faculty)
 */
router.post(
  "/admin/verify-student/:userId",
  authorize(USER_ROLES.ADMIN, USER_ROLES.FACULTY),
  authController.verifyStudent,
);

/**
 * @route   POST /api/auth/admin/verify-faculty/:userId
 * @desc    Verify faculty account (admin only)
 * @access  Private (Admin)
 */
router.post(
  "/admin/verify-faculty/:userId",
  authorize(USER_ROLES.ADMIN),
  authController.verifyFaculty,
);

// ============================================================
// SUPER ADMIN ROUTES
// ============================================================

/**
 * @route   POST /api/auth/super-admin/approve/:userId
 * @desc    Approve admin user (super admin only)
 * @access  Private (Super Admin)
 */
router.post(
  "/super-admin/approve/:userId",
  authorize(USER_ROLES.SUPER_ADMIN),
  authController.approveAdmin,
);

/**
 * @route   POST /api/auth/super-admin/reject/:userId
 * @desc    Reject admin user (super admin only)
 * @access  Private (Super Admin)
 */
router.post(
  "/super-admin/reject/:userId",
  authorize(USER_ROLES.SUPER_ADMIN),
  authController.rejectAdmin,
);

// ============================================================
// EXPORTS
// ============================================================

module.exports = router;


