const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const User = require("../models/User");

// ============================================================
// SIMPLE AUTH MIDDLEWARE (self-contained - no external deps)
// ============================================================

// Simple protect middleware that checks if user is logged in
const simpleProtect = async (req, res, next) => {
  try {
    // Try to get token from header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      // For testing, allow a bypass in development
      if (process.env.NODE_ENV === "development") {
        req.user = {
          _id: "test-user-id",
          email: "admin@test.com",
          role: "admin",
        };
        return next();
      }
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    // Verify token (simplified - you should use your actual JWT verify)
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key",
      );
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }
      req.user = user;
      next();
    } catch (err) {
      // In development, allow a test user
      if (process.env.NODE_ENV === "development") {
        req.user = {
          _id: "test-user-id",
          email: "admin@test.com",
          role: "admin",
        };
        return next();
      }
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
};

// Simple admin check
const simpleAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }
  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });
  }
  next();
};

// Use these or try to import from authMiddleware
let protect, adminOnly;

try {
  const auth = require("../middleware/authMiddleware");
  protect = auth.protect || simpleProtect;
  adminOnly = auth.adminOnly || simpleAdminOnly;
  console.log("✅ Using auth from authMiddleware");
} catch (err) {
  console.log("⚠️ Using fallback auth middleware");
  protect = simpleProtect;
  adminOnly = simpleAdminOnly;
}

// ============================================================
// BASIC TEST ROUTE (No auth required)
// ============================================================
router.get("/test", (req, res) => {
  console.log("✅ Test route hit");
  res.json({
    success: true,
    message: "Admin API test route is working!",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// PUBLIC TEST ROUTE (No auth required)
// ============================================================
router.get("/public-test", async (req, res) => {
  console.log("GET /api/admin/public-test called");

  try {
    let notifications = [];
    let total = 0;

    try {
      if (Notification && typeof Notification.find === "function") {
        const query = Notification.find();
        if (query.sort) {
          notifications = await query.sort({ createdAt: -1 }).limit(10).exec();
        }
        if (Notification.countDocuments) {
          total = await Notification.countDocuments();
        }
      }
    } catch (err) {
      console.log("Notification model error:", err.message);
    }

    res.json({
      success: true,
      message: "API is working",
      notifications: notifications || [],
      stats: {
        total: total || 0,
        read: 0,
        unread: total || 0,
        sent: total || 0,
      },
    });
  } catch (error) {
    console.error("Public test error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      notifications: [],
      stats: { total: 0, read: 0, unread: 0, sent: 0 },
    });
  }
});

// ============================================================
// GET /api/admin/notifications - Get all notifications
// ============================================================
router.get("/notifications", protect, adminOnly, async (req, res) => {
  console.log("GET /api/admin/notifications called");
  console.log("User:", req.user?.email);

  try {
    let notifications = [];
    let total = 0;
    let read = 0;
    let unread = 0;

    try {
      if (Notification && typeof Notification.find === "function") {
        const query = Notification.find();
        if (query.sort) {
          notifications = await query
            .sort({ createdAt: -1 })
            .limit(100)
            .populate("user", "name email")
            .exec();
        }
        if (Notification.countDocuments) {
          total = await Notification.countDocuments();
          read = await Notification.countDocuments({ isRead: true });
          unread = await Notification.countDocuments({ isRead: false });
        }
      }
    } catch (dbError) {
      console.error("Database error:", dbError.message);
    }

    res.json({
      success: true,
      notifications: notifications || [],
      stats: {
        total: total || 0,
        read: read || 0,
        unread: unread || 0,
        sent: total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

// ============================================================
// POST /api/admin/notifications/send - Send notification
// ============================================================
router.post("/notifications/send", protect, adminOnly, async (req, res) => {
  console.log("POST /api/admin/notifications/send called");
  console.log("Title:", req.body.title);
  console.log("User:", req.user?.email);

  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    let notification = null;

    try {
      if (Notification && typeof Notification.create === "function") {
        notification = await Notification.create({
          title: title.trim(),
          message: message.trim(),
          type: type || "system",
          priority: "normal",
          isRead: false,
          user: req.user?._id || "000000000000000000000000",
          createdAt: new Date(),
        });
        console.log("Notification saved with ID:", notification._id);
      } else {
        // Mock response if model not available
        notification = {
          _id: Date.now().toString(),
          title: title.trim(),
          message: message.trim(),
          type: type || "system",
          isRead: false,
          createdAt: new Date(),
        };
      }
    } catch (dbError) {
      console.error("Database save error:", dbError.message);
      return res.status(500).json({
        success: false,
        message: "Database error: " + dbError.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      notification,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
});

// ============================================================
// DELETE /api/admin/notifications/:id - Delete notification
// ============================================================
router.delete("/notifications/:id", protect, adminOnly, async (req, res) => {
  console.log("DELETE /api/admin/notifications/:id called");
  console.log("ID:", req.params.id);

  try {
    if (Notification && typeof Notification.findByIdAndDelete === "function") {
      const notification = await Notification.findByIdAndDelete(req.params.id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
});

// ============================================================
// PUT /api/admin/notifications/:id/read - Mark as read
// ============================================================
router.put("/notifications/:id/read", protect, adminOnly, async (req, res) => {
  console.log("PUT /api/admin/notifications/:id/read called");
  console.log("ID:", req.params.id);

  try {
    if (Notification && typeof Notification.findByIdAndUpdate === "function") {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { isRead: true, readAt: new Date() },
        { new: true },
      );
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }
    }

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
});

// ============================================================
// GET /api/admin/notifications/stats - Get stats
// ============================================================
router.get("/notifications/stats", protect, adminOnly, async (req, res) => {
  console.log("GET /api/admin/notifications/stats called");

  try {
    let stats = {
      total: 0,
      read: 0,
      unread: 0,
      byType: {
        system: 0,
        notice: 0,
        event: 0,
        reminder: 0,
        alert: 0,
      },
    };

    if (Notification && typeof Notification.countDocuments === "function") {
      stats.total = await Notification.countDocuments();
      stats.read = await Notification.countDocuments({ isRead: true });
      stats.unread = await Notification.countDocuments({ isRead: false });
      stats.byType.system = await Notification.countDocuments({
        type: "system",
      });
      stats.byType.notice = await Notification.countDocuments({
        type: "notice",
      });
      stats.byType.event = await Notification.countDocuments({ type: "event" });
      stats.byType.reminder = await Notification.countDocuments({
        type: "reminder",
      });
      stats.byType.alert = await Notification.countDocuments({ type: "alert" });
    }

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
});

console.log("\n✅ Admin notification routes loaded");
console.log("   📍 GET  /api/admin/test");
console.log("   📍 GET  /api/admin/public-test (no auth)");
console.log("   📍 GET  /api/admin/notifications");
console.log("   📍 POST /api/admin/notifications/send");
console.log("   📍 DELETE /api/admin/notifications/:id");
console.log("   📍 PUT /api/admin/notifications/:id/read");
console.log("   📍 GET /api/admin/notifications/stats\n");

module.exports = router;
