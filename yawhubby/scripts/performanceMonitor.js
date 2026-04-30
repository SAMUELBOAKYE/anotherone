// scripts/performanceMonitor.js - Windows Compatible Performance Monitor
// Enterprise Performance Monitoring Service - No Native Dependencies
// Tracks system metrics, application performance, and provides real-time alerts

const os = require("os");
const mongoose = require("mongoose");
const moment = require("moment");
const fs = require("fs-extra");
const path = require("path");
const checkDiskSpace = require("check-disk-space");

// ============================================================
// CONFIGURATION
// ============================================================

const MONITOR_CONFIG = {
  // Collection intervals
  intervals: {
    metrics: parseInt(process.env.MONITOR_INTERVAL) || 30000, // 30 seconds
    detailed: parseInt(process.env.MONITOR_DETAILED_INTERVAL) || 300000, // 5 minutes
    alert: parseInt(process.env.MONITOR_ALERT_INTERVAL) || 60000, // 1 minute
  },

  // Alert thresholds
  thresholds: {
    cpu: {
      warning: parseFloat(process.env.CPU_WARNING_THRESHOLD) || 70, // 70%
      critical: parseFloat(process.env.CPU_CRITICAL_THRESHOLD) || 85, // 85%
    },
    memory: {
      warning: parseFloat(process.env.MEMORY_WARNING_THRESHOLD) || 75, // 75%
      critical: parseFloat(process.env.MEMORY_CRITICAL_THRESHOLD) || 90, // 90%
    },
    heap: {
      warning: parseFloat(process.env.HEAP_WARNING_THRESHOLD) || 80, // 80%
      critical: parseFloat(process.env.HEAP_CRITICAL_THRESHOLD) || 90, // 90%
    },
    disk: {
      warning: parseFloat(process.env.DISK_WARNING_THRESHOLD) || 80, // 80%
      critical: parseFloat(process.env.DISK_CRITICAL_THRESHOLD) || 90, // 90%
    },
    eventLoop: {
      warning: parseFloat(process.env.EVENT_LOOP_WARNING) || 50, // 50ms
      critical: parseFloat(process.env.EVENT_LOOP_CRITICAL) || 100, // 100ms
    },
    activeConnections: {
      warning: parseInt(process.env.CONNECTION_WARNING) || 1000,
      critical: parseInt(process.env.CONNECTION_CRITICAL) || 2000,
    },
  },

  // Retention settings
  retention: {
    metrics: parseInt(process.env.METRICS_RETENTION_DAYS) || 30,
    detailed: parseInt(process.env.DETAILED_RETENTION_DAYS) || 7,
  },

  // Monitoring features
  features: {
    trackDatabase: process.env.TRACK_DATABASE !== "false",
    trackNetwork: process.env.TRACK_NETWORK !== "false",
    alertOnThreshold: process.env.ALERT_ON_THRESHOLD !== "false",
    saveToDatabase: process.env.SAVE_METRICS_TO_DB === "true",
  },

  // Export settings
  export: {
    enabled: process.env.EXPORT_METRICS === "true",
    format: process.env.EXPORT_FORMAT || "json",
    path: process.env.EXPORT_PATH || "./metrics",
  },
};

// ============================================================
// PERFORMANCE MONITOR CLASS
// ============================================================

class PerformanceMonitor {
  constructor(config = MONITOR_CONFIG) {
    this.config = config;
    this.metrics = [];
    this.alerts = [];
    this.startTime = Date.now();
    this.previousMetrics = null;
    this.intervalIds = [];
    this.isMonitoring = false;

    // Metrics history
    this.history = {
      cpu: [],
      memory: [],
      heap: [],
      responseTime: [],
      activeConnections: [],
    };

    // Statistics
    this.stats = {
      totalSamples: 0,
      alertsTriggered: 0,
      averageResponseTime: 0,
      peakMemoryUsage: 0,
      peakCpuUsage: 0,
      uptimePercentage: 100,
      lastAlertTime: null,
    };

    // Logger
    this.logger = console;
  }

  /**
   * Initialize the performance monitor
   */
  async initialize() {
    try {
      this.logger.log("📊 Initializing Performance Monitor...");

      // Validate database connection if saving metrics
      if (this.config.features.saveToDatabase) {
        await this.validateDatabaseConnection();
      }

      // Start monitoring intervals
      this.startMonitoring();

      // Log initial system info
      await this.logSystemInfo();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      this.logger.log("✅ Performance Monitor initialized successfully");
    } catch (error) {
      this.logger.error(
        `Failed to initialize performance monitor: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Validate database connection
   */
  async validateDatabaseConnection() {
    if (mongoose.connection.readyState !== 1) {
      this.logger.warn("Database not connected, metrics will not be saved");
      this.config.features.saveToDatabase = false;
    }
  }

  /**
   * Start all monitoring intervals
   */
  startMonitoring() {
    this.isMonitoring = true;

    // Regular metrics collection
    const metricsInterval = setInterval(async () => {
      await this.collectMetrics();
    }, this.config.intervals.metrics);
    this.intervalIds.push(metricsInterval);

    // Detailed metrics collection
    const detailedInterval = setInterval(async () => {
      await this.collectDetailedMetrics();
    }, this.config.intervals.detailed);
    this.intervalIds.push(detailedInterval);

    // Alert checking
    const alertInterval = setInterval(async () => {
      await this.checkThresholds();
    }, this.config.intervals.alert);
    this.intervalIds.push(alertInterval);

    this.logger.log(
      `📊 Monitoring started - Metrics: ${this.config.intervals.metrics}ms, Alerts: ${this.config.intervals.alert}ms`,
    );
  }

  /**
   * Collect basic system metrics
   */
  async collectMetrics() {
    try {
      const metrics = await this.getSystemMetrics();

      // Add to history
      this.addToHistory(metrics);

      // Update statistics
      this.updateStatistics(metrics);

      // Save to database
      if (this.config.features.saveToDatabase) {
        await this.saveMetricsToDatabase(metrics);
      }

      // Export metrics if enabled
      if (this.config.export.enabled) {
        await this.exportMetrics(metrics);
      }

      // Emit for real-time monitoring
      this.emitMetrics(metrics);

      // Log metrics (optional)
      if (process.env.DEBUG_METRICS === "true") {
        this.logger.debug(
          "Performance metrics collected",
          this.formatMetricsForLog(metrics),
        );
      }

      this.stats.totalSamples++;
      this.metrics.push(metrics);

      // Clean old metrics
      this.cleanOldMetrics();

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to collect metrics: ${error.message}`);
      return null;
    }
  }

  /**
   * Collect detailed metrics
   */
  async collectDetailedMetrics() {
    try {
      const detailed = {
        timestamp: new Date(),
        heapSnapshot: await this.getHeapSnapshot(),
        handleCount: process._getActiveHandles().length,
        requestCount: process._getActiveRequests().length,
      };

      if (this.config.features.saveToDatabase) {
        await this.saveDetailedMetrics(detailed);
      }

      if (process.env.DEBUG_METRICS === "true") {
        this.logger.debug("Detailed metrics collected", detailed);
      }

      return detailed;
    } catch (error) {
      this.logger.error(`Failed to collect detailed metrics: ${error.message}`);
      return null;
    }
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = await this.getCPUUsage();
    const diskUsage = await this.getDiskUsage();
    const networkStats = this.config.features.trackNetwork
      ? await this.getNetworkStats()
      : null;

    return {
      timestamp: new Date(),

      // Memory metrics
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        heapUsedPercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        rssPercent: (memoryUsage.rss / os.totalmem()) * 100,
        arrayBuffers: memoryUsage.arrayBuffers || 0,
      },

      // CPU metrics
      cpu: {
        usage: cpuUsage,
        loadAvg1m: os.loadavg()[0],
        loadAvg5m: os.loadavg()[1],
        loadAvg15m: os.loadavg()[2],
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || "Unknown",
        speed: os.cpus()[0]?.speed || 0,
      },

      // System metrics
      system: {
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        usedMemory: os.totalmem() - os.freemem(),
        memoryUsagePercent:
          ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpus: os.cpus().length,
      },

      // Application metrics
      application: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        pid: process.pid,
        title: process.title,
        execPath: process.execPath,
      },

      // Database metrics
      database: this.config.features.trackDatabase
        ? await this.getDatabaseMetrics()
        : null,

      // Disk metrics
      disk: diskUsage,

      // Network metrics
      network: networkStats,

      // Response time metrics
      responseTime: await this.getAverageResponseTime(),

      // Active connections
      activeConnections: await this.getActiveConnections(),
    };
  }

  /**
   * Get CPU usage percentage (Windows compatible)
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = Date.now();

        const totalUser = endUsage.user;
        const totalSystem = endUsage.system;
        const total = totalUser + totalSystem;
        const percent = (total / (endTime - startTime) / 1000) * 100;

        resolve(Math.min(percent, 100));
      }, 100);
    });
  }

  /**
   * Get disk usage metrics (Windows compatible)
   */
  async getDiskUsage() {
    try {
      const stats = await checkDiskSpace(process.cwd());

      return {
        total: stats.size,
        free: stats.free,
        used: stats.size - stats.free,
        usedPercent: ((stats.size - stats.free) / stats.size) * 100,
        freePercent: (stats.free / stats.size) * 100,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get database metrics
   */
  async getDatabaseMetrics() {
    try {
      if (mongoose.connection.readyState !== 1) {
        return { status: "disconnected" };
      }

      const db = mongoose.connection.db;
      const stats = await db.stats();

      return {
        status: "connected",
        collections: stats.collections,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        ok: stats.ok,
      };
    } catch (error) {
      return { error: error.message, status: "error" };
    }
  }

  /**
   * Get network statistics
   */
  async getNetworkStats() {
    try {
      const networkInterfaces = os.networkInterfaces();
      const stats = {
        interfaces: [],
        totalConnections: 0,
      };

      for (const [name, interfaces] of Object.entries(networkInterfaces)) {
        for (const iface of interfaces) {
          if (!iface.internal) {
            stats.interfaces.push({
              name,
              address: iface.address,
              family: iface.family,
              mac: iface.mac,
            });
          }
        }
      }

      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get average response time
   */
  async getAverageResponseTime() {
    return {
      average: this.stats.averageResponseTime,
      lastMinute: 0,
      total: 0,
    };
  }

  /**
   * Get active connections count
   */
  async getActiveConnections() {
    try {
      // Get MongoDB connections
      const dbConnections =
        mongoose.connection.readyState === 1
          ? mongoose.connection.client?.topology?.s?.pool?.size() || 0
          : 0;

      return {
        database: dbConnections,
        http: 0,
        total: dbConnections,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get heap snapshot
   */
  async getHeapSnapshot() {
    const heapStats = process.memoryUsage();

    return {
      heapUsed: heapStats.heapUsed,
      heapTotal: heapStats.heapTotal,
      heapUsedPercent: (heapStats.heapUsed / heapStats.heapTotal) * 100,
      external: heapStats.external,
      rss: heapStats.rss,
    };
  }

  /**
   * Add metrics to history
   */
  addToHistory(metrics) {
    const maxHistory = 100;

    this.history.cpu.push({
      timestamp: metrics.timestamp,
      value: metrics.cpu.usage,
    });
    this.history.memory.push({
      timestamp: metrics.timestamp,
      value: metrics.memory.heapUsedPercent,
    });
    this.history.heap.push({
      timestamp: metrics.timestamp,
      value: metrics.memory.heapUsed,
    });

    if (this.history.cpu.length > maxHistory) this.history.cpu.shift();
    if (this.history.memory.length > maxHistory) this.history.memory.shift();
    if (this.history.heap.length > maxHistory) this.history.heap.shift();
  }

  /**
   * Update statistics
   */
  updateStatistics(metrics) {
    // Update peak memory usage
    if (metrics.memory.heapUsed > this.stats.peakMemoryUsage) {
      this.stats.peakMemoryUsage = metrics.memory.heapUsed;
    }

    // Update peak CPU usage
    if (metrics.cpu.usage > this.stats.peakCpuUsage) {
      this.stats.peakCpuUsage = metrics.cpu.usage;
    }

    // Update average response time
    if (metrics.responseTime?.average) {
      this.stats.averageResponseTime =
        (this.stats.averageResponseTime * (this.stats.totalSamples - 1) +
          metrics.responseTime.average) /
        this.stats.totalSamples;
    }
  }

  /**
   * Check thresholds and trigger alerts
   */
  async checkThresholds() {
    if (!this.config.features.alertOnThreshold) return;

    const latestMetrics = this.metrics[this.metrics.length - 1];
    if (!latestMetrics) return;

    const alerts = [];

    // Check CPU threshold
    if (latestMetrics.cpu.usage > this.config.thresholds.cpu.critical) {
      alerts.push(
        this.createAlert(
          "critical",
          "cpu",
          latestMetrics.cpu.usage,
          this.config.thresholds.cpu.critical,
        ),
      );
    } else if (latestMetrics.cpu.usage > this.config.thresholds.cpu.warning) {
      alerts.push(
        this.createAlert(
          "warning",
          "cpu",
          latestMetrics.cpu.usage,
          this.config.thresholds.cpu.warning,
        ),
      );
    }

    // Check memory threshold
    if (
      latestMetrics.memory.heapUsedPercent >
      this.config.thresholds.memory.critical
    ) {
      alerts.push(
        this.createAlert(
          "critical",
          "memory",
          latestMetrics.memory.heapUsedPercent,
          this.config.thresholds.memory.critical,
        ),
      );
    } else if (
      latestMetrics.memory.heapUsedPercent >
      this.config.thresholds.memory.warning
    ) {
      alerts.push(
        this.createAlert(
          "warning",
          "memory",
          latestMetrics.memory.heapUsedPercent,
          this.config.thresholds.memory.warning,
        ),
      );
    }

    // Check disk threshold
    if (latestMetrics.disk && latestMetrics.disk.usedPercent) {
      if (
        latestMetrics.disk.usedPercent > this.config.thresholds.disk.critical
      ) {
        alerts.push(
          this.createAlert(
            "critical",
            "disk",
            latestMetrics.disk.usedPercent,
            this.config.thresholds.disk.critical,
          ),
        );
      } else if (
        latestMetrics.disk.usedPercent > this.config.thresholds.disk.warning
      ) {
        alerts.push(
          this.createAlert(
            "warning",
            "disk",
            latestMetrics.disk.usedPercent,
            this.config.thresholds.disk.warning,
          ),
        );
      }
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  /**
   * Create alert object
   */
  createAlert(level, metric, value, threshold) {
    return {
      id: `${Date.now()}-${metric}`,
      level,
      metric,
      value,
      threshold,
      message: `${metric.toUpperCase()} usage at ${value.toFixed(1)}% (threshold: ${threshold}%)`,
      timestamp: new Date(),
      resolved: false,
    };
  }

  /**
   * Process and send alert
   */
  async processAlert(alert) {
    // Prevent duplicate alerts (within 5 minutes)
    const lastAlert = this.alerts[this.alerts.length - 1];
    if (
      lastAlert &&
      lastAlert.metric === alert.metric &&
      Date.now() - lastAlert.timestamp < 300000
    ) {
      return;
    }

    this.alerts.push(alert);
    this.stats.alertsTriggered++;
    this.stats.lastAlertTime = new Date();

    // Log alert
    this.logger.warn(`🚨 ${alert.level.toUpperCase()} ALERT: ${alert.message}`);

    // Send to Slack if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      await this.sendSlackAlert(alert);
    }

    // Save to file
    await this.saveAlertToFile(alert);
  }

  /**
   * Send alert to Slack
   */
  async sendSlackAlert(alert) {
    try {
      const axios = require("axios");
      const color = alert.level === "critical" ? "danger" : "warning";

      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        attachments: [
          {
            color,
            title: `🚨 ${alert.level.toUpperCase()} Alert: ${alert.metric}`,
            text: alert.message,
            fields: [
              {
                title: "Value",
                value: `${alert.value.toFixed(1)}%`,
                short: true,
              },
              { title: "Threshold", value: `${alert.threshold}%`, short: true },
              {
                title: "Environment",
                value: process.env.NODE_ENV || "development",
                short: true,
              },
              { title: "Server", value: os.hostname(), short: true },
            ],
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      });

      this.logger.debug("Alert sent to Slack");
    } catch (error) {
      this.logger.error(`Failed to send Slack alert: ${error.message}`);
    }
  }

  /**
   * Save alert to file
   */
  async saveAlertToFile(alert) {
    try {
      const alertsDir = path.join(process.cwd(), "alerts");
      await fs.ensureDir(alertsDir);

      const alertFile = path.join(
        alertsDir,
        `alerts-${moment().format("YYYY-MM-DD")}.json`,
      );
      let alerts = [];

      if (await fs.pathExists(alertFile)) {
        alerts = await fs.readJson(alertFile);
      }

      alerts.push(alert);
      await fs.writeJson(alertFile, alerts, { spaces: 2 });
    } catch (error) {
      this.logger.error(`Failed to save alert to file: ${error.message}`);
    }
  }

  /**
   * Save metrics to database
   */
  async saveMetricsToDatabase(metrics) {
    try {
      // Only save if database is connected and model exists
      if (mongoose.connection.readyState === 1) {
        const PerformanceMetric = mongoose.model("PerformanceMetric");
        await PerformanceMetric.create(metrics);
      }
    } catch (error) {
      this.logger.error(`Failed to save metrics to database: ${error.message}`);
    }
  }

  /**
   * Save detailed metrics to database
   */
  async saveDetailedMetrics(metrics) {
    try {
      if (mongoose.connection.readyState === 1) {
        const DetailedMetric = mongoose.model("DetailedMetric");
        await DetailedMetric.create(metrics);
      }
    } catch (error) {
      this.logger.error(`Failed to save detailed metrics: ${error.message}`);
    }
  }

  /**
   * Export metrics to file
   */
  async exportMetrics(metrics) {
    try {
      await fs.ensureDir(this.config.export.path);

      const filename = `metrics-${moment().format("YYYY-MM-DD-HH-mm")}.${this.config.export.format}`;
      const filepath = path.join(this.config.export.path, filename);

      if (this.config.export.format === "json") {
        await fs.writeJson(filepath, metrics, { spaces: 2 });
      }
    } catch (error) {
      this.logger.error(`Failed to export metrics: ${error.message}`);
    }
  }

  /**
   * Emit metrics for real-time monitoring
   */
  emitMetrics(metrics) {
    if (global.io) {
      global.io.emit("metrics", metrics);
    }
  }

  /**
   * Clean old metrics from memory
   */
  cleanOldMetrics() {
    const maxMetrics = 1000;
    if (this.metrics.length > maxMetrics) {
      this.metrics = this.metrics.slice(-maxMetrics);
    }
  }

  /**
   * Log system information on startup
   */
  async logSystemInfo() {
    const diskStats = await checkDiskSpace(process.cwd());

    this.logger.log("📊 System Information:", {
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
      diskFree: `${Math.round(diskStats.free / 1024 / 1024 / 1024)}GB`,
      hostname: os.hostname(),
      pid: process.pid,
      env: process.env.NODE_ENV || "development",
    });
  }

  /**
   * Format metrics for logging
   */
  formatMetricsForLog(metrics) {
    return {
      cpu: `${metrics.cpu.usage.toFixed(1)}%`,
      memory: `${metrics.memory.heapUsedPercent.toFixed(1)}%`,
      connections: metrics.activeConnections?.total || 0,
      uptime: `${Math.floor(metrics.application.uptime / 60)}m`,
    };
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      ...this.stats,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.length,
      isMonitoring: this.isMonitoring,
      historySamples: {
        cpu: this.history.cpu.length,
        memory: this.history.memory.length,
        heap: this.history.heap.length,
      },
    };
  }

  /**
   * Generate performance report
   */
  async generateReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      period: {
        start: this.startTime,
        end: Date.now(),
        duration: Math.floor((Date.now() - this.startTime) / 1000),
      },
      statistics: this.stats,
      thresholds: this.config.thresholds,
      recentAlerts: this.alerts.slice(-10),
      latestMetrics: this.metrics[this.metrics.length - 1],
      historySummary: {
        cpu: {
          average:
            this.history.cpu.reduce((sum, m) => sum + m.value, 0) /
              this.history.cpu.length || 0,
          max: Math.max(...this.history.cpu.map((m) => m.value), 0),
          min: Math.min(...this.history.cpu.map((m) => m.value), 0),
        },
        memory: {
          average:
            this.history.memory.reduce((sum, m) => sum + m.value, 0) /
              this.history.memory.length || 0,
          max: Math.max(...this.history.memory.map((m) => m.value), 0),
          min: Math.min(...this.history.memory.map((m) => m.value), 0),
        },
      },
    };

    // Save report to file
    await fs.ensureDir("./reports");
    await fs.writeJson(
      `./reports/performance-report-${moment().format("YYYY-MM-DD")}.json`,
      report,
      { spaces: 2 },
    );

    return report;
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    process.on("SIGTERM", async () => {
      this.logger.log(
        "🛑 Performance monitor received SIGTERM, shutting down...",
      );
      await this.shutdown();
    });

    process.on("SIGINT", async () => {
      this.logger.log(
        "🛑 Performance monitor received SIGINT, shutting down...",
      );
      await this.shutdown();
    });
  }

  /**
   * Shutdown the monitor
   */
  async shutdown() {
    this.isMonitoring = false;

    for (const intervalId of this.intervalIds) {
      clearInterval(intervalId);
    }

    // Generate final report
    await this.generateReport();

    this.logger.log("✅ Performance monitor shutdown complete");
  }
}

// ============================================================
// DATABASE MODELS (Optional - only if saving to DB)
// ============================================================

if (
  MONITOR_CONFIG.features.saveToDatabase &&
  mongoose.connection.readyState === 1
) {
  // Performance Metric Model
  const performanceMetricSchema = new mongoose.Schema(
    {
      timestamp: { type: Date, default: Date.now, index: true },
      memory: {
        heapUsed: Number,
        heapTotal: Number,
        heapUsedPercent: Number,
        rss: Number,
        rssPercent: Number,
      },
      cpu: {
        usage: Number,
        loadAvg1m: Number,
        loadAvg5m: Number,
        loadAvg15m: Number,
      },
      system: {
        memoryUsagePercent: Number,
        uptime: Number,
      },
      activeConnections: {
        database: Number,
        http: Number,
        total: Number,
      },
    },
    { timestamps: true },
  );

  // Register models
  try {
    mongoose.model("PerformanceMetric", performanceMetricSchema);
  } catch (error) {
    // Model already exists
  }
}

// ============================================================
// COMMAND LINE INTERFACE
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    once: args.includes("--once") || args.includes("-o"),
    report: args.includes("--report") || args.includes("-r"),
    stats: args.includes("--stats") || args.includes("-s"),
    help: args.includes("--help") || args.includes("-h"),
  };
}

function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  PERFORMANCE MONITOR                           ║
║              Enterprise System Monitoring                      ║
╚════════════════════════════════════════════════════════════════╝

USAGE:
  node scripts/performanceMonitor.js [options]

OPTIONS:
  -o, --once      Run once and exit
  -r, --report    Generate performance report
  -s, --stats     Display current statistics
  -h, --help      Show this help message

ENVIRONMENT VARIABLES:
  MONITOR_INTERVAL           Metrics collection interval (ms) (default: 30000)
  CPU_WARNING_THRESHOLD      CPU warning threshold % (default: 70)
  CPU_CRITICAL_THRESHOLD     CPU critical threshold % (default: 85)
  MEMORY_WARNING_THRESHOLD   Memory warning threshold % (default: 75)
  MEMORY_CRITICAL_THRESHOLD  Memory critical threshold % (default: 90)
  METRICS_RETENTION_DAYS     Metrics retention in days (default: 30)
  ALERT_ON_THRESHOLD         Enable/disable alerts (default: true)
  SAVE_METRICS_TO_DB         Save metrics to database (default: false)
  SLACK_WEBHOOK_URL          Slack webhook URL for alerts

EXAMPLES:
  node scripts/performanceMonitor.js              # Start continuous monitoring
  node scripts/performanceMonitor.js --once       # Run once and exit
  node scripts/performanceMonitor.js --report     # Generate performance report
  node scripts/performanceMonitor.js --stats      # Show statistics
`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  const monitor = new PerformanceMonitor();

  try {
    if (options.report) {
      await monitor.initialize();
      const report = await monitor.generateReport();
      console.log("📊 Performance report generated:", report.generatedAt);
      console.log("📁 Report saved to: ./reports/");
      process.exit(0);
    }

    if (options.stats) {
      await monitor.initialize();
      const stats = monitor.getStats();
      console.log(
        "📊 Performance Monitor Statistics:",
        JSON.stringify(stats, null, 2),
      );
      process.exit(0);
    }

    if (options.once) {
      await monitor.initialize();
      const metrics = await monitor.collectMetrics();
      console.log("📊 Current Metrics:", JSON.stringify(metrics, null, 2));
      process.exit(0);
    }

    // Start continuous monitoring
    await monitor.initialize();

    console.log("\n📊 Performance Monitor is running. Press Ctrl+C to stop.\n");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down performance monitor...");
      await monitor.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start performance monitor:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PerformanceMonitor, MONITOR_CONFIG };
