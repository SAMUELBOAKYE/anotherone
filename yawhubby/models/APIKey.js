// models/APIKey.js
const mongoose = require('mongoose');

/**
 * API Key Model for managing API access keys
 * Enterprise-grade API key management with permissions and rate limiting
 */
const apiKeySchema = new mongoose.Schema({
    // Key identification
    name: {
        type: String,
        required: [true, 'API key name is required'],
        trim: true,
        index: true
    },
    
    // The actual API key (hashed in production)
    key: {
        type: String,
        required: [true, 'API key is required'],
        unique: true,
        index: true,
        trim: true
    },
    
    // Key prefix for identification (first 8 chars)
    prefix: {
        type: String,
        trim: true,
        index: true
    },
    
    // Key type
    type: {
        type: String,
        enum: ['public', 'private', 'internal'],
        default: 'private'
    },
    
    // Permissions
    permissions: [{
        type: String,
        enum: [
            'read',           // Read data
            'write',          // Create/update data
            'delete',         // Delete data
            'admin',          // Admin operations
            'notices:read',   // Read notices
            'notices:write',  // Create/update notices
            'notices:delete', // Delete notices
            'users:read',     // Read users
            'users:write',    // Update users
            'analytics:read', // Read analytics
            'backup:create',  // Create backups
            'backup:restore', // Restore backups
            'logs:read'       // Read logs
        ],
        default: ['read']
    }],
    
    // Rate limiting
    rateLimit: {
        enabled: {
            type: Boolean,
            default: true
        },
        maxRequests: {
            type: Number,
            default: 1000,
            min: 1,
            max: 100000
        },
        windowMs: {
            type: Number,
            default: 60000, // 1 minute
            min: 1000,
            max: 3600000
        }
    },
    
    // Allowed IPs (whitelist)
    allowedIPs: [{
        type: String,
        trim: true
    }],
    
    // Allowed domains/URLs
    allowedOrigins: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    
    // Key status
    status: {
        type: String,
        enum: ['active', 'inactive', 'revoked', 'expired'],
        default: 'active',
        index: true
    },
    
    // Expiration
    expiresAt: {
        type: Date,
        index: true
    },
    
    // Last used tracking
    lastUsed: {
        timestamp: {
            type: Date
        },
        ip: {
            type: String,
            trim: true
        },
        endpoint: {
            type: String,
            trim: true
        }
    },
    
    // Usage statistics
    usage: {
        totalRequests: {
            type: Number,
            default: 0,
            min: 0
        },
        successfulRequests: {
            type: Number,
            default: 0,
            min: 0
        },
        failedRequests: {
            type: Number,
            default: 0,
            min: 0
        },
        lastResetAt: {
            type: Date,
            default: Date.now
        }
    },
    
    // Owner information
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Metadata
    metadata: {
        description: {
            type: String,
            trim: true,
            maxlength: 500
        },
        environment: {
            type: String,
            enum: ['development', 'staging', 'production', 'test'],
            default: process.env.NODE_ENV || 'development'
        },
        version: {
            type: String,
            default: '1.0.0'
        },
        tags: [{
            type: String,
            trim: true
        }]
    },
    
    // Revocation info
    revokedAt: {
        type: Date
    },
    revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    revocationReason: {
        type: String,
        trim: true
    },
    
    // Audit logs
    auditLogs: [{
        action: {
            type: String,
            enum: ['created', 'used', 'revoked', 'reactivated', 'permissions_updated', 'expired'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        ip: {
            type: String,
            trim: true
        },
        userAgent: {
            type: String,
            trim: true
        },
        details: {
            type: mongoose.Schema.Types.Mixed
        }
    }]
}, {
    timestamps: true,
    strict: true
});

// ==================== INDEXES ====================

// Compound indexes for efficient queries
apiKeySchema.index({ status: 1, expiresAt: 1 });
apiKeySchema.index({ createdBy: 1, status: 1 });
apiKeySchema.index({ 'metadata.environment': 1, status: 1 });
apiKeySchema.index({ 'usage.totalRequests': -1 });
apiKeySchema.index({ 'lastUsed.timestamp': -1 });

// TTL index for expired keys (optional cleanup)
apiKeySchema.index({ expiresAt: 1 }, { 
    expireAfterSeconds: 0,
    partialFilterExpression: { status: 'expired' }
});

// ==================== PRE-SAVE MIDDLEWARE ====================

apiKeySchema.pre('save', function(next) {
    // Generate prefix from key (first 8 characters)
    if (this.key && !this.prefix) {
        this.prefix = this.key.substring(0, 8);
    }
    
    // Check if key is expired
    if (this.expiresAt && this.expiresAt < new Date() && this.status === 'active') {
        this.status = 'expired';
        this.auditLogs.push({
            action: 'expired',
            details: { message: 'API key expired automatically' }
        });
    }
    
    next();
});

// ==================== STATIC METHODS ====================

/**
 * Find and validate API key
 * @param {string} key - The API key to validate
 * @param {string} ip - Request IP address
 * @param {string} origin - Request origin
 * @returns {Promise<Object>} Key data or null
 */
apiKeySchema.statics.validateKey = async function(key, ip = null, origin = null) {
    const apiKey = await this.findOne({ 
        key,
        status: 'active',
        expiresAt: { $gt: new Date() }
    });
    
    if (!apiKey) return null;
    
    // Check IP whitelist if configured
    if (apiKey.allowedIPs && apiKey.allowedIPs.length > 0 && ip) {
        if (!apiKey.allowedIPs.includes(ip)) {
            await apiKey.recordFailedAttempt(ip, 'IP not whitelisted');
            return null;
        }
    }
    
    // Check origin whitelist if configured
    if (apiKey.allowedOrigins && apiKey.allowedOrigins.length > 0 && origin) {
        const isAllowed = apiKey.allowedOrigins.some(allowed => 
            origin.includes(allowed) || allowed === '*'
        );
        if (!isAllowed) {
            await apiKey.recordFailedAttempt(ip, 'Origin not whitelisted');
            return null;
        }
    }
    
    // Check rate limit
    if (apiKey.rateLimit.enabled) {
        const isRateLimited = await apiKey.checkRateLimit();
        if (isRateLimited) {
            await apiKey.recordFailedAttempt(ip, 'Rate limit exceeded');
            return null;
        }
    }
    
    return apiKey;
};

/**
 * Create a new API key
 * @param {Object} data - Key data
 * @returns {Promise<Object>} Created API key
 */
apiKeySchema.statics.createKey = async function(data) {
    const apiKey = new this(data);
    
    apiKey.auditLogs.push({
        action: 'created',
        ip: data.ip,
        userAgent: data.userAgent,
        details: { createdBy: data.createdBy }
    });
    
    await apiKey.save();
    return apiKey;
};

/**
 * Get keys by user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} User's API keys
 */
apiKeySchema.statics.getUserKeys = async function(userId, options = {}) {
    const { status = null, limit = 50, skip = 0 } = options;
    
    const query = { createdBy: userId };
    if (status) query.status = status;
    
    return await this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
};

/**
 * Get key statistics
 * @returns {Promise<Object>} Statistics
 */
apiKeySchema.statics.getStatistics = async function() {
    const [total, active, expired, revoked, topKeys] = await Promise.all([
        this.countDocuments(),
        this.countDocuments({ status: 'active', expiresAt: { $gt: new Date() } }),
        this.countDocuments({ status: 'expired' }),
        this.countDocuments({ status: 'revoked' }),
        this.find({ status: 'active' })
            .sort({ 'usage.totalRequests': -1 })
            .limit(10)
            .select('name prefix usage.totalRequests')
            .lean()
    ]);
    
    return {
        total,
        active,
        expired,
        revoked,
        topKeys,
        usageRate: active > 0 ? (active / total) * 100 : 0
    };
};

/**
 * Clean up expired keys
 * @returns {Promise<Object>} Cleanup result
 */
apiKeySchema.statics.cleanupExpired = async function() {
    const result = await this.updateMany(
        { 
            expiresAt: { $lt: new Date() },
            status: 'active'
        },
        { 
            status: 'expired',
            $push: {
                auditLogs: {
                    action: 'expired',
                    details: { message: 'Auto-expired by cleanup job' }
                }
            }
        }
    );
    
    return {
        updatedCount: result.modifiedCount,
        timestamp: new Date()
    };
};

// ==================== INSTANCE METHODS ====================

/**
 * Record a successful API request
 * @param {string} ip - Request IP
 * @param {string} endpoint - API endpoint
 * @returns {Promise<void>}
 */
apiKeySchema.methods.recordSuccessfulRequest = async function(ip, endpoint) {
    this.usage.totalRequests += 1;
    this.usage.successfulRequests += 1;
    this.lastUsed = {
        timestamp: new Date(),
        ip,
        endpoint
    };
    
    // Reset usage counters if window has passed
    const now = Date.now();
    const lastReset = this.usage.lastResetAt?.getTime() || 0;
    if (now - lastReset > this.rateLimit.windowMs) {
        this.usage.totalRequests = 1;
        this.usage.successfulRequests = 1;
        this.usage.failedRequests = 0;
        this.usage.lastResetAt = new Date();
    }
    
    this.auditLogs.push({
        action: 'used',
        timestamp: new Date(),
        ip,
        details: { endpoint, success: true }
    });
    
    // Limit audit log size
    if (this.auditLogs.length > 1000) {
        this.auditLogs = this.auditLogs.slice(-500);
    }
    
    await this.save();
};

/**
 * Record a failed API request
 * @param {string} ip - Request IP
 * @param {string} reason - Failure reason
 * @returns {Promise<void>}
 */
apiKeySchema.methods.recordFailedAttempt = async function(ip, reason) {
    this.usage.totalRequests += 1;
    this.usage.failedRequests += 1;
    this.lastUsed = {
        timestamp: new Date(),
        ip
    };
    
    this.auditLogs.push({
        action: 'used',
        timestamp: new Date(),
        ip,
        details: { success: false, reason }
    });
    
    // Limit audit log size
    if (this.auditLogs.length > 1000) {
        this.auditLogs = this.auditLogs.slice(-500);
    }
    
    await this.save();
};

/**
 * Check if key has exceeded rate limit
 * @returns {Promise<boolean>} True if rate limited
 */
apiKeySchema.methods.checkRateLimit = async function() {
    if (!this.rateLimit.enabled) return false;
    
    const now = Date.now();
    const lastReset = this.usage.lastResetAt?.getTime() || 0;
    
    // Reset counter if window has passed
    if (now - lastReset > this.rateLimit.windowMs) {
        this.usage.totalRequests = 0;
        this.usage.successfulRequests = 0;
        this.usage.failedRequests = 0;
        this.usage.lastResetAt = new Date();
        await this.save();
        return false;
    }
    
    return this.usage.totalRequests >= this.rateLimit.maxRequests;
};

/**
 * Check if key has specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean} True if has permission
 */
apiKeySchema.methods.hasPermission = function(permission) {
    if (this.permissions.includes('admin')) return true;
    return this.permissions.includes(permission);
};

/**
 * Revoke API key
 * @param {string} userId - User ID revoking the key
 * @param {string} reason - Revocation reason
 * @returns {Promise<void>}
 */
apiKeySchema.methods.revoke = async function(userId, reason) {
    this.status = 'revoked';
    this.revokedAt = new Date();
    this.revokedBy = userId;
    this.revocationReason = reason;
    
    this.auditLogs.push({
        action: 'revoked',
        timestamp: new Date(),
        details: { revokedBy: userId, reason }
    });
    
    await this.save();
};

/**
 * Reactivate a revoked or expired key
 * @param {string} userId - User ID reactivating the key
 * @param {Object} options - Reactivation options
 * @returns {Promise<void>}
 */
apiKeySchema.methods.reactivate = async function(userId, options = {}) {
    this.status = 'active';
    if (options.newExpiry) {
        this.expiresAt = options.newExpiry;
    }
    if (options.newPermissions) {
        this.permissions = options.newPermissions;
    }
    
    this.auditLogs.push({
        action: 'reactivated',
        timestamp: new Date(),
        details: { reactivatedBy: userId, ...options }
    });
    
    await this.save();
};

/**
 * Update key permissions
 * @param {Array} permissions - New permissions
 * @param {string} userId - User ID making the change
 * @returns {Promise<void>}
 */
apiKeySchema.methods.updatePermissions = async function(permissions, userId) {
    const oldPermissions = [...this.permissions];
    this.permissions = permissions;
    
    this.auditLogs.push({
        action: 'permissions_updated',
        timestamp: new Date(),
        details: { 
            updatedBy: userId,
            oldPermissions,
            newPermissions: permissions
        }
    });
    
    await this.save();
};

/**
 * Check if key is expired
 * @returns {boolean}
 */
apiKeySchema.methods.isExpired = function() {
    return this.expiresAt && this.expiresAt < new Date();
};

/**
 * Get remaining rate limit
 * @returns {Object} Rate limit info
 */
apiKeySchema.methods.getRemainingRateLimit = function() {
    if (!this.rateLimit.enabled) {
        return { remaining: Infinity, limit: Infinity };
    }
    
    const remaining = Math.max(0, this.rateLimit.maxRequests - this.usage.totalRequests);
    return {
        remaining,
        limit: this.rateLimit.maxRequests,
        resetAt: new Date(this.usage.lastResetAt.getTime() + this.rateLimit.windowMs)
    };
};

/**
 * Get key age in days
 * @returns {number}
 */
apiKeySchema.methods.getAgeInDays = function() {
    const age = Date.now() - this.createdAt.getTime();
    return Math.floor(age / (1000 * 60 * 60 * 24));
};

// ==================== VIRTUAL PROPERTIES ====================

apiKeySchema.virtual('isActive').get(function() {
    return this.status === 'active' && !this.isExpired();
});

apiKeySchema.virtual('maskedKey').get(function() {
    if (!this.key) return null;
    const prefix = this.key.substring(0, 8);
    const suffix = this.key.substring(this.key.length - 4);
    return `${prefix}...${suffix}`;
});

apiKeySchema.virtual('successRate').get(function() {
    if (this.usage.totalRequests === 0) return 100;
    return (this.usage.successfulRequests / this.usage.totalRequests) * 100;
});

apiKeySchema.virtual('daysUntilExpiry').get(function() {
    if (!this.expiresAt) return null;
    const days = (this.expiresAt - Date.now()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.floor(days));
});

// Include virtuals in JSON output
apiKeySchema.set('toJSON', { virtuals: true });
apiKeySchema.set('toObject', { virtuals: true });

// ==================== EXPORT ====================

module.exports = mongoose.model('APIKey', apiKeySchema);