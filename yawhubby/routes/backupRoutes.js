// controllers/backupController.js - Without diskusage dependency
const mongoose = require("mongoose");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment");
const checkDiskSpace = require("check-disk-space");
const { BackupService } = require("../services/backupService");

// Initialize backup service
const backupService = new BackupService();
backupService.initialize().catch(console.error);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// ============================================================
// BACKUP CREATION CONTROLLERS
// ============================================================

/**
 * @desc    Create a new backup
 * @route   POST /api/backups/create
 * @access  Admin only
 */
exports.createBackup = async (req, res, next) => {
  try {
    const { type = "full", options = {} } = req.body;

    const result = await backupService.createBackup(type, options);

    res.json({
      success: true,
      message: "Backup created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    next(error);
  }
};

/**
 * @desc    Create database backup only
 * @route   POST /api/backups/database
 * @access  Admin only
 */
exports.backupDatabase = async (req, res, next) => {
  try {
    const result = await backupService.createBackup("database");

    res.json({
      success: true,
      message: "Database backup completed",
      data: result,
    });
  } catch (error) {
    console.error("Error backing up database:", error);
    next(error);
  }
};

/**
 * @desc    Create uploads backup only
 * @route   POST /api/backups/uploads
 * @access  Admin only
 */
exports.backupUploads = async (req, res, next) => {
  try {
    const result = await backupService.createBackup("uploads");

    res.json({
      success: true,
      message: "Uploads backup completed",
      data: result,
    });
  } catch (error) {
    console.error("Error backing up uploads:", error);
    next(error);
  }
};

/**
 * @desc    Create logs backup only
 * @route   POST /api/backups/logs
 * @access  Admin only
 */
exports.backupLogs = async (req, res, next) => {
  try {
    const result = await backupService.createBackup("logs");

    res.json({
      success: true,
      message: "Logs backup completed",
      data: result,
    });
  } catch (error) {
    console.error("Error backing up logs:", error);
    next(error);
  }
};

/**
 * @desc    Create full system backup
 * @route   POST /api/backups/full
 * @access  Admin only
 */
exports.backupFull = async (req, res, next) => {
  try {
    const result = await backupService.createBackup("full");

    res.json({
      success: true,
      message: "Full system backup completed",
      data: result,
    });
  } catch (error) {
    console.error("Error creating full backup:", error);
    next(error);
  }
};

// ============================================================
// BACKUP LISTING CONTROLLERS
// ============================================================

/**
 * @desc    List all backups
 * @route   GET /api/backups/list
 * @access  Admin only
 */
exports.listBackups = async (req, res, next) => {
  try {
    const backups = await backupService.listBackups();

    res.json({
      success: true,
      data: {
        backups,
        total: backups.length,
        totalSize: formatBytes(backups.reduce((sum, b) => sum + b.size, 0)),
      },
    });
  } catch (error) {
    console.error("Error listing backups:", error);
    next(error);
  }
};

/**
 * @desc    Get backup details by ID
 * @route   GET /api/backups/:backupId
 * @access  Admin only
 */
exports.getBackupDetails = async (req, res, next) => {
  try {
    const { backupId } = req.params;
    const details = await backupService.getBackupDetails(backupId);

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error("Error getting backup details:", error);
    next(error);
  }
};

/**
 * @desc    Get backup statistics
 * @route   GET /api/backups/stats
 * @access  Admin only
 */
exports.getBackupStats = async (req, res, next) => {
  try {
    const stats = await backupService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting backup stats:", error);
    next(error);
  }
};

/**
 * @desc    Get backup status
 * @route   GET /api/backups/status
 * @access  Admin only
 */
exports.getBackupStatus = async (req, res, next) => {
  try {
    const status = backupService.getStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error getting backup status:", error);
    next(error);
  }
};

// ============================================================
// BACKUP OPERATION CONTROLLERS
// ============================================================

/**
 * @desc    Download backup file
 * @route   GET /api/backups/:backupId/download
 * @access  Admin only
 */
exports.downloadBackup = async (req, res, next) => {
  try {
    const { backupId } = req.params;
    const details = await backupService.getBackupDetails(backupId);

    res.download(details.path, `${backupId}.zip`, (err) => {
      if (err) {
        console.error("Error downloading backup:", err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: "Error downloading file",
          });
        }
      }
    });
  } catch (error) {
    console.error("Error downloading backup:", error);
    next(error);
  }
};

/**
 * @desc    Verify backup integrity
 * @route   POST /api/backups/:backupId/verify
 * @access  Admin only
 */
exports.verifyBackup = async (req, res, next) => {
  try {
    const { backupId } = req.params;
    const result = await backupService.verifyBackup(backupId);

    res.json({
      success: result.valid,
      data: result,
    });
  } catch (error) {
    console.error("Error verifying backup:", error);
    next(error);
  }
};

/**
 * @desc    Restore from backup
 * @route   POST /api/backups/:backupId/restore
 * @access  Admin only
 */
exports.restoreBackup = async (req, res, next) => {
  try {
    const { backupId } = req.params;
    const { options = {} } = req.body;

    const result = await backupService.restoreBackup(backupId, options);

    res.json({
      success: true,
      message: "Restore process completed",
      data: result,
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    next(error);
  }
};

/**
 * @desc    Delete backup
 * @route   DELETE /api/backups/:backupId
 * @access  Admin only
 */
exports.deleteBackup = async (req, res, next) => {
  try {
    const { backupId } = req.params;
    const { permanent = true } = req.body;

    const result = await backupService.deleteBackup(backupId, permanent);

    res.json({
      success: true,
      message: permanent
        ? "Backup permanently deleted"
        : "Backup moved to trash",
      data: result,
    });
  } catch (error) {
    console.error("Error deleting backup:", error);
    next(error);
  }
};

// ============================================================
// BACKUP CONFIGURATION CONTROLLERS
// ============================================================

/**
 * @desc    Get backup configuration
 * @route   GET /api/backups/config
 * @access  Admin only
 */
exports.getBackupConfig = async (req, res, next) => {
  try {
    const config = {
      backupPath: backupService.backupPath,
      retentionDays: backupService.retentionDays,
      isRunning: backupService.isRunning,
      currentOperation: backupService.currentOperation,
    };

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error getting backup config:", error);
    next(error);
  }
};

/**
 * @desc    Update backup configuration
 * @route   PUT /api/backups/config
 * @access  Admin only
 */
exports.updateBackupConfig = async (req, res, next) => {
  try {
    const { retentionDays, backupPath } = req.body;

    if (retentionDays) {
      backupService.retentionDays = retentionDays;
      process.env.BACKUP_RETENTION_DAYS = retentionDays;
    }

    if (backupPath) {
      backupService.backupPath = backupPath;
      await backupService.initialize();
      process.env.BACKUP_PATH = backupPath;
    }

    res.json({
      success: true,
      message: "Backup configuration updated",
      data: {
        retentionDays: backupService.retentionDays,
        backupPath: backupService.backupPath,
      },
    });
  } catch (error) {
    console.error("Error updating backup config:", error);
    next(error);
  }
};

// ============================================================
// BACKUP OPERATION CONTROL CONTROLLERS
// ============================================================

/**
 * @desc    Cancel ongoing backup operation
 * @route   POST /api/backups/cancel
 * @access  Admin only
 */
exports.cancelBackupOperation = async (req, res, next) => {
  try {
    if (!backupService.isRunning) {
      return res.status(400).json({
        success: false,
        error: "No backup operation in progress",
      });
    }

    // Note: This is a soft cancel - the current operation will complete
    // but no new operations will start
    backupService.isRunning = false;

    res.json({
      success: true,
      message: "Backup operation cancelled",
      data: backupService.currentOperation,
    });
  } catch (error) {
    console.error("Error cancelling backup operation:", error);
    next(error);
  }
};

// Export all functions
module.exports = exports;

