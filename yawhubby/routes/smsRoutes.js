// routes/smsRoutes.js
// Professional SMS Management Routes with Comprehensive Endpoints

const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  // Analytics & Statistics
  getSMSAnalytics,
  getSMSCosts,
  getDeliveryReport,
  getProviderPerformance,

  // Log Management
  getSMSLogs,
  getSMSLogById,
  exportSMSLogs,

  // Batch Operations
  getBatchStatus,

  // SMS Operations
  retryFailedSMS,

  // User Operations
  getMySMSHistory,

  // Webhooks (Public)
  deliveryStatusWebhook,
} = require("../controllers/smsController");

// ============================================================
// PUBLIC WEBHOOK ROUTES (No authentication required)
// ============================================================

/**
 * @route   POST /api/sms/webhook/delivery-status
 * @desc    Webhook endpoint for provider delivery status updates
 * @access  Public (secured by webhook secret)
 */
router.post("/webhook/delivery-status", deliveryStatusWebhook);

// ============================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================
router.use(protect);

/**
 * @route   GET /api/sms/my-history
 * @desc    Get current user's SMS history
 * @access  Private (All authenticated users)
 */
router.get("/my-history", getMySMSHistory);

// ============================================================
// ADMIN ONLY ROUTES
// ============================================================

/**
 * @route   GET /api/sms/analytics
 * @desc    Get comprehensive SMS analytics dashboard
 * @access  Private (Admin only)
 */
router.get("/analytics", authorize("admin", "super_admin"), getSMSAnalytics);

/**
 * @route   GET /api/sms/costs
 * @desc    Get SMS cost analysis and breakdown
 * @access  Private (Admin only)
 */
router.get("/costs", authorize("admin", "super_admin"), getSMSCosts);

/**
 * @route   GET /api/sms/delivery-report
 * @desc    Get delivery performance report
 * @access  Private (Admin only)
 */
router.get(
  "/delivery-report",
  authorize("admin", "super_admin"),
  getDeliveryReport,
);

/**
 * @route   GET /api/sms/provider-performance
 * @desc    Get provider performance comparison
 * @access  Private (Admin only)
 */
router.get(
  "/provider-performance",
  authorize("admin", "super_admin"),
  getProviderPerformance,
);

/**
 * @route   GET /api/sms/logs
 * @desc    Get paginated SMS logs with filtering
 * @access  Private (Admin only)
 */
router.get("/logs", authorize("admin", "super_admin"), getSMSLogs);

/**
 * @route   GET /api/sms/logs/:id
 * @desc    Get single SMS log with full details
 * @access  Private (Admin only)
 */
router.get("/logs/:id", authorize("admin", "super_admin"), getSMSLogById);

/**
 * @route   GET /api/sms/export
 * @desc    Export SMS logs to CSV or JSON
 * @access  Private (Admin only)
 */
router.get("/export", authorize("admin", "super_admin"), exportSMSLogs);

/**
 * @route   GET /api/sms/batch/:batchId
 * @desc    Get batch SMS status and progress
 * @access  Private (Admin only)
 */
router.get(
  "/batch/:batchId",
  authorize("admin", "super_admin"),
  getBatchStatus,
);

/**
 * @route   POST /api/sms/retry/:id
 * @desc    Retry a failed SMS message
 * @access  Private (Admin only)
 */
router.post("/retry/:id", authorize("admin", "super_admin"), retryFailedSMS);

// ============================================================
// BULK OPERATIONS (Optional - can be implemented later)
// ============================================================

/**
 * @route   POST /api/sms/bulk/retry
 * @desc    Bulk retry multiple failed SMS messages
 * @access  Private (Admin only)
 */
router.post(
  "/bulk/retry",
  authorize("admin", "super_admin"),
  async (req, res, next) => {
    try {
      const { logIds } = req.body;

      if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please provide an array of log IDs to retry",
        });
      }

      if (logIds.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Maximum 100 logs can be retried at once",
        });
      }

      const { sendSMS } = require("../services/smsService");
      const SMSLog = require("../models/SMSLog");

      const results = {
        total: logIds.length,
        successful: 0,
        failed: 0,
        details: [],
      };

      for (const logId of logIds) {
        try {
          const log = await SMSLog.findById(logId);

          if (!log || log.status !== "failed") {
            results.failed++;
            results.details.push({
              logId,
              success: false,
              message: "Log not found or not in failed state",
            });
            continue;
          }

          const result = await sendSMS(log.phoneNumber, log.message, {
            retryOriginal: true,
            originalLogId: log._id,
            bulkRetry: true,
            userId: log.userId,
            createdBy: req.user._id,
          });

          results.successful++;
          results.details.push({
            logId,
            success: true,
            result,
          });
        } catch (error) {
          results.failed++;
          results.details.push({
            logId,
            success: false,
            message: error.message,
          });
        }
      }

      res.status(200).json({
        success: true,
        data: results,
        message: `Bulk retry completed: ${results.successful} successful, ${results.failed} failed`,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   DELETE /api/sms/logs
 * @desc    Bulk delete old SMS logs
 * @access  Private (Super Admin only)
 */
router.delete("/logs", authorize("super_admin"), async (req, res, next) => {
  try {
    const { daysOld = 90, status, confirm } = req.query;

    if (confirm !== "yes") {
      return res.status(400).json({
        success: false,
        message: "Please confirm deletion with ?confirm=yes",
        warning: `This will delete all SMS logs older than ${daysOld} days`,
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

    const query = { createdAt: { $lt: cutoffDate } };
    if (status) query.status = status;

    const SMSLog = require("../models/SMSLog");
    const result = await SMSLog.deleteMany(query);

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate,
        status: status || "all",
      },
      message: `Successfully deleted ${result.deletedCount} SMS logs older than ${daysOld} days`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/sms/stats/summary
 * @desc    Get quick stats summary for dashboard
 * @access  Private (Admin only)
 */
router.get(
  "/stats/summary",
  authorize("admin", "super_admin"),
  async (req, res, next) => {
    try {
      const SMSLog = require("../models/SMSLog");
      const { getSMSStats } = require("../services/smsService");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [totalStats, todayStats, queueStats, recentActivity] =
        await Promise.all([
          SMSLog.getStatistics(),
          SMSLog.getStatistics({ startDate: today, endDate: tomorrow }),
          getSMSStats(),
          SMSLog.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("phoneNumber status provider cost createdAt")
            .lean(),
        ]);

      res.status(200).json({
        success: true,
        data: {
          lifetime: totalStats,
          today: todayStats,
          queue: {
            pending: queueStats.queued || 0,
            processing: queueStats.queue?.active || 0,
            completed: queueStats.queue?.completed || 0,
          },
          recentActivity,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   GET /api/sms/providers/status
 * @desc    Get current status of all SMS providers
 * @access  Private (Admin only)
 */
router.get(
  "/providers/status",
  authorize("admin", "super_admin"),
  async (req, res, next) => {
    try {
      const { getSMSStats } = require("../services/smsService");
      const stats = await getSMSStats();

      res.status(200).json({
        success: true,
        data: {
          providers: stats.providers || [],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route   POST /api/sms/test
 * @desc    Test SMS sending (development only)
 * @access  Private (Admin only, development)
 */
if (process.env.NODE_ENV !== "production") {
  router.post(
    "/test",
    authorize("admin", "super_admin"),
    async (req, res, next) => {
      try {
        const { sendSMS } = require("../services/smsService");
        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
          return res.status(400).json({
            success: false,
            message: "Phone number and message are required",
          });
        }

        const result = await sendSMS(phoneNumber, message, {
          test: true,
          createdBy: req.user._id,
          userId: req.user._id,
        });

        res.status(200).json({
          success: true,
          data: result,
          message: "Test SMS sent successfully",
        });
      } catch (error) {
        next(error);
      }
    },
  );
}

// ============================================================
// ERROR HANDLING FOR THIS ROUTER
// ============================================================

/**
 * Handle invalid route errors
 */
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} on SMS routes`,
    validEndpoints: {
      analytics: "GET /api/sms/analytics",
      costs: "GET /api/sms/costs",
      deliveryReport: "GET /api/sms/delivery-report",
      providerPerformance: "GET /api/sms/provider-performance",
      logs: "GET /api/sms/logs",
      logDetail: "GET /api/sms/logs/:id",
      export: "GET /api/sms/export",
      batchStatus: "GET /api/sms/batch/:batchId",
      retry: "POST /api/sms/retry/:id",
      myHistory: "GET /api/sms/my-history",
      bulkRetry: "POST /api/sms/bulk/retry",
      deleteLogs: "DELETE /api/sms/logs",
      statsSummary: "GET /api/sms/stats/summary",
      providersStatus: "GET /api/sms/providers/status",
      webhook: "POST /api/sms/webhook/delivery-status",
    },
  });
});

module.exports = router;
