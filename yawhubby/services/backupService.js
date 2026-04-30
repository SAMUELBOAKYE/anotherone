// services/backupService.js
// Enterprise Backup Service for MongoDB Database and File System
// Supports: Full/Incremental backups, Encryption, Cloud Storage, Scheduling, and Disaster Recovery

const mongoose = require("mongoose");
const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const moment = require("moment");
const crypto = require("crypto");
const { exec } = require("child_process");
const { promisify } = require("util");
const logger = require("../utils/logger");
const axios = require("axios");

const execAsync = promisify(exec);

// ============================================================
// CONFIGURATION
// ============================================================

const BACKUP_CONFIG = {
  // Backup directories
  paths: {
    backupRoot: process.env.BACKUP_PATH || "./backups",
    tempDir: "./backups/temp",
    mongodbDump: "./backups/mongodb",
    filesDump: "./backups/files",
    encryption: "./backups/encrypted",
    logs: "./backups/logs",
  },

  // Backup types
  types: {
    full: "full", // Complete backup
    incremental: "incremental", // Changes since last backup
    differential: "differential", // Changes since last full backup
  },

  // MongoDB backup settings
  mongodb: {
    enabled: process.env.MONGODB_BACKUP_ENABLED !== "false",
    uri: process.env.MONGODB_URI,
    database: process.env.MONGODB_DATABASE || "kaaf_noticeboard",
    collections: process.env.MONGODB_BACKUP_COLLECTIONS
      ? process.env.MONGODB_BACKUP_COLLECTIONS.split(",")
      : null, // null = all collections
    excludeCollections: process.env.MONGODB_EXCLUDE_COLLECTIONS
      ? process.env.MONGODB_EXCLUDE_COLLECTIONS.split(",")
      : ["sessions", "logs"],
    dumpCommand: "mongodump",
    restoreCommand: "mongorestore",
    options: {
      archive: false,
      gzip: true,
      oplog: false,
      dumpDbUsersAndRoles: false,
    },
  },

  // File backup settings
  files: {
    enabled: process.env.FILES_BACKUP_ENABLED !== "false",
    directories: [
      { source: "./uploads", dest: "uploads" },
      { source: "./certificates", dest: "certificates" },
      { source: "./public", dest: "public" },
      { source: "./config", dest: "config" },
    ],
    excludePatterns: [
      "*.tmp",
      "*.log",
      "node_modules/*",
      "backups/*",
      ".git/*",
    ],
  },

  // Encryption settings
  encryption: {
    enabled: process.env.BACKUP_ENCRYPTION_ENABLED === "true",
    algorithm: "aes-256-gcm",
    key: process.env.BACKUP_ENCRYPTION_KEY,
    iv: null, // Will be generated per backup
  },

  // Compression settings
  compression: {
    enabled: true,
    level: parseInt(process.env.BACKUP_COMPRESSION_LEVEL) || 9,
    format: "zip", // zip, tar, tar.gz
  },

  // Retention policy
  retention: {
    enabled: true,
    daily: parseInt(process.env.BACKUP_RETENTION_DAILY) || 7, // Keep daily backups for 7 days
    weekly: parseInt(process.env.BACKUP_RETENTION_WEEKLY) || 30, // Keep weekly backups for 30 days
    monthly: parseInt(process.env.BACKUP_RETENTION_MONTHLY) || 365, // Keep monthly backups for 1 year
    maxBackups: parseInt(process.env.BACKUP_MAX_BACKUPS) || 50, // Maximum number of backups to keep
  },

  // Cloud storage
  cloud: {
    enabled: process.env.CLOUD_BACKUP_ENABLED === "true",
    provider: process.env.CLOUD_PROVIDER || "s3", // s3, gcs, azure, dropbox
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION || "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      path: process.env.AWS_S3_PATH || "backups/",
    },
    gcs: {
      bucket: process.env.GCS_BUCKET,
      keyFilename: process.env.GCS_KEY_FILENAME,
      projectId: process.env.GCS_PROJECT_ID,
    },
    azure: {
      container: process.env.AZURE_CONTAINER,
      connectionString: process.env.AZURE_CONNECTION_STRING,
    },
  },

  // Notification settings
  notifications: {
    enabled: process.env.BACKUP_NOTIFICATIONS_ENABLED !== "false",
    slack: process.env.SLACK_WEBHOOK_URL,
    email: process.env.ALERT_EMAIL,
    onSuccess: process.env.NOTIFY_ON_SUCCESS === "true",
    onFailure: process.env.NOTIFY_ON_FAILURE !== "false",
  },

  // Scheduling
  schedule: {
    enabled: process.env.BACKUP_SCHEDULE_ENABLED !== "false",
    cron: process.env.BACKUP_CRON_SCHEDULE || "0 2 * * *", // Daily at 2 AM
    timezone: process.env.TIMEZONE || "Africa/Accra",
  },

  // Verification
  verification: {
    enabled: process.env.BACKUP_VERIFICATION_ENABLED !== "false",
    validateIntegrity: true,
    testRestore: process.env.BACKUP_TEST_RESTORE === "true", // Only for critical backups
  },

  // Performance
  performance: {
    maxConcurrentUploads: 3,
    chunkSize: 1024 * 1024 * 5, // 5MB chunks for cloud upload
    retryAttempts: 3,
    retryDelay: 5000,
  },
};

// ============================================================
// BACKUP SERVICE CLASS
// ============================================================

class BackupService {
  constructor(config = BACKUP_CONFIG) {
    this.config = config;
    this.currentBackup = null;
    this.backupHistory = [];
    this.isRunning = false;
    this.stats = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      totalSizeSaved: 0,
      averageDuration: 0,
      lastBackupTime: null,
    };
  }

  /**
   * Initialize backup service
   */
  async initialize() {
    try {
      logger.info("📦 Initializing Backup Service...");

      // Create necessary directories
      await this.createDirectories();

      // Load backup history
      await this.loadBackupHistory();

      // Start scheduled backups if enabled
      if (this.config.schedule.enabled) {
        this.startScheduledBackups();
      }

      // Clean old backups on startup
      await this.cleanupOldBackups();

      logger.info("✅ Backup Service initialized successfully");

      return true;
    } catch (error) {
      logger.error(`Failed to initialize backup service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create required directories
   */
  async createDirectories() {
    for (const dir of Object.values(this.config.paths)) {
      await fs.ensureDir(dir);
    }
    logger.debug("Backup directories created");
  }

  /**
   * Create a new backup
   * @param {string} type - Backup type (full, incremental, differential)
   * @param {Object} options - Backup options
   */
  async createBackup(type = "full", options = {}) {
    if (this.isRunning) {
      throw new Error("Backup already in progress");
    }

    this.isRunning = true;
    const startTime = Date.now();

    const backupId = this.generateBackupId();
    this.currentBackup = {
      id: backupId,
      type,
      startedAt: new Date(),
      status: "running",
      components: {},
      size: 0,
      location: this.config.paths.backupRoot,
    };

    try {
      logger.info(`🔄 Starting ${type} backup: ${backupId}`);

      // Send notification
      await this.sendNotification("started", { backupId, type });

      // Backup MongoDB
      if (
        this.config.mongodb.enabled &&
        (type === "full" || type === "incremental")
      ) {
        this.currentBackup.components.mongodb = await this.backupMongoDB(type);
      }

      // Backup files
      if (this.config.files.enabled && type === "full") {
        this.currentBackup.components.files = await this.backupFiles();
      }

      // Create archive
      const archivePath = await this.createArchive(backupId);

      // Encrypt if enabled
      let finalPath = archivePath;
      if (this.config.encryption.enabled) {
        finalPath = await this.encryptBackup(archivePath, backupId);
        await fs.remove(archivePath);
      }

      // Upload to cloud if enabled
      if (this.config.cloud.enabled) {
        await this.uploadToCloud(finalPath, backupId);
      }

      // Verify backup
      if (this.config.verification.enabled) {
        await this.verifyBackup(finalPath, backupId);
      }

      // Update stats
      const duration = Date.now() - startTime;
      this.currentBackup.status = "completed";
      this.currentBackup.completedAt = new Date();
      this.currentBackup.duration = duration;
      this.currentBackup.size = await this.getFileSize(finalPath);

      // Save to history
      await this.saveBackupToHistory(this.currentBackup);

      // Update statistics
      this.updateStatistics(duration);

      // Clean old backups
      await this.cleanupOldBackups();

      // Send success notification
      await this.sendNotification("completed", {
        backupId,
        type,
        duration,
        size: this.currentBackup.size,
        location: finalPath,
      });

      logger.info(`✅ Backup completed: ${backupId} in ${duration}ms`);

      return this.currentBackup;
    } catch (error) {
      logger.error(`❌ Backup failed: ${error.message}`);

      this.currentBackup.status = "failed";
      this.currentBackup.error = error.message;
      this.currentBackup.failedAt = new Date();

      await this.saveBackupToHistory(this.currentBackup);
      this.stats.failedBackups++;

      // Send failure notification
      await this.sendNotification("failed", {
        backupId,
        type,
        error: error.message,
      });

      throw error;
    } finally {
      this.isRunning = false;
      this.currentBackup = null;

      // Clean temp directory
      await this.cleanTempDirectory();
    }
  }

  /**
   * Backup MongoDB database
   * @param {string} type - Backup type
   */
  async backupMongoDB(type) {
    const timestamp = moment().format("YYYY-MM-DD-HH-mm-ss");
    const backupPath = path.join(this.config.paths.mongodbDump, timestamp);

    try {
      logger.info("Backing up MongoDB...");

      let cmd = `${this.config.mongodb.dumpCommand} --uri="${this.config.mongodb.uri}" --out="${backupPath}"`;

      // Add collection filters
      if (this.config.mongodb.collections) {
        for (const collection of this.config.mongodb.collections) {
          cmd += ` --collection=${collection}`;
        }
      }

      // Exclude collections
      if (this.config.mongodb.excludeCollections) {
        for (const collection of this.config.mongodb.excludeCollections) {
          cmd += ` --excludeCollection=${collection}`;
        }
      }

      // Add compression
      if (this.config.mongodb.options.gzip) {
        cmd += ` --gzip`;
      }

      // Execute backup
      await execAsync(cmd);

      // Get backup size
      const size = await this.getDirectorySize(backupPath);

      logger.info(`MongoDB backup completed: ${this.formatBytes(size)}`);

      return {
        path: backupPath,
        size,
        timestamp,
        collections: await this.getBackupCollections(backupPath),
      };
    } catch (error) {
      logger.error(`MongoDB backup failed: ${error.message}`);
      throw new Error(`MongoDB backup failed: ${error.message}`);
    }
  }

  /**
   * Backup files and directories
   */
  async backupFiles() {
    const timestamp = moment().format("YYYY-MM-DD-HH-mm-ss");
    const backupPath = path.join(this.config.paths.filesDump, timestamp);

    try {
      logger.info("Backing up files...");
      await fs.ensureDir(backupPath);

      const results = {};

      for (const dir of this.config.files.directories) {
        const sourcePath = path.resolve(dir.source);
        const destPath = path.join(backupPath, dir.dest);

        if (await fs.pathExists(sourcePath)) {
          await fs.copy(sourcePath, destPath, {
            filter: (src) => this.shouldIncludeFile(src),
          });

          const size = await this.getDirectorySize(destPath);
          results[dir.dest] = { size, files: await this.countFiles(destPath) };

          logger.debug(`Backed up ${dir.source}: ${this.formatBytes(size)}`);
        } else {
          logger.warn(`Source directory not found: ${sourcePath}`);
        }
      }

      const totalSize = await this.getDirectorySize(backupPath);

      logger.info(`Files backup completed: ${this.formatBytes(totalSize)}`);

      return {
        path: backupPath,
        size: totalSize,
        timestamp,
        components: results,
      };
    } catch (error) {
      logger.error(`Files backup failed: ${error.message}`);
      throw new Error(`Files backup failed: ${error.message}`);
    }
  }

  /**
   * Create archive of backup
   * @param {string} backupId - Backup identifier
   */
  async createArchive(backupId) {
    const timestamp = moment().format("YYYY-MM-DD-HH-mm-ss");
    const archiveName = `backup-${backupId}-${timestamp}.${this.config.compression.format}`;
    const archivePath = path.join(this.config.paths.tempDir, archiveName);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(archivePath);
      const archive = archiver(this.config.compression.format, {
        zlib: { level: this.config.compression.level },
      });

      output.on("close", () => {
        logger.info(
          `Archive created: ${archiveName} (${this.formatBytes(archive.pointer())})`,
        );
        resolve(archivePath);
      });

      archive.on("error", (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add MongoDB backup
      if (this.currentBackup.components.mongodb) {
        archive.directory(
          this.currentBackup.components.mongodb.path,
          "mongodb",
        );
      }

      // Add files backup
      if (this.currentBackup.components.files) {
        archive.directory(this.currentBackup.components.files.path, "files");
      }

      // Add backup metadata
      archive.append(
        JSON.stringify(
          {
            backupId,
            type: this.currentBackup.type,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version,
            nodeVersion: process.version,
            platform: process.platform,
          },
          null,
          2,
        ),
        { name: "metadata.json" },
      );

      archive.finalize();
    });
  }

  /**
   * Encrypt backup archive
   * @param {string} filePath - Path to file to encrypt
   * @param {string} backupId - Backup identifier
   */
  async encryptBackup(filePath, backupId) {
    const algorithm = this.config.encryption.algorithm;
    const key = Buffer.from(this.config.encryption.key, "hex");
    const iv = crypto.randomBytes(16);

    const encryptedPath = path.join(
      this.config.paths.encryption,
      `${path.basename(filePath)}.enc`,
    );

    return new Promise((resolve, reject) => {
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      const input = fs.createReadStream(filePath);
      const output = fs.createWriteStream(encryptedPath);

      // Store IV with the encrypted file
      output.write(iv);

      input.pipe(cipher).pipe(output);

      output.on("finish", () => {
        logger.info(`Backup encrypted: ${path.basename(encryptedPath)}`);
        resolve(encryptedPath);
      });

      output.on("error", reject);
      input.on("error", reject);
    });
  }

  /**
   * Upload backup to cloud storage
   * @param {string} filePath - Path to backup file
   * @param {string} backupId - Backup identifier
   */
  async uploadToCloud(filePath, backupId) {
    const provider = this.config.cloud.provider;
    const fileName = path.basename(filePath);

    try {
      logger.info(`Uploading backup to ${provider.toUpperCase()}...`);

      switch (provider) {
        case "s3":
          await this.uploadToS3(filePath, fileName);
          break;
        case "gcs":
          await this.uploadToGCS(filePath, fileName);
          break;
        case "azure":
          await this.uploadToAzure(filePath, fileName);
          break;
        default:
          throw new Error(`Unsupported cloud provider: ${provider}`);
      }

      logger.info(`Backup uploaded to ${provider.toUpperCase()}`);
    } catch (error) {
      logger.error(`Cloud upload failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload to AWS S3
   */
  async uploadToS3(filePath, fileName) {
    const AWS = require("aws-sdk");

    AWS.config.update({
      accessKeyId: this.config.cloud.s3.accessKeyId,
      secretAccessKey: this.config.cloud.s3.secretAccessKey,
      region: this.config.cloud.s3.region,
    });

    const s3 = new AWS.S3();
    const fileContent = await fs.readFile(filePath);
    const key = `${this.config.cloud.s3.path}${fileName}`;

    const params = {
      Bucket: this.config.cloud.s3.bucket,
      Key: key,
      Body: fileContent,
      StorageClass: "STANDARD_IA", // Infrequent access for cost savings
    };

    await s3.upload(params).promise();
    this.currentBackup.cloudLocation = `s3://${this.config.cloud.s3.bucket}/${key}`;
  }

  /**
   * Upload to Google Cloud Storage
   */
  async uploadToGCS(filePath, fileName) {
    const { Storage } = require("@google-cloud/storage");

    const storage = new Storage({
      projectId: this.config.cloud.gcs.projectId,
      keyFilename: this.config.cloud.gcs.keyFilename,
    });

    const bucket = storage.bucket(this.config.cloud.gcs.bucket);
    const key = `${this.config.cloud.s3.path}${fileName}`;

    await bucket.upload(filePath, {
      destination: key,
      gzip: true,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    this.currentBackup.cloudLocation = `gs://${this.config.cloud.gcs.bucket}/${key}`;
  }

  /**
   * Upload to Azure Blob Storage
   */
  async uploadToAzure(filePath, fileName) {
    const { BlobServiceClient } = require("@azure/storage-blob");

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      this.config.cloud.azure.connectionString,
    );

    const containerClient = blobServiceClient.getContainerClient(
      this.config.cloud.azure.container,
    );
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadFile(filePath);

    this.currentBackup.cloudLocation = `azure://${this.config.cloud.azure.container}/${fileName}`;
  }

  /**
   * Verify backup integrity
   * @param {string} filePath - Path to backup file
   * @param {string} backupId - Backup identifier
   */
  async verifyBackup(filePath, backupId) {
    try {
      logger.info(`Verifying backup: ${backupId}`);

      // Check file exists
      if (!(await fs.pathExists(filePath))) {
        throw new Error("Backup file not found");
      }

      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        throw new Error("Backup file is empty");
      }

      // Test archive integrity (for ZIP files)
      if (filePath.endsWith(".zip")) {
        const AdmZip = require("adm-zip");
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();

        if (entries.length === 0) {
          throw new Error("Archive is empty");
        }

        logger.info(`Archive contains ${entries.length} entries`);
      }

      // Calculate checksum
      const checksum = await this.calculateChecksum(filePath);
      logger.info(
        `Backup verified: ${backupId} (${checksum.substring(0, 16)}...)`,
      );

      this.currentBackup.checksum = checksum;

      return true;
    } catch (error) {
      logger.error(`Backup verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Restore from backup
   * @param {string} backupId - Backup identifier
   * @param {Object} options - Restore options
   */
  async restoreBackup(backupId, options = {}) {
    logger.info(`🔄 Starting restore from backup: ${backupId}`);

    try {
      // Find backup in history
      const backup = await this.findBackupInHistory(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Download from cloud if needed
      let backupPath = backup.location;
      if (backup.cloudLocation && !(await fs.pathExists(backupPath))) {
        backupPath = await this.downloadFromCloud(backupId, backup);
      }

      // Decrypt if encrypted
      if (backupPath.endsWith(".enc")) {
        backupPath = await this.decryptBackup(backupPath);
      }

      // Extract archive
      const extractPath = await this.extractArchive(backupPath);

      // Restore MongoDB
      if (options.restoreMongoDB !== false && backup.components.mongodb) {
        await this.restoreMongoDB(extractPath);
      }

      // Restore files
      if (options.restoreFiles !== false && backup.components.files) {
        await this.restoreFiles(extractPath);
      }

      // Clean up
      await fs.remove(extractPath);

      logger.info(`✅ Restore completed from backup: ${backupId}`);

      return { success: true, backupId };
    } catch (error) {
      logger.error(`Restore failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Restore MongoDB from backup
   */
  async restoreMongoDB(extractPath) {
    const mongodbPath = path.join(extractPath, "mongodb");

    if (!(await fs.pathExists(mongodbPath))) {
      throw new Error("MongoDB backup not found in archive");
    }

    const cmd = `${this.config.mongodb.restoreCommand} --uri="${this.config.mongodb.uri}" --drop "${mongodbPath}"`;

    await execAsync(cmd);
    logger.info("MongoDB restored successfully");
  }

  /**
   * Restore files from backup
   */
  async restoreFiles(extractPath) {
    const filesPath = path.join(extractPath, "files");

    if (!(await fs.pathExists(filesPath))) {
      throw new Error("Files backup not found in archive");
    }

    for (const dir of this.config.files.directories) {
      const sourcePath = path.join(filesPath, dir.dest);
      const destPath = path.resolve(dir.source);

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath, { overwrite: true });
        logger.info(`Restored ${dir.source}`);
      }
    }
  }

  /**
   * Extract backup archive
   */
  async extractArchive(archivePath) {
    const extractPath = path.join(
      this.config.paths.tempDir,
      "restore_" + Date.now(),
    );
    await fs.ensureDir(extractPath);

    const AdmZip = require("adm-zip");
    const zip = new AdmZip(archivePath);
    zip.extractAllTo(extractPath, true);

    logger.info(`Archive extracted to: ${extractPath}`);
    return extractPath;
  }

  /**
   * Calculate file checksum
   */
  async calculateChecksum(filePath) {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on("data", (data) => hash.update(data));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups() {
    if (!this.config.retention.enabled) return;

    logger.info("🧹 Cleaning up old backups...");

    const backups = await this.listBackups();
    const now = moment();
    let deletedCount = 0;

    for (const backup of backups) {
      const backupDate = moment(backup.createdAt);
      const age = now.diff(backupDate, "days");

      let shouldDelete = false;

      // Determine retention period based on backup age
      if (age > this.config.retention.monthly) {
        shouldDelete = true;
      } else if (
        age > this.config.retention.weekly &&
        backup.type !== "weekly"
      ) {
        shouldDelete = true;
      } else if (age > this.config.retention.daily && backup.type === "daily") {
        shouldDelete = true;
      }

      // Check maximum backups limit
      if (!shouldDelete && backups.length > this.config.retention.maxBackups) {
        shouldDelete = true;
      }

      if (shouldDelete) {
        await this.deleteBackup(backup.id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} old backups`);
    }
  }

  /**
   * Delete a backup
   * @param {string} backupId - Backup identifier
   */
  async deleteBackup(backupId) {
    try {
      const backup = await this.findBackupInHistory(backupId);
      if (!backup) return;

      // Delete local files
      if (backup.location && (await fs.pathExists(backup.location))) {
        await fs.remove(backup.location);
      }

      // Delete from history
      const historyPath = path.join(
        this.config.paths.backupRoot,
        "backup_history.json",
      );
      const history = await fs.readJson(historyPath);
      const filtered = history.filter((b) => b.id !== backupId);
      await fs.writeJson(historyPath, filtered, { spaces: 2 });

      logger.info(`Deleted backup: ${backupId}`);
    } catch (error) {
      logger.error(`Failed to delete backup ${backupId}: ${error.message}`);
    }
  }

  /**
   * List all backups
   */
  async listBackups() {
    const historyPath = path.join(
      this.config.paths.backupRoot,
      "backup_history.json",
    );

    if (await fs.pathExists(historyPath)) {
      return await fs.readJson(historyPath);
    }

    return [];
  }

  /**
   * Find backup in history
   */
  async findBackupInHistory(backupId) {
    const backups = await this.listBackups();
    return backups.find((b) => b.id === backupId);
  }

  /**
   * Save backup to history
   */
  async saveBackupToHistory(backup) {
    const historyPath = path.join(
      this.config.paths.backupRoot,
      "backup_history.json",
    );

    let history = [];
    if (await fs.pathExists(historyPath)) {
      history = await fs.readJson(historyPath);
    }

    history.unshift(backup);
    await fs.writeJson(historyPath, history, { spaces: 2 });
  }

  /**
   * Load backup history
   */
  async loadBackupHistory() {
    this.backupHistory = await this.listBackups();
    this.stats.totalBackups = this.backupHistory.length;
    this.stats.successfulBackups = this.backupHistory.filter(
      (b) => b.status === "completed",
    ).length;
    this.stats.failedBackups = this.backupHistory.filter(
      (b) => b.status === "failed",
    ).length;
  }

  /**
   * Start scheduled backups
   */
  startScheduledBackups() {
    const cron = require("node-cron");

    cron.schedule(
      this.config.schedule.cron,
      async () => {
        logger.info("⏰ Running scheduled backup...");

        const backupType = this.getScheduledBackupType();
        await this.createBackup(backupType);
      },
      {
        timezone: this.config.schedule.timezone,
      },
    );

    logger.info(`📅 Scheduled backups enabled: ${this.config.schedule.cron}`);
  }

  /**
   * Get scheduled backup type based on day
   */
  getScheduledBackupType() {
    const dayOfWeek = moment().day();
    const dayOfMonth = moment().date();

    // Monthly backup on 1st day of month
    if (dayOfMonth === 1) return "full";

    // Weekly backup on Sunday
    if (dayOfWeek === 0) return "full";

    // Daily backup
    return "incremental";
  }

  /**
   * Generate backup ID
   */
  generateBackupId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString("hex");
    return `${timestamp}-${random}`;
  }

  /**
   * Get directory size
   */
  async getDirectorySize(dirPath) {
    let size = 0;

    if (!(await fs.pathExists(dirPath))) return 0;

    const files = await fs.readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        size += await this.getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }

    return size;
  }

  /**
   * Get file size
   */
  async getFileSize(filePath) {
    if (!(await fs.pathExists(filePath))) return 0;
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  /**
   * Count files in directory
   */
  async countFiles(dirPath) {
    let count = 0;
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        count += await this.countFiles(filePath);
      } else {
        count++;
      }
    }

    return count;
  }

  /**
   * Get backup collections
   */
  async getBackupCollections(backupPath) {
    try {
      const dirs = await fs.readdir(backupPath);
      return dirs.filter((d) => !d.startsWith("system."));
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if file should be included in backup
   */
  shouldIncludeFile(filePath) {
    for (const pattern of this.config.files.excludePatterns) {
      if (filePath.includes(pattern.replace("*", ""))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Send notification
   */
  async sendNotification(event, data) {
    if (!this.config.notifications.enabled) return;

    // Skip success notifications if not configured
    if (event === "completed" && !this.config.notifications.onSuccess) return;
    if (event === "failed" && !this.config.notifications.onFailure) return;

    const message = this.formatNotificationMessage(event, data);

    // Send to Slack
    if (this.config.notifications.slack) {
      await this.sendSlackNotification(message, event);
    }

    // Send to Email
    if (this.config.notifications.email) {
      await this.sendEmailNotification(message, event);
    }

    // Log notification
    logger.info(`Notification sent: ${event}`);
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(message, event) {
    try {
      const color =
        event === "completed"
          ? "good"
          : event === "failed"
            ? "danger"
            : "warning";

      await axios.post(this.config.notifications.slack, {
        attachments: [
          {
            color,
            title: `Backup ${event.toUpperCase()}`,
            text: message,
            fields: [
              {
                title: "Environment",
                value: process.env.NODE_ENV || "development",
                short: true,
              },
              { title: "Server", value: require("os").hostname(), short: true },
            ],
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      });
    } catch (error) {
      logger.error(`Failed to send Slack notification: ${error.message}`);
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(message, event) {
    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        to: this.config.notifications.email,
        subject: `[Backup] ${event.toUpperCase()} - ${process.env.APP_NAME}`,
        text: message,
        html: `<pre>${message}</pre>`,
      });
    } catch (error) {
      logger.error(`Failed to send email notification: ${error.message}`);
    }
  }

  /**
   * Format notification message
   */
  formatNotificationMessage(event, data) {
    switch (event) {
      case "started":
        return `Backup started\nID: ${data.backupId}\nType: ${data.type}\nTime: ${new Date().toISOString()}`;
      case "completed":
        return `Backup completed successfully!\nID: ${data.backupId}\nDuration: ${data.duration}ms\nSize: ${this.formatBytes(data.size)}\nLocation: ${data.location}`;
      case "failed":
        return `Backup failed!\nID: ${data.backupId}\nError: ${data.error}\nTime: ${new Date().toISOString()}`;
      default:
        return JSON.stringify(data);
    }
  }

  /**
   * Update statistics
   */
  updateStatistics(duration) {
    this.stats.totalBackups++;
    this.stats.successfulBackups++;
    this.stats.lastBackupTime = new Date();

    // Update average duration
    this.stats.averageDuration =
      (this.stats.averageDuration * (this.stats.successfulBackups - 1) +
        duration) /
      this.stats.successfulBackups;
  }

  /**
   * Get backup statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      lastBackup: this.stats.lastBackupTime,
      config: {
        retention: this.config.retention,
        cloudEnabled: this.config.cloud.enabled,
        encryptionEnabled: this.config.encryption.enabled,
      },
    };
  }

  /**
   * Clean temp directory
   */
  async cleanTempDirectory() {
    try {
      const files = await fs.readdir(this.config.paths.tempDir);

      for (const file of files) {
        const filePath = path.join(this.config.paths.tempDir, file);
        const stats = await fs.stat(filePath);
        const age = Date.now() - stats.mtimeMs;

        // Delete files older than 1 hour
        if (age > 3600000) {
          await fs.remove(filePath);
        }
      }
    } catch (error) {
      logger.error(`Failed to clean temp directory: ${error.message}`);
    }
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

// ============================================================
// COMMAND LINE INTERFACE
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const backupService = new BackupService();

  await backupService.initialize();

  if (args.includes("--backup")) {
    const type = args.includes("--incremental") ? "incremental" : "full";
    await backupService.createBackup(type);
  } else if (args.includes("--restore")) {
    const backupId = args[args.indexOf("--restore") + 1];
    if (!backupId) {
      console.error("Please provide backup ID: --restore <backupId>");
      process.exit(1);
    }
    await backupService.restoreBackup(backupId);
  } else if (args.includes("--list")) {
    const backups = await backupService.listBackups();
    console.log("Backups:", JSON.stringify(backups, null, 2));
  } else if (args.includes("--cleanup")) {
    await backupService.cleanupOldBackups();
  } else if (args.includes("--stats")) {
    const stats = backupService.getStats();
    console.log("Backup Statistics:", JSON.stringify(stats, null, 2));
  } else {
    console.log(`
Backup Service - Enterprise Backup Management
=============================================

Usage:
  node services/backupService.js [options]

Options:
  --backup              Create a new backup
  --incremental         Create incremental backup (with --backup)
  --restore <id>        Restore from backup ID
  --list                List all backups
  --cleanup             Clean up old backups
  --stats               Show backup statistics
  --help                Show this help message

Examples:
  node services/backupService.js --backup
  node services/backupService.js --backup --incremental
  node services/backupService.js --restore 1734567890123-abc123
  node services/backupService.js --list
`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

// Export for use in other modules
module.exports = { BackupService, BACKUP_CONFIG };
