const mongoose = require("mongoose");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const moment = require("moment");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const NodeCache = require("node-cache");

const User = require("../models/User");
const Notice = require("../models/Notice");
const Event = require("../models/Event");
const HealthCheck = require("../models/HealthCheck");
const SystemLog = require("../models/SystemLog");
const Backup = require("../models/Backup");
const APIKey = require("../models/APIKey");
const Notification = require("../models/Notification");
const { createAuditLog } = require("../utils/auditLogger");
const {
  clearCache,
  getCacheStats,
  getCacheManager,
} = require("../utils/cacheManager");
const { sendNotification } = require("../utils/notificationService");
const { sendEmail } = require("../utils/emailService");
const {
  backupDatabase,
  restoreDatabase,
  optimizeDatabase,
  getDatabaseStats,
} = require("../utils/databaseUtils");
const {
  getDiskSpace,
  getMemoryUsage,
  getCPUUsage,
} = require("../utils/systemUtils");

const logger = require("../utils/logger");

// ============================================================
// REDIS DISABLE - COMPLETE MOCK IMPLEMENTATION
// ============================================================
const REDIS_ENABLED = process.env.REDIS_ENABLED === "true";

// Mock Redis Client - No actual Redis connection
class MockRedisClient {
  constructor() {
    this._data = new Map();
    this._keys = new Set();
    logger.info(
      "📋 Mock Redis client initialized (Redis disabled - using memory storage)",
    );
  }

  async ping() {
    return "PONG";
  }

  async get(key) {
    const value = this._data.get(key);
    return value ? JSON.stringify(value) : null;
  }

  async set(key, value, ...args) {
    let parsedValue = value;
    if (typeof value === "string") {
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        parsedValue = value;
      }
    }
    this._data.set(key, parsedValue);
    this._keys.add(key);
    return "OK";
  }

  async setex(key, seconds, value) {
    let parsedValue = value;
    if (typeof value === "string") {
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        parsedValue = value;
      }
    }
    this._data.set(key, parsedValue);
    this._keys.add(key);
    // Set expiry (simplified - doesn't auto-expire)
    setTimeout(() => {
      if (this._data.get(key) === parsedValue) {
        this._data.delete(key);
        this._keys.delete(key);
      }
    }, seconds * 1000);
    return "OK";
  }

  async del(key) {
    const deleted = this._data.delete(key);
    this._keys.delete(key);
    return deleted ? 1 : 0;
  }

  async keys(pattern) {
    const patternStr = pattern.replace(/\*/g, "");
    return Array.from(this._keys).filter((k) => k.includes(patternStr));
  }

  on(event, callback) {
    return this;
  }

  async quit() {
    this._data.clear();
    this._keys.clear();
    logger.info("Mock Redis client closed");
    return;
  }

  disconnect() {
    this._data.clear();
    this._keys.clear();
  }
}

// Initialize mock Redis client (always use mock since REDIS_ENABLED=false)
let redisClient = new MockRedisClient();
logger.info(
  "✅ Mock Redis client initialized for admin features (Redis disabled)",
);

// ============================================================
// CONSTANTS & CONFIGURATION
// ============================================================

const ADMIN_CONFIG = {
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
    defaultPage: 1,
  },
  cacheKeys: {
    SYSTEM_STATS: "admin:system:stats",
    SERVICE_STATUS: "admin:services:status",
    DASHBOARD_DATA: "admin:dashboard:data",
    USER_STATS: "admin:users:stats",
    NOTICE_STATS: "admin:notices:stats",
  },
  rateLimits: {
    backup: { windowMs: 3600000, max: 5 },
    export: { windowMs: 3600000, max: 10 },
    notification: { windowMs: 60000, max: 20 },
  },
  allowedConfigKeys: [
    "ENABLE_REGISTRATION",
    "REQUIRE_EMAIL_VERIFICATION",
    "ENABLE_FILE_UPLOADS",
    "ENABLE_COMMENTS",
    "ENABLE_NOTIFICATIONS",
    "MAX_FILE_SIZE",
    "MAX_NOTICES_PER_USER",
    "NOTICE_EXPIRY_DAYS",
    "RATE_LIMIT",
    "JWT_EXPIRES_IN",
    "MAX_LOGIN_ATTEMPTS",
    "LOCKOUT_DURATION",
  ],
  exportFormats: ["json", "csv", "xlsx"],
  reportPeriods: ["day", "week", "month", "year", "custom"],
};

// Cache for admin dashboard data (5 minutes TTL)
const adminCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  if (!bytes) return "N/A";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
};

const logAdminAction = async (req, action, details = {}) => {
  try {
    await createAuditLog({
      userId: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      action,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get("user-agent"),
      requestId: req.requestId,
      endpoint: req.originalUrl,
      method: req.method,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    logger.error("Failed to create audit log:", error);
  }
};

const getPagination = (
  page,
  limit,
  maxLimit = ADMIN_CONFIG.pagination.maxLimit,
) => {
  const pageNum = Math.max(
    1,
    parseInt(page, 10) || ADMIN_CONFIG.pagination.defaultPage,
  );
  const limitNum = Math.min(
    maxLimit,
    Math.max(1, parseInt(limit, 10) || ADMIN_CONFIG.pagination.defaultLimit),
  );
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

const getCachedOrFresh = async (cacheKey, fetchFn, ttl = 300) => {
  let data = adminCache.get(cacheKey);
  if (data !== undefined)
    return { ...data, cached: true, cachedAt: new Date() };
  data = await fetchFn();
  adminCache.set(cacheKey, data, ttl);
  return { ...data, cached: false };
};

const invalidateAdminCache = (patterns = []) => {
  const keys = adminCache.keys();
  for (const key of keys) {
    if (patterns.length === 0 || patterns.some((p) => key.includes(p)))
      adminCache.del(key);
  }
};

// Mock Redis functions - using memory storage
const getBlockedIPs = async () => {
  if (!redisClient) return [];
  try {
    const keys = await redisClient.keys("blocked_ip:*");
    const ips = [];
    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) {
        try {
          ips.push(typeof data === "string" ? JSON.parse(data) : data);
        } catch (e) {
          ips.push(data);
        }
      }
    }
    return ips.sort((a, b) => new Date(b.blockedAt) - new Date(a.blockedAt));
  } catch (error) {
    logger.error("Error getting blocked IPs:", error);
    return [];
  }
};

const addToBlocklist = async (ipAddress, reason, userId, duration = 365) => {
  if (!redisClient) return false;
  try {
    const key = `blocked_ip:${ipAddress}`;
    const data = {
      ip: ipAddress,
      reason: reason || "No reason provided",
      blockedBy: userId,
      blockedAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + duration * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
    await redisClient.setex(key, duration * 86400, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error("Error adding IP to blocklist:", error);
    return false;
  }
};

const removeFromBlocklist = async (ipAddress) => {
  if (!redisClient) return false;
  try {
    const key = `blocked_ip:${ipAddress}`;
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error("Error removing IP from blocklist:", error);
    return false;
  }
};

const setMaintenanceStatus = async (enabled, message, userId) => {
  if (!redisClient) return false;
  try {
    const status = {
      enabled,
      message:
        message || "System is under maintenance. Please check back later.",
      setBy: userId,
      setAt: new Date().toISOString(),
    };
    if (enabled) {
      await redisClient.setex(
        "maintenance_mode",
        86400,
        JSON.stringify(status),
      );
    } else {
      await redisClient.del("maintenance_mode");
    }
    return true;
  } catch (error) {
    logger.error("Error setting maintenance status:", error);
    return false;
  }
};

const getMaintenanceStatus = async () => {
  if (!redisClient) return { enabled: false, message: null };
  try {
    const data = await redisClient.get("maintenance_mode");
    if (data) {
      try {
        return typeof data === "string" ? JSON.parse(data) : data;
      } catch (e) {
        return { enabled: false, message: null };
      }
    }
    return { enabled: false, message: null };
  } catch (error) {
    logger.error("Error getting maintenance status:", error);
    return { enabled: false, message: null };
  }
};

const generateAPIKey = () => {
  const prefix = process.env.API_KEY_PREFIX || "kaaf";
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(32).toString("hex");
  const hash = crypto
    .createHash("sha256")
    .update(`${timestamp}${random}`)
    .digest("hex")
    .substring(0, 16);
  return `${prefix}_${timestamp}_${hash}`;
};

const generateHealthRecommendations = (checks) => {
  const recommendations = [];
  checks.forEach((check) => {
    if (check.status === "critical") {
      recommendations.push({
        component: check.component,
        severity: "critical",
        message: `${check.component} is in critical state. Immediate action required.`,
        action: `Check ${check.component.toLowerCase()} configuration, logs, and resource allocation`,
        priority: "highest",
      });
    } else if (check.status === "degraded") {
      recommendations.push({
        component: check.component,
        severity: "degraded",
        message: `${check.component} performance is degraded.`,
        action: `Review ${check.component.toLowerCase()} performance metrics and consider optimization`,
        priority: "high",
      });
    } else if (check.status === "warning") {
      recommendations.push({
        component: check.component,
        severity: "warning",
        message: `${check.component} is showing warning signs.`,
        action: `Monitor ${check.component.toLowerCase()} closely and plan preventive maintenance`,
        priority: "medium",
      });
    }
  });
  return recommendations;
};

const convertToCSV = (data, headers = null) => {
  if (!data || data.length === 0) return "";
  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = [csvHeaders.join(",")];
  for (const row of data) {
    const values = csvHeaders.map((header) => {
      let value = row[header];
      if (value === null || value === undefined) return "";
      if (typeof value === "object")
        return JSON.stringify(value).replace(/,/g, ";");
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"'))
      ) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
};

const generateReportFile = (data, format) => {
  if (format === "csv") return convertToCSV(data);
  return JSON.stringify(data, null, 2);
};

// ============================================================
// RATE LIMITERS
// ============================================================

const backupRateLimiter = rateLimit({
  windowMs: ADMIN_CONFIG.rateLimits.backup.windowMs,
  max: ADMIN_CONFIG.rateLimits.backup.max,
  message: {
    success: false,
    error: "Too many backup requests. Please try again later.",
  },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

const exportRateLimiter = rateLimit({
  windowMs: ADMIN_CONFIG.rateLimits.export.windowMs,
  max: ADMIN_CONFIG.rateLimits.export.max,
  message: {
    success: false,
    error: "Too many export requests. Please try again later.",
  },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

const notificationRateLimiter = rateLimit({
  windowMs: ADMIN_CONFIG.rateLimits.notification.windowMs,
  max: ADMIN_CONFIG.rateLimits.notification.max,
  message: {
    success: false,
    error: "Too many notification requests. Please try again later.",
  },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

// ============================================================
// SYSTEM MONITORING CONTROLLERS
// ============================================================

exports.getSystemStats = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const result = await getCachedOrFresh(
      ADMIN_CONFIG.cacheKeys.SYSTEM_STATS,
      async () => {
        const [
          userStats,
          noticeStats,
          eventStats,
          healthStats,
          diskInfo,
          memoryInfo,
          cpuInfo,
          dbStats,
        ] = await Promise.all([
          User.aggregate([
            {
              $facet: {
                totals: [
                  {
                    $group: { _id: null, total: { $sum: 1 } },
                    active: {
                      $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
                    },
                  },
                ],
                byRole: [{ $group: { _id: "$role", count: { $sum: 1 } } }],
                recent: [
                  {
                    $match: {
                      createdAt: {
                        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      },
                    },
                  },
                  { $count: "newUsers" },
                ],
              },
            },
          ]),
          Notice.aggregate([
            {
              $facet: {
                totals: [
                  {
                    $group: { _id: null, total: { $sum: 1 } },
                    published: {
                      $sum: {
                        $cond: [{ $eq: ["$status", "published"] }, 1, 0],
                      },
                    },
                    pending: {
                      $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                    },
                  },
                ],
                byCategory: [
                  { $group: { _id: "$category", count: { $sum: 1 } } },
                  { $sort: { count: -1 } },
                  { $limit: 10 },
                ],
                recent: [
                  {
                    $match: {
                      createdAt: {
                        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      },
                    },
                  },
                  { $count: "newNotices" },
                ],
              },
            },
          ]),
          Event.aggregate([
            {
              $facet: {
                totals: [
                  {
                    $group: { _id: null, total: { $sum: 1 } },
                    upcoming: {
                      $sum: {
                        $cond: [{ $gt: ["$eventDate", new Date()] }, 1, 0],
                      },
                    },
                    completed: {
                      $sum: {
                        $cond: [{ $lt: ["$eventDate", new Date()] }, 1, 0],
                      },
                    },
                  },
                ],
                byType: [{ $group: { _id: "$type", count: { $sum: 1 } } }],
              },
            },
          ]),
          HealthCheck.findOne().sort({ timestamp: -1 }).lean(),
          getDiskSpace(),
          getMemoryUsage(),
          getCPUUsage(),
          getDatabaseStats(),
        ]);
        return {
          users: {
            total: userStats[0]?.totals[0]?.total || 0,
            active: userStats[0]?.totals[0]?.active || 0,
            byRole: userStats[0]?.byRole || [],
            newThisWeek: userStats[0]?.recent[0]?.newUsers || 0,
          },
          notices: {
            total: noticeStats[0]?.totals[0]?.total || 0,
            published: noticeStats[0]?.totals[0]?.published || 0,
            pending: noticeStats[0]?.totals[0]?.pending || 0,
            byCategory: noticeStats[0]?.byCategory || [],
            newThisWeek: noticeStats[0]?.recent[0]?.newNotices || 0,
          },
          events: {
            total: eventStats[0]?.totals[0]?.total || 0,
            upcoming: eventStats[0]?.totals[0]?.upcoming || 0,
            completed: eventStats[0]?.totals[0]?.completed || 0,
            byType: eventStats[0]?.byType || [],
          },
          system: {
            health: healthStats?.status || "unknown",
            uptime: process.uptime(),
            uptimeFormatted: formatDuration(process.uptime() * 1000),
            responseTime: `${Date.now() - startTime}ms`,
            nodeVersion: process.version,
            platform: `${os.platform()} ${os.release()}`,
            hostname: os.hostname(),
            environment: process.env.NODE_ENV || "development",
          },
          resources: { disk: diskInfo, memory: memoryInfo, cpu: cpuInfo },
          database: dbStats,
          timestamp: new Date().toISOString(),
        };
      },
      300,
    );
    await logAdminAction(req, "VIEW_SYSTEM_STATS", {
      responseTime: Date.now() - startTime,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getServiceStatus = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const result = await getCachedOrFresh(
      ADMIN_CONFIG.cacheKeys.SERVICE_STATUS,
      async () => {
        const services = [];
        try {
          const dbState = mongoose.connection.readyState;
          const dbStates = {
            0: "disconnected",
            1: "connected",
            2: "connecting",
            3: "disconnecting",
          };
          services.push({
            name: "MongoDB",
            status: dbState === 1 ? "healthy" : "unhealthy",
            details: {
              state: dbStates[dbState],
              name: mongoose.connection.name,
              host: mongoose.connection.host,
            },
          });
        } catch (error) {
          services.push({
            name: "MongoDB",
            status: "unhealthy",
            error: error.message,
          });
        }

        // Redis status - always healthy with mock
        services.push({
          name: "Redis",
          status: "healthy",
          details: {
            mode: "mock",
            enabled: false,
            message: "Redis disabled - using mock",
          },
        });

        services.push({
          name: "API Server",
          status: "healthy",
          details: {
            uptime: formatDuration(process.uptime() * 1000),
            pid: process.pid,
            memory: formatBytes(process.memoryUsage().rss),
          },
        });
        try {
          const uploadsDir = path.join(process.cwd(), "uploads");
          await fs.access(uploadsDir);
          services.push({
            name: "File Storage",
            status: "healthy",
            details: { path: uploadsDir, accessible: true },
          });
        } catch (error) {
          services.push({
            name: "File Storage",
            status: "warning",
            error: "Uploads directory not accessible",
          });
        }
        if (process.env.SMTP_HOST)
          services.push({
            name: "Email Service",
            status: "healthy",
            details: { provider: process.env.SMTP_HOST, configured: true },
          });
        if (process.env.SMS_ENABLED === "true")
          services.push({
            name: "SMS Service",
            status: "healthy",
            details: { provider: "TextBee", enabled: true },
          });
        const cacheStats = getCacheStats();
        services.push({
          name: "Cache Service",
          status: "healthy",
          details: { keys: cacheStats?.keys || 0, hits: cacheStats?.hits || 0 },
        });
        return {
          services,
          overall: services.every((s) => s.status === "healthy")
            ? "healthy"
            : services.some((s) => s.status === "unhealthy")
              ? "unhealthy"
              : "degraded",
          timestamp: new Date().toISOString(),
          responseTime: `${Date.now() - startTime}ms`,
        };
      },
      60,
    );
    await logAdminAction(req, "VIEW_SERVICE_STATUS");
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getSystemHealth = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const healthChecks = [];
    healthChecks.push({
      component: "API",
      status: "healthy",
      details: {
        uptime: formatDuration(process.uptime() * 1000),
        memory: {
          heapUsed: formatBytes(process.memoryUsage().heapUsed),
          heapTotal: formatBytes(process.memoryUsage().heapTotal),
          rss: formatBytes(process.memoryUsage().rss),
        },
        pid: process.pid,
        version: process.version,
      },
    });
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    healthChecks.push({
      component: "Database",
      status:
        dbState === 1 ? "healthy" : dbState === 2 ? "degraded" : "critical",
      details: {
        state: dbStates[dbState],
        name: mongoose.connection.name || "N/A",
        host: mongoose.connection.host || "N/A",
        port: mongoose.connection.port || "N/A",
      },
    });
    const diskInfo = await getDiskSpace();
    const diskStatus =
      diskInfo?.freePercent > 20
        ? "healthy"
        : diskInfo?.freePercent > 10
          ? "warning"
          : "critical";
    healthChecks.push({
      component: "Disk",
      status: diskStatus,
      details: {
        total: formatBytes(diskInfo?.total),
        free: formatBytes(diskInfo?.free),
        used: formatBytes(diskInfo?.used),
        freePercent: diskInfo?.freePercent?.toFixed(1) + "%",
      },
    });
    const memoryInfo = getMemoryUsage();
    const memoryStatus =
      memoryInfo?.percentUsed < 80
        ? "healthy"
        : memoryInfo?.percentUsed < 90
          ? "warning"
          : "critical";
    healthChecks.push({
      component: "Memory",
      status: memoryStatus,
      details: {
        total: formatBytes(memoryInfo?.total),
        free: formatBytes(memoryInfo?.free),
        used: formatBytes(memoryInfo?.used),
        percentUsed: memoryInfo?.percentUsed?.toFixed(1) + "%",
        heapUsed: formatBytes(memoryInfo?.heapUsed),
        heapTotal: formatBytes(memoryInfo?.heapTotal),
      },
    });
    const recentErrors = await SystemLog.countDocuments({
      level: "error",
      createdAt: { $gte: new Date(Date.now() - 3600000) },
    });
    healthChecks.push({
      component: "Error Rate",
      status:
        recentErrors < 10
          ? "healthy"
          : recentErrors < 50
            ? "warning"
            : "critical",
      details: {
        errorsLastHour: recentErrors,
        threshold: { warning: 10, critical: 50 },
      },
    });
    const overall = healthChecks.every((h) => h.status === "healthy")
      ? "healthy"
      : healthChecks.some((h) => h.status === "critical")
        ? "critical"
        : "degraded";
    const healthCheck = new HealthCheck({
      status: overall,
      checks: {},
      metadata: {
        version: process.env.npm_package_version || "2.0.0",
        environment: process.env.NODE_ENV,
        hostname: os.hostname(),
        processId: process.pid,
      },
      duration: Date.now() - startTime,
    });
    await healthCheck.save();
    const recommendations = generateHealthRecommendations(healthChecks);
    await logAdminAction(req, "VIEW_SYSTEM_HEALTH");
    res.json({
      success: true,
      data: {
        status: overall,
        checks: healthChecks,
        lastCheck: {
          timestamp: healthCheck.timestamp,
          duration: `${healthCheck.duration}ms`,
        },
        recommendations,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPerformanceMetrics = async (req, res, next) => {
  try {
    const { range = "24h" } = req.query;
    const hours = range === "7d" ? 168 : range === "30d" ? 720 : 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const healthHistory = await HealthCheck.find({
      timestamp: { $gte: since },
    }).sort({ timestamp: 1 });
    const avgResponseTime =
      healthHistory.length > 0
        ? healthHistory.reduce((sum, h) => sum + (h.duration || 0), 0) /
          healthHistory.length
        : 0;
    const errorRate =
      (healthHistory.filter((h) => h.status === "critical").length /
        (healthHistory.length || 1)) *
      100;
    await logAdminAction(req, "VIEW_PERFORMANCE_METRICS", { range });
    res.json({
      success: true,
      data: {
        summary: {
          avgResponseTime: `${avgResponseTime.toFixed(0)}ms`,
          uptime: formatDuration(process.uptime() * 1000),
          errorRate: `${errorRate.toFixed(2)}%`,
          totalChecks: healthHistory.length,
        },
        timeRange: {
          range,
          since: since.toISOString(),
          until: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// USER MANAGEMENT CONTROLLERS
// ============================================================

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const {
      role,
      status,
      department,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const query = {};
    if (role) query.role = role;
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (status === "suspended") query.isSuspended = true;
    if (department) query.department = department;
    if (search)
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    const allowedSortFields = [
      "createdAt",
      "firstName",
      "lastName",
      "email",
      "role",
      "lastLogin",
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken")
        .sort({ [validSortBy]: sortOrder === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);
    const stats = await User.aggregate([
      { $match: {} },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
          suspended: {
            $sum: { $cond: [{ $eq: ["$isSuspended", true] }, 1, 0] },
          },
          admins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
          students: { $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] } },
          faculty: { $sum: { $cond: [{ $eq: ["$role", "faculty"] }, 1, 0] } },
          verified: { $sum: { $cond: [{ $eq: ["$isVerified", true] }, 1, 0] } },
        },
      },
    ]);
    await logAdminAction(req, "VIEW_ALL_USERS", {
      filters: { role, status, department, search },
      resultCount: users.length,
    });
    res.json({
      success: true,
      data: { users, stats: stats[0] || {} },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    const [user, noticeCount, publishedNotices] = await Promise.all([
      User.findById(userId).select("-password -refreshToken").lean(),
      Notice.countDocuments({ author: userId }),
      Notice.countDocuments({ author: userId, status: "published" }),
    ]);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    await logAdminAction(req, "VIEW_USER_DETAILS", {
      userId: user._id,
      userEmail: user.email,
    });
    res.json({
      success: true,
      data: {
        user,
        statistics: {
          totalNotices: noticeCount,
          publishedNotices,
          accountAge: moment().diff(user.createdAt, "days"),
          lastActive: user.lastLogin || user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    const validRoles = ["admin", "student", "faculty", "moderator"];
    if (!validRoles.includes(role))
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    if (userId === req.user._id.toString() && role !== "admin")
      return res
        .status(400)
        .json({ success: false, error: "Cannot change your own admin role" });
    const user = await User.findByIdAndUpdate(
      userId,
      { role, roleUpdatedAt: new Date(), roleUpdatedBy: req.user._id },
      { new: true, runValidators: true },
    ).select("-password -refreshToken");
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    await logAdminAction(req, "UPDATE_USER_ROLE", {
      userId: user._id,
      userEmail: user.email,
      oldRole: user.role,
      newRole: role,
      reason,
    });
    invalidateAdminCache(["users"]);
    res.json({
      success: true,
      message: `User role updated from ${user.role} to ${role}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

exports.suspendUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason, duration = 30 } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    if (userId === req.user._id.toString())
      return res
        .status(400)
        .json({ success: false, error: "Cannot suspend your own account" });
    const suspendedUntil = new Date(
      Date.now() + duration * 24 * 60 * 60 * 1000,
    );
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isSuspended: true,
        suspendedReason: reason || "No reason provided",
        suspendedUntil,
        suspendedBy: req.user._id,
        suspendedAt: new Date(),
      },
      { new: true },
    ).select("-password -refreshToken");
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    await logAdminAction(req, "SUSPEND_USER", {
      userId: user._id,
      userEmail: user.email,
      reason,
      duration,
      suspendedUntil,
    });
    invalidateAdminCache(["users"]);
    res.json({
      success: true,
      message: `User ${user.email} suspended for ${duration} days`,
      data: { user, suspendedUntil },
    });
  } catch (error) {
    next(error);
  }
};

exports.activateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isSuspended: false,
        suspendedReason: null,
        suspendedUntil: null,
        suspendedBy: null,
        activatedAt: new Date(),
        activatedBy: req.user._id,
      },
      { new: true },
    ).select("-password -refreshToken");
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    await logAdminAction(req, "ACTIVATE_USER", {
      userId: user._id,
      userEmail: user.email,
    });
    invalidateAdminCache(["users"]);
    res.json({
      success: true,
      message: `User ${user.email} account activated`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { permanent = false } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    if (userId === req.user._id.toString())
      return res
        .status(400)
        .json({ success: false, error: "Cannot delete your own account" });
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    if (permanent) {
      await User.findByIdAndDelete(userId);
      await Notice.deleteMany({ author: userId });
      await logAdminAction(req, "DELETE_USER_PERMANENT", {
        userId: user._id,
        userEmail: user.email,
      });
    } else {
      user.isDeleted = true;
      user.deletedAt = new Date();
      user.deletedBy = req.user._id;
      await user.save();
      await logAdminAction(req, "DELETE_USER_SOFT", {
        userId: user._id,
        userEmail: user.email,
      });
    }
    invalidateAdminCache(["users"]);
    res.json({
      success: true,
      message: permanent ? "User permanently deleted" : "User deactivated",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// NOTICE MANAGEMENT CONTROLLERS
// ============================================================

exports.getAllNotices = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const {
      status,
      category,
      author,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (author && mongoose.Types.ObjectId.isValid(author))
      query.author = author;
    if (search)
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
      ];
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "title",
      "views",
      "status",
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const [notices, total] = await Promise.all([
      Notice.find(query)
        .populate("author", "firstName lastName email")
        .populate("approvedBy", "firstName lastName email")
        .sort({ [validSortBy]: sortOrder === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notice.countDocuments(query),
    ]);
    await logAdminAction(req, "VIEW_ALL_NOTICES", {
      filters: { status, category, search },
      resultCount: notices.length,
    });
    res.json({
      success: true,
      data: { notices },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getNoticeById = async (req, res, next) => {
  try {
    const { noticeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(noticeId))
      return res
        .status(400)
        .json({ success: false, error: "Invalid notice ID" });
    const notice = await Notice.findById(noticeId)
      .populate("author", "firstName lastName email department")
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email")
      .lean();
    if (!notice)
      return res
        .status(404)
        .json({ success: false, error: "Notice not found" });
    await logAdminAction(req, "VIEW_NOTICE_DETAILS", {
      noticeId,
      noticeTitle: notice.title,
    });
    res.json({ success: true, data: notice });
  } catch (error) {
    next(error);
  }
};

exports.approveNotice = async (req, res, next) => {
  try {
    const { noticeId } = req.params;
    const { comments } = req.body;
    if (!mongoose.Types.ObjectId.isValid(noticeId))
      return res
        .status(400)
        .json({ success: false, error: "Invalid notice ID" });
    const notice = await Notice.findByIdAndUpdate(
      noticeId,
      {
        status: "published",
        approvedAt: new Date(),
        approvedBy: req.user._id,
        approvalComments: comments,
        publishedAt: new Date(),
      },
      { new: true },
    ).populate("author", "firstName lastName email");
    if (!notice)
      return res
        .status(404)
        .json({ success: false, error: "Notice not found" });
    await logAdminAction(req, "APPROVE_NOTICE", {
      noticeId,
      noticeTitle: notice.title,
      authorEmail: notice.author?.email,
      comments,
    });
    invalidateAdminCache(["notices"]);
    res.json({
      success: true,
      message: "Notice approved and published",
      data: notice,
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectNotice = async (req, res, next) => {
  try {
    const { noticeId } = req.params;
    const { reason } = req.body;
    if (!reason || reason.trim().length < 5)
      return res.status(400).json({
        success: false,
        error: "Rejection reason is required (minimum 5 characters)",
      });
    if (!mongoose.Types.ObjectId.isValid(noticeId))
      return res
        .status(400)
        .json({ success: false, error: "Invalid notice ID" });
    const notice = await Notice.findByIdAndUpdate(
      noticeId,
      {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: req.user._id,
        rejectionReason: reason,
      },
      { new: true },
    ).populate("author", "firstName lastName email");
    if (!notice)
      return res
        .status(404)
        .json({ success: false, error: "Notice not found" });
    await logAdminAction(req, "REJECT_NOTICE", {
      noticeId,
      noticeTitle: notice.title,
      authorEmail: notice.author?.email,
      reason,
    });
    invalidateAdminCache(["notices"]);
    res.json({ success: true, message: "Notice rejected", data: notice });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotice = async (req, res, next) => {
  try {
    const { noticeId } = req.params;
    const { permanent = false } = req.body;
    if (!mongoose.Types.ObjectId.isValid(noticeId))
      return res
        .status(400)
        .json({ success: false, error: "Invalid notice ID" });
    const notice = await Notice.findById(noticeId);
    if (!notice)
      return res
        .status(404)
        .json({ success: false, error: "Notice not found" });
    if (permanent) {
      await Notice.findByIdAndDelete(noticeId);
      await logAdminAction(req, "DELETE_NOTICE_PERMANENT", {
        noticeId,
        noticeTitle: notice.title,
        author: notice.author,
      });
    } else {
      notice.isDeleted = true;
      notice.deletedAt = new Date();
      notice.deletedBy = req.user._id;
      await notice.save();
      await logAdminAction(req, "DELETE_NOTICE_SOFT", {
        noticeId,
        noticeTitle: notice.title,
        author: notice.author,
      });
    }
    invalidateAdminCache(["notices"]);
    res.json({
      success: true,
      message: permanent
        ? "Notice permanently deleted"
        : "Notice moved to trash",
    });
  } catch (error) {
    next(error);
  }
};

exports.featureNotice = async (req, res, next) => {
  try {
    const { noticeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(noticeId))
      return res
        .status(400)
        .json({ success: false, error: "Invalid notice ID" });
    const notice = await Notice.findById(noticeId);
    if (!notice)
      return res
        .status(404)
        .json({ success: false, error: "Notice not found" });
    notice.isFeatured = !notice.isFeatured;
    if (notice.isFeatured) {
      notice.featuredAt = new Date();
      notice.featuredBy = req.user._id;
    } else {
      notice.featuredAt = null;
      notice.featuredBy = null;
    }
    await notice.save();
    await logAdminAction(req, "TOGGLE_FEATURE_NOTICE", {
      noticeId,
      noticeTitle: notice.title,
      isFeatured: notice.isFeatured,
    });
    invalidateAdminCache(["notices"]);
    res.json({
      success: true,
      message: notice.isFeatured ? "Notice featured" : "Notice unfeatured",
      data: { isFeatured: notice.isFeatured },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ANALYTICS & REPORTS CONTROLLERS
// ============================================================

exports.getAnalytics = async (req, res, next) => {
  try {
    const { period = "month" } = req.query;
    const startDate = new Date();
    if (period === "week") startDate.setDate(startDate.getDate() - 7);
    else if (period === "month") startDate.setMonth(startDate.getMonth() - 1);
    else if (period === "year")
      startDate.setFullYear(startDate.getFullYear() - 1);
    else startDate.setMonth(startDate.getMonth() - 1);
    const [userGrowth, noticeTrends, popularCategories] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]),
      Notice.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
              status: "$status",
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Notice.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);
    await logAdminAction(req, "VIEW_ANALYTICS", { period });
    res.json({
      success: true,
      data: {
        period,
        userGrowth,
        noticeTrends,
        popularCategories,
        summary: {
          totalUsers: await User.countDocuments(),
          totalNotices: await Notice.countDocuments(),
          publishedNotices: await Notice.countDocuments({
            status: "published",
          }),
          pendingNotices: await Notice.countDocuments({ status: "pending" }),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getActivityLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const { action, userId, startDate, endDate } = req.query;
    const query = {};
    if (action) query.action = action;
    if (userId && mongoose.Types.ObjectId.isValid(userId))
      query.userId = userId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    const [logs, total] = await Promise.all([
      SystemLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
      SystemLog.countDocuments(query),
    ]);
    res.json({
      success: true,
      data: { logs },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsageReport = async (req, res, next) => {
  try {
    const { format = "json", startDate, endDate } = req.query;
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const metrics = {
      users: {
        total: await User.countDocuments(),
        new: await User.countDocuments({
          createdAt: { $gte: start, $lte: end },
        }),
        active: await User.countDocuments({ lastLogin: { $gte: start } }),
      },
      notices: {
        total: await Notice.countDocuments(),
        created: await Notice.countDocuments({
          createdAt: { $gte: start, $lte: end },
        }),
        published: await Notice.countDocuments({
          status: "published",
          createdAt: { $gte: start, $lte: end },
        }),
        rejected: await Notice.countDocuments({
          status: "rejected",
          createdAt: { $gte: start, $lte: end },
        }),
      },
      dateRange: { start, end },
    };
    if (format === "csv") {
      const csv = convertToCSV([metrics.users, metrics.notices]);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=usage-report-${Date.now()}.csv`,
      );
      return res.send(csv);
    }
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

exports.exportData = [
  exportRateLimiter,
  async (req, res, next) => {
    try {
      const { type = "users", format = "json", filters = {} } = req.body;
      if (!ADMIN_CONFIG.exportFormats.includes(format))
        return res.status(400).json({
          success: false,
          error: `Invalid format. Must be one of: ${ADMIN_CONFIG.exportFormats.join(", ")}`,
        });
      let data, filename;
      switch (type) {
        case "users":
          const userQuery = {};
          if (filters.role) userQuery.role = filters.role;
          if (filters.status === "active") userQuery.isActive = true;
          if (filters.department) userQuery.department = filters.department;
          data = await User.find(userQuery)
            .select("-password -refreshToken -__v")
            .lean();
          filename = `users-export-${Date.now()}.${format}`;
          break;
        case "notices":
          const noticeQuery = {};
          if (filters.status) noticeQuery.status = filters.status;
          if (filters.category) noticeQuery.category = filters.category;
          data = await Notice.find(noticeQuery)
            .populate("author", "firstName lastName email")
            .lean();
          filename = `notices-export-${Date.now()}.${format}`;
          break;
        case "logs":
          const logQuery = {};
          if (filters.level) logQuery.level = filters.level;
          if (filters.startDate)
            logQuery.timestamp = { $gte: new Date(filters.startDate) };
          if (filters.endDate)
            logQuery.timestamp = {
              ...logQuery.timestamp,
              $lte: new Date(filters.endDate),
            };
          data = await SystemLog.find(logQuery)
            .sort({ timestamp: -1 })
            .limit(10000)
            .lean();
          filename = `logs-export-${Date.now()}.${format}`;
          break;
        default:
          return res
            .status(400)
            .json({ success: false, error: "Invalid export type" });
      }
      const fileContent = generateReportFile(data, format);
      await logAdminAction(req, "EXPORT_DATA", {
        type,
        format,
        recordCount: data.length,
      });
      res.setHeader(
        "Content-Type",
        format === "csv" ? "text/csv" : "application/json",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.send(fileContent);
    } catch (error) {
      next(error);
    }
  },
];

// ============================================================
// SYSTEM CONFIGURATION CONTROLLERS
// ============================================================

exports.getSystemConfig = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        app: {
          name: process.env.APP_NAME || "KAAF Noticeboard",
          version: process.env.npm_package_version || "2.0.0",
          environment: process.env.NODE_ENV || "development",
          url: process.env.APP_URL || "http://localhost:5000",
        },
        features: {
          userRegistration: process.env.ENABLE_REGISTRATION === "true",
          emailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
          fileUploads: process.env.ENABLE_FILE_UPLOADS === "true",
          comments: process.env.ENABLE_COMMENTS === "true",
          notifications: process.env.ENABLE_NOTIFICATIONS === "true",
        },
        limits: {
          maxFileSize: process.env.MAX_FILE_SIZE || "5MB",
          maxNoticesPerUser: process.env.MAX_NOTICES_PER_USER || 50,
          noticeExpiryDays: process.env.NOTICE_EXPIRY_DAYS || 30,
          rateLimit: process.env.RATE_LIMIT || 100,
        },
        email: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          from: process.env.EMAIL_FROM,
          enabled: !!process.env.SMTP_HOST,
        },
        database: {
          name: mongoose.connection.name,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSystemConfig = async (req, res, next) => {
  try {
    const { key, value, category } = req.body;
    const allowedKeys = [
      "ENABLE_REGISTRATION",
      "REQUIRE_EMAIL_VERIFICATION",
      "ENABLE_FILE_UPLOADS",
      "ENABLE_COMMENTS",
      "ENABLE_NOTIFICATIONS",
      "MAX_FILE_SIZE",
      "MAX_NOTICES_PER_USER",
      "NOTICE_EXPIRY_DAYS",
      "RATE_LIMIT",
    ];
    if (!allowedKeys.includes(key))
      return res
        .status(400)
        .json({ success: false, error: "Invalid configuration key" });
    process.env[key] = value;
    await logAdminAction(req, "UPDATE_CONFIG", { key, value, category });
    res.json({
      success: true,
      message: "Configuration updated",
      data: { key, value },
    });
  } catch (error) {
    next(error);
  }
};

exports.getEnvironmentVariables = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        NODE_ENV: process.env.NODE_ENV,
        APP_NAME: process.env.APP_NAME,
        APP_URL: process.env.APP_URL,
        PORT: process.env.PORT,
        REDIS_HOST: process.env.REDIS_HOST,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
        RATE_LIMIT: process.env.RATE_LIMIT,
        MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        SMTP_HOST: process.env.SMTP_HOST ? "configured" : "not configured",
        SMS_ENABLED: process.env.SMS_ENABLED || "disabled",
        REDIS_ENABLED: process.env.REDIS_ENABLED || "false",
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CACHE MANAGEMENT CONTROLLERS
// ============================================================

exports.clearCache = async (req, res, next) => {
  try {
    const { type = "all" } = req.body;
    if (type === "all") {
      adminCache.flushAll();
      const cacheManager = getCacheManager();
      if (cacheManager) await cacheManager.clearAll();
    } else if (type === "admin") adminCache.flushAll();
    else invalidateAdminCache([type]);
    await logAdminAction(req, "CLEAR_CACHE", { type });
    res.json({
      success: true,
      message: `Cache cleared successfully (${type})`,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCacheStats = async (req, res, next) => {
  try {
    const adminCacheStats = {
      keys: adminCache.keys().length,
      hits: adminCache.stats?.hits || 0,
      misses: adminCache.stats?.misses || 0,
      ksize: adminCache.stats?.ksize || 0,
      vsize: adminCache.stats?.vsize || 0,
    };
    const cacheManager = getCacheManager();
    const systemCacheStats = cacheManager ? cacheManager.getStats() : null;
    res.json({
      success: true,
      data: { adminCache: adminCacheStats, systemCache: systemCacheStats },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DATABASE MANAGEMENT CONTROLLERS
// ============================================================

exports.getDatabaseStats = async (req, res, next) => {
  try {
    const dbStats = await getDatabaseStats();
    res.json({ success: true, data: dbStats });
  } catch (error) {
    next(error);
  }
};

exports.runDatabaseBackup = async (req, res, next) => {
  try {
    const { type = "full" } = req.body;
    const backup = await backupDatabase({
      type,
      includeLogs: false,
      createdBy: req.user._id,
    });
    await logAdminAction(req, "RUN_DATABASE_BACKUP", {
      type,
      backupId: backup._id,
    });
    res.json({
      success: true,
      message: "Database backup completed",
      data: backup,
    });
  } catch (error) {
    next(error);
  }
};

exports.optimizeDatabase = async (req, res, next) => {
  try {
    const result = await optimizeDatabase();
    await logAdminAction(req, "OPTIMIZE_DATABASE");
    res.json({
      success: true,
      message: "Database optimization completed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// LOG MANAGEMENT CONTROLLERS
// ============================================================

exports.getSystemLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const { level } = req.query;
    const query = {};
    if (level) query.level = level;
    const [logs, total] = await Promise.all([
      SystemLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
      SystemLog.countDocuments(query),
    ]);
    res.json({
      success: true,
      data: { logs },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getErrorLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const [logs, total] = await Promise.all([
      SystemLog.find({ level: { $in: ["error", "fatal"] } })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      SystemLog.countDocuments({ level: { $in: ["error", "fatal"] } }),
    ]);
    res.json({
      success: true,
      data: { logs },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.rotateLogs = async (req, res, next) => {
  try {
    const logDir = path.join(process.cwd(), "logs");
    const archiveDir = path.join(logDir, "archives");
    await fs.ensureDir(archiveDir);
    const files = await fs.readdir(logDir);
    const logFiles = files.filter((f) => f.endsWith(".log"));
    const rotated = [];
    for (const file of logFiles) {
      const filePath = path.join(logDir, file);
      const stats = await fs.stat(filePath);
      if (stats.size > 10 * 1024 * 1024) {
        const timestamp = moment().format("YYYY-MM-DD_HH-mm-ss");
        const archivePath = path.join(archiveDir, `${file}.${timestamp}`);
        await fs.move(filePath, archivePath);
        await fs.writeFile(filePath, "");
        rotated.push({ file, archivePath });
      }
    }
    await logAdminAction(req, "ROTATE_LOGS", { rotatedCount: rotated.length });
    res.json({
      success: true,
      message: `Rotated ${rotated.length} log files`,
      data: { rotated },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// SECURITY CONTROLLERS
// ============================================================

exports.getSecuritySettings = async (req, res, next) => {
  try {
    const settings = {
      authentication: {
        jwtExpiry: process.env.JWT_EXPIRES_IN || "7d",
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 15,
      },
      headers: {
        corsEnabled: !!process.env.CORS_ORIGIN,
        rateLimit: parseInt(process.env.RATE_LIMIT) || 100,
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
      },
      features: {
        twoFactorAuth: process.env.ENABLE_2FA === "true",
        ipWhitelisting: process.env.ENABLE_IP_WHITELIST === "true",
        auditLogging: true,
      },
      blockedIPs: await getBlockedIPs(),
      failedAttempts: await SystemLog.countDocuments({
        action: "failed_login",
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    };
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSecuritySettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    const allowedSettings = [
      "jwtExpiry",
      "maxLoginAttempts",
      "lockoutDuration",
      "rateLimit",
    ];
    for (const key of Object.keys(settings))
      if (allowedSettings.includes(key))
        process.env[key.toUpperCase()] = settings[key].toString();
    await logAdminAction(req, "UPDATE_SECURITY_SETTINGS", { settings });
    res.json({
      success: true,
      message: "Security settings updated",
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
};

exports.getFailedLoginAttempts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const [attempts, total] = await Promise.all([
      SystemLog.find({ action: "failed_login" })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      SystemLog.countDocuments({ action: "failed_login" }),
    ]);
    const byIP = attempts.reduce((acc, a) => {
      acc[a.ipAddress] = (acc[a.ipAddress] || 0) + 1;
      return acc;
    }, {});
    res.json({
      success: true,
      data: {
        attempts,
        summary: {
          totalAttempts: total,
          uniqueIPs: Object.keys(byIP).length,
          topOffenders: Object.entries(byIP)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10),
        },
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.blockIPAddress = async (req, res, next) => {
  try {
    const { ipAddress, reason } = req.body;
    await addToBlocklist(ipAddress, reason, req.user._id);
    await logAdminAction(req, "BLOCK_IP", { ipAddress, reason });
    res.json({
      success: true,
      message: `IP ${ipAddress} has been blocked`,
      data: { ipAddress, reason },
    });
  } catch (error) {
    next(error);
  }
};

exports.unblockIPAddress = async (req, res, next) => {
  try {
    const { ipAddress } = req.params;
    await removeFromBlocklist(ipAddress);
    await logAdminAction(req, "UNBLOCK_IP", { ipAddress });
    res.json({ success: true, message: `IP ${ipAddress} has been unblocked` });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// BACKUP & RECOVERY CONTROLLERS
// ============================================================

exports.getBackups = async (req, res, next) => {
  try {
    const backups = await Backup.find().sort({ createdAt: -1 });
    res.json({ success: true, data: backups });
  } catch (error) {
    next(error);
  }
};

exports.createBackup = async (req, res, next) => {
  try {
    const { type = "full", includeLogs = false } = req.body;
    const backup = await backupDatabase({
      type,
      includeLogs,
      createdBy: req.user._id,
    });
    await logAdminAction(req, "CREATE_BACKUP", { type, backupId: backup._id });
    res.json({
      success: true,
      message: "Backup created successfully",
      data: backup,
    });
  } catch (error) {
    next(error);
  }
};

exports.restoreBackup = async (req, res, next) => {
  try {
    const { backupId } = req.params;
    const { options } = req.body;
    const result = await restoreDatabase(backupId, options);
    await logAdminAction(req, "RESTORE_BACKUP", { backupId });
    res.json({
      success: true,
      message: "Backup restored successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBackup = async (req, res, next) => {
  try {
    const { backupId } = req.params;
    const backup = await Backup.findById(backupId);
    if (backup && backup.file?.path) await fs.remove(backup.file.path);
    await Backup.findByIdAndDelete(backupId);
    await logAdminAction(req, "DELETE_BACKUP", { backupId });
    res.json({ success: true, message: "Backup deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// NOTIFICATION MANAGEMENT CONTROLLERS
// ============================================================

exports.sendSystemNotification = async (req, res, next) => {
  try {
    const {
      title,
      message,
      type = "info",
      targetAudience = "all",
      targetUsers = [],
    } = req.body;
    let recipients = [];
    if (targetAudience === "all")
      recipients = await User.find({ isActive: true }).distinct("_id");
    else if (targetAudience === "admins")
      recipients = await User.find({ role: "admin" }).distinct("_id");
    else if (targetAudience === "users")
      recipients = await User.find({ role: "user", isActive: true }).distinct(
        "_id",
      );
    else if (targetAudience === "specific") recipients = targetUsers;
    const notification = new Notification({
      title,
      message,
      type,
      recipients,
      sentBy: req.user._id,
      sentAt: new Date(),
    });
    await notification.save();
    await logAdminAction(req, "SEND_SYSTEM_NOTIFICATION", {
      title,
      type,
      targetAudience,
      recipientCount: recipients.length,
    });
    res.json({
      success: true,
      message: `Notification sent to ${recipients.length} users`,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

exports.getNotificationHistory = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const [notifications, total] = await Promise.all([
      Notification.find()
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sentBy", "name email"),
      Notification.countDocuments(),
    ]);
    res.json({
      success: true,
      data: { notifications },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// MAINTENANCE MODE CONTROLLERS
// ============================================================

exports.setMaintenanceMode = async (req, res, next) => {
  try {
    const { enabled, message } = req.body;
    await setMaintenanceStatus(enabled, message, req.user._id);
    await logAdminAction(req, "SET_MAINTENANCE_MODE", { enabled, message });
    res.json({
      success: true,
      message: enabled
        ? "Maintenance mode enabled"
        : "Maintenance mode disabled",
      data: { enabled, message },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMaintenanceStatus = async (req, res, next) => {
  try {
    const status = await getMaintenanceStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// API MANAGEMENT CONTROLLERS
// ============================================================

exports.getAPIKeys = async (req, res, next) => {
  try {
    const apiKeys = await APIKey.find()
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });
    const maskedKeys = apiKeys.map((key) => ({
      ...key.toObject(),
      key: key.key
        ? key.key.substring(0, 8) +
          "..." +
          key.key.substring(key.key.length - 8)
        : null,
    }));
    res.json({ success: true, data: maskedKeys });
  } catch (error) {
    next(error);
  }
};

exports.createAPIKey = async (req, res, next) => {
  try {
    const { name, permissions = ["read"], expiresIn = 365 } = req.body;
    const apiKey = new APIKey({
      name,
      key: generateAPIKey(),
      permissions,
      expiresAt: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000),
      createdBy: req.user._id,
    });
    await apiKey.save();
    await logAdminAction(req, "CREATE_API_KEY", { name, permissions });
    res.json({
      success: true,
      message: "API key created successfully",
      data: apiKey,
    });
  } catch (error) {
    next(error);
  }
};

exports.revokeAPIKey = async (req, res, next) => {
  try {
    const { keyId } = req.params;
    await APIKey.findByIdAndDelete(keyId);
    await logAdminAction(req, "REVOKE_API_KEY", { keyId });
    res.json({ success: true, message: "API key revoked successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getAPILogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const [logs, total] = await Promise.all([
      SystemLog.find({ type: "api_request" })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      SystemLog.countDocuments({ type: "api_request" }),
    ]);
    res.json({
      success: true,
      data: { logs },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// EXPORTS
// ============================================================

exports.backupRateLimiter = backupRateLimiter;
exports.exportRateLimiter = exportRateLimiter;
exports.notificationRateLimiter = notificationRateLimiter;
exports.invalidateAdminCache = invalidateAdminCache;
