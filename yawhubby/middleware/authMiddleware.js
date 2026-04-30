const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  USER_STATUS,
  USER_ROLES,
  HTTP_STATUS,
  MESSAGES,
} = require("../config/constants");
const logger = require("../utils/logger");

// ============================
// EXTRACT TOKEN
// ============================

/**
 * Extract JWT token from request headers or cookies
 * @param {Object} req - Express request object
 * @returns {string|null} - JWT token or null
 */
const extractToken = (req) => {
  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  // Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // Check query string (for WebSocket or special cases)
  if (req.query && req.query.token) {
    return req.query.token;
  }

  return null;
};

// ============================
// VERIFY TOKEN
// ============================

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    throw new Error("Token verification failed");
  }
};

// ============================
// PROTECT MIDDLEWARE (UPDATED)
// ============================

/**
 * Protect routes - requires authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      logger.warn(`❌ No token provided - IP: ${req.ip}, Path: ${req.path}`);
      return res.status(HTTP_STATUS.UNAUTHORIZED || 401).json({
        success: false,
        message: "Not authorized. Please login to access this resource.",
        code: "NO_TOKEN",
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      logger.warn(
        `❌ Invalid/Expired token - IP: ${req.ip}, Error: ${err.message}`,
      );

      if (err.message === "Token expired") {
        return res.status(HTTP_STATUS.UNAUTHORIZED || 401).json({
          success: false,
          message: "Session expired. Please login again.",
          code: "TOKEN_EXPIRED",
        });
      }

      return res.status(HTTP_STATUS.UNAUTHORIZED || 401).json({
        success: false,
        message: "Invalid authentication token. Please login again.",
        code: "INVALID_TOKEN",
      });
    }

    // Find user by ID
    const user = await User.findById(decoded.id)
      .select(
        "-password -confirmPassword -passwordResetToken -passwordResetExpires",
      )
      .lean();

    if (!user) {
      logger.warn(`❌ User not found - ID: ${decoded.id}`);
      return res.status(HTTP_STATUS.UNAUTHORIZED || 401).json({
        success: false,
        message: "User account not found.",
        code: "USER_NOT_FOUND",
      });
    }

    // ============================
    // ACCOUNT STATUS CHECKS
    // ============================

    // Check if account is soft-deleted
    if (user.deletedAt) {
      logger.warn(`❌ Deleted account access attempt - Email: ${user.email}`);
      return res.status(HTTP_STATUS.FORBIDDEN || 403).json({
        success: false,
        message: "Your account has been deleted. Please contact support.",
        code: "ACCOUNT_DELETED",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      logger.warn(`❌ Inactive account access - Email: ${user.email}`);
      return res.status(HTTP_STATUS.FORBIDDEN || 403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    // Check account status
    switch (user.status) {
      case USER_STATUS.SUSPENDED:
        logger.warn(`❌ Suspended account access - Email: ${user.email}`);
        return res.status(HTTP_STATUS.FORBIDDEN || 403).json({
          success: false,
          message: "Your account has been suspended. Please contact support.",
          code: "ACCOUNT_SUSPENDED",
        });

      case USER_STATUS.BANNED:
        logger.warn(`❌ Banned account access - Email: ${user.email}`);
        return res.status(HTTP_STATUS.FORBIDDEN || 403).json({
          success: false,
          message: "Your account has been banned. Please contact support.",
          code: "ACCOUNT_BANNED",
        });

      case USER_STATUS.PENDING:
        // Allow access but with limited features? Or deny completely
        // For now, allow but log warning
        logger.warn(`⚠️ Pending account access - Email: ${user.email}`);
        // Uncomment below to restrict pending accounts
        // return res.status(HTTP_STATUS.FORBIDDEN || 403).json({
        //   success: false,
        //   message: 'Your account is pending approval. Please wait for verification.',
        //   code: 'ACCOUNT_PENDING'
        // });
        break;

      case USER_STATUS.ACTIVE:
        // All good
        break;

      default:
        logger.warn(
          `⚠️ Unknown account status - Email: ${user.email}, Status: ${user.status}`,
        );
    }

    // Check if email is verified (optional - can be disabled for certain routes)
    if (!user.isVerified && process.env.REQUIRE_EMAIL_VERIFICATION === "true") {
      // Skip for admin users or specific routes
      const skipPaths = [
        "/api/auth/resend-verification",
        "/api/auth/verify-email",
      ];
      if (!skipPaths.includes(req.path)) {
        return res.status(HTTP_STATUS.FORBIDDEN || 403).json({
          success: false,
          message: "Please verify your email address before continuing.",
          code: "EMAIL_NOT_VERIFIED",
          requiresVerification: true,
        });
      }
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt && user.changedPasswordAfter) {
      const changedAt = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedAt) {
        logger.warn(
          `⚠️ Password changed after token issued - Email: ${user.email}`,
        );
        return res.status(HTTP_STATUS.UNAUTHORIZED || 401).json({
          success: false,
          message: "Password was recently changed. Please login again.",
          code: "PASSWORD_CHANGED",
        });
      }
    }

    // ============================
    // ATTACH USER TO REQUEST
    // ============================

    // Add user to request object
    req.user = user;
    req.token = token;
    req.tokenDecoded = decoded;

    // Add user ID for convenience
    req.userId = user._id;

    // Add user role for quick access
    req.userRole = user.role;

    // Check if user is admin
    req.isAdmin =
      user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;

    // Check if user is super admin
    req.isSuperAdmin = user.role === USER_ROLES.SUPER_ADMIN;

    if (process.env.NODE_ENV === "development") {
      logger.debug(
        `✅ Authenticated: ${user.email} (${user.role}) - ${req.method} ${req.path}`,
      );
    }

    next();
  } catch (error) {
    logger.error(`❌ Auth middleware error: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR || 500).json({
      success: false,
      message: "Authentication failed. Please try again later.",
      code: "AUTH_ERROR",
    });
  }
};

// ============================
// AUTHORIZE (ROLE BASED - UPDATED)
// ============================

/**
 * Authorize middleware - restricts access to specific roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} - Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn(`⚠️ No user in request - Authorize failed`);
      return res.status(HTTP_STATUS.UNAUTHORIZED || 401).json({
        success: false,
        message: "Not authenticated",
        code: "NOT_AUTHENTICATED",
      });
    }

    const userRole = req.user.role;
    const hasAccess = roles.includes(userRole);

    if (!hasAccess) {
      logger.warn(
        `❌ Forbidden access - User: ${req.user.email}, Role: ${userRole}, Required: ${roles.join(", ")}`,
      );

      return res.status(HTTP_STATUS.FORBIDDEN || 403).json({
        success: false,
        message: `Access denied. ${userRole} role does not have permission to access this resource.`,
        code: "FORBIDDEN",
        requiredRoles: roles,
        userRole: userRole,
      });
    }

    if (process.env.NODE_ENV === "development") {
      logger.debug(
        `✅ Authorized: ${req.user.email} (${userRole}) for ${req.path}`,
      );
    }

    next();
  };
};

// ============================
// RESTRICT TO ADMIN (SHORTCUT)
// ============================

/**
 * Restrict access to admin users only
 * @returns {Function} - Express middleware
 */
const restrictToAdmin = () => {
  return authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN);
};

// ============================
// RESTRICT TO SUPER ADMIN (SHORTCUT)
// ============================

/**
 * Restrict access to super admin only
 * @returns {Function} - Express middleware
 */
const restrictToSuperAdmin = () => {
  return authorize(USER_ROLES.SUPER_ADMIN);
};

// ============================
// OWNERSHIP CHECK (UPDATED)
// ============================

/**
 * Check if the authenticated user owns the resource
 * @param {Function} getResourceUserId - Function that returns the resource owner's user ID
 * @returns {Function} - Express middleware
 */
const checkOwnership = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED || 401).json({
          success: false,
          message: "Not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // Admin can access any resource
      if (
        req.user.role === USER_ROLES.ADMIN ||
        req.user.role === USER_ROLES.SUPER_ADMIN
      ) {
        return next();
      }

      const resourceUserId = await getResourceUserId(req);

      if (!resourceUserId) {
        return res.status(HTTP_STATUS.NOT_FOUND || 404).json({
          success: false,
          message: "Resource not found",
          code: "RESOURCE_NOT_FOUND",
        });
      }

      const isOwner = req.user._id.toString() === resourceUserId.toString();

      if (!isOwner) {
        logger.warn(
          `❌ Ownership violation - User: ${req.user.email}, Resource owner: ${resourceUserId}`,
        );
        return res.status(HTTP_STATUS.FORBIDDEN || 403).json({
          success: false,
          message: "You do not have permission to access this resource",
          code: "NOT_OWNER",
        });
      }

      next();
    } catch (error) {
      logger.error(`❌ Ownership check error: ${error.message}`);

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR || 500).json({
        success: false,
        message: "Error checking resource ownership",
        code: "OWNERSHIP_CHECK_ERROR",
      });
    }
  };
};

// ============================
// OPTIONAL AUTH (FOR PUBLIC ROUTES)
// ============================

/**
 * Optional authentication - doesn't require auth but attaches user if available
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id)
          .select("-password -confirmPassword")
          .lean();

        if (user && !user.deletedAt && user.isActive) {
          req.user = user;
          req.userId = user._id;
          req.userRole = user.role;
        }
      } catch (err) {
        // Invalid token - continue without user
        logger.debug(`Optional auth: Invalid token - ${err.message}`);
      }
    }

    next();
  } catch (error) {
    logger.error(`Optional auth error: ${error.message}`);
    next();
  }
};

// ============================
// RATE LIMITER (OPTIONAL)
// ============================

/**
 * Simple in-memory rate limiter for login attempts
 * In production, use express-rate-limit or Redis
 */
const loginLimiter = (req, res, next) => {
  // Placeholder - implement with express-rate-limit in production
  next();
};

// ============================
// CSRF PROTECTION (OPTIONAL)
// ============================

/**
 * CSRF token validation for state-changing requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const csrfProtection = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers["x-csrf-token"] || req.body._csrf;
  const cookieToken = req.cookies["csrf-token"];

  if (!csrfToken || !cookieToken || csrfToken !== cookieToken) {
    logger.warn(`❌ CSRF validation failed - IP: ${req.ip}`);
    return res.status(HTTP_STATUS.FORBIDDEN || 403).json({
      success: false,
      message: "CSRF token validation failed",
      code: "CSRF_FAILED",
    });
  }

  next();
};

// ============================
// PERMISSION CHECK HELPER
// ============================

/**
 * Check if user has specific permission
 * @param {Object} user - User object
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether user has permission
 */
const hasPermission = (user, permission) => {
  if (!user) return false;

  // Super admin has all permissions
  if (user.role === USER_ROLES.SUPER_ADMIN) return true;

  // Define role-based permissions
  const permissions = {
    [USER_ROLES.ADMIN]: [
      "view_users",
      "edit_users",
      "delete_users",
      "view_notices",
      "create_notices",
      "edit_notices",
      "delete_notices",
      "view_categories",
      "create_categories",
      "edit_categories",
      "delete_categories",
      "view_reports",
      "export_reports",
    ],
    [USER_ROLES.FACULTY]: [
      "view_users",
      "view_notices",
      "create_notices",
      "edit_own_notices",
      "view_categories",
      "view_reports",
    ],
    [USER_ROLES.STUDENT]: ["view_users", "view_notices", "view_categories"],
  };

  const userPermissions = permissions[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * Permission-based authorization middleware
 * @param {string} permission - Required permission
 * @returns {Function} - Express middleware
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED || 401).json({
        success: false,
        message: "Not authenticated",
        code: "NOT_AUTHENTICATED",
      });
    }

    if (!hasPermission(req.user, permission)) {
      logger.warn(
        `❌ Missing permission - User: ${req.user.email}, Permission: ${permission}`,
      );
      return res.status(HTTP_STATUS.FORBIDDEN || 403).json({
        success: false,
        message: `Missing required permission: ${permission}`,
        code: "MISSING_PERMISSION",
      });
    }

    next();
  };
};

// ============================
// EXPORTS (COMPLETE)
// ============================

module.exports = {
  // Main middleware
  protect,
  authorize,
  optionalAuth,

  // Shortcuts
  restrictToAdmin,
  restrictToSuperAdmin,

  // Ownership & permissions
  checkOwnership,
  hasPermission,
  requirePermission,

  // Security
  csrfProtection,
  loginLimiter,

  // Utilities
  extractToken,
  verifyToken,
};
