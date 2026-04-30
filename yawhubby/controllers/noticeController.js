// controllers/noticeController.js
// FIXED: Now sends real-time Socket.io + email + SMS notifications when notices are created/published

const Notice = require("../models/Notice");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");
const {
  HTTP_STATUS,
  MESSAGES,
  NOTICE_STATUS,
  USER_ROLES,
  NOTIFICATION_TYPES,
} = require("../config/constants");
const logger = require("../utils/logger");
const { sendEmail, sendBulkEmails } = require("../utils/emailService");
const { sendTemplatedSMS, sendBatchSMS } = require("../services/smsService");

// ============================================================
// NOTIFICATION SERVICE — injected from server.js
// ============================================================

let _notificationService = null;

const setNotificationService = (service) => {
  _notificationService = service;
  logger.info("✅ NotificationService injected into noticeController");
};

// ── Inline fallback (in-app only) ──────────────────────────
const createFallbackNotification = async (
  userId,
  type,
  title,
  message,
  referenceId = null,
  referenceModel = null,
  priority = "normal",
  actionUrl = null,
) => {
  try {
    await Notification.create({
      user: userId,
      type,
      title,
      message,
      referenceId,
      referenceModel,
      priority,
      actionUrl,
      deliveryChannels: { inApp: true, email: false },
    });
  } catch (error) {
    logger.error(`Fallback notification error: ${error.message}`);
  }
};

// ── Main notification helper ────────────────────────────────
const createNotification = async (
  userId,
  type,
  title,
  message,
  referenceId = null,
  referenceModel = null,
  priority = "normal",
  actionUrl = null,
) => {
  if (_notificationService) {
    return _notificationService.createNotification({
      user: userId,
      type,
      title,
      message,
      referenceId,
      referenceModel,
      priority,
      actionUrl,
      sendEmail: priority === "urgent" || priority === "high",
      sendPush: true,
    });
  }
  return createFallbackNotification(
    userId,
    type,
    title,
    message,
    referenceId,
    referenceModel,
    priority,
    actionUrl,
  );
};

// ── SMS helper ──────────────────────────────────────────────
const sendSMSNotifications = async (users, notice) => {
  if (!users || users.length === 0) return;

  const smsUsers = users.filter(
    (u) => u.preferences?.notifications?.sms === true && u.phone?.trim(),
  );

  if (smsUsers.length === 0) return;

  try {
    const recipients = smsUsers.map((u) => ({
      phoneNumber: u.phone,
      name: u.firstName,
      userId: u._id,
    }));

    const result = await sendBatchSMS(
      recipients,
      "newNotice",
      {
        title: notice.title,
        department: notice.targetDepartments?.join(", ") || "All Departments",
      },
      {
        priority: notice.priority === "urgent" ? "high" : "normal",
        category: "notice-broadcast",
        batchId: `notice_${notice._id}`,
        batchSize: 50,
        delayBetweenBatches: 2000,
      },
    );

    logger.info(
      `SMS sent: ${result.successful}/${result.total} for notice: ${notice.title}`,
    );
    return result;
  } catch (error) {
    logger.error(`SMS notification error: ${error.message}`);
  }
};

// ── Notify all target users (real-time + email + SMS) ───────
const notifyUsers = async (notice) => {
  try {
    const userQuery = {
      isActive: true,
      deletedAt: null,
      _id: { $ne: notice.createdBy }, // Don't notify the creator
    };

    if (!notice.targetDepartments?.includes("all")) {
      userQuery.department = { $in: notice.targetDepartments };
    }
    if (!notice.targetRoles?.includes("all")) {
      userQuery.role = { $in: notice.targetRoles };
    }

    const targetUsers = await User.find(userQuery).select(
      "_id email firstName phone preferences",
    );

    if (targetUsers.length === 0) {
      logger.info(`No target users for notice: ${notice.title}`);
      return;
    }

    logger.info(
      `📢 Sending notifications to ${targetUsers.length} users for notice: ${notice.title}`,
    );

    const priority =
      notice.priority === "urgent"
        ? "urgent"
        : notice.isImportant
          ? "high"
          : "normal";

    // 1️⃣ Real-time Socket.io + in-app notifications
    if (_notificationService?.notifyNewNotice) {
      const userIds = targetUsers.map((u) => u._id);
      await _notificationService.notifyNewNotice(notice, userIds);
      logger.info(
        `✅ Real-time notifications sent to ${targetUsers.length} users`,
      );
    } else {
      // Fallback: in-app only
      const notifPromises = targetUsers.map((user) =>
        createFallbackNotification(
          user._id,
          NOTIFICATION_TYPES.NEW_NOTICE,
          `📢 New Notice: ${notice.title}`,
          notice.summary || notice.content?.substring(0, 150) || "",
          notice._id,
          "Notice",
          priority,
          `${process.env.FRONTEND_URL}/notices/${notice._id}`,
        ),
      );
      await Promise.all(notifPromises);
      logger.info(
        `✅ In-app notifications sent to ${targetUsers.length} users`,
      );
    }

    // 2️⃣ Email notifications
    const emailUsers = targetUsers.filter(
      (u) => u.preferences?.notifications?.email !== false && u.email,
    );

    if (emailUsers.length > 0) {
      await sendBulkEmails(
        emailUsers.map((u) => ({ email: u.email, name: u.firstName })),
        {
          subject: `📢 New Notice: ${notice.title}`,
          template: "newNotice",
          data: {
            title: notice.title,
            category: notice.category,
            priority: notice.priority,
            summary: notice.summary || notice.content?.substring(0, 200),
            content: notice.content,
            noticeId: notice._id,
          },
        },
      );
      logger.info(`📧 Emails sent to ${emailUsers.length} users`);
    }

    // 3️⃣ SMS — only for urgent or important notices
    const shouldSendSMS =
      (notice.priority === "urgent" || notice.isImportant) &&
      process.env.SMS_ENABLED === "true";

    if (shouldSendSMS) {
      await sendSMSNotifications(targetUsers, notice);
    }
  } catch (error) {
    logger.error(`Notify users error: ${error.message}`);
  }
};

// ============================================================
// PUBLIC ROUTES
// ============================================================

exports.getNotices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {
      status: NOTICE_STATUS.PUBLISHED,
      isPublished: true,
      deletedAt: null,
    };

    if (req.query.category) query.category = req.query.category;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.important === "true") query.isImportant = true;
    if (req.query.search) query.$text = { $search: req.query.search };

    query.$and = [
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      },
    ];

    let sort = { isPinned: -1, createdAt: -1 };
    if (req.query.sort === "oldest") sort = { isPinned: -1, createdAt: 1 };
    else if (req.query.sort === "priority")
      sort = { priority: -1, createdAt: -1 };
    else if (req.query.sort === "views") sort = { views: -1, createdAt: -1 };

    const notices = await Notice.find(query)
      .populate("createdBy", "firstName lastName role avatar")
      .populate("relatedEvent", "title eventDate")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notice.countDocuments(query);

    logger.info(`Fetched ${notices.length} notices - IP: ${req.ip}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: notices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error(`Get notices error: ${error.message}`);
    next(error);
  }
};

exports.getNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate("createdBy", "firstName lastName role avatar")
      .populate("relatedEvent", "title eventDate venue status");

    if (!notice) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
      });
    }

    if (
      notice.isExpired ||
      (notice.expiresAt && notice.expiresAt < new Date())
    ) {
      return res.status(HTTP_STATUS.GONE).json({
        success: false,
        message: "This notice has expired",
      });
    }

    await notice.incrementViews(
      req.user?._id,
      req.ip,
      req.headers["user-agent"],
    );

    res.status(HTTP_STATUS.OK).json({ success: true, data: notice });
  } catch (error) {
    logger.error(`Get notice error: ${error.message}`);
    next(error);
  }
};

exports.getNoticeBySlug = async (req, res, next) => {
  try {
    const notice = await Notice.findOne({
      slug: req.params.slug,
      deletedAt: null,
    })
      .populate("createdBy", "firstName lastName role avatar")
      .populate("relatedEvent", "title eventDate venue status");

    if (!notice) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
      });
    }

    await notice.incrementViews(
      req.user?._id,
      req.ip,
      req.headers["user-agent"],
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data: notice });
  } catch (error) {
    next(error);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id).select("comments");
    if (!notice) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: MESSAGES.ERROR.NOT_FOUND });
    }
    res.status(HTTP_STATUS.OK).json({ success: true, data: notice.comments });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// AUTHENTICATED USER ROUTES
// ============================================================

exports.getMyNotices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      status: NOTICE_STATUS.PUBLISHED,
      isPublished: true,
      deletedAt: null,
      $and: [
        {
          $or: [
            { targetDepartments: "all" },
            { targetDepartments: req.user.department },
          ],
        },
        { $or: [{ targetRoles: "all" }, { targetRoles: req.user.role }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
      ],
    };

    const notices = await Notice.find(query)
      .populate("createdBy", "firstName lastName role avatar")
      .populate("relatedEvent", "title eventDate")
      .sort({ isPinned: -1, priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notice.countDocuments(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: notices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: MESSAGES.ERROR.NOT_FOUND });
    }

    const liked = await notice.toggleLike(req.user.id);

    if (liked && notice.createdBy.toString() !== req.user.id) {
      await createNotification(
        notice.createdBy,
        NOTIFICATION_TYPES.SYSTEM_ALERT,
        "Notice Liked",
        `${req.user.firstName} ${req.user.lastName} liked your notice "${notice.title}"`,
        notice._id,
        "Notice",
        "low",
        `${process.env.FRONTEND_URL}/notices/${notice._id}`,
      );
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { likes: notice.likes, liked },
      message: liked ? "Notice liked" : "Notice unliked",
    });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: MESSAGES.ERROR.NOT_FOUND });
    }
    if (!content?.trim()) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ success: false, message: "Comment content is required" });
    }

    const comment = await notice.addComment(req.user.id, content);

    if (notice.createdBy.toString() !== req.user.id) {
      await createNotification(
        notice.createdBy,
        NOTIFICATION_TYPES.COMMENT_REPLY,
        "New Comment on Your Notice",
        `${req.user.firstName} ${req.user.lastName} commented on "${notice.title}"`,
        notice._id,
        "Notice",
        "normal",
        `${process.env.FRONTEND_URL}/notices/${notice._id}`,
      );
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: comment,
      message: "Comment added successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ADMIN ROUTES
// ============================================================

exports.getAdminNotices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const {
      status,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = { deletedAt: null };
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "title",
      "views",
      "status",
      "priority",
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const [notices, total] = await Promise.all([
      Notice.find(query)
        .populate("createdBy", "firstName lastName email role")
        .populate("updatedBy", "firstName lastName")
        .sort({ [validSortBy]: sortOrder === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notice.countDocuments(query),
    ]);

    const stats = {
      total: await Notice.countDocuments({ deletedAt: null }),
      published: await Notice.countDocuments({
        status: "published",
        deletedAt: null,
      }),
      pending: await Notice.countDocuments({
        status: "pending",
        deletedAt: null,
      }),
      draft: await Notice.countDocuments({ status: "draft", deletedAt: null }),
      archived: await Notice.countDocuments({
        status: "archived",
        deletedAt: null,
      }),
    };

    res.json({
      success: true,
      data: notices,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CREATE NOTICE — FIXED: real-time Socket.io notifications
// ============================================================
exports.createNotice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const {
      title,
      content,
      summary,
      category,
      priority,
      tags,
      targetDepartments,
      targetRoles,
      targetYears,
      isImportant,
      isPinned,
      pinnedUntil,
      expiresAt,
      attachments,
      featuredImage,
      notifyTargets,
      metaDescription,
      metaKeywords,
      relatedEvent,
    } = req.body;

    const notice = await Notice.create({
      title,
      content,
      summary,
      category,
      priority: priority || "medium",
      tags: tags || [],
      targetDepartments: targetDepartments || ["all"],
      targetRoles: targetRoles || ["all"],
      targetYears: targetYears || [],
      createdBy: req.user.id,
      createdByRole: req.user.role,
      isImportant: isImportant || false,
      isPinned: isPinned || false,
      pinnedUntil: pinnedUntil || null,
      expiresAt: expiresAt || null,
      attachments: attachments || [],
      featuredImage: featuredImage || null,
      notifyTargets: notifyTargets !== false,
      metaDescription,
      metaKeywords,
      relatedEvent,
    });

    await notice.populate("createdBy", "firstName lastName role avatar");
    await notice.populate("relatedEvent", "title eventDate");

    logger.info(
      `✅ New notice created: "${notice.title}" by ${req.user.email}`,
    );

    // ── Send notifications in background so response is instant ──
    if (notice.isPublished && notice.notifyTargets) {
      setImmediate(() => notifyUsers(notice));
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: notice,
      message: MESSAGES.SUCCESS.CREATED,
    });
  } catch (error) {
    logger.error(`Create notice error: ${error.message}`);
    next(error);
  }
};

exports.updateNotice = async (req, res, next) => {
  try {
    let notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: MESSAGES.ERROR.NOT_FOUND });
    }

    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    const isCreator = notice.createdBy.toString() === req.user.id;

    if (!isAdmin && !isCreator) {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ success: false, message: MESSAGES.ERROR.FORBIDDEN });
    }

    await notice.createVersion(req.user.id);

    const allowedFields = [
      "title",
      "content",
      "summary",
      "category",
      "priority",
      "tags",
      "targetDepartments",
      "targetRoles",
      "targetYears",
      "isImportant",
      "isPinned",
      "pinnedUntil",
      "expiresAt",
      "attachments",
      "featuredImage",
      "isPublished",
      "metaDescription",
      "metaKeywords",
      "relatedEvent",
    ];

    let hasChanges = false;
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (JSON.stringify(notice[field]) !== JSON.stringify(req.body[field])) {
          notice[field] = req.body[field];
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      notice.updatedBy = req.user.id;
      await notice.save();
      await notice.populate("createdBy", "firstName lastName role avatar");
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: notice,
      message: hasChanges ? MESSAGES.SUCCESS.UPDATED : "No changes made",
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: MESSAGES.ERROR.NOT_FOUND });
    }

    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    const isCreator = notice.createdBy.toString() === req.user.id;

    if (!isAdmin && !isCreator) {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ success: false, message: MESSAGES.ERROR.FORBIDDEN });
    }

    await notice.softDelete(req.user.id);
    res
      .status(HTTP_STATUS.OK)
      .json({ success: true, message: MESSAGES.SUCCESS.DELETED });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PUBLISH NOTICE — FIXED: triggers notifications on publish
// ============================================================
exports.publishNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: MESSAGES.ERROR.NOT_FOUND });
    }

    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    const isCreator = notice.createdBy.toString() === req.user.id;

    if (!isAdmin && !isCreator) {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ success: false, message: MESSAGES.ERROR.FORBIDDEN });
    }

    if (notice.isPublished) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ success: false, message: "Notice is already published" });
    }

    notice.isPublished = true;
    notice.status = NOTICE_STATUS.PUBLISHED;
    notice.publishedAt = new Date();
    await notice.save();

    logger.info(`📢 Notice published: "${notice.title}" by ${req.user.email}`);

    // ── Notify users when a draft is published ──────────────
    if (notice.notifyTargets !== false) {
      setImmediate(() => notifyUsers(notice));
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: notice,
      message: "Notice published successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.archiveNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: MESSAGES.ERROR.NOT_FOUND });
    }

    const isAdmin = req.user.role === USER_ROLES.ADMIN;
    const isCreator = notice.createdBy.toString() === req.user.id;

    if (!isAdmin && !isCreator) {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ success: false, message: MESSAGES.ERROR.FORBIDDEN });
    }

    notice.isPublished = false;
    notice.status = NOTICE_STATUS.ARCHIVED;
    await notice.save();

    res
      .status(HTTP_STATUS.OK)
      .json({
        success: true,
        data: notice,
        message: "Notice archived successfully",
      });
  } catch (error) {
    next(error);
  }
};

exports.togglePin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: MESSAGES.ERROR.NOT_FOUND });
    }

    if (req.user.role === USER_ROLES.STUDENT) {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ success: false, message: MESSAGES.ERROR.FORBIDDEN });
    }

    notice.isPinned = pin !== undefined ? pin : !notice.isPinned;
    if (notice.isPinned && !notice.pinnedUntil) {
      notice.pinnedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    await notice.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: notice,
      message: notice.isPinned
        ? "Notice pinned successfully"
        : "Notice unpinned successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getNoticeStats = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.ADMIN) {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ success: false, message: MESSAGES.ERROR.FORBIDDEN });
    }
    const stats = await Notice.getStatistics();
    res.status(HTTP_STATUS.OK).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

exports.resendSMSNotifications = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.ADMIN) {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ success: false, message: MESSAGES.ERROR.FORBIDDEN });
    }

    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: "Notice not found" });
    }
    if (!notice.isPublished) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({
          success: false,
          message: "Cannot send SMS for unpublished notice",
        });
    }

    const userQuery = {
      isActive: true,
      "preferences.notifications.sms": true,
      phone: { $exists: true, $ne: "" },
      deletedAt: null,
    };
    if (!notice.targetDepartments.includes("all")) {
      userQuery.department = { $in: notice.targetDepartments };
    }

    const targetUsers = await User.find(userQuery).select(
      "phone firstName preferences",
    );
    if (targetUsers.length === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: "No users with SMS enabled found" });
    }

    const result = await sendSMSNotifications(targetUsers, notice);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: `SMS resent to ${result?.successful || 0} users`,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// EXPORT setNotificationService so server.js can wire it in
// ============================================================
exports.setNotificationService = setNotificationService;
