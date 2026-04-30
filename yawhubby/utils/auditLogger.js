// utils/auditLogger.js
// Professional Audit Logging System for Compliance and Security Monitoring
// Tracks all critical actions, user activities, and system events for forensic analysis
// @version 2.1.0 - Fixed method validation

const mongoose = require("mongoose");
const os = require("os");
const crypto = require("crypto");
const logger = require("./logger");

// ============================================================
// CONFIGURATION
// ============================================================

const AUDIT_CONFIG = {
  // Log levels
  levels: {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    CRITICAL: "critical",
  },

  // Event categories
  categories: {
    AUTH: "authentication",
    USER: "user_management",
    NOTICE: "notice_management",
    EVENT: "event_management",
    REGISTRATION: "registration",
    PAYMENT: "payment",
    SYSTEM: "system",
    SECURITY: "security",
    DATA: "data_access",
    ADMIN: "admin_action",
    API: "api_access",
    INTEGRATION: "integration",
  },

  // Action types
  actions: {
    // Auth actions
    LOGIN: "login",
    LOGOUT: "logout",
    LOGIN_FAILED: "login_failed",
    PASSWORD_RESET: "password_reset",
    PASSWORD_CHANGE: "password_change",
    TOKEN_REFRESH: "token_refresh",

    // User actions
    USER_CREATE: "user_create",
    USER_UPDATE: "user_update",
    USER_DELETE: "user_delete",
    USER_SUSPEND: "user_suspend",
    USER_ACTIVATE: "user_activate",
    ROLE_CHANGE: "role_change",

    // Notice actions
    NOTICE_CREATE: "notice_create",
    NOTICE_UPDATE: "notice_update",
    NOTICE_DELETE: "notice_delete",
    NOTICE_PUBLISH: "notice_publish",
    NOTICE_ARCHIVE: "notice_archive",

    // Event actions
    EVENT_CREATE: "event_create",
    EVENT_UPDATE: "event_update",
    EVENT_DELETE: "event_delete",
    EVENT_CANCEL: "event_cancel",

    // Registration actions
    REGISTER: "register",
    UNREGISTER: "unregister",
    CHECKIN: "checkin",
    CERTIFICATE_ISSUE: "certificate_issue",

    // System actions
    SYSTEM_START: "system_start",
    SYSTEM_STOP: "system_stop",
    BACKUP_CREATE: "backup_create",
    BACKUP_RESTORE: "backup_restore",
    CONFIG_CHANGE: "config_change",
    MAINTENANCE_MODE: "maintenance_mode",

    // Security actions
    PERMISSION_DENIED: "permission_denied",
    SUSPICIOUS_ACTIVITY: "suspicious_activity",
    RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
    IP_BLOCKED: "ip_blocked",
  },

  // Retention settings
  retention: {
    days: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS) || 365,
    criticalDays: parseInt(process.env.CRITICAL_AUDIT_RETENTION_DAYS) || 2555,
  },

  // Export settings
  export: {
    enabled: process.env.AUDIT_EXPORT_ENABLED === "true",
    path: process.env.AUDIT_EXPORT_PATH || "./audit-logs",
    format: process.env.AUDIT_EXPORT_FORMAT || "json",
  },
};

// Valid HTTP methods
const VALID_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "OPTIONS",
  "HEAD",
  "SYSTEM",
];

// ============================================================
// AUDIT LOG SCHEMA
// ============================================================

const auditLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(16).toString("hex"),
      index: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: Object.values(AUDIT_CONFIG.categories),
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: Object.values(AUDIT_CONFIG.actions),
      required: true,
      index: true,
    },

    level: {
      type: String,
      enum: Object.values(AUDIT_CONFIG.levels),
      default: AUDIT_CONFIG.levels.INFO,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      default: null,
    },

    userRole: {
      type: String,
      default: null,
      index: true,
    },

    userName: {
      type: String,
      default: null,
    },

    ipAddress: {
      type: String,
      index: true,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    requestId: {
      type: String,
      index: true,
      default: null,
    },

    // FIXED: method field - added "SYSTEM" as valid option and default
    method: {
      type: String,
      enum: VALID_METHODS,
      default: "SYSTEM",
    },

    endpoint: {
      type: String,
      default: null,
      index: true,
    },

    statusCode: {
      type: Number,
      default: null,
    },

    responseTime: {
      type: Number,
      default: null,
    },

    resourceId: {
      type: String,
      default: null,
      index: true,
    },

    resourceType: {
      type: String,
      default: null,
      index: true,
    },

    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    changes: [
      {
        field: String,
        from: mongoose.Schema.Types.Mixed,
        to: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    sessionId: {
      type: String,
      default: null,
      index: true,
    },

    deviceId: {
      type: String,
      default: null,
    },

    location: {
      country: { type: String, default: null },
      city: { type: String, default: null },
      coordinates: { type: [Number], default: null },
    },

    serviceName: {
      type: String,
      default: process.env.APP_NAME || "kaaf-noticeboard",
      index: true,
    },

    serviceVersion: {
      type: String,
      default: process.env.npm_package_version || "2.0.0",
    },

    environment: {
      type: String,
      enum: ["development", "staging", "production"],
      default: process.env.NODE_ENV || "development",
      index: true,
    },

    hostname: {
      type: String,
      default: os.hostname(),
    },

    pid: {
      type: Number,
      default: process.pid,
    },

    compliance: {
      gdpr: {
        userConsent: { type: Boolean, default: false },
        dataSubjectRequest: { type: Boolean, default: false },
        retentionPeriod: { type: Number, default: null },
      },
      auditPeriod: {
        start: { type: Date, default: null },
        end: { type: Date, default: null },
      },
    },

    hash: {
      type: String,
      unique: true,
      index: true,
    },

    previousHash: {
      type: String,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

// ============================================================
// INDEXES
// ============================================================

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ level: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });
auditLogSchema.index({ resourceId: 1, resourceType: 1 });
auditLogSchema.index({ sessionId: 1, timestamp: -1 });
auditLogSchema.index({ requestId: 1 });

auditLogSchema.index({
  userEmail: "text",
  userName: "text",
  endpoint: "text",
  "metadata.details": "text",
});

auditLogSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: AUDIT_CONFIG.retention.days * 24 * 60 * 60,
    partialFilterExpression: { level: { $ne: "critical" }, isDeleted: false },
  },
);

// ============================================================
// PRE-SAVE MIDDLEWARE
// ============================================================

auditLogSchema.pre("save", async function (next) {
  try {
    // FIXED: Ensure method has a valid value
    if (!this.method || !VALID_METHODS.includes(this.method)) {
      this.method = "SYSTEM";
    }

    const logData = JSON.stringify({
      logId: this.logId,
      timestamp: this.timestamp,
      category: this.category,
      action: this.action,
      userId: this.userId,
      userEmail: this.userEmail,
      ipAddress: this.ipAddress,
      endpoint: this.endpoint,
      resourceId: this.resourceId,
      before: this.before,
      after: this.after,
      metadata: this.metadata,
      previousHash: this.previousHash,
    });

    this.hash = crypto.createHash("sha256").update(logData).digest("hex");

    next();
  } catch (error) {
    next(error);
  }
});

// ============================================================
// INSTANCE METHODS
// ============================================================

auditLogSchema.methods.verifyIntegrity = async function () {
  const logData = JSON.stringify({
    logId: this.logId,
    timestamp: this.timestamp,
    category: this.category,
    action: this.action,
    userId: this.userId,
    userEmail: this.userEmail,
    ipAddress: this.ipAddress,
    endpoint: this.endpoint,
    resourceId: this.resourceId,
    before: this.before,
    after: this.after,
    metadata: this.metadata,
    previousHash: this.previousHash,
  });

  const calculatedHash = crypto
    .createHash("sha256")
    .update(logData)
    .digest("hex");
  return this.hash === calculatedHash;
};

auditLogSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
  return this;
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Log an audit event - FIXED to handle method validation
 * @param {Object} data - Audit event data
 */
const logEvent = async (data) => {
  try {
    const AuditLog = mongoose.model("AuditLog");

    const lastLog = await AuditLog.findOne({}, {}, { sort: { timestamp: -1 } });
    const previousHash = lastLog ? lastLog.hash : "0";

    // FIXED: Ensure method is valid
    let method = data.method;
    if (!method || !VALID_METHODS.includes(method)) {
      // Try to infer from request
      if (
        data.req &&
        data.req.method &&
        VALID_METHODS.includes(data.req.method)
      ) {
        method = data.req.method;
      } else {
        method = "SYSTEM";
      }
    }

    const auditEntry = new AuditLog({
      logId: crypto.randomBytes(16).toString("hex"),
      timestamp: new Date(),
      category: data.category || AUDIT_CONFIG.categories.SYSTEM,
      action: data.action || AUDIT_CONFIG.actions.SYSTEM_START,
      level: data.level || AUDIT_CONFIG.levels.INFO,
      userId: data.userId || null,
      userEmail: data.userEmail || null,
      userRole: data.userRole || null,
      userName: data.userName || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      requestId: data.requestId || null,
      method: method, // FIXED: Now always has a valid value
      endpoint: data.endpoint || null,
      statusCode: data.statusCode || null,
      responseTime: data.responseTime || null,
      resourceId: data.resourceId || null,
      resourceType: data.resourceType || null,
      before: data.before || null,
      after: data.after || null,
      changes: data.changes || [],
      metadata: data.metadata || {},
      sessionId: data.sessionId || null,
      deviceId: data.deviceId || null,
      location: data.location || null,
      previousHash,
      hostname: os.hostname(),
      pid: process.pid,
      environment: process.env.NODE_ENV || "development",
      serviceVersion: process.env.npm_package_version || "2.0.0",
    });

    await auditEntry.save();

    logger.debug(
      `AUDIT: ${data.category} - ${data.action} - User: ${data.userEmail || "anonymous"}`,
    );

    if (AUDIT_CONFIG.export.enabled) {
      await exportAuditLog(auditEntry);
    }

    return auditEntry;
  } catch (error) {
    logger.error(`Failed to create audit log: ${error.message}`);
    return null;
  }
};

/**
 * Create audit log from Express request - FIXED helper
 * @param {Object} req - Express request
 * @param {Object} data - Additional audit data
 */
const createAuditLog = async (req, data = {}) => {
  return await logEvent({
    category: data.category || AUDIT_CONFIG.categories.API,
    action: data.action || `${req.method?.toLowerCase() || "system"}_access`,
    level: data.level || AUDIT_CONFIG.levels.INFO,
    userId: req.user?._id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    userName: req.user?.firstName
      ? `${req.user.firstName} ${req.user.lastName}`
      : null,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get("user-agent"),
    requestId: req.requestId,
    method: req.method, // FIXED: Pass the method from request
    endpoint: req.originalUrl,
    statusCode: res?.statusCode,
    metadata: data.metadata || {},
    ...data,
  });
};

/**
 * Export audit log to file
 */
const exportAuditLog = async (auditEntry) => {
  try {
    const fs = require("fs-extra");
    const path = require("path");

    const date = new Date().toISOString().split("T")[0];
    const exportPath = path.join(
      AUDIT_CONFIG.export.path,
      `${date}.${AUDIT_CONFIG.export.format}`,
    );

    await fs.ensureDir(AUDIT_CONFIG.export.path);

    let data;
    if (AUDIT_CONFIG.export.format === "json") {
      let existing = [];
      if (await fs.pathExists(exportPath)) {
        existing = await fs.readJson(exportPath);
      }
      existing.push(auditEntry.toObject());
      data = JSON.stringify(existing, null, 2);
    } else {
      data = JSON.stringify(auditEntry.toObject());
    }

    await fs.writeFile(exportPath, data);
  } catch (error) {
    logger.error(`Failed to export audit log: ${error.message}`);
  }
};

/**
 * Get audit logs with filtering and pagination
 */
const getAuditLogs = async (filters = {}, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 50;
  const skip = (page - 1) * limit;

  const query = { isDeleted: false };

  if (filters.category) query.category = filters.category;
  if (filters.action) query.action = filters.action;
  if (filters.level) query.level = filters.level;
  if (filters.userId) query.userId = filters.userId;
  if (filters.userEmail) query.userEmail = filters.userEmail;
  if (filters.ipAddress) query.ipAddress = filters.ipAddress;
  if (filters.resourceId) query.resourceId = filters.resourceId;
  if (filters.resourceType) query.resourceType = filters.resourceType;
  if (filters.method) query.method = filters.method;

  if (filters.startDate) {
    query.timestamp = { $gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    query.timestamp = { ...query.timestamp, $lte: new Date(filters.endDate) };
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  const AuditLog = mongoose.model("AuditLog");
  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "firstName lastName email role")
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

/**
 * Get user activity timeline
 */
const getUserActivityTimeline = async (userId, options = {}) => {
  const days = options.days || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const AuditLog = mongoose.model("AuditLog");

  const activities = await AuditLog.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          category: "$category",
          action: "$action",
        },
        count: { $sum: 1 },
        details: { $push: { timestamp: "$timestamp", metadata: "$metadata" } },
      },
    },
    { $sort: { "_id.date": -1, count: -1 } },
  ]);

  return activities;
};

/**
 * Get security audit report
 */
const getSecurityAuditReport = async (options = {}) => {
  const days = options.days || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const AuditLog = mongoose.model("AuditLog");

  const report = await AuditLog.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        isDeleted: false,
        $or: [
          { level: "critical" },
          { level: "error" },
          {
            action: {
              $in: ["login_failed", "permission_denied", "suspicious_activity"],
            },
          },
        ],
      },
    },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalEvents: { $sum: 1 },
              criticalEvents: {
                $sum: { $cond: [{ $eq: ["$level", "critical"] }, 1, 0] },
              },
              failedLogins: {
                $sum: { $cond: [{ $eq: ["$action", "login_failed"] }, 1, 0] },
              },
              permissionDenied: {
                $sum: {
                  $cond: [{ $eq: ["$action", "permission_denied"] }, 1, 0],
                },
              },
            },
          },
        ],
        byIp: [
          {
            $group: {
              _id: "$ipAddress",
              count: { $sum: 1 },
              actions: { $addToSet: "$action" },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        byUser: [
          {
            $group: {
              _id: "$userEmail",
              count: { $sum: 1 },
              suspiciousActions: { $push: "$action" },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        hourlyDistribution: [
          {
            $group: {
              _id: { $hour: "$timestamp" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  return {
    period: `${days} days`,
    startDate,
    endDate: new Date(),
    ...report[0],
  };
};

/**
 * Clean old audit logs
 */
const cleanOldLogs = async (retentionDays = null) => {
  const days = retentionDays || AUDIT_CONFIG.retention.days;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const AuditLog = mongoose.model("AuditLog");

  const result = await AuditLog.updateMany(
    {
      timestamp: { $lt: cutoffDate },
      level: { $ne: "critical" },
      isDeleted: false,
    },
    { isDeleted: true, deletedAt: new Date() },
  );

  logger.info(`Cleaned up ${result.modifiedCount} old audit logs`);
  return result;
};

/**
 * Verify audit log chain integrity
 */
const verifyChainIntegrity = async () => {
  const AuditLog = mongoose.model("AuditLog");
  const logs = await AuditLog.find({ isDeleted: false }).sort({ timestamp: 1 });

  let previousHash = "0";
  let compromised = [];

  for (const log of logs) {
    if (log.previousHash !== previousHash) {
      compromised.push(log.logId);
    }

    const isValid = await log.verifyIntegrity();
    if (!isValid) {
      compromised.push(log.logId);
    }

    previousHash = log.hash;
  }

  return {
    isIntact: compromised.length === 0,
    compromisedLogs: compromised,
    totalLogs: logs.length,
  };
};

/**
 * Export audit logs to CSV/JSON
 */
const exportAuditLogs = async (filters = {}, format = "json") => {
  const AuditLog = mongoose.model("AuditLog");
  const query = { isDeleted: false };

  if (filters.startDate) {
    query.timestamp = { $gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    query.timestamp = { ...query.timestamp, $lte: new Date(filters.endDate) };
  }
  if (filters.category) query.category = filters.category;

  const logs = await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .populate("userId", "firstName lastName email")
    .lean();

  if (format === "csv") {
    try {
      const json2csv = require("json2csv").parse;
      const fields = [
        "logId",
        "timestamp",
        "category",
        "action",
        "level",
        "userEmail",
        "ipAddress",
        "endpoint",
        "method",
      ];
      return json2csv(logs, { fields });
    } catch (err) {
      logger.warn("json2csv not available, returning JSON");
      return logs;
    }
  }

  return logs;
};

// ============================================================
// MIDDLEWARE
// ============================================================

/**
 * Create audit middleware for Express
 */
const auditMiddleware = () => {
  return async (req, res, next) => {
    const startTime = Date.now();

    const originalEnd = res.end;

    res.end = function (chunk, encoding) {
      const responseTime = Date.now() - startTime;

      if (req.path.startsWith("/api/") && req.method !== "GET") {
        logEvent({
          category: AUDIT_CONFIG.categories.API,
          action: `${req.method?.toLowerCase() || "system"}_access`,
          level: AUDIT_CONFIG.levels.INFO,
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          method: req.method || "SYSTEM",
          endpoint: req.path,
          statusCode: res.statusCode,
          responseTime,
          requestId: req.requestId,
          metadata: {
            query: req.query,
            bodySize: JSON.stringify(req.body).length,
          },
        });
      }

      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize audit logger
 */
const initializeAuditLogger = async () => {
  try {
    if (!mongoose.models.AuditLog) {
      mongoose.model("AuditLog", auditLogSchema);
    }

    if (AUDIT_CONFIG.export.enabled) {
      const fs = require("fs-extra");
      await fs.ensureDir(AUDIT_CONFIG.export.path);
    }

    logger.info("✅ Audit logger initialized");

    await logEvent({
      category: AUDIT_CONFIG.categories.SYSTEM,
      action: AUDIT_CONFIG.actions.SYSTEM_START,
      level: AUDIT_CONFIG.levels.INFO,
      method: "SYSTEM",
      metadata: {
        nodeVersion: process.version,
        platform: os.platform(),
        hostname: os.hostname(),
      },
    });
  } catch (error) {
    logger.error(`Failed to initialize audit logger: ${error.message}`);
  }
};

// ============================================================
// EXPORTS
// ============================================================

let AuditLog;
try {
  AuditLog = mongoose.model("AuditLog");
} catch {
  AuditLog = mongoose.model("AuditLog", auditLogSchema);
}

module.exports = {
  logEvent,
  createAuditLog,
  getAuditLogs,
  getUserActivityTimeline,
  getSecurityAuditReport,
  verifyChainIntegrity,
  cleanOldLogs,
  exportAuditLogs,
  initializeAuditLogger,
  auditMiddleware,
  AUDIT_CONFIG,
  AuditLog,
};
