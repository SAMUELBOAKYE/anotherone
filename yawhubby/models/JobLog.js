// models/JobLog.js
// Professional Job Logging Model for Queue Monitoring and Analytics
// Tracks all background jobs across multiple queues with performance metrics

const mongoose = require("mongoose");

// ============================================================
// SCHEMA DEFINITION
// ============================================================

const jobLogSchema = new mongoose.Schema(
  {
    // ========================================================
    // JOB IDENTIFICATION
    // ========================================================
    jobId: {
      type: String,
      required: [true, "Job ID is required"],
      unique: false, // Combined with queue for uniqueness
      index: true,
      trim: true,
      description: "Unique job identifier from queue system",
    },

    queue: {
      type: String,
      required: [true, "Queue name is required"],
      enum: {
        values: [
          "sms-queue",
          "email-queue",
          "notification-queue",
          "report-queue",
          "file-process-queue",
          "backup-queue",
          "cleanup-queue",
          "digest-queue",
        ],
        message: "Invalid queue name: {VALUE}",
      },
      index: true,
      description: "Name of the queue processing this job",
    },

    jobType: {
      type: String,
      required: true,
      enum: [
        "send_sms",
        "send_bulk_sms",
        "send_email",
        "send_bulk_email",
        "create_notification",
        "generate_report",
        "process_image",
        "generate_pdf",
        "backup_database",
        "cleanup_data",
        "send_digest",
        "retry_failed",
      ],
      index: true,
      description: "Type of job being processed",
    },

    // ========================================================
    // JOB DATA
    // ========================================================
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      description: "Job input data/payload",
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
      description: "Job result/output data",
    },

    // ========================================================
    // STATUS TRACKING
    // ========================================================
    status: {
      type: String,
      required: true,
      enum: {
        values: [
          "pending",
          "processing",
          "completed",
          "failed",
          "cancelled",
          "retrying",
        ],
        message: "Invalid status: {VALUE}",
      },
      default: "pending",
      index: true,
      description: "Current job status",
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "pending",
            "processing",
            "completed",
            "failed",
            "cancelled",
            "retrying",
          ],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        message: String,
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],

    // ========================================================
    // PERFORMANCE METRICS
    // ========================================================
    startedAt: {
      type: Date,
      index: true,
      description: "When job processing started",
    },

    completedAt: {
      type: Date,
      index: true,
      description: "When job completed successfully",
    },

    failedAt: {
      type: Date,
      index: true,
      description: "When job failed",
    },

    duration: {
      type: Number,
      min: 0,
      description: "Job processing duration in milliseconds",
    },

    queueWaitTime: {
      type: Number,
      min: 0,
      description: "Time spent waiting in queue (ms)",
    },

    // ========================================================
    // RETRY INFORMATION
    // ========================================================
    attempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 10,
      description: "Number of processing attempts",
    },

    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
      max: 10,
      description: "Maximum number of retries allowed",
    },

    nextRetryAt: {
      type: Date,
      index: true,
      description: "When to retry a failed job",
    },

    retryReason: {
      type: String,
      description: "Reason for retry",
    },

    // ========================================================
    // ERROR INFORMATION
    // ========================================================
    error: {
      type: String,
      description: "Error message if job failed",
    },

    errorCode: {
      type: String,
      index: true,
      description: "Error code for categorization",
    },

    errorStack: {
      type: String,
      description: "Error stack trace",
    },

    errorContext: {
      type: mongoose.Schema.Types.Mixed,
      description: "Additional error context",
    },

    // ========================================================
    // RESOURCE METRICS
    // ========================================================
    memoryUsage: {
      type: Number,
      description: "Memory usage during job execution (bytes)",
    },

    cpuUsage: {
      type: Number,
      description: "CPU usage percentage during job execution",
    },

    // ========================================================
    // BUSINESS CONTEXT
    // ========================================================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      description: "User who initiated the job",
    },

    batchId: {
      type: String,
      index: true,
      description: "Batch identifier for grouped jobs",
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal",
      index: true,
      description: "Job priority level",
    },

    tags: [
      {
        type: String,
        index: true,
        description: "Tags for categorization and filtering",
      },
    ],

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      description: "Additional job metadata",
    },

    // ========================================================
    // SOURCE INFORMATION
    // ========================================================
    source: {
      type: String,
      enum: ["api", "cron", "webhook", "manual", "system", "retry"],
      default: "api",
      description: "Source that created this job",
    },

    sourceId: {
      type: String,
      description: "Identifier from source system",
    },

    ipAddress: {
      type: String,
      description: "IP address of requestor (if applicable)",
    },

    userAgent: {
      type: String,
      description: "User agent of requestor (if applicable)",
    },

    // ========================================================
    // TIMESTAMPS
    // ========================================================
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      description: "When job was created",
    },

    updatedAt: {
      type: Date,
      default: Date.now,
      description: "When job was last updated",
    },

    expiresAt: {
      type: Date,
      index: true,
      description: "When job log expires (TTL)",
    },
  },
  {
    timestamps: true,
    collection: "job_logs",
    strict: true,
    versionKey: "__v",
  },
);

// ============================================================
// INDEXES
// ============================================================

// Compound indexes for common queries
jobLogSchema.index({ queue: 1, status: 1, createdAt: -1 });
jobLogSchema.index({ jobType: 1, status: 1 });
jobLogSchema.index({ batchId: 1, status: 1 });
jobLogSchema.index({ userId: 1, createdAt: -1 });
jobLogSchema.index({ priority: 1, status: 1 });
jobLogSchema.index({ tags: 1, createdAt: -1 });
jobLogSchema.index({ errorCode: 1, createdAt: -1 });

// Performance monitoring indexes
jobLogSchema.index({ duration: -1, createdAt: -1 });
jobLogSchema.index({ queueWaitTime: -1, createdAt: -1 });
jobLogSchema.index({ memoryUsage: -1, createdAt: -1 });

// Retry indexes
jobLogSchema.index({ nextRetryAt: 1, status: 1 });
jobLogSchema.index({ attempts: 1, status: 1 });

// Unique compound index
jobLogSchema.index({ jobId: 1, queue: 1 }, { unique: true });

// TTL index for auto-deletion (90 days retention)
jobLogSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 7776000, // 90 days
    partialFilterExpression: {
      status: { $in: ["completed", "failed", "cancelled"] },
    },
  },
);

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Start job processing
 * @param {Object} options - Start options
 */
jobLogSchema.methods.startProcessing = async function (options = {}) {
  const now = new Date();

  this.status = "processing";
  this.startedAt = now;
  this.queueWaitTime = now - this.createdAt;

  if (options.metadata) {
    this.metadata = { ...this.metadata, ...options.metadata };
  }

  await this.addToStatusHistory("processing", options.message);
  await this.save();

  return this;
};

/**
 * Complete job successfully
 * @param {Object} result - Job result data
 * @param {Object} options - Completion options
 */
jobLogSchema.methods.complete = async function (result, options = {}) {
  const now = new Date();

  this.status = "completed";
  this.completedAt = now;
  this.duration = now - this.startedAt;
  this.result = result;

  if (options.memoryUsage) this.memoryUsage = options.memoryUsage;
  if (options.cpuUsage) this.cpuUsage = options.cpuUsage;

  await this.addToStatusHistory(
    "completed",
    options.message || "Job completed successfully",
  );
  await this.save();

  return this;
};

/**
 * Mark job as failed
 * @param {Error} error - Error object
 * @param {Object} options - Failure options
 */
jobLogSchema.methods.fail = async function (error, options = {}) {
  const now = new Date();

  this.status = "failed";
  this.failedAt = now;
  this.duration = now - this.startedAt;
  this.error = error.message;
  this.errorCode = error.code || options.errorCode || "UNKNOWN_ERROR";
  this.errorStack = error.stack;
  this.errorContext = options.context || {};

  if (options.shouldRetry && this.attempts < this.maxRetries) {
    this.status = "retrying";
    this.nextRetryAt = options.nextRetryAt || this.calculateNextRetryTime();
    this.retryReason = options.retryReason || error.message;
  }

  await this.addToStatusHistory("failed", error.message);
  await this.save();

  return this;
};

/**
 * Calculate next retry time using exponential backoff
 */
jobLogSchema.methods.calculateNextRetryTime = function () {
  const backoffDelays = [60000, 300000, 900000, 3600000]; // 1min, 5min, 15min, 1hour
  const delay = backoffDelays[this.attempts] || 3600000;
  return new Date(Date.now() + delay);
};

/**
 * Add entry to status history
 * @param {string} status - New status
 * @param {string} message - Status message
 */
jobLogSchema.methods.addToStatusHistory = async function (
  status,
  message = "",
) {
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    message,
    metadata: {
      attempts: this.attempts,
      duration: this.duration,
      memoryUsage: this.memoryUsage,
    },
  });
};

/**
 * Update job metadata
 * @param {Object} metadata - Metadata to merge
 */
jobLogSchema.methods.updateMetadata = async function (metadata) {
  this.metadata = { ...this.metadata, ...metadata };
  await this.save();
  return this;
};

/**
 * Add tags to job
 * @param {string|string[]} tags - Tags to add
 */
jobLogSchema.methods.addTags = async function (tags) {
  const tagsArray = Array.isArray(tags) ? tags : [tags];
  this.tags = [...new Set([...this.tags, ...tagsArray])];
  await this.save();
  return this;
};

/**
 * Calculate job statistics
 */
jobLogSchema.methods.getStats = function () {
  return {
    jobId: this.jobId,
    queue: this.queue,
    jobType: this.jobType,
    status: this.status,
    attempts: this.attempts,
    duration: this.duration,
    queueWaitTime: this.queueWaitTime,
    memoryUsage: this.memoryUsage
      ? `${Math.round(this.memoryUsage / 1024 / 1024)}MB`
      : null,
    createdAt: this.createdAt,
    completedAt: this.completedAt,
    failedAt: this.failedAt,
  };
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Get job statistics for dashboard
 * @param {Object} filters - Filter criteria
 */
jobLogSchema.statics.getStatistics = async function (filters = {}) {
  const match = {};

  if (filters.startDate) {
    match.createdAt = { $gte: filters.startDate };
  }
  if (filters.endDate) {
    match.createdAt = { ...match.createdAt, $lte: filters.endDate };
  }
  if (filters.queue) {
    match.queue = filters.queue;
  }
  if (filters.jobType) {
    match.jobType = filters.jobType;
  }
  if (filters.status) {
    match.status = filters.status;
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,
              totalJobs: { $sum: 1 },
              completedJobs: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
              },
              failedJobs: {
                $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
              },
              pendingJobs: {
                $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
              },
              processingJobs: {
                $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
              },
              avgDuration: { $avg: "$duration" },
              avgQueueWait: { $avg: "$queueWaitTime" },
              totalRetries: { $sum: "$attempts" },
            },
          },
        ],
        byQueue: [
          {
            $group: {
              _id: "$queue",
              total: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
              },
              failed: {
                $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
              },
              avgDuration: { $avg: "$duration" },
            },
          },
          { $sort: { total: -1 } },
        ],
        byJobType: [
          {
            $group: {
              _id: "$jobType",
              total: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
              },
              failed: {
                $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
              },
            },
          },
          { $sort: { total: -1 } },
        ],
        byHour: [
          {
            $group: {
              _id: {
                hour: { $hour: "$createdAt" },
                date: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.date": -1, "_id.hour": 1 } },
        ],
        errorDistribution: [
          { $match: { status: "failed", errorCode: { $exists: true } } },
          {
            $group: {
              _id: "$errorCode",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
      },
    },
  ]);

  const result = stats[0];

  return {
    overview: result.overview[0] || {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      pendingJobs: 0,
      processingJobs: 0,
      avgDuration: 0,
      avgQueueWait: 0,
      totalRetries: 0,
    },
    byQueue: result.byQueue,
    byJobType: result.byJobType,
    byHour: result.byHour,
    errorDistribution: result.errorDistribution,
    successRate: result.overview[0]
      ? (
          (result.overview[0].completedJobs / result.overview[0].totalJobs) *
          100
        ).toFixed(2)
      : 0,
  };
};

/**
 * Get jobs pending retry
 * @param {number} limit - Maximum number of jobs to return
 */
jobLogSchema.statics.getPendingRetries = async function (limit = 100) {
  const now = new Date();

  return await this.find({
    status: "retrying",
    nextRetryAt: { $lte: now },
    attempts: { $lt: "$maxRetries" },
  })
    .sort({ nextRetryAt: 1 })
    .limit(limit)
    .lean();
};

/**
 * Get failed jobs summary
 * @param {Object} filters - Filter criteria
 */
jobLogSchema.statics.getFailedJobsSummary = async function (filters = {}) {
  const match = { status: "failed" };

  if (filters.startDate) {
    match.failedAt = { $gte: filters.startDate };
  }
  if (filters.endDate) {
    match.failedAt = { ...match.failedAt, $lte: filters.endDate };
  }
  if (filters.queue) {
    match.queue = filters.queue;
  }

  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          queue: "$queue",
          errorCode: "$errorCode",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$failedAt" } },
        },
        count: { $sum: 1 },
        samples: {
          $push: { jobId: "$jobId", error: "$error", createdAt: "$createdAt" },
        },
      },
    },
    { $sort: { count: -1 } },
    {
      $group: {
        _id: "$_id.queue",
        errors: {
          $push: {
            errorCode: "$_id.errorCode",
            date: "$_id.date",
            count: "$count",
            sample: { $arrayElemAt: ["$samples", 0] },
          },
        },
        total: { $sum: "$count" },
      },
    },
    { $sort: { total: -1 } },
  ]);
};

/**
 * Clean old job logs
 * @param {number} retentionDays - Days to retain logs
 */
jobLogSchema.statics.cleanOldLogs = async function (retentionDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ["completed", "failed", "cancelled"] },
  });

  return {
    deletedCount: result.deletedCount,
    cutoffDate,
  };
};

/**
 * Get job performance metrics
 * @param {Object} options - Query options
 */
jobLogSchema.statics.getPerformanceMetrics = async function (options = {}) {
  const match = {
    status: "completed",
    duration: { $exists: true },
  };

  if (options.startDate) {
    match.completedAt = { $gte: options.startDate };
  }
  if (options.endDate) {
    match.completedAt = { ...match.completedAt, $lte: options.endDate };
  }
  if (options.queue) {
    match.queue = options.queue;
  }

  const metrics = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$jobType",
        avgDuration: { $avg: "$duration" },
        minDuration: { $min: "$duration" },
        maxDuration: { $max: "$duration" },
        p95Duration: { $percentile: { p: 95, input: "$duration" } },
        totalJobs: { $sum: 1 },
        avgQueueWait: { $avg: "$queueWaitTime" },
        avgMemoryUsage: { $avg: "$memoryUsage" },
      },
    },
    { $sort: { avgDuration: -1 } },
  ]);

  return metrics;
};

// ============================================================
// VIRTUAL PROPERTIES
// ============================================================

jobLogSchema.virtual("isSuccessful").get(function () {
  return this.status === "completed";
});

jobLogSchema.virtual("isPending").get(function () {
  return ["pending", "processing", "retrying"].includes(this.status);
});

jobLogSchema.virtual("humanDuration").get(function () {
  if (!this.duration) return "N/A";
  if (this.duration < 1000) return `${this.duration}ms`;
  if (this.duration < 60000) return `${(this.duration / 1000).toFixed(2)}s`;
  return `${(this.duration / 60000).toFixed(2)}m`;
});

jobLogSchema.virtual("humanQueueWait").get(function () {
  if (!this.queueWaitTime) return "N/A";
  if (this.queueWaitTime < 1000) return `${this.queueWaitTime}ms`;
  if (this.queueWaitTime < 60000)
    return `${(this.queueWaitTime / 1000).toFixed(2)}s`;
  return `${(this.queueWaitTime / 60000).toFixed(2)}m`;
});

// ============================================================
// MIDDLEWARE
// ============================================================

// Pre-save middleware
jobLogSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Set expiry for completed/failed jobs
  if (
    !this.expiresAt &&
    ["completed", "failed", "cancelled"].includes(this.status)
  ) {
    this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }

  next();
});

// Pre-validate middleware
jobLogSchema.pre("validate", function (next) {
  if (!this.jobId && !this._id) {
    const crypto = require("crypto");
    this.jobId = crypto.randomBytes(16).toString("hex");
  }
  next();
});

// Post-save middleware for real-time monitoring
jobLogSchema.post("save", function (doc) {
  // Emit event for real-time monitoring
  if (process.env.NODE_ENV === "production") {
    // Could emit to WebSocket or monitoring system
    console.log(`[JobLog] ${doc.status} - ${doc.jobType} - ${doc.duration}ms`);
  }
});

// ============================================================
// STATIC HELPERS
// ============================================================

/**
 * Create job log entry
 * @param {Object} data - Job data
 */
jobLogSchema.statics.createJobLog = async function (data) {
  const jobLog = new this({
    jobId: data.jobId,
    queue: data.queue,
    jobType: data.jobType,
    data: data.data,
    userId: data.userId,
    batchId: data.batchId,
    priority: data.priority || "normal",
    tags: data.tags || [],
    metadata: data.metadata || {},
    source: data.source || "api",
    sourceId: data.sourceId,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    maxRetries: data.maxRetries || 3,
  });

  await jobLog.save();
  return jobLog;
};

/**
 * Update job status
 * @param {string} jobId - Job identifier
 * @param {string} queue - Queue name
 * @param {string} status - New status
 * @param {Object} options - Update options
 */
jobLogSchema.statics.updateJobStatus = async function (
  jobId,
  queue,
  status,
  options = {},
) {
  const jobLog = await this.findOne({ jobId, queue });

  if (!jobLog) {
    throw new Error(`Job ${jobId} not found in queue ${queue}`);
  }

  switch (status) {
    case "processing":
      await jobLog.startProcessing(options);
      break;
    case "completed":
      await jobLog.complete(options.result, options);
      break;
    case "failed":
      await jobLog.fail(options.error, options);
      break;
    default:
      jobLog.status = status;
      await jobLog.addToStatusHistory(status, options.message);
      await jobLog.save();
  }

  return jobLog;
};

// ============================================================
// EXPORT
// ============================================================

module.exports = mongoose.model("JobLog", jobLogSchema);
