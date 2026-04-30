// controllers/eventController.js
// FIXED: Now sends real-time Socket.io + email notifications when events are created/cancelled

const mongoose = require("mongoose");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const Notification = require("../models/Notification");
const User = require("../models/User");
const {
  HTTP_STATUS,
  MESSAGES,
  EVENT_STATUS,
  USER_ROLES,
  REGISTRATION_STATUS,
  NOTIFICATION_TYPES,
} = require("../config/constants");
const logger = require("../utils/logger");
const { sendEmail, sendBulkEmails } = require("../utils/emailService");

// ============================================================
// NOTIFICATION SERVICE — loaded lazily so server.js can set it
// ============================================================

let _notificationService = null;

/**
 * Called once from server.js after Socket.io is ready:
 *   const eventController = require('./controllers/eventController');
 *   eventController.setNotificationService(notificationServiceInstance);
 */
const setNotificationService = (service) => {
  _notificationService = service;
  logger.info("✅ NotificationService injected into eventController");
};

// ── Inline fallback (in-app only, no socket) ───────────────
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
    // Full delivery: Socket.io real-time + email + SMS
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
  // Fallback: in-app only
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

// ============================================================
// GET ALL EVENTS
// ============================================================
exports.getEvents = async (req, res, next) => {
  try {
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const skip = (page - 1) * limit;

    let query = {
      isPublished: true,
      deletedAt: null,
      status: { $in: [EVENT_STATUS.UPCOMING, EVENT_STATUS.ONGOING] },
    };

    if (req.query.status) query.status = req.query.status;
    if (req.query.eventType) query.eventType = req.query.eventType;
    if (req.query.participationMode)
      query.participationMode = req.query.participationMode;
    if (req.query.search) query.$text = { $search: req.query.search };

    let sort = { eventDate: 1 };
    if (req.query.sort === "latest") sort = { createdAt: -1 };
    if (req.query.sort === "popular") sort = { views: -1 };

    const events = await Event.find(query)
      .populate("organizer", "firstName lastName email avatar")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET MY EVENTS
// ============================================================
exports.getMyEvents = async (req, res, next) => {
  try {
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const skip = (page - 1) * limit;

    const query = { organizer: req.user.id, deletedAt: null };
    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET EVENT BY SLUG
// ============================================================
exports.getEventBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const event = await Event.findOne({ slug, deletedAt: null })
      .populate("organizer", "firstName lastName email avatar phone")
      .populate("coOrganizers", "name email role")
      .lean();

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    await Event.findByIdAndUpdate(event._id, { $inc: { views: 1 } });
    const stats = await EventRegistration.getEventStats(event._id);

    res.status(200).json({
      success: true,
      data: { ...event, registrationStats: stats },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET SINGLE EVENT (ID OR SLUG)
// ============================================================
exports.getEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    let event;

    if (mongoose.Types.ObjectId.isValid(id)) {
      event = await Event.findById(id)
        .populate("organizer", "firstName lastName email avatar phone")
        .populate("coOrganizers", "name email role")
        .lean();
    }

    if (!event) {
      event = await Event.findOne({ slug: id, deletedAt: null })
        .populate("organizer", "firstName lastName email avatar phone")
        .populate("coOrganizers", "name email role")
        .lean();
    }

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    await Event.findByIdAndUpdate(event._id, { $inc: { views: 1 } });
    const stats = await EventRegistration.getEventStats(event._id);

    res.status(200).json({
      success: true,
      data: { ...event, registrationStats: stats },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CREATE EVENT — FIXED: now notifies all registered users
// ============================================================
exports.createEvent = async (req, res, next) => {
  try {
    const slug = req.body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const event = await Event.create({
      ...req.body,
      slug,
      organizer: req.user.id,
      organizerName: `${req.user.firstName} ${req.user.lastName}`,
      organizerEmail: req.user.email,
      createdBy: req.user.id,
      isPublished: true,
      publishedAt: new Date(),
      status: EVENT_STATUS.UPCOMING,
    });

    logger.info(`✅ New event created: "${event.title}" by ${req.user.email}`);

    // ── Notify all active users about the new event ─────────
    setImmediate(async () => {
      try {
        // Build target user query
        const userQuery = {
          isActive: true,
          deletedAt: null,
          _id: { $ne: req.user.id }, // Don't notify the organizer
        };

        // Target specific departments if set
        if (
          event.targetDepartments &&
          event.targetDepartments.length > 0 &&
          !event.targetDepartments.includes("all")
        ) {
          userQuery.department = { $in: event.targetDepartments };
        }

        const targetUsers = await User.find(userQuery).select(
          "_id email firstName phone preferences",
        );

        if (targetUsers.length === 0) {
          logger.info(`No target users for event: ${event.title}`);
          return;
        }

        logger.info(
          `📅 Sending event notifications to ${targetUsers.length} users for: ${event.title}`,
        );

        // Use NotificationService if available (real-time Socket.io)
        if (_notificationService?.notifyNewEvent) {
          const userIds = targetUsers.map((u) => u._id);
          await _notificationService.notifyNewEvent(event, userIds);
          logger.info(
            `✅ Real-time event notifications sent to ${targetUsers.length} users`,
          );
        } else {
          // Fallback: create in-app notifications manually
          const eventDate = new Date(event.eventDate).toLocaleDateString(
            "en-GB",
            { weekday: "long", year: "numeric", month: "long", day: "numeric" },
          );

          const notifPromises = targetUsers.map((user) =>
            createFallbackNotification(
              user._id,
              NOTIFICATION_TYPES.NEW_NOTICE,
              `🎉 New Event: ${event.title}`,
              `Join us on ${eventDate} at ${event.venue || "TBD"}. ${event.description?.substring(0, 100) || ""}`,
              event._id,
              "Event",
              "normal",
              `${process.env.FRONTEND_URL}/events/${event._id}`,
            ),
          );
          await Promise.all(notifPromises);
          logger.info(
            `✅ In-app event notifications sent to ${targetUsers.length} users`,
          );
        }

        // Send email notifications to users with email enabled
        const emailUsers = targetUsers.filter(
          (u) => u.preferences?.notifications?.email !== false && u.email,
        );

        if (emailUsers.length > 0) {
          await sendBulkEmails(
            emailUsers.map((u) => ({ email: u.email, name: u.firstName })),
            {
              subject: `New Event: ${event.title}`,
              template: "newEvent",
              data: {
                title: event.title,
                eventDate: new Date(event.eventDate).toLocaleDateString(
                  "en-GB",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                ),
                startTime: event.startTime || "TBD",
                endTime: event.endTime || "",
                venue: event.venue || "TBD",
                description: event.description || event.summary || "",
                eventId: event._id,
                capacity: event.capacity || null,
              },
            },
          );
          logger.info(
            `📧 Email event notifications sent to ${emailUsers.length} users`,
          );
        }
      } catch (notifError) {
        logger.error(
          `⚠️ Event notification error (non-critical): ${notifError.message}`,
        );
      }
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE EVENT
// ============================================================
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (
      req.user.role !== USER_ROLES.ADMIN &&
      event.organizer.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    Object.assign(event, req.body);
    event.updatedBy = req.user.id;
    await event.save();

    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE EVENT
// ============================================================
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    await event.softDelete(req.user.id);
    res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CANCEL EVENT — FIXED: notifies all registered users
// ============================================================
exports.cancelEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (
      req.user.role !== USER_ROLES.ADMIN &&
      event.organizer.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    event.status = EVENT_STATUS.CANCELLED;
    event.cancelledAt = new Date();
    event.cancelledBy = req.user.id;
    await event.save();

    // Notify all registered users about cancellation
    const registrations = await EventRegistration.find({
      event: event._id,
      status: {
        $in: [REGISTRATION_STATUS.CONFIRMED, REGISTRATION_STATUS.REGISTERED],
      },
    }).populate("user", "_id email firstName");

    logger.info(
      `📢 Notifying ${registrations.length} users about event cancellation: ${event.title}`,
    );

    const notifPromises = registrations.map((reg) =>
      createNotification(
        reg.user._id,
        NOTIFICATION_TYPES.EVENT_CANCELLED || "event_cancelled",
        "❌ Event Cancelled",
        `The event "${event.title}" scheduled for ${new Date(event.eventDate).toLocaleDateString()} has been cancelled.`,
        event._id,
        "Event",
        "high",
        `${process.env.FRONTEND_URL}/events`,
      ),
    );

    await Promise.all(notifPromises);

    res.json({
      success: true,
      message: "Event cancelled successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PUBLISH EVENT
// ============================================================
exports.publishEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (
      req.user.role !== USER_ROLES.ADMIN &&
      event.organizer.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    event.isPublished = true;
    event.publishedAt = new Date();
    event.publishedBy = req.user.id;
    await event.save();

    res.json({
      success: true,
      message: "Event published successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// REGISTER FOR EVENT
// ============================================================
exports.registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const registration = await event.registerUser(req.user.id);

    // Confirm registration to the user
    await createNotification(
      req.user.id,
      NOTIFICATION_TYPES.REGISTRATION_CONFIRMATION,
      "✅ Registration Confirmed",
      `You have successfully registered for "${event.title}" on ${new Date(event.eventDate).toLocaleDateString()}.`,
      event._id,
      "Event",
      "normal",
      `${process.env.FRONTEND_URL}/events/${event._id}`,
    );

    res.json({ success: true, data: registration });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CANCEL REGISTRATION
// ============================================================
exports.cancelRegistration = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const registration = await EventRegistration.findOne({
      event: event._id,
      user: req.user.id,
      status: REGISTRATION_STATUS.CONFIRMED,
    });

    if (!registration) {
      return res
        .status(404)
        .json({ success: false, message: "Registration not found" });
    }

    registration.status = REGISTRATION_STATUS.CANCELLED;
    registration.cancelledAt = new Date();
    await registration.save();

    event.currentRegistrations = Math.max(0, event.currentRegistrations - 1);
    await event.save();

    await createNotification(
      req.user.id,
      NOTIFICATION_TYPES.REGISTRATION_CANCELLED || "registration_cancelled",
      "Registration Cancelled",
      `Your registration for "${event.title}" has been cancelled.`,
      event._id,
      "Event",
      "normal",
    );

    res.json({ success: true, message: "Registration cancelled successfully" });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CHECK IN
// ============================================================
exports.checkIn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, location } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const registration = await EventRegistration.findOne({
      event: id,
      user: userId,
      status: REGISTRATION_STATUS.CONFIRMED,
    });

    if (!registration) {
      return res
        .status(404)
        .json({ success: false, message: "Registration not found" });
    }

    if (registration.checkedIn) {
      return res
        .status(400)
        .json({ success: false, message: "User already checked in" });
    }

    registration.checkedIn = true;
    registration.checkedInAt = new Date();
    registration.checkInLocation = location;
    await registration.save();

    res.json({
      success: true,
      message: "Check-in successful",
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET REGISTRATIONS
// ============================================================
exports.getRegistrations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 20;
    const skip = (page - 1) * limit;

    const query = { event: id };
    if (req.query.status) query.status = req.query.status;
    if (req.query.checkedIn !== undefined)
      query.checkedIn = req.query.checkedIn === "true";

    const registrations = await EventRegistration.find(query)
      .populate("user", "firstName lastName email avatar department")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await EventRegistration.countDocuments(query);

    res.json({
      success: true,
      data: registrations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET REGISTRATION STATUS
// ============================================================
exports.getRegistrationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const registration = await EventRegistration.findOne({
      event: id,
      user: req.user.id,
    });

    res.json({
      success: true,
      data: {
        isRegistered: !!registration,
        registration: registration || null,
        status: registration?.status || null,
        checkedIn: registration?.checkedIn || false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// SUBMIT FEEDBACK
// ============================================================
exports.submitFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment, isAnonymous } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const registration = await EventRegistration.findOne({
      event: id,
      user: req.user.id,
      status: REGISTRATION_STATUS.CONFIRMED,
    });

    if (!registration) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You must be registered to submit feedback",
        });
    }

    if (registration.feedbackSubmitted) {
      return res
        .status(400)
        .json({ success: false, message: "Feedback already submitted" });
    }

    registration.feedback = {
      rating,
      comment,
      isAnonymous: isAnonymous || false,
      submittedAt: new Date(),
      submittedBy: isAnonymous ? null : req.user.id,
    };
    registration.feedbackSubmitted = true;
    await registration.save();

    res.json({ success: true, message: "Feedback submitted successfully" });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// EVENT STATS
// ============================================================
exports.getEventStats = async (req, res, next) => {
  try {
    const stats = await Event.getStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// EXPORT setNotificationService so server.js can wire it in
// ============================================================
exports.setNotificationService = setNotificationService;
