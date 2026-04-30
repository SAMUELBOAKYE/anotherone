// utils/notificationService.js
// Enterprise-Grade Notification Service for KAAF University Noticeboard System
// Handles real-time notifications, email alerts, push notifications, and SMS with multi-channel delivery
// @version 2.1.0
// @author Boakye Samuel Yiadom

const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail, sendBulkEmails } = require("./emailService");
const {
  sendSMS,
  sendBatchSMS,
  sendTemplatedSMS,
  getSMSStats,
} = require("../services/smsService");
const {
  NOTIFICATION_TYPES,
  HTTP_STATUS,
  MESSAGES,
  USER_ROLES,
} = require("../config/constants");
const logger = require("./logger");
const crypto = require("crypto");

// ============================================================
// CONFIGURATION
// ============================================================

const NOTIFICATION_CONFIG = {
  // Batch processing
  batch: {
    size: parseInt(process.env.NOTIFICATION_BATCH_SIZE) || 100,
    delay: parseInt(process.env.NOTIFICATION_BATCH_DELAY) || 1000,
    maxConcurrent: parseInt(process.env.NOTIFICATION_MAX_CONCURRENT) || 5,
  },

  // Retry settings
  retry: {
    maxAttempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS) || 3,
    backoffDelay: parseInt(process.env.NOTIFICATION_RETRY_DELAY) || 5000,
    backoffType: "exponential",
  },

  // Channel priorities
  channelPriority: {
    inApp: 1,
    push: 2,
    email: 3,
    sms: 4,
  },

  // Notification types that require high priority delivery
  highPriorityTypes: [
    NOTIFICATION_TYPES.PASSWORD_RESET,
    NOTIFICATION_TYPES.ACCOUNT_VERIFICATION,
    NOTIFICATION_TYPES.SECURITY_ALERT,
    NOTIFICATION_TYPES.URGENT_NOTICE,
  ],

  // Template mapping
  templates: {
    [NOTIFICATION_TYPES.NEW_NOTICE]: {
      email: "newNotice",
      sms: "newNotice",
      push: "newNotice",
      priority: "normal",
    },
    [NOTIFICATION_TYPES.EVENT_REMINDER]: {
      email: "eventReminder",
      sms: "eventReminder",
      push: "eventReminder",
      priority: "high",
    },
    [NOTIFICATION_TYPES.EVENT_UPDATE]: {
      email: "eventUpdate",
      sms: "eventUpdate",
      push: "eventUpdate",
      priority: "normal",
    },
    [NOTIFICATION_TYPES.REGISTRATION_CONFIRMATION]: {
      email: "eventRegistration",
      sms: "eventRegistration",
      push: "eventRegistration",
      priority: "normal",
    },
    [NOTIFICATION_TYPES.CERTIFICATE_AVAILABLE]: {
      email: "certificateIssued",
      sms: "certificateIssued",
      push: "certificateIssued",
      priority: "normal",
    },
    [NOTIFICATION_TYPES.ACCOUNT_VERIFICATION]: {
      email: "accountVerification",
      sms: "verification",
      push: "accountVerification",
      priority: "high",
    },
    [NOTIFICATION_TYPES.PASSWORD_RESET]: {
      email: "passwordReset",
      sms: "passwordReset",
      push: null,
      priority: "urgent",
    },
    [NOTIFICATION_TYPES.SECURITY_ALERT]: {
      email: "securityAlert",
      sms: "securityAlert",
      push: "securityAlert",
      priority: "urgent",
    },
    [NOTIFICATION_TYPES.SYSTEM_ALERT]: {
      email: "systemAlert",
      sms: "systemAlert",
      push: "systemAlert",
      priority: "high",
    },
  },
};

// ============================================================
// NOTIFICATION SERVICE CLASS
// ============================================================

class NotificationService {
  /**
   * Create notification service instance
   * @param {Object} io - Socket.io instance for real-time notifications
   */
  constructor(io = null) {
    this.io = io;
    this.initialized = !!io;
    this.processingQueue = new Map();
    this.stats = {
      totalSent: 0,
      successInApp: 0,
      successEmail: 0,
      successPush: 0,
      successSMS: 0,
      failed: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Initialize Socket.io connection
   * @param {Object} io - Socket.io instance
   */
  initSocket(io) {
    this.io = io;
    this.initialized = true;
    logger.info("✅ NotificationService Socket.io initialized");
  }

  /**
   * Get notification priority based on type and custom priority
   * @param {string} type - Notification type
   * @param {string} customPriority - Custom priority override
   * @returns {number} Priority score (1-10, higher = more important)
   */
  getPriorityScore(type, customPriority = null) {
    if (customPriority === "urgent") return 10;
    if (customPriority === "high") return 8;
    if (customPriority === "low") return 2;

    const priorityMap = {
      [NOTIFICATION_TYPES.PASSWORD_RESET]: 10,
      [NOTIFICATION_TYPES.SECURITY_ALERT]: 10,
      [NOTIFICATION_TYPES.ACCOUNT_VERIFICATION]: 9,
      [NOTIFICATION_TYPES.SYSTEM_ALERT]: 9,
      [NOTIFICATION_TYPES.URGENT_NOTICE]: 9,
      [NOTIFICATION_TYPES.EVENT_REMINDER]: 7,
      [NOTIFICATION_TYPES.REGISTRATION_CONFIRMATION]: 6,
      [NOTIFICATION_TYPES.CERTIFICATE_AVAILABLE]: 5,
      [NOTIFICATION_TYPES.NEW_NOTICE]: 4,
      [NOTIFICATION_TYPES.EVENT_UPDATE]: 3,
    };

    return priorityMap[type] || 5;
  }

  /**
   * Determine delivery channels based on notification type and user preferences
   * @param {Object} user - User document
   * @param {string} type - Notification type
   * @param {Object} requestedChannels - Requested channels override
   * @returns {Object} Delivery channels configuration
   */
  determineDeliveryChannels(user, type, requestedChannels = null) {
    // Default channels
    const channels = {
      inApp: true,
      email: false,
      push: false,
      sms: false,
    };

    // If specific channels requested, use those
    if (requestedChannels) {
      return { ...channels, ...requestedChannels };
    }

    // Check if notification type requires email
    const highPriorityTypes = [
      NOTIFICATION_TYPES.PASSWORD_RESET,
      NOTIFICATION_TYPES.ACCOUNT_VERIFICATION,
      NOTIFICATION_TYPES.SECURITY_ALERT,
    ];

    if (highPriorityTypes.includes(type)) {
      channels.email = true;
    }

    // Check user preferences
    if (user.preferences?.notifications) {
      const prefs = user.preferences.notifications;
      if (prefs.email !== undefined)
        channels.email = channels.email && prefs.email;
      if (prefs.push !== undefined) channels.push = prefs.push;
      if (prefs.sms !== undefined && user.phone) channels.sms = prefs.sms;
    }

    return channels;
  }

  /**
   * Create and send notification through all channels
   * @param {Object} data - Notification data
   * @returns {Promise<Object|null>} Created notification
   */
  async createNotification(data) {
    const requestId = crypto.randomBytes(8).toString("hex");
    const startTime = Date.now();

    try {
      const {
        user,
        type,
        title,
        message,
        body,
        referenceId,
        referenceModel,
        priority = "normal",
        actionUrl,
        actionLabel = "View",
        scheduledFor = null,
        expiresAt = null,
        metadata = {},
        deliveryChannels = null,
        sendEmail = false,
        sendSMS = false,
        sendPush = false,
      } = data;

      // Validate required fields
      if (!user || !type || !title || !message) {
        logger.error("Missing required notification fields", {
          user,
          type,
          title,
          message,
        });
        return null;
      }

      // Get user for preferences
      const userDoc = await User.findById(user).select(
        "firstName lastName email phone preferences role",
      );
      if (!userDoc) {
        logger.error(`User not found: ${user}`);
        return null;
      }

      // Determine delivery channels
      const finalDeliveryChannels =
        deliveryChannels ||
        this.determineDeliveryChannels(userDoc, type, {
          inApp: true,
          email: sendEmail,
          push: sendPush,
          sms: sendSMS,
        });

      // Calculate priority score
      const priorityScore = this.getPriorityScore(type, priority);

      // Create notification record
      const notification = await Notification.createNotification({
        user,
        type,
        title,
        message,
        body: body || message.substring(0, 100),
        referenceId,
        referenceModel,
        priority,
        urgencyScore: priorityScore,
        actionUrl,
        actionLabel,
        scheduledFor,
        expiresAt,
        metadata: {
          ...metadata,
          requestId,
          userAgent: metadata.userAgent,
          ipAddress: metadata.ipAddress,
        },
        deliveryChannels: finalDeliveryChannels,
        createdBy: metadata.createdBy,
      });

      logger.info(
        `📬 Notification created [${requestId}] for user ${user}: ${title}`,
        {
          type,
          priority: priorityScore,
          channels: finalDeliveryChannels,
        },
      );

      // Send immediately if not scheduled
      if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
        await this.deliverNotification(notification, userDoc);
      }

      // Update stats
      this.stats.totalSent++;

      return notification;
    } catch (error) {
      logger.error(`Create notification error [${requestId}]:`, error);
      this.stats.failed++;
      return null;
    }
  }

  /**
   * Deliver notification through configured channels
   * @param {Object} notification - Notification document
   * @param {Object} userDoc - User document (optional, will fetch if not provided)
   */
  async deliverNotification(notification, userDoc = null) {
    const userId = notification.user;
    const startTime = Date.now();

    try {
      // Fetch user if not provided
      const user =
        userDoc ||
        (await User.findById(userId).select(
          "firstName lastName email phone preferences pushSubscription",
        ));
      if (!user) {
        logger.error(`User not found for notification delivery: ${userId}`);
        return;
      }

      const deliveryPromises = [];

      // Send real-time via Socket.io
      if (notification.deliveryChannels.inApp) {
        deliveryPromises.push(
          this.sendRealtime(userId, notification)
            .then(() => {
              this.stats.successInApp++;
            })
            .catch((err) => {
              logger.error(`InApp delivery failed for ${userId}:`, err.message);
            }),
        );
      }

      // Send push notification if user has subscription
      if (notification.deliveryChannels.push && user.pushSubscription) {
        deliveryPromises.push(
          this.sendPushNotification(userId, notification, user)
            .then(() => {
              this.stats.successPush++;
            })
            .catch((err) => {
              logger.error(`Push delivery failed for ${userId}:`, err.message);
            }),
        );
      }

      // Send email for notifications that require it
      if (notification.deliveryChannels.email && user.email) {
        deliveryPromises.push(
          this.sendEmailNotification(userId, notification, user)
            .then(() => {
              this.stats.successEmail++;
            })
            .catch((err) => {
              logger.error(`Email delivery failed for ${userId}:`, err.message);
            }),
        );
      }

      // Send SMS for urgent notifications or when requested
      if (notification.deliveryChannels.sms && user.phone) {
        deliveryPromises.push(
          this.sendSMSNotification(userId, notification, user)
            .then(() => {
              this.stats.successSMS++;
            })
            .catch((err) => {
              logger.error(`SMS delivery failed for ${userId}:`, err.message);
            }),
        );
      }

      // Wait for all deliveries to complete (or fail)
      await Promise.allSettled(deliveryPromises);

      const duration = Date.now() - startTime;
      logger.debug(
        `Notification ${notification._id} delivered in ${duration}ms`,
      );
    } catch (error) {
      logger.error(`Deliver notification error for ${userId}:`, error);
      notification.deliveryStatus.inApp.error = error.message;
      await notification.save();
    }
  }

  /**
   * Send real-time notification via Socket.io
   * @param {string} userId - User ID
   * @param {Object} notification - Notification document
   */
  async sendRealtime(userId, notification) {
    try {
      if (this.io && this.initialized) {
        const room = `user-${userId.toString()}`;
        const notificationData = {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          body: notification.body || notification.message,
          priority: notification.priority,
          urgencyScore: notification.urgencyScore,
          actionUrl: notification.actionUrl,
          actionLabel: notification.actionLabel,
          createdAt: notification.createdAt,
          isRead: notification.isRead,
          metadata: notification.metadata,
        };

        this.io.to(room).emit("notification", notificationData);

        // Also emit to user's personal room for redundancy
        this.io.to(`user-${userId}`).emit("new_notification", notificationData);

        // Update delivery status
        notification.deliveryStatus.inApp = {
          delivered: true,
          deliveredAt: new Date(),
        };
        await notification.save();

        logger.debug(`📱 Real-time notification sent to user ${userId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Realtime notification error for ${userId}:`, error);
      notification.deliveryStatus.inApp = {
        delivered: false,
        error: error.message,
      };
      await notification.save();
      throw error;
    }
  }

  /**
   * Send push notification (Web Push)
   * @param {string} userId - User ID
   * @param {Object} notification - Notification document
   * @param {Object} user - User document
   */
  async sendPushNotification(userId, notification, user) {
    try {
      if (!user.pushSubscription) {
        logger.debug(`No push subscription for user ${userId}`);
        return false;
      }

      // Check if web-push is available
      let webPush;
      try {
        webPush = require("web-push");
      } catch (err) {
        logger.warn(
          "web-push module not available, skipping push notification",
        );
        return false;
      }

      // Configure VAPID keys if available
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webPush.setVapidDetails(
          process.env.VAPID_SUBJECT || "mailto:noreply@kaaf.edu.gh",
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY,
        );
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message,
        icon: "/icons/notification-icon.png",
        badge: "/icons/badge-icon.png",
        tag: notification.type,
        data: {
          url: notification.actionUrl || "/notifications",
          notificationId: notification._id.toString(),
          type: notification.type,
        },
        timestamp: Date.now(),
      });

      await webPush.sendNotification(user.pushSubscription, payload);

      notification.deliveryStatus.push = {
        delivered: true,
        deliveredAt: new Date(),
      };
      await notification.save();

      logger.debug(`📲 Push notification sent to user ${userId}`);
      return true;
    } catch (error) {
      // If subscription is invalid, remove it
      if (error.statusCode === 410 || error.message?.includes("expired")) {
        await User.findByIdAndUpdate(userId, { pushSubscription: null });
        logger.warn(`Removed invalid push subscription for user ${userId}`);
      }

      notification.deliveryStatus.push = {
        delivered: false,
        error: error.message,
      };
      await notification.save();
      throw error;
    }
  }

  /**
   * Send email notification
   * @param {string} userId - User ID
   * @param {Object} notification - Notification document
   * @param {Object} user - User document
   */
  async sendEmailNotification(userId, notification, user) {
    try {
      if (!user.email) {
        logger.debug(`No email for user ${userId}`);
        return false;
      }

      // Get template from config
      const templateConfig =
        NOTIFICATION_CONFIG.templates[notification.type] ||
        NOTIFICATION_CONFIG.templates[NOTIFICATION_TYPES.NEW_NOTICE];
      const template = templateConfig.email;

      // Prepare email data
      const emailData = {
        name: user.firstName || "User",
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        type: notification.type,
        priority: notification.priority,
        ...notification.metadata,
      };

      await sendEmail({
        to: user.email,
        subject: notification.title,
        template,
        data: emailData,
      });

      notification.deliveryStatus.email = {
        delivered: true,
        deliveredAt: new Date(),
      };
      await notification.save();

      logger.debug(`📧 Email notification sent to ${user.email}`);
      return true;
    } catch (error) {
      notification.deliveryStatus.email = {
        delivered: false,
        error: error.message,
      };
      await notification.save();
      throw error;
    }
  }

  /**
   * Send SMS notification
   * @param {string} userId - User ID
   * @param {Object} notification - Notification document
   * @param {Object} user - User document
   */
  async sendSMSNotification(userId, notification, user) {
    try {
      if (!user.phone) {
        logger.debug(`No phone number for user ${userId}`);
        return false;
      }

      // Check if SMS is enabled
      if (process.env.SMS_ENABLED !== "true") {
        logger.debug("SMS service disabled, skipping SMS notification");
        return false;
      }

      // Get template from config
      const templateConfig =
        NOTIFICATION_CONFIG.templates[notification.type] ||
        NOTIFICATION_CONFIG.templates[NOTIFICATION_TYPES.NEW_NOTICE];
      const templateName = templateConfig.sms;

      // Prepare variables
      const variables = {
        title: notification.title,
        message: notification.message,
        summary: notification.message.substring(0, 100),
        ...notification.metadata,
      };

      // Send SMS
      const result = await sendTemplatedSMS(
        user.phone,
        templateName,
        variables,
        {
          priority: notification.priority === "urgent" ? "high" : "normal",
          category: "notification",
          userId,
          notificationId: notification._id,
        },
      );

      notification.deliveryStatus.sms = {
        delivered: result.success,
        deliveredAt: result.success ? new Date() : null,
        messageId: result.messageId,
        error: result.error,
      };
      await notification.save();

      if (result.success) {
        logger.debug(`📱 SMS notification sent to ${user.phone}`);
      }
      return result.success;
    } catch (error) {
      notification.deliveryStatus.sms = {
        delivered: false,
        error: error.message,
      };
      await notification.save();
      throw error;
    }
  }

  /**
   * Notify all users about new notice
   * @param {Object} notice - Notice document
   * @param {Array} targetUsers - Optional array of user IDs
   * @returns {Promise<Object>} Notification results
   */
  async notifyNewNotice(notice, targetUsers = null) {
    const startTime = Date.now();

    try {
      let users = targetUsers;

      if (!users) {
        // Build query for target users based on notice targeting
        const query = {
          isActive: true,
          isSuspended: false,
          deletedAt: null,
        };

        if (
          notice.targetDepartments &&
          !notice.targetDepartments.includes("all")
        ) {
          query.department = { $in: notice.targetDepartments };
        }

        if (notice.targetRoles && !notice.targetRoles.includes("all")) {
          query.role = { $in: notice.targetRoles };
        }

        if (notice.targetYears && notice.targetYears.length > 0) {
          query.yearOfStudy = { $in: notice.targetYears };
        }

        users = await User.find(query).select("_id");
        users = users.map((u) => u._id);
      }

      if (users.length === 0) {
        logger.info(`No target users for notice: ${notice.title}`);
        return { success: true, count: 0, users: [] };
      }

      // Determine if this is urgent
      const isUrgent = notice.priority === "urgent" || notice.isImportant;
      const priority = isUrgent
        ? "urgent"
        : notice.isImportant
          ? "high"
          : "normal";

      // Create notification for each user (batch processing)
      const results = {
        total: users.length,
        successful: 0,
        failed: 0,
        notifications: [],
      };

      // Process in batches to avoid overwhelming the system
      const batchSize = NOTIFICATION_CONFIG.batch.size;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const batchPromises = batch.map(async (userId) => {
          try {
            const notification = await this.createNotification({
              user: userId,
              type: NOTIFICATION_TYPES.NEW_NOTICE,
              title: `New Notice: ${notice.title}`,
              message:
                notice.summary ||
                (notice.content
                  ? notice.content.substring(0, 150) + "..."
                  : "Click to view details"),
              referenceId: notice._id,
              referenceModel: "Notice",
              priority,
              actionUrl: `/notices/${notice._id}`,
              actionLabel: "View Notice",
              sendEmail: isUrgent,
              sendPush: true,
              metadata: {
                noticeId: notice._id,
                category: notice.category,
                department: notice.targetDepartments,
              },
            });

            if (notification) {
              results.successful++;
              results.notifications.push(notification);
            } else {
              results.failed++;
            }
          } catch (error) {
            results.failed++;
            logger.error(`Failed to notify user ${userId}:`, error.message);
          }
        });

        await Promise.all(batchPromises);

        // Delay between batches
        if (i + batchSize < users.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, NOTIFICATION_CONFIG.batch.delay),
          );
        }
      }

      const duration = Date.now() - startTime;
      logger.info(
        `📢 Sent ${results.successful} notifications for notice: ${notice.title} in ${duration}ms`,
        {
          total: results.total,
          successful: results.successful,
          failed: results.failed,
          isUrgent,
        },
      );

      return results;
    } catch (error) {
      logger.error("Notify new notice error:", error);
      return { success: false, count: 0, users: [], error: error.message };
    }
  }

  /**
   * Notify users about new event
   * @param {Object} event - Event document
   * @param {Array} targetUsers - Optional array of user IDs
   * @returns {Promise<Object>} Notification results
   */
  async notifyNewEvent(event, targetUsers = null) {
    const startTime = Date.now();

    try {
      let users = targetUsers;

      if (!users) {
        const query = {
          isActive: true,
          isSuspended: false,
          deletedAt: null,
        };

        if (
          event.targetDepartments &&
          !event.targetDepartments.includes("all")
        ) {
          query.department = { $in: event.targetDepartments };
        }

        if (event.targetRoles && !event.targetRoles.includes("all")) {
          query.role = { $in: event.targetRoles };
        }

        users = await User.find(query).select("_id");
        users = users.map((u) => u._id);
      }

      if (users.length === 0) {
        logger.info(`No target users for event: ${event.title}`);
        return { success: true, count: 0 };
      }

      const results = {
        total: users.length,
        successful: 0,
        failed: 0,
      };

      const eventDate = new Date(event.eventDate).toLocaleDateString();

      // Process in batches
      const batchSize = NOTIFICATION_CONFIG.batch.size;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const batchPromises = batch.map(async (userId) => {
          try {
            const notification = await this.createNotification({
              user: userId,
              type: NOTIFICATION_TYPES.NEW_NOTICE,
              title: `New Event: ${event.title}`,
              message: `${event.summary || event.description?.substring(0, 150)} Join us on ${eventDate} at ${event.venue || "TBD"}`,
              referenceId: event._id,
              referenceModel: "Event",
              priority: "normal",
              actionUrl: `/events/${event._id}`,
              actionLabel: "View & Register",
              sendEmail: false,
              sendPush: true,
              metadata: {
                eventId: event._id,
                eventDate: event.eventDate,
                venue: event.venue,
                type: event.type,
              },
            });

            if (notification) results.successful++;
            else results.failed++;
          } catch (error) {
            results.failed++;
          }
        });

        await Promise.all(batchPromises);

        if (i + batchSize < users.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, NOTIFICATION_CONFIG.batch.delay),
          );
        }
      }

      const duration = Date.now() - startTime;
      logger.info(
        `📅 Sent ${results.successful} notifications for event: ${event.title} in ${duration}ms`,
      );

      return results;
    } catch (error) {
      logger.error("Notify new event error:", error);
      return { success: false, count: 0, error: error.message };
    }
  }

  /**
   * Send event reminder to registered users
   * @param {Object} event - Event document
   * @param {Object} user - User document
   * @returns {Promise<Object|null>} Created notification
   */
  async sendEventReminder(event, user) {
    try {
      const eventDate = new Date(event.eventDate);
      const daysUntil = Math.ceil(
        (eventDate - new Date()) / (1000 * 60 * 60 * 24),
      );

      // Only send if event is upcoming
      if (daysUntil < 0) return null;

      const reminderMessage =
        daysUntil === 0
          ? `Today! ${event.title} starts at ${event.startTime || "scheduled time"} at ${event.venue || "TBD"}`
          : `Reminder: ${event.title} is in ${daysUntil} day${daysUntil !== 1 ? "s" : ""} (${eventDate.toLocaleDateString()}) at ${event.startTime || "scheduled time"}`;

      return await this.createNotification({
        user: user._id,
        type: NOTIFICATION_TYPES.EVENT_REMINDER,
        title: `Event Reminder: ${event.title}`,
        message: reminderMessage,
        referenceId: event._id,
        referenceModel: "Event",
        priority: "high",
        actionUrl: `/events/${event._id}`,
        actionLabel: "View Event Details",
        sendEmail: true,
        sendSMS: daysUntil <= 1, // Send SMS for same-day reminders
        sendPush: true,
        metadata: {
          eventId: event._id,
          eventDate: event.eventDate,
          daysUntil,
          venue: event.venue,
        },
      });
    } catch (error) {
      logger.error("Event reminder error:", error);
      return null;
    }
  }

  /**
   * Send bulk event reminders to all registered users
   * @param {Object} event - Event document
   * @param {Array} registrations - Array of registration documents
   * @returns {Promise<Object>} Results
   */
  async sendBulkEventReminders(event, registrations) {
    const startTime = Date.now();

    try {
      const results = {
        total: registrations.length,
        successful: 0,
        failed: 0,
      };

      // Process in batches
      const batchSize = NOTIFICATION_CONFIG.batch.size;
      for (let i = 0; i < registrations.length; i += batchSize) {
        const batch = registrations.slice(i, i + batchSize);
        const batchPromises = batch.map(async (registration) => {
          try {
            const user = registration.userId || registration.user;
            if (user) {
              const notification = await this.sendEventReminder(event, user);
              if (notification) results.successful++;
              else results.failed++;
            }
          } catch (error) {
            results.failed++;
          }
        });

        await Promise.all(batchPromises);

        if (i + batchSize < registrations.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, NOTIFICATION_CONFIG.batch.delay),
          );
        }
      }

      const duration = Date.now() - startTime;
      logger.info(
        `📅 Sent ${results.successful} event reminders for ${event.title} in ${duration}ms`,
      );

      return results;
    } catch (error) {
      logger.error("Bulk event reminders error:", error);
      return {
        success: false,
        total: 0,
        successful: 0,
        failed: 0,
        error: error.message,
      };
    }
  }

  /**
   * Send registration confirmation
   * @param {Object} event - Event document
   * @param {Object} user - User document
   * @param {Object} registration - Registration document
   * @returns {Promise<Object|null>} Created notification
   */
  async sendRegistrationConfirmation(event, user, registration) {
    try {
      const ticketNumber =
        registration.ticketNumber ||
        `KAAF-${event._id.toString().slice(-6)}-${user._id.toString().slice(-4)}`;

      return await this.createNotification({
        user: user._id,
        type: NOTIFICATION_TYPES.REGISTRATION_CONFIRMATION,
        title: `Registration Confirmed: ${event.title}`,
        message: `You have successfully registered for ${event.title}. Event: ${new Date(event.eventDate).toLocaleDateString()} at ${event.startTime || "scheduled time"} - ${event.venue || "TBD"}. Ticket #: ${ticketNumber}`,
        referenceId: registration._id,
        referenceModel: "EventRegistration",
        priority: "normal",
        actionUrl: `/events/${event._id}`,
        actionLabel: "View Event",
        sendEmail: true,
        sendSMS: true,
        metadata: {
          ticketNumber,
          eventDate: event.eventDate,
          venue: event.venue,
          registrationId: registration._id,
        },
      });
    } catch (error) {
      logger.error("Registration confirmation error:", error);
      return null;
    }
  }

  /**
   * Send certificate issued notification
   * @param {Object} certificate - Certificate document
   * @param {Object} user - User document
   * @param {Object} event - Event document
   * @returns {Promise<Object|null>} Created notification
   */
  async sendCertificateNotification(certificate, user, event) {
    try {
      return await this.createNotification({
        user: user._id,
        type: NOTIFICATION_TYPES.CERTIFICATE_AVAILABLE,
        title: `Certificate Available: ${event.title}`,
        message: `Your certificate for ${event.title} is now available for download.`,
        referenceId: certificate._id,
        referenceModel: "Certificate",
        priority: "normal",
        actionUrl: `/certificates/${certificate._id}`,
        actionLabel: "Download Certificate",
        sendEmail: true,
        metadata: {
          certificateId: certificate._id,
          eventId: event._id,
          eventTitle: event.title,
        },
      });
    } catch (error) {
      logger.error("Certificate notification error:", error);
      return null;
    }
  }

  /**
   * Send waitlist promotion notification
   * @param {Object} event - Event document
   * @param {Object} user - User document
   * @returns {Promise<Object|null>} Created notification
   */
  async sendWaitlistPromotion(event, user) {
    try {
      return await this.createNotification({
        user: user._id,
        type: NOTIFICATION_TYPES.WAITLIST_PROMOTION,
        title: `You're off the waitlist! 🎉`,
        message: `A spot has opened up for "${event.title}". You have been promoted from the waitlist! Please confirm your attendance within 24 hours.`,
        referenceId: event._id,
        referenceModel: "Event",
        priority: "high",
        actionUrl: `/events/${event._id}/confirm`,
        actionLabel: "Confirm Attendance",
        sendEmail: true,
        sendSMS: true,
        metadata: {
          eventId: event._id,
          eventTitle: event.title,
          eventDate: event.eventDate,
        },
      });
    } catch (error) {
      logger.error("Waitlist promotion error:", error);
      return null;
    }
  }

  /**
   * Send system alert to admins
   * @param {string} title - Alert title
   * @param {string} message - Alert message
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Array>} Created notifications
   */
  async sendSystemAlert(title, message, metadata = {}) {
    try {
      const admins = await User.find({
        role: USER_ROLES.ADMIN,
        isActive: true,
      }).select("_id");

      const notifications = [];
      for (const admin of admins) {
        const notification = await this.createNotification({
          user: admin._id,
          type: NOTIFICATION_TYPES.SYSTEM_ALERT,
          title,
          message,
          priority: "urgent",
          actionUrl: "/admin/dashboard",
          actionLabel: "View Dashboard",
          sendEmail: true,
          metadata,
        });
        if (notification) notifications.push(notification);
      }

      logger.info(
        `Sent system alert to ${notifications.length} admins: ${title}`,
      );
      return notifications;
    } catch (error) {
      logger.error("Send system alert error:", error);
      return [];
    }
  }

  /**
   * Get user notifications with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Notifications and metadata
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type = null,
        priority = null,
        startDate = null,
        endDate = null,
      } = options;
      const skip = (page - 1) * limit;

      const query = { user: userId, deletedAt: null };
      if (unreadOnly) query.isRead = false;
      if (type) query.type = type;
      if (priority) query.priority = priority;
      if (startDate) query.createdAt = { $gte: new Date(startDate) };
      if (endDate)
        query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .sort({ urgencyScore: -1, priority: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(query),
        Notification.getUnreadCount(userId),
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        unreadCount,
        stats: {
          total,
          unread: unreadCount,
          read: total - unreadCount,
        },
      };
    } catch (error) {
      logger.error("Get user notifications error:", error);
      return {
        notifications: [],
        pagination: {},
        unreadCount: 0,
        stats: { total: 0, unread: 0, read: 0 },
      };
    }
  }

  /**
   * Mark notification as read
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID (optional, marks all if not provided)
   * @returns {Promise<Object>} Update result
   */
  async markAsRead(userId, notificationId = null) {
    try {
      const result = await Notification.markAsRead(userId, notificationId);

      // Emit update via socket
      if (notificationId && this.io && this.initialized) {
        this.io.to(`user-${userId}`).emit("notification-read", {
          notificationId,
          isRead: true,
        });
      } else if (this.io && this.initialized) {
        this.io.to(`user-${userId}`).emit("all-notifications-read");
      }

      return result;
    } catch (error) {
      logger.error("Mark as read error:", error);
      return { modifiedCount: 0 };
    }
  }

  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async markAllAsRead(userId) {
    return this.markAsRead(userId, null);
  }

  /**
   * Delete notification
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteNotification(userId, notificationId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        user: userId,
        deletedAt: null,
      });

      if (!notification) return false;

      await notification.softDelete();

      if (this.io && this.initialized) {
        this.io
          .to(`user-${userId}`)
          .emit("notification-deleted", { notificationId });
      }

      return true;
    } catch (error) {
      logger.error("Delete notification error:", error);
      return false;
    }
  }

  /**
   * Get notification statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Notification statistics
   */
  async getUserNotificationStats(userId) {
    try {
      const [total, unread, byType, byPriority, last7Days] = await Promise.all([
        Notification.countDocuments({ user: userId, deletedAt: null }),
        Notification.countDocuments({
          user: userId,
          isRead: false,
          deletedAt: null,
        }),
        Notification.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(userId),
              deletedAt: null,
            },
          },
          { $group: { _id: "$type", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Notification.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(userId),
              deletedAt: null,
            },
          },
          { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]),
        Notification.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(userId),
              createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
              deletedAt: null,
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      return {
        total,
        unread,
        read: total - unread,
        byType,
        byPriority,
        last7Days,
      };
    } catch (error) {
      logger.error("Get notification stats error:", error);
      return {
        total: 0,
        unread: 0,
        read: 0,
        byType: [],
        byPriority: [],
        last7Days: [],
      };
    }
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getServiceStats() {
    const uptime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      uptime: `${Math.floor(uptime / 1000)}s`,
      initialized: this.initialized,
      socketConnected: !!this.io,
      config: {
        batchSize: NOTIFICATION_CONFIG.batch.size,
        maxRetries: NOTIFICATION_CONFIG.retry.maxAttempts,
      },
    };
  }

  /**
   * Clean up old notifications (scheduled task)
   * @param {number} daysOld - Days to keep notifications
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldNotifications(daysOld = 90) {
    try {
      const result = await Notification.cleanupOldNotifications(daysOld);
      logger.info(
        `🧹 Cleaned up ${result.deletedCount} old notifications (${daysOld} days old)`,
      );
      return result;
    } catch (error) {
      logger.error("Cleanup old notifications error:", error);
      return { deletedCount: 0 };
    }
  }

  /**
   * Process scheduled notifications
   * @returns {Promise<number>} Number of processed notifications
   */
  async processScheduledNotifications() {
    try {
      const processed = await Notification.processScheduledNotifications();
      if (processed > 0) {
        logger.info(`⏰ Processed ${processed} scheduled notifications`);
      }
      return processed;
    } catch (error) {
      logger.error("Process scheduled notifications error:", error);
      return 0;
    }
  }

  /**
   * Expire old notifications
   * @returns {Promise<number>} Number of expired notifications
   */
  async expireNotifications() {
    try {
      const result = await Notification.expireNotifications();
      if (result.modifiedCount > 0) {
        logger.info(`⏰ Expired ${result.modifiedCount} notifications`);
      }
      return result.modifiedCount;
    } catch (error) {
      logger.error("Expire notifications error:", error);
      return 0;
    }
  }

  /**
   * Send bulk notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Results
   */
  async sendBulkNotification(userIds, notificationData) {
    const startTime = Date.now();

    try {
      const results = {
        total: userIds.length,
        successful: 0,
        failed: 0,
        notifications: [],
      };

      // Process in batches
      const batchSize = NOTIFICATION_CONFIG.batch.size;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (userId) => {
          try {
            const notification = await this.createNotification({
              user: userId,
              ...notificationData,
            });
            if (notification) {
              results.successful++;
              results.notifications.push(notification);
            } else {
              results.failed++;
            }
          } catch (error) {
            results.failed++;
          }
        });

        await Promise.all(batchPromises);

        if (i + batchSize < userIds.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, NOTIFICATION_CONFIG.batch.delay),
          );
        }
      }

      const duration = Date.now() - startTime;
      logger.info(
        `📨 Sent bulk notification to ${results.successful}/${results.total} users in ${duration}ms`,
      );

      return results;
    } catch (error) {
      logger.error("Bulk notification error:", error);
      return {
        success: false,
        total: userIds.length,
        successful: 0,
        failed: userIds.length,
        error: error.message,
      };
    }
  }
}

module.exports = NotificationService;
