// backend/middleware/rateLimit.js
// PROFESSIONAL RATE LIMITING MIDDLEWARE
// @version 2.0.0 - PRODUCTION GRADE

const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { HTTP_STATUS, USER_ROLES } = require("../config/constants");
const logger = require("../utils/logger");

// ============================================================
// CONFIGURATION
// ============================================================

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const isRateLimitingDisabled =
  process.env.DISABLE_RATE_LIMIT === "true" || isDevelopment;

// Redis configuration for distributed rate limiting
let redisClient = null;
let redisStore = null;

/**
 * Initialize Redis store for distributed rate limiting
 */
const initializeRedisStore = () => {
  if (
    process.env.REDIS_ENABLED === "true" &&
    process.env.RATE_LIMIT_REDIS_ENABLED === "true"
  ) {
    try {
      const Redis = require("ioredis");

      redisClient = new Redis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        keyPrefix: `${process.env.REDIS_KEY_PREFIX || "kaaf:"}rl:`,
        connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 3000,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      redisStore = new RedisStore({
        // @ts-ignore
        sendCommand: (...args) => redisClient.call(...args),
        prefix: "rate_limit:",
      });

      logger.info("✅ Redis store initialized for rate limiting");
    } catch (error) {
      logger.warn(
        `⚠️  Failed to initialize Redis store: ${error.message}. Using memory store.`,
      );
      redisClient = null;
      redisStore = null;
    }
  }
};

// Initialize Redis store
initializeRedisStore();

// ============================================================
// SKIP FUNCTION
// ============================================================

/**
 * Determine if rate limiting should be skipped for a request
 * @param {Object} req - Express request object
 * @returns {boolean} True if rate limiting should be skipped
 */
const skipRateLimit = (req) => {
  // Skip if rate limiting is globally disabled
  if (isRateLimitingDisabled) {
    return true;
  }

  // Skip health check endpoints
  if (
    req.path === "/health" ||
    req.path === "/api/health" ||
    req.path === "/api/health/detailed" ||
    req.path === "/metrics"
  ) {
    return true;
  }

  // Skip public assets
  if (
    req.path.startsWith("/public") ||
    req.path.startsWith("/uploads") ||
    req.path.startsWith("/assets")
  ) {
    return true;
  }

  // Skip for whitelisted IPs
  const whitelistedIPs = (process.env.RATE_LIMIT_WHITELIST_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

  if (whitelistedIPs.includes(req.ip)) {
    return true;
  }

  // Skip for localhost in development
  if (isDevelopment && (req.ip === "127.0.0.1" || req.ip === "::1")) {
    return true;
  }

  // Skip for admin users (optional)
  if (process.env.RATE_LIMIT_SKIP_ADMINS === "true") {
    const user = req.user;
    if (
      user &&
      (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN)
    ) {
      return true;
    }
  }

  return false;
};

// ============================================================
// KEY GENERATORS
// ============================================================

/**
 * Generate a unique key for rate limiting
 * @param {Object} req - Express request object
 * @returns {string} Unique key
 */
const keyGenerators = {
  /**
   * Standard key generator using IP address
   */
  ip: (req) => {
    // Use X-Forwarded-For header if behind proxy
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      "unknown";
    return `ip:${ip}`;
  },

  /**
   * Key generator combining IP and user ID
   */
  ipAndUser: (req) => {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown";
    const userId = req.user?._id?.toString() || req.user?.id || "anon";
    return `ip_user:${ip}:${userId}`;
  },

  /**
   * Key generator for authentication endpoints (IP + email)
   */
  auth: (req) => {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown";
    const identifier = req.body?.email || req.body?.identifier || "anon";
    return `auth:${ip}:${identifier.toLowerCase()}`;
  },

  /**
   * Key generator using user ID only
   */
  user: (req) => {
    const userId = req.user?._id?.toString() || req.user?.id || req.ip;
    return `user:${userId}`;
  },

  /**
   * Key generator for API keys
   */
  apiKey: (req) => {
    const apiKey = req.headers["x-api-key"] || "unknown";
    return `apikey:${apiKey.substring(0, 16)}`;
  },
};

// ============================================================
// HANDLERS
// ============================================================

/**
 * Custom rate limit exceeded handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const rateLimitHandler = (req, res, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000 / 60); // in minutes

  // Log rate limit exceeded
  logger.warn(`⚠️  Rate limit exceeded`, {
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.headers["user-agent"]?.substring(0, 100),
    userId: req.user?.id || "anonymous",
  });

  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    success: false,
    message: options.message || "Too many requests. Please try again later.",
    retryAfter: retryAfter,
    retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
};

// ============================================================
// BASE CONFIGURATION
// ============================================================

/**
 * Create base rate limiter configuration
 * @param {Object} options - Rate limiter options
 * @returns {Object} Rate limiter configuration
 */
const createBaseConfig = (options = {}) => {
  const config = {
    windowMs: options.windowMs || 60 * 1000, // 1 minute default
    max: options.max || 100,
    skip: options.skip || skipRateLimit,
    keyGenerator: options.keyGenerator || keyGenerators.ip,
    handler: (req, res, opts) =>
      rateLimitHandler(req, res, { ...opts, message: options.message }),
    standardHeaders: options.standardHeaders !== false,
    legacyHeaders: options.legacyHeaders === true,
    statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    skipFailedRequests: options.skipFailedRequests || false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    requestWasSuccessful: (req, res) => res.statusCode < 400,
  };

  // Add Redis store if available
  if (redisStore) {
    config.store = redisStore;
  }

  // Add custom message
  if (options.message) {
    config.message = options.message;
  }

  return config;
};

// ============================================================
// RATE LIMITERS
// ============================================================

/**
 * Authentication rate limiters
 */
const auth = {
  /**
   * Registration endpoint rate limiter
   * Limits: 3 requests per hour
   */
  register: rateLimit(
    createBaseConfig({
      windowMs:
        parseInt(process.env.RATE_LIMIT_AUTH_REGISTER_WINDOW) || 60 * 60 * 1000, // 1 hour
      max: isDevelopment
        ? 100
        : parseInt(process.env.RATE_LIMIT_AUTH_REGISTER_MAX) || 3,
      keyGenerator: keyGenerators.ip,
      message: "Too many registration attempts. Please try again later.",
    }),
  ),

  /**
   * Login endpoint rate limiter
   * Limits: 5 requests per 15 minutes per IP + email
   */
  login: rateLimit(
    createBaseConfig({
      windowMs:
        parseInt(process.env.RATE_LIMIT_AUTH_LOGIN_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: isDevelopment
        ? 100
        : parseInt(process.env.RATE_LIMIT_AUTH_LOGIN_MAX) || 5,
      keyGenerator: keyGenerators.auth,
      message: "Too many login attempts. Please try again later.",
      skipFailedRequests: true,
    }),
  ),

  /**
   * Password reset request rate limiter
   * Limits: 3 requests per hour
   */
  passwordReset: rateLimit(
    createBaseConfig({
      windowMs:
        parseInt(process.env.RATE_LIMIT_AUTH_PASSWORD_RESET_WINDOW) ||
        60 * 60 * 1000, // 1 hour
      max: isDevelopment
        ? 100
        : parseInt(process.env.RATE_LIMIT_AUTH_PASSWORD_RESET_MAX) || 3,
      keyGenerator: keyGenerators.ip,
      message: "Too many password reset requests. Please try again later.",
    }),
  ),

  /**
   * Email verification rate limiter
   * Limits: 10 requests per hour
   */
  verification: rateLimit(
    createBaseConfig({
      windowMs:
        parseInt(process.env.RATE_LIMIT_AUTH_VERIFICATION_WINDOW) ||
        60 * 60 * 1000, // 1 hour
      max: isDevelopment
        ? 100
        : parseInt(process.env.RATE_LIMIT_AUTH_VERIFICATION_MAX) || 10,
      keyGenerator: keyGenerators.ipAndUser,
      message: "Too many verification attempts. Please try again later.",
    }),
  ),

  /**
   * Standard auth endpoints rate limiter
   * Limits: 100 requests per 15 minutes
   */
  standard: rateLimit(
    createBaseConfig({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isDevelopment ? 1000 : 100,
      keyGenerator: keyGenerators.ip,
      message: "Too many authentication requests. Please try again later.",
    }),
  ),

  /**
   * Token refresh rate limiter
   * Limits: 20 requests per hour
   */
  refreshToken: rateLimit(
    createBaseConfig({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: isDevelopment ? 200 : 20,
      keyGenerator: keyGenerators.ipAndUser,
      message: "Too many token refresh attempts. Please try again later.",
    }),
  ),
};

/**
 * API rate limiters
 */
const api = {
  /**
   * Standard API endpoints rate limiter
   * Limits: 200 requests per minute
   */
  standard: rateLimit(
    createBaseConfig({
      windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW) || 60 * 1000, // 1 minute
      max: isDevelopment
        ? 2000
        : parseInt(process.env.RATE_LIMIT_API_MAX) || 200,
      keyGenerator: keyGenerators.ipAndUser,
      message: "API rate limit exceeded. Please slow down.",
    }),
  ),

  /**
   * File upload rate limiter
   * Limits: 20 uploads per hour
   */
  upload: rateLimit(
    createBaseConfig({
      windowMs:
        parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW) || 60 * 60 * 1000, // 1 hour
      max: isDevelopment
        ? 100
        : parseInt(process.env.RATE_LIMIT_UPLOAD_MAX) || 20,
      keyGenerator: keyGenerators.ipAndUser,
      message: "Upload rate limit exceeded. Please try again later.",
    }),
  ),

  /**
   * Search endpoints rate limiter
   * Limits: 50 searches per minute
   */
  search: rateLimit(
    createBaseConfig({
      windowMs: parseInt(process.env.RATE_LIMIT_SEARCH_WINDOW) || 60 * 1000, // 1 minute
      max: isDevelopment
        ? 200
        : parseInt(process.env.RATE_LIMIT_SEARCH_MAX) || 50,
      keyGenerator: keyGenerators.ipAndUser,
      message: "Search rate limit exceeded. Please slow down.",
    }),
  ),

  /**
   * Notification endpoints rate limiter
   * Limits: 100 requests per minute
   */
  notifications: rateLimit(
    createBaseConfig({
      windowMs:
        parseInt(process.env.RATE_LIMIT_NOTIFICATIONS_WINDOW) || 60 * 1000, // 1 minute
      max: isDevelopment
        ? 500
        : parseInt(process.env.RATE_LIMIT_NOTIFICATIONS_MAX) || 100,
      keyGenerator: keyGenerators.user,
      message: "Notification rate limit exceeded.",
    }),
  ),

  /**
   * Read-only endpoints (GET requests)
   * Limits: 500 requests per minute
   */
  readOnly: rateLimit(
    createBaseConfig({
      windowMs: 60 * 1000, // 1 minute
      max: isDevelopment ? 5000 : 500,
      keyGenerator: keyGenerators.ip,
      message: "Too many read requests. Please slow down.",
      skipFailedRequests: false,
    }),
  ),

  /**
   * Write endpoints (POST, PUT, DELETE)
   * Limits: 100 requests per minute
   */
  write: rateLimit(
    createBaseConfig({
      windowMs: 60 * 1000, // 1 minute
      max: isDevelopment ? 1000 : 100,
      keyGenerator: keyGenerators.user,
      message: "Too many write requests. Please slow down.",
    }),
  ),
};

/**
 * Admin rate limiters
 */
const admin = {
  /**
   * Standard admin endpoints rate limiter
   * Limits: 50 requests per minute
   */
  standard: rateLimit(
    createBaseConfig({
      windowMs: 60 * 1000, // 1 minute
      max: isDevelopment ? 500 : 50,
      keyGenerator: keyGenerators.user,
      message: "Admin rate limit exceeded.",
    }),
  ),

  /**
   * Bulk operations rate limiter
   * Limits: 10 operations per minute
   */
  bulk: rateLimit(
    createBaseConfig({
      windowMs: 60 * 1000, // 1 minute
      max: isDevelopment ? 100 : 10,
      keyGenerator: keyGenerators.user,
      message:
        "Bulk operation rate limit exceeded. Please wait before trying again.",
    }),
  ),

  /**
   * Export operations rate limiter
   * Limits: 5 exports per hour
   */
  export: rateLimit(
    createBaseConfig({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: isDevelopment ? 50 : 5,
      keyGenerator: keyGenerators.user,
      message: "Export rate limit exceeded. Please try again later.",
    }),
  ),
};

/**
 * Special purpose rate limiters
 */
const special = {
  /**
   * Webhook endpoints rate limiter
   */
  webhook: rateLimit(
    createBaseConfig({
      windowMs: 60 * 1000, // 1 minute
      max: 1000,
      keyGenerator: keyGenerators.ip,
      message: "Webhook rate limit exceeded.",
    }),
  ),

  /**
   * Public API (with API key)
   */
  publicApi: rateLimit(
    createBaseConfig({
      windowMs: 60 * 1000, // 1 minute
      max: 100,
      keyGenerator: keyGenerators.apiKey,
      message: "Public API rate limit exceeded. Please upgrade your plan.",
    }),
  ),

  /**
   * Strict rate limiter for sensitive operations
   */
  strict: rateLimit(
    createBaseConfig({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,
      keyGenerator: keyGenerators.ipAndUser,
      message:
        "Too many sensitive operations. Please contact support if you need higher limits.",
    }),
  ),

  /**
   * Very strict rate limiter for critical operations
   */
  critical: rateLimit(
    createBaseConfig({
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 3,
      keyGenerator: keyGenerators.user,
      message: "Critical operation limit exceeded. Please contact support.",
    }),
  ),
};

// ============================================================
// DYNAMIC RATE LIMITER FACTORY
// ============================================================

/**
 * Create a custom rate limiter with dynamic limits based on user role
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
const createDynamicRateLimiter = (options = {}) => {
  return rateLimit(
    createBaseConfig({
      windowMs: options.windowMs || 60 * 1000,
      max: (req) => {
        const user = req.user;

        if (!user) {
          return options.default || 100;
        }

        if (user.role === USER_ROLES.SUPER_ADMIN) {
          return options.superAdmin || options.admin || 1000;
        }

        if (user.role === USER_ROLES.ADMIN) {
          return options.admin || 500;
        }

        if (user.role === USER_ROLES.FACULTY) {
          return options.faculty || 300;
        }

        return options.student || options.default || 200;
      },
      keyGenerator: options.keyGenerator || keyGenerators.user,
      message: options.message || "Rate limit exceeded.",
    }),
  );
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Reset rate limit for a specific key (requires Redis)
 * @param {string} key - Rate limit key
 * @returns {Promise<void>}
 */
const resetRateLimit = async (key) => {
  if (redisClient) {
    try {
      const pattern = `rate_limit:${key}*`;
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info(`✅ Rate limit reset for pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error(`Failed to reset rate limit: ${error.message}`);
    }
  } else {
    logger.warn("⚠️  Rate limit reset requires Redis to be enabled");
  }
};

/**
 * Get current rate limit status for a request
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Rate limit status
 */
const getRateLimitStatus = async (req) => {
  if (!redisClient) {
    return { error: "Redis not enabled" };
  }

  try {
    const key = `rate_limit:${keyGenerators.ipAndUser(req)}`;
    const data = await redisClient.get(key);

    return {
      key,
      remaining: data ? parseInt(data) : null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return { error: error.message };
  }
};

// ============================================================
// HEALTH CHECK
// ============================================================

/**
 * Check rate limiter health
 * @returns {Object} Health status
 */
const healthCheck = () => {
  return {
    enabled: !isRateLimitingDisabled,
    store: redisStore ? "redis" : "memory",
    redisConnected: redisClient?.status === "ready",
    environment: process.env.NODE_ENV,
    config: {
      skipAdmins: process.env.RATE_LIMIT_SKIP_ADMINS === "true",
      whitelistIPs: (process.env.RATE_LIMIT_WHITELIST_IPS || "")
        .split(",")
        .filter(Boolean),
    },
  };
};

// ============================================================
// SHUTDOWN
// ============================================================

/**
 * Gracefully shutdown Redis connection
 */
const shutdown = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info("✅ Redis rate limit store closed");
    } catch (error) {
      logger.error(`Failed to close Redis connection: ${error.message}`);
    }
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Rate limiters
  auth,
  api,
  admin,
  special,

  // Factory function
  createDynamicRateLimiter,

  // Utility functions
  resetRateLimit,
  getRateLimitStatus,
  healthCheck,
  shutdown,

  // Key generators (for custom implementations)
  keyGenerators,

  // Configuration
  isRateLimitingDisabled,
  skipRateLimit,
};

// ============================================================
// LOG INITIALIZATION
// ============================================================

if (isRateLimitingDisabled) {
  logger.warn("⚠️  RATE LIMITING IS DISABLED");
} else {
  logger.info(
    `✅ Rate limiting enabled (Store: ${redisStore ? "Redis" : "Memory"})`,
  );
}
