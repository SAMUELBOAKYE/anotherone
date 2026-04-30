// controllers/smsController.js
// Professional SMS Management Controller with Analytics, Logging, and Administration

const SMSLog = require("../models/SMSLog");
const {
  getSMSStats,
  initializeSMSService,
  sendSMS,
  sendTemplatedSMS,
  sendBatchSMS,
  getSMSStatistics,
  getProviderPerformance,
  getUserSMSHistory,
  getBatchStatus,
  updateDeliveryStatus,
} = require("../services/smsService");
const { HTTP_STATUS, USER_ROLES } = require("../config/constants");
const logger = require("../utils/logger");

/**
 * @desc    Get SMS analytics and statistics dashboard data
 * @route   GET /api/sms/analytics
 * @access  Private (Admin only)
 */
exports.getSMSAnalytics = async (req, res, next) => {
  try {
    // Role-based access control
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      req.user.role !== USER_ROLES.SUPER_ADMIN
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Admin or Super Admin access required",
      });
    }

    const { startDate, endDate, provider, groupBy = "day" } = req.query;

    // Build filters
    const filters = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (provider) filters.provider = provider;

    // Check if SMSLog methods exist, provide fallbacks
    const getStatistics = async () => {
      if (SMSLog.getStatistics) {
        return await SMSLog.getStatistics(filters);
      }
      return {
        total: await SMSLog.countDocuments(filters),
        byStatus: {
          delivered: await SMSLog.countDocuments({
            ...filters,
            status: "delivered",
          }),
          sent: await SMSLog.countDocuments({ ...filters, status: "sent" }),
          failed: await SMSLog.countDocuments({ ...filters, status: "failed" }),
          queued: await SMSLog.countDocuments({ ...filters, status: "queued" }),
        },
      };
    };

    const getProviderMetrics = async () => {
      if (SMSLog.getProviderMetrics) {
        return await SMSLog.getProviderMetrics({
          start: filters.startDate,
          end: filters.endDate,
        });
      }
      return [];
    };

    const getDailyVolume = async () => {
      if (SMSLog.getDailyVolume) {
        return await SMSLog.getDailyVolume(parseInt(req.query.days) || 30);
      }
      return [];
    };

    const getStatusDistribution = async () => {
      if (SMSLog.getStatusDistribution) {
        return await SMSLog.getStatusDistribution(filters);
      }
      const distribution = {};
      const statuses = ["delivered", "sent", "failed", "queued", "pending"];
      for (const status of statuses) {
        distribution[status] = await SMSLog.countDocuments({
          ...filters,
          status,
        });
      }
      return distribution;
    };

    // Execute parallel queries for dashboard data
    const [
      statistics,
      providerMetrics,
      dailyVolume,
      queueStats,
      statusDistribution,
      recentFailures,
    ] = await Promise.all([
      getStatistics(),
      getProviderMetrics(),
      getDailyVolume(),
      getSMSStats(),
      getStatusDistribution(),
      SMSLog.find({
        status: "failed",
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
        .catch(() => []),
    ]);

    // Calculate success rate
    const successRate =
      statistics.total > 0
        ? (
            ((statistics.byStatus?.delivered || 0) / statistics.total) *
            100
          ).toFixed(2)
        : 0;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        overview: {
          ...statistics,
          successRate: parseFloat(successRate),
          queueHealth: {
            active: queueStats?.queue?.active || 0,
            waiting: queueStats?.queue?.waiting || 0,
            completed: queueStats?.queue?.completed || 0,
            failed: queueStats?.queue?.failed || 0,
          },
        },
        providerMetrics: providerMetrics || [],
        dailyVolume: dailyVolume || [],
        statusDistribution: statusDistribution || {},
        recentFailures: recentFailures.map((failure) => ({
          id: failure._id,
          phoneNumber: failure.phoneNumber,
          provider: failure.provider,
          errorMessage: failure.errorMessage,
          createdAt: failure.createdAt,
        })),
        timeframe: {
          start: startDate || "All time",
          end: endDate || "Present",
          groupBy,
        },
      },
    });
  } catch (error) {
    logger.error(`Get SMS analytics error: ${error.message}`, {
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get SMS logs with advanced filtering and pagination
 * @route   GET /api/sms/logs
 * @access  Private (Admin only)
 */
exports.getSMSLogs = async (req, res, next) => {
  try {
    // Role-based access control
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      req.user.role !== USER_ROLES.SUPER_ADMIN
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Admin or Super Admin access required",
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    // Build dynamic query
    const query = {};

    // Apply filters safely
    if (req.query.status) query.status = req.query.status;
    if (req.query.provider) query.provider = req.query.provider;
    if (req.query.phoneNumber) {
      query.phoneNumber = { $regex: req.query.phoneNumber, $options: "i" };
    }
    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.batchId) query.batchId = req.query.batchId;

    // Date range filtering
    if (req.query.startDate) {
      query.createdAt = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      query.createdAt = {
        ...query.createdAt,
        $lte: new Date(req.query.endDate),
      };
    }

    // Cost range filtering
    if (req.query.minCost) {
      query.cost = { $gte: parseFloat(req.query.minCost) };
    }
    if (req.query.maxCost) {
      query.cost = { ...query.cost, $lte: parseFloat(req.query.maxCost) };
    }

    // Execute queries in parallel
    const [logs, total] = await Promise.all([
      SMSLog.find(query)
        .populate("userId", "firstName lastName email phone department")
        .populate("createdBy", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .catch(() => []),
      SMSLog.countDocuments(query).catch(() => 0),
    ]);

    // Calculate total cost for current page
    const pageTotalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: logs,
      summary: {
        pageTotalCost: pageTotalCost.toFixed(4),
        averageCostPerMessage:
          logs.length > 0 ? (pageTotalCost / logs.length).toFixed(4) : 0,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        startIndex: skip + 1,
        endIndex: Math.min(skip + limit, total),
      },
    });
  } catch (error) {
    logger.error(`Get SMS logs error: ${error.message}`, {
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get single SMS log details with full history
 * @route   GET /api/sms/logs/:id
 * @access  Private (Admin only)
 */
exports.getSMSLogById = async (req, res, next) => {
  try {
    // Role-based access control
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      req.user.role !== USER_ROLES.SUPER_ADMIN
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Admin or Super Admin access required",
      });
    }

    const log = await SMSLog.findById(req.params.id)
      .populate(
        "userId",
        "firstName lastName email phone department studentId staffId",
      )
      .populate("createdBy", "firstName lastName email role");

    if (!log) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "SMS log not found",
      });
    }

    // Get related logs (same batch if exists)
    let relatedLogs = [];
    if (log.batchId) {
      relatedLogs = await SMSLog.find({ batchId: log.batchId })
        .select("phoneNumber status cost createdAt")
        .limit(20)
        .lean()
        .catch(() => []);
    }

    // Get status timeline
    const statusTimeline = log.statusHistory || [];

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...log.toObject(),
        statusTimeline,
        relatedLogs: relatedLogs.filter(
          (l) => l._id.toString() !== log._id.toString(),
        ),
        canRetry: log.status === "failed" && log.retryCount < 3,
      },
    });
  } catch (error) {
    logger.error(`Get SMS log by ID error: ${error.message}`, {
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Retry failed SMS message
 * @route   POST /api/sms/retry/:id
 * @access  Private (Admin only)
 */
exports.retryFailedSMS = async (req, res, next) => {
  try {
    // Role-based access control
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      req.user.role !== USER_ROLES.SUPER_ADMIN
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Admin or Super Admin access required",
      });
    }

    const log = await SMSLog.findById(req.params.id);

    if (!log) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "SMS log not found",
      });
    }

    // Validate retry conditions
    if (log.status !== "failed") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Cannot retry message with status: ${log.status}. Only failed messages can be retried.`,
      });
    }

    if (log.retryCount >= 3) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Maximum retry attempts (3) already reached for this message",
      });
    }

    // Increment retry count
    log.retryCount = (log.retryCount || 0) + 1;
    await log.save();

    // Send retry
    const result = await sendSMS(log.phoneNumber, log.message, {
      ...log.metadata,
      retryOriginal: true,
      originalLogId: log._id,
      retryAttempt: log.retryCount,
      userId: log.userId,
      batchId: log.batchId,
      createdBy: req.user._id,
    });

    logger.info(
      `SMS retry initiated for log ${log._id} by user ${req.user._id}`,
      {
        phoneNumber: log.phoneNumber,
        retryAttempt: log.retryCount,
        result: result?.queued ? "queued" : "sent",
      },
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        originalLogId: log._id,
        retryAttempt: log.retryCount,
        result,
        status: result?.queued ? "queued" : "sent",
      },
      message: `SMS retry ${result?.queued ? "queued" : "sent"} successfully (Attempt ${log.retryCount}/3)`,
    });
  } catch (error) {
    logger.error(`Retry SMS error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * @desc    Export SMS logs to CSV or JSON
 * @route   GET /api/sms/export
 * @access  Private (Admin only)
 */
exports.exportSMSLogs = async (req, res, next) => {
  try {
    // Role-based access control
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      req.user.role !== USER_ROLES.SUPER_ADMIN
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Admin or Super Admin access required",
      });
    }

    const { format = "csv", startDate, endDate, status, provider } = req.query;

    // Validate format
    if (!["csv", "json"].includes(format)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid format. Supported formats: csv, json",
      });
    }

    // Build query
    const query = {};
    if (startDate) query.createdAt = { $gte: new Date(startDate) };
    if (endDate)
      query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    if (status) query.status = status;
    if (provider) query.provider = provider;

    // Limit export to prevent performance issues
    const maxExport = 10000;
    const logs = await SMSLog.find(query)
      .sort({ createdAt: -1 })
      .limit(maxExport)
      .lean()
      .catch(() => []);

    if (logs.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "No logs found matching the criteria",
      });
    }

    // Prepare export data
    const exportData = logs.map((log) => ({
      id: log._id.toString(),
      phoneNumber: log.phoneNumber,
      message: log.message,
      provider: log.provider,
      status: log.status,
      cost: log.cost,
      currency: log.currency,
      userId: log.userId?.toString() || "",
      batchId: log.batchId,
      errorCode: log.errorCode,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
      sentAt: log.sentAt,
      deliveredAt: log.deliveredAt,
      failedAt: log.failedAt,
    }));

    if (format === "csv") {
      try {
        const json2csv = require("json2csv");
        const fields = [
          "id",
          "phoneNumber",
          "message",
          "provider",
          "status",
          "cost",
          "currency",
          "userId",
          "batchId",
          "errorCode",
          "errorMessage",
          "createdAt",
          "sentAt",
          "deliveredAt",
          "failedAt",
        ];
        const parser = new json2csv.Parser({ fields });
        const csv = parser.parse(exportData);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=sms-logs-${Date.now()}.csv`,
        );
        return res.send(csv);
      } catch (csvError) {
        logger.error(`CSV generation error: ${csvError.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Error generating CSV file",
        });
      }
    }

    // JSON export
    res.status(HTTP_STATUS.OK).json({
      success: true,
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: exportData.length,
        format: "json",
        filters: { startDate, endDate, status, provider },
      },
      data: exportData,
    });
  } catch (error) {
    logger.error(`Export SMS logs error: ${error.message}`, {
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get SMS cost analysis and breakdown
 * @route   GET /api/sms/costs
 * @access  Private (Admin only)
 */
exports.getSMSCosts = async (req, res, next) => {
  try {
    // Role-based access control
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      req.user.role !== USER_ROLES.SUPER_ADMIN
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Admin or Super Admin access required",
      });
    }

    const {
      period = "month",
      startDate: customStart,
      endDate: customEnd,
    } = req.query;
    let startDate = new Date();
    let endDate = new Date();

    // Determine date range based on period
    if (customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
    } else {
      switch (period) {
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }
    }

    // Aggregate costs by provider and status
    const costs = await SMSLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ["sent", "delivered"] },
        },
      },
      {
        $group: {
          _id: {
            provider: "$provider",
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            status: "$status",
          },
          totalMessages: { $sum: 1 },
          totalCost: { $sum: "$cost" },
          averageCost: { $avg: "$cost" },
        },
      },
      {
        $group: {
          _id: "$_id.provider",
          breakdown: {
            $push: {
              month: "$_id.month",
              year: "$_id.year",
              status: "$_id.status",
              messages: "$totalMessages",
              cost: "$totalCost",
              avgCost: "$averageCost",
            },
          },
          totalMessages: { $sum: "$totalMessages" },
          totalCost: { $sum: "$totalCost" },
        },
      },
      {
        $project: {
          provider: "$_id",
          totalMessages: 1,
          totalCost: 1,
          averageCost: { $divide: ["$totalCost", "$totalMessages"] },
          breakdown: 1,
          _id: 0,
        },
      },
      { $sort: { totalCost: -1 } },
    ]).catch(() => []);

    // Calculate overall totals
    const totalCost = costs.reduce((sum, p) => sum + p.totalCost, 0);
    const totalMessages = costs.reduce((sum, p) => sum + p.totalMessages, 0);

    // Get daily cost trend
    const dailyTrend = await SMSLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ["sent", "delivered"] },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            provider: "$provider",
          },
          dailyCost: { $sum: "$cost" },
          dailyCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          costs: {
            $push: {
              provider: "$_id.provider",
              cost: "$dailyCost",
              count: "$dailyCount",
            },
          },
          totalDailyCost: { $sum: "$dailyCost" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 90 },
    ]).catch(() => []);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        period,
        dateRange: {
          startDate,
          endDate,
          days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
        },
        summary: {
          totalCost: totalCost.toFixed(4),
          totalMessages,
          averageCostPerMessage:
            totalMessages > 0 ? (totalCost / totalMessages).toFixed(5) : 0,
          projectedMonthlyCost:
            period === "month" ? totalCost.toFixed(2) : null,
        },
        breakdown: costs.map((c) => ({
          provider: c.provider,
          totalMessages: c.totalMessages,
          totalCost: c.totalCost.toFixed(4),
          averageCost: c.averageCost.toFixed(5),
          percentageOfTotal:
            totalCost > 0 ? ((c.totalCost / totalCost) * 100).toFixed(2) : 0,
        })),
        dailyTrend: dailyTrend.map((d) => ({
          date: d._id,
          totalCost: d.totalDailyCost.toFixed(4),
          providers: d.costs,
        })),
      },
    });
  } catch (error) {
    logger.error(`Get SMS costs error: ${error.message}`, {
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get SMS delivery report and performance metrics
 * @route   GET /api/sms/delivery-report
 * @access  Private (Admin only)
 */
exports.getDeliveryReport = async (req, res, next) => {
  try {
    // Role-based access control
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      req.user.role !== USER_ROLES.SUPER_ADMIN
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Admin or Super Admin access required",
      });
    }

    const { days = 7, provider } = req.query;
    const startDate = new Date(
      Date.now() - parseInt(days) * 24 * 60 * 60 * 1000,
    );

    const matchQuery = { createdAt: { $gte: startDate } };
    if (provider) matchQuery.provider = provider;

    // Calculate delivery metrics
    const deliveryMetrics = await SMSLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$provider",
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
          delivered: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "queued"] }, 1, 0] } },
          avgDeliveryTime: { $avg: { $subtract: ["$deliveredAt", "$sentAt"] } },
        },
      },
      {
        $project: {
          provider: "$_id",
          total: 1,
          sent: 1,
          delivered: 1,
          failed: 1,
          pending: 1,
          deliveryRate: {
            $multiply: [{ $divide: ["$delivered", "$total"] }, 100],
          },
          failureRate: {
            $multiply: [{ $divide: ["$failed", "$total"] }, 100],
          },
          avgDeliveryTimeSeconds: { $divide: ["$avgDeliveryTime", 1000] },
        },
      },
    ]).catch(() => []);

    // Get failure reasons breakdown
    const failureReasons = await SMSLog.aggregate([
      {
        $match: {
          ...matchQuery,
          status: "failed",
          errorMessage: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$errorMessage",
          count: { $sum: 1 },
          provider: { $first: "$provider" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]).catch(() => []);

    const totalDelivered = deliveryMetrics.reduce(
      (sum, m) => sum + m.delivered,
      0,
    );
    const totalFailed = deliveryMetrics.reduce((sum, m) => sum + m.failed, 0);
    const totalMessages = deliveryMetrics.reduce((sum, m) => sum + m.total, 0);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        reportPeriod: {
          days: parseInt(days),
          startDate,
          endDate: new Date(),
        },
        overallMetrics: {
          totalDelivered,
          totalFailed,
          overallDeliveryRate:
            totalMessages > 0 ? (totalDelivered / totalMessages) * 100 : 0,
        },
        providerMetrics: deliveryMetrics,
        failureReasons: failureReasons.map((r) => ({
          reason: r._id,
          count: r.count,
          provider: r.provider,
        })),
      },
    });
  } catch (error) {
    logger.error(`Get delivery report error: ${error.message}`, {
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get batch SMS status and progress
 * @route   GET /api/sms/batch/:batchId
 * @access  Private (Admin only)
 */
exports.getBatchStatus = async (req, res, next) => {
  try {
    // Role-based access control
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      req.user.role !== USER_ROLES.SUPER_ADMIN
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Admin or Super Admin access required",
      });
    }

    const { batchId } = req.params;

    // Check if getBatchStatus function exists
    let batchStatus;
    if (typeof getBatchStatus === "function") {
      batchStatus = await getBatchStatus(batchId);
    } else {
      // Fallback: query directly from SMSLog
      const logs = await SMSLog.find({ batchId });
      batchStatus = {
        batchId,
        total: logs.length,
        sent: logs.filter((l) => l.status === "sent").length,
        delivered: logs.filter((l) => l.status === "delivered").length,
        failed: logs.filter((l) => l.status === "failed").length,
        pending: logs.filter(
          (l) => l.status === "queued" || l.status === "pending",
        ).length,
      };
    }

    if (!batchStatus || (batchStatus.total === 0 && !batchStatus.batchId)) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Calculate progress percentage
    const progress =
      batchStatus.total > 0
        ? (
            ((batchStatus.sent + batchStatus.delivered + batchStatus.failed) /
              batchStatus.total) *
            100
          ).toFixed(2)
        : 0;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...batchStatus,
        progress: parseFloat(progress),
        estimatedCompletion:
          batchStatus.pending === 0 ? "Completed" : "In Progress",
      },
    });
  } catch (error) {
    logger.error(`Get batch status error: ${error.message}`, {
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Webhook handler for delivery status updates from providers
 * @route   POST /api/sms/webhook/delivery-status
 * @access  Public (but should be secured with API key)
 */
exports.deliveryStatusWebhook = async (req, res, next) => {
  try {
    // Verify webhook signature (implement based on provider)
    const { messageId, status, metadata, provider } = req.body;

    if (!messageId || !status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Missing required fields: messageId, status",
      });
    }

    if (typeof updateDeliveryStatus === "function") {
      await updateDeliveryStatus(messageId, status, {
        ...metadata,
        provider,
        webhookReceivedAt: new Date().toISOString(),
      });
    } else {
      // Fallback: update directly
      await SMSLog.findOneAndUpdate(
        { messageId },
        {
          status,
          deliveredAt: status === "delivered" ? new Date() : undefined,
          failedAt: status === "failed" ? new Date() : undefined,
          "metadata.webhookReceivedAt": new Date().toISOString(),
        },
      );
    }

    logger.info(`Delivery status updated via webhook`, { messageId, status });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Delivery status updated",
    });
  } catch (error) {
    logger.error(`Delivery status webhook error: ${error.message}`, {
      stack: error.stack,
    });
    // Always return 200 to prevent provider retries
    res.status(HTTP_STATUS.OK).json({
      success: false,
      message: "Webhook received but processing failed",
    });
  }
};

/**
 * @desc    Get user's personal SMS history
 * @route   GET /api/sms/my-history
 * @access  Private (Authenticated users)
 */
exports.getMySMSHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let history = [];
    if (typeof getUserSMSHistory === "function") {
      history = await getUserSMSHistory(req.user._id, limit, offset);
    } else {
      history = await SMSLog.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean();
    }

    const total = await SMSLog.countDocuments({ userId: req.user._id }).catch(
      () => 0,
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    });
  } catch (error) {
    logger.error(`Get my SMS history error: ${error.message}`, {
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get provider performance comparison
 * @route   GET /api/sms/provider-performance
 * @access  Private (Admin only)
 */
exports.getProviderPerformance = async (req, res, next) => {
  try {
    // Role-based access control
    if (
      req.user.role !== USER_ROLES.ADMIN &&
      req.user.role !== USER_ROLES.SUPER_ADMIN
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Admin or Super Admin access required",
      });
    }

    const { days = 30 } = req.query;
    const startDate = new Date(
      Date.now() - parseInt(days) * 24 * 60 * 60 * 1000,
    );

    let performance = [];
    if (typeof getProviderPerformance === "function") {
      performance = await getProviderPerformance({ start: startDate });
    } else {
      // Fallback: calculate from SMSLog
      performance = await SMSLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: "$provider",
            totalSent: { $sum: 1 },
            delivered: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            failed: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            totalCost: { $sum: "$cost" },
            avgResponseTime: {
              $avg: { $subtract: ["$deliveredAt", "$sentAt"] },
            },
          },
        },
      ]);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        period: `${days} days`,
        performance: performance.map((p) => ({
          ...p,
          costEfficiency:
            p.totalCost > 0 ? (p.delivered / p.totalCost).toFixed(2) : 0,
          deliveryRate:
            p.totalSent > 0
              ? ((p.delivered / p.totalSent) * 100).toFixed(2)
              : 0,
        })),
      },
    });
  } catch (error) {
    logger.error(`Get provider performance error: ${error.message}`, {
      stack: error.stack,
    });
    next(error);
  }
};

// Final export to ensure all functions are available
module.exports = {
  getSMSAnalytics: exports.getSMSAnalytics,
  getSMSLogs: exports.getSMSLogs,
  getSMSLogById: exports.getSMSLogById,
  retryFailedSMS: exports.retryFailedSMS,
  exportSMSLogs: exports.exportSMSLogs,
  getSMSCosts: exports.getSMSCosts,
  getDeliveryReport: exports.getDeliveryReport,
  getBatchStatus: exports.getBatchStatus,
  deliveryStatusWebhook: exports.deliveryStatusWebhook,
  getMySMSHistory: exports.getMySMSHistory,
  getProviderPerformance: exports.getProviderPerformance,
};
