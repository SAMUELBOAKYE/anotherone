// utils/cacheManager.js
// Enterprise-Grade Cache Management System with Multi-Tier Support
// Provides intelligent caching, invalidation, monitoring, and optimization

const NodeCache = require("node-cache");
const crypto = require("crypto");
const logger = require("./logger");

// ============================================================
// CONFIGURATION
// ============================================================

const CACHE_CONFIG = {
  // Default TTLs (seconds)
  ttl: {
    short: parseInt(process.env.CACHE_TTL_SHORT) || 60,
    medium: parseInt(process.env.CACHE_TTL_MEDIUM) || 300,
    long: parseInt(process.env.CACHE_TTL_LONG) || 3600,
    day: parseInt(process.env.CACHE_TTL_DAY) || 86400,
    week: parseInt(process.env.CACHE_TTL_WEEK) || 604800,
    month: parseInt(process.env.CACHE_TTL_MONTH) || 2592000,
  },

  // Cache limits
  limits: {
    maxKeys: parseInt(process.env.CACHE_MAX_KEYS) || 10000,
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 512,
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600,
  },

  // Cache namespaces
  namespaces: {
    USER: "user",
    SESSION: "session",
    NOTICE: "notice",
    EVENT: "event",
    API: "api",
    CONFIG: "config",
    STATIC: "static",
    QUERY: "query",
    TEMPLATE: "template",
    RATE_LIMIT: "rate_limit",
  },

  // Redis configuration - ONLY enabled when explicitly "true"
  redis: {
    enabled: process.env.REDIS_ENABLED === "true", // CRITICAL: exact match
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || "kaaf:cache:",
  },

  warmup: {
    enabled: process.env.CACHE_WARMUP_ENABLED !== "false",
    batchSize: parseInt(process.env.CACHE_WARMUP_BATCH_SIZE) || 100,
    interval: parseInt(process.env.CACHE_WARMUP_INTERVAL) || 3600,
  },

  monitoring: {
    enabled: process.env.CACHE_MONITORING_ENABLED !== "false",
    hitRateThreshold: parseInt(process.env.CACHE_HIT_RATE_THRESHOLD) || 70,
    alertOnMissSpike: process.env.CACHE_ALERT_ON_MISS_SPIKE !== "false",
  },

  compression: {
    enabled: process.env.CACHE_COMPRESSION_ENABLED === "true",
    threshold: parseInt(process.env.CACHE_COMPRESSION_THRESHOLD) || 1024,
    algorithm: "gzip",
  },
};

// ============================================================
// CACHE MANAGER CLASS
// ============================================================

class CacheManager {
  constructor(config = CACHE_CONFIG) {
    this.config = config;
    this.caches = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitsByNamespace: new Map(),
      missesByNamespace: new Map(),
      startTime: Date.now(),
    };

    this.redisClient = null;
    this.initialized = false;
    this._redisErrorLogged = false;

    this.initializeCaches();
  }

  initializeCaches() {
    for (const [name, namespace] of Object.entries(this.config.namespaces)) {
      const cache = new NodeCache({
        stdTTL: this.getDefaultTTL(namespace),
        checkperiod: this.config.limits.checkPeriod,
        maxKeys: this.config.limits.maxKeys,
        useClones: false,
        deleteOnExpire: true,
      });

      this.caches.set(namespace, cache);
      this.stats.hitsByNamespace.set(namespace, 0);
      this.stats.missesByNamespace.set(namespace, 0);
    }

    logger.info(
      `✅ Cache manager initialized with ${this.caches.size} namespaces`,
    );
  }

  async initializeRedis() {
    // CRITICAL FIX: Hard stop if not explicitly enabled
    if (this.config.redis.enabled !== true) {
      logger.info(
        "ℹ️ Redis cache layer disabled (REDIS_ENABLED != true) — using memory cache only",
      );
      return;
    }

    try {
      const Redis = require("ioredis");

      this.redisClient = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password || undefined,
        db: this.config.redis.db,
        keyPrefix: this.config.redis.keyPrefix,

        // ── NO RETRIES - FAIL FAST ──────────────────────────
        retryStrategy: () => null, // NEVER retry
        maxRetriesPerRequest: 0, // Fail commands immediately
        enableOfflineQueue: false, // Don't buffer commands
        autoResubscribe: false,
        autoResendUnfulfilledCommands: false,
        // ────────────────────────────────────────────────────

        connectTimeout: 3000,
        lazyConnect: true,
      });

      // Error handler - log once and silence
      this.redisClient.on("error", (err) => {
        if (!this._redisErrorLogged) {
          logger.warn(
            `⚠️ Redis cache error: ${err.message} — using memory cache only.`,
          );
          this._redisErrorLogged = true;
        }
        this.initialized = false;
      });

      this.redisClient.on("connect", () => {
        this._redisErrorLogged = false;
        logger.info("✅ Redis cache connected");
      });

      this.redisClient.on("ready", () => {
        this.initialized = true;
        logger.info("📡 Redis cache ready");
      });

      this.redisClient.on("close", () => {
        this.initialized = false;
      });

      this.redisClient.on("end", () => {
        this.initialized = false;
        logger.warn("⚠️ Redis cache connection ended");
      });

      // Connect with timeout race
      await Promise.race([
        this.redisClient.connect(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Redis connect timeout (3s)")),
            3000,
          ),
        ),
      ]);

      this.initialized = true;
      logger.info(
        `✅ Redis cache active (${this.config.redis.host}:${this.config.redis.port})`,
      );
    } catch (err) {
      logger.warn(
        `⚠️ Redis cache unavailable: ${err.message} — using memory cache only.`,
      );
      this._killRedisClient();
    }
  }

  _killRedisClient() {
    if (this.redisClient) {
      this.redisClient.removeAllListeners();
      this.redisClient.on("error", () => {});
      try {
        this.redisClient.disconnect(false);
      } catch (_) {}
      this.redisClient = null;
    }
    this.initialized = false;
  }

  getDefaultTTL(namespace) {
    const ttlMap = {
      [this.config.namespaces.SESSION]: this.config.ttl.short,
      [this.config.namespaces.API]: this.config.ttl.medium,
      [this.config.namespaces.NOTICE]: this.config.ttl.long,
      [this.config.namespaces.EVENT]: this.config.ttl.long,
      [this.config.namespaces.USER]: this.config.ttl.medium,
      [this.config.namespaces.CONFIG]: this.config.ttl.day,
      [this.config.namespaces.STATIC]: this.config.ttl.week,
      [this.config.namespaces.QUERY]: this.config.ttl.short,
      [this.config.namespaces.TEMPLATE]: this.config.ttl.long,
      [this.config.namespaces.RATE_LIMIT]: this.config.ttl.short,
    };
    return ttlMap[namespace] || this.config.ttl.medium;
  }

  generateKey(namespace, key) {
    const keyString =
      typeof key === "object" ? JSON.stringify(key) : String(key);
    const hash = crypto.createHash("md5").update(keyString).digest("hex");
    return `${namespace}:${hash}`;
  }

  async get(namespace, key, fetchFn = null, options = {}) {
    const cache = this.caches.get(namespace);
    if (!cache) {
      logger.warn(`Unknown cache namespace: ${namespace}`);
      return null;
    }

    const cacheKey = this.generateKey(namespace, key);
    let value = cache.get(cacheKey);

    if (value !== undefined) {
      this.stats.hits++;
      this.stats.hitsByNamespace.set(
        namespace,
        (this.stats.hitsByNamespace.get(namespace) || 0) + 1,
      );
      this.updateMetrics(namespace, "hit");
      return value;
    }

    if (this.redisClient && this.initialized) {
      try {
        const redisValue = await this.redisClient.get(cacheKey);
        if (redisValue) {
          value = JSON.parse(redisValue);
          const ttl = options.ttl || this.getDefaultTTL(namespace);
          cache.set(cacheKey, value, ttl);
          this.stats.hits++;
          return value;
        }
      } catch (err) {
        logger.debug(`Redis get error: ${err.message}`);
      }
    }

    this.stats.misses++;
    this.stats.missesByNamespace.set(
      namespace,
      (this.stats.missesByNamespace.get(namespace) || 0) + 1,
    );
    this.updateMetrics(namespace, "miss");

    if (fetchFn && typeof fetchFn === "function") {
      try {
        value = await fetchFn();
        if (value !== null && value !== undefined) {
          await this.set(namespace, key, value, options);
        }
        return value;
      } catch (err) {
        logger.error(
          `Cache fetch error for ${namespace}:${key} - ${err.message}`,
        );
        return null;
      }
    }

    return null;
  }

  async set(namespace, key, value, options = {}) {
    const cache = this.caches.get(namespace);
    if (!cache) {
      logger.warn(`Unknown cache namespace: ${namespace}`);
      return false;
    }

    const cacheKey = this.generateKey(namespace, key);
    const ttl = options.ttl || this.getDefaultTTL(namespace);

    let finalValue = value;
    if (
      this.config.compression.enabled &&
      JSON.stringify(value).length > this.config.compression.threshold
    ) {
      finalValue = await this.compress(value);
    }

    const success = cache.set(cacheKey, finalValue, ttl);

    if (success && this.redisClient && this.initialized) {
      try {
        await this.redisClient.setex(cacheKey, ttl, JSON.stringify(finalValue));
      } catch (err) {
        logger.debug(`Redis set error: ${err.message}`);
      }
    }

    if (success) {
      this.stats.sets++;
      logger.debug(`Cache set: ${namespace}:${key} (TTL: ${ttl}s)`);
    }

    return success;
  }

  async delete(namespace, key) {
    const cache = this.caches.get(namespace);
    if (!cache) return false;

    const cacheKey = this.generateKey(namespace, key);
    const deleted = cache.del(cacheKey);

    if (this.redisClient && this.initialized) {
      try {
        await this.redisClient.del(cacheKey);
      } catch (_) {}
    }

    if (deleted > 0) {
      this.stats.deletes++;
      logger.debug(`Cache delete: ${namespace}:${key}`);
    }

    return deleted > 0;
  }

  async deletePattern(namespace, pattern) {
    const cache = this.caches.get(namespace);
    if (!cache) return 0;

    const matchingKeys = cache.keys().filter((key) => key.includes(pattern));
    let deletedCount = 0;

    for (const key of matchingKeys) {
      if (cache.del(key) > 0) deletedCount++;
      if (this.redisClient && this.initialized) {
        try {
          await this.redisClient.del(key);
        } catch (_) {}
      }
    }

    this.stats.deletes += deletedCount;
    logger.debug(
      `Cache delete pattern: ${namespace}:${pattern} - ${deletedCount} keys deleted`,
    );
    return deletedCount;
  }

  async clearNamespace(namespace) {
    const cache = this.caches.get(namespace);
    if (!cache) return false;

    const keys = cache.keys();
    const deletedCount = keys.length;
    cache.flushAll();

    if (this.redisClient && this.initialized) {
      try {
        const pattern = `${this.config.redis.keyPrefix}${namespace}:*`;
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) await this.redisClient.del(...keys);
      } catch (_) {}
    }

    this.stats.deletes += deletedCount;
    logger.info(`Cache namespace cleared: ${namespace} (${deletedCount} keys)`);
    return true;
  }

  async clearAll() {
    for (const cache of this.caches.values()) cache.flushAll();

    if (this.redisClient && this.initialized) {
      try {
        const pattern = `${this.config.redis.keyPrefix}*`;
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) await this.redisClient.del(...keys);
      } catch (_) {}
    }

    this.stats.deletes += this.stats.sets;
    logger.info("All caches cleared");
    return true;
  }

  async remember(namespace, key, fetchFn, options = {}) {
    let value = await this.get(namespace, key, null, options);
    if (value === null || value === undefined) {
      value = await fetchFn();
      if (value !== null && value !== undefined) {
        await this.set(namespace, key, value, options);
      }
    }
    return value;
  }

  has(namespace, key) {
    const cache = this.caches.get(namespace);
    if (!cache) return false;
    return cache.has(this.generateKey(namespace, key));
  }

  getTtl(namespace, key) {
    const cache = this.caches.get(namespace);
    if (!cache) return -1;
    return cache.getTtl(this.generateKey(namespace, key));
  }

  getKeys(namespace, pattern = "") {
    const cache = this.caches.get(namespace);
    if (!cache) return [];
    const keys = cache.keys();
    return pattern ? keys.filter((k) => k.includes(pattern)) : keys;
  }

  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate =
      totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    const namespaceStats = [];
    for (const [namespace, cache] of this.caches) {
      const hits = this.stats.hitsByNamespace.get(namespace) || 0;
      const misses = this.stats.missesByNamespace.get(namespace) || 0;
      const total = hits + misses;
      namespaceStats.push({
        namespace,
        keys: cache.keys().length,
        hits,
        misses,
        hitRate: total > 0 ? (hits / total) * 100 : 0,
        ttl: this.getDefaultTTL(namespace),
      });
    }

    return {
      uptime: Math.floor((Date.now() - this.stats.startTime) / 1000),
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      totalSets: this.stats.sets,
      totalDeletes: this.stats.deletes,
      overallHitRate: hitRate.toFixed(2),
      namespaces: namespaceStats,
      redisEnabled: this.redisClient !== null && this.initialized,
      compressionEnabled: this.config.compression.enabled,
    };
  }

  updateMetrics(namespace, type) {
    if (!this.config.monitoring.enabled) return;

    const hits = this.stats.hitsByNamespace.get(namespace) || 0;
    const misses = this.stats.missesByNamespace.get(namespace) || 0;
    const total = hits + misses;

    if (total > 0 && total % 100 === 0) {
      const hitRate = (hits / total) * 100;
      if (hitRate < this.config.monitoring.hitRateThreshold) {
        logger.warn(
          `Low cache hit rate for ${namespace}: ${hitRate.toFixed(2)}%`,
        );
      }
    }
  }

  async warmup(namespace, items, keyGenerator, options = {}) {
    if (!this.config.warmup.enabled) return 0;

    let warmed = 0;
    const batchSize = this.config.warmup.batchSize;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (item) => {
          await this.set(namespace, keyGenerator(item), item, options);
          warmed++;
        }),
      );
    }

    logger.info(`Cache warmup completed: ${namespace} - ${warmed} items`);
    return warmed;
  }

  async compress(data) {
    try {
      const zlib = require("zlib");
      const buffer = Buffer.from(JSON.stringify(data));
      return new Promise((resolve, reject) => {
        zlib.gzip(buffer, { level: 9 }, (err, compressed) => {
          if (err) reject(err);
          else resolve(compressed.toString("base64"));
        });
      });
    } catch (err) {
      logger.error(`Compression error: ${err.message}`);
      return data;
    }
  }

  async decompress(compressed) {
    try {
      const zlib = require("zlib");
      const buffer = Buffer.from(compressed, "base64");
      return new Promise((resolve, reject) => {
        zlib.gunzip(buffer, (err, decompressed) => {
          if (err) reject(err);
          else resolve(JSON.parse(decompressed.toString()));
        });
      });
    } catch (err) {
      logger.error(`Decompression error: ${err.message}`);
      return compressed;
    }
  }

  async shutdown() {
    logger.info("Shutting down cache manager...");
    if (this.redisClient) {
      this.redisClient.removeAllListeners();
      this.redisClient.on("error", () => {});
      try {
        await this.redisClient.quit();
      } catch {
        this.redisClient.disconnect(false);
      }
      this.redisClient = null;
      this.initialized = false;
    }
    for (const cache of this.caches.values()) {
      cache.flushAll();
      cache.close();
    }
    logger.info("✅ Cache manager shutdown complete");
  }
}

// ============================================================
// CACHE MIDDLEWARE
// ============================================================

const cacheMiddleware = (options = {}) => {
  const namespace = options.namespace || CACHE_CONFIG.namespaces.API;
  const ttl = options.ttl || CACHE_CONFIG.ttl.medium;

  return async (req, res, next) => {
    if (req.method !== "GET") return next();
    if (options.skipAuth && req.user) return next();

    const cm = global.cacheManager;
    if (!cm) return next();

    const cacheKey = {
      url: req.originalUrl,
      query: req.query,
      userRole: req.user?.role || "public",
    };
    const cached = await cm.get(namespace, cacheKey);

    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("X-Cache-TTL", ttl);
      return res.json(cached);
    }

    const originalJson = res.json;
    res.json = function (data) {
      cm.set(namespace, cacheKey, data, { ttl });
      res.setHeader("X-Cache", "MISS");
      originalJson.call(this, data);
    };

    next();
  };
};

// ============================================================
// SINGLETON
// ============================================================

let instance = null;

const getCacheManager = async () => {
  if (!instance) {
    instance = new CacheManager();
    await instance.initializeRedis();
    global.cacheManager = instance;
  }
  return instance;
};

// ============================================================
// CONVENIENCE HELPERS
// ============================================================

const clearCachePattern = async (namespace, pattern) => {
  const cm = await getCacheManager();
  return cm.deletePattern(namespace, pattern);
};

const invalidateUserCache = async (userId) => {
  const cm = await getCacheManager();
  await cm.deletePattern(CACHE_CONFIG.namespaces.USER, userId);
  await cm.deletePattern(CACHE_CONFIG.namespaces.SESSION, userId);
};

const invalidateNoticeCache = async (noticeId) => {
  const cm = await getCacheManager();
  await cm.deletePattern(CACHE_CONFIG.namespaces.NOTICE, noticeId);
  await cm.deletePattern(CACHE_CONFIG.namespaces.QUERY, "notices");
};

const invalidateEventCache = async (eventId) => {
  const cm = await getCacheManager();
  await cm.deletePattern(CACHE_CONFIG.namespaces.EVENT, eventId);
  await cm.deletePattern(CACHE_CONFIG.namespaces.QUERY, "events");
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getCacheManager,
  CacheManager,
  clearCachePattern,
  invalidateUserCache,
  invalidateNoticeCache,
  invalidateEventCache,
  cacheMiddleware,
  CACHE_CONFIG,

  async get(namespace, key, fetchFn, options) {
    return (await getCacheManager()).get(namespace, key, fetchFn, options);
  },
  async set(namespace, key, value, options) {
    return (await getCacheManager()).set(namespace, key, value, options);
  },
  async delete(namespace, key) {
    return (await getCacheManager()).delete(namespace, key);
  },
  async remember(namespace, key, fetchFn, options) {
    return (await getCacheManager()).remember(namespace, key, fetchFn, options);
  },
  async clearNamespace(namespace) {
    return (await getCacheManager()).clearNamespace(namespace);
  },
  async clearAll() {
    return (await getCacheManager()).clearAll();
  },
  getStats() {
    return instance ? instance.getStats() : null;
  },
};
