const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
  generateAvatar, 
  getAvatarStats, 
  batchGenerateAvatars,
  deleteAvatar,
  validateAvatar
} = require('../utils/avatarGenerator');
const User = require('../models/User');
const { HTTP_STATUS, MESSAGES, USER_ROLES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * @route   POST /api/avatar/generate
 * @desc    Generate or regenerate avatar for current user
 * @access  Private
 * @param   {boolean} [force] - Force regeneration even if custom avatar exists
 */
router.post('/generate', protect, async (req, res, next) => {
  try {
    const { force = false } = req.query;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
        error: 'User not found'
      });
    }
    
    // Check if user has custom avatar and force is not true
    if (!force && user.avatar && user.avatar !== 'default-avatar.png') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'User already has a custom avatar',
        error: 'Use force=true to regenerate or delete avatar first'
      });
    }
    
    // Delete existing avatar if it's not default
    if (user.avatar && user.avatar !== 'default-avatar.png') {
      await deleteAvatar(user.avatar);
    }
    
    // Generate new avatar
    const avatar = await generateAvatar(
      user._id,
      user.firstName,
      user.lastName,
      user.email
    );
    
    user.avatar = avatar;
    await user.save();
    
    logger.info(`Avatar generated for user: ${user.email}`);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        avatar,
        avatarUrl: user.avatarUrl
      },
      message: 'Avatar generated successfully'
    });
  } catch (error) {
    logger.error(`Generate avatar error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   GET /api/avatar/:userId
 * @desc    Get avatar URL for a specific user
 * @access  Public
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('avatar firstName lastName');
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
        error: 'User not found'
      });
    }
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        name: user.fullName
      }
    });
  } catch (error) {
    logger.error(`Get avatar error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   GET /api/avatar/stats
 * @desc    Get avatar statistics
 * @access  Private (Admin)
 */
router.get('/stats', protect, authorize(USER_ROLES.ADMIN), async (req, res, next) => {
  try {
    const stats = await getAvatarStats();
    
    // Add additional statistics
    const totalUsers = await User.countDocuments({ deletedAt: null });
    const usersWithCustomAvatars = await User.countDocuments({
      avatar: { $nin: ['default-avatar.png', null] },
      deletedAt: null
    });
    const usersWithDefaultAvatars = await User.countDocuments({
      $or: [
        { avatar: 'default-avatar.png' },
        { avatar: { $exists: false } }
      ],
      deletedAt: null
    });
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...stats,
        totalUsers,
        usersWithCustomAvatars,
        usersWithDefaultAvatars,
        customAvatarPercentage: ((usersWithCustomAvatars / totalUsers) * 100).toFixed(2)
      }
    });
  } catch (error) {
    logger.error(`Get avatar stats error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   POST /api/avatar/batch-generate
 * @desc    Batch generate avatars for users without custom avatars
 * @access  Private (Admin)
 * @param   {Object} filters - Optional filters for user selection
 */
router.post('/batch-generate', protect, authorize(USER_ROLES.ADMIN), async (req, res, next) => {
  try {
    const { 
      role, 
      department, 
      limit = 100,
      force = false 
    } = req.body;
    
    // Build query for users who need avatars
    const query = {
      deletedAt: null
    };
    
    if (!force) {
      query.$or = [
        { avatar: 'default-avatar.png' },
        { avatar: { $exists: false } }
      ];
    }
    
    // Apply filters
    if (role) {
      query.role = role;
    }
    
    if (department) {
      query.department = department;
    }
    
    const users = await User.find(query).limit(parseInt(limit));
    
    if (users.length === 0) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          total: 0,
          success: 0,
          failed: 0,
          skipped: 0
        },
        message: 'No users found matching the criteria'
      });
    }
    
    const result = await batchGenerateAvatars(users, force);
    
    logger.info(`Batch avatar generation completed: ${result.success} succeeded, ${result.failed} failed`);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: `Generated ${result.success} avatars, ${result.failed} failed, ${result.skipped || 0} skipped`
    });
  } catch (error) {
    logger.error(`Batch generate avatars error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   DELETE /api/avatar
 * @desc    Delete current user's avatar and regenerate
 * @access  Private
 */
router.delete('/', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
        error: 'User not found'
      });
    }
    
    // Delete existing avatar if not default
    if (user.avatar && user.avatar !== 'default-avatar.png') {
      await deleteAvatar(user.avatar);
    }
    
    // Generate new avatar
    const newAvatar = await generateAvatar(
      user._id,
      user.firstName,
      user.lastName,
      user.email
    );
    
    user.avatar = newAvatar;
    await user.save();
    
    logger.info(`Avatar reset for user: ${user.email}`);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        avatar: user.avatar,
        avatarUrl: user.avatarUrl
      },
      message: 'Avatar reset successfully'
    });
  } catch (error) {
    logger.error(`Delete avatar error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   POST /api/avatar/validate/:userId
 * @desc    Validate avatar for a specific user
 * @access  Private (Admin)
 */
router.post('/validate/:userId', protect, authorize(USER_ROLES.ADMIN), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
        error: 'User not found'
      });
    }
    
    const isValid = await validateAvatar(user.avatar);
    
    if (!isValid) {
      // Regenerate invalid avatar
      const newAvatar = await generateAvatar(
        user._id,
        user.firstName,
        user.lastName,
        user.email
      );
      
      user.avatar = newAvatar;
      await user.save();
      
      logger.info(`Invalid avatar regenerated for user: ${user.email}`);
    }
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        isValid,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        regenerated: !isValid
      },
      message: isValid ? 'Avatar is valid' : 'Avatar was invalid and has been regenerated'
    });
  } catch (error) {
    logger.error(`Validate avatar error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   GET /api/avatar/bulk/export
 * @desc    Export avatar statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/bulk/export', protect, authorize(USER_ROLES.ADMIN), async (req, res, next) => {
  try {
    const users = await User.find({ deletedAt: null })
      .select('firstName lastName email role department avatar createdAt')
      .lean();
    
    const exportData = users.map(user => ({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      department: user.department,
      hasCustomAvatar: user.avatar && user.avatar !== 'default-avatar.png',
      avatar: user.avatar,
      createdAt: user.createdAt
    }));
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        total: exportData.length,
        users: exportData
      }
    });
  } catch (error) {
    logger.error(`Export avatar stats error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   POST /api/avatar/cleanup
 * @desc    Clean up orphaned avatar files (admin only)
 * @access  Private (Admin)
 */
router.post('/cleanup', protect, authorize(USER_ROLES.ADMIN), async (req, res, next) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const uploadsPath = path.join(__dirname, '../uploads/avatars');
    
    // Get all avatar files in directory
    let files = [];
    try {
      files = await fs.readdir(uploadsPath);
    } catch (err) {
      // Directory might not exist
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { deleted: 0 },
        message: 'No avatar directory found'
      });
    }
    
    // Filter only user avatars (not default)
    const avatarFiles = files.filter(file => 
      file !== 'default-avatar.png' && 
      file !== '.gitkeep' &&
      !file.startsWith('.')
    );
    
    // Get all avatars in use
    const users = await User.find({ 
      avatar: { $nin: ['default-avatar.png', null] },
      deletedAt: null 
    }).select('avatar');
    
    const usedAvatars = new Set(users.map(user => user.avatar));
    
    // Find orphaned files
    const orphanedFiles = avatarFiles.filter(file => !usedAvatars.has(file));
    
    // Delete orphaned files
    let deletedCount = 0;
    for (const file of orphanedFiles) {
      try {
        await fs.unlink(path.join(uploadsPath, file));
        deletedCount++;
        logger.info(`Deleted orphaned avatar: ${file}`);
      } catch (err) {
        logger.error(`Failed to delete orphaned avatar ${file}: ${err.message}`);
      }
    }
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalFiles: avatarFiles.length,
        orphanedFiles: orphanedFiles.length,
        deleted: deletedCount,
        files: orphanedFiles
      },
      message: `Cleaned up ${deletedCount} orphaned avatar files`
    });
  } catch (error) {
    logger.error(`Cleanup avatars error: ${error.message}`);
    next(error);
  }
});

module.exports = router;
