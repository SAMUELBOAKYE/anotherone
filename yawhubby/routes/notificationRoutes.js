// backend/routes/notificationRoutes.js
// Enterprise-Grade Notification Routes for KAAF Noticeboard System
// Handles all notification-related endpoints with proper validation and authorization
// @version 2.1.0
// @author Boakye Samuel Yiadom

const express = require("express");
const router = express.Router();
const { param, query, body } = require("express-validator");
const { protect, authorize } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");
const User = require("../models/User");

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Format validation errors
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  };
};

const { validationResult } = require("express-validator");

// ============================================================
// VALIDATION RULES
// ============================================================

const notificationIdValidation = [
  param("id").isMongoId().withMessage("Invalid notification ID format"),
];

const preferencesValidation = [
  body("email").optional().isBoolean().withMessage("Email must be a boolean"),
  body("push").optional().isBoolean().withMessage("Push must be a boolean"),
  body("inApp").optional().isBoolean().withMessage("InApp must be a boolean"),
  body("sms").optional().isBoolean().withMessage("SMS must be a boolean"),
  body("types").optional().isObject().withMessage("Types must be an object"),
];

const testNotificationValidation = [
  body("message").optional().isString().trim().isLength({ max: 500 }),
  body("priority")
    .optional()
    .isIn(["low", "normal", "high", "urgent"])
    .withMessage("Invalid priority"),
];

// ============================================================
// NOTIFICATION ROUTES
// ============================================================

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for current user
 * @access  Private
 */
router.get("/unread-count", protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false,
      deletedAt: null,
    });

    res.json({
      success: true,
      data: { unreadCount: count },
      count: count,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching unread count",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get("/preferences", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("preferences");

    const defaultPreferences = {
      email: true,
      push: true,
      inApp: true,
      sms: false,
      digestFrequency: "daily",
      types: {
        notice: true,
        announcement: true,
        event: true,
        system: true,
      },
    };

    res.json({
      success: true,
      preferences: user?.preferences?.notifications || defaultPreferences,
    });
  } catch (error) {
    console.error("Error getting preferences:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notification preferences",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put(
  "/preferences",
  protect,
  validate(preferencesValidation),
  async (req, res) => {
    try {
      const { email, push, inApp, sms, digestFrequency, types } = req.body;

      const updateData = {};
      if (email !== undefined)
        updateData["preferences.notifications.email"] = email;
      if (push !== undefined)
        updateData["preferences.notifications.push"] = push;
      if (inApp !== undefined)
        updateData["preferences.notifications.inApp"] = inApp;
      if (sms !== undefined) updateData["preferences.notifications.sms"] = sms;
      if (digestFrequency !== undefined)
        updateData["preferences.notifications.digestFrequency"] =
          digestFrequency;
      if (types !== undefined)
        updateData["preferences.notifications.types"] = types;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true, runValidators: true },
      ).select("preferences");

      res.json({
        success: true,
        message: "Notification preferences updated successfully",
        preferences: user.preferences.notifications,
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({
        success: false,
        message: "Error updating notification preferences",
        error: error.message,
      });
    }
  },
);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with pagination and filtering
 * @access  Private
 */
router.get("/", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const {
      unreadOnly,
      type,
      priority,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = { user: req.user.id, deletedAt: null };

    // Filter by read status
    if (unreadOnly === "true") {
      query.isRead = false;
    } else if (unreadOnly === "false") {
      query.isRead = true;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Date range filters
    if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    }

    // Filter out expired notifications
    query.$or = [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: { $exists: false } },
    ];

    // Validate sort field
    const allowedSortFields = ["createdAt", "updatedAt", "priority", "isRead"];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // Execute queries in parallel
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({
          [validSortBy]: sortOrder === "desc" ? -1 : 1,
          priority: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({
        user: req.user.id,
        isRead: false,
        deletedAt: null,
      }),
    ]);

    res.json({
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
    console.error("Error getting notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
router.put(
  "/:id/read",
  protect,
  validate(notificationIdValidation),
  async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.id,
          deletedAt: null,
        },
        { isRead: true, readAt: new Date() },
        { new: true },
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        message: "Notification marked as read",
        data: notification,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        message: "Error updating notification",
        error: error.message,
      });
    }
  },
);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for current user
 * @access  Private
 */
router.put("/read-all", protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        user: req.user.id,
        isRead: false,
        deletedAt: null,
      },
      { isRead: true, readAt: new Date() },
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notifications",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Soft delete a notification
 * @access  Private
 */
router.delete(
  "/:id",
  protect,
  validate(notificationIdValidation),
  async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.id,
          deletedAt: null,
        },
        { deletedAt: new Date() },
        { new: true },
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting notification",
        error: error.message,
      });
    }
  },
);

/**
 * @route   DELETE /api/notifications/delete-read
 * @desc    Delete all read notifications for current user
 * @access  Private
 */
router.delete("/delete-read", protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        user: req.user.id,
        isRead: true,
        deletedAt: null,
      },
      { deletedAt: new Date() },
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} read notifications deleted successfully`,
      deletedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error deleting read notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting read notifications",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/notifications/delete-all
 * @desc    Delete all notifications for current user (soft delete)
 * @access  Private
 */
router.delete("/delete-all", protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        user: req.user.id,
        deletedAt: null,
      },
      { deletedAt: new Date() },
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications deleted successfully`,
      deletedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notifications",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics for current user
 * @access  Private
 */
router.get("/stats", protect, async (req, res) => {
  try {
    const [total, unread, byType, byPriority, last7Days] = await Promise.all([
      Notification.countDocuments({ user: req.user.id, deletedAt: null }),
      Notification.countDocuments({
        user: req.user.id,
        isRead: false,
        deletedAt: null,
      }),
      Notification.aggregate([
        { $match: { user: req.user._id, deletedAt: null } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Notification.aggregate([
        { $match: { user: req.user._id, deletedAt: null } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Notification.aggregate([
        {
          $match: {
            user: req.user._id,
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

    res.json({
      success: true,
      data: {
        total,
        unread,
        read: total - unread,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        last7Days,
      },
    });
  } catch (error) {
    console.error("Error getting notification stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notification statistics",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/notifications/test
 * @desc    Send a test notification (admin only)
 * @access  Private (Admin)
 */
router.post(
  "/test",
  protect,
  authorize("admin", "super_admin"),
  validate(testNotificationValidation),
  async (req, res) => {
    try {
      const { message, priority = "normal" } = req.body;

      const testNotification = await Notification.create({
        user: req.user.id,
        title: "Test Notification",
        message: message || "This is a test notification from the admin panel.",
        type: "system",
        priority: priority,
        deliveryChannels: {
          inApp: true,
          email: false,
          push: false,
          sms: false,
        },
        action: { type: "none" },
        createdBy: req.user.id,
      });

      res.json({
        success: true,
        message: "Test notification sent successfully",
        data: testNotification,
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({
        success: false,
        message: "Error sending test notification",
        error: error.message,
      });
    }
  },
);

/**
 * @route   POST /api/notifications/bulk
 * @desc    Send bulk notification to multiple users (admin only)
 * @access  Private (Admin)
 */
router.post("/bulk", protect, authorize("admin", "super_admin"), async (req, res) => {
  try {
    const {
      userIds,
      title,
      message,
      type = "system",
      priority = "normal",
      actionUrl = null,
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User IDs array is required",
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    const notifications = [];
    for (const userId of userIds) {
      const notification = await Notification.create({
        user: userId,
        title,
        message,
        type,
        priority,
        actionUrl,
        deliveryChannels: {
          inApp: true,
          email: false,
          push: false,
          sms: false,
        },
        createdBy: req.user.id,
      });
      notifications.push(notification);
    }

    res.json({
      success: true,
      message: `Bulk notification sent to ${notifications.length} users`,
      data: notifications,
    });
  } catch (error) {
    console.error("Error sending bulk notification:", error);
    res.status(500).json({
      success: false,
      message: "Error sending bulk notification",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/:id
 * @desc    Get a single notification by ID
 * @access  Private
 */
router.get(
  "/:id",
  protect,
  validate(notificationIdValidation),
  async (req, res) => {
    try {
      const notification = await Notification.findOne({
        _id: req.params.id,
        user: req.user.id,
        deletedAt: null,
      }).lean();

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error("Error getting notification:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching notification",
        error: error.message,
      });
    }
  },
);

/**
 * @route   POST /api/notifications/:id/archive
 * @desc    Archive a notification
 * @access  Private
 */
router.post(
  "/:id/archive",
  protect,
  validate(notificationIdValidation),
  async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.id,
          deletedAt: null,
        },
        { isArchived: true, archivedAt: new Date() },
        { new: true },
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        message: "Notification archived successfully",
        data: notification,
      });
    } catch (error) {
      console.error("Error archiving notification:", error);
      res.status(500).json({
        success: false,
        message: "Error archiving notification",
        error: error.message,
      });
    }
  },
);

/**
 * @route   POST /api/notifications/:id/restore
 * @desc    Restore an archived notification
 * @access  Private
 */
router.post(
  "/:id/restore",
  protect,
  validate(notificationIdValidation),
  async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.id,
          isArchived: true,
          deletedAt: null,
        },
        { isArchived: false, archivedAt: null },
        { new: true },
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found or not archived",
        });
      }

      res.json({
        success: true,
        message: "Notification restored successfully",
        data: notification,
      });
    } catch (error) {
      console.error("Error restoring notification:", error);
      res.status(500).json({
        success: false,
        message: "Error restoring notification",
        error: error.message,
      });
    }
  },
);

module.exports = router;

