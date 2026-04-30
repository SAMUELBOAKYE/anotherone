// scripts/logStats.js
// Log Statistics Viewer for KAAF Noticeboard System
// Usage: node scripts/logStats.js [options]

const fs = require("fs-extra");
const path = require("path");
const moment = require("moment");
const os = require("os");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const readline = require("readline");

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  logsDir: path.join(process.cwd(), "logs"),
  archivesDir: path.join(process.cwd(), "backups/logs"),

  // Analysis settings
  maxLinesToRead: 100000, // Maximum lines to read for analysis
  sampleSize: 10000, // Sample size for large files

  // Time ranges
  timeRanges: {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
  },

  // Log patterns
  patterns: {
    error: /ERROR|FATAL|CRITICAL/i,
    warning: /WARN|WARNING/i,
    info: /INFO|NOTICE/i,
    debug: /DEBUG/i,
    http: /HTTP\/\d\.\d"\s+\d{3}/i,
    api: /\/api\//i,
    auth: /login|logout|token|auth/i,
    database: /mongodb|mongoose|query|database/i,
    memory: /memory|heap|rss|gc/i,
  },

  // Output formats
  outputFormats: ["table", "json", "pretty", "csv", "html"],

  // Colors for CLI output
  colors: {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  },
};

// ============================================================
// LOG STATISTICS MANAGER
// ============================================================

class LogStatsManager {
  constructor(options = {}) {
    this.options = {
      format: options.format || "pretty",
      timeRange: options.timeRange || "24h",
      verbose: options.verbose || false,
      exportPath: options.exportPath || null,
      filterType: options.filterType || "all",
      sortBy: options.sortBy || "count",
      limit: options.limit || 20,
      ...options,
    };

    this.stats = {
      summary: {},
      errors: {},
      warnings: {},
      http: {},
      apis: {},
      timeline: {},
      size: {},
      performance: {},
      anomalies: [],
    };

    this.logger = new StatsLogger(this.options.verbose);
  }

  // ============================================================
  // DIRECTORY MANAGEMENT
  // ============================================================

  async ensureDirectories() {
    try {
      const dirs = [CONFIG.logsDir, CONFIG.archivesDir];
      for (const dir of dirs) {
        if (!(await fs.pathExists(dir))) {
          await fs.ensureDir(dir);
          this.logger.info(`Created directory: ${dir}`);
        }
      }
      return true;
    } catch (error) {
      this.logger.error("Failed to ensure directories", error);
      throw error;
    }
  }

  // ============================================================
  // FILE COLLECTION
  // ============================================================

  async collectLogFiles() {
    const files = [];

    try {
      // Get active log files
      if (await fs.pathExists(CONFIG.logsDir)) {
        const activeFiles = await fs.readdir(CONFIG.logsDir);
        for (const file of activeFiles) {
          if (file.match(/\.(log|json|txt)$/)) {
            const filePath = path.join(CONFIG.logsDir, file);
            const stats = await fs.stat(filePath);
            files.push({
              name: file,
              path: filePath,
              size: stats.size,
              modified: stats.mtime,
              created: stats.birthtime,
              type: "active",
            });
          }
        }
      }

      // Get archived log files
      if (await fs.pathExists(CONFIG.archivesDir)) {
        const archivedFiles = await fs.readdir(CONFIG.archivesDir);
        for (const file of archivedFiles) {
          if (file.match(/\.(log|json|txt|zip|gz)$/)) {
            const filePath = path.join(CONFIG.archivesDir, file);
            const stats = await fs.stat(filePath);
            files.push({
              name: file,
              path: filePath,
              size: stats.size,
              modified: stats.mtime,
              created: stats.birthtime,
              type: "archived",
            });
          }
        }
      }

      // Sort by modification date
      files.sort((a, b) => b.modified - a.modified);

      this.logger.info(`Found ${files.length} log files`);
      return files;
    } catch (error) {
      this.logger.error("Failed to collect log files", error);
      return [];
    }
  }

  // ============================================================
  // FILE ANALYSIS
  // ============================================================

  async analyzeFile(file) {
    const stats = {
      name: file.name,
      size: file.size,
      modified: file.modified,
      type: file.type,
      lineCount: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      debugCount: 0,
      uniqueIps: new Set(),
      uniqueEndpoints: new Set(),
      statusCodes: {},
      responseTimes: [],
      patterns: {},
    };

    try {
      // Skip compressed files for detailed analysis
      if (file.name.endsWith(".gz") || file.name.endsWith(".zip")) {
        stats.compressed = true;
        return stats;
      }

      const fileStream = fs.createReadStream(file.path);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let lineCount = 0;

      for await (const line of rl) {
        lineCount++;
        stats.lineCount = lineCount;

        // Limit analysis for large files
        if (lineCount > CONFIG.maxLinesToRead) {
          stats.truncated = true;
          break;
        }

        // Count log levels
        if (CONFIG.patterns.error.test(line)) {
          stats.errorCount++;
          this.extractErrorDetails(line, stats);
        } else if (CONFIG.patterns.warning.test(line)) {
          stats.warningCount++;
        } else if (CONFIG.patterns.info.test(line)) {
          stats.infoCount++;
        } else if (CONFIG.patterns.debug.test(line)) {
          stats.debugCount++;
        }

        // Extract HTTP status codes
        const httpMatch = line.match(/HTTP\/\d\.\d"\s+(\d{3})/);
        if (httpMatch) {
          const statusCode = httpMatch[1];
          stats.statusCodes[statusCode] =
            (stats.statusCodes[statusCode] || 0) + 1;
        }

        // Extract API endpoints
        const apiMatch = line.match(
          /"(?:GET|POST|PUT|DELETE|PATCH)\s+(\/api\/[^\s?]+)/,
        );
        if (apiMatch) {
          stats.uniqueEndpoints.add(apiMatch[1]);
        }

        // Extract response times
        const timeMatch = line.match(/(\d+)ms/);
        if (timeMatch) {
          stats.responseTimes.push(parseInt(timeMatch[1]));
        }

        // Count pattern matches
        for (const [patternName, pattern] of Object.entries(CONFIG.patterns)) {
          if (pattern.test(line)) {
            stats.patterns[patternName] =
              (stats.patterns[patternName] || 0) + 1;
          }
        }
      }

      fileStream.close();

      // Calculate response time statistics
      if (stats.responseTimes.length > 0) {
        stats.avgResponseTime =
          stats.responseTimes.reduce((a, b) => a + b, 0) /
          stats.responseTimes.length;
        stats.maxResponseTime = Math.max(...stats.responseTimes);
        stats.minResponseTime = Math.min(...stats.responseTimes);
      }

      stats.uniqueEndpointsCount = stats.uniqueEndpoints.size;

      return stats;
    } catch (error) {
      this.logger.error(`Failed to analyze file ${file.name}`, error);
      return stats;
    }
  }

  extractErrorDetails(line, stats) {
    // Extract error type
    const errorTypeMatch = line.match(
      /(ERROR|FATAL|CRITICAL):\s+(\w+Error|\w+Exception)/,
    );
    if (errorTypeMatch) {
      const errorType = errorTypeMatch[2];
      stats.errors[errorType] = (stats.errors[errorType] || 0) + 1;
    }

    // Extract stack trace indicator
    if (line.includes("at ") && line.includes("(")) {
      stats.hasStackTraces = (stats.hasStackTraces || 0) + 1;
    }
  }

  // ============================================================
  // TIMELINE ANALYSIS
  // ============================================================

  async analyzeTimeline(files) {
    const timeline = {};
    const timeRange =
      CONFIG.timeRanges[this.options.timeRange] || CONFIG.timeRanges["24h"];
    const now = Date.now();
    const cutoff = now - timeRange;

    for (const file of files) {
      if (file.modified.getTime() < cutoff) continue;

      const dateKey = moment(file.modified).format("YYYY-MM-DD HH:00");
      if (!timeline[dateKey]) {
        timeline[dateKey] = {
          hour: dateKey,
          fileCount: 0,
          totalSize: 0,
          errorCount: 0,
          warningCount: 0,
        };
      }

      timeline[dateKey].fileCount++;
      timeline[dateKey].totalSize += file.size;

      if (file.stats) {
        timeline[dateKey].errorCount += file.stats.errorCount || 0;
        timeline[dateKey].warningCount += file.stats.warningCount || 0;
      }
    }

    return Object.values(timeline).sort((a, b) => a.hour.localeCompare(b.hour));
  }

  // ============================================================
  // PERFORMANCE ANALYSIS
  // ============================================================

  async analyzePerformance() {
    const perf = {
      system: {
        platform: os.platform(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
      },
      process: {
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
      },
      disk: {},
    };

    // Get disk usage
    try {
      const { stdout } = await exec("df -h .");
      perf.disk.usage = stdout.trim();
    } catch (error) {
      this.logger.warn("Could not get disk usage", error);
    }

    return perf;
  }

  // ============================================================
  // ANOMALY DETECTION
  // ============================================================

  detectAnomalies(files) {
    const anomalies = [];

    // Check for unusually large files
    const avgSize = files.reduce((sum, f) => sum + f.size, 0) / files.length;
    for (const file of files) {
      if (file.size > avgSize * 3) {
        anomalies.push({
          type: "large_file",
          file: file.name,
          size: file.size,
          threshold: avgSize * 3,
          severity: "warning",
        });
      }
    }

    // Check for high error rates
    for (const file of files) {
      if (file.stats && file.stats.lineCount > 0) {
        const errorRate = (file.stats.errorCount / file.stats.lineCount) * 100;
        if (errorRate > 10) {
          anomalies.push({
            type: "high_error_rate",
            file: file.name,
            errorRate: errorRate.toFixed(2) + "%",
            severity: errorRate > 20 ? "critical" : "warning",
          });
        }
      }
    }

    // Check for recent errors
    const recentFiles = files.filter((f) =>
      moment(f.modified).isAfter(moment().subtract(1, "hour")),
    );
    if (recentFiles.length > 0) {
      const recentErrors = recentFiles.reduce(
        (sum, f) => sum + (f.stats?.errorCount || 0),
        0,
      );
      if (recentErrors > 50) {
        anomalies.push({
          type: "error_spike",
          errorsLastHour: recentErrors,
          severity: "critical",
        });
      }
    }

    return anomalies;
  }

  // ============================================================
  // REPORT GENERATION
  // ============================================================

  async generateReport(files) {
    const analyzedFiles = [];
    let totalSize = 0;
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalLines = 0;

    this.logger.info("Analyzing log files...");

    for (const file of files) {
      const fileStats = await this.analyzeFile(file);
      file.stats = fileStats;
      analyzedFiles.push(fileStats);

      totalSize += file.size;
      totalErrors += fileStats.errorCount || 0;
      totalWarnings += fileStats.warningCount || 0;
      totalLines += fileStats.lineCount || 0;
    }

    // Generate summary
    const summary = {
      generatedAt: new Date().toISOString(),
      timeRange: this.options.timeRange,
      totalFiles: files.length,
      totalSize: totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      totalLines: totalLines,
      totalErrors: totalErrors,
      totalWarnings: totalWarnings,
      errorRate:
        totalLines > 0
          ? ((totalErrors / totalLines) * 100).toFixed(2) + "%"
          : "0%",
      averageFileSize:
        files.length > 0 ? this.formatBytes(totalSize / files.length) : "0",
      oldestFile:
        files.length > 0
          ? moment(Math.min(...files.map((f) => f.modified))).fromNow()
          : "N/A",
      newestFile:
        files.length > 0
          ? moment(Math.max(...files.map((f) => f.modified))).fromNow()
          : "N/A",
    };

    // Get top errors
    const errorMap = new Map();
    for (const file of analyzedFiles) {
      if (file.errors) {
        for (const [error, count] of Object.entries(file.errors)) {
          errorMap.set(error, (errorMap.get(error) || 0) + count);
        }
      }
    }
    const topErrors = Array.from(errorMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, this.options.limit);

    // Get top status codes
    const statusMap = new Map();
    for (const file of analyzedFiles) {
      if (file.statusCodes) {
        for (const [code, count] of Object.entries(file.statusCodes)) {
          statusMap.set(code, (statusMap.get(code) || 0) + count);
        }
      }
    }
    const topStatusCodes = Array.from(statusMap.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);

    // Get timeline
    const timeline = await this.analyzeTimeline(files);

    // Get performance metrics
    const performance = await this.analyzePerformance();

    // Detect anomalies
    const anomalies = this.detectAnomalies(files);

    this.stats = {
      summary,
      topErrors,
      topStatusCodes,
      timeline,
      performance,
      anomalies,
      files: analyzedFiles.slice(0, 20), // Limit to top 20 files
    };

    return this.stats;
  }

  // ============================================================
  // OUTPUT FORMATTING
  // ============================================================

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  colorize(text, color) {
    if (this.options.format !== "pretty") return text;
    return `${CONFIG.colors[color]}${text}${CONFIG.colors.reset}`;
  }

  printPretty() {
    console.log("\n" + "=".repeat(80));
    console.log(this.colorize("📊 LOG STATISTICS REPORT", "bright"));
    console.log(
      this.colorize(
        `Generated: ${moment().format("YYYY-MM-DD HH:mm:ss")}`,
        "dim",
      ),
    );
    console.log("=".repeat(80));

    // Summary Section
    console.log("\n" + this.colorize("📈 SUMMARY", "cyan"));
    console.log("─".repeat(80));
    console.log(
      `  ${this.colorize("Total Files:", "yellow")} ${this.stats.summary.totalFiles}`,
    );
    console.log(
      `  ${this.colorize("Total Size:", "yellow")} ${this.stats.summary.totalSizeFormatted}`,
    );
    console.log(
      `  ${this.colorize("Total Lines:", "yellow")} ${this.stats.summary.totalLines.toLocaleString()}`,
    );
    console.log(
      `  ${this.colorize("Total Errors:", "yellow")} ${this.colorize(this.stats.summary.totalErrors, "red")}`,
    );
    console.log(
      `  ${this.colorize("Total Warnings:", "yellow")} ${this.colorize(this.stats.summary.totalWarnings, "yellow")}`,
    );
    console.log(
      `  ${this.colorize("Error Rate:", "yellow")} ${this.colorize(this.stats.summary.errorRate, this.stats.summary.totalErrors > 0 ? "red" : "green")}`,
    );
    console.log(
      `  ${this.colorize("Time Range:", "yellow")} ${this.options.timeRange}`,
    );

    // Top Errors Section
    if (this.stats.topErrors.length > 0) {
      console.log("\n" + this.colorize("🔥 TOP ERRORS", "red"));
      console.log("─".repeat(80));
      this.stats.topErrors.forEach((error, i) => {
        console.log(
          `  ${(i + 1).toString().padStart(2)}. ${this.colorize(error.name, "red")} - ${this.colorize(error.count.toString(), "bright")} occurrences`,
        );
      });
    }

    // HTTP Status Codes Section
    if (this.stats.topStatusCodes.length > 0) {
      console.log("\n" + this.colorize("🌐 HTTP STATUS CODES", "magenta"));
      console.log("─".repeat(80));
      this.stats.topStatusCodes.forEach(({ code, count }) => {
        let color = "green";
        if (code.startsWith("4")) color = "yellow";
        if (code.startsWith("5")) color = "red";
        console.log(
          `  ${this.colorize(code, color)}: ${count.toLocaleString()} requests`,
        );
      });
    }

    // Timeline Section
    if (this.stats.timeline.length > 0) {
      console.log("\n" + this.colorize("📅 TIMELINE (Last 24 hours)", "blue"));
      console.log("─".repeat(80));
      const recentTimeline = this.stats.timeline.slice(-12);
      recentTimeline.forEach((item) => {
        const hour = moment(item.hour).format("HH:00");
        const barLength = Math.min(
          50,
          Math.floor(
            (item.fileCount /
              Math.max(...recentTimeline.map((t) => t.fileCount))) *
              50,
          ),
        );
        const bar = "█".repeat(barLength);
        console.log(
          `  ${hour} | ${this.colorize(bar, "cyan")} ${item.fileCount} files`,
        );
      });
    }

    // Anomalies Section
    if (this.stats.anomalies.length > 0) {
      console.log("\n" + this.colorize("⚠️  ANOMALIES DETECTED", "yellow"));
      console.log("─".repeat(80));
      this.stats.anomalies.forEach((anomaly) => {
        const severityColor =
          anomaly.severity === "critical" ? "red" : "yellow";
        console.log(
          `  ${this.colorize("•", severityColor)} ${anomaly.type}: ${this.colorize(anomaly.severity.toUpperCase(), severityColor)}`,
        );
        if (anomaly.file) console.log(`    File: ${anomaly.file}`);
        if (anomaly.errorRate)
          console.log(`    Error Rate: ${anomaly.errorRate}`);
      });
    }

    // Performance Section
    console.log("\n" + this.colorize("⚡ PERFORMANCE", "green"));
    console.log("─".repeat(80));
    console.log(
      `  ${this.colorize("Memory Usage:", "yellow")} ${this.formatBytes(this.stats.performance.process.memoryUsage.heapUsed)} / ${this.formatBytes(this.stats.performance.process.memoryUsage.heapTotal)}`,
    );
    console.log(
      `  ${this.colorize("CPU Cores:", "yellow")} ${this.stats.performance.system.cpus}`,
    );
    console.log(
      `  ${this.colorize("Load Average:", "yellow")} ${this.stats.performance.system.loadAverage.join(", ")}`,
    );
    console.log(
      `  ${this.colorize("System Uptime:", "yellow")} ${this.formatDuration(this.stats.performance.system.uptime * 1000)}`,
    );

    console.log("\n" + "=".repeat(80));
    console.log(this.colorize("✓ Report generation complete", "green"));
    console.log("=".repeat(80) + "\n");
  }

  printTable() {
    console.table(this.stats.topErrors.slice(0, 10));
    console.table(this.stats.topStatusCodes.slice(0, 10));
    console.table([this.stats.summary]);
  }

  printJSON() {
    console.log(JSON.stringify(this.stats, null, 2));
  }

  printCSV() {
    // Header
    console.log("Metric,Value");
    console.log(`Generated,${moment().format()}`);
    console.log(`Total Files,${this.stats.summary.totalFiles}`);
    console.log(`Total Size,${this.stats.summary.totalSizeFormatted}`);
    console.log(`Total Errors,${this.stats.summary.totalErrors}`);
    console.log(`Error Rate,${this.stats.summary.errorRate}`);

    // Top errors
    console.log("\nTop Errors");
    console.log("Error Name,Count");
    this.stats.topErrors.forEach((error) => {
      console.log(`${error.name},${error.count}`);
    });
  }

  async exportReport() {
    if (!this.options.exportPath) return;

    const exportDir = path.dirname(this.options.exportPath);
    await fs.ensureDir(exportDir);

    let content = "";
    let format = path.extname(this.options.exportPath).substring(1);

    switch (format) {
      case "json":
        content = JSON.stringify(this.stats, null, 2);
        break;
      case "csv":
        // Generate CSV content
        const rows = [];
        rows.push(["Metric", "Value"]);
        rows.push(["Generated", moment().format()]);
        rows.push(["Total Files", this.stats.summary.totalFiles]);
        rows.push(["Total Size", this.stats.summary.totalSizeFormatted]);
        rows.push(["Total Errors", this.stats.summary.totalErrors]);
        content = rows.map((row) => row.join(",")).join("\n");
        break;
      case "html":
        content = this.generateHTMLReport();
        break;
      default:
        content = JSON.stringify(this.stats, null, 2);
    }

    await fs.writeFile(this.options.exportPath, content);
    this.logger.info(`Report exported to ${this.options.exportPath}`);
  }

  generateHTMLReport() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Log Statistics Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #666; margin-top: 30px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f9f9f9; border-radius: 5px; min-width: 150px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #4CAF50; }
        .metric-label { color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #4CAF50; color: white; }
        tr:hover { background: #f5f5f5; }
        .error { color: #f44336; }
        .warning { color: #ff9800; }
        .healthy { color: #4CAF50; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Log Statistics Report</h1>
        <p>Generated: ${moment().format("YYYY-MM-DD HH:mm:ss")}</p>
        
        <h2>Summary</h2>
        <div class="metric"><div class="metric-value">${this.stats.summary.totalFiles}</div><div class="metric-label">Total Files</div></div>
        <div class="metric"><div class="metric-value">${this.stats.summary.totalSizeFormatted}</div><div class="metric-label">Total Size</div></div>
        <div class="metric"><div class="metric-value ${this.stats.summary.totalErrors > 0 ? "error" : "healthy"}">${this.stats.summary.totalErrors}</div><div class="metric-label">Errors</div></div>
        <div class="metric"><div class="metric-value">${this.stats.summary.errorRate}</div><div class="metric-label">Error Rate</div></div>
        
        <h2>Top Errors</h2>
        <table>
            <tr><th>Error Type</th><th>Count</th></tr>
            ${this.stats.topErrors.map((e) => `<tr><td>${e.name}</td><td>${e.count}</td></tr>`).join("")}
        </table>
        
        <h2>HTTP Status Codes</h2>
        <table>
            <tr><th>Status Code</th><th>Count</th></tr>
            ${this.stats.topStatusCodes.map((s) => `<tr><td>${s.code}</td><td>${s.count}</td></tr>`).join("")}
        </table>
        
        ${
          this.stats.anomalies.length > 0
            ? `
        <h2>⚠️ Anomalies</h2>
        <table>
            <tr><th>Type</th><th>Severity</th><th>Details</th></tr>
            ${this.stats.anomalies.map((a) => `<tr><td>${a.type}</td><td class="${a.severity}">${a.severity}</td><td>${JSON.stringify(a)}</td></tr>`).join("")}
        </table>
        `
            : ""
        }
    </div>
</body>
</html>`;
  }

  // ============================================================
  // MAIN EXECUTION
  // ============================================================

  async execute() {
    try {
      console.log("\n" + "=".repeat(80));
      console.log("📊 LOG STATISTICS VIEWER");
      console.log("=".repeat(80));

      await this.ensureDirectories();

      const files = await this.collectLogFiles();

      if (files.length === 0) {
        this.logger.warn("No log files found");
        console.log("\n💡 No log files available for analysis\n");
        process.exit(0);
      }

      await this.generateReport(files);

      // Output based on format
      switch (this.options.format) {
        case "json":
          this.printJSON();
          break;
        case "table":
          this.printTable();
          break;
        case "csv":
          this.printCSV();
          break;
        case "pretty":
        default:
          this.printPretty();
      }

      // Export if requested
      if (this.options.exportPath) {
        await this.exportReport();
      }

      process.exit(0);
    } catch (error) {
      this.logger.error("Failed to generate statistics", error);
      process.exit(1);
    }
  }
}

// ============================================================
// STATS LOGGER
// ============================================================

class StatsLogger {
  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message) {
    if (this.verbose) {
      console.log(`ℹ️  ${message}`);
    }
  }

  warn(message) {
    console.warn(`⚠️  ${message}`);
  }

  error(message, error) {
    console.error(`❌ ${message}`);
    if (error && this.verbose) {
      console.error(error);
    }
  }
}

// ============================================================
// COMMAND LINE INTERFACE
// ============================================================

function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    format: "pretty",
    timeRange: "24h",
    verbose: false,
    exportPath: null,
    filterType: "all",
    sortBy: "count",
    limit: 20,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--format":
      case "-f":
        options.format = args[++i];
        if (!CONFIG.outputFormats.includes(options.format)) {
          console.error(
            `Invalid format. Choose from: ${CONFIG.outputFormats.join(", ")}`,
          );
          process.exit(1);
        }
        break;
      case "--time-range":
      case "-t":
        options.timeRange = args[++i];
        if (!CONFIG.timeRanges[options.timeRange]) {
          console.error(
            `Invalid time range. Choose from: ${Object.keys(CONFIG.timeRanges).join(", ")}`,
          );
          process.exit(1);
        }
        break;
      case "--export":
      case "-e":
        options.exportPath = args[++i];
        break;
      case "--limit":
      case "-l":
        options.limit = parseInt(args[++i]);
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
║                    LOG STATISTICS VIEWER                        ║
║                  KAAF Noticeboard System                        ║
╚════════════════════════════════════════════════════════════════╝

USAGE:
    node scripts/logStats.js [options]

OPTIONS:
    -f, --format <format>   Output format: ${CONFIG.outputFormats.join(", ")}
                            (default: pretty)
    
    -t, --time-range <range> Time range: ${Object.keys(CONFIG.timeRanges).join(", ")}
                            (default: 24h)
    
    -e, --export <path>     Export report to file
    
    -l, --limit <number>    Limit results (default: 20)
    
    -v, --verbose           Verbose output
    
    -h, --help             Show this help message

EXAMPLES:
    # Basic statistics
    node scripts/logStats.js
    
    # JSON output
    node scripts/logStats.js --format json
    
    # Export to HTML
    node scripts/logStats.js --export report.html
    
    # Last 7 days with verbose output
    node scripts/logStats.js --time-range 7d --verbose
    
    # CSV export with custom limit
    node scripts/logStats.js --format csv --export stats.csv --limit 50

    `);
}

// ============================================================
// EXECUTION
// ============================================================

if (require.main === module) {
  const options = parseArguments();
  const statsManager = new LogStatsManager(options);
  statsManager.execute().catch(console.error);
}

module.exports = { LogStatsManager, StatsLogger, CONFIG };
