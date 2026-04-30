// config/db.js
// PROFESSIONAL DATABASE CONNECTION CONFIGURATION
// @version 3.0.2 - FIXED MONGOOSE SET OPTIONS

const mongoose = require("mongoose");
const logger = require("../utils/logger");
const {
  USER_ROLES,
  USER_STATUS,
  NOTICE_CATEGORIES,
  NOTICE_PRIORITY,
  NOTICE_STATUS,
  EVENT_TYPES,
  EVENT_STATUS,
  REGISTRATION_STATUS,
  DEPARTMENTS,
  VALIDATION,
} = require("./constants");

// ============================================================
// DATABASE CONNECTION CLASS
// ============================================================

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.isConnecting = false;
    this.retryCount = 0;
    this.maxRetries = parseInt(process.env.MONGODB_RETRY_COUNT) || 3;
    this.retryDelay = parseInt(process.env.MONGODB_RETRY_DELAY) || 5000;
    this.connectionPromise = null;
    this.reconnectTimer = null;
    this.healthCheckTimer = null;
  }

  /**
   * Get optimized MongoDB connection options
   * NOTE: maxTimeMS and batchSize are QUERY options, NOT connection options
   * @returns {Object} MongoDB connection options
   */
  getConnectionOptions() {
    const isProduction = process.env.NODE_ENV === "production";

    return {
      // ============================================================
      // CONNECTION POOL SETTINGS
      // ============================================================
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 30000,

      // ============================================================
      // TIMEOUT SETTINGS
      // ============================================================
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS) || 45000,
      connectTimeoutMS:
        parseInt(process.env.MONGODB_CONNECTION_TIMEOUT_MS) || 30000,
      serverSelectionTimeoutMS:
        parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 30000,

      // ============================================================
      // KEEP-ALIVE SETTINGS
      // ============================================================
      heartbeatFrequencyMS:
        parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY) || 10000,

      // ============================================================
      // AUTO-RECONNECT SETTINGS
      // ============================================================
      retryWrites: process.env.MONGODB_RETRY_WRITES !== "false",
      retryReads: process.env.MONGODB_RETRY_READS !== "false",

      // ============================================================
      // WRITE CONCERN
      // ============================================================
      w: process.env.MONGODB_W_MAJORITY === "true" ? "majority" : 1,
      journal: process.env.MONGODB_JOURNAL !== "false",
      wtimeoutMS: parseInt(process.env.MONGODB_WRITE_TIMEOUT) || 5000,

      // ============================================================
      // READ PREFERENCE
      // ============================================================
      readPreference: process.env.MONGODB_READ_PREFERENCE || "primaryPreferred",
      readConcern: { level: process.env.MONGODB_READ_CONCERN || "local" },

      // ============================================================
      // SSL/TLS CONFIGURATION
      // ============================================================
      ssl: process.env.MONGODB_SSL === "true",
      tls: process.env.MONGODB_SSL === "true",
      tlsAllowInvalidCertificates: !isProduction,
      tlsAllowInvalidHostnames: !isProduction,

      // ============================================================
      // COMPRESSION
      // ============================================================
      compressors: this.getAvailableCompressors(),

      // ============================================================
      // OTHER SETTINGS
      // ============================================================
      autoIndex: process.env.NODE_ENV === "development",
      autoCreate: process.env.NODE_ENV === "development",
      family: 4,
      appName: process.env.APP_NAME || "kaaf-noticeboard-backend",
    };
  }

  /**
   * Get available compression algorithms
   * @returns {Array} List of available compressors
   */
  getAvailableCompressors() {
    const compressors = ["zlib"];

    try {
      require("snappy");
      compressors.push("snappy");
    } catch (error) {
      // Snappy is optional
    }

    return compressors;
  }

  /**
   * Build MongoDB connection URI
   * @returns {string} MongoDB connection URI
   */
  buildConnectionUri() {
    if (process.env.MONGODB_URI) {
      return process.env.MONGODB_URI;
    }

    const {
      MONGODB_HOST = "127.0.0.1",
      MONGODB_PORT = "27017",
      MONGODB_DATABASE = "kaaf_noticeboard",
      MONGODB_USERNAME,
      MONGODB_PASSWORD,
      MONGODB_AUTH_SOURCE = "admin",
      MONGODB_REPLICA_SET,
    } = process.env;

    let uri = "mongodb://";

    if (MONGODB_USERNAME && MONGODB_PASSWORD) {
      uri += `${encodeURIComponent(MONGODB_USERNAME)}:${encodeURIComponent(MONGODB_PASSWORD)}@`;
    }

    if (MONGODB_REPLICA_SET) {
      const hosts = MONGODB_HOST.split(",").map(
        (host) => `${host}:${MONGODB_PORT}`,
      );
      uri += hosts.join(",");
    } else {
      uri += `${MONGODB_HOST}:${MONGODB_PORT}`;
    }

    uri += `/${MONGODB_DATABASE}`;

    const params = new URLSearchParams();

    if (MONGODB_REPLICA_SET) {
      params.append("replicaSet", MONGODB_REPLICA_SET);
    }

    if (MONGODB_AUTH_SOURCE && MONGODB_USERNAME) {
      params.append("authSource", MONGODB_AUTH_SOURCE);
    }

    params.append(
      "retryWrites",
      process.env.MONGODB_RETRY_WRITES !== "false" ? "true" : "false",
    );
    params.append(
      "w",
      process.env.MONGODB_W_MAJORITY === "true" ? "majority" : "1",
    );

    const queryString = params.toString();
    if (queryString) {
      uri += `?${queryString}`;
    }

    return uri;
  }

  /**
   * Setup MongoDB event handlers
   */
  setupEventHandlers() {
    mongoose.connection.on("connected", () => {
      this.isConnected = true;
      this.isConnecting = false;
      this.retryCount = 0;

      logger.info(
        `✅ MongoDB Connected: ${mongoose.connection.host}:${mongoose.connection.port}`,
      );
      logger.info(`📊 Database: ${mongoose.connection.name}`);
      logger.info(
        `👥 Connection Pool Size: ${this.getConnectionOptions().maxPoolSize}`,
      );
      logger.info(`🔐 Environment: ${process.env.NODE_ENV || "development"}`);

      this.startHealthCheck();
    });

    mongoose.connection.on("error", (error) => {
      this.isConnected = false;
      this.isConnecting = false;

      logger.error(`❌ MongoDB Connection Error: ${error.message}`);

      if (error.message.includes("authentication")) {
        logger.error("🔑 Authentication failed. Check MongoDB credentials.");
      } else if (error.message.includes("ECONNREFUSED")) {
        logger.error("🔌 Connection refused. Is MongoDB running?");
      } else if (error.message.includes("ENOTFOUND")) {
        logger.error("🌐 Host not found. Check MONGODB_HOST configuration.");
      } else if (error.message.includes("timed out")) {
        logger.error(
          "⏱️ Connection timed out. Check network/firewall settings.",
        );
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("Database connection error:", error);
      }
    });

    mongoose.connection.on("disconnected", () => {
      this.isConnected = false;
      logger.warn("⚠️ MongoDB Disconnected. Attempting to reconnect...");

      this.stopHealthCheck();
      this.scheduleReconnect();
    });

    mongoose.connection.on("reconnected", () => {
      this.isConnected = true;
      logger.info("🔄 MongoDB Reconnected successfully");

      this.validateDataIntegrity().catch((err) => {
        logger.error(`Post-reconnection validation failed: ${err.message}`);
      });

      this.startHealthCheck();
    });

    mongoose.connection.on("reconnectFailed", () => {
      logger.error("❌ MongoDB Reconnection failed after all attempts");

      if (process.env.NODE_ENV === "production") {
        this.sendAlert("Database connection failed permanently");
      }
    });

    process.on("SIGINT", () => this.gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => this.gracefulShutdown("SIGTERM"));
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(async () => {
      if (!this.isConnected && !this.isConnecting) {
        logger.info("🔄 Attempting to reconnect to MongoDB...");
        try {
          await this.connectWithRetry();
        } catch (error) {
          logger.error(`Reconnection attempt failed: ${error.message}`);
        }
      }
    }, this.retryDelay);
  }

  /**
   * Start periodic health check
   */
  startHealthCheck() {
    this.stopHealthCheck();

    const interval = parseInt(process.env.HEALTH_CHECK_INTERVAL) || 60000;

    this.healthCheckTimer = setInterval(async () => {
      try {
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.db.admin().ping();
          logger.debug("💓 Database health check: OK");
        }
      } catch (error) {
        logger.error(`❌ Database health check failed: ${error.message}`);
      }
    }, interval);
  }

  /**
   * Stop periodic health check
   */
  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Connect to MongoDB with retry logic
   * @returns {Promise} Mongoose connection
   */
  async connectWithRetry() {
    this.isConnecting = true;

    try {
      const uri = this.buildConnectionUri();
      const options = this.getConnectionOptions();

      logger.info(`📋 Connecting to MongoDB...`);
      logger.debug(`   URI: ${uri.replace(/\/\/.*@/, "//****:****@")}`);
      logger.debug(
        `   Options: maxPoolSize=${options.maxPoolSize}, socketTimeoutMS=${options.socketTimeoutMS}`,
      );

      const conn = await mongoose.connect(uri, options);

      // Set default query options globally (only valid options)
      // Note: batchSize cannot be set globally in Mongoose, use per-query .batchSize() instead
      if (process.env.QUERY_MAX_TIME_MS) {
        mongoose.set("maxTimeMS", parseInt(process.env.QUERY_MAX_TIME_MS));
      }

      this.isConnecting = false;
      this.retryCount = 0;

      return conn;
    } catch (error) {
      this.isConnecting = false;
      this.retryCount++;

      if (this.retryCount <= this.maxRetries) {
        const delay = this.retryDelay * this.retryCount;
        logger.warn(
          `🔄 Retry attempt ${this.retryCount}/${this.maxRetries} in ${delay / 1000}s`,
        );
        logger.warn(`   Error: ${error.message}`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.connectWithRetry();
      }

      throw error;
    }
  }

  /**
   * Connect to MongoDB (main entry point)
   * @returns {Promise} Mongoose connection
   */
  async connect() {
    if (this.connectionPromise) {
      logger.debug("Connection already in progress, waiting...");
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        this.setupEventHandlers();
        this.logConfiguration();

        const conn = await this.connectWithRetry();

        logger.info(`📊 MongoDB Connection Established:`);
        logger.info(`   - Host: ${conn.connection.host}`);
        logger.info(`   - Port: ${conn.connection.port}`);
        logger.info(`   - Database: ${conn.connection.name}`);
        logger.info(
          `   - Pool Size: ${this.getConnectionOptions().maxPoolSize}`,
        );
        logger.info(
          `   - Environment: ${process.env.NODE_ENV || "development"}`,
        );

        await this.postConnectionSetup();

        return conn;
      } catch (error) {
        logger.error(`❌ Failed to connect to MongoDB: ${error.message}`);

        if (process.env.NODE_ENV === "production") {
          throw error;
        } else {
          console.error("Database connection failed:", error);
          process.exit(1);
        }
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  /**
   * Log configuration summary
   */
  logConfiguration() {
    logger.info("📋 Application Constants Loaded:");
    logger.info(`   - User Roles: ${Object.values(USER_ROLES).join(", ")}`);
    logger.info(`   - User Statuses: ${Object.values(USER_STATUS).join(", ")}`);
    logger.info(
      `   - Notice Categories: ${Object.values(NOTICE_CATEGORIES).join(", ")}`,
    );
    logger.info(
      `   - Notice Priorities: ${Object.values(NOTICE_PRIORITY).join(", ")}`,
    );
    logger.info(`   - Event Types: ${Object.values(EVENT_TYPES).join(", ")}`);
    logger.info(
      `   - Event Statuses: ${Object.values(EVENT_STATUS).join(", ")}`,
    );
    logger.info(
      `   - Registration Statuses: ${Object.values(REGISTRATION_STATUS).join(", ")}`,
    );
    logger.info(`   - Departments: ${DEPARTMENTS.length} departments`);
  }

  /**
   * Post-connection setup and validation
   */
  async postConnectionSetup() {
    try {
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      const collectionNames = collections.map((c) => c.name);

      logger.info(
        `📚 Collections found: ${collectionNames.join(", ") || "none"}`,
      );

      const requiredCollections = [
        "users",
        "notices",
        "events",
        "eventregistrations",
      ];
      const missingCollections = requiredCollections.filter(
        (c) => !collectionNames.includes(c),
      );

      if (missingCollections.length > 0) {
        logger.warn(
          `⚠️ Missing required collections: ${missingCollections.join(", ")}`,
        );
      } else {
        logger.info("✅ All required collections verified");
      }

      await mongoose.connection.db.command({ ping: 1 });
      logger.info("✅ Database permissions verified");

      await this.validateDataIntegrity();

      if (process.env.NODE_ENV === "development") {
        await this.showIndexSummary(collections);
      }
    } catch (error) {
      logger.error(`Post-connection setup failed: ${error.message}`);
    }
  }

  /**
   * Show index summary for all collections
   */
  async showIndexSummary(collections) {
    try {
      const indexSummary = [];

      for (const collection of collections) {
        const indexes = await mongoose.connection.db
          .collection(collection.name)
          .indexes();
        indexSummary.push(`${collection.name}(${indexes.length})`);
      }

      logger.info(`🔍 Index summary: ${indexSummary.join(", ")}`);
    } catch (error) {
      logger.error(`Failed to get index summary: ${error.message}`);
    }
  }

  /**
   * Validate data integrity across collections
   */
  async validateDataIntegrity() {
    try {
      await this.validateConstantsAgainstDatabase();
      await this.validateUserDataIntegrity();
      await this.validateNoticeDataIntegrity();
      await this.validateEventDataIntegrity();
      await this.validateRegistrationDataIntegrity();
    } catch (error) {
      logger.error(`Data integrity validation failed: ${error.message}`);
    }
  }

  /**
   * Validate constants against database values
   */
  async validateConstantsAgainstDatabase() {
    try {
      if (mongoose.models.User) {
        const User = mongoose.model("User");
        const rolesInDb = await User.distinct("role");
        const validRoles = Object.values(USER_ROLES);
        const invalidRoles = rolesInDb.filter(
          (role) => !validRoles.includes(role),
        );

        if (invalidRoles.length > 0) {
          logger.warn(
            `⚠️ Found ${invalidRoles.length} invalid user role(s): ${invalidRoles.join(", ")}`,
          );
        } else if (rolesInDb.length > 0) {
          logger.info(`✅ User roles validated: ${rolesInDb.join(", ")}`);
        }
      }

      if (mongoose.models.Event) {
        const Event = mongoose.model("Event");
        const typesInDb = await Event.distinct("eventType");
        const validTypes = Object.values(EVENT_TYPES);
        const invalidTypes = typesInDb.filter(
          (type) => !validTypes.includes(type),
        );

        if (invalidTypes.length > 0) {
          logger.warn(
            `⚠️ Found ${invalidTypes.length} invalid event type(s): ${invalidTypes.join(", ")}`,
          );
        }
      }
    } catch (error) {
      logger.error(`Constants validation failed: ${error.message}`);
    }
  }

  /**
   * Validate user data integrity
   */
  async validateUserDataIntegrity() {
    try {
      if (!mongoose.models.User) return;

      const User = mongoose.model("User");

      const lockedAccounts = await User.find({
        lockUntil: { $lt: new Date(), $ne: null },
        deletedAt: null,
      });

      if (lockedAccounts.length > 0) {
        await User.updateMany(
          { lockUntil: { $lt: new Date() } },
          { $set: { lockUntil: null, loginAttempts: 0 } },
        );
        logger.info(
          `🔓 Auto-unlocked ${lockedAccounts.length} expired account lock(s)`,
        );
      }
    } catch (error) {
      logger.error(`User data validation failed: ${error.message}`);
    }
  }

  /**
   * Validate notice data integrity
   */
  async validateNoticeDataIntegrity() {
    try {
      if (!mongoose.models.Notice) return;

      const Notice = mongoose.model("Notice");

      if (typeof Notice.autoExpireNotices === "function") {
        const expiredCount = await Notice.autoExpireNotices();
        if (expiredCount > 0) {
          logger.info(`📋 Auto-archived ${expiredCount} expired notice(s)`);
        }
      }

      if (typeof Notice.getStatistics === "function") {
        const stats = await Notice.getStatistics();
        logger.info("📊 Notice Statistics:");
        logger.info(`   - Total Notices: ${stats.total || 0}`);
        logger.info(`   - Published: ${stats.published || 0}`);
        logger.info(`   - Drafts: ${stats.drafts || 0}`);
        logger.info(`   - Archived: ${stats.archived || 0}`);
      }
    } catch (error) {
      logger.error(`Notice data validation failed: ${error.message}`);
    }
  }

  /**
   * Validate event data integrity
   */
  async validateEventDataIntegrity() {
    try {
      if (!mongoose.models.Event) return;

      const Event = mongoose.model("Event");

      if (typeof Event.updateEventStatuses === "function") {
        const updates = await Event.updateEventStatuses();
        if (updates.ongoingUpdated > 0 || updates.completedUpdated > 0) {
          logger.info(
            `📅 Updated event statuses: ${updates.ongoingUpdated} ongoing, ${updates.completedUpdated} completed`,
          );
        }
      }

      if (typeof Event.getStatistics === "function") {
        const stats = await Event.getStatistics();
        logger.info("📊 Event Statistics:");
        logger.info(`   - Total Events: ${stats.total || 0}`);
        logger.info(`   - Published: ${stats.published || 0}`);
        logger.info(`   - Upcoming: ${stats.upcoming || 0}`);
        logger.info(`   - Ongoing: ${stats.ongoing || 0}`);
        logger.info(`   - Completed: ${stats.completed || 0}`);
        logger.info(`   - Cancelled: ${stats.cancelled || 0}`);
      }
    } catch (error) {
      logger.error(`Event data validation failed: ${error.message}`);
    }
  }

  /**
   * Validate registration data integrity
   */
  async validateRegistrationDataIntegrity() {
    try {
      if (!mongoose.models.EventRegistration) return;

      const Registration = mongoose.model("EventRegistration");

      const totalRegistrations = await Registration.countDocuments({
        deletedAt: null,
      });
      const checkedInCount = await Registration.countDocuments({
        status: REGISTRATION_STATUS.CHECKED_IN,
        deletedAt: null,
      });
      const cancelledCount = await Registration.countDocuments({
        status: REGISTRATION_STATUS.CANCELLED,
        deletedAt: null,
      });

      logger.info("📊 Registration Statistics:");
      logger.info(`   - Total Registrations: ${totalRegistrations}`);
      logger.info(`   - Checked In: ${checkedInCount}`);
      logger.info(`   - Cancelled: ${cancelledCount}`);
    } catch (error) {
      logger.error(`Registration data validation failed: ${error.message}`);
    }
  }

  /**
   * Send alert for critical issues
   */
  sendAlert(message) {
    logger.error(`🚨 CRITICAL: ${message}`);
  }

  /**
   * Health check for database
   */
  async healthCheck() {
    try {
      const readyState = mongoose.connection.readyState;
      const states = [
        "disconnected",
        "connected",
        "connecting",
        "disconnecting",
      ];

      if (readyState !== 1) {
        return {
          status: states[readyState] || "unknown",
          healthy: false,
          timestamp: new Date().toISOString(),
        };
      }

      await mongoose.connection.db.admin().ping();

      return {
        status: "connected",
        healthy: true,
        timestamp: new Date().toISOString(),
        details: {
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          database: mongoose.connection.name,
        },
      };
    } catch (error) {
      return {
        status: "error",
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    const states = ["disconnected", "connected", "connecting", "disconnecting"];

    return {
      isConnected: this.isConnected,
      readyState: states[mongoose.connection.readyState] || "unknown",
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name,
      retryCount: this.retryCount,
    };
  }

  /**
   * Graceful shutdown handler
   */
  async gracefulShutdown(signal) {
    logger.info(`🛑 Received ${signal}. Closing database connection...`);

    this.stopHealthCheck();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      await mongoose.connection.close(true);
      this.isConnected = false;
      logger.info("✅ Database connection closed gracefully");
    } catch (error) {
      logger.error(`❌ Error during database shutdown: ${error.message}`);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    this.stopHealthCheck();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info("✅ Disconnected from MongoDB");
    } catch (error) {
      logger.error(`❌ Error disconnecting from MongoDB: ${error.message}`);
      throw error;
    }
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

const dbConnection = new DatabaseConnection();

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  connectDB: () => dbConnection.connect(),
  disconnectDB: () => dbConnection.disconnect(),
  healthCheck: () => dbConnection.healthCheck(),
  getConnectionStatus: () => dbConnection.getConnectionStatus(),
  validateDataIntegrity: () => dbConnection.validateDataIntegrity(),
  DatabaseConnection,
};
