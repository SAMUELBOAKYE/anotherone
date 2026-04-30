const mongoose = require('mongoose');
const {
  NOTICE_CATEGORIES,
  NOTICE_PRIORITY,
  NOTICE_STATUS,
  DEPARTMENTS,
  USER_ROLES,
  VALIDATION,
  UPLOAD
} = require('../config/constants');

/**
 * Notice Schema for KAAF University Noticeboard System
 * @version 2.0.0
 * @author Boakye Samuel Yiadom
 */
const noticeSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Notice title is required'],
    trim: true,
    minlength: [VALIDATION.TITLE_MIN_LENGTH, `Title must be at least ${VALIDATION.TITLE_MIN_LENGTH} characters`],
    maxlength: [VALIDATION.TITLE_MAX_LENGTH, `Title cannot exceed ${VALIDATION.TITLE_MAX_LENGTH} characters`],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Notice content is required'],
    trim: true,
    minlength: [VALIDATION.DESCRIPTION_MIN_LENGTH, `Content must be at least ${VALIDATION.DESCRIPTION_MIN_LENGTH} characters`],
    maxlength: [VALIDATION.DESCRIPTION_MAX_LENGTH, `Content cannot exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`]
  },
  summary: {
    type: String,
    maxlength: [VALIDATION.SUMMARY_MAX_LENGTH, `Summary cannot exceed ${VALIDATION.SUMMARY_MAX_LENGTH} characters`],
    trim: true
  },
  
  // Categorization
  category: {
    type: String,
    enum: Object.values(NOTICE_CATEGORIES),
    required: [true, 'Notice category is required'],
    index: true
  },
  priority: {
    type: String,
    enum: Object.values(NOTICE_PRIORITY),
    default: NOTICE_PRIORITY.MEDIUM,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    index: true
  }],
  
  // Targeting
  targetDepartments: {
    type: [{
      type: String,
      enum: [...DEPARTMENTS, 'all']
    }],
    default: ['all'],
    index: true
  },
  targetRoles: {
    type: [{
      type: String,
      enum: [...Object.values(USER_ROLES), 'all']
    }],
    default: ['all'],
    index: true
  },
  targetYears: [{
    type: Number,
    min: 1,
    max: 6
  }],
  
  // Event Reference (for event-type notices)
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null,
    index: true
  },
  
  // Author Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator information is required'],
    index: true
  },
  createdByRole: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Attachments & Media
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true,
      validate: {
        validator: function(size) {
          return size <= UPLOAD.MAX_FILE_SIZE;
        },
        message: `File size cannot exceed ${UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB`
      }
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  featuredImage: {
    url: String,
    alt: String,
    caption: String
  },
  
  // Publishing & Status
  status: {
    type: String,
    enum: Object.values(NOTICE_STATUS),
    default: NOTICE_STATUS.DRAFT,
    index: true
  },
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  isImportant: {
    type: Boolean,
    default: false,
    index: true
  },
  isPinned: {
    type: Boolean,
    default: false,
    index: true
  },
  pinnedUntil: {
    type: Date,
    default: null
  },
  publishedAt: {
    type: Date,
    default: null,
    index: true
  },
  
  // Expiration
  expiresAt: {
    type: Date,
    default: null,
    index: true,
    validate: {
      validator: function(expiresAt) {
        if (!expiresAt) return true;
        if (!this.publishedAt) return true;
        return expiresAt > this.publishedAt;
      },
      message: 'Expiration date must be after published date'
    }
  },
  isExpired: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Engagement & Analytics
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueViews: {
    type: Number,
    default: 0,
    min: 0
  },
  viewedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  shares: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: VALIDATION.MAX_COMMENT_LENGTH
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  
  // Notifications
  notifyTargets: {
    type: Boolean,
    default: true
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationSentAt: Date,
  
  // SEO & Metadata
  metaDescription: {
    type: String,
    maxlength: 160
  },
  metaKeywords: [String],
  
  // Workflow & Approval
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: Date,
  approvalNotes: String,
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    title: String,
    content: String,
    modifiedAt: Date,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Tracking
  deletedAt: {
    type: Date,
    default: null,
    index: true
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true }
});

// Indexes
noticeSchema.index({ 
  title: 'text', 
  content: 'text', 
  summary: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    tags: 5,
    summary: 3,
    content: 1
  },
  name: 'text_search_index'
});

noticeSchema.index({ status: 1, isPublished: 1, publishedAt: -1 });
noticeSchema.index({ category: 1, status: 1, isPublished: 1 });
noticeSchema.index({ priority: 1, isPublished: 1, publishedAt: -1 });
noticeSchema.index({ isImportant: 1, isPinned: 1, publishedAt: -1 });
noticeSchema.index({ targetDepartments: 1, targetRoles: 1 });
noticeSchema.index({ createdBy: 1, createdAt: -1 });
noticeSchema.index({ expiresAt: 1, isExpired: 1 });
noticeSchema.index({ tags: 1 });
noticeSchema.index({ slug: 1 }, { unique: true, sparse: true });
noticeSchema.index({ relatedEvent: 1 });

// Middleware
noticeSchema.pre('save', async function(next) {
  if (this.isModified('title') && this.status === NOTICE_STATUS.PUBLISHED) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const existing = await this.constructor.findOne({ slug: this.slug, _id: { $ne: this._id } });
    if (existing) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  next();
});

noticeSchema.pre('save', function(next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
    this.status = NOTICE_STATUS.PUBLISHED;
  }
  
  if (this.isModified('isPublished') && !this.isPublished && this.publishedAt) {
    this.publishedAt = null;
  }
  
  next();
});

noticeSchema.pre('save', function(next) {
  if (this.expiresAt && this.expiresAt < new Date()) {
    this.isExpired = true;
    this.isPublished = false;
    this.status = NOTICE_STATUS.ARCHIVED;
  }
  next();
});

noticeSchema.pre('save', function(next) {
  if (this.isModified('comments')) {
    this.commentCount = this.comments.length;
  }
  next();
});

noticeSchema.pre('find', function() {
  this.where({ deletedAt: null });
});

noticeSchema.pre('findOne', function() {
  this.where({ deletedAt: null });
});

noticeSchema.pre('countDocuments', function() {
  this.where({ deletedAt: null });
});

// Instance Methods
noticeSchema.methods.incrementViews = async function(userId, ipAddress, userAgent) {
  this.views += 1;
  
  const alreadyViewed = this.viewedBy.some(view => 
    view.user?.toString() === userId?.toString() || view.ipAddress === ipAddress
  );
  
  if (!alreadyViewed) {
    this.uniqueViews += 1;
    this.viewedBy.push({
      user: userId,
      viewedAt: new Date(),
      ipAddress,
      userAgent
    });
  }
  
  await this.save();
};

noticeSchema.methods.toggleLike = async function(userId) {
  const likedIndex = this.likedBy.findIndex(id => id.toString() === userId.toString());
  
  if (likedIndex === -1) {
    this.likedBy.push(userId);
    this.likes += 1;
  } else {
    this.likedBy.splice(likedIndex, 1);
    this.likes -= 1;
  }
  
  await this.save();
  return likedIndex === -1;
};

noticeSchema.methods.addComment = async function(userId, content) {
  this.comments.push({
    user: userId,
    content: content.trim()
  });
  this.commentCount = this.comments.length;
  await this.save();
  return this.comments[this.comments.length - 1];
};

noticeSchema.methods.softDelete = async function(userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.status = NOTICE_STATUS.DELETED;
  this.isPublished = false;
  await this.save();
};

noticeSchema.methods.archiveExpired = async function() {
  if (this.expiresAt && this.expiresAt < new Date()) {
    this.isExpired = true;
    this.isPublished = false;
    this.status = NOTICE_STATUS.ARCHIVED;
    await this.save();
    return true;
  }
  return false;
};

noticeSchema.methods.createVersion = async function(userId) {
  this.previousVersions.push({
    version: this.version,
    title: this.title,
    content: this.content,
    modifiedAt: new Date(),
    modifiedBy: userId
  });
  this.version += 1;
  await this.save();
};

// Static Methods
noticeSchema.statics.getPublished = async function(filters = {}, options = {}) {
  const query = {
    status: NOTICE_STATUS.PUBLISHED,
    isPublished: true,
    deletedAt: null,
    ...filters
  };
  
  query.$or = [
    { expiresAt: { $gt: new Date() } },
    { expiresAt: null }
  ];
  
  return this.find(query)
    .sort(options.sort || { isPinned: -1, publishedAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10)
    .populate('createdBy', 'firstName lastName email role');
};

noticeSchema.statics.getForUser = async function(user, options = {}) {
  const query = {
    status: NOTICE_STATUS.PUBLISHED,
    isPublished: true,
    deletedAt: null,
    $or: [
      { targetDepartments: 'all' },
      { targetDepartments: user.department }
    ],
    $and: [
      {
        $or: [
          { targetRoles: 'all' },
          { targetRoles: user.role }
        ]
      }
    ]
  };
  
  if (user.yearOfStudy) {
    query.$or.push({ targetYears: { $in: [user.yearOfStudy] } });
  }
  
  return this.find(query)
    .sort(options.sort || { isPinned: -1, priority: -1, publishedAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

noticeSchema.statics.getStatistics = async function() {
  const now = new Date();
  
  const totalViewsAgg = await this.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: null, total: { $sum: '$views' } } }
  ]);
  
  return {
    total: await this.countDocuments({ deletedAt: null }),
    published: await this.countDocuments({ status: NOTICE_STATUS.PUBLISHED, isPublished: true, deletedAt: null }),
    drafts: await this.countDocuments({ status: NOTICE_STATUS.DRAFT, deletedAt: null }),
    archived: await this.countDocuments({ status: NOTICE_STATUS.ARCHIVED, deletedAt: null }),
    expired: await this.countDocuments({ isExpired: true, deletedAt: null }),
    byCategory: await this.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),
    byPriority: await this.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]),
    totalViews: totalViewsAgg,
    averageViews: totalViewsAgg.length > 0 ? totalViewsAgg[0].total / (await this.countDocuments({ deletedAt: null })) : 0
  };
};

noticeSchema.statics.autoExpireNotices = async function() {
  const expiredNotices = await this.find({
    expiresAt: { $lt: new Date() },
    isExpired: false,
    deletedAt: null
  });
  
  for (const notice of expiredNotices) {
    await notice.archiveExpired();
  }
  
  return expiredNotices.length;
};

// Virtuals
noticeSchema.virtual('isActive').get(function() {
  const isNotExpired = !this.expiresAt || this.expiresAt > new Date();
  return this.isPublished && this.status === NOTICE_STATUS.PUBLISHED && isNotExpired && !this.deletedAt;
});

noticeSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});

noticeSchema.virtual('age').get(function() {
  if (!this.publishedAt) return null;
  const days = (new Date() - this.publishedAt) / (1000 * 60 * 60 * 24);
  return Math.floor(days);
});

noticeSchema.virtual('isEventNotice').get(function() {
  return this.category === NOTICE_CATEGORIES.EVENT && this.relatedEvent;
});

module.exports = mongoose.model('Notice', noticeSchema);