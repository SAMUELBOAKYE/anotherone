// utils/databaseUtils.js
// Enterprise-Grade Database Utilities for Backup, Restore, Optimization, and Maintenance
// Provides comprehensive database management with safety features and monitoring

const mongoose = require("mongoose");
const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const moment = require("moment");
const { exec } = require("child_process");
const { promisify } = require("util");
const logger = require("./logger");
const crypto = require("crypto");

const execAsync = promisify(exec);

// ============================================================
// CONFIGURATION
// ============================================================

const DB_CONFIG = {
  // Backup settings
  backup: {
    enabled: process.env.DB_BACKUP_ENABLED !== "false",
    path: process.env.DB_BACKUP_PATH || "./backups/database",
    retention: {
      daily: parseInt(process.env.DB_BACKUP_RETENTION_DAILY) || 7,
      weekly: parseInt(process.env.DB_BACKUP_RETENTION_WEEKLY) || 30,
      monthly: parseInt(process.env.DB_BACKUP_RETENTION_MONTHLY) || 365,
    },
    compression: {
      enabled: process.env.DB_BACKUP_COMPRESSION !== "false",
      level: parseInt(process.env.DB_BACKUP_COMPRESSION_LEVEL) || 9,
    },
    encryption: {
      enabled: process.env.DB_BACKUP_ENCRYPTION === "true",
      algorithm: "aes-256-gcm",
      key: process.env.DB_BACKUP_ENCRYPTION_KEY,
    },
    parallelCollections: parseInt(process.env.DB_BACKUP_PARALLEL) || 3,
  },

  // Restore settings
  restore: {
    safeMode: process.env.DB_RESTORE_SAFE_MODE !== "false",
    createBackupBeforeRestore: process.env.DB_RESTORE_BACKUP_BEFORE !== "false",
    validateData: process.env.DB_RESTORE_VALIDATE !== "false",
    batchSize: parseInt(process.env.DB_RESTORE_BATCH_SIZE) || 1000,
  },

  // Optimization settings
  optimization: {
    enabled: process.env.DB_OPTIMIZE_ENABLED !== "false",
    schedule: process.env.DB_OPTIMIZE_SCHEDULE || "0 3 * * 0", // Weekly on Sunday at 3 AM
    analyze: process.env.DB_ANALYZE_STATS !== "false",
    rebuildIndexes: process.env.DB_REBUILD_INDEXES !== "false",
    compact: process.env.DB_COMPACT_COLLECTIONS !== "false",
  },

  // Validation settings
  validation: {
    enabled: process.env.DB_VALIDATION_ENABLED !== "false",
    checkIndexes: process.env.DB_CHECK_INDEXES !== "false",
    checkDataIntegrity: process.env.DB_CHECK_DATA_INTEGRITY !== "false",
    checkReferentialIntegrity: process.env.DB_CHECK_REFERENTIAL !== "false",
  },

  // Monitoring
  monitoring: {
    enabled: process.env.DB_MONITORING_ENABLED !== "false",
    collectStats: true,
    alertThresholds: {
      size: parseInt(process.env.DB_SIZE_ALERT_THRESHOLD) || 10240, // 10GB
      documentCount:
        parseInt(process.env.DB_DOCUMENT_ALERT_THRESHOLD) || 10000000,
      indexSize: parseInt(process.env.DB_INDEX_SIZE_ALERT_THRESHOLD) || 5120, // 5GB
    },
  },
};

// ============================================================
// DATABASE UTILITIES CLASS
// ============================================================

class DatabaseUtils {
  constructor(config = DB_CONFIG) {
    this.config = config;
    this.db = mongoose.connection.db;
    this.stats = {
      backups: {
        total: 0,
        successful: 0,
        failed: 0,
        totalSize: 0,
      },
      restores: {
        total: 0,
        successful: 0,
        failed: 0,
      },
      optimizations: {
        lastRun: null,
        collectionsOptimized: 0,
        indexesRebuilt: 0,
      },
    };
  }

  /**
   * Initialize database utilities
   */
  async initialize() {
    try {
      logger.info("📊 Initializing Database Utilities...");

      // Create backup directories
      await this.ensureDirectories();

      // Start optimization scheduler
      if (this.config.optimization.enabled) {
        this.startOptimizationScheduler();
      }

      // Start monitoring
      if (this.config.monitoring.enabled) {
        this.startMonitoring();
      }

      logger.info("✅ Database Utilities initialized");

      // Log initial stats
      await this.logDatabaseStats();
    } catch (error) {
      logger.error(`Failed to initialize database utilities: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      this.config.backup.path,
      path.join(this.config.backup.path, "daily"),
      path.join(this.config.backup.path, "weekly"),
      path.join(this.config.backup.path, "monthly"),
      path.join(this.config.backup.path, "temp"),
      path.join(this.config.backup.path, "logs"),
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  // ============================================================
  // BACKUP OPERATIONS
  // ============================================================

  /**
   * Create database backup
   * @param {string} type - Backup type (daily, weekly, monthly)
   * @param {Object} options - Backup options
   */
  async createBackup(type = "daily", options = {}) {
    const startTime = Date.now();
    const timestamp = moment().format("YYYY-MM-DD-HH-mm-ss");
    const backupId = `backup-${type}-${timestamp}`;

    logger.info(`🔄 Creating ${type} backup: ${backupId}`);

    try {
      // Create temp directory for this backup
      const tempDir = path.join(this.config.backup.path, "temp", backupId);
      await fs.ensureDir(tempDir);

      // Get all collections
      const collections = await this.db.listCollections().toArray();
      const collectionNames = collections.map((c) => c.name);

      // Backup collections in parallel
      const backupResults = [];
      const batches = this.chunkArray(
        collectionNames,
        this.config.backup.parallelCollections,
      );

      for (const batch of batches) {
        const batchPromises = batch.map(async (collectionName) => {
          return await this.backupCollection(collectionName, tempDir);
        });
        const results = await Promise.all(batchPromises);
        backupResults.push(...results);
      }

      // Create metadata
      const metadata = {
        backupId,
        type,
        timestamp: new Date().toISOString(),
        database: this.db.databaseName,
        collections: backupResults,
        totalSize: backupResults.reduce((sum, r) => sum + r.size, 0),
        duration: Date.now() - startTime,
        nodeVersion: process.version,
        mongooseVersion: mongoose.version,
        environment: process.env.NODE_ENV,
      };

      // Save metadata
      await fs.writeJson(path.join(tempDir, "metadata.json"), metadata, {
        spaces: 2,
      });

      // Create archive
      const archivePath = await this.createArchive(tempDir, backupId, type);

      // Encrypt if enabled
      let finalPath = archivePath;
      if (this.config.backup.encryption.enabled) {
        finalPath = await this.encryptBackup(archivePath, backupId);
        await fs.remove(archivePath);
      }

      // Clean up temp directory
      await fs.remove(tempDir);

      // Update stats
      this.stats.backups.total++;
      this.stats.backups.successful++;
      this.stats.backups.totalSize += metadata.totalSize;

      // Clean old backups
      await this.cleanOldBackups(type);

      const duration = Date.now() - startTime;
      logger.info(
        `✅ Backup completed: ${backupId} (${this.formatBytes(metadata.totalSize)}) in ${duration}ms`,
      );

      return {
        success: true,
        backupId,
        path: finalPath,
        metadata,
        duration,
      };
    } catch (error) {
      logger.error(`❌ Backup failed: ${error.message}`);
      this.stats.backups.total++;
      this.stats.backups.failed++;
      throw error;
    }
  }

  /**
   * Backup a single collection
   * @param {string} collectionName - Collection name
   * @param {string} tempDir - Temporary directory
   */
  async backupCollection(collectionName, tempDir) {
    try {
      const collection = this.db.collection(collectionName);

      // Get collection stats
      const stats = await collection.stats();
      const documentCount = await collection.countDocuments();

      // Get all documents
      const documents = await collection.find({}).toArray();

      // Save to file
      const filePath = path.join(tempDir, `${collectionName}.json`);
      await fs.writeJson(filePath, documents, { spaces: 2 });

      logger.debug(
        `Backed up collection: ${collectionName} (${documentCount} documents, ${this.formatBytes(stats.size)})`,
      );

      return {
        name: collectionName,
        documentCount,
        size: stats.size,
        file: filePath,
      };
    } catch (error) {
      logger.error(
        `Failed to backup collection ${collectionName}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Create archive from backup directory
   * @param {string} sourceDir - Source directory
   * @param {string} backupId - Backup identifier
   * @param {string} type - Backup type
   */
  async createArchive(sourceDir, backupId, type) {
    return new Promise((resolve, reject) => {
      const archiveName = `${backupId}.zip`;
      const archivePath = path.join(this.config.backup.path, type, archiveName);
      const output = fs.createWriteStream(archivePath);
      const archive = archiver("zip", {
        zlib: { level: this.config.backup.compression.level },
      });

      output.on("close", () => {
        resolve(archivePath);
      });

      archive.on("error", reject);
      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  /**
   * Encrypt backup archive
   * @param {string} filePath - Path to file
   * @param {string} backupId - Backup identifier
   */
  async encryptBackup(filePath, backupId) {
    const algorithm = this.config.backup.encryption.algorithm;
    const key = Buffer.from(this.config.backup.encryption.key, "hex");
    const iv = crypto.randomBytes(16);

    const encryptedPath = `${filePath}.enc`;

    return new Promise((resolve, reject) => {
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      const input = fs.createReadStream(filePath);
      const output = fs.createWriteStream(encryptedPath);

      output.write(iv);
      input.pipe(cipher).pipe(output);

      output.on("finish", () => resolve(encryptedPath));
      output.on("error", reject);
      input.on("error", reject);
    });
  }

  /**
   * Clean old backups based on retention policy
   * @param {string} type - Backup type
   */
  async cleanOldBackups(type) {
    const retention = this.config.backup.retention[type];
    if (!retention) return;

    const backupDir = path.join(this.config.backup.path, type);
    const files = await fs.readdir(backupDir);
    const cutoffDate = moment().subtract(retention, "days");

    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = await fs.stat(filePath);

      if (moment(stats.mtime).isBefore(cutoffDate)) {
        await fs.remove(filePath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} old ${type} backups`);
    }
  }

  // ============================================================
  // RESTORE OPERATIONS
  // ============================================================

  /**
   * Restore database from backup
   * @param {string} backupPath - Path to backup file
   * @param {Object} options - Restore options
   */
  async restoreBackup(backupPath, options = {}) {
    const startTime = Date.now();

    logger.info(`🔄 Restoring database from: ${backupPath}`);

    try {
      // Create backup before restore if enabled
      if (this.config.restore.createBackupBeforeRestore) {
        await this.createBackup("pre_restore");
      }

      // Extract archive
      const extractPath = await this.extractArchive(backupPath);

      // Load metadata
      const metadata = await fs.readJson(
        path.join(extractPath, "metadata.json"),
      );
      logger.info(
        `Restoring backup: ${metadata.backupId} created at ${metadata.timestamp}`,
      );

      // Validate collections before restore
      if (this.config.restore.validateData) {
        await this.validateBackupData(extractPath);
      }

      // Restore collections
      const collections = await fs.readdir(extractPath);
      const jsonFiles = collections.filter(
        (f) => f.endsWith(".json") && f !== "metadata.json",
      );

      for (const file of jsonFiles) {
        const collectionName = path.basename(file, ".json");
        await this.restoreCollection(
          collectionName,
          path.join(extractPath, file),
          options,
        );
      }

      // Rebuild indexes if needed
      if (this.config.optimization.rebuildIndexes) {
        await this.rebuildAllIndexes();
      }

      // Clean up
      await fs.remove(extractPath);

      const duration = Date.now() - startTime;
      logger.info(`✅ Restore completed in ${duration}ms`);

      this.stats.restores.total++;
      this.stats.restores.successful++;

      return {
        success: true,
        backupId: metadata.backupId,
        duration,
        collectionsRestored: jsonFiles.length,
      };
    } catch (error) {
      logger.error(`❌ Restore failed: ${error.message}`);
      this.stats.restores.total++;
      this.stats.restores.failed++;
      throw error;
    }
  }

  /**
   * Extract backup archive
   * @param {string} archivePath - Path to archive
   */
  async extractArchive(archivePath) {
    const extractPath = path.join(
      this.config.backup.path,
      "temp",
      "restore_" + Date.now(),
    );
    await fs.ensureDir(extractPath);

    const AdmZip = require("adm-zip");
    const zip = new AdmZip(archivePath);
    zip.extractAllTo(extractPath, true);

    // Decrypt if encrypted
    if (archivePath.endsWith(".enc")) {
      await this.decryptBackup(extractPath);
    }

    return extractPath;
  }

  /**
   * Restore a single collection
   * @param {string} collectionName - Collection name
   * @param {string} filePath - Backup file path
   * @param {Object} options - Restore options
   */
  async restoreCollection(collectionName, filePath, options = {}) {
    try {
      const collection = this.db.collection(collectionName);
      const documents = await fs.readJson(filePath);

      // Drop existing collection if safe mode is off
      if (!this.config.restore.safeMode) {
        await collection.drop().catch(() => {});
      }

      // Insert documents in batches
      const batchSize = this.config.restore.batchSize;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        await collection.insertMany(batch, { ordered: false });
      }

      logger.info(
        `Restored collection: ${collectionName} (${documents.length} documents)`,
      );
    } catch (error) {
      logger.error(
        `Failed to restore collection ${collectionName}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Validate backup data
   * @param {string} extractPath - Extracted backup path
   */
  async validateBackupData(extractPath) {
    const collections = await fs.readdir(extractPath);
    const jsonFiles = collections.filter(
      (f) => f.endsWith(".json") && f !== "metadata.json",
    );

    for (const file of jsonFiles) {
      const filePath = path.join(extractPath, file);
      const data = await fs.readJson(filePath);

      if (!Array.isArray(data)) {
        throw new Error(`Invalid backup data in ${file}: not an array`);
      }

      logger.debug(`Validated ${file}: ${data.length} documents`);
    }

    logger.info("Backup data validation passed");
  }

  // ============================================================
  // OPTIMIZATION OPERATIONS
  // ============================================================

  /**
   * Optimize database
   */
  async optimizeDatabase() {
    const startTime = Date.now();
    logger.info("🔧 Starting database optimization...");

    const results = {
      collectionsAnalyzed: 0,
      indexesRebuilt: 0,
      collectionsCompacted: 0,
    };

    try {
      const collections = await this.db.listCollections().toArray();

      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        const collection = this.db.collection(collectionName);

        // Analyze collection stats
        if (this.config.optimization.analyze) {
          await this.analyzeCollection(collectionName);
          results.collectionsAnalyzed++;
        }

        // Rebuild indexes
        if (this.config.optimization.rebuildIndexes) {
          const indexCount = await this.rebuildIndexes(collectionName);
          results.indexesRebuilt += indexCount;
        }

        // Compact collection (if supported)
        if (this.config.optimization.compact) {
          await this.compactCollection(collectionName);
          results.collectionsCompacted++;
        }
      }

      this.stats.optimizations.lastRun = new Date();
      this.stats.optimizations.collectionsOptimized =
        results.collectionsAnalyzed;
      this.stats.optimizations.indexesRebuilt = results.indexesRebuilt;

      const duration = Date.now() - startTime;
      logger.info(
        `✅ Database optimization completed in ${duration}ms`,
        results,
      );

      return { success: true, results, duration };
    } catch (error) {
      logger.error(`❌ Optimization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze collection statistics
   * @param {string} collectionName - Collection name
   */
  async analyzeCollection(collectionName) {
    try {
      const collection = this.db.collection(collectionName);
      const stats = await collection.stats();

      logger.debug(
        `Collection ${collectionName}: ${stats.count} documents, ${this.formatBytes(stats.size)}`,
      );

      // Check thresholds
      if (
        stats.size >
        this.config.monitoring.alertThresholds.size * 1024 * 1024
      ) {
        logger.warn(
          `Collection ${collectionName} size exceeds threshold: ${this.formatBytes(stats.size)}`,
        );
      }

      return stats;
    } catch (error) {
      logger.error(
        `Failed to analyze collection ${collectionName}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Rebuild indexes for a collection
   * @param {string} collectionName - Collection name
   */
  async rebuildIndexes(collectionName) {
    try {
      const collection = this.db.collection(collectionName);
      const indexes = await collection.indexes();

      // Drop all non-_id indexes
      for (const index of indexes) {
        if (index.name !== "_id_") {
          await collection.dropIndex(index.name);
        }
      }

      // Recreate indexes from mongoose model
      const model = mongoose.models[collectionName];
      if (model && model.schema) {
        await model.syncIndexes();
      }

      logger.debug(`Rebuilt indexes for ${collectionName}`);
      return indexes.length - 1;
    } catch (error) {
      logger.error(
        `Failed to rebuild indexes for ${collectionName}: ${error.message}`,
      );
      return 0;
    }
  }

  /**
   * Rebuild all indexes across all collections
   */
  async rebuildAllIndexes() {
    logger.info("Rebuilding all indexes...");

    for (const modelName in mongoose.models) {
      const model = mongoose.models[modelName];
      await model.syncIndexes();
      logger.debug(`Synced indexes for ${modelName}`);
    }

    logger.info("✅ All indexes rebuilt");
  }

  /**
   * Compact a collection (MongoDB only)
   * @param {string} collectionName - Collection name
   */
  async compactCollection(collectionName) {
    try {
      // This is MongoDB-specific
      await this.db.command({ compact: collectionName });
      logger.debug(`Compacted collection: ${collectionName}`);
    } catch (error) {
      // Compact might not be supported on all setups
      logger.debug(
        `Skipped compaction for ${collectionName}: ${error.message}`,
      );
    }
  }

  // ============================================================
  // VALIDATION OPERATIONS
  // ============================================================

  /**
   * Validate database integrity
   */
  async validateDatabase() {
    logger.info("🔍 Validating database integrity...");

    const results = {
      valid: true,
      errors: [],
      collections: {},
    };

    try {
      const collections = await this.db.listCollections().toArray();

      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        const collection = this.db.collection(collectionName);

        // Check indexes
        if (this.config.validation.checkIndexes) {
          const indexes = await collection.indexes();
          results.collections[collectionName] = { indexes: indexes.length };
        }

        // Check data integrity
        if (this.config.validation.checkDataIntegrity) {
          const sample = await collection.findOne();
          if (sample && sample._id) {
            // Basic validation passed
            results.collections[collectionName].valid = true;
          }
        }
      }

      // Check referential integrity
      if (this.config.validation.checkReferentialIntegrity) {
        await this.checkReferentialIntegrity(results);
      }

      logger.info("✅ Database validation completed", results);

      return results;
    } catch (error) {
      logger.error(`❌ Validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check referential integrity between collections
   * @param {Object} results - Results object to populate
   */
  async checkReferentialIntegrity(results) {
    // Check user references
    const users = await this.db.collection("users").find().toArray();
    const userIds = new Set(users.map((u) => u._id.toString()));

    // Check notices for invalid user references
    const notices = await this.db.collection("notices").find().toArray();
    const invalidNoticeUsers = notices.filter(
      (n) => !userIds.has(n.createdBy?.toString()),
    );

    if (invalidNoticeUsers.length > 0) {
      results.errors.push(
        `${invalidNoticeUsers.length} notices have invalid user references`,
      );
      results.valid = false;
    }

    // Check events for invalid user references
    const events = await this.db.collection("events").find().toArray();
    const invalidEventUsers = events.filter(
      (e) => !userIds.has(e.createdBy?.toString()),
    );

    if (invalidEventUsers.length > 0) {
      results.errors.push(
        `${invalidEventUsers.length} events have invalid user references`,
      );
      results.valid = false;
    }
  }

  // ============================================================
  // MONITORING OPERATIONS
  // ============================================================

  /**
   * Start monitoring
   */
  startMonitoring() {
    setInterval(async () => {
      await this.collectMetrics();
    }, 3600000); // Every hour

    logger.info("📊 Database monitoring started");
  }

  /**
   * Collect database metrics
   */
  async collectMetrics() {
    try {
      const stats = await this.db.stats();
      const serverStatus = await this.db.admin().serverStatus();

      const metrics = {
        timestamp: new Date().toISOString(),
        database: {
          collections: stats.collections,
          objects: stats.objects,
          avgObjSize: stats.avgObjSize,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
          indexes: stats.indexes,
          indexSize: stats.indexSize,
        },
        server: {
          connections: serverStatus.connections.current,
          uptime: serverStatus.uptime,
          opCounters: serverStatus.opcounters,
        },
      };

      // Save metrics to file
      const metricsPath = path.join(
        this.config.backup.path,
        "logs",
        `metrics-${moment().format("YYYY-MM-DD")}.json`,
      );
      let existing = [];

      if (await fs.pathExists(metricsPath)) {
        existing = await fs.readJson(metricsPath);
      }

      existing.push(metrics);
      await fs.writeJson(metricsPath, existing, { spaces: 2 });

      // Check thresholds
      if (
        stats.dataSize >
        this.config.monitoring.alertThresholds.size * 1024 * 1024
      ) {
        logger.warn(
          `Database size exceeds threshold: ${this.formatBytes(stats.dataSize)}`,
        );
      }

      logger.debug("Database metrics collected");
    } catch (error) {
      logger.error(`Failed to collect metrics: ${error.message}`);
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      const dbStats = await this.db.stats();
      const collections = await this.db.listCollections().toArray();
      const collectionStats = [];

      for (const collection of collections) {
        const stats = await this.db.collection(collection.name).stats();
        collectionStats.push({
          name: collection.name,
          documentCount: stats.count,
          size: stats.size,
          avgObjSize: stats.avgObjSize,
          indexes: stats.nindexes,
          indexSize: stats.totalIndexSize,
        });
      }

      return {
        database: {
          name: this.db.databaseName,
          size: dbStats.dataSize,
          sizeFormatted: this.formatBytes(dbStats.dataSize),
          collections: dbStats.collections,
          objects: dbStats.objects,
          indexes: dbStats.indexes,
          indexSize: dbStats.indexSize,
          storageSize: dbStats.storageSize,
        },
        collections: collectionStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Failed to get database stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Log database statistics
   */
  async logDatabaseStats() {
    const stats = await this.getDatabaseStats();
    logger.info("📊 Database Statistics:", {
      size: stats.database.sizeFormatted,
      collections: stats.database.collections,
      documents: stats.database.objects,
      indexes: stats.database.indexes,
    });
  }

  // ============================================================
  // SCHEDULER
  // ============================================================

  /**
   * Start optimization scheduler
   */
  startOptimizationScheduler() {
    const cron = require("node-cron");

    cron.schedule(this.config.optimization.schedule, async () => {
      logger.info("⏰ Running scheduled database optimization...");
      await this.optimizeDatabase();
      await this.createBackup("weekly");
    });

    logger.info(
      `📅 Database optimization scheduled: ${this.config.optimization.schedule}`,
    );
  }

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  /**
   * Chunk array into smaller arrays
   * @param {Array} array - Array to chunk
   * @param {number} size - Chunk size
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Format bytes to human readable
   * @param {number} bytes - Bytes to format
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get backup statistics
   */
  getBackupStats() {
    return this.stats.backups;
  }

  /**
   * Get restore statistics
   */
  getRestoreStats() {
    return this.stats.restores;
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats() {
    return this.stats.optimizations;
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let instance = null;

/**
 * Get database utilities instance
 */
const getDatabaseUtils = async () => {
  if (!instance) {
    instance = new DatabaseUtils();
    await instance.initialize();
  }
  return instance;
};

/**
 * Create database backup
 * @param {string} type - Backup type
 */
const createBackup = async (type = "daily") => {
  const dbUtils = await getDatabaseUtils();
  return dbUtils.createBackup(type);
};

/**
 * Restore database from backup
 * @param {string} backupPath - Path to backup file
 */
const restoreBackup = async (backupPath) => {
  const dbUtils = await getDatabaseUtils();
  return dbUtils.restoreBackup(backupPath);
};

/**
 * Optimize database
 */
const optimizeDatabase = async () => {
  const dbUtils = await getDatabaseUtils();
  return dbUtils.optimizeDatabase();
};

/**
 * Validate database
 */
const validateDatabase = async () => {
  const dbUtils = await getDatabaseUtils();
  return dbUtils.validateDatabase();
};

/**
 * Get database statistics
 */
const getDatabaseStats = async () => {
  const dbUtils = await getDatabaseUtils();
  return dbUtils.getDatabaseStats();
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Core
  getDatabaseUtils,
  DatabaseUtils,

  // Operations
  createBackup,
  restoreBackup,
  optimizeDatabase,
  validateDatabase,
  getDatabaseStats,

  // Constants
  DB_CONFIG,
};
