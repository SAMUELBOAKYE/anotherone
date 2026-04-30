const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { USER_ROLES, VALIDATION } = require("../config/constants");
const User = require("../models/User");

// ============================
// MULTER — STUDENT ID UPLOAD
// ============================

// Ensure temp directory exists
const tempDir = path.join(__dirname, "..", "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`📁 Created temp directory: ${tempDir}`);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "student-id-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const studentIdUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, and WebP images are accepted"));
    }
  },
});

// ============================
// SHARED VALIDATORS
// ============================

const passwordStrengthValidator = body("password")
  .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
  .withMessage(
    `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
  )
  .custom((val) => {
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasDigit = /[0-9]/.test(val);
    const hasSpecial = /[^A-Za-z0-9]/.test(val);
    return hasUpper && hasLower && hasDigit && hasSpecial;
  })
  .withMessage(
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  );

const optionalPasswordValidator = body("newPassword")
  .optional()
  .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
  .withMessage(
    `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
  )
  .custom((val) => {
    if (!val) return true;
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasDigit = /[0-9]/.test(val);
    const hasSpecial = /[^A-Za-z0-9]/.test(val);
    return hasUpper && hasLower && hasDigit && hasSpecial;
  })
  .withMessage(
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  );

// ============================
// REGISTER VALIDATION
// ============================

const registerValidation = [
  body("firstName")
    .notEmpty()
    .withMessage("First name is required")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(VALIDATION.NAME_PATTERN)
    .withMessage(
      "First name can only contain letters, spaces, hyphens, and apostrophes",
    ),

  body("lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(VALIDATION.NAME_PATTERN)
    .withMessage(
      "Last name can only contain letters, spaces, hyphens, and apostrophes",
    ),

  body("email")
    .isEmail()
    .withMessage("Valid email required")
    .normalizeEmail()
    .custom(async (email) => {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) throw new Error("Email already exists");
      return true;
    }),

  passwordStrengthValidator,

  body("role")
    .optional()
    .isIn(Object.values(USER_ROLES))
    .withMessage("Invalid role selected"),

  body("username")
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores")
    .trim()
    .custom(async (username) => {
      if (username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) throw new Error("Username already exists");
      }
      return true;
    }),

  body("phone")
    .optional()
    .matches(VALIDATION.PHONE_PATTERN)
    .withMessage("Please provide a valid phone number"),

  body("department").optional().trim(),

  body("yearOfStudy")
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage("Year of study must be between 1 and 6"),

  body("designation")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Designation must be between 2 and 100 characters"),
];

// ============================
// LOGIN VALIDATION
// ============================

const loginValidation = [
  body("identifier")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email/Username is required"),
  body("email").optional().trim(),
  body("password").notEmpty().withMessage("Password required"),
];

// ============================
// UPDATE PROFILE VALIDATION
// ============================

const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(VALIDATION.NAME_PATTERN)
    .withMessage(
      "First name can only contain letters, spaces, hyphens, and apostrophes",
    ),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(VALIDATION.NAME_PATTERN)
    .withMessage(
      "Last name can only contain letters, spaces, hyphens, and apostrophes",
    ),

  body("phone")
    .optional()
    .matches(VALIDATION.PHONE_PATTERN)
    .withMessage("Please provide a valid phone number"),

  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),

  body("department").optional().trim(),
];

// ============================
// CHANGE PASSWORD VALIDATION
// ============================

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password required"),
  optionalPasswordValidator,
  body("confirmNewPassword")
    .custom((val, { req }) => val === req.body.newPassword)
    .withMessage("Passwords do not match"),
];

// ============================
// FORGOT PASSWORD VALIDATION
// ============================

const forgotPasswordValidation = [
  body("identifier")
    .notEmpty()
    .withMessage("Email or username is required")
    .trim(),
];

// ============================
// RESET PASSWORD VALIDATION
// ============================

const resetPasswordValidation = [
  body("password")
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(
      `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
    )
    .custom((val) => {
      const hasUpper = /[A-Z]/.test(val);
      const hasLower = /[a-z]/.test(val);
      const hasDigit = /[0-9]/.test(val);
      const hasSpecial = /[^A-Za-z0-9]/.test(val);
      return hasUpper && hasLower && hasDigit && hasSpecial;
    })
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
  body("confirmPassword")
    .custom((val, { req }) => val === req.body.password)
    .withMessage("Passwords do not match"),
];

// ============================
// RESEND VERIFICATION VALIDATION
// ============================

const resendVerificationValidation = [
  body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
];

// ============================
// PUBLIC ROUTES
// ============================

// Registration
router.post("/register", registerValidation, authController.register);

// Login
router.post("/login", loginValidation, authController.login);

// Student ID verification - ALWAYS SUCCEEDS IN DEVELOPMENT
router.post(
  "/verify-student-id",
  (req, res, next) => {
    console.log("=".repeat(50));
    console.log("🔵 VERIFY-STUDENT-ID ROUTE HIT");
    console.log(`📝 Content-Type: ${req.headers["content-type"]}`);
    console.log("=".repeat(50));
    next();
  },
  studentIdUpload.single("studentIdImage"),
  (req, res, next) => {
    console.log(
      `📁 File upload result: ${req.file ? "File received: " + req.file.originalname : "No file received"}`,
    );
    next();
  },
  authController.verifyStudentId,
);

// Password reset flows
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  authController.forgotPassword,
);
router.put(
  "/reset-password/:token",
  resetPasswordValidation,
  authController.resetPassword,
);

// Token refresh
router.post("/refresh-token", authController.refreshToken);

// Email verification
router.get("/verify-email/:token", authController.verifyEmail);
router.post(
  "/resend-verification",
  resendVerificationValidation,
  authController.resendVerification,
);

// ============================
// PROTECTED ROUTES (require authentication)
// ============================

router.use(protect);

// User profile
router.get("/me", authController.getMe);
router.put(
  "/update-profile",
  updateProfileValidation,
  authController.updateProfile,
);
router.put(
  "/change-password",
  changePasswordValidation,
  authController.changePassword,
);
router.post("/logout", authController.logout);

// Avatar management
router.post("/upload-avatar", authController.uploadAvatar);
router.delete("/avatar", authController.deleteAvatar);

// ============================
// ACCOUNT MANAGEMENT
// ============================

router.delete("/account", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    await user.softDelete(req.user.id);
    res.clearCookie("token");
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// ============================
// SESSION MANAGEMENT
// ============================

router.get("/sessions", (req, res) => {
  res.json({
    success: true,
    message: "Sessions feature coming soon",
    data: [],
  });
});

router.delete("/sessions/:id", (req, res) => {
  res.json({ success: true, message: "Session terminated" });
});

// ============================
// VERIFICATION ROUTES
// ============================

router.get("/verify/account", authController.verifyAccount);
router.get("/verify/student", authController.verifyStudent);
router.get("/verify/faculty", authController.verifyFaculty);
router.post("/verify/admin/approve", authController.approveAdmin);
router.post("/verify/admin/reject", authController.rejectAdmin);

// ============================
// EXPORT
// ============================

module.exports = router;

