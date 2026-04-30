// controllers/notificationController.js
// Professional Notification Controller with SMS, Email, and Push Support

const Notification = require("../models/Notification");
const User = require("../models/User");
const SMSLog = require("../models/SMSLog");
const {
  HTTP_STATUS,
  MESSAGES,
  NOTIFICATION_TYPES,
  USER_ROLES,
} = require("../config/constants");
const logger = require("../utils/logger");
const { sendTemplatedSMS, sendBatchSMS } = require("../services/smsService");

// Get notification service instance (will be set from server.js)
let notificationService = null;
let io = null;

/**
 * Set notification service instance
 * @param {Object} service - NotificationService instance
 */
const setNotificationService = (service) => {
  notificationService = service;
  logger.info("Notification service set in controller");
};

/**
 * Set Socket.IO instance
 * @param {Object} socketIO - Socket.IO instance
 */
const setSocketIO = (socketIO) => {
  io = socketIO;
  logger.info("Socket.IO set in notification controller");
};

/**
 * Send real-time notification via Socket.IO
 * @param {string} userId - User ID to notify
 * @param {Object} notification - Notification object
 */
const sendRealtimeNotification = (userId, notification) => {
  if (io) {
    io.to(`user-${userId}`).emit("new_notification", {
      notification,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`Real-time notification sent to user ${userId}`);
  }
};

/**
 * Send SMS notification to user
 * @param {Object} user - User object
 * @param {Object} notification - Notification object
 * @returns {Promise<boolean>} - Success status
 */
const sendSMSNotification = async (user, notification) => {
  if (!user.phone || !user.preferences?.notifications?.sms) {
    return false;
  }

  try {
    // Determine SMS template based on notification type
    let templateName = "announcement";
    let variables = {
      title: notification.title,
      summary: notification.message.substring(0, 100),
    };

    switch (notification.type) {
      case NOTIFICATION_TYPES.NEW_NOTICE:
        templateName = "newNotice";
        variables = {
          title: notification.title,
          department: notification.metadata?.department || "All Departments",
        };
        break;
      case NOTIFICATION_TYPES.EVENT_REMINDER:
        templateName = "eventReminder";
        variables = {
          eventName: notification.title,
          date: notification.metadata?.eventDate || "Soon",
          time: notification.metadata?.eventTime || "TBD",
        };
        break;
      case NOTIFICATION_TYPES.PAYMENT_CONFIRMATION:
        templateName = "eventRegistration";
        variables = {
          eventName: notification.title,
          registrationId: notification.metadata?.registrationId || "N/A",
        };
        break;
      case NOTIFICATION_TYPES.SYSTEM_ALERT:
        templateName = "systemMaintenance";
        variables = {
          startTime: notification.metadata?.startTime || "Immediately",
          duration: notification.metadata?.duration || "Unknown",
        };
        break;
    }

    const result = await sendTemplatedSMS(user.phone, templateName, variables, {
      priority: notification.priority === "high" ? "high" : "normal",
      category: "notification",
      userId: user._id,
      notificationId: notification._id,
    });

    logger.info(
      `SMS sent to ${user.phone} for notification ${notification._id}`,
    );
    return true;
  } catch (error) {
    logger.error(`Failed to send SMS to ${user.phone}: ${error.message}`);
    return false;
  }
};

/**
 * Create and send notification through all channels
 * @param {Object} options - Notification options
 * @returns {Promise<Object>} - Created notification
 */
const createAndSendNotification = async (options) => {
  const {
    userId,
    type,
    title,
    message,
    referenceId = null,
    referenceModel = null,
    priority = "normal",
    actionUrl = null,
    metadata = {},
    sendEmail = true,
    sendSMS = false,
    sendPush = true,
    emailTemplate = null,
  } = options;

  try {
    // Create notification in database
    const notification = await Notification.createNotification({
      user: userId,
      type,
      title,
      message,
      referenceId,
      referenceModel,
      priority,
      actionUrl,
      metadata,
      deliveryChannels: {
        inApp: true,
        email: sendEmail,
        sms: sendSMS,
        push: sendPush,
      },
    });

    // Get user details
    const user = await User.findById(userId).select(
      "email phone firstName lastName preferences",
    );

    if (!user) {
      logger.error(`User ${userId} not found for notification`);
      return notification;
    }

    // Send real-time via Socket.IO
    sendRealtimeNotification(userId, notification);

    // Send email if enabled and user has email notifications enabled
    if (sendEmail && user.preferences?.notifications?.email !== false) {
      try {
        const {
          sendEmail: sendEmailService,
        } = require("../utils/emailService");
        await sendEmailService({
          to: user.email,
          subject: title,
          template: emailTemplate || "notification",
          data: {
            name: user.firstName,
            title,
            message,
            actionUrl,
            ...metadata,
          },
        });
        logger.info(
          `Email sent to ${user.email} for notification ${notification._id}`,
        );
      } catch (emailError) {
        logger.error(`Failed to send email: ${emailError.message}`);
      }
    }

    // Send SMS if enabled and user has SMS notifications enabled
    if (
      sendSMS &&
      user.preferences?.notifications?.sms === true &&
      user.phone
    ) {
      await sendSMSNotification(user, notification);
    }

    // Send push notification if enabled
    if (sendPush && user.pushSubscription) {
      try {
        const webPush = require("web-push");
        const payload = JSON.stringify({
          title,
          body: message,
          icon: "/icon.png",
          badge: "/badge.png",
          data: { url: actionUrl, notificationId: notification._id },
        });

        await webPush.sendNotification(user.pushSubscription, payload);
        logger.info(`Push notification sent to user ${userId}`);
      } catch (pushError) {
        // If subscription is invalid, remove it
        if (pushError.statusCode === 410) {
          await User.findByIdAndUpdate(userId, { pushSubscription: null });
          logger.warn(`Removed invalid push subscription for user ${userId}`);
        }
        logger.error(`Failed to send push notification: ${pushError.message}`);
      }
    }

    return notification;
  } catch (error) {
    logger.error(`Failed to create notification: ${error.message}`);
    throw error;
  }
};

/**
 * Send bulk notifications to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} - Results summary
 */
const sendBulkNotifications = async (userIds, notificationData) => {
  const results = {
    total: userIds.length,
    successful: 0,
    failed: 0,
    smsSent: 0,
    emailSent: 0,
    errors: [],
  };

  // Process in batches to avoid overwhelming the system
  const batchSize = 50;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const promises = batch.map(async (userId) => {
      try {
        await createAndSendNotification({
          userId,
          ...notificationData,
        });
        results.successful++;

        if (notificationData.sendSMS) results.smsSent++;
        if (notificationData.sendEmail) results.emailSent++;
      } catch (error) {
        results.failed++;
        results.errors.push({ userId, error: error.message });
      }
    });

    await Promise.all(promises);

    // Delay between batches
    if (i + batchSize < userIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  logger.info(
    `Bulk notifications sent: ${results.successful}/${results.total} successful`,
  );
  return results;
};

/**
 * @desc    Get user notifications with pagination and filtering
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === "true";
    const type = req.query.type || null;
    const priority = req.query.priority || null;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    if (notificationService) {
      const result = await notificationService.getUserNotifications(
        req.user.id,
        {
          page,
          limit,
          unreadOnly,
          type,
          priority,
          startDate,
          endDate,
        },
      );

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount,
        stats: {
          total: result.pagination.total,
          unread: result.unreadCount,
          read: result.pagination.total - result.unreadCount,
        },
      });
    }

    // Fallback to direct model query if service not available
    const query = { user: req.user.id, deletedAt: null };
    if (unreadOnly) query.isRead = false;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (startDate) query.createdAt = { $gte: startDate };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: endDate };

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.getUnreadCount(req.user.id),
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: notifications,
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
    });
  } catch (error) {
    logger.error(`Get notifications error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    logger.error(`Get unread count error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id,
      deletedAt: null,
    });

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
      });
    }

    if (notification.isRead) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Notification is already read",
      });
    }

    await notification.markAsRead();

    logger.info(
      `Notification marked as read: ${notification._id} for user ${req.user.email}`,
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Notification marked as read",
      data: {
        id: notification._id,
        isRead: true,
        readAt: notification.readAt,
      },
    });
  } catch (error) {
    logger.error(`Mark as read error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);

    logger.info(`All notifications marked as read for user ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    logger.error(`Mark all as read error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete notification (soft delete)
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id,
      deletedAt: null,
    });

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
      });
    }

    await notification.softDelete();

    logger.info(
      `Notification deleted: ${notification._id} for user ${req.user.email}`,
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    logger.error(`Delete notification error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete all read notifications
 * @route   DELETE /api/notifications/delete-read
 * @access  Private
 */
const deleteReadNotifications = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      {
        user: req.user.id,
        isRead: true,
        deletedAt: null,
      },
      {
        deletedAt: new Date(),
      },
    );

    logger.info(
      `Deleted ${result.modifiedCount} read notifications for user ${req.user.email}`,
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `${result.modifiedCount} read notifications deleted successfully`,
      data: {
        deletedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    logger.error(`Delete read notifications error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Save push subscription for Web Push notifications
 * @route   POST /api/notifications/subscribe
 * @access  Private
 */
const saveSubscription = async (req, res, next) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ERROR.VALIDATION,
        error: "Invalid subscription data",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { pushSubscription: subscription },
      { new: true },
    );

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
      });
    }

    logger.info(`Push subscription saved for user ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Push subscription saved successfully",
    });
  } catch (error) {
    logger.error(`Save subscription error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Remove push subscription
 * @route   DELETE /api/notifications/subscribe
 * @access  Private
 */
const removeSubscription = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { pushSubscription: null },
      { new: true },
    );

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
      });
    }

    logger.info(`Push subscription removed for user ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Push subscription removed successfully",
    });
  } catch (error) {
    logger.error(`Remove subscription error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update notification preferences
 * @route   PUT /api/notifications/preferences
 * @access  Private
 */
const updatePreferences = async (req, res, next) => {
  try {
    const { email, sms, push, digestFrequency } = req.body;

    const updateData = {};
    if (typeof email === "boolean")
      updateData["preferences.notifications.email"] = email;
    if (typeof sms === "boolean")
      updateData["preferences.notifications.sms"] = sms;
    if (typeof push === "boolean")
      updateData["preferences.notifications.push"] = push;
    if (digestFrequency)
      updateData["preferences.notifications.digestFrequency"] = digestFrequency;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true },
    ).select("preferences");

    logger.info(`Notification preferences updated for user ${req.user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Notification preferences updated successfully",
      data: user.preferences,
    });
  } catch (error) {
    logger.error(`Update preferences error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get notification statistics for user
 * @route   GET /api/notifications/stats
 * @access  Private
 */
const getNotificationStats = async (req, res, next) => {
  try {
    const [total, unread, byType, byPriority, last7Days] = await Promise.all([
      Notification.countDocuments({ user: req.user.id, deletedAt: null }),
      Notification.countDocuments({
        user: req.user.id,
        isRead: false,
        deletedAt: null,
      }),
      Notification.aggregate([
        { $match: { user: req.user.id, deletedAt: null } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Notification.aggregate([
        { $match: { user: req.user.id, deletedAt: null } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Notification.aggregate([
        {
          $match: {
            user: req.user.id,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            deletedAt: null,
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Get SMS statistics for this user
    const smsStats = await SMSLog.aggregate([
      {
        $match: {
          userId: req.user.id,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: null,
          totalSent: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        total,
        unread,
        read: total - unread,
        byType,
        byPriority,
        last7Days,
        sms: smsStats[0] || { totalSent: 0, delivered: 0, failed: 0 },
      },
    });
  } catch (error) {
    logger.error(`Get notification stats error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Test notification (admin only)
 * @route   POST /api/notifications/test
 * @access  Private (Admin)
 */
const testNotification = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.ERROR.FORBIDDEN,
      });
    }

    const { message, priority, sendSMS = false, sendEmail = true } = req.body;

    const notification = await createAndSendNotification({
      userId: req.user.id,
      type: NOTIFICATION_TYPES.SYSTEM_ALERT,
      title: "Test Notification",
      message: message || "This is a test notification from the system.",
      priority: priority || "normal",
      actionUrl: "/dashboard",
      metadata: { test: true, timestamp: new Date().toISOString() },
      sendEmail,
      sendSMS,
      sendPush: true,
      emailTemplate: "testNotification",
    });

    logger.info(`Test notification sent to admin ${req.user.email}`);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: notification,
      message: "Test notification sent successfully",
    });
  } catch (error) {
    logger.error(`Test notification error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Send bulk notification to all users (admin only)
 * @route   POST /api/notifications/bulk
 * @access  Private (Admin)
 */
const sendBulkNotification = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.ERROR.FORBIDDEN,
      });
    }

    const {
      title,
      message,
      type = NOTIFICATION_TYPES.SYSTEM_ALERT,
      priority = "normal",
      targetRoles = null,
      targetDepartments = null,
      sendEmail = true,
      sendSMS = false,
      actionUrl = null,
    } = req.body;

    // Build user query
    const userQuery = { isActive: true, deletedAt: null };
    if (targetRoles && targetRoles.length > 0) {
      userQuery.role = { $in: targetRoles };
    }
    if (targetDepartments && targetDepartments.length > 0) {
      userQuery.department = { $in: targetDepartments };
    }

    const users = await User.find(userQuery).select("_id");
    const userIds = users.map((u) => u._id);

    if (userIds.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "No users found matching the criteria",
      });
    }

    const results = await sendBulkNotifications(userIds, {
      type,
      title,
      message,
      priority,
      actionUrl,
      sendEmail,
      sendSMS,
      sendPush: true,
      metadata: {
        bulk: true,
        sentBy: req.user.id,
        sentByEmail: req.user.email,
        targetRoles,
        targetDepartments,
      },
    });

    logger.info(
      `Bulk notification sent by ${req.user.email} to ${results.successful} users`,
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Bulk notification sent to ${results.successful} users`,
      data: results,
    });
  } catch (error) {
    logger.error(`Send bulk notification error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get notification digest (summary of recent notifications)
 * @route   GET /api/notifications/digest
 * @access  Private
 */
const getNotificationDigest = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const digest = await Notification.aggregate([
      {
        $match: {
          user: req.user.id,
          createdAt: { $gte: startDate },
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: {
            type: "$type",
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          count: { $sum: 1 },
          notifications: { $push: "$$ROOT" },
        },
      },
      {
        $group: {
          _id: "$_id.type",
          dailyBreakdown: {
            $push: {
              date: "$_id.day",
              count: "$count",
              notifications: { $slice: ["$notifications", 5] },
            },
          },
          totalCount: { $sum: "$count" },
        },
      },
      { $sort: { totalCount: -1 } },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        period: `${days} days`,
        startDate,
        summary: digest,
        totalNotifications: digest.reduce((sum, d) => sum + d.totalCount, 0),
      },
    });
  } catch (error) {
    logger.error(`Get notification digest error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  setNotificationService,
  setSocketIO,
  createAndSendNotification,
  sendBulkNotifications,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  saveSubscription,
  removeSubscription,
  updatePreferences,
  getNotificationStats,
  getNotificationDigest,
  testNotification,
  sendBulkNotification,
};
