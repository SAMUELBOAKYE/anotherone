const User = require('../models/User');
const { deleteAvatar, getAvatarUrl, generateAvatar, updateUserAvatar } = require('../utils/avatarGenerator');
const { HTTP_STATUS, MESSAGES, USER_ROLES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * @desc    Get user profile with avatar URL
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -confirmPassword -passwordResetToken -passwordResetExpires -passwordResetAttempts -passwordResetLockUntil')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    // Add full avatar URL
    const userData = user.toObject();
    userData.avatarUrl = getAvatarUrl(req, userData.avatar);
    userData.profileCompleteness = user.profileCompleteness;

    logger.info(`Profile fetched for user: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: userData
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, department, bio, preferences } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    // Track changes
    let nameChanged = false;
    let avatarRegenerated = false;

    // Update fields
    if (firstName && firstName !== user.firstName) {
      user.firstName = firstName;
      nameChanged = true;
    }
    
    if (lastName && lastName !== user.lastName) {
      user.lastName = lastName;
      nameChanged = true;
    }
    
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    
    // Department update (only for non-students or if user has permission)
    if (department && req.user.role !== USER_ROLES.STUDENT) {
      user.department = department;
    }

    await user.save();

    // If name changed, regenerate avatar
    if (nameChanged) {
      try {
        const newAvatar = await updateUserAvatar(user, user.firstName, user.lastName);
        avatarRegenerated = true;
        logger.info(`Avatar regenerated for user: ${user.email}`);
      } catch (avatarError) {
        logger.error(`Failed to regenerate avatar for user ${user.email}: ${avatarError.message}`);
      }
    }

    // Prepare response data
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department,
      studentId: user.studentId,
      phone: user.phone,
      bio: user.bio,
      avatar: user.avatar,
      avatarUrl: getAvatarUrl(req, user.avatar),
      preferences: user.preferences,
      profileCompleteness: user.profileCompleteness
    };

    logger.info(`Profile updated for user: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: avatarRegenerated ? 'Profile updated and avatar regenerated' : MESSAGES.SUCCESS.UPDATED,
      data: userResponse
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get user avatar (public endpoint)
 * @route   GET /api/users/:id/avatar
 * @access  Public
 */
exports.getUserAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('avatar firstName lastName');
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }
    
    const avatarUrl = getAvatarUrl(req, user.avatar);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        userId: user._id,
        avatar: user.avatar,
        avatarUrl,
        initials: user.firstName && user.lastName ? 
          `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : 
          user.firstName?.charAt(0)?.toUpperCase() || 'U'
      }
    });
  } catch (error) {
    logger.error(`Get user avatar error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Regenerate avatar for current user
 * @route   POST /api/users/regenerate-avatar
 * @access  Private
 */
exports.regenerateAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    // Delete old avatar
    if (user.avatar && user.avatar !== 'default-avatar.png') {
      deleteAvatar(user.avatar);
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

    logger.info(`Avatar regenerated for user: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        avatar: user.avatar,
        avatarUrl: getAvatarUrl(req, user.avatar)
      },
      message: 'Avatar regenerated successfully'
    });
  } catch (error) {
    logger.error(`Regenerate avatar error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get user by ID (admin only)
 * @route   GET /api/users/:id
 * @access  Private (Admin)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -confirmPassword -passwordResetToken -passwordResetExpires -passwordResetAttempts -passwordResetLockUntil')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    const userData = user.toObject();
    userData.avatarUrl = getAvatarUrl(req, userData.avatar);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: userData
    });
  } catch (error) {
    logger.error(`Get user by ID error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get all users with pagination (admin only)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = { deletedAt: null };

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by department
    if (req.query.department) {
      query.department = req.query.department;
    }

    // Search
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { studentId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Sorting
    let sort = { createdAt: -1 };
    if (req.query.sort === 'name') {
      sort = { firstName: 1, lastName: 1 };
    } else if (req.query.sort === 'oldest') {
      sort = { createdAt: 1 };
    }

    const users = await User.find(query)
      .select('-password -confirmPassword -passwordResetToken -passwordResetExpires -passwordResetAttempts -passwordResetLockUntil')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Add avatar URLs
    const usersWithUrls = users.map(user => ({
      ...user,
      avatarUrl: getAvatarUrl(req, user.avatar)
    }));

    const total = await User.countDocuments(query);

    logger.info(`Admin ${req.user.email} fetched ${users.length} users`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: usersWithUrls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error(`Get all users error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete user (soft delete) - admin only
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await user.softDelete();

    // Delete avatar if not default
    if (user.avatar && user.avatar !== 'default-avatar.png') {
      deleteAvatar(user.avatar);
    }

    logger.info(`User deleted by admin ${req.user.email}: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.DELETED
    });
  } catch (error) {
    logger.error(`Delete user error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Activate/Deactivate user - admin only
 * @route   PUT /api/users/:id/toggle-status
 * @access  Private (Admin)
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id && !isActive) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    user.isActive = isActive;
    user.status = isActive ? 'active' : 'inactive';
    user.updatedBy = req.user.id;
    await user.save();

    logger.info(`User ${isActive ? 'activated' : 'deactivated'} by admin ${req.user.email}: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    logger.error(`Toggle user status error: ${error.message}`);
    next(error);
  }
};