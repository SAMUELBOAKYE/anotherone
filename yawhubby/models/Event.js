const mongoose = require("mongoose");
const {
  EVENT_TYPES,
  EVENT_STATUS,
  EVENT_PARTICIPATION,
  DEPARTMENTS,
  USER_ROLES,
  VALIDATION,
  UPLOAD,
  REGISTRATION_STATUS,
} = require("../config/constants");

/**
 * Event Schema for KAAF University Noticeboard System
 * @version 2.0.0
 * @author Boakye Samuel Yiadom
 */
const eventSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: [
        VALIDATION.EVENT_TITLE_MIN_LENGTH,
        `Title must be at least ${VALIDATION.EVENT_TITLE_MIN_LENGTH} characters`,
      ],
      maxlength: [
        VALIDATION.EVENT_TITLE_MAX_LENGTH,
        `Title cannot exceed ${VALIDATION.EVENT_TITLE_MAX_LENGTH} characters`,
      ],
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      minlength: [
        VALIDATION.EVENT_DESCRIPTION_MIN_LENGTH,
        `Description must be at least ${VALIDATION.EVENT_DESCRIPTION_MIN_LENGTH} characters`,
      ],
      maxlength: [
        VALIDATION.EVENT_DESCRIPTION_MAX_LENGTH,
        `Description cannot exceed ${VALIDATION.EVENT_DESCRIPTION_MAX_LENGTH} characters`,
      ],
    },
    summary: {
      type: String,
      maxlength: [
        VALIDATION.EVENT_SUMMARY_MAX_LENGTH,
        `Summary cannot exceed ${VALIDATION.EVENT_SUMMARY_MAX_LENGTH} characters`,
      ],
      trim: true,
    },

    // Categorization
    eventType: {
      type: String,
      enum: Object.values(EVENT_TYPES),
      required: [true, "Event type is required"],
      index: true,
    },
    participationMode: {
      type: String,
      enum: Object.values(EVENT_PARTICIPATION),
      default: EVENT_PARTICIPATION.OFFLINE,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        index: true,
      },
    ],

    // Location & Timing
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },
    onlineLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (link) {
          if (!link) return true;
          const urlPattern =
            /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
          return urlPattern.test(link);
        },
        message: "Please provide a valid URL for online event link",
      },
    },
    eventDate: {
      type: Date,
      required: [true, "Event date is required"],
      index: true,
      validate: {
        validator: function (date) {
          if (!date) return true;
          const maxFutureDays = VALIDATION.MAX_FUTURE_DATE_DAYS || 365;
          const maxDate = new Date();
          maxDate.setDate(maxDate.getDate() + maxFutureDays);
          return date <= maxDate;
        },
        message: `Event date cannot be more than ${VALIDATION.MAX_FUTURE_DATE_DAYS} days in the future`,
      },
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Please provide a valid time format (HH:MM)",
      ],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Please provide a valid time format (HH:MM)",
      ],
    },

    // Organizer Information
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer is required"],
      index: true,
    },
    organizerName: {
      type: String,
      required: [true, "Organizer name is required"],
      trim: true,
    },
    organizerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [VALIDATION.EMAIL_PATTERN, "Please provide a valid email address"],
    },
    organizerPhone: {
      type: String,
      trim: true,
      match: [VALIDATION.PHONE_PATTERN, "Please provide a valid phone number"],
    },
    coOrganizers: [
      {
        name: String,
        email: String,
        role: String,
      },
    ],

    // Capacity & Registration
    capacity: {
      type: Number,
      min: 0,
      default: null,
      validate: {
        validator: function (capacity) {
          if (capacity === null) return true;
          return capacity > 0 && capacity <= VALIDATION.EVENT_MAX_CAPACITY;
        },
        message: `Capacity must be between 1 and ${VALIDATION.EVENT_MAX_CAPACITY}`,
      },
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    checkedInCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    waitlistCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    registrationDeadline: {
      type: Date,
      default: null,
      validate: {
        validator: function (deadline) {
          if (!deadline) return true;
          return deadline <= this.eventDate;
        },
        message: "Registration deadline must be before the event date",
      },
    },
    isRegistrationRequired: {
      type: Boolean,
      default: true,
    },
    registrationFee: {
      type: Number,
      default: 0,
      min: 0,
      max: VALIDATION.EVENT_MAX_FEE,
    },

    // Status & Publishing
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Engagement & Analytics
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
        ipAddress: String,
        userAgent: String,
      },
    ],
    shares: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Feedback & Evaluation
    feedbackEnabled: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },

    // Targeting
    targetDepartments: {
      type: [
        {
          type: String,
          enum: [...DEPARTMENTS, "all"],
        },
      ],
      default: ["all"],
      index: true,
    },
    targetRoles: {
      type: [
        {
          type: String,
          enum: [...Object.values(USER_ROLES), "all"],
        },
      ],
      default: ["all"],
      index: true,
    },
    targetYears: [
      {
        type: Number,
        min: 1,
        max: 6,
      },
    ],

    // Media & Assets
    posterImage: {
      type: String,
      default: null,
    },
    gallery: [
      {
        url: String,
        caption: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        filename: String,
        originalName: String,
        url: String,
        fileType: String,
        size: {
          type: Number,
          validate: {
            validator: function (size) {
              return size <= UPLOAD.MAX_FILE_SIZE;
            },
            message: `File size cannot exceed ${UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB`,
          },
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true },
  },
);

// Indexes
eventSchema.index(
  {
    title: "text",
    description: "text",
    summary: "text",
    tags: "text",
  },
  {
    weights: {
      title: 10,
      tags: 5,
      summary: 3,
      description: 1,
    },
    name: "text_search_index",
  },
);

eventSchema.index({ status: 1, isPublished: 1, eventDate: 1 });
eventSchema.index({ eventType: 1, status: 1, eventDate: 1 });
eventSchema.index({ eventDate: 1, status: 1 });
eventSchema.index({ organizer: 1, eventDate: -1 });
// FIXED: Removed compound index on two array fields - MongoDB doesn't support this
// Individual indexes instead:
eventSchema.index({ targetDepartments: 1 });
eventSchema.index({ targetRoles: 1 });
eventSchema.index({ registrationDeadline: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ slug: 1 }, { unique: true, sparse: true });

// Middleware
eventSchema.pre("save", async function (next) {
  if (this.isModified("title") && this.status === EVENT_STATUS.PUBLISHED) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existing = await this.constructor.findOne({
      slug: this.slug,
      _id: { $ne: this._id },
    });
    if (existing) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  next();
});

eventSchema.pre("save", function (next) {
  if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
    if (this.status === EVENT_STATUS.DRAFT) {
      this.status = EVENT_STATUS.PUBLISHED;
    }
  }
  next();
});

eventSchema.pre("save", function (next) {
  const now = new Date();
  const eventDateTime = new Date(this.eventDate);
  const eventStartDateTime = new Date(
    `${this.eventDate.toDateString()} ${this.startTime}`,
  );
  const eventEndDateTime = new Date(
    `${this.eventDate.toDateString()} ${this.endTime}`,
  );

  if (
    this.status === EVENT_STATUS.PUBLISHED ||
    this.status === EVENT_STATUS.DRAFT
  ) {
    if (eventEndDateTime < now) {
      this.status = EVENT_STATUS.COMPLETED;
    } else if (eventStartDateTime <= now && eventEndDateTime > now) {
      this.status = EVENT_STATUS.ONGOING;
    } else if (eventStartDateTime > now) {
      this.status = EVENT_STATUS.UPCOMING;
    }
  }

  next();
});

eventSchema.pre("save", function (next) {
  if (this.registrationDeadline && this.registrationDeadline < new Date()) {
    this.isRegistrationRequired = false;
  }
  next();
});

eventSchema.pre("find", function () {
  this.where({ deletedAt: null });
});

eventSchema.pre("findOne", function () {
  this.where({ deletedAt: null });
});

eventSchema.pre("countDocuments", function () {
  this.where({ deletedAt: null });
});

// Instance Methods
eventSchema.methods.incrementViews = async function (
  userId,
  ipAddress,
  userAgent,
) {
  this.views += 1;

  const alreadyViewed = this.viewedBy.some(
    (view) =>
      view.user?.toString() === userId?.toString() ||
      view.ipAddress === ipAddress,
  );

  if (!alreadyViewed) {
    this.uniqueViews += 1;
    this.viewedBy.push({
      user: userId,
      viewedAt: new Date(),
      ipAddress,
      userAgent,
    });
  }

  await this.save();
};

eventSchema.methods.toggleLike = async function (userId) {
  const likedIndex = this.likedBy.findIndex(
    (id) => id.toString() === userId.toString(),
  );

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

eventSchema.methods.softDelete = async function (userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.status = EVENT_STATUS.CANCELLED;
  this.isPublished = false;
  await this.save();
};

eventSchema.methods.cancelEvent = async function (userId, reason) {
  this.status = EVENT_STATUS.CANCELLED;
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  this.cancelledBy = userId;
  this.isPublished = false;
  await this.save();
};

// Registration Methods
eventSchema.methods.registerUser = async function (
  userId,
  registrationMethod = "self",
  registeredBy = null,
) {
  const Registration = mongoose.model("EventRegistration");
  const now = new Date();

  if (this.registrationDeadline && this.registrationDeadline < now) {
    throw new Error("Registration deadline has passed");
  }

  const existingRegistration = await Registration.findOne({
    event: this._id,
    user: userId,
    deletedAt: null,
  });

  if (existingRegistration) {
    throw new Error("User is already registered for this event");
  }

  let status = REGISTRATION_STATUS.REGISTERED;
  let waitlistPosition = null;

  if (this.capacity && this.registeredCount >= this.capacity) {
    status = REGISTRATION_STATUS.WAITLISTED;
    waitlistPosition = this.waitlistCount + 1;
    this.waitlistCount += 1;
  } else {
    this.registeredCount += 1;
  }

  const registration = new Registration({
    event: this._id,
    user: userId,
    registrationMethod,
    registeredBy,
    status,
    waitlistPosition,
  });

  await registration.save();
  await this.save();

  return registration;
};

eventSchema.methods.getRegistrations = async function (filters = {}) {
  const Registration = mongoose.model("EventRegistration");
  return Registration.find({
    event: this._id,
    deletedAt: null,
    ...filters,
  }).populate("user", "firstName lastName email studentId avatar");
};

eventSchema.methods.getRegistrationStats = async function () {
  const Registration = mongoose.model("EventRegistration");
  return Registration.getEventStats(this._id);
};

// Static Methods
eventSchema.statics.getPublished = async function (filters = {}, options = {}) {
  const query = {
    status: {
      $in: [
        EVENT_STATUS.PUBLISHED,
        EVENT_STATUS.UPCOMING,
        EVENT_STATUS.ONGOING,
      ],
    },
    isPublished: true,
    deletedAt: null,
    ...filters,
  };

  return this.find(query)
    .sort(options.sort || { eventDate: 1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10)
    .populate("organizer", "firstName lastName email");
};

eventSchema.statics.getForUser = async function (user, options = {}) {
  const query = {
    status: {
      $in: [
        EVENT_STATUS.PUBLISHED,
        EVENT_STATUS.UPCOMING,
        EVENT_STATUS.ONGOING,
      ],
    },
    isPublished: true,
    deletedAt: null,
    $or: [{ targetDepartments: "all" }, { targetDepartments: user.department }],
    $and: [
      {
        $or: [{ targetRoles: "all" }, { targetRoles: user.role }],
      },
    ],
  };

  if (user.yearOfStudy) {
    query.$or.push({ targetYears: { $in: [user.yearOfStudy] } });
  }

  return this.find(query)
    .sort(options.sort || { eventDate: 1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

eventSchema.statics.getUpcoming = async function (limit = 10) {
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));

  return this.find({
    eventDate: { $gte: today },
    status: { $in: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.UPCOMING] },
    isPublished: true,
    deletedAt: null,
  })
    .sort({ eventDate: 1 })
    .limit(limit);
};

eventSchema.statics.getStatistics = async function () {
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalViewsAgg = await this.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: null, total: { $sum: "$views" } } },
  ]);

  const totalRegistrationsAgg = await this.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: null, total: { $sum: "$registeredCount" } } },
  ]);

  return {
    total: await this.countDocuments({ deletedAt: null }),
    published: await this.countDocuments({
      isPublished: true,
      deletedAt: null,
    }),
    upcoming: await this.countDocuments({
      eventDate: { $gte: today },
      status: EVENT_STATUS.UPCOMING,
      deletedAt: null,
    }),
    ongoing: await this.countDocuments({
      status: EVENT_STATUS.ONGOING,
      deletedAt: null,
    }),
    completed: await this.countDocuments({
      status: EVENT_STATUS.COMPLETED,
      deletedAt: null,
    }),
    cancelled: await this.countDocuments({
      status: EVENT_STATUS.CANCELLED,
      deletedAt: null,
    }),
    byType: await this.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
    ]),
    thisMonth: await this.countDocuments({
      createdAt: { $gte: thisMonth },
      deletedAt: null,
    }),
    totalRegistrations: totalRegistrationsAgg,
    totalViews: totalViewsAgg,
    averageRating: await this.aggregate([
      { $match: { deletedAt: null, averageRating: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$averageRating" } } },
    ]),
  };
};

eventSchema.statics.updateEventStatuses = async function () {
  const now = new Date();

  const ongoingUpdated = await this.updateMany(
    {
      eventDate: { $lte: now },
      status: EVENT_STATUS.UPCOMING,
      isPublished: true,
      deletedAt: null,
    },
    { $set: { status: EVENT_STATUS.ONGOING } },
  );

  const completedUpdated = await this.updateMany(
    {
      eventDate: { $lt: now },
      status: EVENT_STATUS.ONGOING,
      deletedAt: null,
    },
    { $set: { status: EVENT_STATUS.COMPLETED } },
  );

  return {
    ongoingUpdated: ongoingUpdated.modifiedCount,
    completedUpdated: completedUpdated.modifiedCount,
  };
};

// Virtuals
eventSchema.virtual("availableSpots").get(function () {
  if (!this.capacity) return null;
  return Math.max(0, this.capacity - this.registeredCount);
});

eventSchema.virtual("isFull").get(function () {
  if (!this.capacity) return false;
  return this.registeredCount >= this.capacity;
});

eventSchema.virtual("isRegistrationOpen").get(function () {
  if (!this.isRegistrationRequired) return false;
  if (this.registrationDeadline && this.registrationDeadline < new Date())
    return false;
  if (this.capacity && this.registeredCount >= this.capacity) return false;
  if (
    this.status === EVENT_STATUS.COMPLETED ||
    this.status === EVENT_STATUS.CANCELLED
  )
    return false;
  return true;
});

eventSchema.virtual("durationHours").get(function () {
  const start = new Date(`${this.eventDate.toDateString()} ${this.startTime}`);
  const end = new Date(`${this.eventDate.toDateString()} ${this.endTime}`);
  const durationMs = end - start;
  return durationMs / (1000 * 60 * 60);
});

eventSchema.virtual("formattedDate").get(function () {
  if (!this.eventDate) return null;
  return this.eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

eventSchema.virtual("isHappeningNow").get(function () {
  const now = new Date();
  const eventStart = new Date(
    `${this.eventDate.toDateString()} ${this.startTime}`,
  );
  const eventEnd = new Date(`${this.eventDate.toDateString()} ${this.endTime}`);
  return now >= eventStart && now <= eventEnd;
});

module.exports = mongoose.model("Event", eventSchema);
