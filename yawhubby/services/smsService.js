// services/smsService.js
// Professional Enterprise-Grade SMS Service with Multi-Provider Support
// UPDATED: Redis disabled - uses mock queue when REDIS_ENABLED=false

const axios = require("axios");
const logger = require("../utils/logger");

// ============================================================
// CHECK IF REDIS/QUEUES ARE ENABLED
// ============================================================
const REDIS_ENABLED = process.env.REDIS_ENABLED === "true";
const QUEUES_ENABLED = process.env.QUEUES_ENABLED === "true" && REDIS_ENABLED;

// ============================================================
// MOCK QUEUE CLASS - NO REDIS CONNECTION
// ============================================================
class MockQueue {
  constructor(name, url, opts = {}) {
    this.name = name;
    this.processors = [];
    this.jobs = [];
    this.stats = { sent: 0, failed: 0, queued: 0, retried: 0 };
    logger.info(`📋 Mock SMS queue "${name}" initialized (Redis disabled)`);
  }

  process(concurrency, handler) {
    if (typeof concurrency === "function") {
      handler = concurrency;
      concurrency = 1;
    }
    this.processors.push({ concurrency, handler });
    return this;
  }

  async add(data, opts = {}) {
    const job = {
      id: `sms-mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data,
      opts,
      timestamp: Date.now(),
      attemptsMade: 0,
    };
    this.jobs.push(job);
    this.stats.queued++;
    logger.debug(`📋 Mock SMS job added to "${this.name}"`);

    if (
      process.env.PROCESS_MOCK_JOBS === "true" &&
      this.processors.length > 0
    ) {
      setImmediate(async () => {
        try {
          await this.processors[0].handler(job);
          this.stats.sent++;
        } catch (err) {
          this.stats.failed++;
          logger.error(`Mock SMS job failed: ${err.message}`);
        }
      });
    }

    return {
      id: job.id,
      finished: () => Promise.resolve({ success: true, simulated: true }),
    };
  }

  on(event, callback) {
    return this;
  }

  async close() {
    logger.info(`📋 Mock SMS queue "${this.name}" closed`);
    return;
  }

  async getJobCounts() {
    return { waiting: this.jobs.length, active: 0, completed: 0, failed: 0 };
  }
}

// ============================================================
// CONDITIONAL BULL IMPORT
// ============================================================
let Queue;
if (QUEUES_ENABLED) {
  try {
    const Bull = require("bull");
    Queue = Bull;
    logger.info("✅ Bull queue enabled for SMS service");
  } catch (err) {
    logger.warn(`⚠️ Bull not available: ${err.message} - using mock queue`);
    Queue = MockQueue;
  }
} else {
  logger.info(
    "ℹ️ SMS queue disabled (REDIS_ENABLED=false or QUEUES_ENABLED=false)",
  );
  Queue = MockQueue;
}

// ============================================================
// CONFIGURATION
// ============================================================

const SMS_CONFIG = {
  primary: {
    type: process.env.SMS_PRIMARY_PROVIDER || "textbee",
    enabled: process.env.SMS_ENABLED === "true",
    retryAttempts: parseInt(process.env.SMS_RETRY_ATTEMPTS || "3"),
    retryDelay: parseInt(process.env.SMS_RETRY_DELAY || "5000"),
    queueName: "sms-queue",
  },
  fallbacks: [
    {
      type: "twilio",
      enabled: process.env.TWILIO_ENABLED === "true",
      priority: 1,
    },
    {
      type: "africasTalking",
      enabled: process.env.AFRICASTALKING_ENABLED === "true",
      priority: 2,
    },
  ],
  rateLimit: {
    perSecond: parseInt(process.env.SMS_RATE_PER_SECOND || "5"),
    perMinute: parseInt(process.env.SMS_RATE_PER_MINUTE || "200"),
    perHour: parseInt(process.env.SMS_RATE_PER_HOUR || "1000"),
  },
  maxMessageLength: 1600,
  maxRetries: 3,
  circuitBreaker: { failureThreshold: 5, timeout: 60000 },
};

// ============================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================

class SMSProvider {
  constructor(config) {
    this.config = config;
    this.name = config.type;
    this.failures = 0;
    this.lastFailureTime = null;
    this.isOpen = true;
  }

  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "233" + cleaned.substring(1);
    if (!cleaned.startsWith("233") && !cleaned.startsWith("+"))
      cleaned = "233" + cleaned;
    return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
  }

  isCircuitBreakerOpen() {
    if (!this.isOpen) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > SMS_CONFIG.circuitBreaker.timeout) {
        this.isOpen = true;
        this.failures = 0;
        logger.info(`[${this.name}] Circuit breaker reset`);
        return false;
      }
      return true;
    }
    return false;
  }

  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= SMS_CONFIG.circuitBreaker.failureThreshold) {
      this.isOpen = false;
      logger.error(
        `[${this.name}] Circuit breaker OPEN due to ${this.failures} failures`,
      );
    }
  }

  recordSuccess() {
    this.failures = 0;
    this.isOpen = true;
  }
}

class TextBeeProvider extends SMSProvider {
  constructor() {
    super({
      type: "textbee",
      apiUrl:
        process.env.TEXTBEE_API_URL || "https://api.textbee.dev/api/v1/gateway",
      apiKey: process.env.TEXTBEE_API_KEY,
      deviceId: process.env.TEXTBEE_DEVICE_ID,
    });
  }

  async send(phoneNumber, message, metadata = {}) {
    if (!this.config.apiKey || !this.config.deviceId)
      throw new Error("TextBee credentials not configured");
    const formattedNumber = this.formatPhoneNumber(phoneNumber);

    // Simulate if SMS disabled
    if (process.env.SMS_ENABLED !== "true") {
      logger.info(
        `[SMS Simulation] Would send to ${formattedNumber}: ${message.substring(0, 100)}...`,
      );
      return {
        success: true,
        simulated: true,
        provider: "textbee",
        messageId: `sim_${Date.now()}`,
      };
    }

    const response = await axios.post(
      `${this.config.apiUrl}/devices/${this.config.deviceId}/send-sms`,
      {
        recipients: [formattedNumber],
        message: message.substring(0, SMS_CONFIG.maxMessageLength),
        schedule: metadata.scheduleTime || null,
        priority: metadata.priority || "normal",
      },
      {
        headers: {
          "x-api-key": this.config.apiKey,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    if (response.data?.status !== "success")
      throw new Error(response.data?.message || "TextBee send failed");
    return {
      success: true,
      provider: "textbee",
      messageId: response.data.messageId || `textbee_${Date.now()}`,
      cost: 0,
    };
  }
}

class TwilioProvider extends SMSProvider {
  constructor() {
    super({
      type: "twilio",
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    });
  }

  async send(phoneNumber, message, metadata = {}) {
    if (!this.config.accountSid || !this.config.authToken)
      throw new Error("Twilio credentials not configured");
    const client = require("twilio")(
      this.config.accountSid,
      this.config.authToken,
    );
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const response = await client.messages.create({
      body: message.substring(0, SMS_CONFIG.maxMessageLength),
      to: formattedNumber,
      from: this.config.phoneNumber,
    });
    return {
      success: true,
      provider: "twilio",
      messageId: response.sid,
      cost: 0.0075,
    };
  }
}

class AfricaTalkingProvider extends SMSProvider {
  constructor() {
    super({
      type: "africasTalking",
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME || "sandbox",
    });
  }

  async send(phoneNumber, message, metadata = {}) {
    if (!this.config.apiKey)
      throw new Error("Africa's Talking credentials not configured");
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const response = await axios.post(
      "https://api.africastalking.com/version1/messaging",
      new URLSearchParams({
        username: this.config.username,
        to: formattedNumber,
        message: message.substring(0, SMS_CONFIG.maxMessageLength),
        from: metadata.senderId || "",
      }),
      {
        headers: {
          apiKey: this.config.apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 30000,
      },
    );
    if (response.data?.SMSMessageData?.Recipients?.[0]?.status !== "Success")
      throw new Error("Africa's Talking send failed");
    return {
      success: true,
      provider: "africasTalking",
      messageId: response.data.SMSMessageData.Recipients[0].messageId,
      cost: 0.05,
    };
  }
}

class VonageProvider extends SMSProvider {
  constructor() {
    super({
      type: "vonage",
      apiKey: process.env.VONAGE_API_KEY,
      apiSecret: process.env.VONAGE_API_SECRET,
      from: process.env.VONAGE_FROM_NUMBER,
    });
  }

  async send(phoneNumber, message, metadata = {}) {
    if (!this.config.apiKey || !this.config.apiSecret)
      throw new Error("Vonage credentials not configured");
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const response = await axios.post(
      "https://rest.nexmo.com/sms/json",
      {
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
        to: formattedNumber,
        from: this.config.from || "KAAF",
        text: message.substring(0, SMS_CONFIG.maxMessageLength),
        type: "unicode",
      },
      { timeout: 30000 },
    );
    if (response.data?.messages?.[0]?.status !== "0")
      throw new Error(
        response.data?.messages?.[0]?.error_text || "Vonage send failed",
      );
    return {
      success: true,
      provider: "vonage",
      messageId: response.data.messages[0]["message-id"],
      cost: 0.006,
    };
  }
}

// ============================================================
// SMS QUEUE MANAGER
// ============================================================

class SMSQueueManager {
  constructor() {
    this.queue = null;
    this.providers = [];
    this.stats = { sent: 0, failed: 0, queued: 0, retried: 0 };
    this.initializeQueue();
    this.initializeProviders();
  }

  initializeQueue() {
    const RedisURL = QUEUES_ENABLED
      ? process.env.REDIS_URL || "redis://localhost:6379"
      : null;

    if (QUEUES_ENABLED && RedisURL) {
      try {
        this.queue = new Queue(SMS_CONFIG.primary.queueName, RedisURL, {
          defaultJobOptions: {
            attempts: SMS_CONFIG.maxRetries,
            backoff: {
              type: "exponential",
              delay: SMS_CONFIG.primary.retryDelay,
            },
            removeOnComplete: 100,
            removeOnFail: 500,
          },
          limiter: { max: SMS_CONFIG.rateLimit.perSecond, duration: 1000 },
        });
        this.queue.process(async (job) => {
          const { phoneNumber, message, metadata } = job.data;
          return await this.processWithFailover(phoneNumber, message, metadata);
        });
        this.setupQueueEvents();
        logger.info("✅ SMS Queue initialized with Redis");
      } catch (error) {
        logger.warn(
          `⚠️ Failed to initialize Redis queue: ${error.message} - using mock`,
        );
        this.queue = new MockQueue(SMS_CONFIG.primary.queueName, RedisURL);
      }
    } else {
      this.queue = new MockQueue(SMS_CONFIG.primary.queueName, null);
    }
  }

  setupQueueEvents() {
    if (!this.queue || this.queue instanceof MockQueue) return;
    this.queue.on("completed", (job, result) => {
      this.stats.sent++;
      logger.debug(`[SMS Queue] Job ${job.id} completed`);
    });
    this.queue.on("failed", (job, err) => {
      this.stats.failed++;
      logger.error(`[SMS Queue] Job ${job.id} failed: ${err.message}`);
    });
    this.queue.on("retrying", (job, err) => {
      this.stats.retried++;
      logger.warn(`[SMS Queue] Retrying job ${job.id}`);
    });
  }

  initializeProviders() {
    if (SMS_CONFIG.primary.enabled && SMS_CONFIG.primary.type === "textbee")
      this.providers.push(new TextBeeProvider());
    for (const fallback of SMS_CONFIG.fallbacks.sort(
      (a, b) => a.priority - b.priority,
    )) {
      if (fallback.enabled) {
        if (fallback.type === "twilio")
          this.providers.push(new TwilioProvider());
        else if (fallback.type === "africasTalking")
          this.providers.push(new AfricaTalkingProvider());
        else if (fallback.type === "vonage")
          this.providers.push(new VonageProvider());
      }
    }
    logger.info(`✅ Initialized ${this.providers.length} SMS providers`);
  }

  async processWithFailover(phoneNumber, message, metadata = {}) {
    let lastError = null;
    for (const provider of this.providers) {
      try {
        if (provider.isCircuitBreakerOpen()) {
          logger.debug(`[${provider.name}] Circuit breaker open, skipping`);
          continue;
        }
        const result = await provider.send(phoneNumber, message, metadata);
        provider.recordSuccess();
        await this.logSMSEvent({
          phoneNumber,
          message,
          provider: provider.name,
          messageId: result.messageId,
          cost: result.cost,
          status: "sent",
          ...metadata,
        });
        return result;
      } catch (error) {
        lastError = error;
        provider.recordFailure();
        logger.error(`[${provider.name}] Failed: ${error.message}`);
        await this.logSMSEvent({
          phoneNumber,
          message,
          provider: provider.name,
          error: error.message,
          status: "failed",
          ...metadata,
        });
      }
    }
    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  async sendSMS(phoneNumber, message, metadata = {}) {
    if (!phoneNumber || !message)
      throw new Error("Phone number and message are required");

    if (process.env.SMS_ENABLED !== "true") {
      logger.info(
        `[SMS Simulation] Would send to ${phoneNumber}: ${message.substring(0, 100)}...`,
      );
      await this.logSMSEvent({
        phoneNumber,
        message,
        provider: "simulation",
        status: "simulated",
        ...metadata,
      });
      return { success: true, simulated: true, messageId: `sim_${Date.now()}` };
    }

    // Send directly without queue (Redis disabled)
    return await this.processWithFailover(phoneNumber, message, metadata);
  }

  async logSMSEvent(data) {
    try {
      const SMSLog = require("../models/SMSLog");
      const logData = {
        phoneNumber: data.phoneNumber,
        message: data.message,
        provider: data.provider,
        providerMessageId: data.messageId,
        status: data.status,
        cost: data.cost || 0,
        metadata: data.metadata || {},
        userId: data.userId,
        batchId: data.batchId,
        createdBy: data.createdBy,
        errorCode: data.errorCode,
        errorMessage: data.error,
      };
      if (data.status === "sent") logData.sentAt = new Date();
      if (data.status === "failed") logData.failedAt = new Date();
      if (data.status === "queued") logData.queuedAt = new Date();
      const smsLog = new SMSLog(logData);
      await smsLog.save();
      return smsLog;
    } catch (error) {
      logger.error("Failed to log SMS event:", error.message);
    }
  }

  async getStats() {
    const queueStats =
      this.queue instanceof MockQueue
        ? {
            waiting: this.queue.jobs.length,
            active: 0,
            completed: 0,
            failed: 0,
          }
        : await this.queue.getJobCounts();
    return {
      ...this.stats,
      queue: queueStats,
      providers: this.providers.map((p) => ({
        name: p.name,
        failures: p.failures,
        isOpen: p.isOpen,
      })),
    };
  }

  async setupBullBoard(app) {
    if (this.queue && !(this.queue instanceof MockQueue)) {
      try {
        const { createBullBoard } = require("@bull-board/api");
        const { BullAdapter } = require("@bull-board/api/bullAdapter");
        const { ExpressAdapter } = require("@bull-board/express");
        const serverAdapter = new ExpressAdapter();
        serverAdapter.setBasePath("/admin/queues");
        createBullBoard({
          queues: [new BullAdapter(this.queue)],
          serverAdapter,
        });
        app.use("/admin/queues", serverAdapter.getRouter());
        logger.info("📊 Bull Board available at /admin/queues");
      } catch (error) {
        logger.warn("Failed to setup Bull Board:", error.message);
      }
    }
  }
}

// ============================================================
// TEMPLATE MANAGEMENT
// ============================================================

class SMSTemplateManager {
  static templates = {
    newNotice: (title, department) =>
      `📢 NEW NOTICE: ${title}\nDepartment: ${department}\nView on KAAF Noticeboard for details.`,
    eventReminder: (eventName, date, time) =>
      `🎓 EVENT REMINDER: ${eventName}\n📅 Date: ${date}\n⏰ Time: ${time}\nDon't miss out!`,
    eventRegistration: (eventName, registrationId) =>
      `✅ REGISTRATION CONFIRMED: ${eventName}\nID: ${registrationId}\nView your ticket on the portal.`,
    verificationCode: (code) =>
      `🔐 Your KAAF Noticeboard verification code is: ${code}\nValid for 10 minutes.`,
    passwordReset: (token) =>
      `🔑 Reset your KAAF Noticeboard password using this link: ${token}\nExpires in 1 hour.`,
    announcement: (title, summary) =>
      `📣 ${title}\n${summary}\nCheck the noticeboard for full details.`,
    systemMaintenance: (startTime, duration) =>
      `⚙️ SYSTEM MAINTENANCE: ${startTime} for ${duration}\nThe noticeboard may be temporarily unavailable.`,
    accountAlert: (action, status) =>
      `👤 ACCOUNT ${action.toUpperCase()}: ${status}\nContact support if unauthorized.`,
  };

  static render(templateName, variables) {
    const template = this.templates[templateName];
    if (!template) throw new Error(`Template "${templateName}" not found`);
    let message = template;
    for (const [key, value] of Object.entries(variables))
      message = message.replace(new RegExp(`{${key}}`, "g"), value);
    return message;
  }
}

// ============================================================
// BATCH SMS SENDER
// ============================================================

class BatchSMSSender {
  constructor(smsQueueManager) {
    this.smsQueueManager = smsQueueManager;
  }

  async sendBatch(recipients, templateName, variables, options = {}) {
    const batchId =
      options.batchId ||
      `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const results = {
      batchId,
      total: recipients.length,
      successful: 0,
      failed: 0,
      jobs: [],
      startTime: new Date(),
    };
    const batchSize = options.batchSize || 50;
    const delayBetweenBatches = options.delayBetweenBatches || 2000;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(async (recipient, index) => {
        try {
          const message = SMSTemplateManager.render(templateName, {
            ...variables,
            name: recipient.name || "",
          });
          const result = await this.smsQueueManager.sendSMS(
            recipient.phoneNumber,
            message,
            {
              priority: options.priority || "normal",
              category: options.category || "batch",
              batchId,
              userId: recipient.userId,
              createdBy: options.createdBy,
            },
          );
          results.successful++;
          results.jobs.push({
            phoneNumber: recipient.phoneNumber,
            name: recipient.name,
            result,
          });
          return result;
        } catch (error) {
          results.failed++;
          logger.error(
            `Failed to send to ${recipient.phoneNumber}:`,
            error.message,
          );
          results.jobs.push({
            phoneNumber: recipient.phoneNumber,
            name: recipient.name,
            error: error.message,
          });
          return null;
        }
      });
      await Promise.all(batchPromises);
      if (i + batchSize < recipients.length)
        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenBatches),
        );
    }
    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;
    return results;
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let smsQueueManagerInstance = null;

const initializeSMSService = async () => {
  if (!smsQueueManagerInstance) smsQueueManagerInstance = new SMSQueueManager();
  return smsQueueManagerInstance;
};

const sendSMS = async (phoneNumber, message, metadata = {}) => {
  const manager = await initializeSMSService();
  return await manager.sendSMS(phoneNumber, message, metadata);
};

const sendTemplatedSMS = async (
  phoneNumber,
  templateName,
  variables,
  metadata = {},
) => {
  const message = SMSTemplateManager.render(templateName, variables);
  return await sendSMS(phoneNumber, message, metadata);
};

const sendBatchSMS = async (
  recipients,
  templateName,
  variables,
  options = {},
) => {
  const manager = await initializeSMSService();
  const batchSender = new BatchSMSSender(manager);
  return await batchSender.sendBatch(
    recipients,
    templateName,
    variables,
    options,
  );
};

const getSMSStats = async () => {
  const manager = await initializeSMSService();
  return await manager.getStats();
};

const setupSMSDashboard = async (app) => {
  const manager = await initializeSMSService();
  await manager.setupBullBoard(app);
};

module.exports = {
  sendSMS,
  sendTemplatedSMS,
  sendBatchSMS,
  getSMSStats,
  initializeSMSService,
  SMSTemplateManager,
};

