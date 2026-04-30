const mongoose = require('mongoose');
const { EVENT_STATUS, VALIDATION } = require('../config/constants');

/**
 * Event Registration Schema for KAAF University Noticeboard System
 * Tracks user registrations, attendance, and feedback for events
 * @version 2.0.0
 * @author Boakye Samuel Yiadom
 */
const eventRegistrationSchema = new mongoose.Schema({
  // Core References
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event reference is required'],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  
  // Registration Details
  registrationDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  registrationMethod: {
    type: String,
    enum: ['self', 'admin', 'bulk_import'],
    default: 'self'
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Registration Status
  status: {
    type: String,
    enum: ['registered', 'waitlisted', 'checked_in', 'cancelled', 'no_show', 'attended'],
    default: 'registered',
    index: true
  },
  
  // Ticket Information
  ticketNumber: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  qrCode: {
    type: String,
    default: null
  },
  
  // Check-in Information
  checkInTime: {
    type: Date,
    default: null
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  checkInMethod: {
    type: String,
    enum: ['qr_code', 'manual', 'self'],
    default: null
  },
  checkInLocation: {
    type: String,
    default: null
  },
  checkInIP: {
    type: String,
    default: null
  },
  
  // Waitlist Information
  waitlistPosition: {
    type: Number,
    default: null
  },
  promotedFromWaitlist: {
    type: Boolean,
    default: false
  },
  promotedAt: {
    type: Date,
    default: null
  },
  
  // Cancellation Information
  cancelledAt: {
    type: Date,
    default: null
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  cancellationReason: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  // Attendance & Participation
  attended: {
    type: Boolean,
    default: false
  },
  attendedAt: {
    type: Date,
    default: null
  },
  durationSpent: {
    type: Number, // in minutes
    default: null
  },
  
  // Certificate
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: {
    type: Date,
    default: null
  },
  certificateUrl: {
    type: String,
    default: null
  },
  certificateNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Feedback & Evaluation
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comment: {
      type: String,
      maxlength: VALIDATION.MAX_COMMENT_LENGTH || 1000,
      trim: true,
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    isAnonymous: {
      type: Boolean,
      default: false
    }
  },
  
  // Special Accommodations
  specialRequests: {
    type: String,
    maxlength: 500,
    trim: true,
    default: null
  },
  dietaryRestrictions: {
    type: String,
    maxlength: 500,
    trim: true,
    default: null
  },
  
  // Payment Information (if applicable)
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'waived'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile_money', 'bank_transfer', 'online'],
    default: null
  },
  paymentReference: {
    type: String,
    default: null
  },
  paymentDate: {
    type: Date,
    default: null
  },
  
  // Tracking
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date,
    default: null
  },
  reminderCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Soft Delete
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

// ============================
// INDEXES
// ============================

// Prevent duplicate registrations
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

// Compound indexes for common queries
eventRegistrationSchema.index({ event: 1, status: 1 });
eventRegistrationSchema.index({ user: 1, status: 1 });
eventRegistrationSchema.index({ event: 1, attended: 1 });
eventRegistrationSchema.index({ status: 1, registrationDate: -1 });
eventRegistrationSchema.index({ ticketNumber: 1 }, { unique: true, sparse: true });
eventRegistrationSchema.index({ certificateNumber: 1 }, { unique: true, sparse: true });
eventRegistrationSchema.index({ checkInTime: -1 });
eventRegistrationSchema.index({ paymentStatus: 1 });

// ============================
// MIDDLEWARE
// ============================

/**
 * Generate ticket number before saving
 */
eventRegistrationSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber && this.status === 'registered') {
    const Event = mongoose.model('Event');
    const event = await Event.findById(this.event);
    
    if (event) {
      const year = new Date().getFullYear();
      const eventCode = event.eventType.substring(0, 3).toUpperCase();
      const sequence = String(await this.constructor.countDocuments({ event: this.event }) + 1).padStart(4, '0');
      this.ticketNumber = `${year}-${eventCode}-${sequence}`;
    }
  }
  next();
});

/**
 * Generate certificate number when certificate is issued
 */
eventRegistrationSchema.pre('save', async function(next) {
  if (this.certificateIssued && !this.certificateNumber && this.isModified('certificateIssued')) {
    const year = new Date().getFullYear();
    const sequence = String(await this.constructor.countDocuments({ certificateIssued: true }) + 1).padStart(6, '0');
    this.certificateNumber = `CERT-${year}-${sequence}`;
    this.certificateIssuedAt = new Date();
  }
  next();
});

/**
 * Update check-in time when status changes to checked_in
 */
eventRegistrationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'checked_in' && !this.checkInTime) {
    this.checkInTime = new Date();
    this.attended = true;
    this.attendedAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  next();
});

/**
 * Soft delete middleware
 */
eventRegistrationSchema.pre('find', function() {
  this.where({ deletedAt: null });
});

eventRegistrationSchema.pre('findOne', function() {
  this.where({ deletedAt: null });
});

eventRegistrationSchema.pre('countDocuments', function() {
  this.where({ deletedAt: null });
});

// ============================
// INSTANCE METHODS
// ============================

/**
 * Check-in user for event
 */
eventRegistrationSchema.methods.checkIn = async function(checkedBy, method = 'manual', location = null, ip = null) {
  if (this.status === 'cancelled') {
    throw new Error('Cannot check in a cancelled registration');
  }
  
  if (this.status === 'checked_in') {
    throw new Error('User already checked in');
  }
  
  this.status = 'checked_in';
  this.checkInTime = new Date();
  this.checkedInBy = checkedBy;
  this.checkInMethod = method;
  this.checkInLocation = location;
  this.checkInIP = ip;
  this.attended = true;
  this.attendedAt = new Date();
  
  await this.save();
  
  // Update event statistics
  const Event = mongoose.model('Event');
  await Event.findByIdAndUpdate(this.event, {
    $inc: { checkedInCount: 1 }
  });
  
  return this;
};

/**
 * Cancel registration
 */
eventRegistrationSchema.methods.cancel = async function(cancelledBy, reason = null) {
  if (this.status === 'cancelled') {
    throw new Error('Registration already cancelled');
  }
  
  if (this.status === 'checked_in') {
    throw new Error('Cannot cancel a checked-in registration');
  }
  
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
  
  await this.save();
  
  // Update event registration count
  const Event = mongoose.model('Event');
  await Event.findByIdAndUpdate(this.event, {
    $inc: { registeredCount: -1 }
  });
  
  return this;
};

/**
 * Submit feedback for event
 */
eventRegistrationSchema.methods.submitFeedback = async function(rating, comment, isAnonymous = false) {
  if (!this.attended && this.status !== 'checked_in') {
    throw new Error('User must attend the event to submit feedback');
  }
  
  this.feedback = {
    rating,
    comment: comment?.trim(),
    submittedAt: new Date(),
    isAnonymous
  };
  
  await this.save();
  
  // Update event average rating
  const Event = mongoose.model('Event');
  const event = await Event.findById(this.event);
  
  const allFeedbacks = await this.constructor.find({
    event: this.event,
    'feedback.rating': { $ne: null }
  });
  
  const totalRatings = allFeedbacks.length;
  const sumRatings = allFeedbacks.reduce((sum, reg) => sum + (reg.feedback?.rating || 0), 0);
  
  event.totalRatings = totalRatings;
  event.averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
  await event.save();
  
  return this;
};

/**
 * Issue certificate for attended event
 */
eventRegistrationSchema.methods.issueCertificate = async function() {
  if (!this.attended && this.status !== 'checked_in') {
    throw new Error('User must attend the event to receive a certificate');
  }
  
  if (this.certificateIssued) {
    throw new Error('Certificate already issued');
  }
  
  this.certificateIssued = true;
  await this.save();
  
  return this;
};

/**
 * Mark as no-show
 */
eventRegistrationSchema.methods.markAsNoShow = async function() {
  if (this.status !== 'registered') {
    throw new Error('Only registered users can be marked as no-show');
  }
  
  this.status = 'no_show';
  await this.save();
  
  return this;
};

/**
 * Soft delete registration
 */
eventRegistrationSchema.methods.softDelete = async function(deletedBy) {
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  await this.save();
};

// ============================
// STATIC METHODS
// ============================

/**
 * Get registration statistics for an event
 */
eventRegistrationSchema.statics.getEventStats = async function(eventId) {
  return {
    total: await this.countDocuments({ event: eventId, deletedAt: null }),
    registered: await this.countDocuments({ event: eventId, status: 'registered', deletedAt: null }),
    checkedIn: await this.countDocuments({ event: eventId, status: 'checked_in', deletedAt: null }),
    attended: await this.countDocuments({ event: eventId, attended: true, deletedAt: null }),
    cancelled: await this.countDocuments({ event: eventId, status: 'cancelled', deletedAt: null }),
    noShow: await this.countDocuments({ event: eventId, status: 'no_show', deletedAt: null }),
    waitlisted: await this.countDocuments({ event: eventId, status: 'waitlisted', deletedAt: null }),
    feedbackGiven: await this.countDocuments({ event: eventId, 'feedback.rating': { $ne: null }, deletedAt: null }),
    certificatesIssued: await this.countDocuments({ event: eventId, certificateIssued: true, deletedAt: null }),
    averageRating: await this.aggregate([
      { $match: { event: mongoose.Types.ObjectId(eventId), 'feedback.rating': { $ne: null }, deletedAt: null } },
      { $group: { _id: null, avg: { $avg: '$feedback.rating' } } }
    ])
  };
};

/**
 * Get user's registration for an event
 */
eventRegistrationSchema.statics.getUserRegistration = async function(eventId, userId) {
  return this.findOne({ event: eventId, user: userId, deletedAt: null });
};

/**
 * Get all registrations for an event with pagination
 */
eventRegistrationSchema.statics.getEventRegistrations = async function(eventId, options = {}) {
  const { page = 1, limit = 50, status = null } = options;
  const skip = (page - 1) * limit;
  
  const query = { event: eventId, deletedAt: null };
  if (status) query.status = status;
  
  const registrations = await this.find(query)
    .populate('user', 'firstName lastName email studentId avatar')
    .populate('checkedInBy', 'firstName lastName')
    .populate('cancelledBy', 'firstName lastName')
    .sort({ registrationDate: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await this.countDocuments(query);
  
  return {
    registrations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Bulk check-in registrations
 */
eventRegistrationSchema.statics.bulkCheckIn = async function(eventId, userIds, checkedBy, method = 'manual') {
  const result = await this.updateMany(
    {
      event: eventId,
      user: { $in: userIds },
      status: { $in: ['registered', 'waitlisted'] },
      deletedAt: null
    },
    {
      $set: {
        status: 'checked_in',
        checkInTime: new Date(),
        checkedInBy: checkedBy,
        checkInMethod: method,
        attended: true,
        attendedAt: new Date()
      }
    }
  );
  
  return result.modifiedCount;
};

// ============================
// VIRTUALS
// ============================

/**
 * Virtual for registration age (days since registration)
 */
eventRegistrationSchema.virtual('registrationAge').get(function() {
  const days = (new Date() - this.registrationDate) / (1000 * 60 * 60 * 24);
  return Math.floor(days);
});

/**
 * Virtual for check-in status
 */
eventRegistrationSchema.virtual('isCheckedIn').get(function() {
  return this.status === 'checked_in';
});

/**
 * Virtual for has feedback
 */
eventRegistrationSchema.virtual('hasFeedback').get(function() {
  return this.feedback && this.feedback.rating !== null;
});

// ============================
// EXPORT
// ============================

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);