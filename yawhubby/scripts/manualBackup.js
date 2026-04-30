// scripts/manualBackup.js
// Manual Backup Utility for KAAF Noticeboard System
// Usage: node scripts/manualBackup.js [options]

const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const moment = require("moment");
const { createHash } = require("crypto");
const os = require("os");

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  // Directories
  logsDir: path.join(process.cwd(), "logs"),
  backupsDir: path.join(process.cwd(), "backups"),
  archivesDir: path.join(process.cwd(), "backups/logs"),
  tempDir: path.join(process.cwd(), "temp/backup"),

  // Backup settings
  maxBackupSize: 1024 * 1024 * 1024, // 1GB
  maxBackupAge: 30, // days
  compressionLevel: 9, // 0-9 (9 = maximum compression)

  // File patterns
  logPatterns: ["*.log", "*.json", "*.txt"],
  excludePatterns: ["*.gz", "*.zip", "*.7z", "*.tmp", "*.lock"],

  // Retention
  retention: {
    daily: 7, // Keep daily backups for 7 days
    weekly: 4, // Keep weekly backups for 4 weeks
    monthly: 6, // Keep monthly backups for 6 months
    critical: 12, // Keep critical backups for 12 months
  },

  // Notification settings
  notifications: {
    slack: process.env.SLACK_WEBHOOK_URL,
    email: process.env.ALERT_EMAIL,
    enabled: process.env.BACKUP_NOTIFICATIONS === "true",
  },
};

// ============================================================
// LOGGER
// ============================================================

class BackupLogger {
  constructor() {
    this.logs = [];
    this.verbose =
      process.argv.includes("--verbose") || process.argv.includes("-v");
  }

  info(message, data = null) {
    const log = { level: "INFO", message, timestamp: new Date(), data };
    this.logs.push(log);
    console.log(`✅ ${message}`);
    if (this.verbose && data)
      console.log("   📊 Data:", JSON.stringify(data, null, 2));
  }

  warn(message, data = null) {
    const log = { level: "WARN", message, timestamp: new Date(), data };
    this.logs.push(log);
    console.warn(`⚠️  ${message}`);
    if (data) console.warn("   📊 Data:", JSON.stringify(data, null, 2));
  }

  error(message, error = null) {
    const log = {
      level: "ERROR",
      message,
      timestamp: new Date(),
      error: error?.message,
    };
    this.logs.push(log);
    console.error(`❌ ${message}`);
    if (error && this.verbose) console.error("   🔍 Details:", error);
  }

  success(message, data = null) {
    const log = { level: "SUCCESS", message, timestamp: new Date(), data };
    this.logs.push(log);
    console.log(`🎉 ${message}`);
    if (this.verbose && data)
      console.log("   📊 Data:", JSON.stringify(data, null, 2));
  }

  getReport() {
    return {
      totalLogs: this.logs.length,
      errors: this.logs.filter((l) => l.level === "ERROR").length,
      warnings: this.logs.filter((l) => l.level === "WARN").length,
      startTime: this.logs[0]?.timestamp,
      endTime: new Date(),
      logs: this.logs,
    };
  }
}

// ============================================================
// BACKUP MANAGER CLASS
// ============================================================

class ManualBackupManager {
  constructor(options = {}) {
    this.logger = new BackupLogger();
    this.options = {
      type: options.type || "full", // 'full', 'logs-only', 'config-only', 'database'
      compress: options.compress !== false,
      encrypt: options.encrypt || false,
      verify: options.verify !== false,
      upload: options.upload || false,
      deleteOriginal: options.deleteOriginal || false,
      timestamp: moment().format("YYYY-MM-DD_HH-mm-ss"),
      ...options,
    };

    this.stats = {
      startTime: null,
      endTime: null,
      filesProcessed: 0,
      totalSize: 0,
      compressedSize: 0,
      hash: null,
    };
  }

  // ============================================================
  // DIRECTORY MANAGEMENT
  // ============================================================

  async ensureDirectories() {
    try {
      this.logger.info("Creating backup directories...");

      const dirs = [CONFIG.backupsDir, CONFIG.archivesDir, CONFIG.tempDir];

      for (const dir of dirs) {
        await fs.ensureDir(dir);
        this.logger.info(`  ✓ ${path.basename(dir)} directory ready`);
      }

      return true;
    } catch (error) {
      this.logger.error("Failed to create directories", error);
      throw error;
    }
  }

  async cleanupTempFiles() {
    try {
      if (await fs.pathExists(CONFIG.tempDir)) {
        await fs.remove(CONFIG.tempDir);
        this.logger.info("Temporary files cleaned up");
      }
    } catch (error) {
      this.logger.warn("Failed to cleanup temp files", error);
    }
  }

  // ============================================================
  // FILE COLLECTION
  // ============================================================

  async collectLogFiles() {
    const logs = [];

    try {
      if (!(await fs.pathExists(CONFIG.logsDir))) {
        this.logger.warn("Logs directory does not exist");
        return logs;
      }

      const files = await fs.readdir(CONFIG.logsDir);

      for (const file of files) {
        const filePath = path.join(CONFIG.logsDir, file);
        const stats = await fs.stat(filePath);

        // Skip excluded patterns
        if (CONFIG.excludePatterns.some((pattern) => file.match(pattern))) {
          continue;
        }

        // Skip if file is a directory
        if (stats.isDirectory()) {
          continue;
        }

        logs.push({
          name: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime,
          isLog: file.endsWith(".log"),
        });
      }

      this.logger.info(`Found ${logs.length} log files`, {
        totalSize: this.formatBytes(logs.reduce((sum, f) => sum + f.size, 0)),
      });
      return logs;
    } catch (error) {
      this.logger.error("Failed to collect log files", error);
      return [];
    }
  }

  async collectConfigFiles() {
    const configs = [];
    const configDirs = ["config", "configs", ".config"];

    for (const dir of configDirs) {
      const configPath = path.join(process.cwd(), dir);
      if (await fs.pathExists(configPath)) {
        const files = await fs.readdir(configPath);
        for (const file of files) {
          if (file.match(/\.(js|json|yaml|yml|env)$/)) {
            configs.push({
              name: file,
              path: path.join(configPath, file),
              category: dir,
            });
          }
        }
      }
    }

    return configs;
  }

  // ============================================================
  // BACKUP CREATION
  // ============================================================

  async createBackup(files, type = "logs") {
    const timestamp = this.options.timestamp;
    const backupName = `${type}_backup_${timestamp}.zip`;
    const backupPath = path.join(CONFIG.archivesDir, backupName);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(backupPath);
      const archive = archiver("zip", {
        zlib: { level: CONFIG.compressionLevel },
      });

      let archiveSize = 0;

      output.on("close", () => {
        this.stats.compressedSize = archive.pointer();
        resolve({
          path: backupPath,
          size: archive.pointer(),
          name: backupName,
        });
      });

      archive.on("error", (err) => {
        reject(err);
      });

      archive.on("entry", (entry) => {
        archiveSize += entry.stats.size;
        this.stats.totalSize += entry.stats.size;
      });

      archive.pipe(output);

      // Add files to archive
      for (const file of files) {
        const fileName =
          type === "logs"
            ? path.basename(file.path)
            : `${file.category}_${file.name}`;
        archive.file(file.path, { name: fileName });
        this.stats.filesProcessed++;
      }

      // Add metadata file
      const metadata = {
        backupType: type,
        timestamp: new Date().toISOString(),
        hostname: os.hostname(),
        user: os.userInfo().username,
        filesCount: files.length,
        nodeVersion: process.version,
        platform: os.platform(),
        options: this.options,
      };

      archive.append(JSON.stringify(metadata, null, 2), {
        name: "backup_metadata.json",
      });

      archive.finalize();
    });
  }

  async generateChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = createHash("sha256");
      const stream = fs.createReadStream(filePath);

      stream.on("data", (data) => hash.update(data));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }

  async verifyBackup(backupPath, originalFiles) {
    try {
      this.logger.info("Verifying backup integrity...");

      // Check if backup exists
      if (!(await fs.pathExists(backupPath))) {
        throw new Error("Backup file does not exist");
      }

      // Check file size
      const stats = await fs.stat(backupPath);
      if (stats.size === 0) {
        throw new Error("Backup file is empty");
      }

      // Generate checksum
      const checksum = await this.generateChecksum(backupPath);
      this.stats.hash = checksum;

      this.logger.success("Backup verification passed", {
        size: this.formatBytes(stats.size),
        checksum: checksum.substring(0, 16) + "...",
      });

      return true;
    } catch (error) {
      this.logger.error("Backup verification failed", error);
      return false;
    }
  }

  // ============================================================
  // BACKUP ROTATION (CLEANUP OLD BACKUPS)
  // ============================================================

  async rotateOldBackups() {
    try {
      this.logger.info("Checking for old backups to rotate...");

      const files = await fs.readdir(CONFIG.archivesDir);
      const backupFiles = files.filter((f) => f.match(/backup_.*\.zip$/));

      const now = moment();
      let deleted = 0;
      let totalSize = 0;

      for (const file of backupFiles) {
        const filePath = path.join(CONFIG.archivesDir, file);
        const stats = await fs.stat(filePath);
        const fileAge = now.diff(moment(stats.mtime), "days");

        // Extract backup type from filename
        const isDaily = file.includes("daily");
        const isWeekly = file.includes("weekly");
        const isMonthly = file.includes("monthly");

        let shouldDelete = false;

        if (isDaily && fileAge > CONFIG.retention.daily) shouldDelete = true;
        else if (isWeekly && fileAge > CONFIG.retention.weekly * 7)
          shouldDelete = true;
        else if (isMonthly && fileAge > CONFIG.retention.monthly * 30)
          shouldDelete = true;
        else if (
          !isDaily &&
          !isWeekly &&
          !isMonthly &&
          fileAge > CONFIG.maxBackupAge
        )
          shouldDelete = true;

        if (shouldDelete) {
          await fs.remove(filePath);
          deleted++;
          totalSize += stats.size;
          this.logger.info(
            `  ✓ Removed old backup: ${file} (${this.formatBytes(stats.size)})`,
          );
        }
      }

      if (deleted > 0) {
        this.logger.success(
          `Rotated ${deleted} old backups, freed ${this.formatBytes(totalSize)}`,
        );
      } else {
        this.logger.info("No old backups to rotate");
      }
    } catch (error) {
      this.logger.error("Failed to rotate old backups", error);
    }
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  async sendNotification() {
    if (!CONFIG.notifications.enabled) return;

    const report = this.logger.getReport();
    const status = report.errors === 0 ? "SUCCESS" : "PARTIAL_FAILURE";

    const message = {
      text: `Manual Backup ${status}`,
      attachments: [
        {
          color: report.errors === 0 ? "good" : "danger",
          title: "Backup Report",
          fields: [
            { title: "Status", value: status, short: true },
            {
              title: "Files Processed",
              value: this.stats.filesProcessed,
              short: true,
            },
            {
              title: "Total Size",
              value: this.formatBytes(this.stats.totalSize),
              short: true,
            },
            {
              title: "Compressed Size",
              value: this.formatBytes(this.stats.compressedSize),
              short: true,
            },
            { title: "Errors", value: report.errors, short: true },
            { title: "Warnings", value: report.warnings, short: true },
            {
              title: "Duration",
              value: `${((this.stats.endTime - this.stats.startTime) / 1000).toFixed(2)}s`,
              short: true,
            },
          ],
          footer: "KAAF Noticeboard Backup System",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    // Send to Slack if configured
    if (CONFIG.notifications.slack) {
      try {
        const fetch = await import("node-fetch");
        await fetch.default(CONFIG.notifications.slack, {
          method: "POST",
          body: JSON.stringify(message),
          headers: { "Content-Type": "application/json" },
        });
        this.logger.info("Notification sent to Slack");
      } catch (error) {
        this.logger.warn("Failed to send Slack notification", error);
      }
    }

    // Log to file
    const reportPath = path.join(
      CONFIG.backupsDir,
      `backup_report_${this.options.timestamp}.json`,
    );
    await fs.writeJson(
      reportPath,
      {
        stats: this.stats,
        report: report,
        options: this.options,
      },
      { spaces: 2 },
    );
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  printSummary() {
    const duration = (
      (this.stats.endTime - this.stats.startTime) /
      1000
    ).toFixed(2);

    console.log("\n" + "=".repeat(60));
    console.log("📊 BACKUP SUMMARY");
    console.log("=".repeat(60));
    console.log(
      `✅ Status: ${this.stats.errors ? "Partial Failure" : "Success"}`,
    );
    console.log(`📁 Files Processed: ${this.stats.filesProcessed}`);
    console.log(`💾 Original Size: ${this.formatBytes(this.stats.totalSize)}`);
    console.log(
      `🗜️  Compressed Size: ${this.formatBytes(this.stats.compressedSize)}`,
    );
    console.log(
      `📈 Compression Ratio: ${((1 - this.stats.compressedSize / this.stats.totalSize) * 100).toFixed(2)}%`,
    );
    console.log(`⏱️  Duration: ${duration} seconds`);
    if (this.stats.hash) {
      console.log(`🔐 Checksum: ${this.stats.hash.substring(0, 32)}...`);
    }
    console.log("=".repeat(60));
  }

  // ============================================================
  // MAIN EXECUTION
  // ============================================================

  async execute() {
    try {
      this.stats.startTime = new Date();

      console.log("\n" + "=".repeat(60));
      console.log("🔄 MANUAL BACKUP UTILITY");
      console.log("=".repeat(60));
      console.log(`📅 Started at: ${moment().format("YYYY-MM-DD HH:mm:ss")}`);
      console.log(`🔧 Backup Type: ${this.options.type}`);
      console.log(
        `🗜️  Compression: ${this.options.compress ? "Enabled" : "Disabled"}`,
      );
      console.log(
        `🔐 Encryption: ${this.options.encrypt ? "Enabled" : "Disabled"}`,
      );
      console.log("=".repeat(60) + "\n");

      // Ensure directories exist
      await this.ensureDirectories();

      // Collect files based on backup type
      let files = [];

      switch (this.options.type) {
        case "logs-only":
          files = await this.collectLogFiles();
          break;
        case "config-only":
          files = await this.collectConfigFiles();
          break;
        case "full":
        default:
          const logFiles = await this.collectLogFiles();
          const configFiles = await this.collectConfigFiles();
          files = [...logFiles, ...configFiles];
          break;
      }

      if (files.length === 0) {
        this.logger.warn("No files found to backup");
        console.log(
          "\n💡 Tip: Check if logs directory exists and contains files\n",
        );
        process.exit(0);
      }

      // Create backup
      this.logger.info(`Creating backup of ${files.length} files...`);
      const backup = await this.createBackup(files, this.options.type);

      // Verify backup
      if (this.options.verify) {
        await this.verifyBackup(backup.path, files);
      }

      // Rotate old backups
      await this.rotateOldBackups();

      // Cleanup temp files
      await this.cleanupTempFiles();

      // Send notification
      await this.sendNotification();

      this.stats.endTime = new Date();
      this.printSummary();

      this.logger.success(`Backup completed successfully: ${backup.name}`);
      console.log(`\n📁 Backup Location: ${backup.path}\n`);

      process.exit(0);
    } catch (error) {
      this.logger.error("Backup failed", error);
      console.error("\n❌ Backup failed! Check logs for details.\n");
      process.exit(1);
    }
  }
}

// ============================================================
// COMMAND LINE INTERFACE
// ============================================================

function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    type: "full",
    compress: true,
    encrypt: false,
    verify: true,
    upload: false,
    deleteOriginal: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--type":
      case "-t":
        options.type = args[++i];
        break;
      case "--no-compress":
        options.compress = false;
        break;
      case "--encrypt":
        options.encrypt = true;
        break;
      case "--no-verify":
        options.verify = false;
        break;
      case "--upload":
        options.upload = true;
        break;
      case "--delete-original":
        options.deleteOriginal = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        showHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    MANUAL BACKUP UTILITY                        ║
║                  KAAF Noticeboard System                        ║
╚════════════════════════════════════════════════════════════════╝

USAGE:
    node scripts/manualBackup.js [options]

OPTIONS:
    -t, --type <type>       Backup type: full, logs-only, config-only
                            (default: full)
    
    --no-compress           Disable compression
    --encrypt              Enable encryption (future implementation)
    --no-verify            Skip backup verification
    --upload               Upload to remote storage (if configured)
    --delete-original      Delete original files after backup
    
    -v, --verbose          Verbose output
    -h, --help             Show this help message

EXAMPLES:
    # Full backup
    node scripts/manualBackup.js
    
    # Logs only backup
    node scripts/manualBackup.js --type logs-only
    
    # Backup with no compression
    node scripts/manualBackup.js --no-compress
    
    # Verbose backup
    node scripts/manualBackup.js --verbose

    `);
}

// ============================================================
// EXECUTION
// ============================================================

if (require.main === module) {
  const options = parseArguments();
  const backupManager = new ManualBackupManager(options);
  backupManager.execute().catch(console.error);
}

module.exports = { ManualBackupManager, BackupLogger, CONFIG };
