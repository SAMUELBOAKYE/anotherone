// config/redis.js
// Redis Cache Configuration for KAAF Noticeboard System
// Supports optional Redis — gracefully degrades to no-cache mode if Redis
// is unavailable or disabled via REDIS_ENABLED=false in .env
// @version 2.0.0
// @author Boakye Samuel Yiadom

const logger = require("../utils/logger");

// ============================================================
// REDIS ENABLED CHECK
// Set REDIS_ENABLED=false in .env to skip Redis entirely (e.g. local dev)
// ============================================================

const REDIS_ENABLED = process.env.REDIS_ENABLED === "true"; // CRITICAL: exact match only

// ============================================================
// NO-OP CACHE (used when Redis is disabled or unavailable)
// All methods silently do nothing / return null so the rest of
// your app doesn't need to change.
// ============================================================

const noopCache = {
  isConnected: false,
  enabled: false,

  async get(_key) {
    return null;
  },
  async set(_key, _value, _ttl) {
    return false;
  },
  async del(..._keys) {
    return 0;
  },
  async exists(_key) {
    return false;
  },
  async expire(_key, _seconds) {
    return false;
  },
  async flushPattern(_pattern) {
    return 0;
  },
  async healthCheck() {
    return { status: "disabled", healthy: false, enabled: false };
  },
  async disconnect() {},
};

// ============================================================
// REDIS CACHE CLASS
// ============================================================

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.enabled = true;
    this._errorLogged = false; // prevent log spam

    this.host = process.env.REDIS_HOST || "127.0.0.1";
    this.port = parseInt(process.env.REDIS_PORT) || 6379;
    this.password = process.env.REDIS_PASSWORD || undefined;
    this.db = parseInt(process.env.REDIS_DB) || 0;
    this.keyPrefix = process.env.REDIS_KEY_PREFIX || "kaaf:";
    this.defaultTTL = parseInt(process.env.REDIS_DEFAULT_TTL) || 3600; // 1 hour

    // Support Redis Cluster / Cloud URL
    this.url = process.env.REDIS_URL || null;
  }

  /**
   * Initialize and connect to Redis
   * @returns {Promise<boolean>} true if connected, false if unavailable
   */
  async connect() {
    // Hard gate: skip if not explicitly enabled
    if (!REDIS_ENABLED) {
      logger.info(
        "ℹ️ Redis cache layer disabled (REDIS_ENABLED != true) — using memory cache only",
      );
      return false;
    }

    try {
      let Redis;
      try {
        Redis = require("ioredis");
      } catch (err) {
        logger.warn(
          "⚠️ ioredis package not found. Run: npm install ioredis — Redis cache disabled.",
        );
        return false;
      }

      const options = {
        host: this.host,
        port: this.port,
        db: this.db,
        keyPrefix: this.keyPrefix,
        password: this.password || undefined,

        // ── STOP RETRY STORM ──────────────────────────────────────
        retryStrategy: () => null, // NEVER retry connections
        maxRetriesPerRequest: 0, // Fail commands immediately
        enableOfflineQueue: false, // Don't buffer commands when offline
        autoResubscribe: false,
        autoResendUnfulfilledCommands: false,
        // ─────────────────────────────────────────────────────────

        connectTimeout: 3000,
        lazyConnect: true, // Don't throw on construction — connect manually
      };

      // Use URL if provided (e.g. Redis Cloud / Upstash)
      this.client = this.url
        ? new Redis(this.url, {
            keyPrefix: this.keyPrefix,
            lazyConnect: true,
            retryStrategy: () => null,
            maxRetriesPerRequest: 0,
            enableOfflineQueue: false,
          })
        : new Redis(options);

      // Attach event listeners BEFORE connect
      this.client.on("error", (err) => {
        // Only log once to avoid spam
        if (!this._errorLogged) {
          logger.warn(`⚠️ Redis error: ${err.message}`);
          this._errorLogged = true;
        }
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        this.isConnected = true;
        this._errorLogged = false;
        logger.info(`✅ Redis connected: ${this.host}:${this.port}`);
      });

      this.client.on("ready", () => {
        logger.info("📡 Redis ready and accepting commands");
      });

      this.client.on("close", () => {
        this.isConnected = false;
        logger.warn("⚠️ Redis connection closed");
      });

      this.client.on("end", () => {
        this.isConnected = false;
        logger.warn("⚠️ Redis connection ended (no more retries)");
      });

      // Attempt the actual connection with a timeout
      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Redis connect timeout (3s)")),
            3000,
          ),
        ),
      ]);

      this.isConnected = true;
      logger.info(
        `🗄️ Redis cache active (DB: ${this.db}, prefix: "${this.keyPrefix}")`,
      );
      return true;
    } catch (err) {
      this.isConnected = false;
      logger.warn(
        `⚠️ Redis unavailable: ${err.message} — running without cache.`,
      );
      this._killClient();
      return false;
    }
  }

  /**
   * Forcefully kill a dead Redis client - removes all listeners and disconnects
   * @private
   */
  _killClient() {
    if (this.client) {
      // Remove all listeners to prevent memory leaks
      this.client.removeAllListeners();
      // Add a silent error handler as safety net
      this.client.on("error", () => {});
      try {
        this.client.disconnect(false);
      } catch (_) {}
      this.client = null;
    }
    this.isConnected = false;
  }

  /**
   * Get a cached value
   * @param {string} key
   * @returns {Promise<any|null>}
   */
  async get(key) {
    if (!this.client || !this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.debug(`Redis GET error for key "${key}": ${err.message}`);
      return null;
    }
  }

  /**
   * Set a cached value
   * @param {string} key
   * @param {any} value
   * @param {number} [ttl] - seconds (defaults to REDIS_DEFAULT_TTL)
   * @returns {Promise<boolean>}
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.client || !this.isConnected) return false;
    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (err) {
      logger.debug(`Redis SET error for key "${key}": ${err.message}`);
      return false;
    }
  }

  /**
   * Delete one or more keys
   * @param {...string} keys
   * @returns {Promise<number>} number of keys deleted
   */
  async del(...keys) {
    if (!this.client || !this.isConnected) return 0;
    try {
      return await this.client.del(...keys);
    } catch (err) {
      logger.debug(`Redis DEL error: ${err.message}`);
      return 0;
    }
  }

  /**
   * Check if a key exists
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    if (!this.client || !this.isConnected) return false;
    try {
      return (await this.client.exists(key)) === 1;
    } catch (err) {
      logger.debug(`Redis EXISTS error: ${err.message}`);
      return false;
    }
  }

  /**
   * Set expiry on an existing key
   * @param {string} key
   * @param {number} seconds
   * @returns {Promise<boolean>}
   */
  async expire(key, seconds) {
    if (!this.client || !this.isConnected) return false;
    try {
      return (await this.client.expire(key, seconds)) === 1;
    } catch (err) {
      logger.debug(`Redis EXPIRE error: ${err.message}`);
      return false;
    }
  }

  /**
   * Delete all keys matching a glob pattern (e.g. "users:*")
   * Note: uses SCAN to avoid blocking the server
   * @param {string} pattern - glob pattern (without the key prefix)
   * @returns {Promise<number>} number of keys deleted
   */
  async flushPattern(pattern) {
    if (!this.client || !this.isConnected) return 0;
    try {
      let cursor = "0";
      let deleted = 0;
      const fullPattern = `${this.keyPrefix}${pattern}`;
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          "MATCH",
          fullPattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          // Strip prefix before calling del (ioredis re-adds it)
          const stripped = keys.map((k) => k.replace(this.keyPrefix, ""));
          deleted += await this.client.del(...stripped);
        }
      } while (cursor !== "0");
      return deleted;
    } catch (err) {
      logger.debug(`Redis flushPattern error: ${err.message}`);
      return 0;
    }
  }

  /**
   * Health check
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    if (!this.client || !this.isConnected) {
      return { status: "disconnected", healthy: false, enabled: this.enabled };
    }
    try {
      const pong = await this.client.ping();
      const info = await this.client.info("server");
      const versionLine = info
        .split("\n")
        .find((l) => l.startsWith("redis_version"));
      const version = versionLine
        ? versionLine.split(":")[1].trim()
        : "unknown";
      return {
        status: "connected",
        healthy: pong === "PONG",
        enabled: this.enabled,
        host: this.host,
        port: this.port,
        db: this.db,
        version,
      };
    } catch (err) {
      return { status: "error", healthy: false, error: err.message };
    }
  }

  /**
   * Disconnect from Redis gracefully
   */
  async disconnect() {
    if (this.client) {
      this.client.removeAllListeners();
      this.client.on("error", () => {});
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info("✅ Redis disconnected gracefully");
      } catch (err) {
        logger.debug(`Redis disconnect error: ${err.message}`);
        try {
          this.client.disconnect(false);
        } catch (_) {}
      } finally {
        this.client = null;
        this.isConnected = false;
      }
    }
  }
}

// ============================================================
// SINGLETON SETUP
// Returns a real RedisCache if REDIS_ENABLED=true, otherwise noopCache
// ============================================================

let cache = null;
let connectionPromise = null;

/**
 * Initialize the cache layer.
 * Call this once during app startup (e.g. in server.js).
 * Safe to call even if Redis is down — falls back to no-op silently.
 * @returns {Promise<Object>} cache instance
 */
async function initCache() {
  // If already initialized, return existing cache
  if (cache !== null) {
    return cache;
  }

  // Prevent multiple simultaneous initialization attempts
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    if (!REDIS_ENABLED) {
      logger.info(
        "ℹ️ Redis cache DISABLED via REDIS_ENABLED=false — using memory cache only",
      );
      cache = noopCache;
      return cache;
    }

    logger.info("🔌 Attempting to connect to Redis...");
    const instance = new RedisCache();
    const connected = await instance.connect();

    // If connection failed, silently fall back to no-op so the app keeps running
    if (!connected) {
      logger.warn(
        "⚠️ Redis connection failed — falling back to memory cache only",
      );
      cache = { ...noopCache, enabled: false };
    } else {
      cache = instance;
    }

    return cache;
  })();

  const result = await connectionPromise;
  connectionPromise = null;
  return result;
}

/**
 * Get the cache instance (after initCache() has been called).
 * @returns {Object} cache instance
 */
function getCache() {
  if (!cache) {
    // initCache not called yet — return noop so nothing breaks
    return noopCache;
  }
  return cache;
}

/**
 * Check if Redis is enabled (based on config, not connection status)
 * @returns {boolean}
 */
function isRedisEnabled() {
  return REDIS_ENABLED;
}

/**
 * Reset cache instance (useful for testing)
 * @private
 */
function resetCache() {
  if (cache && cache !== noopCache && cache.disconnect) {
    cache.disconnect().catch(() => {});
  }
  cache = null;
  connectionPromise = null;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  initCache,
  getCache,
  RedisCache,
  noopCache,
  isRedisEnabled,
  resetCache, // for testing only
};
