// models/HealthCheck.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Health Check Schema for system monitoring and observability
 * Tracks system health metrics including database, cache, disk, and memory status
 */
const healthCheckSchema = new Schema(
  {
    // Timestamp of health check
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
      description: "Time when health check was performed",
    },

    // Overall system status
    status: {
      type: String,
      enum: {
        values: ["healthy", "warning", "unhealthy", "degraded"],
        message:
          "Status must be either: healthy, warning, unhealthy, or degraded",
      },
      required: true,
      index: true,
      description: "Overall system health status",
    },

    // Individual component health checks
    checks: {
      database: {
        status: {
          type: String,
          enum: ["healthy", "degraded", "unhealthy", "unknown"],
          default: "unknown",
        },
        readyState: {
          type: Number,
          enum: [0, 1, 2, 3],
          description:
            "Mongoose connection readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting",
        },
        latency: {
          type: Number,
          description: "Database query latency in milliseconds",
        },
        error: {
          type: String,
          trim: true,
        },
      },

      redis: {
        status: {
          type: String,
          enum: [
            "healthy",
            "degraded",
            "unhealthy",
            "not_configured",
            "unknown",
          ],
          default: "not_configured",
        },
        latency: {
          type: Number,
          min: 0,
          description: "Redis ping latency in milliseconds",
        },
        connected: {
          type: Boolean,
          default: false,
        },
        error: {
          type: String,
          trim: true,
        },
      },

      disk: {
        status: {
          type: String,
          enum: ["healthy", "warning", "critical", "unknown"],
          default: "unknown",
        },
        total: {
          type: String,
          description: "Total disk space (human readable)",
        },
        totalBytes: {
          type: Number,
          description: "Total disk space in bytes",
        },
        free: {
          type: String,
          description: "Free disk space (human readable)",
        },
        freeBytes: {
          type: Number,
          description: "Free disk space in bytes",
        },
        used: {
          type: String,
          description: "Used disk space (human readable)",
        },
        usedBytes: {
          type: Number,
          description: "Used disk space in bytes",
        },
        freePercent: {
          type: Number,
          min: 0,
          max: 100,
          description: "Percentage of free disk space",
        },
        usedPercent: {
          type: Number,
          min: 0,
          max: 100,
          description: "Percentage of used disk space",
        },
        mountPoint: {
          type: String,
          trim: true,
          description: "Disk mount point checked",
        },
      },

      memory: {
        status: {
          type: String,
          enum: ["healthy", "warning", "critical", "unknown"],
          default: "unknown",
        },
        heapUsed: {
          type: String,
          description: "Heap used memory (human readable)",
        },
        heapUsedBytes: {
          type: Number,
          description: "Heap used memory in bytes",
        },
        heapTotal: {
          type: String,
          description: "Heap total memory (human readable)",
        },
        heapTotalBytes: {
          type: Number,
          description: "Heap total memory in bytes",
        },
        percentUsed: {
          type: Number,
          min: 0,
          max: 100,
          description: "Percentage of heap memory used",
        },
        rss: {
          type: String,
          description: "Resident Set Size (human readable)",
        },
        rssBytes: {
          type: Number,
          description: "Resident Set Size in bytes",
        },
        external: {
          type: String,
          description: "External memory usage (human readable)",
        },
        externalBytes: {
          type: Number,
          description: "External memory usage in bytes",
        },
      },

      api: {
        status: {
          type: String,
          enum: ["healthy", "degraded", "unhealthy", "unknown"],
          default: "unknown",
        },
        uptime: {
          type: Number,
          description: "API server uptime in seconds",
        },
        responseTime: {
          type: Number,
          description: "API response time in milliseconds",
        },
        activeRequests: {
          type: Number,
          min: 0,
          default: 0,
          description: "Number of active requests",
        },
      },
    },

    // Health check metadata
    metadata: {
      version: {
        type: String,
        trim: true,
        description: "Application version",
      },
      environment: {
        type: String,
        enum: ["development", "staging", "production", "test"],
        default: process.env.NODE_ENV || "development",
        description: "Environment where health check was performed",
      },
      hostname: {
        type: String,
        trim: true,
        description: "Server hostname",
      },
      processId: {
        type: Number,
        description: "Process ID of the application",
      },
    },

    // Error information if health check failed
    error: {
      type: String,
      trim: true,
      description: "Global error message if health check failed",
    },

    // Health check duration
    duration: {
      type: Number,
      min: 0,
      description: "Health check execution time in milliseconds",
    },

    // Health check summary
    summary: {
      healthy: {
        type: Number,
        default: 0,
        description: "Number of healthy components",
      },
      warning: {
        type: Number,
        default: 0,
        description: "Number of warning components",
      },
      unhealthy: {
        type: Number,
        default: 0,
        description: "Number of unhealthy components",
      },
    },
  },
  {
    timestamps: true,
    collection: "healthchecks",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for optimal query performance
healthCheckSchema.index({ status: 1, timestamp: -1 });
healthCheckSchema.index({ "checks.database.status": 1 });
healthCheckSchema.index({ "checks.redis.status": 1 });
healthCheckSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days
healthCheckSchema.index({ timestamp: -1 });

// Compound index for time-series queries
healthCheckSchema.index({
  status: 1,
  timestamp: -1,
  "metadata.environment": 1,
});

// Virtual for human-readable age
healthCheckSchema.virtual("age").get(function () {
  const now = new Date();
  const diff = now - this.timestamp;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
});

// Virtual for overall health score (0-100)
healthCheckSchema.virtual("healthScore").get(function () {
  let score = 100;

  if (this.status === "warning") score = 70;
  if (this.status === "degraded") score = 50;
  if (this.status === "unhealthy") score = 20;

  // Adjust based on component statuses
  const components = ["database", "redis", "disk", "memory", "api"];
  components.forEach((component) => {
    if (this.checks[component]?.status === "warning") score -= 10;
    if (this.checks[component]?.status === "degraded") score -= 20;
    if (this.checks[component]?.status === "unhealthy") score -= 30;
  });

  return Math.max(0, Math.min(100, score));
});

// Instance method: Check if health check is recent
healthCheckSchema.methods.isRecent = function (maxAgeMinutes = 5) {
  const now = new Date();
  const ageInMinutes = (now - this.timestamp) / (1000 * 60);
  return ageInMinutes <= maxAgeMinutes;
};

// Static method: Get latest health check
healthCheckSchema.statics.getLatest = async function (status = null) {
  const query = status ? { status } : {};
  return this.findOne(query).sort({ timestamp: -1 });
};

// Static method: Get health check summary for time range
healthCheckSchema.statics.getSummary = async function (hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const summary = await this.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: null,
        totalChecks: { $sum: 1 },
        healthy: { $sum: { $cond: [{ $eq: ["$status", "healthy"] }, 1, 0] } },
        warning: { $sum: { $cond: [{ $eq: ["$status", "warning"] }, 1, 0] } },
        degraded: { $sum: { $cond: [{ $eq: ["$status", "degraded"] }, 1, 0] } },
        unhealthy: {
          $sum: { $cond: [{ $eq: ["$status", "unhealthy"] }, 1, 0] },
        },
        avgDuration: { $avg: "$duration" },
      },
    },
  ]);

  return (
    summary[0] || {
      totalChecks: 0,
      healthy: 0,
      warning: 0,
      degraded: 0,
      unhealthy: 0,
      avgDuration: 0,
    }
  );
};

// Pre-save middleware to calculate summary
healthCheckSchema.pre("save", function (next) {
  // Calculate component summary
  this.summary = {
    healthy: 0,
    warning: 0,
    unhealthy: 0,
  };

  const components = ["database", "redis", "disk", "memory", "api"];
  components.forEach((component) => {
    const status = this.checks[component]?.status;
    if (status === "healthy") this.summary.healthy++;
    else if (status === "warning" || status === "degraded")
      this.summary.warning++;
    else if (status === "unhealthy") this.summary.unhealthy++;
  });

  next();
});

// Create the model
const HealthCheck = mongoose.model("HealthCheck", healthCheckSchema);

module.exports = HealthCheck;
