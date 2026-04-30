// models/Notification.js
// Enterprise-Grade Notification Model for KAAF University Noticeboard System
// Manages multi-channel notifications, scheduling, delivery tracking, and analytics

const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Notification Schema for KAAF University Noticeboard System
 * Manages user notifications, reminders, and alerts with multi-channel support
 * @version 2.1.0
 * @author Boakye Samuel Yiadom
 */
const notificationSchema = new mongoose.Schema({
    // ============================================================
    // CORE REFERENCES
    // ============================================================
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        index: true
    },
    
    // ============================================================
    // NOTIFICATION TYPE & CONTENT
    // ============================================================
    type: {
        type: String,
        enum: Object.values(NOTIFICATION_TYPES),
        required: [true, 'Notification type is required'],
        index: true
    },
    
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
        maxlength: 200,
        index: true
    },
    
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        trim: true,
        maxlength: 2000
    },
    
    shortMessage: {
        type: String,
        trim: true,
        maxlength: 100,
        description: 'Short version for SMS/push notifications'
    },
    
    // ============================================================
    // RELATED RESOURCE
    // ============================================================
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'referenceModel',
        index: true
    },
    referenceModel: {
        type: String,
        enum: ['Notice', 'Event', 'EventRegistration', 'User', 'Comment', 'Feedback', 'Certificate']
    },
    
    // ============================================================
    // STATUS TRACKING
    // ============================================================
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date,
        default: null
    },
    
    isArchived: {
        type: Boolean,
        default: false,
        index: true
    },
    archivedAt: {
        type: Date,
        default: null
    },
    
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    
    // ============================================================
    // PRIORITY & URGENCY
    // ============================================================
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
        index: true
    },
    
    urgencyScore: {
        type: Number,
        min: 1,
        max: 10,
        default: 5,
        description: 'Urgency level for prioritization'
    },
    
    // ============================================================
    // DELIVERY CHANNELS
    // ============================================================
    deliveryChannels: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        push: { type: Boolean, default: false },
        sms: { type: Boolean, default: false }
    },
    
    // ============================================================
    // DELIVERY STATUS
    // ============================================================
    deliveryStatus: {
        inApp: {
            delivered: { type: Boolean, default: false },
            deliveredAt: { type: Date, default: null },
            error: { type: String, default: null }
        },
        email: {
            delivered: { type: Boolean, default: false },
            deliveredAt: { type: Date, default: null },
            error: { type: String, default: null },
            messageId: { type: String, default: null }
        },
        push: {
            delivered: { type: Boolean, default: false },
            deliveredAt: { type: Date, default: null },
            error: { type: String, default: null }
        },
        sms: {
            delivered: { type: Boolean, default: false },
            deliveredAt: { type: Date, default: null },
            error: { type: String, default: null },
            messageId: { type: String, default: null }
        }
    },
    
    deliveryAttempts: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    
    // ============================================================
    // SCHEDULING
    // ============================================================
    scheduledFor: {
        type: Date,
        default: null,
        index: true
    },
    
    expiresAt: {
        type: Date,
        default: null,
        index: true
    },
    
    isExpired: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // ============================================================
    // ACTIONS & INTERACTIONS
    // ============================================================
    action: {
        type: {
            type: String,
            enum: ['link', 'modal', 'toast', 'none', 'custom'],
            default: 'none'
        },
        url: { type: String, trim: true, default: null },
        label: { type: String, default: 'View' },
        data: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    
    // User interaction tracking
    interactions: [{
        type: {
            type: String,
            enum: ['click', 'dismiss', 'snooze', 'archive'],
            required: true
        },
        timestamp: { type: Date, default: Date.now },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
    }],
    
    // ============================================================
    // METADATA & ANALYTICS
    // ============================================================
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    analytics: {
        timeToRead: { type: Number, default: null, description: 'Time from delivery to read (ms)' },
        userAgent: { type: String, default: null },
        ipAddress: { type: String, default: null },
        deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop', 'unknown'], default: 'unknown' }
    },
    
    // ============================================================
    // AUDIT TRAIL
    // ============================================================
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    version: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true }
});

// ============================================================
// INDEXES
// ============================================================

// Compound indexes for common queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, priority: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isArchived: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isDeleted: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, isExpired: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ 'deliveryStatus.email.delivered': 1 });
notificationSchema.index({ 'deliveryStatus.sms.delivered': 1 });

// TTL index for auto-deletion
notificationSchema.index({ createdAt: 1 }, { 
    expireAfterSeconds: 7776000, // 90 days
    partialFilterExpression: { isDeleted: true }
});

// ============================================================
// MIDDLEWARE
// ============================================================

/**
 * Pre-save middleware: Auto-expire and generate short message
 */
notificationSchema.pre('save', function(next) {
    // Auto-expire check
    if (this.expiresAt && this.expiresAt < new Date()) {
        this.isExpired = true;
    }
    
    // Generate short message if not provided
    if (!this.shortMessage && this.message) {
        this.shortMessage = this.message.length > 100 
            ? this.message.substring(0, 97) + '...' 
            : this.message;
    }
    
    // Increment version on update
    if (!this.isNew) {
        this.version += 1;
    }
    
    next();
});

/**
 * Pre-find middleware: Exclude soft-deleted notifications
 */
const excludeDeleted = function() {
    this.where({ isDeleted: false });
};

notificationSchema.pre('find', excludeDeleted);
notificationSchema.pre('findOne', excludeDeleted);
notificationSchema.pre('findOneAndUpdate', excludeDeleted);
notificationSchema.pre('countDocuments', excludeDeleted);
notificationSchema.pre('aggregate', function() {
    // Only add match if not already present
    const pipeline = this.pipeline();
    const hasMatch = pipeline.some(stage => stage.$match);
    if (!hasMatch) {
        this.pipeline().unshift({ $match: { isDeleted: false } });
    }
});

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Mark notification as read
 * @param {Object} options - Read options
 */
notificationSchema.methods.markAsRead = async function(options = {}) {
    if (this.isRead) return this;
    
    this.isRead = true;
    this.readAt = new Date();
    
    // Calculate time to read
    if (this.deliveryStatus.inApp.deliveredAt) {
        this.analytics.timeToRead = this.readAt - this.deliveryStatus.inApp.deliveredAt;
    }
    
    // Track interaction
    this.interactions.push({
        type: 'click',
        timestamp: new Date(),
        metadata: options.metadata || {}
    });
    
    await this.save();
    logger.debug(`Notification ${this._id} marked as read by user ${this.user}`);
    return this;
};

/**
 * Mark notification as delivered via specific channel
 * @param {string} channel - Delivery channel (inApp, email, push, sms)
 * @param {Object} result - Delivery result
 */
notificationSchema.methods.markAsDelivered = async function(channel, result = {}) {
    const channelConfig = this.deliveryStatus[channel];
    if (!channelConfig) {
        throw new Error(`Invalid channel: ${channel}`);
    }
    
    channelConfig.delivered = true;
    channelConfig.deliveredAt = new Date();
    if (result.messageId) channelConfig.messageId = result.messageId;
    
    this.deliveryAttempts = 0;
    await this.save();
    
    logger.debug(`Notification ${this._id} delivered via ${channel}`);
    return this;
};

/**
 * Mark delivery as failed
 * @param {string} channel - Delivery channel
 * @param {Error} error - Error object
 */
notificationSchema.methods.markDeliveryFailed = async function(channel, error) {
    const channelConfig = this.deliveryStatus[channel];
    if (!channelConfig) {
        throw new Error(`Invalid channel: ${channel}`);
    }
    
    channelConfig.error = error.message || error;
    this.deliveryAttempts += 1;
    await this.save();
    
    logger.warn(`Notification ${this._id} delivery failed via ${channel}: ${error.message}`);
    return this;
};

/**
 * Archive notification
 */
notificationSchema.methods.archive = async function() {
    this.isArchived = true;
    this.archivedAt = new Date();
    await this.save();
    return this;
};

/**
 * Soft delete notification
 * @param {ObjectId} deletedBy - User who deleted
 */
notificationSchema.methods.softDelete = async function(deletedBy = null) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.updatedBy = deletedBy;
    await this.save();
    
    logger.debug(`Notification ${this._id} soft deleted`);
    return this;
};

/**
 * Restore soft-deleted notification
 */
notificationSchema.methods.restore = async function() {
    this.isDeleted = false;
    this.deletedAt = null;
    await this.save();
    
    logger.debug(`Notification ${this._id} restored`);
    return this;
};

/**
 * Snooze notification
 * @param {Date} until - Snooze until date
 */
notificationSchema.methods.snooze = async function(until) {
    this.scheduledFor = until;
    this.interactions.push({
        type: 'snooze',
        timestamp: new Date(),
        metadata: { until }
    });
    await this.save();
    
    logger.debug(`Notification ${this._id} snoozed until ${until}`);
    return this;
};

/**
 * Track user interaction
 * @param {string} type - Interaction type
 * @param {Object} metadata - Interaction metadata
 */
notificationSchema.methods.trackInteraction = async function(type, metadata = {}) {
    this.interactions.push({
        type,
        timestamp: new Date(),
        metadata
    });
    await this.save();
    return this;
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Create notification for single user
 * @param {Object} data - Notification data
 */
notificationSchema.statics.createNotification = async function(data) {
    const notification = await this.create({
        user: data.user,
        type: data.type,
        title: data.title,
        message: data.message,
        shortMessage: data.shortMessage,
        referenceId: data.referenceId,
        referenceModel: data.referenceModel,
        priority: data.priority || 'normal',
        urgencyScore: data.urgencyScore || (data.priority === 'urgent' ? 9 : data.priority === 'high' ? 7 : 5),
        deliveryChannels: data.deliveryChannels || { inApp: true },
        action: data.action || { type: 'none' },
        scheduledFor: data.scheduledFor || null,
        expiresAt: data.expiresAt || null,
        metadata: data.metadata || {},
        createdBy: data.createdBy,
        analytics: {
            ipAddress: data.ipAddress,
            userAgent: data.userAgent
        }
    });
    
    logger.info(`Notification created for user ${data.user}: ${data.title}`);
    return notification;
};

/**
 * Create bulk notifications for multiple users
 * @param {Array} notificationsData - Array of notification data objects
 */
notificationSchema.statics.createBulkNotifications = async function(notificationsData) {
    const results = {
        successful: 0,
        failed: 0,
        errors: []
    };
    
    for (const data of notificationsData) {
        try {
            await this.createNotification(data);
            results.successful++;
        } catch (error) {
            results.failed++;
            results.errors.push({ data: data.user, error: error.message });
        }
    }
    
    logger.info(`Bulk notifications created: ${results.successful} successful, ${results.failed} failed`);
    return results;
};

/**
 * Mark notifications as read for user
 * @param {ObjectId} userId - User ID
 * @param {ObjectId} notificationId - Specific notification ID (optional)
 */
notificationSchema.statics.markAsRead = async function(userId, notificationId = null) {
    const query = { user: userId, isRead: false, isDeleted: false };
    if (notificationId) {
        query._id = notificationId;
    }
    
    const update = {
        isRead: true,
        readAt: new Date()
    };
    
    const result = await this.updateMany(query, update);
    logger.info(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);
    return result;
};

/**
 * Mark all notifications as read for user
 * @param {ObjectId} userId - User ID
 */
notificationSchema.statics.markAllAsRead = async function(userId) {
    const result = await this.updateMany(
        { user: userId, isRead: false, isDeleted: false },
        { isRead: true, readAt: new Date() }
    );
    logger.info(`Marked all notifications as read for user ${userId}`);
    return result;
};

/**
 * Get unread count for user
 * @param {ObjectId} userId - User ID
 */
notificationSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({ 
        user: userId, 
        isRead: false, 
        isDeleted: false,
        $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: { $exists: false } }
        ]
    });
};

/**
 * Get user notifications with pagination and filtering
 * @param {ObjectId} userId - User ID
 * @param {Object} options - Query options
 */
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 20;
    const skip = (page - 1) * limit;
    
    const query = { 
        user: userId, 
        isDeleted: false,
        $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: { $exists: false } }
        ]
    };
    
    // Filter by read status
    if (options.unreadOnly === true) {
        query.isRead = false;
    } else if (options.isRead !== undefined) {
        query.isRead = options.isRead;
    }
    
    // Filter by type
    if (options.type) {
        query.type = options.type;
    }
    
    // Filter by priority
    if (options.priority) {
        query.priority = options.priority;
    }
    
    // Date range filters
    if (options.startDate) {
        query.createdAt = { $gte: new Date(options.startDate) };
    }
    if (options.endDate) {
        query.createdAt = { ...query.createdAt, $lte: new Date(options.endDate) };
    }
    
    // Sort options
    let sort = { priority: -1, createdAt: -1 };
    if (options.sort === 'oldest') {
        sort = { createdAt: 1 };
    } else if (options.sort === 'priority') {
        sort = { priority: -1, createdAt: -1 };
    }
    
    const [notifications, total, unreadCount] = await Promise.all([
        this.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query),
        this.getUnreadCount(userId)
    ]);
    
    return {
        notifications,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        },
        unreadCount,
        stats: {
            total,
            unread: unreadCount,
            read: total - unreadCount
        }
    };
};

/**
 * Get notification statistics for user
 * @param {ObjectId} userId - User ID
 * @param {Object} options - Options
 */
notificationSchema.statics.getNotificationStats = async function(userId, options = {}) {
    const match = { user: userId, isDeleted: false };
    
    if (options.startDate) {
        match.createdAt = { $gte: new Date(options.startDate) };
    }
    if (options.endDate) {
        match.createdAt = { ...match.createdAt, $lte: new Date(options.endDate) };
    }
    
    const stats = await this.aggregate([
        { $match: match },
        {
            $facet: {
                overview: [
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            read: { $sum: { $cond: ['$isRead', 1, 0] } },
                            unread: { $sum: { $cond: ['$isRead', 0, 1] } },
                            archived: { $sum: { $cond: ['$isArchived', 1, 0] } }
                        }
                    }
                ],
                byType: [
                    { $group: { _id: '$type', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                byPriority: [
                    { $group: { _id: '$priority', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                byDay: [
                    {
                        $group: {
                            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } },
                    { $limit: 30 }
                ],
                averageReadTime: [
                    { $match: { 'analytics.timeToRead': { $exists: true } } },
                    { $group: { _id: null, avg: { $avg: '$analytics.timeToRead' } } }
                ]
            }
        }
    ]);
    
    return {
        overview: stats[0]?.overview[0] || { total: 0, read: 0, unread: 0, archived: 0 },
        byType: stats[0]?.byType || [],
        byPriority: stats[0]?.byPriority || [],
        byDay: stats[0]?.byDay || [],
        averageReadTime: stats[0]?.averageReadTime[0]?.avg || 0
    };
};

/**
 * Process scheduled notifications
 */
notificationSchema.statics.processScheduledNotifications = async function() {
    const now = new Date();
    
    const scheduledNotifications = await this.find({
        scheduledFor: { $lte: now },
        isExpired: false,
        isDeleted: false,
        $or: [
            { expiresAt: { $gt: now } },
            { expiresAt: { $exists: false } }
        ]
    });
    
    let processed = 0;
    for (const notification of scheduledNotifications) {
        try {
            // Clear scheduling
            notification.scheduledFor = null;
            await notification.save();
            processed++;
            
            // Trigger delivery queue here
            logger.debug(`Processed scheduled notification ${notification._id}`);
        } catch (error) {
            logger.error(`Failed to process scheduled notification ${notification._id}: ${error.message}`);
        }
    }
    
    if (processed > 0) {
        logger.info(`Processed ${processed} scheduled notifications`);
    }
    
    return processed;
};

/**
 * Expire old notifications
 */
notificationSchema.statics.expireNotifications = async function() {
    const now = new Date();
    
    const result = await this.updateMany(
        {
            expiresAt: { $lt: now },
            isExpired: false,
            isDeleted: false
        },
        { 
            isExpired: true,
            updatedAt: now
        }
    );
    
    if (result.modifiedCount > 0) {
        logger.info(`Expired ${result.modifiedCount} notifications`);
    }
    
    return result;
};

/**
 * Clean up old read notifications
 * @param {number} daysOld - Days to retain
 */
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await this.updateMany(
        {
            isRead: true,
            isArchived: true,
            createdAt: { $lt: cutoffDate },
            isDeleted: false
        },
        { isDeleted: true, deletedAt: new Date() }
    );
    
    logger.info(`Cleaned up ${result.modifiedCount} old notifications`);
    return result;
};

/**
 * Get delivery statistics
 * @param {Object} options - Options
 */
notificationSchema.statics.getDeliveryStats = async function(options = {}) {
    const match = {};
    if (options.startDate) {
        match.createdAt = { $gte: new Date(options.startDate) };
    }
    if (options.endDate) {
        match.createdAt = { ...match.createdAt, $lte: new Date(options.endDate) };
    }
    
    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                emailDelivered: { $sum: { $cond: ['$deliveryStatus.email.delivered', 1, 0] } },
                pushDelivered: { $sum: { $cond: ['$deliveryStatus.push.delivered', 1, 0] } },
                smsDelivered: { $sum: { $cond: ['$deliveryStatus.sms.delivered', 1, 0] } },
                emailFailed: { $sum: { $cond: ['$deliveryStatus.email.error', 1, 0] } },
                pushFailed: { $sum: { $cond: ['$deliveryStatus.push.error', 1, 0] } },
                smsFailed: { $sum: { $cond: ['$deliveryStatus.sms.error', 1, 0] } }
            }
        }
    ]);
    
    const result = stats[0] || {};
    return {
        total: result.total || 0,
        channels: {
            email: { delivered: result.emailDelivered || 0, failed: result.emailFailed || 0 },
            push: { delivered: result.pushDelivered || 0, failed: result.pushFailed || 0 },
            sms: { delivered: result.smsDelivered || 0, failed: result.smsFailed || 0 }
        }
    };
};

// ============================================================
// VIRTUALS
// ============================================================

/**
 * Virtual for age (time since created)
 */
notificationSchema.virtual('age').get(function() {
    const minutes = (Date.now() - this.createdAt) / (1000 * 60);
    if (minutes < 60) return `${Math.floor(minutes)} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)} hour${hours !== 1 ? 's' : ''} ago`;
    const days = hours / 24;
    return `${Math.floor(days)} day${days !== 1 ? 's' : ''} ago`;
});

/**
 * Virtual for is actionable
 */
notificationSchema.virtual('isActionable').get(function() {
    return this.action && this.action.type !== 'none' && this.action.url;
});

/**
 * Virtual for delivery success rate
 */
notificationSchema.virtual('deliverySuccessRate').get(function() {
    const channels = ['email', 'push', 'sms'];
    const delivered = channels.filter(c => this.deliveryStatus[c].delivered).length;
    const attempted = channels.filter(c => this.deliveryChannels[c]).length;
    return attempted > 0 ? (delivered / attempted) * 100 : 0;
});

// ============================================================
// EXPORT
// ============================================================

module.exports = mongoose.model('Notification', notificationSchema);