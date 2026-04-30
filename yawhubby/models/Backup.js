// models/Backup.js
const mongoose = require('mongoose');

/**
 * Backup Model for tracking database backups and system backups
 * Enterprise-grade backup management with retention policies
 */
const backupSchema = new mongoose.Schema({
    // Backup identification
    name: {
        type: String,
        required: [true, 'Backup name is required'],
        unique: true,
        trim: true,
        index: true
    },
    
    // Backup type
    type: {
        type: String,
        enum: ['full', 'incremental', 'differential', 'config', 'logs', 'uploads'],
        required: true,
        default: 'full',
        index: true
    },
    
    // Backup status
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'failed', 'restoring', 'verified', 'expired'],
        default: 'pending',
        required: true,
        index: true
    },
    
    // File information
    file: {
        path: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            default: 0,
            min: 0
        },
        hash: {
            type: String,
            trim: true,
            index: true
        },
        compression: {
            type: String,
            enum: ['none', 'gzip', 'zip', '7z'],
            default: 'zip'
        }
    },
    
    // Database backup info
    database: {
        name: {
            type: String,
            trim: true
        },
        collections: [{
            type: String,
            trim: true
        }],
        documentCount: {
            type: Number,
            default: 0
        },
        sizeBefore: {
            type: Number,
            default: 0
        },
        sizeAfter: {
            type: Number,
            default: 0
        },
        compressionRatio: {
            type: Number,
            default: 0
        }
    },
    
    // Uploads backup info
    uploads: {
        totalFiles: {
            type: Number,
            default: 0
        },
        totalSize: {
            type: Number,
            default: 0
        },
        folders: [{
            type: String,
            trim: true
        }]
    },
    
    // Configuration backup
    config: {
        files: [{
            type: String,
            trim: true
        }],
        environment: {
            type: String,
            enum: ['development', 'staging', 'production', 'test'],
            default: process.env.NODE_ENV || 'development'
        }
    },
    
    // Backup metadata
    metadata: {
        version: {
            type: String,
            default: '1.0.0'
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500
        },
        tags: [{
            type: String,
            trim: true
        }],
        createdBy: {
            type: String,
            trim: true
        },
        createdByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    
    // Schedule information
    schedule: {
        scheduled: {
            type: Boolean,
            default: false
        },
        cronExpression: {
            type: String,
            trim: true
        },
        lastRun: {
            type: Date
        },
        nextRun: {
            type: Date
        }
    },
    
    // Execution details
    execution: {
        startedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: {
            type: Date
        },
        duration: {
            type: Number,
            default: 0,
            min: 0
        },
        retryCount: {
            type: Number,
            default: 0,
            min: 0
        },
        maxRetries: {
            type: Number,
            default: 3
        }
    },
    
    // Error information
    error: {
        message: {
            type: String,
            trim: true
        },
        code: {
            type: String,
            trim: true
        },
        stack: {
            type: String,
            trim: true
        },
        timestamp: {
            type: Date
        }
    },
    
    // Verification
    verification: {
        verified: {
            type: Boolean,
            default: false
        },
        verifiedAt: {
            type: Date
        },
        verifiedBy: {
            type: String,
            trim: true
        },
        hashMatch: {
            type: Boolean,
            default: false
        },
        integrityCheck: {
            type: Boolean,
            default: false
        }
    },
    
    // Restoration info
    restoration: {
        restored: {
            type: Boolean,
            default: false
        },
        restoredAt: {
            type: Date
        },
        restoredBy: {
            type: String,
            trim: true
        },
        restoredTo: {
            type: String,
            trim: true
        }
    },
    
    // Retention policy
    retention: {
        daysToKeep: {
            type: Number,
            default: 30,
            min: 1,
            max: 365
        },
        expiresAt: {
            type: Date,
            index: true
        },
        autoDelete: {
            type: Boolean,
            default: true
        }
    },
    
    // Storage location
    storage: {
        type: {
            type: String,
            enum: ['local', 's3', 'azure', 'gcs', 'network'],
            default: 'local'
        },
        location: {
            type: String,
            trim: true
        },
        bucket: {
            type: String,
            trim: true
        },
        region: {
            type: String,
            trim: true
        }
    },
    
    // Logging
    logs: [{
        action: {
            type: String,
            enum: ['created', 'started', 'progress', 'completed', 'failed', 'restored', 'deleted', 'verified'],
            required: true
        },
        message: {
            type: String,
            trim: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed
        }
    }]
}, {
    timestamps: true,
    strict: true
});

// ==================== INDEXES ====================

// Compound indexes for efficient queries
backupSchema.index({ status: 1, createdAt: -1 });
backupSchema.index({ type: 1, status: 1, createdAt: -1 });
backupSchema.index({ 'retention.expiresAt': 1 });
backupSchema.index({ 'metadata.createdByUserId': 1, createdAt: -1 });
backupSchema.index({ 'verification.verified': 1, status: 1 });
backupSchema.index({ name: 1 }, { unique: true });

// TTL index for automatic cleanup of expired backups
backupSchema.index({ 'retention.expiresAt': 1 }, { 
    expireAfterSeconds: 0,
    partialFilterExpression: { 'retention.autoDelete': true }
});

// ==================== STATIC METHODS ====================

/**
 * Create a new backup record
 * @param {Object} backupData - Backup data
 * @returns {Promise<Document>} Created backup
 */
backupSchema.statics.createBackup = async function(backupData) {
    // Calculate expiration date based on retention days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (backupData.retention?.daysToKeep || 30));
    
    const backup = new this({
        ...backupData,
        'retention.expiresAt': expiresAt,
        status: 'pending',
        'execution.startedAt': new Date(),
        logs: [{
            action: 'created',
            message: 'Backup record created',
            timestamp: new Date()
        }]
    });
    
    return await backup.save();
};

/**
 * Update backup progress
 * @param {string} backupId - Backup ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Document>} Updated backup
 */
backupSchema.statics.updateProgress = async function(backupId, updateData) {
    return await this.findByIdAndUpdate(
        backupId,
        {
            ...updateData,
            $push: {
                logs: {
                    action: 'progress',
                    message: updateData.message || 'Backup in progress',
                    metadata: updateData.metadata,
                    timestamp: new Date()
                }
            }
        },
        { new: true }
    );
};

/**
 * Complete backup
 * @param {string} backupId - Backup ID
 * @param {Object} completionData - Completion data
 * @returns {Promise<Document>} Completed backup
 */
backupSchema.statics.completeBackup = async function(backupId, completionData) {
    const backup = await this.findById(backupId);
    if (!backup) throw new Error('Backup not found');
    
    const duration = Date.now() - backup.execution.startedAt.getTime();
    
    return await this.findByIdAndUpdate(
        backupId,
        {
            status: 'completed',
            'execution.completedAt': new Date(),
            'execution.duration': duration,
            ...completionData,
            $push: {
                logs: {
                    action: 'completed',
                    message: 'Backup completed successfully',
                    metadata: { duration },
                    timestamp: new Date()
                }
            }
        },
        { new: true }
    );
};

/**
 * Fail backup
 * @param {string} backupId - Backup ID
 * @param {Object} errorData - Error data
 * @returns {Promise<Document>} Failed backup
 */
backupSchema.statics.failBackup = async function(backupId, errorData) {
    const backup = await this.findById(backupId);
    if (!backup) throw new Error('Backup not found');
    
    const duration = Date.now() - backup.execution.startedAt.getTime();
    const retryCount = (backup.execution.retryCount || 0) + 1;
    
    const updateData = {
        status: retryCount >= (backup.execution.maxRetries || 3) ? 'failed' : 'pending',
        'execution.duration': duration,
        'execution.retryCount': retryCount,
        error: {
            message: errorData.message,
            code: errorData.code,
            stack: errorData.stack,
            timestamp: new Date()
        },
        $push: {
            logs: {
                action: 'failed',
                message: `Backup failed: ${errorData.message}`,
                metadata: { retryCount, maxRetries: backup.execution.maxRetries },
                timestamp: new Date()
            }
        }
    };
    
    return await this.findByIdAndUpdate(backupId, updateData, { new: true });
};

/**
 * Verify backup integrity
 * @param {string} backupId - Backup ID
 * @param {Object} verificationData - Verification data
 * @returns {Promise<Document>} Verified backup
 */
backupSchema.statics.verifyBackup = async function(backupId, verificationData) {
    return await this.findByIdAndUpdate(
        backupId,
        {
            'verification.verified': true,
            'verification.verifiedAt': new Date(),
            'verification.hashMatch': verificationData.hashMatch || false,
            'verification.integrityCheck': verificationData.integrityCheck || false,
            'verification.verifiedBy': verificationData.verifiedBy || 'system',
            $push: {
                logs: {
                    action: 'verified',
                    message: 'Backup verified successfully',
                    metadata: verificationData,
                    timestamp: new Date()
                }
            }
        },
        { new: true }
    );
};

/**
 * Get backups by status
 * @param {string} status - Backup status
 * @param {number} limit - Limit
 * @returns {Promise<Array>} Backups
 */
backupSchema.statics.getByStatus = async function(status, limit = 50) {
    return await this.find({ status })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

/**
 * Get recent backups
 * @param {number} days - Days to look back
 * @param {string} type - Backup type
 * @returns {Promise<Array>} Recent backups
 */
backupSchema.statics.getRecentBackups = async function(days = 7, type = null) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const query = {
        createdAt: { $gte: cutoffDate },
        status: 'completed'
    };
    
    if (type) query.type = type;
    
    return await this.find(query)
        .sort({ createdAt: -1 })
        .lean();
};

/**
 * Clean up expired backups
 * @returns {Promise<Object>} Cleanup result
 */
backupSchema.statics.cleanupExpired = async function() {
    const result = await this.deleteMany({
        'retention.expiresAt': { $lte: new Date() },
        'retention.autoDelete': true
    });
    
    return {
        deletedCount: result.deletedCount,
        timestamp: new Date()
    };
};

/**
 * Get backup statistics
 * @returns {Promise<Object>} Statistics
 */
backupSchema.statics.getStatistics = async function() {
    const [total, byStatus, byType, recent, totalSize] = await Promise.all([
        this.countDocuments(),
        this.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        this.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        this.getRecentBackups(30),
        this.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$file.size' } } }
        ])
    ]);
    
    return {
        total,
        byStatus,
        byType,
        recentCount: recent.length,
        totalSizeBytes: totalSize[0]?.total || 0,
        totalSizeFormatted: formatBytes(totalSize[0]?.total || 0)
    };
};

// ==================== INSTANCE METHODS ====================

/**
 * Mark backup as restored
 * @param {Object} restoreData - Restore data
 * @returns {Promise<Document>} Updated backup
 */
backupSchema.methods.markAsRestored = async function(restoreData) {
    this.restoration = {
        restored: true,
        restoredAt: new Date(),
        restoredBy: restoreData.restoredBy || 'system',
        restoredTo: restoreData.restoredTo
    };
    
    this.logs.push({
        action: 'restored',
        message: 'Backup restored successfully',
        metadata: restoreData,
        timestamp: new Date()
    });
    
    return await this.save();
};

/**
 * Check if backup is expired
 * @returns {boolean}
 */
backupSchema.methods.isExpired = function() {
    return this.retention.expiresAt && new Date() > this.retention.expiresAt;
};

/**
 * Get backup age in days
 * @returns {number}
 */
backupSchema.methods.getAgeInDays = function() {
    const age = Date.now() - this.createdAt.getTime();
    return Math.floor(age / (1000 * 60 * 60 * 24));
};

/**
 * Calculate compression ratio
 * @returns {number}
 */
backupSchema.methods.calculateCompressionRatio = function() {
    if (this.database.sizeBefore === 0) return 0;
    return ((this.database.sizeBefore - this.database.sizeAfter) / this.database.sizeBefore) * 100;
};

// Helper function to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== PRE-SAVE MIDDLEWARE ====================

backupSchema.pre('save', function(next) {
    // Calculate compression ratio if not set
    if (this.database.sizeBefore > 0 && this.database.sizeAfter > 0 && !this.database.compressionRatio) {
        this.database.compressionRatio = this.calculateCompressionRatio();
    }
    
    // Set expiration date if not set
    if (!this.retention.expiresAt && this.retention.daysToKeep) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.retention.daysToKeep);
        this.retention.expiresAt = expiresAt;
    }
    
    next();
});

// ==================== VIRTUAL PROPERTIES ====================

backupSchema.virtual('isSuccessful').get(function() {
    return this.status === 'completed' && this.verification.verified;
});

backupSchema.virtual('sizeFormatted').get(function() {
    return formatBytes(this.file.size);
});

backupSchema.virtual('durationFormatted').get(function() {
    const seconds = Math.floor(this.execution.duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
});

// Include virtuals in JSON output
backupSchema.set('toJSON', { virtuals: true });
backupSchema.set('toObject', { virtuals: true });

// ==================== EXPORT ====================

module.exports = mongoose.model('Backup', backupSchema);