// backend/server.js
// PRODUCTION-READY SERVER - COMPLETE INTEGRATION
// @version 3.0.0 - PROFESSIONAL GRADE

require("dotenv").config();

// ============================================================
// SENTRY INITIALIZATION
// ============================================================

const isSentryEnabled = !!(
  process.env.SENTRY_DSN &&
  process.env.SENTRY_DSN !== "your-sentry-dsn" &&
  process.env.SENTRY_ENABLED !== "false"
);

if (isSentryEnabled) {
  try {
    require("./instrument.js");
    console.log("✅ Sentry instrumentation loaded");
  } catch (error) {
    console.warn("⚠️  Failed to load Sentry instrumentation:", error.message);
  }
}

// ============================================================
// CORE DEPENDENCIES
// ============================================================

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const os = require("os");
const fs = require("fs").promises;

// ============================================================
// CUSTOM MODULES
// ============================================================

const logger = require("./utils/logger");
const { connectDB } = require("./config/db");
const NotificationService = require("./utils/notificationService");
const {
  setNotificationService,
  setSocketIO,
} = require("./controllers/notificationController");
const { getCacheManager } = require("./utils/cacheManager");
const { initializeAuditLogger } = require("./utils/auditLogger");
const { getDatabaseUtils } = require("./utils/databaseUtils");
const { getSystemUtils } = require("./utils/systemUtils");

// ============================================================
// CONTROLLER IMPORTS — for notification wiring
// ============================================================
const noticeController = require("./controllers/noticeController");
const eventController = require("./controllers/eventController");

// ============================================================
// SENTRY SDK (Conditional Import)
// ============================================================

let Sentry = null;
if (isSentryEnabled) {
  try {
    Sentry = require("@sentry/node");
    console.log("✅ Sentry SDK loaded");
  } catch (error) {
    console.warn("⚠️  Failed to load Sentry SDK:", error.message);
  }
}

// ============================================================
// EXPRESS APP SETUP
// ============================================================

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ============================================================
// GLOBAL INSTANCES
// ============================================================

let io = null;
let backupService = null;
let performanceMonitor = null;
let smsService = null;
let cacheManager = null;
let auditLogger = null;
let databaseUtils = null;
let systemUtils = null;
let groqClient = null;

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const DISABLE_RATE_LIMIT =
  process.env.DISABLE_RATE_LIMIT === "true" || isDevelopment;

// ============================================================
// EMAIL TRANSPORTER CONFIGURATION
// ============================================================

let transporter = null;

const createTransport = () => {
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;

  if (!user || !pass) {
    logger.warn(
      "⚠️  Email not configured — set SMTP_USER and SMTP_PASS in .env to enable emails.",
    );
    return null;
  }

  let config;

  if (process.env.ETHEREAL_ENABLED === "true") {
    config = {
      host: process.env.ETHEREAL_HOST || "smtp.ethereal.email",
      port: parseInt(process.env.ETHEREAL_PORT || "587", 10),
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || user,
        pass: process.env.ETHEREAL_PASS || pass,
      },
    };
  } else if (process.env.SMTP_HOST) {
    config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    };
  } else if (process.env.MAIL_SERVICE) {
    config = {
      service: process.env.MAIL_SERVICE,
      auth: { user, pass },
    };
  } else {
    config = {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user, pass },
    };
  }

  try {
    const t = nodemailer.createTransport(config);

    t.verify((err) => {
      if (err) {
        logger.error(
          `❌ Email transporter verification failed: ${err.message}`,
        );
      } else {
        logger.info(`✅ Email transporter ready (${user})`);
        if (process.env.ETHEREAL_ENABLED === "true") {
          logger.info(
            `📧 Using Ethereal test account - Check emails at https://ethereal.email`,
          );
        }
      }
    });

    return t;
  } catch (error) {
    logger.error(`❌ Failed to create email transporter: ${error.message}`);
    return null;
  }
};

transporter = createTransport();

// ============================================================
// EMAIL SENDER
// ============================================================

const MAIL_FROM =
  process.env.EMAIL_FROM ||
  `"KAAF University Noticeboard" <${process.env.SMTP_USER || process.env.MAIL_USER || "noreply@kaaf.edu.gh"}>`;

const sendMail = async (options) => {
  if (!transporter) {
    logger.warn("[Email] Skipped — transporter not configured.");
    return false;
  }

  try {
    const info = await transporter.sendMail({ from: MAIL_FROM, ...options });
    logger.info(`[Email] Sent to ${options.to} — MessageId: ${info.messageId}`);
    if (process.env.ETHEREAL_ENABLED === "true" && info.messageId) {
      logger.info(
        `📧 Preview URL: https://ethereal.email/message/${info.messageId}`,
      );
    }
    return true;
  } catch (err) {
    logger.error(`[Email] Failed to send to ${options.to}: ${err.message}`);
    if (isSentryEnabled && Sentry) {
      Sentry.captureException(err, {
        tags: { feature: "email", recipient: options.to },
      });
    }
    return false;
  }
};

// ============================================================
// EMAIL TEMPLATES
// ============================================================

const sendWelcomeEmail = async (to, name) => {
  const dashboardUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard`;
  return sendMail({
    to,
    subject: "Welcome to KAAF University Noticeboard 🎓",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welcome to KAAF Noticeboard</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:40px 40px 32px;text-align:center;"><h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">🎓 KAAF University</h1><p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Official Noticeboard & Events Portal</p></td></tr><tr><td style="padding:40px;"><h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;font-weight:700;">Welcome aboard, ${name}! 👋</h2><p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">Your account has been successfully created. We're excited to have you join the KAAF University community.</p><table width="100%" style="margin-bottom:28px;"><tr><td style="padding:12px;background:#f8fafc;border-radius:10px;"><table cellpadding="0" cellspacing="0"><tr><td style="font-size:24px;padding-right:14px;">📢</td><td><p style="margin:0;color:#1e293b;font-weight:600;">Announcements & Notices</p><p style="margin:2px 0 0;color:#64748b;font-size:13px;">Stay up to date with university announcements.</p></td></tr></table></td></tr><tr><td style="height:8px;"></td></tr><tr><td style="padding:12px;background:#f8fafc;border-radius:10px;"><table cellpadding="0" cellspacing="0"><tr><td style="font-size:24px;padding-right:14px;">📅</td><td><p style="margin:0;color:#1e293b;font-weight:600;">Events & Registration</p><p style="margin:2px 0 0;color:#64748b;font-size:13px;">Browse and register for upcoming events.</p></td></tr></table></td></tr><tr><td style="height:8px;"></td></tr><tr><td style="padding:12px;background:#f8fafc;border-radius:10px;"><table cellpadding="0" cellspacing="0"><tr><td style="font-size:24px;padding-right:14px;">🔔</td><td><p style="margin:0;color:#1e293b;font-weight:600;">Real-time Notifications</p><p style="margin:2px 0 0;color:#64748b;font-size:13px;">Get notified instantly about what matters.</p></td></tr></table></td></tr></table><table width="100%"><tr><td align="center"><a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;">Go to My Dashboard →</a></td></tr></table></td></tr><tr><td style="background:#f1f5f9;padding:24px 40px;text-align:center;"><p style="margin:0;color:#94a3b8;font-size:12px;">This email was sent to <strong>${to}</strong> because you registered on the KAAF University Noticeboard.</p><p style="margin:8px 0 0;color:#94a3b8;font-size:11px;">&copy; ${new Date().getFullYear()} KAAF University. All rights reserved.</p></td></tr></table></td></tr></table></body></html>`,
    text: `Welcome to KAAF University Noticeboard, ${name}!\n\nYour account has been created successfully.\n\nVisit your dashboard: ${dashboardUrl}\n\nThank you for joining the KAAF community!`,
  });
};

const sendPasswordResetEmail = async (to, name, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;
  return sendMail({
    to,
    subject: "Reset Your Password — KAAF Noticeboard",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Password Reset</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:36px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🔐 Password Reset</h1></td></tr><tr><td style="padding:36px;"><p style="margin:0 0 16px;font-size:15px;">Hi <strong>${name}</strong>,</p><p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">We received a request to reset your password. Click the button below. <strong>This link expires in 1 hour.</strong></p><table width="100%"><tr><td align="center"><a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Reset My Password →</a></td></tr></table><p style="margin:24px 0 0;color:#94a3b8;font-size:12px;text-align:center;word-break:break-all;">Or copy: <span style="color:#64748b;">${resetUrl}</span></p></td></tr><tr><td style="background:#f1f5f9;padding:20px;text-align:center;"><p style="margin:0;color:#94a3b8;font-size:11px;">If you didn't request this, please ignore this email.</p></td></tr></table></td></tr></table></body></html>`,
    text: `Hi ${name},\n\nReset your password here: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,
  });
};

const sendNotificationEmail = async (
  to,
  name,
  subject,
  notificationHtml,
  notificationText,
) => {
  const notificationsUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/notifications`;
  return sendMail({
    to,
    subject,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${subject}</title></head><body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">📬 New Notification</h1></td></tr><tr><td style="padding:32px;"><p style="margin:0 0 16px;">Hi <strong>${name}</strong>,</p>${notificationHtml}<table width="100%" style="margin-top:28px;"><tr><td align="center"><a href="${notificationsUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View All Notifications →</a></td></tr></table></td></tr><tr><td style="background:#f1f5f9;padding:20px;text-align:center;"><p style="margin:0;color:#94a3b8;font-size:11px;">You are receiving this because you have notifications enabled.</p></td></tr></table></td></tr></table></body></html>`,
    text: `Hi ${name},\n\n${notificationText}\n\nView all notifications: ${notificationsUrl}`,
  });
};

app.locals.sendWelcomeEmail = sendWelcomeEmail;
app.locals.sendPasswordResetEmail = sendPasswordResetEmail;
app.locals.sendNotificationEmail = sendNotificationEmail;
app.locals.sendMail = sendMail;

// ============================================================
// CORS CONFIGURATION
// ============================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5000",
  "https://kaaf-noticeboard.vercel.app",
  process.env.FRONTEND_URL,
  process.env.BACKEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== "production"
    ) {
      callback(null, true);
    } else {
      logger.warn(`❌ CORS blocked: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-Refresh-Token",
    "X-API-Key",
    "X-Request-ID",
  ],
  exposedHeaders: [
    "Content-Range",
    "X-Total-Count",
    "X-Request-ID",
    "X-Response-Time",
  ],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
      },
    },
  }),
);

app.use(compression({ level: 6, threshold: 1024 }));

app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || "10mb",
    verify: (req, res, buf, encoding) => {
      if (buf && buf.length) req.rawBody = buf.toString(encoding || "utf8");
    },
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.URLENCODED_BODY_LIMIT || "10mb",
  }),
);
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(
  mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
      logger.debug(`MongoDB sanitization applied to ${key}`);
    },
  }),
);

app.use((req, res, next) => {
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = xss(obj[key], {
          whiteList: {},
          stripIgnoreTag: true,
          stripIgnoreTagBody: ["script", "style"],
        });
      } else if (typeof obj[key] === "object") {
        sanitizeObject(obj[key]);
      }
    }
  };
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
});

app.use(
  hpp({
    whitelist: [
      "page",
      "limit",
      "sort",
      "search",
      "category",
      "status",
      "priority",
      "type",
      "department",
      "role",
    ],
  }),
);

app.use((req, res, next) => {
  req.requestId =
    req.headers["x-request-id"] || crypto.randomBytes(16).toString("hex");
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

app.use((req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  const addResponseTime = (data) => {
    const responseTime = Date.now() - req.startTime;
    res.setHeader("X-Response-Time", `${responseTime}ms`);
    if (responseTime > 1000)
      logger.warn(
        `⚠️  Slow request: ${req.method} ${req.path} took ${responseTime}ms`,
      );
    return data;
  };
  res.send = function (data) {
    return originalSend.call(this, addResponseTime(data));
  };
  res.json = function (data) {
    return originalJson.call(this, addResponseTime(data));
  };
  next();
});

// ============================================================
// RATE LIMITING
// ============================================================

const skipRateLimit = (req) => {
  return (
    req.path === "/health" ||
    req.path === "/api/health" ||
    req.path === "/api/health/detailed" ||
    req.path.startsWith("/public") ||
    req.path.startsWith("/uploads") ||
    req.path === "/metrics" ||
    (process.env.RATE_LIMIT_WHITELIST_IPS &&
      process.env.RATE_LIMIT_WHITELIST_IPS.split(",").includes(req.ip))
  );
};

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: isDevelopment ? 5000 : parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: process.env.RATE_LIMIT_STANDARD_HEADERS !== "false",
  legacyHeaders: process.env.RATE_LIMIT_LEGACY_HEADERS === "true",
  skip: skipRateLimit,
  keyGenerator: (req) => req.ip,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
    retryAfter: 60,
  },
});

const authLimiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_AUTH_LOGIN_WINDOW) || 15 * 60 * 1000,
  max: isDevelopment
    ? 100
    : parseInt(process.env.RATE_LIMIT_AUTH_LOGIN_MAX) || 5,
  keyGenerator: (req) =>
    `${req.ip}:${req.body?.email || req.body?.identifier || "anon"}`,
  skip: skipRateLimit,
  handler: (req, res) => {
    logger.warn(`🔒 Rate limit exceeded for auth endpoint: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts. Please try again later.",
      retryAfter: 900,
    });
  },
});

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW) || 60 * 1000,
  max: isDevelopment ? 2000 : parseInt(process.env.RATE_LIMIT_API_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDevelopment ? 500 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  skip: skipRateLimit,
});

if (DISABLE_RATE_LIMIT) {
  logger.warn("⚠️  RATE LIMITING IS DISABLED");
  app.use("/api", (req, res, next) => next());
} else {
  app.use("/api", globalLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/forgot-password", authLimiter);
  app.use("/api/auth/reset-password", authLimiter);
  app.use("/api/auth/verify-student-id", apiLimiter);
  app.use("/api/notifications", apiLimiter);
  app.use("/api/notices", apiLimiter);
  app.use("/api/events", apiLimiter);
  app.use("/api/admin", adminLimiter);
}

// ============================================================
// LOGGING
// ============================================================

if (isDevelopment) {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.info(msg.trim()) },
      skip: (req) => req.path === "/health",
    }),
  );
}

// ============================================================
// STATIC FILES
// ============================================================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: isProduction ? "30d" : 0,
    index: false,
    dotfiles: "deny",
  }),
);

app.use(
  "/public",
  express.static(path.join(__dirname, "public"), {
    maxAge: isProduction ? "7d" : 0,
  }),
);

if (process.env.BACKUP_ENABLED === "true") {
  app.use(
    "/backups",
    express.static(path.join(__dirname, "backups"), {
      index: false,
      dotfiles: "deny",
    }),
  );
}

// ============================================================
// API ROUTES
// ============================================================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    version: process.env.APP_VERSION || "2.2.0",
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/notices", require("./routes/noticeRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/avatar", require("./routes/avatarRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

if (process.env.SMS_ENABLED === "true") {
  try {
    app.use("/api/sms", require("./routes/smsRoutes"));
    logger.info("✅ SMS routes enabled");
  } catch (error) {
    logger.error(`Failed to load SMS routes: ${error.message}`);
  }
}

if (process.env.BACKUP_ENABLED === "true") {
  try {
    app.use("/api/backup", require("./routes/backupRoutes"));
    logger.info("✅ Backup routes enabled");
  } catch (error) {
    logger.error(`Failed to load Backup routes: ${error.message}`);
  }
}

// ============================================================
// HEALTH ENDPOINTS
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    server: "running",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    socketio: io ? "enabled" : "disabled",
    rateLimiting: !DISABLE_RATE_LIMIT ? "enabled" : "disabled",
    sentry: isSentryEnabled ? "configured" : "not configured",
    cache: cacheManager ? "enabled" : "disabled",
    email: transporter ? "configured" : "not configured",
    sms: smsService ? "enabled" : "disabled",
  });
});

app.get("/api/health/detailed", async (req, res) => {
  const startTime = Date.now();
  res.status(200).json({
    uptime: Math.floor(process.uptime()),
    responseTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    status: "OK",
    database: {
      status:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      name: mongoose.connection.name || "N/A",
      host: mongoose.connection.host || "N/A",
      readyState: mongoose.connection.readyState,
    },
    socketio: {
      status: io ? "enabled" : "disabled",
      connections: io ? io.engine?.clientsCount || 0 : 0,
    },
    services: {
      cache: cacheManager ? "running" : "stopped",
      backup: backupService ? "running" : "stopped",
      monitor: performanceMonitor ? "running" : "stopped",
      sms: smsService ? "running" : "stopped",
      groq: groqClient ? "running" : "stopped",
    },
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + " MB",
      heapTotal:
        Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
      heapUsed:
        Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || "development",
      version: process.env.APP_VERSION || "2.2.0",
      appName: process.env.APP_NAME || "kaaf-noticeboard-backend",
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + " GB",
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + " GB",
      hostname: os.hostname(),
      pid: process.pid,
    },
  });
});

app.get("/metrics", async (req, res) => {
  try {
    res.json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: os.loadavg(),
      connections: io ? io.engine?.clientsCount || 0 : 0,
      database: mongoose.connection.readyState === 1 ? 1 : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (isDevelopment && isSentryEnabled) {
  app.get("/debug-sentry", (req, res) => {
    throw new Error("Test error from KAAF Noticeboard for Sentry!");
  });
}

if (isDevelopment && process.env.SWAGGER_ENABLED === "true") {
  try {
    const swaggerUi = require("swagger-ui-express");
    const swaggerDocument = require("./swagger.json");
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    logger.info(
      `📚 Swagger docs available at http://localhost:${PORT}/api-docs`,
    );
  } catch (error) {
    logger.warn("⚠️  Swagger documentation not available:", error.message);
  }
}

// ============================================================
// ERROR HANDLERS
// ============================================================

if (isSentryEnabled && Sentry) {
  Sentry.setupExpressErrorHandler(app);
  logger.info("✅ Sentry error handler configured");
}

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  logger.error(`❌ Error: ${err.message}`);
  logger.error(err.stack);

  if (isSentryEnabled && Sentry && !res.headersSent) {
    Sentry.captureException(err, {
      tags: {
        path: req.path,
        method: req.method,
        ip: req.ip,
        requestId: req.requestId,
      },
      extra: {
        body: req.body,
        query: req.query,
        params: req.params,
        user: req.user?.id,
      },
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    requestId: req.requestId,
    ...(isDevelopment && { stack: err.stack }),
    ...(isSentryEnabled && res.sentry && { errorId: res.sentry }),
  });
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

const gracefulShutdown = async (signal) => {
  logger.info(`🛑 Received ${signal}, closing gracefully...`);

  const shutdownTimeout = setTimeout(() => {
    logger.error("⚠️  Could not close connections in time, forcing shutdown");
    process.exit(1);
  }, 30000);

  try {
    if (io) {
      await new Promise((resolve) => {
        io.close(() => {
          logger.info("📡 Socket.io closed");
          resolve();
        });
      });
    }
    if (performanceMonitor?.shutdown) {
      await performanceMonitor.shutdown();
      logger.info("📊 Performance monitor closed");
    }
    if (cacheManager?.shutdown) {
      await cacheManager.shutdown();
      logger.info("💾 Cache manager closed");
    }
    await new Promise((resolve) => {
      server.close(() => {
        logger.info("🔌 HTTP server closed");
        resolve();
      });
    });
    try {
      await mongoose.connection.close();
      logger.info("💾 MongoDB connection closed");
    } catch (err) {
      logger.error(`Error closing MongoDB: ${err.message}`);
    }
    if (isSentryEnabled && Sentry) {
      await Sentry.close(2000);
      logger.info("📊 Sentry closed");
    }
    clearTimeout(shutdownTimeout);
    logger.info("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  logger.error(`💥 Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
  if (isSentryEnabled && Sentry)
    Sentry.captureException(err, { tags: { type: "uncaughtException" } });
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`💥 Unhandled Rejection at: ${promise}, reason: ${reason}`);
  if (isSentryEnabled && Sentry)
    Sentry.captureException(reason, { tags: { type: "unhandledRejection" } });
  gracefulShutdown("unhandledRejection");
});

// ============================================================
// START SERVER IMMEDIATELY - DON'T WAIT FOR DATABASE (RENDER FIX)
// ============================================================

// Create directories function
const createDirectories = async () => {
  const directories = ["uploads", "logs", "backups", "temp", "public"];
  for (const dir of directories) {
    try {
      await fs.mkdir(path.join(__dirname, dir), { recursive: true });
    } catch (error) {
      // Ignore errors if directories already exist
    }
  }
};

// Initialize services function
const initializeAllServices = async () => {
  try {
    cacheManager = await getCacheManager();
    if (cacheManager) logger.info("✅ Cache manager initialized");

    auditLogger = await initializeAuditLogger();
    if (auditLogger) logger.info("✅ Audit logger initialized");

    databaseUtils = await getDatabaseUtils();
    if (databaseUtils) logger.info("✅ Database utils initialized");

    systemUtils = await getSystemUtils();
    if (systemUtils) logger.info("✅ System utils initialized");

    // Initialize Socket.IO if enabled
    if (process.env.ENABLE_SOCKETIO !== "false") {
      const { Server } = require("socket.io");

      io = new Server(server, {
        cors: corsOptions,
        transports: ["websocket", "polling"],
        allowEIO3: true,
        pingTimeout: parseInt(process.env.WEBSOCKET_PING_TIMEOUT) || 60000,
        pingInterval: parseInt(process.env.WEBSOCKET_PING_INTERVAL) || 25000,
        connectTimeout: 45000,
        maxHttpBufferSize: parseInt(process.env.WEBSOCKET_MAX_PAYLOAD) || 1e6,
      });

      const notificationService = new NotificationService();
      notificationService.initSocket(io);
      setNotificationService(notificationService);
      setSocketIO(io);

      noticeController.setNotificationService(notificationService);
      eventController.setNotificationService(notificationService);

      logger.info("✅ Socket.io initialized and ready");
      logger.info("✅ NotificationService wired into controllers");

      io.use((socket, next) => {
        try {
          const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.split(" ")[1];

          if (!token) {
            return next(new Error("Authentication required"));
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
          socket.userRole = decoded.role;
          socket.userEmail = decoded.email;
          next();
        } catch (err) {
          logger.error(`Socket auth error: ${err.message}`);
          next(new Error("Invalid token"));
        }
      });

      io.on("connection", (socket) => {
        logger.info(
          `🔌 Socket connected: ${socket.id} (user: ${socket.userId})`,
        );

        if (socket.userId) {
          socket.join(`user-${socket.userId}`);
        }

        if (
          socket.userRole === "admin" ||
          socket.userRole === "super_admin" ||
          socket.userRole === "faculty"
        ) {
          socket.join("admin-room");
        }

        socket.on("ping", (callback) => {
          if (typeof callback === "function")
            callback({ pong: true, timestamp: Date.now() });
        });

        socket.on("subscribe:event", (eventId) => {
          if (eventId) socket.join(`event-${eventId}`);
        });

        socket.on("unsubscribe:event", (eventId) => {
          if (eventId) socket.leave(`event-${eventId}`);
        });

        socket.on("disconnect", (reason) => {
          logger.info(
            `🔌 Socket disconnected: ${socket.id}, reason: ${reason}`,
          );
        });
      });
    }

    if (process.env.BACKUP_ENABLED === "true") {
      try {
        const { BackupService } = require("./services/backupService");
        backupService = new BackupService();
        await backupService.initialize();
        logger.info("✅ Backup service initialized");
      } catch (error) {
        logger.error(`Failed to initialize Backup service: ${error.message}`);
      }
    }

    if (process.env.SMS_ENABLED === "true") {
      try {
        const { initializeSMSService } = require("./services/smsService");
        smsService = await initializeSMSService();
        logger.info("✅ SMS service initialized");
      } catch (error) {
        logger.error(`Failed to initialize SMS service: ${error.message}`);
      }
    }

    try {
      const groqConfig = require("./config/groq");
      groqClient = groqConfig.client;
      logger.info("✅ Groq AI client initialized");
    } catch (error) {
      logger.warn("⚠️  Groq AI client not available:", error.message);
    }
  } catch (error) {
    logger.error(`Failed to initialize services: ${error.message}`);
  }
};

// START SERVER FIRST - This is the critical fix for Render
(async () => {
  await createDirectories();

  // Start server immediately - before database connection
  server.listen(PORT, "0.0.0.0", () => {
    logger.info("=".repeat(50));
    logger.info(
      `🚀 ${process.env.APP_NAME || "KAAF Noticeboard"} v${process.env.APP_VERSION || "2.2.0"}`,
    );
    logger.info(`🌍 Server running on http://0.0.0.0:${PORT}`);
    logger.info(`📧 Email: ${transporter ? "CONFIGURED" : "NOT CONFIGURED"}`);
    logger.info(
      `🌐 Frontend: ${process.env.FRONTEND_URL || "http://localhost:5173"}`,
    );
    logger.info(`🔌 Socket.IO: ${io ? "ENABLED" : "DISABLED"}`);
    logger.info(`💾 Cache: ${cacheManager ? "ENABLED" : "DISABLED"}`);
    logger.info(`🤖 Groq AI: ${groqClient ? "ENABLED" : "DISABLED"}`);
    logger.info(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
    logger.info(
      `⏱️  Rate Limiting: ${DISABLE_RATE_LIMIT ? "DISABLED" : "ENABLED"}`,
    );
    logger.info(`📊 Sentry: ${isSentryEnabled ? "ENABLED" : "DISABLED"}`);
    logger.info(`💾 Backup: ${backupService ? "ENABLED" : "DISABLED"}`);
    logger.info(`📈 Monitor: ${performanceMonitor ? "ENABLED" : "DISABLED"}`);
    logger.info(`📱 SMS: ${smsService ? "ENABLED" : "DISABLED"}`);
    logger.info(`🖥️  Host: ${os.hostname()} (PID: ${process.pid})`);
    logger.info("=".repeat(50));
  });

  // Connect to database in background - doesn't block server startup
  connectDB()
    .then(() => {
      logger.info("✅ MongoDB connected successfully after server startup");
      initializeAllServices();
    })
    .catch((err) => {
      logger.error(`❌ MongoDB connection failed: ${err.message}`);
      logger.error("⚠️  Server is running but database connection failed!");
      if (isSentryEnabled && Sentry) {
        Sentry.captureException(err, {
          tags: { feature: "database-connection" },
        });
      }
    });
})();

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  sendMail,
  app,
  server,
  io,
  cacheManager,
  backupService,
  performanceMonitor,
  smsService,
  groqClient,
  databaseUtils,
  systemUtils,
};
