const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  USER_ROLES,
  USER_STATUS,
  DEPARTMENTS,
  VALIDATION,
} = require("../config/constants");

/**
 * User Schema for KAAF University Noticeboard System
 * @version 2.3.0 - Added SMS preferences and enhanced notification settings
 */
const userSchema = new mongoose.Schema(
  {
    // ── Personal Information ─────────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: VALIDATION.NAME_MIN_LENGTH,
      maxlength: VALIDATION.NAME_MAX_LENGTH,
      match: [
        VALIDATION.NAME_PATTERN,
        "First name can only contain letters, spaces, hyphens, and apostrophes",
      ],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: VALIDATION.NAME_MIN_LENGTH,
      maxlength: VALIDATION.NAME_MAX_LENGTH,
      match: [
        VALIDATION.NAME_PATTERN,
        "Last name can only contain letters, spaces, hyphens, and apostrophes",
      ],
    },

    // ── Contact Information ──────────────────────────────────────────────────
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: VALIDATION.EMAIL_MAX_LENGTH,
      match: [VALIDATION.EMAIL_PATTERN, "Please provide a valid email address"],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [VALIDATION.PHONE_PATTERN, "Please provide a valid phone number"],
      default: null,
      sparse: true,
    },

    // ── Authentication ───────────────────────────────────────────────────────
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [
        VALIDATION.PASSWORD_MIN_LENGTH,
        `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
      ],
      maxlength: VALIDATION.PASSWORD_MAX_LENGTH,
      select: false,
      validate: {
        validator: function (password) {
          if (!this.isModified("password")) return true;
          const hasUpper = /[A-Z]/.test(password);
          const hasLower = /[a-z]/.test(password);
          const hasDigit = /[0-9]/.test(password);
          const hasSpecial = /[^A-Za-z0-9]/.test(password);
          return hasUpper && hasLower && hasDigit && hasSpecial;
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      },
    },
    confirmPassword: {
      type: String,
      required: false,
      validate: {
        validator: function (confirmPassword) {
          return confirmPassword === this.password;
        },
        message: "Passwords do not match",
      },
      select: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
    passwordResetAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    passwordResetLockUntil: Date,

    // ── Account Information ──────────────────────────────────────────────────
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.STUDENT,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING,
      index: true,
    },
    department: {
      type: String,
      enum: [...DEPARTMENTS, null],
      default: null,
      index: true,
    },

    // ── Role-specific Identifiers ────────────────────────────────────────────
    studentId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^KAAF\/\d{4}\/STU\/\d{5}$/.test(v);
        },
        message: "Student ID must follow format: KAAF/YYYY/STU/XXXXX",
      },
    },
    facultyId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^KAAF\/\d{4}\/FAC\/\d{5}$/.test(v);
        },
        message: "Faculty ID must follow format: KAAF/YYYY/FAC/XXXXX",
      },
    },
    adminId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^KAAF\/\d{4}\/ADM\/\d{5}$/.test(v);
        },
        message: "Admin ID must follow format: KAAF/YYYY/ADM/XXXXX",
      },
    },

    // ── Username ─────────────────────────────────────────────────────────────
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^[a-zA-Z0-9_]{3,20}$/.test(v);
        },
        message:
          "Username must be 3–20 characters (letters, numbers, underscore)",
      },
    },

    // ── Profile ──────────────────────────────────────────────────────────────
    avatar: {
      type: String,
      default: "default-avatar.png",
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },

    // ── Academic Information ─────────────────────────────────────────────────
    yearOfStudy: {
      type: Number,
      min: 1,
      max: 6,
      default: null,
      validate: {
        validator: function (value) {
          if (this.role === USER_ROLES.STUDENT && value !== null) {
            return value >= 1 && value <= 6;
          }
          if (this.role !== USER_ROLES.STUDENT) {
            return value === null;
          }
          return true;
        },
        message: "Year of study must be between 1 and 6 for students",
      },
    },
    semester: {
      type: Number,
      min: 1,
      max: 2,
      default: null,
    },

    // ── Account Activity ─────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerifiedAt: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    lastLogin: {
      type: Date,
      default: null,
    },
    lastLoginIP: {
      type: String,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    lockUntil: {
      type: Date,
      default: null,
    },

    // ── Verification ─────────────────────────────────────────────────────────
    verificationCode: {
      type: String,
      select: false,
    },
    verificationExpires: {
      type: Date,
      select: false,
    },
    studentVerificationToken: { type: String, select: false },
    facultyVerificationToken: { type: String, select: false },
    adminVerificationToken: { type: String, select: false },

    verificationStatus: {
      student: { type: Boolean, default: false },
      faculty: { type: Boolean, default: false },
      admin: { type: Boolean, default: false },
    },

    verificationData: {
      studentIdImage: { type: String, default: null },
      facultyIdImage: { type: String, default: null },
      adminApprovalToken: { type: String, select: false },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      approvedAt: Date,
      rejectionReason: String,
      verificationNotes: String,
    },

    // ── Security ─────────────────────────────────────────────────────────────
    securityQuestions: [
      {
        question: String,
        answer: { type: String, select: false },
      },
    ],
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    backupCodes: [
      {
        code: { type: String, select: false },
        used: { type: Boolean, default: false },
      },
    ],

    // ── Push Notifications ───────────────────────────────────────────────────
    pushSubscription: {
      endpoint: { type: String, default: null },
      keys: {
        p256dh: { type: String, default: null },
        auth: { type: String, default: null },
      },
      expirationTime: { type: Date, default: null },
      userAgent: { type: String, default: null },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },

    // ── Enhanced Preferences with SMS Support ─────────────────────────────────
    preferences: {
      // Notification preferences
      notifications: {
        // Email notifications
        email: {
          type: Boolean,
          default: true,
          description: "Enable email notifications for notices and events",
        },
        // SMS notifications (users must explicitly opt-in)
        sms: {
          type: Boolean,
          default: false,
          description: "Enable SMS notifications for critical updates",
        },
        // Push notifications
        push: {
          type: Boolean,
          default: true,
          description: "Enable browser push notifications",
        },
        // In-app notifications
        inApp: {
          type: Boolean,
          default: true,
          description: "Enable in-app notification center",
        },
      },

      // SMS-specific preferences
      smsPreferences: {
        // Types of SMS to receive
        categories: {
          notices: { type: Boolean, default: true },
          events: { type: Boolean, default: true },
          deadlines: { type: Boolean, default: true },
          emergencies: { type: Boolean, default: true },
          announcements: { type: Boolean, default: false },
          verification: { type: Boolean, default: true },
        },
        // Quiet hours for SMS
        quietHours: {
          enabled: { type: Boolean, default: false },
          start: { type: String, default: "22:00" }, // 10 PM
          end: { type: String, default: "07:00" }, // 7 AM
          timezone: { type: String, default: "Africa/Accra" },
        },
        // Daily SMS limit
        dailyLimit: {
          type: Number,
          default: 10,
          min: 1,
          max: 50,
        },
        // Emergency override (allows SMS during quiet hours)
        emergencyOverride: {
          type: Boolean,
          default: true,
        },
        // Last SMS sent timestamp for rate limiting
        lastSMSSentAt: {
          type: Date,
          default: null,
        },
        // Daily SMS count
        dailySMSCount: {
          type: Number,
          default: 0,
          min: 0,
        },
        // Date when daily count resets
        dailyCountResetDate: {
          type: Date,
          default: function () {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
          },
        },
      },

      // General preferences
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      language: {
        type: String,
        enum: ["en", "fr", "es", "ar", "zh"],
        default: "en",
      },
      timezone: {
        type: String,
        default: "Africa/Accra",
      },
      dateFormat: {
        type: String,
        enum: ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"],
        default: "DD/MM/YYYY",
      },
      timeFormat: {
        type: String,
        enum: ["12h", "24h"],
        default: "24h",
      },

      // Digest preferences
      digest: {
        enabled: { type: Boolean, default: true },
        frequency: {
          type: String,
          enum: ["daily", "weekly", "never"],
          default: "daily",
        },
        time: { type: String, default: "08:00" },
      },

      // Privacy preferences
      privacy: {
        showEmail: { type: Boolean, default: false },
        showPhone: { type: Boolean, default: false },
        showDepartment: { type: Boolean, default: true },
      },
    },

    // ── SMS Consent Tracking ──────────────────────────────────────────────────
    smsConsent: {
      // Explicit consent timestamp
      consentedAt: {
        type: Date,
        default: null,
      },
      // Consent source (registration, settings, admin)
      consentSource: {
        type: String,
        enum: ["registration", "settings", "admin", "api", null],
        default: null,
      },
      // IP address of consent
      consentIP: {
        type: String,
        default: null,
      },
      // Consent version (for legal compliance)
      consentVersion: {
        type: String,
        default: "1.0",
      },
      // Withdrawal information
      withdrawnAt: {
        type: Date,
        default: null,
      },
      withdrawalReason: {
        type: String,
        default: null,
      },
      // Last reminder sent
      lastReminderSent: {
        type: Date,
        default: null,
      },
    },

    // ── SMS Statistics ────────────────────────────────────────────────────────
    smsStatistics: {
      totalReceived: { type: Number, default: 0 },
      totalOpened: { type: Number, default: 0 },
      lastReceivedAt: { type: Date, default: null },
      lastOpenedAt: { type: Date, default: null },
      categoriesBreakdown: {
        notices: { type: Number, default: 0 },
        events: { type: Number, default: 0 },
        deadlines: { type: Number, default: 0 },
        emergencies: { type: Number, default: 0 },
        announcements: { type: Number, default: 0 },
        verification: { type: Number, default: 0 },
      },
    },

    // ── Tracking ─────────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1, status: 1 });
userSchema.index({ role: 1, department: 1 });
userSchema.index({ isActive: 1, status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ studentId: 1 }, { sparse: true });
userSchema.index({ facultyId: 1 }, { sparse: true });
userSchema.index({ adminId: 1 }, { sparse: true });
userSchema.index({ username: 1 }, { sparse: true });
userSchema.index({ verificationCode: 1 }, { sparse: true });
userSchema.index({ "verificationData.approvedBy": 1 });
userSchema.index({ "pushSubscription.endpoint": 1 }, { sparse: true });
userSchema.index({ "preferences.notifications.sms": 1 });
userSchema.index({ "smsConsent.consentedAt": 1 });
userSchema.index({ "smsStatistics.totalReceived": -1 });
userSchema.index({
  firstName: "text",
  lastName: "text",
  email: "text",
  studentId: "text",
  username: "text",
});

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.confirmPassword = undefined;
    this.passwordChangedAt = new Date();
    this.passwordResetAttempts = 0;
    this.passwordResetLockUntil = null;

    next();
  } catch (error) {
    next(error);
  }
});

// ── Pre-save: email domain restriction (production only) ──────────────────────
userSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    const allowedDomains = VALIDATION.ALLOWED_EMAIL_DOMAINS;
    const emailDomain = this.email.split("@")[1];

    if (
      allowedDomains &&
      allowedDomains.length > 0 &&
      !allowedDomains.includes(emailDomain) &&
      process.env.NODE_ENV === "production"
    ) {
      return next(new Error("Please use a valid university email address"));
    }
  }
  next();
});

// ── Pre-save: auto-set isVerified when status → ACTIVE ───────────────────────
userSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === USER_STATUS.ACTIVE &&
    this.isVerified === false
  ) {
    this.isVerified = true;
    this.emailVerifiedAt = new Date();
  }
  next();
});

// ── Pre-save: auto-generate username ─────────────────────────────────────────
userSchema.pre("save", async function (next) {
  try {
    if (!this.isNew || this.username) return next();

    let base = this.email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    let username = base;
    let counter = 1;

    while (await mongoose.model("User").findOne({ username })) {
      username = `${base}${counter++}`;
    }

    this.username = username;
    next();
  } catch (error) {
    next(error);
  }
});

// ── Pre-save: auto-generate role-specific IDs ────────────────────────────────
userSchema.pre("save", async function (next) {
  try {
    if (!this.isNew) return next();

    const year = new Date().getFullYear();

    const generateId = async (field, prefix) => {
      if (this[field]) return;
      const last = await mongoose
        .model("User")
        .findOne(
          { [field]: { $regex: `^KAAF/${year}/${prefix}/` } },
          { [field]: 1 },
          { sort: { [field]: -1 } },
        );
      let seq = 1;
      if (last && last[field]) {
        const match = last[field].match(/\/(\d{5})$/);
        if (match) {
          seq = parseInt(match[1], 10) + 1;
        }
      }
      this[field] = `KAAF/${year}/${prefix}/${String(seq).padStart(5, "0")}`;
    };

    if (this.role === USER_ROLES.STUDENT) await generateId("studentId", "STU");
    if (this.role === USER_ROLES.FACULTY) await generateId("facultyId", "FAC");
    if (
      this.role === USER_ROLES.ADMIN ||
      this.role === USER_ROLES.SUPER_ADMIN
    ) {
      await generateId("adminId", "ADM");
      this.yearOfStudy = null;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ── Pre-save: reset daily SMS count if needed ─────────────────────────────────
userSchema.pre("save", function (next) {
  if (this.preferences.smsPreferences) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = this.preferences.smsPreferences.dailyCountResetDate;

    if (!lastReset || lastReset < today) {
      this.preferences.smsPreferences.dailySMSCount = 0;
      this.preferences.smsPreferences.dailyCountResetDate = today;
    }
  }
  next();
});

// ── Query middleware: soft-delete filter ──────────────────────────────────────
userSchema.pre("find", function () {
  this.where({ deletedAt: null });
});
userSchema.pre("findOne", function () {
  this.where({ deletedAt: null });
});
userSchema.pre("countDocuments", function () {
  this.where({ deletedAt: null });
});

// ── Instance Methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changed = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changed;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + VALIDATION.EMAIL_RESET_TOKEN_EXPIRY;
  this.passwordResetAttempts += 1;
  if (this.passwordResetAttempts >= VALIDATION.PASSWORD_RESET_MAX_ATTEMPTS) {
    this.passwordResetLockUntil =
      Date.now() + VALIDATION.PASSWORD_RESET_LOCK_DURATION;
  }
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailVerificationExpires =
    Date.now() + VALIDATION.EMAIL_VERIFICATION_TOKEN_EXPIRY;
  return token;
};

userSchema.methods.generateVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  this.verificationExpires = Date.now() + 10 * 60 * 1000;
  return code;
};

userSchema.methods.verifyCode = function (code) {
  if (this.verificationCode !== code) return false;
  if (this.verificationExpires < Date.now()) return false;
  this.isVerified = true;
  this.emailVerifiedAt = new Date();
  this.verificationCode = undefined;
  this.verificationExpires = undefined;
  return true;
};

userSchema.methods.generateRoleVerificationToken = function (role) {
  const token = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  if (role === USER_ROLES.STUDENT) this.studentVerificationToken = hashed;
  if (role === USER_ROLES.FACULTY) this.facultyVerificationToken = hashed;
  if (role === USER_ROLES.ADMIN) this.adminVerificationToken = hashed;
  return token;
};

userSchema.methods.verifyRoleToken = function (role, token) {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  let valid = false;
  if (role === USER_ROLES.STUDENT) {
    valid = this.studentVerificationToken === hashed;
    if (valid) {
      this.verificationStatus.student = true;
      this.studentVerificationToken = undefined;
    }
  }
  if (role === USER_ROLES.FACULTY) {
    valid = this.facultyVerificationToken === hashed;
    if (valid) {
      this.verificationStatus.faculty = true;
      this.facultyVerificationToken = undefined;
    }
  }
  if (role === USER_ROLES.ADMIN) {
    valid = this.adminVerificationToken === hashed;
    if (valid) {
      this.verificationStatus.admin = true;
      this.adminVerificationToken = undefined;
    }
  }
  return valid;
};

userSchema.methods.isFullyVerified = function () {
  switch (this.role) {
    case USER_ROLES.STUDENT:
      return this.isVerified && this.verificationStatus.student;
    case USER_ROLES.FACULTY:
      return this.isVerified && this.verificationStatus.faculty;
    case USER_ROLES.ADMIN:
      return this.isVerified && this.verificationStatus.admin;
    default:
      return this.isVerified;
  }
};

userSchema.methods.isAccountLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incrementLoginAttempts = async function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= VALIDATION.MAX_LOGIN_ATTEMPTS) {
    this.lockUntil = Date.now() + VALIDATION.ACCOUNT_LOCK_DURATION;
  }
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = null;
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.softDelete = async function (deletedBy = null) {
  this.deletedAt = new Date();
  this.isActive = false;
  this.status = USER_STATUS.INACTIVE;
  if (deletedBy) this.updatedBy = deletedBy;
  await this.save();
};

userSchema.methods.reactivate = async function () {
  this.deletedAt = null;
  this.isActive = true;
  this.status = USER_STATUS.ACTIVE;
  await this.save();
};

userSchema.methods.updateLastLogin = async function (ipAddress) {
  this.lastLogin = new Date();
  this.lastLoginIP = ipAddress;
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.getRoleIdentifier = function () {
  if (this.role === USER_ROLES.STUDENT) return this.studentId;
  if (this.role === USER_ROLES.FACULTY) return this.facultyId;
  if (this.role === USER_ROLES.ADMIN) return this.adminId;
  return null;
};

// ── SMS-Specific Methods ──────────────────────────────────────────────────────

/**
 * Check if user has consented to receive SMS
 * @returns {boolean}
 */
userSchema.methods.hasSMSConsent = function () {
  return (
    this.preferences?.notifications?.sms === true &&
    this.smsConsent?.consentedAt !== null &&
    this.smsConsent?.withdrawnAt === null &&
    this.phone !== null
  );
};

/**
 * Grant SMS consent
 * @param {Object} options - Consent options
 * @param {string} options.source - Consent source
 * @param {string} options.ip - IP address
 * @param {string} options.version - Consent version
 */
userSchema.methods.grantSMSConsent = async function (options = {}) {
  this.preferences.notifications.sms = true;
  this.smsConsent = {
    consentedAt: new Date(),
    consentSource: options.source || "settings",
    consentIP: options.ip || null,
    consentVersion: options.version || "1.0",
    withdrawnAt: null,
    withdrawalReason: null,
    lastReminderSent: null,
  };
  await this.save({ validateBeforeSave: false });
  return true;
};

/**
 * Withdraw SMS consent
 * @param {string} reason - Reason for withdrawal
 */
userSchema.methods.withdrawSMSConsent = async function (reason = null) {
  this.preferences.notifications.sms = false;
  this.smsConsent.withdrawnAt = new Date();
  this.smsConsent.withdrawalReason = reason;
  await this.save({ validateBeforeSave: false });
  return true;
};

/**
 * Check if user can receive SMS (rate limiting)
 * @returns {Promise<boolean>}
 */
userSchema.methods.canReceiveSMS = async function () {
  if (!this.hasSMSConsent()) return false;

  const smsPrefs = this.preferences.smsPreferences;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reset daily count if needed
  if (!smsPrefs.dailyCountResetDate || smsPrefs.dailyCountResetDate < today) {
    smsPrefs.dailySMSCount = 0;
    smsPrefs.dailyCountResetDate = today;
    await this.save({ validateBeforeSave: false });
  }

  // Check daily limit
  if (smsPrefs.dailySMSCount >= smsPrefs.dailyLimit) {
    return false;
  }

  // Check quiet hours
  if (smsPrefs.quietHours.enabled && !smsPrefs.emergencyOverride) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const isQuietHour =
      currentTime >= smsPrefs.quietHours.start ||
      currentTime <= smsPrefs.quietHours.end;
    if (isQuietHour) return false;
  }

  return true;
};

/**
 * Record SMS received
 * @param {string} category - SMS category
 */
userSchema.methods.recordSMSReceived = async function (category = "general") {
  this.smsStatistics.totalReceived += 1;
  this.smsStatistics.lastReceivedAt = new Date();

  // Update category breakdown
  const categoryKey = category.toLowerCase();
  if (this.smsStatistics.categoriesBreakdown.hasOwnProperty(categoryKey)) {
    this.smsStatistics.categoriesBreakdown[categoryKey] += 1;
  }

  // Update daily count
  if (this.preferences.smsPreferences) {
    this.preferences.smsPreferences.dailySMSCount += 1;
    this.preferences.smsPreferences.lastSMSSentAt = new Date();
  }

  await this.save({ validateBeforeSave: false });
};

/**
 * Record SMS opened/read
 */
userSchema.methods.recordSMSOpened = async function () {
  this.smsStatistics.totalOpened += 1;
  this.smsStatistics.lastOpenedAt = new Date();
  await this.save({ validateBeforeSave: false });
};

/**
 * Update SMS preferences
 * @param {Object} preferences - New preferences
 */
userSchema.methods.updateSMSPreferences = async function (preferences) {
  if (preferences.enabled !== undefined) {
    this.preferences.notifications.sms = preferences.enabled;
  }

  if (preferences.categories) {
    this.preferences.smsPreferences.categories = {
      ...this.preferences.smsPreferences.categories,
      ...preferences.categories,
    };
  }

  if (preferences.quietHours) {
    this.preferences.smsPreferences.quietHours = {
      ...this.preferences.smsPreferences.quietHours,
      ...preferences.quietHours,
    };
  }

  if (preferences.dailyLimit) {
    this.preferences.smsPreferences.dailyLimit = Math.min(
      50,
      Math.max(1, preferences.dailyLimit),
    );
  }

  await this.save({ validateBeforeSave: false });
  return this.preferences;
};

/**
 * Get SMS preferences summary
 */
userSchema.methods.getSMSSummary = function () {
  return {
    enabled: this.preferences?.notifications?.sms || false,
    hasConsent: this.hasSMSConsent(),
    phoneNumber: this.phone,
    phoneVerified: !!this.phone,
    dailyLimit: this.preferences?.smsPreferences?.dailyLimit || 10,
    dailyUsed: this.preferences?.smsPreferences?.dailySMSCount || 0,
    quietHours: this.preferences?.smsPreferences?.quietHours,
    categories: this.preferences?.smsPreferences?.categories,
    statistics: this.smsStatistics,
  };
};

userSchema.methods.updatePushSubscription = function (subscription) {
  this.pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    expirationTime: subscription.expirationTime || null,
    userAgent: subscription.userAgent || null,
    updatedAt: new Date(),
  };
  return this.save();
};

userSchema.methods.clearPushSubscription = function () {
  this.pushSubscription = null;
  return this.save();
};

userSchema.methods.getRegisteredEvents = async function (options = {}) {
  const Event = mongoose.model("Event");
  return Event.find({ "attendees.user": this._id, deletedAt: null })
    .sort(options.sort || { eventDate: 1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

userSchema.methods.getRegisteredEventsCount = async function () {
  return mongoose
    .model("Event")
    .countDocuments({ "attendees.user": this._id, deletedAt: null });
};

userSchema.methods.getWaitlistedEvents = async function (options = {}) {
  return mongoose
    .model("Event")
    .find({ "waitlist.user": this._id, deletedAt: null })
    .sort(options.sort || { eventDate: 1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

userSchema.methods.getAttendedEvents = async function (options = {}) {
  return mongoose
    .model("Event")
    .find({
      "attendees.user": this._id,
      "attendees.attended": true,
      deletedAt: null,
    })
    .sort(options.sort || { eventDate: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

userSchema.methods.getAttendedEventsCount = async function () {
  return mongoose.model("Event").countDocuments({
    "attendees.user": this._id,
    "attendees.attended": true,
    deletedAt: null,
  });
};

userSchema.methods.getCreatedNoticesCount = async function () {
  return mongoose
    .model("Notice")
    .countDocuments({ createdBy: this._id, deletedAt: null });
};

userSchema.methods.enableTwoFactor = function (secret) {
  this.twoFactorEnabled = true;
  this.twoFactorSecret = secret;
};

userSchema.methods.disableTwoFactor = function () {
  this.twoFactorEnabled = false;
  this.twoFactorSecret = undefined;
  this.backupCodes = [];
};

userSchema.methods.generateBackupCodes = function () {
  const codes = Array.from({ length: 10 }, () => {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    return {
      code: crypto.createHash("sha256").update(code).digest("hex"),
      used: false,
    };
  });
  this.backupCodes = codes;
  return codes.map((c) => c.code);
};

userSchema.methods.verifyBackupCode = async function (code) {
  const hashed = crypto.createHash("sha256").update(code).digest("hex");
  const found = this.backupCodes.find((c) => c.code === hashed && !c.used);
  if (found) {
    found.used = true;
    await this.save();
    return true;
  }
  return false;
};

// ── Static Methods ────────────────────────────────────────────────────────────
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email, deletedAt: null }).select("+password");
};
userSchema.statics.findByUsername = function (username) {
  return this.findOne({ username, deletedAt: null }).select("+password");
};
userSchema.statics.findByIdentifier = function (identifier) {
  return this.findOne({
    $or: [
      { email: identifier },
      { username: identifier },
      { studentId: identifier },
      { facultyId: identifier },
      { adminId: identifier },
    ],
    deletedAt: null,
  });
};
userSchema.statics.findActive = function () {
  return this.find({
    isActive: true,
    status: USER_STATUS.ACTIVE,
    deletedAt: null,
  });
};

userSchema.statics.createWithAvatar = async function (userData) {
  const user = await this.create(userData);
  try {
    const { generateAvatar } = require("../utils/avatarGenerator");
    user.avatar = await generateAvatar(
      user._id,
      user.firstName,
      user.lastName,
      user.email,
    );
    await user.save();
  } catch (err) {
    console.error("Avatar generation failed:", err.message);
  }
  return user;
};

/**
 * Find users who have SMS enabled
 * @param {Object} filters - Additional filters
 */
userSchema.statics.findSMSConsentedUsers = function (filters = {}) {
  return this.find({
    "preferences.notifications.sms": true,
    "smsConsent.consentedAt": { $ne: null },
    "smsConsent.withdrawnAt": null,
    phone: { $ne: null, $ne: "" },
    isActive: true,
    status: USER_STATUS.ACTIVE,
    deletedAt: null,
    ...filters,
  });
};

// ── Virtuals ──────────────────────────────────────────────────────────────────
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});
userSchema.virtual("name").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});
userSchema.virtual("initials").get(function () {
  return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
});
userSchema.virtual("avatarUrl").get(function () {
  if (this.avatar && this.avatar !== "default-avatar.png") {
    return `/uploads/avatars/${this.avatar}`;
  }
  return `/uploads/avatars/default-avatar.png`;
});
userSchema.virtual("displayName").get(function () {
  return this.firstName && this.lastName
    ? `${this.firstName} ${this.lastName}`
    : this.email.split("@")[0];
});
userSchema.virtual("primaryIdentifier").get(function () {
  return this.getRoleIdentifier() || this.email;
});
userSchema.virtual("verificationLevel").get(function () {
  if (!this.isVerified) return "none";
  if (this.role === USER_ROLES.STUDENT && !this.verificationStatus.student)
    return "email";
  if (this.role === USER_ROLES.FACULTY && !this.verificationStatus.faculty)
    return "email";
  if (this.role === USER_ROLES.ADMIN && !this.verificationStatus.admin)
    return "email";
  return "full";
});
userSchema.virtual("hasPushSubscription").get(function () {
  return !!(this.pushSubscription && this.pushSubscription.endpoint);
});
userSchema.virtual("profileCompleteness").get(function () {
  const fields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "department",
    "avatar",
  ];
  const completed = fields.filter(
    (f) => this[f] && this[f] !== "default-avatar.png",
  ).length;
  return Math.floor((completed / fields.length) * 100);
});
userSchema.virtual("smsOptedIn").get(function () {
  return this.hasSMSConsent();
});
userSchema.virtual("smsStatus").get(function () {
  if (!this.phone) return "no_phone";
  if (!this.hasSMSConsent()) return "not_opted_in";
  return "active";
});

module.exports = mongoose.model("User", userSchema);
