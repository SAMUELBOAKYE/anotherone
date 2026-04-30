const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { HTTP_STATUS, MESSAGES, USER_ROLES, VALIDATION } = require('../config/constants');
const logger = require('../utils/logger');

// ============================
// VALIDATION RULES
// ============================

/**
 * Update user validation rules
 */
const updateUserValidation = [
  param('id')
    .isMongoId().withMessage('Invalid user ID'),
  
  body('firstName')
    .optional()
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`First name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`)
    .matches(VALIDATION.NAME_PATTERN)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  
  body('lastName')
    .optional()
    .isLength({ min: VALIDATION.NAME_MIN_LENGTH, max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Last name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`)
    .matches(VALIDATION.NAME_PATTERN)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  
  body('email')
    .optional()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: VALIDATION.EMAIL_MAX_LENGTH })
    .withMessage(`Email cannot exceed ${VALIDATION.EMAIL_MAX_LENGTH} characters`),
  
  body('phone')
    .optional()
    .matches(VALIDATION.PHONE_PATTERN)
    .withMessage('Please provide a valid phone number')
    .trim(),
  
  body('role')
    .optional()
    .isIn(Object.values(USER_ROLES))
    .withMessage('Invalid role'),
  
  body('department')
    .optional()
    .trim(),
  
  body('studentId')
    .optional()
    .matches(VALIDATION.STUDENT_ID_PATTERN)
    .withMessage('Student ID must be 5-20 characters and contain only uppercase letters, numbers, and hyphens')
    .trim()
    .toUpperCase(),
  
  body('yearOfStudy')
    .optional()
    .isInt({ min: 1, max: 6 }).withMessage('Year of study must be between 1 and 6')
    .toInt(),
  
  body('semester')
    .optional()
    .isInt({ min: 1, max: 2 }).withMessage('Semester must be between 1 and 2')
    .toInt(),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Invalid status')
];

/**
 * Get users validation rules
 */
const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('role')
    .optional()
    .isIn(Object.values(USER_ROLES))
    .withMessage('Invalid role'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Invalid status'),
  
  query('department')
    .optional()
    .trim(),
  
  query('search')
    .optional()
    .trim(),
  
  query('sort')
    .optional()
    .isIn(['latest', 'oldest', 'name'])
    .withMessage('Invalid sort option')
];

/**
 * ID param validation
 */
const idParamValidation = [
  param('id')
    .isMongoId().withMessage('Invalid user ID')
];

// ============================
// ROUTES
// ============================

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -confirmPassword -passwordResetToken -passwordResetExpires -passwordResetAttempts -passwordResetLockUntil')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

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
        ...user.toObject(),
        profileCompleteness: user.profileCompleteness
      }
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', protect, async (req, res, next) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'phone', 'bio', 'preferences', 'avatar'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -confirmPassword -passwordResetToken -passwordResetExpires -passwordResetAttempts -passwordResetLockUntil');

    logger.info(`User profile updated: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: user,
      message: MESSAGES.SUCCESS.UPDATED
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   DELETE /api/users/profile
 * @desc    Delete current user account (soft delete)
 * @access  Private
 */
router.delete('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    await user.softDelete();

    logger.info(`User account deleted: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete account error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination (admin only)
 * @access  Private (Admin)
 */
router.get('/', protect, authorize('admin', 'super_admin'), getUsersValidation, async (req, res, next) => {
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

    // Filter by isActive
    if (req.query.isActive === 'true') {
      query.isActive = true;
    } else if (req.query.isActive === 'false') {
      query.isActive = false;
    }

    // Search by name or email
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { studentId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Determine sort order
    let sort = { createdAt: -1 };
    if (req.query.sort === 'oldest') {
      sort = { createdAt: 1 };
    } else if (req.query.sort === 'name') {
      sort = { firstName: 1, lastName: 1 };
    }

    const users = await User.find(query)
      .select('-password -confirmPassword -passwordResetToken -passwordResetExpires -passwordResetAttempts -passwordResetLockUntil')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    logger.info(`Admin ${req.user.email} fetched ${users.length} users`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: users,
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
    logger.error(`Get users error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID (admin only)
 * @access  Private (Admin)
 */
router.get('/:id', protect, authorize('admin', 'super_admin'), idParamValidation, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -confirmPassword -passwordResetToken -passwordResetExpires -passwordResetAttempts -passwordResetLockUntil')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
        error: 'User not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Get user error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (admin only)
 * @access  Private (Admin)
 */
router.put('/:id', protect, authorize('admin', 'super_admin'), updateUserValidation, async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
        error: 'User not found'
      });
    }

    // Allowed fields for admin update
    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'role', 'department',
      'studentId', 'yearOfStudy', 'semester', 'isActive', 'status', 'bio'
    ];

    let hasChanges = false;
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (JSON.stringify(user[field]) !== JSON.stringify(req.body[field])) {
          user[field] = req.body[field];
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      user.updatedBy = req.user.id;
      await user.save();
      
      logger.info(`User updated by admin ${req.user.email}: ${user.email}`);
    }

    const updatedUser = await User.findById(user._id)
      .select('-password -confirmPassword -passwordResetToken -passwordResetExpires -passwordResetAttempts -passwordResetLockUntil');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedUser,
      message: hasChanges ? MESSAGES.SUCCESS.UPDATED : 'No changes made'
    });
  } catch (error) {
    logger.error(`Update user error: ${error.message}`);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: MESSAGES.ERROR.DUPLICATE,
        error: 'Email already exists'
      });
    }
    
    next(error);
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete) - admin only
 * @access  Private (Admin)
 */
router.delete('/:id', protect, authorize('admin', 'super_admin'), idParamValidation, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND,
        error: 'User not found'
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

    logger.info(`User deleted by admin ${req.user.email}: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.DELETED
    });
  } catch (error) {
    logger.error(`Delete user error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   PUT /api/users/:id/activate
 * @desc    Activate user account (admin only)
 * @access  Private (Admin)
 */
router.put('/:id/activate', protect, authorize('admin', 'super_admin'), idParamValidation, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    user.isActive = true;
    user.status = 'active';
    user.updatedBy = req.user.id;
    await user.save();

    logger.info(`User activated by admin ${req.user.email}: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User activated successfully'
    });
  } catch (error) {
    logger.error(`Activate user error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   PUT /api/users/:id/deactivate
 * @desc    Deactivate user account (admin only)
 * @access  Private (Admin)
 */
router.put('/:id/deactivate', protect, authorize('admin', 'super_admin'), idParamValidation, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    user.isActive = false;
    user.status = 'inactive';
    user.updatedBy = req.user.id;
    await user.save();

    logger.info(`User deactivated by admin ${req.user.email}: ${user.email}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    logger.error(`Deactivate user error: ${error.message}`);
    next(error);
  }
});

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats', protect, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const stats = await User.getStatistics();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`Get user stats error: ${error.message}`);
    next(error);
  }
});

module.exports = router;
