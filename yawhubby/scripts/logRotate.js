// scripts/logRotate.js
// Professional Log Rotation Service with Compression, Retention, and Monitoring
// Handles automatic log rotation, archiving, and cleanup for all system logs

const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const moment = require("moment");
const zlib = require("zlib");
const { createReadStream, createWriteStream } = require("fs");
const { pipeline } = require("stream");
const { promisify } = require("util");
const logger = require("../utils/logger");

const pipelineAsync = promisify(pipeline);

// ============================================================
// CONFIGURATION
// ============================================================

const LOG_CONFIG = {
  // Directories
  logsDir: path.join(process.cwd(), "logs"),
  archiveDir: path.join(process.cwd(), "logs/archives"),
  tempDir: path.join(process.cwd(), "logs/temp"),

  // File patterns
  logPatterns: {
    app: /^app.*\.log$/,
    error: /^error.*\.log$/,
    worker: /^worker.*\.log$/,
    cron: /^cron.*\.log$/,
    pm2: /^pm2.*\.log$/,
    combined: /^combined.*\.log$/,
    health: /^health.*\.log$/,
  },

  // Rotation settings
  rotation: {
    maxSize: parseInt(process.env.LOG_MAX_SIZE) || 100 * 1024 * 1024, // 100MB default
    maxAge: parseInt(process.env.LOG_MAX_AGE) || 30, // 30 days retention
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 10, // Keep 10 rotated files per log
    checkInterval: parseInt(process.env.LOG_CHECK_INTERVAL) || 3600000, // Check every hour
    rotateOnStartup: process.env.LOG_ROTATE_ON_STARTUP !== "false",
  },

  // Compression settings
  compression: {
    enabled: process.env.LOG_COMPRESSION_ENABLED !== "false",
    level: parseInt(process.env.LOG_COMPRESSION_LEVEL) || 9, // 1-9, 9 = best compression
    format: process.env.LOG_COMPRESSION_FORMAT || "gz", // gz, zip, or none
    deleteOriginal: process.env.LOG_DELETE_ORIGINAL !== "false",
  },

  // Retention policies
  retention: {
    daily: parseInt(process.env.LOG_RETENTION_DAILY) || 7, // Keep daily logs for 7 days
    weekly: parseInt(process.env.LOG_RETENTION_WEEKLY) || 30, // Keep weekly logs for 30 days
    monthly: parseInt(process.env.LOG_RETENTION_MONTHLY) || 365, // Keep monthly logs for 1 year
    critical: parseInt(process.env.LOG_RETENTION_CRITICAL) || 0, // Keep critical logs forever
  },

  // Monitoring
  monitoring: {
    enabled: process.env.LOG_MONITORING_ENABLED !== "false",
    alertThreshold: parseInt(process.env.LOG_ALERT_THRESHOLD) || 90, // Alert when disk usage > 90%
    checkDiskSpace: true,
    sendAlerts: process.env.LOG_SEND_ALERTS === "true",
  },

  // Log analysis
  analysis: {
    enabled: process.env.LOG_ANALYSIS_ENABLED !== "false",
    generateReport: process.env.LOG_GENERATE_REPORT !== "false",
    reportPath: path.join(process.cwd(), "logs/reports"),
  },
};

// ============================================================
// LOG ROTATION MANAGER
// ============================================================

class LogRotationManager {
  constructor(config = LOG_CONFIG) {
    this.config = config;
    this.stats = {
      rotated: 0,
      compressed: 0,
      deleted: 0,
      errors: 0,
      totalSizeSaved: 0,
      startTime: new Date(),
    };

    this.isRotating = false;
    this.intervalId = null;
  }

  /**
   * Initialize log rotation service
   */
  async initialize() {
    try {
      console.log("🔄 Initializing Log Rotation Service...");

      // Create required directories
      await this.ensureDirectories();

      // Run initial rotation if configured
      if (this.config.rotation.rotateOnStartup) {
        await this.rotateAllLogs();
      }

      // Start monitoring interval
      this.startMonitoring();

      // Setup cleanup schedule
      this.setupCleanupSchedule();

      console.log("✅ Log Rotation Service initialized successfully");

      // Log initial stats
      await this.logInitialStats();
    } catch (error) {
      console.error("❌ Failed to initialize log rotation:", error.message);
      throw error;
    }
  }

  /**
   * Ensure all required directories exist
   */
  async ensureDirectories() {
    await fs.ensureDir(this.config.logsDir);
    await fs.ensureDir(this.config.archiveDir);
    await fs.ensureDir(this.config.tempDir);

    if (this.config.analysis.enabled) {
      await fs.ensureDir(this.config.analysis.reportPath);
    }
  }

  /**
   * Rotate all log files
   */
  async rotateAllLogs() {
    if (this.isRotating) {
      console.log("⚠️ Log rotation already in progress, skipping...");
      return;
    }

    this.isRotating = true;
    const startTime = Date.now();

    try {
      console.log("🔄 Starting log rotation...");

      const files = await fs.readdir(this.config.logsDir);
      const logFiles = files.filter((file) => this.isLogFile(file));

      for (const file of logFiles) {
        await this.rotateSingleLog(file);
      }

      // Clean up old archives
      await this.cleanupOldArchives();

      // Check disk space
      if (this.config.monitoring.checkDiskSpace) {
        await this.checkDiskSpace();
      }

      // Generate report if enabled
      if (this.config.analysis.enabled && this.config.analysis.generateReport) {
        await this.generateRotationReport();
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Log rotation completed in ${duration}ms`, this.stats);
    } catch (error) {
      console.error("❌ Log rotation failed:", error.message);
      this.stats.errors++;
    } finally {
      this.isRotating = false;
    }
  }

  /**
   * Rotate a single log file
   * @param {string} filename - Name of log file to rotate
   */
  async rotateSingleLog(filename) {
    const filePath = path.join(this.config.logsDir, filename);

    try {
      const stats = await fs.stat(filePath);

      // Check if rotation is needed
      if (stats.size < this.config.rotation.maxSize) {
        return;
      }

      const timestamp = moment().format("YYYY-MM-DD_HH-mm-ss");
      const baseName = path.basename(filename, ".log");
      const rotatedFilename = `${baseName}.${timestamp}.log`;
      const rotatedPath = path.join(this.config.tempDir, rotatedFilename);

      // Move current log to temp location
      await fs.move(filePath, rotatedPath, { overwrite: true });

      // Create new empty log file
      await fs.writeFile(filePath, "");

      // Compress if enabled
      let archivePath = rotatedPath;
      if (this.config.compression.enabled) {
        archivePath = await this.compressLog(rotatedPath, baseName, timestamp);
        await fs.remove(rotatedPath);
      }

      // Move to archive directory
      const finalPath = path.join(
        this.config.archiveDir,
        path.basename(archivePath),
      );
      await fs.move(archivePath, finalPath, { overwrite: true });

      // Update stats
      this.stats.rotated++;
      this.stats.totalSizeSaved += stats.size;

      console.log(`✅ Rotated: ${filename} (${this.formatBytes(stats.size)})`);

      return finalPath;
    } catch (error) {
      console.error(`❌ Failed to rotate ${filename}:`, error.message);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Compress a log file
   * @param {string} filePath - Path to file to compress
   * @param {string} baseName - Base name of the log
   * @param {string} timestamp - Timestamp for the archive
   */
  async compressLog(filePath, baseName, timestamp) {
    const extension = this.config.compression.format === "zip" ? ".zip" : ".gz";
    const archivePath = path.join(
      this.config.tempDir,
      `${baseName}.${timestamp}${extension}`,
    );

    try {
      if (this.config.compression.format === "zip") {
        await this.createZipArchive(filePath, archivePath);
      } else {
        await this.createGzipArchive(filePath, archivePath);
      }

      this.stats.compressed++;
      console.log(
        `✅ Compressed: ${path.basename(filePath)} -> ${path.basename(archivePath)}`,
      );

      return archivePath;
    } catch (error) {
      console.error(`❌ Failed to compress ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Create GZIP archive
   */
  async createGzipArchive(sourcePath, destPath) {
    return new Promise((resolve, reject) => {
      const gzip = zlib.createGzip({ level: this.config.compression.level });
      const source = createReadStream(sourcePath);
      const destination = createWriteStream(destPath);

      pipeline(source, gzip, destination, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Create ZIP archive
   */
  async createZipArchive(sourcePath, destPath) {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(destPath);
      const archive = archiver("zip", {
        zlib: { level: this.config.compression.level },
      });

      output.on("close", resolve);
      archive.on("error", reject);

      archive.pipe(output);
      archive.file(sourcePath, { name: path.basename(sourcePath) });
      archive.finalize();
    });
  }

  /**
   * Clean up old archives based on retention policy
   */
  async cleanupOldArchives() {
    try {
      const archives = await fs.readdir(this.config.archiveDir);
      const now = moment();

      for (const archive of archives) {
        const archivePath = path.join(this.config.archiveDir, archive);
        const stats = await fs.stat(archivePath);
        const age = now.diff(moment(stats.mtime), "days");

        // Determine archive type from filename
        let retention = this.config.retention.monthly; // Default

        if (archive.includes("daily") || archive.includes("app")) {
          retention = this.config.retention.daily;
        } else if (archive.includes("weekly") || archive.includes("error")) {
          retention = this.config.retention.weekly;
        } else if (archive.includes("critical")) {
          retention = this.config.retention.critical;
        }

        // Delete if older than retention period
        if (retention > 0 && age > retention) {
          await fs.remove(archivePath);
          this.stats.deleted++;
          console.log(`🗑️ Deleted old archive: ${archive} (${age} days old)`);
        }
      }
    } catch (error) {
      console.error("Failed to cleanup old archives:", error.message);
    }
  }

  /**
   * Check disk space and send alerts if needed
   */
  async checkDiskSpace() {
    try {
      const disk = require("diskusage");
      const stats = await disk.check(this.config.logsDir);
      const usagePercent = (stats.used / stats.total) * 100;

      if (usagePercent > this.config.monitoring.alertThreshold) {
        const warning = `⚠️ Disk usage critical: ${usagePercent.toFixed(1)}% (${this.formatBytes(stats.used)}/${this.formatBytes(stats.total)})`;
        console.warn(warning);

        if (this.config.monitoring.sendAlerts) {
          await this.sendAlert(warning);
        }
      }

      return { usagePercent, free: stats.free, total: stats.total };
    } catch (error) {
      console.error("Failed to check disk space:", error.message);
      return null;
    }
  }

  /**
   * Send alert notification
   * @param {string} message - Alert message
   */
  async sendAlert(message) {
    try {
      // Send to logger
      logger.warn(message);

      // Could integrate with Slack, Email, etc.
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackAlert(message);
      }

      if (process.env.SENTRY_ENABLED === "true") {
        const Sentry = require("@sentry/node");
        Sentry.captureMessage(message, "warning");
      }
    } catch (error) {
      console.error("Failed to send alert:", error.message);
    }
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(message) {
    try {
      const axios = require("axios");
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: `🚨 *Log Rotation Alert*\n${message}\n*Server:* ${process.env.NODE_ENV}\n*Time:* ${new Date().toISOString()}`,
      });
    } catch (error) {
      console.error("Failed to send Slack alert:", error.message);
    }
  }

  /**
   * Generate rotation report
   */
  async generateRotationReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        stats: this.stats,
        config: {
          maxSize: this.formatBytes(this.config.rotation.maxSize),
          retention: this.config.retention,
          compression: this.config.compression.format,
        },
        diskSpace: await this.checkDiskSpace(),
        archives: await this.getArchiveSummary(),
      };

      const reportPath = path.join(
        this.config.analysis.reportPath,
        `rotation-report-${moment().format("YYYY-MM-DD")}.json`,
      );
      await fs.writeJson(reportPath, report, { spaces: 2 });

      console.log(`📊 Rotation report generated: ${reportPath}`);
    } catch (error) {
      console.error("Failed to generate report:", error.message);
    }
  }

  /**
   * Get archive summary
   */
  async getArchiveSummary() {
    try {
      const archives = await fs.readdir(this.config.archiveDir);
      let totalSize = 0;
      const byMonth = {};

      for (const archive of archives) {
        const stats = await fs.stat(path.join(this.config.archiveDir, archive));
        totalSize += stats.size;

        const month = moment(stats.mtime).format("YYYY-MM");
        byMonth[month] = (byMonth[month] || 0) + 1;
      }

      return {
        totalFiles: archives.length,
        totalSize: this.formatBytes(totalSize),
        byMonth,
      };
    } catch (error) {
      console.error("Failed to get archive summary:", error.message);
      return null;
    }
  }

  /**
   * Start monitoring interval
   */
  startMonitoring() {
    this.intervalId = setInterval(async () => {
      await this.rotateAllLogs();
    }, this.config.rotation.checkInterval);

    console.log(
      `⏰ Log rotation monitoring started (interval: ${this.config.rotation.checkInterval / 1000}s)`,
    );
  }

  /**
   * Setup cleanup schedule (runs daily at 2 AM)
   */
  setupCleanupSchedule() {
    // Run cleanup daily at 2 AM
    const schedule = require("node-cron");

    schedule.schedule("0 2 * * *", async () => {
      console.log("🧹 Running scheduled log cleanup...");
      await this.cleanupOldArchives();
      await this.checkDiskSpace();
    });

    console.log("📅 Log cleanup scheduled for 2:00 AM daily");
  }

  /**
   * Log initial statistics
   */
  async logInitialStats() {
    const archives = await fs.readdir(this.config.archiveDir);
    const totalArchives = archives.length;
    let totalSize = 0;

    for (const archive of archives) {
      const stats = await fs.stat(path.join(this.config.archiveDir, archive));
      totalSize += stats.size;
    }

    console.log("📊 Log Rotation Statistics:", {
      archiveCount: totalArchives,
      archiveSize: this.formatBytes(totalSize),
      config: {
        maxSize: this.formatBytes(this.config.rotation.maxSize),
        retention: `${this.config.retention.daily}d/${this.config.retention.weekly}d/${this.config.retention.monthly}d`,
        compression: this.config.compression.format,
      },
    });
  }

  /**
   * Check if file is a log file
   * @param {string} filename - File name to check
   */
  isLogFile(filename) {
    for (const pattern of Object.values(this.config.logPatterns)) {
      if (pattern.test(filename)) {
        return true;
      }
    }
    return filename.endsWith(".log");
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
   * Stop the rotation service
   */
  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log("🛑 Log rotation service stopped");
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime,
      isRotating: this.isRotating,
      config: {
        maxSize: this.formatBytes(this.config.rotation.maxSize),
        checkInterval: `${this.config.rotation.checkInterval / 1000}s`,
        compression: this.config.compression.enabled
          ? this.config.compression.format
          : "disabled",
      },
    };
  }
}

// ============================================================
// COMMAND LINE INTERFACE
// ============================================================

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    force: args.includes("--force") || args.includes("-f"),
    once: args.includes("--once") || args.includes("-o"),
    stats: args.includes("--stats") || args.includes("-s"),
    cleanup: args.includes("--cleanup") || args.includes("-c"),
    help: args.includes("--help") || args.includes("-h"),
  };

  return options;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Log Rotation Service - Enterprise Log Management
=================================================

Usage:
  node scripts/logRotate.js [options]

Options:
  -f, --force     Force immediate log rotation
  -o, --once      Run rotation once and exit
  -s, --stats     Display current statistics
  -c, --cleanup   Force cleanup of old archives
  -h, --help      Show this help message

Examples:
  node scripts/logRotate.js              # Start continuous monitoring
  node scripts/logRotate.js --force      # Force immediate rotation
  node scripts/logRotate.js --once       # Run once and exit
  node scripts/logRotate.js --stats      # Show statistics only
  node scripts/logRotate.js --cleanup    # Force cleanup only

Environment Variables:
  LOG_MAX_SIZE          Max log file size (default: 100MB)
  LOG_MAX_AGE           Max archive age in days (default: 30)
  LOG_MAX_FILES         Max rotated files to keep (default: 10)
  LOG_COMPRESSION_LEVEL Compression level 1-9 (default: 9)
  LOG_RETENTION_DAILY    Daily logs retention days (default: 7)
  LOG_RETENTION_WEEKLY   Weekly logs retention days (default: 30)
  LOG_RETENTION_MONTHLY  Monthly logs retention days (default: 365)
`);
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  const manager = new LogRotationManager();

  try {
    if (options.stats) {
      await manager.ensureDirectories();
      const stats = manager.getStats();
      console.log(
        "📊 Log Rotation Statistics:",
        JSON.stringify(stats, null, 2),
      );
      process.exit(0);
    }

    if (options.cleanup) {
      await manager.ensureDirectories();
      console.log("🧹 Force cleaning old archives...");
      await manager.cleanupOldArchives();
      console.log("✅ Cleanup completed");
      process.exit(0);
    }

    if (options.force || options.once) {
      await manager.initialize();
      await manager.rotateAllLogs();

      if (options.once) {
        console.log("✅ One-time rotation completed");
        process.exit(0);
      }
    }

    if (!options.once) {
      await manager.initialize();
      console.log("🔄 Log rotation service is running. Press Ctrl+C to stop.");

      // Handle graceful shutdown
      process.on("SIGINT", async () => {
        console.log("\n🛑 Shutting down log rotation service...");
        await manager.stop();
        process.exit(0);
      });

      process.on("SIGTERM", async () => {
        await manager.stop();
        process.exit(0);
      });
    }
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for use in other scripts
module.exports = { LogRotationManager, LOG_CONFIG };
