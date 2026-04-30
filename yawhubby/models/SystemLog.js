// models/SystemLog.js
const mongoose = require("mongoose");

/**
 * System Log Schema for tracking application events, errors, and metrics
 * Enterprise-grade logging with automatic cleanup and aggregation support
 */
const systemLogSchema = new mongoose.Schema(
  {
    // Log level following standard logging conventions
    level: {
      type: String,
      enum: ["error", "warn", "info", "debug", "trace", "fatal"],
      required: [true, "Log level is required"],
      index: true,
      uppercase: false,
      trim: true,
    },

    // Primary log message
    message: {
      type: String,
      required: [true, "Log message is required"],
      trim: true,
      maxlength: [10000, "Message cannot exceed 10000 characters"],
    },

    // Service/Module identifier
    service: {
      type: String,
      required: [true, "Service name is required"],
      default: "kaaf-noticeboard-backend",
      trim: true,
      index: true,
      lowercase: true,
    },

    // Sub-service or component name (e.g., 'auth', 'noticeboard', 'events')
    component: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    // Detailed metadata for additional context
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      validate: {
        validator: function (metadata) {
          // Prevent storing excessively large metadata
          const size = JSON.stringify(metadata).length;
          return size <= 100000; // 100KB limit
        },
        message: "Metadata exceeds 100KB size limit",
      },
    },

    // Error specific fields (populated when level is error or fatal)
    error: {
      name: {
        type: String,
        trim: true,
      },
      code: {
        type: String,
        trim: true,
        index: true,
      },
      stack: {
        type: String,
        maxlength: [5000, "Stack trace cannot exceed 5000 characters"],
      },
      file: {
        type: String,
        trim: true,
      },
      line: {
        type: Number,
      },
    },

    // User context (if applicable)
    user: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      role: {
        type: String,
        trim: true,
      },
      ip: {
        type: String,
        trim: true,
      },
    },

    // Request context
    request: {
      method: {
        type: String,
        enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
        trim: true,
      },
      url: {
        type: String,
        trim: true,
        maxlength: [500, "URL cannot exceed 500 characters"],
      },
      query: {
        type: mongoose.Schema.Types.Mixed,
      },
      params: {
        type: mongoose.Schema.Types.Mixed,
      },
      headers: {
        type: mongoose.Schema.Types.Mixed,
        // Don't index headers to save space
        select: false,
      },
      responseTime: {
        type: Number,
        min: 0,
      },
      statusCode: {
        type: Number,
        min: 100,
        max: 599,
      },
    },

    // Performance metrics
    performance: {
      duration: {
        type: Number,
        min: 0,
      },
      memory: {
        type: Number,
        min: 0,
      },
      cpu: {
        type: Number,
        min: 0,
        max: 100,
      },
    },

    // Database operation tracking
    database: {
      operation: {
        type: String,
        trim: true,
      },
      collection: {
        type: String,
        trim: true,
      },
      query: {
        type: mongoose.Schema.Types.Mixed,
      },
      duration: {
        type: Number,
        min: 0,
      },
    },

    // External service calls (SMS, Email, etc.)
    external: {
      service: {
        type: String,
        trim: true,
      },
      endpoint: {
        type: String,
        trim: true,
      },
      duration: {
        type: Number,
        min: 0,
      },
      status: {
        type: String,
        enum: ["success", "failed", "pending", "timeout"],
      },
    },

    // Correlation ID for tracing requests across services
    correlationId: {
      type: String,
      index: true,
      trim: true,
    },

    // Session/Request ID
    sessionId: {
      type: String,
      index: true,
      trim: true,
    },

    // Environment information
    environment: {
      type: String,
      enum: ["development", "staging", "production", "test"],
      default: process.env.NODE_ENV || "development",
      index: true,
    },

    // Host/Instance information
    hostname: {
      type: String,
      trim: true,
    },

    // Process ID
    pid: {
      type: Number,
    },

    // Timestamp with automatic indexing
    timestamp: {
      type: Date,
      default: Date.now,
      index: -1, // Descending index for faster recent queries
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    strict: true, // Prevents saving unspecified fields
    validateBeforeSave: true,
  },
);

// ==================== INDEXES ====================

// Compound indexes for common query patterns
systemLogSchema.index({ level: 1, timestamp: -1 });
systemLogSchema.index({ service: 1, timestamp: -1 });
systemLogSchema.index({ component: 1, timestamp: -1 });
systemLogSchema.index({ "user.id": 1, timestamp: -1 });
systemLogSchema.index({ correlationId: 1, timestamp: -1 });
systemLogSchema.index({ "error.code": 1, timestamp: -1 });
systemLogSchema.index({ environment: 1, timestamp: -1 });

// TTL index for automatic log cleanup (90 days retention)
systemLogSchema.index(
  { timestamp: 1 },
  {
    expireAfterSeconds: 7776000, // 90 days
    partialFilterExpression: { level: { $in: ["info", "debug", "trace"] } },
  },
);

// Error logs retention (180 days)
systemLogSchema.index(
  { timestamp: 1 },
  {
    expireAfterSeconds: 15552000, // 180 days
    partialFilterExpression: { level: { $in: ["error", "fatal"] } },
  },
);

// Warn logs retention (120 days)
systemLogSchema.index(
  { timestamp: 1 },
  {
    expireAfterSeconds: 10368000, // 120 days
    partialFilterExpression: { level: "warn" },
  },
);

// ==================== STATIC METHODS ====================

/**
 * Create an error log entry
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 * @returns {Promise<Document>} Created log entry
 */
systemLogSchema.statics.logError = async function (message, options = {}) {
  return this.create({
    level: "error",
    message,
    ...options,
    error: {
      name: options.error?.name || "Error",
      code: options.error?.code,
      stack: options.error?.stack,
      file: options.error?.file,
      line: options.error?.line,
    },
    timestamp: new Date(),
  });
};

/**
 * Create a warning log entry
 * @param {string} message - Warning message
 * @param {Object} options - Additional options
 * @returns {Promise<Document>} Created log entry
 */
systemLogSchema.statics.logWarn = async function (message, options = {}) {
  return this.create({
    level: "warn",
    message,
    ...options,
    timestamp: new Date(),
  });
};

/**
 * Create an info log entry
 * @param {string} message - Info message
 * @param {Object} options - Additional options
 * @returns {Promise<Document>} Created log entry
 */
systemLogSchema.statics.logInfo = async function (message, options = {}) {
  return this.create({
    level: "info",
    message,
    ...options,
    timestamp: new Date(),
  });
};

/**
 * Create a debug log entry
 * @param {string} message - Debug message
 * @param {Object} options - Additional options
 * @returns {Promise<Document>} Created log entry
 */
systemLogSchema.statics.logDebug = async function (message, options = {}) {
  return this.create({
    level: "debug",
    message,
    ...options,
    timestamp: new Date(),
  });
};

/**
 * Get logs by level with pagination
 * @param {string} level - Log level
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated logs
 */
systemLogSchema.statics.getByLevel = async function (
  level,
  page = 1,
  limit = 50,
) {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    this.find({ level }).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    this.countDocuments({ level }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get recent errors
 * @param {number} hours - Hours to look back
 * @param {number} limit - Maximum number of logs
 * @returns {Promise<Array>} Recent error logs
 */
systemLogSchema.statics.getRecentErrors = async function (
  hours = 24,
  limit = 100,
) {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  return this.find({
    level: { $in: ["error", "fatal"] },
    timestamp: { $gte: cutoffDate },
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Clean up old logs manually
 * @param {number} daysToKeep - Days of logs to keep
 * @returns {Promise<Object>} Deletion result
 */
systemLogSchema.statics.cleanupOldLogs = async function (daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate },
    level: { $nin: ["error", "fatal"] }, // Keep errors longer
  });

  return {
    deletedCount: result.deletedCount,
    cutoffDate,
    retentionDays: daysToKeep,
  };
};

/**
 * Get log statistics
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Statistics
 */
systemLogSchema.statics.getStatistics = async function (days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [byLevel, totalCount, errorByService] = await Promise.all([
    this.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: "$level", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    this.countDocuments({ timestamp: { $gte: startDate } }),
    this.aggregate([
      {
        $match: {
          level: { $in: ["error", "fatal"] },
          timestamp: { $gte: startDate },
        },
      },
      { $group: { _id: "$service", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    period: `${days} days`,
    startDate,
    totalLogs: totalCount,
    byLevel,
    topErrorServices: errorByService,
    averageLogsPerDay: Math.round(totalCount / days),
  };
};

// ==================== INSTANCE METHODS ====================

/**
 * Format log for output
 * @returns {Object} Formatted log object
 */
systemLogSchema.methods.formatForOutput = function () {
  const log = this.toObject();

  // Remove sensitive data
  if (log.request?.headers) {
    delete log.request.headers.authorization;
    delete log.request.headers.cookie;
    delete log.request.headers["x-api-key"];
  }

  // Format timestamp
  log.formattedTimestamp = this.timestamp.toISOString();

  // Add log level indicator
  log.levelIcon =
    {
      error: "❌",
      fatal: "💀",
      warn: "⚠️",
      info: "ℹ️",
      debug: "🐛",
      trace: "🔍",
    }[this.level] || "📝";

  return log;
};

/**
 * Check if log is error level
 * @returns {boolean}
 */
systemLogSchema.methods.isError = function () {
  return ["error", "fatal"].includes(this.level);
};

/**
 * Check if log is warning level
 * @returns {boolean}
 */
systemLogSchema.methods.isWarn = function () {
  return this.level === "warn";
};

/**
 * Get log age in hours
 * @returns {number}
 */
systemLogSchema.methods.getAgeInHours = function () {
  const age = Date.now() - this.timestamp.getTime();
  return age / (1000 * 60 * 60);
};

// ==================== PRE-SAVE MIDDLEWARE ====================

// Set environment, hostname, and PID before saving
systemLogSchema.pre("save", function (next) {
  if (!this.environment) {
    this.environment = process.env.NODE_ENV || "development";
  }

  if (!this.hostname) {
    const os = require("os");
    this.hostname = os.hostname();
  }

  if (!this.pid) {
    this.pid = process.pid;
  }

  // Ensure metadata is an object
  if (!this.metadata || typeof this.metadata !== "object") {
    this.metadata = {};
  }

  // Add timestamp if not set
  if (!this.timestamp) {
    this.timestamp = new Date();
  }

  next();
});

// ==================== VIRTUAL PROPERTIES ====================

systemLogSchema.virtual("isRecent").get(function () {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return this.timestamp.getTime() > oneHourAgo;
});

systemLogSchema.virtual("logLevelNumber").get(function () {
  const levels = { fatal: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 };
  return levels[this.level] || 3;
});

// Ensure virtuals are included in JSON output
systemLogSchema.set("toJSON", { virtuals: true });
systemLogSchema.set("toObject", { virtuals: true });

// ==================== EXPORT ====================

module.exports = mongoose.model("SystemLog", systemLogSchema);
