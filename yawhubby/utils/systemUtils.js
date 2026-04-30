// utils/systemUtils.js
// Enterprise-Grade System Utilities for Disk, Memory, CPU, and Network Monitoring
// Provides comprehensive system health monitoring, alerting, and performance optimization

const os = require("os");
const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const logger = require("./logger");
const moment = require("moment");

const execAsync = promisify(exec);

// ============================================================
// CONFIGURATION
// ============================================================

const SYSTEM_CONFIG = {
  // Monitoring intervals (milliseconds)
  intervals: {
    metrics: parseInt(process.env.SYSTEM_METRICS_INTERVAL) || 30000, // 30 seconds
    health: parseInt(process.env.SYSTEM_HEALTH_INTERVAL) || 60000, // 1 minute
    alert: parseInt(process.env.SYSTEM_ALERT_INTERVAL) || 120000, // 2 minutes
  },

  // Thresholds (percentage)
  thresholds: {
    cpu: {
      warning: parseFloat(process.env.CPU_WARNING_THRESHOLD) || 70,
      critical: parseFloat(process.env.CPU_CRITICAL_THRESHOLD) || 85,
      duration: parseInt(process.env.CPU_HIGH_DURATION) || 300, // seconds
    },
    memory: {
      warning: parseFloat(process.env.MEMORY_WARNING_THRESHOLD) || 75,
      critical: parseFloat(process.env.MEMORY_CRITICAL_THRESHOLD) || 90,
      swapWarning: parseFloat(process.env.SWAP_WARNING_THRESHOLD) || 50,
    },
    disk: {
      warning: parseFloat(process.env.DISK_WARNING_THRESHOLD) || 80,
      critical: parseFloat(process.env.DISK_CRITICAL_THRESHOLD) || 90,
      inodeWarning: parseFloat(process.env.INODE_WARNING_THRESHOLD) || 80,
    },
    load: {
      warning: parseFloat(process.env.LOAD_WARNING_THRESHOLD) || 2.0,
      critical: parseFloat(process.env.LOAD_CRITICAL_THRESHOLD) || 4.0,
    },
    network: {
      latencyWarning: parseInt(process.env.NETWORK_LATENCY_WARNING) || 100, // ms
      packetLossWarning: parseFloat(process.env.PACKET_LOSS_WARNING) || 5, // percent
    },
  },

  // Disk monitoring
  disk: {
    paths: (process.env.DISK_MONITOR_PATHS || "/").split(","),
    includeRemote: process.env.DISK_INCLUDE_REMOTE === "true",
    checkInodes: process.env.DISK_CHECK_INODES !== "false",
  },

  // Process monitoring
  process: {
    enabled: process.env.PROCESS_MONITORING_ENABLED !== "false",
    maxMemory: parseInt(process.env.PROCESS_MAX_MEMORY) || 1024, // MB
    maxCpu: parseFloat(process.env.PROCESS_MAX_CPU) || 80, // percent
    restartOnOOM: process.env.PROCESS_RESTART_ON_OOM === "true",
  },

  // Alerting
  alerts: {
    enabled: process.env.SYSTEM_ALERTS_ENABLED !== "false",
    cooldown: parseInt(process.env.ALERT_COOLDOWN_MINUTES) || 30, // minutes
    channels: {
      slack: process.env.SLACK_WEBHOOK_URL,
      email: process.env.ALERT_EMAIL,
      webhook: process.env.ALERT_WEBHOOK_URL,
    },
  },

  // Logging
  logging: {
    enabled: true,
    saveMetrics: process.env.SAVE_SYSTEM_METRICS === "true",
    metricsPath: process.env.SYSTEM_METRICS_PATH || "./logs/system-metrics",
    retention: parseInt(process.env.SYSTEM_METRICS_RETENTION) || 30, // days
  },

  // Auto-remediation
  autoRemediation: {
    enabled: process.env.AUTO_REMEDIATION_ENABLED === "true",
    actions: {
      clearCache: process.env.AUTO_CLEAR_CACHE === "true",
      restartWorker: process.env.AUTO_RESTART_WORKER === "true",
      notifyAdmin: process.env.AUTO_NOTIFY_ADMIN !== "false",
    },
  },
};

// ============================================================
// SYSTEM UTILITIES CLASS
// ============================================================

class SystemUtils {
  constructor(config = SYSTEM_CONFIG) {
    this.config = config;
    this.metrics = [];
    this.alerts = [];
    this.status = {
      healthy: true,
      lastCheck: null,
      issues: [],
    };
    this.monitoringInterval = null;
    this.healthInterval = null;
    this.alertInterval = null;
    this.startTime = Date.now();

    // Historical data
    this.history = {
      cpu: [],
      memory: [],
      disk: [],
      load: [],
    };

    // Performance baseline
    this.baseline = {
      cpu: null,
      memory: null,
      responseTime: null,
    };
  }

  /**
   * Initialize system utilities
   */
  async initialize() {
    try {
      logger.info("🖥️ Initializing System Utilities...");

      // Create metrics directory
      if (this.config.logging.saveMetrics) {
        await fs.ensureDir(this.config.logging.metricsPath);
      }

      // Start monitoring
      this.startMonitoring();

      // Log initial system info
      await this.logSystemInfo();

      // Calculate baseline
      await this.calculateBaseline();

      logger.info("✅ System Utilities initialized");
    } catch (error) {
      logger.error(`Failed to initialize system utilities: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start system monitoring
   */
  startMonitoring() {
    // Metrics collection
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
    }, this.config.intervals.metrics);

    // Health checks
    this.healthInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.intervals.health);

    // Alert processing
    this.alertInterval = setInterval(async () => {
      await this.processAlerts();
    }, this.config.intervals.alert);

    logger.info("📊 System monitoring started");
  }

  /**
   * Collect system metrics
   */
  async collectMetrics() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        cpu: await this.getCpuMetrics(),
        memory: await this.getMemoryMetrics(),
        disk: await this.getDiskMetrics(),
        network: await this.getNetworkMetrics(),
        process: await this.getProcessMetrics(),
        system: this.getSystemInfo(),
        load: os.loadavg(),
      };

      // Add to history
      this.addToHistory(metrics);

      // Save metrics
      if (this.config.logging.saveMetrics) {
        await this.saveMetrics(metrics);
      }

      // Check thresholds
      await this.checkThresholds(metrics);

      // Update status
      this.metrics.push(metrics);

      // Trim metrics array
      if (this.metrics.length > 1000) {
        this.metrics.shift();
      }

      return metrics;
    } catch (error) {
      logger.error(`Failed to collect metrics: ${error.message}`);
      return null;
    }
  }

  /**
   * Get CPU metrics
   */
  async getCpuMetrics() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // Calculate CPU usage
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idlePercent = (totalIdle / totalTick) * 100;
    const usagePercent = 100 - idlePercent;

    return {
      usage: parseFloat(usagePercent.toFixed(2)),
      cores: cpus.length,
      model: cpus[0]?.model || "Unknown",
      speed: cpus[0]?.speed || 0,
      loadAverage: {
        "1m": loadAvg[0],
        "5m": loadAvg[1],
        "15m": loadAvg[2],
      },
      perCore: cpus.map((cpu, i) => ({
        core: i,
        model: cpu.model,
        speed: cpu.speed,
        times: cpu.times,
      })),
    };
  }

  /**
   * Get memory metrics
   */
  async getMemoryMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Get process memory
    const processMem = process.memoryUsage();

    return {
      total: totalMem,
      totalFormatted: this.formatBytes(totalMem),
      free: freeMem,
      freeFormatted: this.formatBytes(freeMem),
      used: usedMem,
      usedFormatted: this.formatBytes(usedMem),
      usedPercent: parseFloat(((usedMem / totalMem) * 100).toFixed(2)),
      process: {
        rss: processMem.rss,
        rssFormatted: this.formatBytes(processMem.rss),
        heapTotal: processMem.heapTotal,
        heapTotalFormatted: this.formatBytes(processMem.heapTotal),
        heapUsed: processMem.heapUsed,
        heapUsedFormatted: this.formatBytes(processMem.heapUsed),
        external: processMem.external,
        externalFormatted: this.formatBytes(processMem.external),
        heapUsedPercent: parseFloat(
          ((processMem.heapUsed / processMem.heapTotal) * 100).toFixed(2),
        ),
      },
    };
  }

  /**
   * Get disk metrics
   */
  async getDiskMetrics() {
    const disks = [];

    for (const diskPath of this.config.disk.paths) {
      try {
        const stats = await fs.stat(diskPath);
        const diskStats = await this.getDiskStats(diskPath);

        disks.push({
          path: diskPath,
          total: diskStats.total,
          totalFormatted: this.formatBytes(diskStats.total),
          free: diskStats.free,
          freeFormatted: this.formatBytes(diskStats.free),
          used: diskStats.used,
          usedFormatted: this.formatBytes(diskStats.used),
          usedPercent: diskStats.usedPercent,
          available: diskStats.available,
          availableFormatted: this.formatBytes(diskStats.available),
          inodes: diskStats.inodes,
          inodesUsed: diskStats.inodesUsed,
          inodesUsedPercent: diskStats.inodesUsedPercent,
        });
      } catch (error) {
        logger.error(
          `Failed to get disk stats for ${diskPath}: ${error.message}`,
        );
      }
    }

    return disks;
  }

  /**
   * Get disk stats for a specific path
   * @param {string} diskPath - Disk path
   */
  async getDiskStats(diskPath) {
    try {
      // Try to use diskusage package first
      let diskusage;
      try {
        diskusage = require("diskusage");
      } catch (e) {
        // Fallback to fs
        const stats = await fs.stat(diskPath);
        return {
          total: stats.size || 0,
          free: 0,
          used: 0,
          usedPercent: 0,
          available: 0,
          inodes: 0,
          inodesUsed: 0,
          inodesUsedPercent: 0,
        };
      }

      const stats = await diskusage.check(diskPath);

      return {
        total: stats.total,
        free: stats.free,
        used: stats.total - stats.free,
        usedPercent: ((stats.total - stats.free) / stats.total) * 100,
        available: stats.available,
        inodes: stats.inodes || 0,
        inodesUsed: stats.inodes ? stats.total - stats.free : 0,
        inodesUsedPercent: stats.inodes
          ? ((stats.total - stats.free) / stats.total) * 100
          : 0,
      };
    } catch (error) {
      logger.error(`Failed to get disk stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get network metrics
   */
  async getNetworkMetrics() {
    const networkInterfaces = os.networkInterfaces();
    const interfaces = [];

    for (const [name, addresses] of Object.entries(networkInterfaces)) {
      for (const addr of addresses) {
        if (!addr.internal) {
          interfaces.push({
            name,
            address: addr.address,
            family: addr.family,
            mac: addr.mac,
            internal: addr.internal,
          });
        }
      }
    }

    // Get network latency
    let latency = null;
    if (process.env.NETWORK_TEST_HOST) {
      latency = await this.measureLatency(process.env.NETWORK_TEST_HOST);
    }

    return {
      interfaces,
      latency,
      hostname: os.hostname(),
      uptime: os.uptime(),
    };
  }

  /**
   * Measure network latency
   * @param {string} host - Host to ping
   */
  async measureLatency(host) {
    try {
      const start = Date.now();
      await execAsync(`ping -n 1 ${host}`);
      const latency = Date.now() - start;
      return latency;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get process metrics
   */
  async getProcessMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      pid: process.pid,
      title: process.title,
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        total: cpuUsage.user + cpuUsage.system,
      },
      versions: process.versions,
      platform: process.platform,
      arch: process.arch,
      execPath: process.execPath,
      cwd: process.cwd(),
      env: process.env.NODE_ENV,
      argv: process.argv,
    };
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    return {
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      cpus: os.cpus().length,
      totalMemory: this.formatBytes(os.totalmem()),
      freeMemory: this.formatBytes(os.freemem()),
      networkInterfaces: Object.keys(os.networkInterfaces()).length,
      userInfo: os.userInfo(),
      endianness: os.endianness(),
      loadavg: os.loadavg(),
    };
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      healthy: true,
      checks: {},
      issues: [],
    };

    try {
      // Check CPU
      const cpuMetrics = await this.getCpuMetrics();
      healthStatus.checks.cpu = {
        healthy: cpuMetrics.usage < this.config.thresholds.cpu.critical,
        usage: cpuMetrics.usage,
        threshold: this.config.thresholds.cpu.critical,
      };
      if (!healthStatus.checks.cpu.healthy) {
        healthStatus.issues.push(`CPU usage critical: ${cpuMetrics.usage}%`);
      }

      // Check Memory
      const memoryMetrics = await this.getMemoryMetrics();
      healthStatus.checks.memory = {
        healthy:
          memoryMetrics.usedPercent < this.config.thresholds.memory.critical,
        usage: memoryMetrics.usedPercent,
        threshold: this.config.thresholds.memory.critical,
      };
      if (!healthStatus.checks.memory.healthy) {
        healthStatus.issues.push(
          `Memory usage critical: ${memoryMetrics.usedPercent}%`,
        );
      }

      // Check Disk
      const diskMetrics = await this.getDiskMetrics();
      for (const disk of diskMetrics) {
        healthStatus.checks[`disk_${disk.path}`] = {
          healthy: disk.usedPercent < this.config.thresholds.disk.critical,
          usage: disk.usedPercent,
          threshold: this.config.thresholds.disk.critical,
          path: disk.path,
        };
        if (!healthStatus.checks[`disk_${disk.path}`].healthy) {
          healthStatus.issues.push(
            `Disk ${disk.path} usage critical: ${disk.usedPercent}%`,
          );
        }
      }

      // Check Process
      if (this.config.process.enabled) {
        const processMetrics = await this.getProcessMetrics();
        const memoryMB = processMetrics.memory.rss / 1024 / 1024;
        healthStatus.checks.process = {
          healthy: memoryMB < this.config.process.maxMemory,
          memoryMB: memoryMB.toFixed(2),
          threshold: this.config.process.maxMemory,
        };
        if (!healthStatus.checks.process.healthy) {
          healthStatus.issues.push(
            `Process memory exceeded: ${memoryMB.toFixed(2)}MB`,
          );
        }
      }

      healthStatus.healthy = healthStatus.issues.length === 0;
      this.status = healthStatus;

      // Trigger alerts if needed
      if (!healthStatus.healthy) {
        await this.triggerAlert("health_check_failed", healthStatus);
      }

      logger.info("Health check completed", {
        healthy: healthStatus.healthy,
        issues: healthStatus.issues.length,
      });

      return healthStatus;
    } catch (error) {
      logger.error(`Health check failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Check thresholds and trigger alerts
   * @param {Object} metrics - System metrics
   */
  async checkThresholds(metrics) {
    const alerts = [];

    // CPU threshold
    if (metrics.cpu.usage > this.config.thresholds.cpu.critical) {
      alerts.push({
        type: "cpu",
        level: "critical",
        value: metrics.cpu.usage,
        threshold: this.config.thresholds.cpu.critical,
      });
    } else if (metrics.cpu.usage > this.config.thresholds.cpu.warning) {
      alerts.push({
        type: "cpu",
        level: "warning",
        value: metrics.cpu.usage,
        threshold: this.config.thresholds.cpu.warning,
      });
    }

    // Memory threshold
    if (metrics.memory.usedPercent > this.config.thresholds.memory.critical) {
      alerts.push({
        type: "memory",
        level: "critical",
        value: metrics.memory.usedPercent,
        threshold: this.config.thresholds.memory.critical,
      });
    } else if (
      metrics.memory.usedPercent > this.config.thresholds.memory.warning
    ) {
      alerts.push({
        type: "memory",
        level: "warning",
        value: metrics.memory.usedPercent,
        threshold: this.config.thresholds.memory.warning,
      });
    }

    // Load threshold
    const loadAvg = metrics.load["1m"];
    if (loadAvg > this.config.thresholds.load.critical) {
      alerts.push({
        type: "load",
        level: "critical",
        value: loadAvg,
        threshold: this.config.thresholds.load.critical,
      });
    } else if (loadAvg > this.config.thresholds.load.warning) {
      alerts.push({
        type: "load",
        level: "warning",
        value: loadAvg,
        threshold: this.config.thresholds.load.warning,
      });
    }

    // Process alerts
    for (const alert of alerts) {
      await this.triggerAlert(alert.type, alert);
    }

    // Auto-remediation
    if (this.config.autoRemediation.enabled) {
      await this.autoRemediate(alerts);
    }
  }

  /**
   * Trigger alert
   * @param {string} type - Alert type
   * @param {Object} data - Alert data
   */
  async triggerAlert(type, data) {
    // Check cooldown
    const lastAlert = this.alerts[this.alerts.length - 1];
    if (
      lastAlert &&
      moment().diff(moment(lastAlert.timestamp), "minutes") <
        this.config.alerts.cooldown
    ) {
      return;
    }

    const alert = {
      id: `${type}_${Date.now()}`,
      type,
      level: data.level,
      message: `${type.toUpperCase()} alert: ${data.value} (threshold: ${data.threshold})`,
      data,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.alerts.push(alert);

    // Send to channels
    if (this.config.alerts.channels.slack) {
      await this.sendSlackAlert(alert);
    }

    if (this.config.alerts.channels.email) {
      await this.sendEmailAlert(alert);
    }

    if (this.config.alerts.channels.webhook) {
      await this.sendWebhookAlert(alert);
    }

    logger.warn(`Alert triggered: ${alert.message}`);
  }

  /**
   * Send Slack alert
   * @param {Object} alert - Alert object
   */
  async sendSlackAlert(alert) {
    try {
      const axios = require("axios");
      const color = alert.level === "critical" ? "danger" : "warning";

      await axios.post(this.config.alerts.channels.slack, {
        attachments: [
          {
            color,
            title: `🚨 System Alert: ${alert.type.toUpperCase()}`,
            text: alert.message,
            fields: [
              { title: "Level", value: alert.level, short: true },
              { title: "Value", value: alert.data.value, short: true },
              { title: "Threshold", value: alert.data.threshold, short: true },
              { title: "Host", value: os.hostname(), short: true },
              {
                title: "Environment",
                value: process.env.NODE_ENV,
                short: true,
              },
            ],
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      });
    } catch (error) {
      logger.error(`Failed to send Slack alert: ${error.message}`);
    }
  }

  /**
   * Send email alert
   * @param {Object} alert - Alert object
   */
  async sendEmailAlert(alert) {
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
        to: this.config.alerts.channels.email,
        subject: `[${alert.level.toUpperCase()}] System Alert: ${alert.type}`,
        text: alert.message,
        html: `<h2>System Alert</h2>
                       <p><strong>Type:</strong> ${alert.type}</p>
                       <p><strong>Level:</strong> ${alert.level}</p>
                       <p><strong>Message:</strong> ${alert.message}</p>
                       <p><strong>Host:</strong> ${os.hostname()}</p>
                       <p><strong>Time:</strong> ${alert.timestamp}</p>`,
      });
    } catch (error) {
      logger.error(`Failed to send email alert: ${error.message}`);
    }
  }

  /**
   * Send webhook alert
   * @param {Object} alert - Alert object
   */
  async sendWebhookAlert(alert) {
    try {
      const axios = require("axios");
      await axios.post(this.config.alerts.channels.webhook, alert);
    } catch (error) {
      logger.error(`Failed to send webhook alert: ${error.message}`);
    }
  }

  /**
   * Process pending alerts
   */
  async processAlerts() {
    const unresolved = this.alerts.filter((a) => !a.resolved);

    for (const alert of unresolved) {
      // Check if condition is resolved
      const isResolved = await this.checkAlertResolution(alert);

      if (isResolved) {
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        logger.info(`Alert resolved: ${alert.type}`);

        // Send resolution notification
        if (this.config.alerts.channels.slack) {
          await this.sendResolutionNotification(alert);
        }
      }
    }
  }

  /**
   * Check if alert condition is resolved
   * @param {Object} alert - Alert object
   */
  async checkAlertResolution(alert) {
    try {
      switch (alert.type) {
        case "cpu":
          const cpu = await this.getCpuMetrics();
          return cpu.usage < this.config.thresholds.cpu.warning;
        case "memory":
          const memory = await this.getMemoryMetrics();
          return memory.usedPercent < this.config.thresholds.memory.warning;
        case "load":
          const load = os.loadavg()[0];
          return load < this.config.thresholds.load.warning;
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Send resolution notification
   * @param {Object} alert - Alert object
   */
  async sendResolutionNotification(alert) {
    try {
      const axios = require("axios");

      await axios.post(this.config.alerts.channels.slack, {
        attachments: [
          {
            color: "good",
            title: `✅ Alert Resolved: ${alert.type.toUpperCase()}`,
            text: `Alert has been resolved after ${moment(alert.timestamp).fromNow()}`,
            fields: [
              { title: "Type", value: alert.type, short: true },
              {
                title: "Duration",
                value:
                  moment(alert.resolvedAt).diff(
                    moment(alert.timestamp),
                    "minutes",
                  ) + " minutes",
                short: true,
              },
            ],
          },
        ],
      });
    } catch (error) {
      logger.error(`Failed to send resolution notification: ${error.message}`);
    }
  }

  /**
   * Auto-remediate issues
   * @param {Array} alerts - Active alerts
   */
  async autoRemediate(alerts) {
    for (const alert of alerts) {
      if (alert.level !== "critical") continue;

      switch (alert.type) {
        case "memory":
          if (this.config.autoRemediation.actions.clearCache) {
            await this.clearSystemCache();
          }
          break;
        case "cpu":
          if (this.config.autoRemediation.actions.restartWorker) {
            await this.restartWorker();
          }
          break;
      }
    }
  }

  /**
   * Clear system cache
   */
  async clearSystemCache() {
    try {
      // Clear Node.js module cache
      Object.keys(require.cache).forEach((key) => {
        if (!key.includes("node_modules")) {
          delete require.cache[key];
        }
      });

      // Clear memory
      if (global.gc) {
        global.gc();
      }

      logger.info("System cache cleared");
    } catch (error) {
      logger.error(`Failed to clear cache: ${error.message}`);
    }
  }

  /**
   * Restart worker process
   */
  async restartWorker() {
    if (!this.config.autoRemediation.actions.restartWorker) return;

    logger.warn("Attempting to restart worker process...");
    process.exit(1);
  }

  /**
   * Add metrics to history
   * @param {Object} metrics - System metrics
   */
  addToHistory(metrics) {
    const maxHistory = 100;

    this.history.cpu.push({
      timestamp: metrics.timestamp,
      value: metrics.cpu.usage,
    });
    this.history.memory.push({
      timestamp: metrics.timestamp,
      value: metrics.memory.usedPercent,
    });
    this.history.load.push({
      timestamp: metrics.timestamp,
      value: metrics.load["1m"],
    });

    // Trim history
    if (this.history.cpu.length > maxHistory) this.history.cpu.shift();
    if (this.history.memory.length > maxHistory) this.history.memory.shift();
    if (this.history.load.length > maxHistory) this.history.load.shift();
  }

  /**
   * Save metrics to file
   * @param {Object} metrics - System metrics
   */
  async saveMetrics(metrics) {
    try {
      const date = moment().format("YYYY-MM-DD");
      const metricsPath = path.join(
        this.config.logging.metricsPath,
        `${date}.json`,
      );

      let existing = [];
      if (await fs.pathExists(metricsPath)) {
        existing = await fs.readJson(metricsPath);
      }

      existing.push(metrics);
      await fs.writeJson(metricsPath, existing, { spaces: 2 });
    } catch (error) {
      logger.error(`Failed to save metrics: ${error.message}`);
    }
  }

  /**
   * Calculate performance baseline
   */
  async calculateBaseline() {
    // Collect metrics for 1 minute
    const samples = [];
    for (let i = 0; i < 6; i++) {
      const metrics = await this.collectMetrics();
      if (metrics) samples.push(metrics);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    if (samples.length > 0) {
      this.baseline.cpu =
        samples.reduce((sum, m) => sum + m.cpu.usage, 0) / samples.length;
      this.baseline.memory =
        samples.reduce((sum, m) => sum + m.memory.usedPercent, 0) /
        samples.length;

      logger.info(
        `Baseline calculated - CPU: ${this.baseline.cpu.toFixed(2)}%, Memory: ${this.baseline.memory.toFixed(2)}%`,
      );
    }
  }

  /**
   * Log system information
   */
  async logSystemInfo() {
    const info = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: this.formatBytes(os.totalmem()),
      nodeVersion: process.version,
      pid: process.pid,
      hostname: os.hostname(),
      uptime: os.uptime(),
    };

    logger.info("🖥️ System Information:", info);
  }

  /**
   * Get system summary
   */
  async getSystemSummary() {
    const metrics = await this.collectMetrics();
    const health = await this.performHealthCheck();

    return {
      status: health?.healthy ? "healthy" : "unhealthy",
      uptime: process.uptime(),
      metrics,
      health,
      alerts: this.alerts.filter((a) => !a.resolved).length,
      baseline: this.baseline,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get historical metrics
   * @param {string} metric - Metric type (cpu, memory, load)
   * @param {number} hours - Hours of history
   */
  getHistoricalMetrics(metric, hours = 24) {
    const history = this.history[metric];
    if (!history) return [];

    const cutoff = moment().subtract(hours, "hours");
    return history.filter((h) => moment(h.timestamp).isAfter(cutoff));
  }

  /**
   * Generate performance report
   */
  async generateReport() {
    const metrics = await this.collectMetrics();
    const health = await this.performHealthCheck();

    const report = {
      generatedAt: new Date().toISOString(),
      period: {
        start: this.startTime,
        end: Date.now(),
        duration: Math.floor((Date.now() - this.startTime) / 1000),
      },
      summary: {
        status: health?.healthy ? "healthy" : "unhealthy",
        uptime: process.uptime(),
        alertsTriggered: this.alerts.length,
        unresolvedAlerts: this.alerts.filter((a) => !a.resolved).length,
      },
      currentMetrics: metrics,
      healthCheck: health,
      baseline: this.baseline,
      historySummary: {
        cpu: {
          average:
            this.history.cpu.reduce((sum, h) => sum + h.value, 0) /
              this.history.cpu.length || 0,
          max: Math.max(...this.history.cpu.map((h) => h.value), 0),
          min: Math.min(...this.history.cpu.map((h) => h.value), 0),
        },
        memory: {
          average:
            this.history.memory.reduce((sum, h) => sum + h.value, 0) /
              this.history.memory.length || 0,
          max: Math.max(...this.history.memory.map((h) => h.value), 0),
          min: Math.min(...this.history.memory.map((h) => h.value), 0),
        },
      },
      recentAlerts: this.alerts.slice(-10),
    };

    // Save report
    const reportPath = path.join(
      this.config.logging.metricsPath,
      `report-${moment().format("YYYY-MM-DD-HH-mm")}.json`,
    );
    await fs.writeJson(reportPath, report, { spaces: 2 });

    return report;
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
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      clearInterval(this.healthInterval);
      clearInterval(this.alertInterval);
    }

    logger.info("System monitoring stopped");
  }

  /**
   * Shutdown system utilities
   */
  async shutdown() {
    this.stopMonitoring();
    logger.info("System utilities shutdown complete");
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let instance = null;

/**
 * Get system utilities instance
 */
const getSystemUtils = async () => {
  if (!instance) {
    instance = new SystemUtils();
    await instance.initialize();
  }
  return instance;
};

/**
 * Get system summary
 */
const getSystemSummary = async () => {
  const utils = await getSystemUtils();
  return utils.getSystemSummary();
};

/**
 * Get system metrics
 */
const getSystemMetrics = async () => {
  const utils = await getSystemUtils();
  return utils.collectMetrics();
};

/**
 * Perform health check
 */
const performHealthCheck = async () => {
  const utils = await getSystemUtils();
  return utils.performHealthCheck();
};

/**
 * Generate performance report
 */
const generatePerformanceReport = async () => {
  const utils = await getSystemUtils();
  return utils.generateReport();
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Core
  getSystemUtils,
  SystemUtils,

  // Operations
  getSystemSummary,
  getSystemMetrics,
  performHealthCheck,
  generatePerformanceReport,

  // Constants
  SYSTEM_CONFIG,
};
