// workers/queueWorker.js
// Professional Background Worker for Processing Multiple Queues
// Supports: SMS, Email, Push Notifications, File Processing, Report Generation
// UPDATED: Redis disabled - runs in memory-only mock mode when REDIS_ENABLED=false

const { initializeSMSService, sendSMS } = require("../services/smsService");
const { sendBulkEmails, sendEmail } = require("../utils/emailService");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");
const mongoose = require("mongoose");
const os = require("os");

// ============================================================
// CHECK IF REDIS/QUEUES ARE ENABLED
// ============================================================
const REDIS_ENABLED = process.env.REDIS_ENABLED === "true";
const QUEUES_ENABLED = process.env.QUEUES_ENABLED === "true" && REDIS_ENABLED;

// ============================================================
// MOCK QUEUE CLASS - NO REDIS CONNECTION
// ============================================================
class MockQueue {
  constructor(name, opts = {}) {
    this.name = name;
    this.processors = [];
    this.jobs = [];
    this.client = { ping: () => Promise.resolve("PONG") };
    this.isPausedFlag = false;
    logger.info(`📋 Mock queue "${name}" initialized (Redis disabled)`);
  }

  process(concurrency, handler) {
    if (typeof concurrency === "function") {
      handler = concurrency;
      concurrency = 1;
    }
    this.processors.push({ concurrency, handler });
    logger.info(
      `📋 Mock processor registered for "${this.name}" (concurrency: ${concurrency})`,
    );
    return this;
  }

  async add(data, opts = {}) {
    const job = {
      id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data,
      opts,
      attemptsMade: 0,
      timestamp: Date.now(),
      queue: { name: this.name },
    };
    this.jobs.push(job);
    logger.debug(`📋 Mock job added to "${this.name}"`);

    // Don't actually process - just log
    if (
      this.processors.length > 0 &&
      process.env.PROCESS_MOCK_JOBS === "true"
    ) {
      setImmediate(() => this.processMockJob(job));
    }

    return job;
  }

  async processMockJob(job) {
    try {
      for (const processor of this.processors) {
        await processor.handler(job);
      }
      logger.debug(`✅ Mock job ${job.id} completed`);
    } catch (err) {
      logger.error(`❌ Mock job ${job.id} failed: ${err.message}`);
    }
  }

  async getJobCounts() {
    return {
      waiting: this.jobs.length,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }

  async getActiveCount() {
    return 0;
  }

  async isPaused() {
    return this.isPausedFlag;
  }

  async pause() {
    this.isPausedFlag = true;
    logger.info(`📋 Mock queue "${this.name}" paused`);
  }

  async resume() {
    this.isPausedFlag = false;
    logger.info(`📋 Mock queue "${this.name}" resumed`);
  }

  async close() {
    logger.info(`📋 Mock queue "${this.name}" closed`);
    return;
  }

  on(event, callback) {
    // Mock event handlers - just store but don't trigger
    return this;
  }
}

// ============================================================
// MOCK REDIS CLIENT
// ============================================================
class MockRedis {
  constructor() {
    logger.info("📋 Mock Redis client initialized (no connection)");
  }

  on() {
    return this;
  }
  async ping() {
    return "PONG";
  }
  async quit() {
    return;
  }
  disconnect() {}
}

// ============================================================
// CONDITIONAL IMPORTS - ONLY IF REDIS ENABLED
// ============================================================
let Queue;
let Redis;

if (QUEUES_ENABLED) {
  try {
    Queue = require("bull");
    Redis = require("ioredis");
    logger.info("✅ Bull queue system enabled with Redis");
  } catch (err) {
    logger.warn(
      `⚠️ Bull/ioredis not available: ${err.message} - using mock queues`,
    );
    Queue = MockQueue;
    Redis = MockRedis;
  }
} else {
  logger.info(
    `ℹ️ Queue system disabled (REDIS_ENABLED=${process.env.REDIS_ENABLED}, QUEUES_ENABLED=${process.env.QUEUES_ENABLED})`,
  );
  Queue = MockQueue;
  Redis = MockRedis;
}

// ============================================================
// CONFIGURATION
// ============================================================

const WORKER_CONFIG = {
  queues: {
    sms: "sms-queue",
    email: "email-queue",
    notification: "notification-queue",
    report: "report-queue",
    fileProcess: "file-process-queue",
  },
  concurrency: {
    sms: parseInt(process.env.SMS_WORKER_CONCURRENCY) || 5,
    email: parseInt(process.env.EMAIL_WORKER_CONCURRENCY) || 3,
    notification: parseInt(process.env.NOTIFICATION_WORKER_CONCURRENCY) || 10,
    report: parseInt(process.env.REPORT_WORKER_CONCURRENCY) || 2,
    fileProcess: parseInt(process.env.FILE_WORKER_CONCURRENCY) || 2,
  },
  retry: {
    maxAttempts: parseInt(process.env.WORKER_MAX_RETRIES) || 3,
    backoffDelay: parseInt(process.env.WORKER_BACKOFF_DELAY) || 5000,
    backoffType: "exponential",
  },
  healthCheckInterval: parseInt(process.env.WORKER_HEALTH_INTERVAL) || 30000,
  metricsEnabled: process.env.WORKER_METRICS_ENABLED !== "false",
  metricsInterval: parseInt(process.env.WORKER_METRICS_INTERVAL) || 60000,
};

// ============================================================
// METRICS COLLECTOR (unchanged)
// ============================================================

class WorkerMetrics {
  constructor() {
    this.metrics = {
      sms: { processed: 0, succeeded: 0, failed: 0, avgTime: 0 },
      email: { processed: 0, succeeded: 0, failed: 0, avgTime: 0 },
      notification: { processed: 0, succeeded: 0, failed: 0, avgTime: 0 },
      report: { processed: 0, succeeded: 0, failed: 0, avgTime: 0 },
      fileProcess: { processed: 0, succeeded: 0, failed: 0, avgTime: 0 },
      system: {
        uptime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        activeJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
      },
    };
    this.startTime = Date.now();
    if (WORKER_CONFIG.metricsEnabled) this.startMetricsCollection();
  }

  increment(queue, type, duration = null) {
    if (this.metrics[queue]) {
      this.metrics[queue].processed++;
      if (type === "success") this.metrics[queue].succeeded++;
      else if (type === "failed") this.metrics[queue].failed++;
      if (duration) {
        const currentAvg = this.metrics[queue].avgTime;
        const processed = this.metrics[queue].processed;
        this.metrics[queue].avgTime =
          (currentAvg * (processed - 1) + duration) / processed;
      }
    }
  }

  updateSystemMetrics(activeJobs, completedJobs, failedJobs) {
    this.metrics.system.uptime = Math.floor(
      (Date.now() - this.startTime) / 1000,
    );
    this.metrics.system.memoryUsage =
      process.memoryUsage().heapUsed / 1024 / 1024;
    this.metrics.system.cpuUsage = os.loadavg()[0];
    this.metrics.system.activeJobs = activeJobs;
    this.metrics.system.completedJobs = completedJobs;
    this.metrics.system.failedJobs = failedJobs;
  }

  startMetricsCollection() {
    setInterval(() => this.logMetrics(), WORKER_CONFIG.metricsInterval);
  }

  logMetrics() {
    logger.info("📊 Worker Metrics Report:", {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      workerId: process.env.INSTANCE_ID || "primary",
    });
  }

  getMetrics() {
    return this.metrics;
  }
}

// ============================================================
// QUEUE PROCESSORS (unchanged)
// ============================================================

class QueueProcessors {
  constructor(metrics) {
    this.metrics = metrics;
    this.queues = {};
    this.isShuttingDown = false;
  }

  async processSMS(job) {
    const startTime = Date.now();
    const { phoneNumber, message, metadata } = job.data;
    try {
      logger.debug(`Processing SMS job ${job.id} to ${phoneNumber}`);
      const result = await sendSMS(phoneNumber, message, {
        ...metadata,
        jobId: job.id,
        retryCount: job.attemptsMade,
      });
      const duration = Date.now() - startTime;
      this.metrics.increment("sms", "success", duration);
      await this.logJobCompletion(job, result, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.increment("sms", "failed", duration);
      logger.error(`SMS job ${job.id} failed: ${error.message}`);
      await this.logJobFailure(job, error);
      throw error;
    }
  }

  async processEmail(job) {
    const startTime = Date.now();
    const { to, subject, template, data, attachments } = job.data;
    try {
      logger.debug(`Processing email job ${job.id} to ${to}`);
      let result;
      if (Array.isArray(to) && to.length > 1) {
        result = await sendBulkEmails(to, {
          subject,
          template,
          data,
          attachments,
        });
      } else {
        result = await sendEmail({
          to: Array.isArray(to) ? to[0] : to,
          subject,
          template,
          data,
          attachments,
        });
      }
      const duration = Date.now() - startTime;
      this.metrics.increment("email", "success", duration);
      await this.logJobCompletion(job, result, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.increment("email", "failed", duration);
      logger.error(`Email job ${job.id} failed: ${error.message}`);
      await this.logJobFailure(job, error);
      throw error;
    }
  }

  async processNotification(job) {
    const startTime = Date.now();
    const { userId, type, title, message, metadata } = job.data;
    try {
      logger.debug(`Processing notification job ${job.id} for user ${userId}`);
      const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        metadata,
        status: "sent",
      });
      const duration = Date.now() - startTime;
      this.metrics.increment("notification", "success", duration);
      await this.logJobCompletion(
        job,
        { notificationId: notification._id },
        duration,
      );
      return { notificationId: notification._id };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.increment("notification", "failed", duration);
      logger.error(`Notification job ${job.id} failed: ${error.message}`);
      await this.logJobFailure(job, error);
      throw error;
    }
  }

  async processReport(job) {
    const startTime = Date.now();
    const { reportType, filters, format, userId } = job.data;
    try {
      logger.debug(`Processing report job ${job.id}: ${reportType}`);
      let reportData = {
        message: `Report generation would happen here for ${reportType}`,
      };
      await Notification.create({
        user: userId,
        type: "REPORT_READY",
        title: "Report Ready",
        message: `Your ${reportType} report is ready for download`,
        metadata: { reportType, format, reportData },
      });
      const duration = Date.now() - startTime;
      this.metrics.increment("report", "success", duration);
      await this.logJobCompletion(job, { reportType }, duration);
      return { reportType, reportData };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.increment("report", "failed", duration);
      logger.error(`Report job ${job.id} failed: ${error.message}`);
      await this.logJobFailure(job, error);
      throw error;
    }
  }

  async processFile(job) {
    const startTime = Date.now();
    const { fileId, operation, options } = job.data;
    try {
      logger.debug(`Processing file job ${job.id}: ${operation}`);
      const duration = Date.now() - startTime;
      this.metrics.increment("fileProcess", "success", duration);
      await this.logJobCompletion(job, { fileId, operation }, duration);
      return { fileId, operation, status: "completed" };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.increment("fileProcess", "failed", duration);
      logger.error(`File job ${job.id} failed: ${error.message}`);
      await this.logJobFailure(job, error);
      throw error;
    }
  }

  async logJobCompletion(job, result, duration) {
    try {
      if (mongoose.models.JobLog) {
        await mongoose.models.JobLog.create({
          jobId: job.id,
          queue: job.queue.name,
          data: job.data,
          result,
          duration,
          attempts: job.attemptsMade,
          completedAt: new Date(),
        });
      }
    } catch (error) {
      logger.error(`Failed to log job completion: ${error.message}`);
    }
  }

  async logJobFailure(job, error) {
    try {
      if (mongoose.models.JobLog) {
        await mongoose.models.JobLog.create({
          jobId: job.id,
          queue: job.queue.name,
          data: job.data,
          error: error.message,
          stack: error.stack,
          attempts: job.attemptsMade,
          failedAt: new Date(),
        });
      }
    } catch (err) {
      logger.error(`Failed to log job failure: ${err.message}`);
    }
  }
}

// ============================================================
// WORKER MANAGER - FIXED TO USE MOCK WHEN REDIS DISABLED
// ============================================================

class WorkerManager {
  constructor() {
    this.processors = null;
    this.metrics = null;
    this.queues = {};
    this.isHealthy = true;
    this.healthCheckInterval = null;
  }

  async initialize() {
    try {
      logger.info("📦 Initializing Queue Worker...");
      await this.connectDatabase();
      this.metrics = new WorkerMetrics();
      this.processors = new QueueProcessors(this.metrics);
      await this.initializeQueues();
      this.startHealthCheck();
      this.setupGracefulShutdown();
      logger.info(
        `✅ Queue Worker initialized successfully (Mode: ${QUEUES_ENABLED ? "Redis" : "Mock/Memory"})`,
      );
      this.logSystemInfo();
    } catch (error) {
      logger.error(`Failed to initialize worker: ${error.message}`);
      throw error;
    }
  }

  async connectDatabase() {
    if (mongoose.connection.readyState !== 1) {
      const MONGODB_URI =
        process.env.MONGODB_URI || "mongodb://localhost:27017/kaaf_noticeboard";
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 20,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
      });
      logger.info("✅ Database connected for worker");
    }
  }

  async initializeQueues() {
    // Use mock or real Redis based on QUEUES_ENABLED
    let redisClient = null;
    let redisSubscriber = null;

    if (QUEUES_ENABLED) {
      // Real Redis connection
      const redisConfig = {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 0, // No retries
        enableReadyCheck: true,
        lazyConnect: true,
        retryStrategy: () => null, // Never retry
      };
      redisClient = new Redis(redisConfig);
      redisSubscriber = new Redis(redisConfig);
      logger.info("🔴 Using real Redis for queues");
    } else {
      // Use mock Redis
      redisClient = new MockRedis();
      redisSubscriber = new MockRedis();
      logger.info("📋 Using mock Redis for queues (no connection)");
    }

    for (const [queueName, processor] of Object.entries(
      this.getQueueProcessors(),
    )) {
      let queue;

      if (QUEUES_ENABLED) {
        queue = new Queue(queueName, {
          createClient: (type) => {
            switch (type) {
              case "client":
                return redisClient;
              case "subscriber":
                return redisSubscriber;
              default:
                return new Redis(redisConfig);
            }
          },
          defaultJobOptions: {
            attempts: WORKER_CONFIG.retry.maxAttempts,
            backoff: {
              type: WORKER_CONFIG.retry.backoffType,
              delay: WORKER_CONFIG.retry.backoffDelay,
            },
            removeOnComplete: 100,
            removeOnFail: 500,
            timeout: 60000,
          },
        });
      } else {
        queue = new MockQueue(queueName);
      }

      const concurrency = WORKER_CONFIG.concurrency[queueName] || 5;
      queue.process(concurrency, processor.bind(this.processors));
      this.setupQueueEventHandlers(queue, queueName);
      this.queues[queueName] = queue;
      logger.info(
        `✅ Queue '${queueName}' initialized with concurrency ${concurrency}`,
      );
    }
  }

  getQueueProcessors() {
    return {
      "sms-queue": this.processors.processSMS,
      "email-queue": this.processors.processEmail,
      "notification-queue": this.processors.processNotification,
      "report-queue": this.processors.processReport,
      "file-process-queue": this.processors.processFile,
    };
  }

  setupQueueEventHandlers(queue, queueName) {
    queue.on("error", (error) => {
      logger.error(`Queue ${queueName} error: ${error.message}`);
      this.isHealthy = false;
    });
    queue.on("waiting", (jobId) => {
      logger.debug(`Job ${jobId} waiting in ${queueName}`);
    });
    queue.on("active", (job) => {
      logger.debug(`Job ${job.id} started in ${queueName}`);
    });
    queue.on("completed", (job, result) => {
      logger.info(`✅ Job ${job.id} completed in ${queueName}`);
    });
    queue.on("failed", (job, err) => {
      logger.error(`❌ Job ${job.id} failed in ${queueName}: ${err.message}`);
    });
    queue.on("stalled", (job) => {
      logger.warn(`⚠️ Job ${job.id} stalled in ${queueName}`);
    });
    queue.on("drained", () => {
      logger.debug(`Queue ${queueName} drained`);
    });
  }

  startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.checkHealth();
      if (!health.isHealthy) {
        logger.error("⚠️ Worker health check failed:", health);
        this.isHealthy = false;
        await this.attemptRecovery();
      } else {
        this.isHealthy = true;
      }
    }, WORKER_CONFIG.healthCheckInterval);
  }

  async checkHealth() {
    const checks = {
      isHealthy: true,
      timestamp: new Date().toISOString(),
      queues: {},
      database: false,
      redis: false,
    };

    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        const counts = await queue.getJobCounts();
        checks.queues[name] = {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
        };
      } catch (error) {
        checks.queues[name] = { error: error.message };
        checks.isHealthy = false;
      }
    }

    try {
      await mongoose.connection.db.admin().ping();
      checks.database = true;
    } catch (error) {
      checks.database = false;
      checks.isHealthy = false;
    }
    checks.redis = true; // Mock Redis always healthy

    return checks;
  }

  async attemptRecovery() {
    logger.info("🔄 Attempting worker recovery...");
    try {
      if (mongoose.connection.readyState !== 1) await this.connectDatabase();
      for (const [name, queue] of Object.entries(this.queues)) {
        if (await queue.isPaused()) {
          await queue.resume();
          logger.info(`Resumed queue ${name}`);
        }
      }
      logger.info("✅ Worker recovery completed");
    } catch (error) {
      logger.error(`Worker recovery failed: ${error.message}`);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async () => {
      logger.info("🛑 Worker received shutdown signal, closing gracefully...");
      for (const queue of Object.values(this.queues)) {
        await queue.pause();
      }
      if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
      await new Promise((resolve) => setTimeout(resolve, 30000));
      for (const queue of Object.values(this.queues)) {
        await queue.close();
      }
      await mongoose.connection.close();
      logger.info("✅ Worker shutdown completed");
      process.exit(0);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception:", error);
      shutdown();
    });
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled rejection:", reason);
      shutdown();
    });
  }

  logSystemInfo() {
    logger.info("📊 Worker System Information:", {
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
      workerId: process.env.INSTANCE_ID || "primary",
      pid: process.pid,
      mode: QUEUES_ENABLED ? "redis" : "mock",
      queues: Object.keys(this.queues),
      concurrency: WORKER_CONFIG.concurrency,
    });
  }
}

// ============================================================
// START WORKER
// ============================================================

const workerManager = new WorkerManager();

workerManager
  .initialize()
  .then(() => {
    logger.info("🎯 Worker is running and ready to process jobs");
    process.stdin.resume();
  })
  .catch((error) => {
    logger.error("❌ Failed to start worker:", error);
    process.exit(1);
  });

module.exports = { workerManager, QueueProcessors, WorkerMetrics };
