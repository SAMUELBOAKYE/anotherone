// backend/middleware/auth.js
// AUTHENTICATION AND AUTHORIZATION MIDDLEWARE
// @version 1.0.0

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { HTTP_STATUS, USER_ROLES, USER_STATUS } = require("../config/constants");
const logger = require("../utils/logger");

// ============================================================
// PROTECT MIDDLEWARE - AUTHENTICATION REQUIRED
// ============================================================

/**
 * Middleware to protect routes - requires valid JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Check cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Not authorized to access this route. Please log in.",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id).select(
        "-password -refreshToken -emailVerificationToken -passwordResetToken",
      );

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "The user belonging to this token no longer exists.",
        });
      }

      // Check if user account is active
      if (user.status !== USER_STATUS.ACTIVE) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message:
            "Your account is not active. Please verify your email or contact support.",
        });
      }

      // Check if password was changed after token was issued
      if (user.passwordChangedAt) {
        const changedTimestamp = parseInt(
          user.passwordChangedAt.getTime() / 1000,
          10,
        );

        if (decoded.iat < changedTimestamp) {
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: "Password recently changed. Please log in again.",
          });
        }
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (err) {
      if (err.name === "JsonWebTokenError") {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Invalid token. Please log in again.",
        });
      } else if (err.name === "TokenExpiredError") {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Token expired. Please log in again.",
        });
      } else {
        throw err;
      }
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Authentication failed. Please try again.",
    });
  }
};

// ============================================================
// AUTHORIZE MIDDLEWARE - ROLE-BASED ACCESS CONTROL
// ============================================================

/**
 * Middleware to restrict access based on user roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated first
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Not authorized. Please log in first.",
        });
      }

      // Check if user role is allowed
      if (!roles.includes(req.user.role)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: `User role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      logger.error(`Authorize middleware error: ${error.message}`);

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Authorization failed. Please try again.",
      });
    }
  };
};

// ============================================================
// OPTIONAL AUTH MIDDLEWARE (SOFT AUTH)
// ============================================================

/**
 * Middleware for optional authentication - attaches user if token exists
 * Does not block the request if no token is provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select(
        "-password -refreshToken",
      );

      if (user && user.status === USER_STATUS.ACTIVE) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (err) {
      req.user = null;
    }

    next();
  } catch (error) {
    logger.error(`Optional auth middleware error: ${error.message}`);
    req.user = null;
    next();
  }
};

// ============================================================
// API KEY AUTHENTICATION (FOR SERVICE-TO-SERVICE)
// ============================================================

/**
 * Middleware to authenticate using API key
 * Used for service-to-service communication
 */
const apiKeyAuth = (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "API key is required",
      });
    }

    const validApiKeys = (process.env.API_KEYS || "")
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean);

    // Check against environment variable or database
    if (
      !validApiKeys.includes(apiKey) &&
      apiKey !== process.env.ADMIN_SECRET_KEY
    ) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid API key",
      });
    }

    // Attach service info
    req.service = {
      authenticated: true,
      apiKey: apiKey.substring(0, 8) + "...",
    };

    next();
  } catch (error) {
    logger.error(`API key auth error: ${error.message}`);

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "API key authentication failed",
    });
  }
};

// ============================================================
// SELF OR ADMIN MIDDLEWARE
// ============================================================

/**
 * Middleware to allow access only to the user themselves or admins
 * @param {string} paramName - Name of the parameter containing user ID
 */
const selfOrAdmin = (paramName = "id") => {
  return (req, res, next) => {
    try {
      const resourceId = req.params[paramName] || req.body.userId;

      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Allow if user is accessing their own resource or is admin
      if (
        req.user._id.toString() === resourceId?.toString() ||
        req.user.role === USER_ROLES.ADMIN ||
        req.user.role === USER_ROLES.SUPER_ADMIN
      ) {
        return next();
      }

      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "You are not authorized to access this resource",
      });
    } catch (error) {
      logger.error(`Self or admin middleware error: ${error.message}`);

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Authorization check failed",
      });
    }
  };
};

// ============================================================
// VERIFY EMAIL MIDDLEWARE
// ============================================================

/**
 * Middleware to ensure user has verified their email
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.user.isVerified) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Please verify your email address to access this resource",
      requiresVerification: true,
    });
  }

  next();
};

// ============================================================
// VERIFY STUDENT ID MIDDLEWARE
// ============================================================

/**
 * Middleware to ensure student has verified their ID
 */
const requireStudentIdVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role === USER_ROLES.STUDENT && !req.user.studentIdVerified) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Please verify your student ID to access this resource",
      requiresIdVerification: true,
    });
  }

  next();
};

// ============================================================
// RATE LIMIT BY USER MIDDLEWARE
// ============================================================

/**
 * Middleware to apply different rate limits based on user role
 */
const rateLimitByUser = (limits = {}) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      // Default limit for unauthenticated users
      req.rateLimit = limits.default || 100;
    } else if (
      user.role === USER_ROLES.ADMIN ||
      user.role === USER_ROLES.SUPER_ADMIN
    ) {
      req.rateLimit = limits.admin || 1000;
    } else if (user.role === USER_ROLES.FACULTY) {
      req.rateLimit = limits.faculty || 500;
    } else {
      req.rateLimit = limits.student || 200;
    }

    next();
  };
};

// ============================================================
// BLOCK SUSPENDED USERS
// ============================================================

/**
 * Middleware to block suspended users
 */
const blockSuspended = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  if (req.user.status === USER_STATUS.SUSPENDED) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: `Your account has been suspended. Reason: ${req.user.suspendedReason || "Contact support for more information."}`,
      suspendedAt: req.user.suspendedAt,
    });
  }

  next();
};

// ============================================================
// MAINTENANCE MODE MIDDLEWARE
// ============================================================

/**
 * Middleware to check maintenance mode
 */
const checkMaintenance = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE !== "true") {
    return next();
  }

  // Allow specific IPs
  const allowedIPs = (process.env.MAINTENANCE_ALLOWED_IPS || "")
    .split(",")
    .map((ip) => ip.trim());

  if (
    allowedIPs.includes(req.ip) ||
    req.ip === "127.0.0.1" ||
    req.ip === "::1"
  ) {
    return next();
  }

  // Allow admins
  if (
    req.user &&
    (req.user.role === USER_ROLES.ADMIN ||
      req.user.role === USER_ROLES.SUPER_ADMIN)
  ) {
    return next();
  }

  // Allow specific endpoints
  const allowedEndpoints = (
    process.env.MAINTENANCE_ALLOWED_ENDPOINTS || "/health,/api/health"
  )
    .split(",")
    .map((endpoint) => endpoint.trim());

  if (allowedEndpoints.some((endpoint) => req.path.startsWith(endpoint))) {
    return next();
  }

  return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
    success: false,
    message:
      process.env.MAINTENANCE_MESSAGE ||
      "System is under maintenance. Please check back later.",
    maintenanceEndTime: process.env.MAINTENANCE_END_TIME || null,
  });
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  protect,
  authorize,
  optionalAuth,
  apiKeyAuth,
  selfOrAdmin,
  requireEmailVerified,
  requireStudentIdVerified,
  rateLimitByUser,
  blockSuspended,
  checkMaintenance,
};
