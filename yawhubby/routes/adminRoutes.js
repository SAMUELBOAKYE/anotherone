// routes/adminRoutes.js
// Admin Routes for KAAF Noticeboard System
// Handles system administration, monitoring, and management endpoints

const express = require("express");
const router = express.Router();
const { body, param, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getSystemStats,
  getServiceStatus,
  getSystemHealth,
  getPerformanceMetrics,
  getAllUsers,
  getUserById,
  updateUserRole,
  suspendUser,
  activateUser,
  deleteUser,
  getAllNotices,
  approveNotice,
  rejectNotice,
  deleteNotice,
  featureNotice,
  getAnalytics,
  getActivityLogs,
  getUsageReport,
  exportData,
  getSystemConfig,
  updateSystemConfig,
  getEnvironmentVariables,
  clearCache,
  getCacheStats,
  getDatabaseStats,
  runDatabaseBackup,
  optimizeDatabase,
  getSystemLogs,
  getErrorLogs,
  rotateLogs,
  getSecuritySettings,
  updateSecuritySettings,
  getFailedLoginAttempts,
  blockIPAddress,
  unblockIPAddress,
  getBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  sendSystemNotification,
  getNotificationHistory,
  setMaintenanceMode,
  getMaintenanceStatus,
  getAPIKeys,
  createAPIKey,
  revokeAPIKey,
  getAPILogs,
} = require("../controllers/adminController");

// ============================================================
// RATE LIMITING
// ============================================================

const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const moderateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    error: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const criticalRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: "Rate limit exceeded for critical operations",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// VALIDATION
// ============================================================

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res
    .status(400)
    .json({
      success: false,
      error: "Validation Error",
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
};

const cacheControl = (duration) => (req, res, next) => {
  if (req.method === "GET")
    res.set("Cache-Control", `private, max-age=${duration}`);
  next();
};

const logAdminAction = (req, res, next) => {
  const startTime = Date.now();
  res.on("finish", () =>
    console.log(
      `[ADMIN] ${req.user?.email} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${Date.now() - startTime}ms`,
    ),
  );
  next();
};

// Apply auth to all admin routes
router.use(protect);
router.use(authorize("admin", "super_admin"));
router.use(logAdminAction);

// ============================================================
// SYSTEM MONITORING
// ============================================================

router.get("/stats", moderateRateLimit, cacheControl(30), getSystemStats);
router.get("/services", moderateRateLimit, cacheControl(10), getServiceStatus);
router.get("/health", moderateRateLimit, cacheControl(30), getSystemHealth);
router.get(
  "/performance",
  moderateRateLimit,
  cacheControl(60),
  getPerformanceMetrics,
);

// ============================================================
// USER MANAGEMENT
// ============================================================

router.get("/users", moderateRateLimit, cacheControl(60), getAllUsers);
router.get(
  "/users/:userId",
  moderateRateLimit,
  validate([param("userId").isMongoId()]),
  getUserById,
);
router.put(
  "/users/:userId/role",
  strictRateLimit,
  validate([
    param("userId").isMongoId(),
    body("role").isIn(["user", "admin", "moderator"]),
  ]),
  updateUserRole,
);
router.post(
  "/users/:userId/suspend",
  strictRateLimit,
  validate([
    param("userId").isMongoId(),
    body("reason").optional().isString().isLength({ min: 5, max: 500 }),
    body("duration").optional().isInt({ min: 1, max: 365 }),
  ]),
  suspendUser,
);
router.post(
  "/users/:userId/activate",
  strictRateLimit,
  validate([param("userId").isMongoId()]),
  activateUser,
);
router.delete(
  "/users/:userId",
  criticalRateLimit,
  validate([param("userId").isMongoId()]),
  deleteUser,
);

// ============================================================
// NOTICE MANAGEMENT
// ============================================================

router.get("/notices", moderateRateLimit, cacheControl(60), getAllNotices);
router.post(
  "/notices/:noticeId/approve",
  strictRateLimit,
  validate([param("noticeId").isMongoId()]),
  approveNotice,
);
router.post(
  "/notices/:noticeId/reject",
  strictRateLimit,
  validate([
    param("noticeId").isMongoId(),
    body("reason").isString().isLength({ min: 10, max: 500 }),
  ]),
  rejectNotice,
);
router.delete(
  "/notices/:noticeId",
  criticalRateLimit,
  validate([param("noticeId").isMongoId()]),
  deleteNotice,
);
router.post(
  "/notices/:noticeId/feature",
  strictRateLimit,
  validate([param("noticeId").isMongoId()]),
  featureNotice,
);

// ============================================================
// ANALYTICS & REPORTS
// ============================================================

router.get("/analytics", moderateRateLimit, cacheControl(120), getAnalytics);
router.get("/logs/activity", moderateRateLimit, getActivityLogs);
router.get(
  "/reports/usage",
  moderateRateLimit,
  cacheControl(300),
  getUsageReport,
);
router.post("/export", strictRateLimit, exportData);

// ============================================================
// SYSTEM CONFIGURATION
// ============================================================

router.get("/config", moderateRateLimit, getSystemConfig);
router.put(
  "/config",
  criticalRateLimit,
  validate([body("key").isString().notEmpty(), body("value").notEmpty()]),
  updateSystemConfig,
);
router.get("/environment", moderateRateLimit, getEnvironmentVariables);

// ============================================================
// CACHE MANAGEMENT
// ============================================================

router.delete("/cache", criticalRateLimit, clearCache);
router.get("/cache/stats", moderateRateLimit, getCacheStats);

// ============================================================
// DATABASE MANAGEMENT
// ============================================================

router.get("/database/stats", moderateRateLimit, getDatabaseStats);
router.post("/database/backup", criticalRateLimit, runDatabaseBackup);
router.post("/database/optimize", criticalRateLimit, optimizeDatabase);

// ============================================================
// LOG MANAGEMENT
// ============================================================

router.get("/logs/system", moderateRateLimit, getSystemLogs);
router.get("/logs/errors", moderateRateLimit, getErrorLogs);
router.post("/logs/rotate", criticalRateLimit, rotateLogs);

// ============================================================
// SECURITY
// ============================================================

router.get("/security", moderateRateLimit, getSecuritySettings);
router.put("/security", criticalRateLimit, updateSecuritySettings);
router.get(
  "/security/failed-logins",
  moderateRateLimit,
  getFailedLoginAttempts,
);
router.post(
  "/security/block-ip",
  criticalRateLimit,
  validate([body("ipAddress").isIP()]),
  blockIPAddress,
);
router.delete(
  "/security/unblock-ip/:ipAddress",
  criticalRateLimit,
  validate([param("ipAddress").isIP()]),
  unblockIPAddress,
);

// ============================================================
// BACKUP & RECOVERY
// ============================================================

router.get("/backups", moderateRateLimit, getBackups);
router.post(
  "/backups",
  criticalRateLimit,
  validate([
    body("type").optional().isIn(["full", "database", "logs", "uploads"]),
  ]),
  createBackup,
);
router.post(
  "/backups/:backupId/restore",
  criticalRateLimit,
  validate([param("backupId").isMongoId()]),
  restoreBackup,
);
router.delete(
  "/backups/:backupId",
  criticalRateLimit,
  validate([param("backupId").isMongoId()]),
  deleteBackup,
);

// ============================================================
// NOTIFICATIONS
// ============================================================

router.post(
  "/notifications",
  strictRateLimit,
  validate([
    body("title").isString().isLength({ min: 3, max: 200 }),
    body("message").isString().isLength({ min: 10, max: 5000 }),
  ]),
  sendSystemNotification,
);
router.get("/notifications/history", moderateRateLimit, getNotificationHistory);

// ============================================================
// MAINTENANCE MODE
// ============================================================

router.post("/maintenance", criticalRateLimit, setMaintenanceMode);
router.get("/maintenance", moderateRateLimit, getMaintenanceStatus);

// ============================================================
// API MANAGEMENT
// ============================================================

router.get("/api-keys", moderateRateLimit, getAPIKeys);
router.post(
  "/api-keys",
  strictRateLimit,
  validate([body("name").isString().isLength({ min: 3, max: 100 })]),
  createAPIKey,
);
router.delete(
  "/api-keys/:keyId",
  criticalRateLimit,
  validate([param("keyId").isMongoId()]),
  revokeAPIKey,
);
router.get("/api-logs", moderateRateLimit, getAPILogs);

// ============================================================
// HEALTH CHECK
// ============================================================

router.get("/health-check", (req, res) =>
  res
    .status(200)
    .json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "Admin API",
      version: "2.0.0",
    }),
);

// ============================================================
// ERROR HANDLER
// ============================================================

router.use((err, req, res, next) => {
  console.error("[Admin Route Error]", err);
  if (err.code === "RATE_LIMIT")
    return res
      .status(429)
      .json({
        success: false,
        error: "Too many requests",
        message: "Please slow down and try again later",
      });
  res
    .status(500)
    .json({
      success: false,
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "An error occurred",
    });
});

module.exports = router;

