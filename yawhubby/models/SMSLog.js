// models/SMSLog.js
// Professional SMS Logging Model with Analytics and Retention Policies

const mongoose = require("mongoose");

/**
 * SMS Log Schema - Enterprise Grade Logging
 * Tracks all SMS activities across multiple providers with analytics support
 */
const smsLogSchema = new mongoose.Schema(
  {
    // Core Message Data
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^\+?[1-9]\d{1,14}$/.test(v); // E.164 format
        },
        message:
          "Invalid phone number format. Must be E.164 format (e.g., +233XXXXXXXXX)",
      },
    },

    message: {
      type: String,
      required: [true, "Message content is required"],
      maxlength: [1600, "Message cannot exceed 1600 characters"],
      trim: true,
    },

    messageHash: {
      type: String,
      index: true,
      description: "SHA-256 hash of message for duplicate detection",
    },

    // Provider Information
    provider: {
      type: String,
      enum: {
        values: ["textbee", "twilio", "africasTalking", "vonage", "simulated"],
        message: "Invalid SMS provider",
      },
      required: true,
      index: true,
    },

    providerMessageId: {
      type: String,
      index: true,
      sparse: true,
      description: "Provider-specific message ID for tracking",
    },

    // Status Tracking
    status: {
      type: String,
      enum: {
        values: [
          "queued",
          "sent",
          "delivered",
          "failed",
          "pending",
          "cancelled",
        ],
        message: "Invalid status value",
      },
      default: "queued",
      required: true,
      index: true,
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "queued",
            "sent",
            "delivered",
            "failed",
            "pending",
            "cancelled",
          ],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        reason: String,
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],

    // Error Handling
    errorCode: {
      type: String,
      index: true,
      description: "Provider-specific error code",
    },

    errorMessage: {
      type: String,
      description: "Human-readable error description",
    },

    retryCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Cost Tracking
    cost: {
      type: Number,
      default: 0,
      min: 0,
      description: "Cost in USD or local currency",
    },

    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      enum: ["USD", "GHS", "KES", "NGN", "EUR"],
    },

    // Metadata and Context
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      description: "Additional context (noticeId, eventId, userId, etc.)",
    },

    // Timing Information
    queuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    sentAt: {
      type: Date,
      index: true,
    },

    deliveredAt: {
      type: Date,
      index: true,
    },

    failedAt: {
      type: Date,
      index: true,
    },

    // Delivery Metrics
    deliveryDuration: {
      type: Number,
      description: "Time from sent to delivered in milliseconds",
    },

    // User Association
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      description: "Associated user who received the SMS",
    },

    // Batch Information
    batchId: {
      type: String,
      index: true,
      description: "Batch ID for bulk SMS operations",
    },

    // Webhook Data
    webhookData: {
      type: mongoose.Schema.Types.Mixed,
      description: "Raw webhook data from provider",
    },

    // Audit Trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      description: "User who initiated the SMS (if applicable)",
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "sms_logs",
    strict: true,
  },
);

// ============================================================
// INDEXES FOR PERFORMANCE
// ============================================================

// Compound indexes for common queries
smsLogSchema.index({ provider: 1, status: 1, createdAt: -1 });
smsLogSchema.index({ phoneNumber: 1, createdAt: -1 });
smsLogSchema.index({ batchId: 1, status: 1 });
smsLogSchema.index({ userId: 1, createdAt: -1 });
smsLogSchema.index({ status: 1, retryCount: 1 });
smsLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // Auto-delete after 90 days

// Unique constraint for provider message ID (sparse because not all providers return IDs)
smsLogSchema.index(
  { providerMessageId: 1, provider: 1 },
  { unique: true, sparse: true },
);

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Update SMS status with history tracking
 * @param {string} newStatus - New status to set
 * @param {Object} options - Additional options (error, metadata, etc.)
 */
smsLogSchema.methods.updateStatus = async function (newStatus, options = {}) {
  const oldStatus = this.status;

  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    reason: options.reason,
    metadata: options.metadata,
  });

  // Update status and timestamps
  this.status = newStatus;

  switch (newStatus) {
    case "sent":
      this.sentAt = new Date();
      break;
    case "delivered":
      this.deliveredAt = new Date();
      if (this.sentAt) {
        this.deliveryDuration = this.deliveredAt - this.sentAt;
      }
      break;
    case "failed":
      this.failedAt = new Date();
      if (options.errorCode) this.errorCode = options.errorCode;
      if (options.errorMessage) this.errorMessage = options.errorMessage;
      break;
  }

  if (options.errorCode) this.errorCode = options.errorCode;
  if (options.errorMessage) this.errorMessage = options.errorMessage;

  await this.save();

  // Emit event for real-time monitoring
  this.emit("statusChange", {
    logId: this._id,
    oldStatus,
    newStatus,
    timestamp: new Date(),
  });

  return this;
};

/**
 * Mark SMS as failed with retry logic
 * @param {Error} error - Error object
 * @param {boolean} shouldRetry - Whether to retry
 */
smsLogSchema.methods.markFailed = async function (error, shouldRetry = false) {
  this.retryCount += 1;

  await this.updateStatus("failed", {
    errorCode: error.code || "UNKNOWN_ERROR",
    errorMessage: error.message,
    reason: `Attempt ${this.retryCount} failed`,
  });

  return {
    failed: true,
    retryCount: this.retryCount,
    shouldRetry: shouldRetry && this.retryCount < 3,
  };
};

/**
 * Calculate delivery success rate
 */
smsLogSchema.methods.getDeliveryMetrics = function () {
  return {
    totalTime: this.deliveryDuration,
    sentAt: this.sentAt,
    deliveredAt: this.deliveredAt,
    provider: this.provider,
    cost: this.cost,
  };
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Get SMS statistics for dashboard
 * @param {Object} filters - Date range, provider, etc.
 */
smsLogSchema.statics.getStatistics = async function (filters = {}) {
  const match = {};

  if (filters.startDate) {
    match.createdAt = { $gte: filters.startDate };
  }
  if (filters.endDate) {
    match.createdAt = { ...match.createdAt, $lte: filters.endDate };
  }
  if (filters.provider) {
    match.provider = filters.provider;
  }
  if (filters.status) {
    match.status = filters.status;
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        successfulMessages: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
        },
        failedMessages: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
        },
        pendingMessages: {
          $sum: {
            $cond: [{ $in: ["$status", ["queued", "sent", "pending"]] }, 1, 0],
          },
        },
        totalCost: { $sum: "$cost" },
        averageDeliveryTime: {
          $avg: "$deliveryDuration",
        },
        uniqueRecipients: { $addToSet: "$phoneNumber" },
      },
    },
  ]);

  const result = stats[0] || {
    totalMessages: 0,
    successfulMessages: 0,
    failedMessages: 0,
    pendingMessages: 0,
    totalCost: 0,
    averageDeliveryTime: 0,
    uniqueRecipients: [],
  };

  result.successRate =
    result.totalMessages > 0
      ? ((result.successfulMessages / result.totalMessages) * 100).toFixed(2)
      : 0;

  result.uniqueRecipientsCount = result.uniqueRecipients.length;
  delete result.uniqueRecipients;

  return result;
};

/**
 * Get provider performance metrics
 */
smsLogSchema.statics.getProviderMetrics = async function (dateRange = {}) {
  const match = {};
  if (dateRange.start) match.createdAt = { $gte: dateRange.start };
  if (dateRange.end)
    match.createdAt = { ...match.createdAt, $lte: dateRange.end };

  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$provider",
        totalSent: { $sum: 1 },
        successful: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
        },
        failed: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
        },
        totalCost: { $sum: "$cost" },
        avgDeliveryTime: { $avg: "$deliveryDuration" },
      },
    },
    {
      $project: {
        provider: "$_id",
        totalSent: 1,
        successful: 1,
        failed: 1,
        totalCost: 1,
        avgDeliveryTime: 1,
        successRate: {
          $multiply: [
            { $divide: ["$successful", { $max: ["$totalSent", 1] }] },
            100,
          ],
        },
      },
    },
    { $sort: { totalSent: -1 } },
  ]);
};

/**
 * Get daily SMS volume for charts
 */
smsLogSchema.statics.getDailyVolume = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        sent: {
          $sum: { $cond: [{ $eq: ["$_id.status", "sent"] }, "$count", 0] },
        },
        delivered: {
          $sum: { $cond: [{ $eq: ["$_id.status", "delivered"] }, "$count", 0] },
        },
        failed: {
          $sum: { $cond: [{ $eq: ["$_id.status", "failed"] }, "$count", 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

/**
 * Find failed messages that need retry
 */
smsLogSchema.statics.findFailedForRetry = async function (maxRetries = 3) {
  return await this.find({
    status: "failed",
    retryCount: { $lt: maxRetries },
    createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
  }).sort({ createdAt: -1 });
};

// ============================================================
// HOOKS (Middleware)
// ============================================================

// Pre-save hook to generate message hash
smsLogSchema.pre("save", function (next) {
  if (this.isModified("message")) {
    const crypto = require("crypto");
    this.messageHash = crypto
      .createHash("sha256")
      .update(`${this.message}${this.phoneNumber}`)
      .digest("hex");
  }

  this.updatedAt = new Date();
  next();
});

// Post-save hook for analytics
smsLogSchema.post("save", function (doc) {
  // Could emit to analytics service
  if (process.env.NODE_ENV === "production") {
    // Send to monitoring system
    console.log(
      `[SMS Log] ${doc.status} - ${doc.provider} - ${doc.phoneNumber}`,
    );
  }
});

// ============================================================
// VIRTUAL PROPERTIES
// ============================================================

smsLogSchema.virtual("isSuccessful").get(function () {
  return this.status === "delivered";
});

smsLogSchema.virtual("isPending").get(function () {
  return ["queued", "sent", "pending"].includes(this.status);
});

smsLogSchema.virtual("costInGHS").get(function () {
  if (this.currency === "USD") {
    return this.cost * 15; // Approximate conversion
  }
  return this.cost;
});

// ============================================================
// EXPORT
// ============================================================

module.exports = mongoose.model("SMSLog", smsLogSchema);
