// backend/routes/health.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const os = require("os");

/**
 * Basic health check endpoint
 * GET /api/health
 */
router.get("/health", (req, res) => {
  const healthCheck = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    service: "kaaf-university-noticeboard",
    version: process.env.npm_package_version || "1.0.0",
  };

  res.status(200).json(healthCheck);
});

/**
 * Detailed health check with database and system info
 * GET /api/health/detailed
 */
router.get("/health/detailed", async (req, res) => {
  const startTime = Date.now();

  // Check database connection
  let dbStatus = "disconnected";
  let dbDetails = {};

  try {
    if (mongoose.connection.readyState === 1) {
      dbStatus = "connected";
      dbDetails = {
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        readyState: mongoose.connection.readyState,
        models: Object.keys(mongoose.models).length,
      };
    } else if (mongoose.connection.readyState === 2) {
      dbStatus = "connecting";
    } else if (mongoose.connection.readyState === 3) {
      dbStatus = "disconnecting";
    } else {
      dbStatus = "disconnected";
    }
  } catch (error) {
    dbStatus = "error";
    dbDetails = { error: error.message };
  }

  // System information
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    usedMemory: `${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB`,
    memoryUsagePercent: `${((1 - os.freemem() / os.totalmem()) * 100).toFixed(2)}%`,
    loadAverage: os.loadavg(),
    uptime: `${(os.uptime() / 60 / 60 / 24).toFixed(2)} days`,
    hostname: os.hostname(),
  };

  // Process information
  const processInfo = {
    pid: process.pid,
    title: process.title,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
    env: process.env.NODE_ENV || "development",
  };

  const responseTime = Date.now() - startTime;

  const detailedHealth = {
    status: dbStatus === "connected" ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    database: {
      status: dbStatus,
      details: dbDetails,
    },
    system: systemInfo,
    process: processInfo,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  };

  // Return 503 if database is not connected
  const statusCode = dbStatus === "connected" ? 200 : 503;
  res.status(statusCode).json(detailedHealth);
});

/**
 * Readiness probe for orchestration (Kubernetes, Docker, etc.)
 * GET /api/health/ready
 */
router.get("/health/ready", async (req, res) => {
  const checks = {
    database: false,
    server: true,
  };

  // Check database
  if (mongoose.connection.readyState === 1) {
    checks.database = true;
  }

  // Check if all required services are ready
  const isReady = Object.values(checks).every((check) => check === true);

  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    checks: checks,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Liveness probe for orchestration
 * GET /api/health/live
 */
router.get("/health/live", (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Metrics endpoint for monitoring systems
 * GET /api/health/metrics
 */
router.get("/health/metrics", (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    system: {
      cpu_usage: process.cpuUsage(),
      memory_usage_mb: process.memoryUsage().rss / 1024 / 1024,
      heap_total_mb: process.memoryUsage().heapTotal / 1024 / 1024,
      heap_used_mb: process.memoryUsage().heapUsed / 1024 / 1024,
      external_mb: process.memoryUsage().external / 1024 / 1024,
      uptime_seconds: process.uptime(),
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      connection_state: mongoose.connection.readyState,
      models_count: Object.keys(mongoose.models).length,
    },
    server: {
      node_version: process.version,
      platform: os.platform(),
      environment: process.env.NODE_ENV || "development",
    },
  };

  res.status(200).json(metrics);
});

/**
 * Database health check
 * GET /api/health/database
 */
router.get("/health/database", async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database not connected");
    }

    // Try to ping the database
    await mongoose.connection.db.admin().ping();

    // Get database stats
    const dbStats = await mongoose.connection.db.stats();

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        collections: dbStats.collections,
        objects: dbStats.objects,
        avgObjSize: `${(dbStats.avgObjSize / 1024).toFixed(2)} KB`,
        dataSize: `${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`,
        storageSize: `${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`,
        indexes: dbStats.indexes,
        indexSize: `${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * Dependencies health check
 * GET /api/health/dependencies
 */
router.get("/health/dependencies", async (req, res) => {
  const dependencies = {
    database: {
      status: "unknown",
      latency: null,
      error: null,
    },
    redis: {
      status: "unknown",
      latency: null,
      error: null,
    },
    socketio: {
      status: "unknown",
      error: null,
    },
  };

  // Check database
  const dbStartTime = Date.now();
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      dependencies.database.status = "healthy";
      dependencies.database.latency = `${Date.now() - dbStartTime}ms`;
    } else {
      dependencies.database.status = "disconnected";
    }
  } catch (error) {
    dependencies.database.status = "unhealthy";
    dependencies.database.error = error.message;
  }

  // Check Socket.io if available
  if (req.app.get("io")) {
    dependencies.socketio.status = "healthy";
  } else {
    dependencies.socketio.status = "not_initialized";
  }

  const allHealthy = Object.values(dependencies).every(
    (dep) => dep.status === "healthy",
  );

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    dependencies: dependencies,
  });
});

/**
 * Simple ping endpoint for quick connectivity tests
 * GET /api/ping
 */
router.get("/ping", (req, res) => {
  res.status(200).json({
    pong: true,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
