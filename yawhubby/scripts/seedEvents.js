// backend/scripts/seedEvents.js - World-Class Event Seeding Script
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/kaaf_noticeboard",
  BATCH_SIZE: 10,
  DRY_RUN: process.argv.includes("--dry-run"),
  VERBOSE: process.argv.includes("--verbose"),
  FORCE: process.argv.includes("--force"),
  CLEAR_FIRST: process.argv.includes("--clear-first"),
};

// ============================================================
// LOGGER
// ============================================================
const logger = {
  info: (msg, data = null) => {
    console.log(`\x1b[36m[INFO]\x1b[0m ${new Date().toISOString()} - ${msg}`);
    if (data && CONFIG.VERBOSE) console.log(data);
  },
  success: (msg) =>
    console.log(
      `\x1b[32m[SUCCESS]\x1b[0m ${new Date().toISOString()} - ${msg}`,
    ),
  error: (msg, error = null) => {
    console.error(
      `\x1b[31m[ERROR]\x1b[0m ${new Date().toISOString()} - ${msg}`,
    );
    if (error && CONFIG.VERBOSE) console.error(error);
  },
  warn: (msg) =>
    console.log(`\x1b[33m[WARN]\x1b[0m ${new Date().toISOString()} - ${msg}`),
  progress: (current, total) => {
    const percent = Math.round((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.round((barLength * current) / total);
    const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);
    process.stdout.write(
      `\r\x1b[35m[PROGRESS]\x1b[0m ${bar} ${percent}% (${current}/${total})`,
    );
    if (current === total) console.log("\n");
  },
};

// ============================================================
// EVENT SCHEMA (Match your actual schema)
// ============================================================
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "conference",
        "workshop",
        "social",
        "career",
        "sports",
        "academic",
        "cultural",
        "other",
      ],
      default: "other",
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        "conference",
        "workshop",
        "seminar",
        "webinar",
        "social",
        "sports",
        "career",
        "academic",
      ],
      default: "other",
    },
    organizer: {
      type: String,
      required: true,
    },
    organizerEmail: {
      type: String,
      default: "",
    },
    capacity: {
      type: Number,
      default: 100,
      min: 1,
      max: 10000,
    },
    registered: {
      type: Number,
      default: 0,
      min: 0,
    },
    registrationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    registrationDeadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled", "draft"],
      default: "upcoming",
      index: true,
    },
    participationMode: {
      type: String,
      enum: ["physical", "virtual", "hybrid"],
      default: "physical",
    },
    image: {
      type: String,
      default: null,
    },
    gallery: [String],
    tags: [String],
    requirements: [String],
    targetAudience: {
      type: [String],
      default: ["students", "staff", "faculty"],
    },
    maxRegistrationsPerUser: {
      type: Number,
      default: 1,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for available spots
eventSchema.virtual("availableSpots").get(function () {
  return Math.max(0, this.capacity - this.registered);
});

// Virtual for fill rate
eventSchema.virtual("fillRate").get(function () {
  return this.capacity > 0 ? (this.registered / this.capacity) * 100 : 0;
});

// Indexes
eventSchema.index({ date: -1, status: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ title: "text", description: "text" });
eventSchema.index({ slug: 1 });

const Event = mongoose.model("Event", eventSchema);

// ============================================================
// COMPREHENSIVE SAMPLE EVENTS DATA (With IDs 1-10)
// ============================================================
const sampleEvents = [
  // ID 1: Annual Tech Conference 2025
  {
    title: "Annual Tech Conference 2025",
    description:
      "Join us for a full-day technology conference featuring keynotes from industry leaders, hands-on workshops, and networking opportunities. Learn about AI, Cloud Computing, Cybersecurity, and more. This is the premier technology event of the year, bringing together innovators, developers, and tech enthusiasts from across the region.",
    summary: "The premier technology event of the year",
    date: new Date(Date.now() + 7 * 86400000),
    endDate: new Date(Date.now() + 7 * 86400000 + 8 * 3600000),
    location: "Main Auditorium, Block A",
    venue: "Main Auditorium",
    category: "conference",
    eventType: "conference",
    organizer: "IT Department",
    organizerEmail: "it@kaaf.edu",
    capacity: 500,
    registered: 342,
    registrationFee: 0,
    registrationDeadline: new Date(Date.now() + 3 * 86400000),
    status: "upcoming",
    participationMode: "physical",
    tags: [
      "technology",
      "conference",
      "networking",
      "ai",
      "cloud",
      "cybersecurity",
    ],
    requirements: [
      "Valid Student ID",
      "Registration Confirmation",
      "Laptop (optional)",
    ],
    targetAudience: ["students", "staff", "faculty", "public"],
    isPublished: true,
    slug: "annual-tech-conference-2025",
  },
  // ID 2: Student Leadership Workshop
  {
    title: "Student Leadership Workshop",
    description:
      "An interactive workshop designed to develop leadership skills, team building, effective communication, and decision-making for student leaders. Participants will engage in practical exercises, case studies, and group discussions. Learn from experienced leaders and network with fellow student leaders.",
    summary: "Develop essential leadership skills",
    date: new Date(Date.now() + 3 * 86400000),
    endDate: new Date(Date.now() + 3 * 86400000 + 3 * 3600000),
    location: "Conference Room B, Admin Block",
    venue: "Conference Room B",
    category: "workshop",
    eventType: "workshop",
    organizer: "Student Affairs",
    organizerEmail: "studentaffairs@kaaf.edu",
    capacity: 80,
    registered: 78,
    registrationFee: 0,
    registrationDeadline: new Date(Date.now() + 1 * 86400000),
    status: "upcoming",
    participationMode: "physical",
    tags: [
      "leadership",
      "workshop",
      "students",
      "development",
      "communication",
    ],
    requirements: [
      "Must be a student leader",
      "Recommendation letter",
      "Commitment to attend all sessions",
    ],
    targetAudience: ["students"],
    isPublished: true,
    slug: "student-leadership-workshop",
  },
  // ID 3: Cultural Night 2025
  {
    title: "Cultural Night 2025",
    description:
      "Celebrate the rich diversity of our university community with performances, food, and cultural exhibitions from around the world. Experience music, dance, art, and cuisine from various cultures represented on campus. A night of entertainment, food, and cultural exchange you won't want to miss!",
    summary: "A night of cultural celebration",
    date: new Date(Date.now() + 14 * 86400000),
    endDate: new Date(Date.now() + 14 * 86400000 + 5 * 3600000),
    location: "Open Grounds, Main Campus",
    venue: "Open Grounds",
    category: "cultural",
    eventType: "social",
    organizer: "Cultural Committee",
    organizerEmail: "cultural@kaaf.edu",
    capacity: 1000,
    registered: 210,
    registrationFee: 0,
    registrationDeadline: new Date(Date.now() + 7 * 86400000),
    status: "upcoming",
    participationMode: "physical",
    tags: ["culture", "music", "food", "dance", "entertainment", "diversity"],
    requirements: ["Valid ID"],
    targetAudience: ["students", "staff", "faculty", "public", "alumni"],
    isPublished: true,
    slug: "cultural-night-2025",
  },
  // ID 4: Career Fair & Recruitment Drive
  {
    title: "Career Fair & Recruitment Drive",
    description:
      "Connect with top employers across industries. Bring your resume and meet recruiters from leading companies looking for talented graduates. On-the-spot interviews, resume reviews, and networking opportunities available. Don't miss this chance to kickstart your career!",
    summary: "Meet top employers and land your dream job",
    date: new Date(Date.now() + 10 * 86400000),
    endDate: new Date(Date.now() + 10 * 86400000 + 4 * 3600000),
    location: "Sports Complex, Ground Floor",
    venue: "Sports Complex",
    category: "career",
    eventType: "career",
    organizer: "Career Services",
    organizerEmail: "careers@kaaf.edu",
    capacity: 600,
    registered: 401,
    registrationFee: 0,
    registrationDeadline: new Date(Date.now() + 5 * 86400000),
    status: "upcoming",
    participationMode: "physical",
    tags: ["career", "jobs", "networking", "recruitment", "interview"],
    requirements: [
      "Professional attire",
      "Updated resume",
      "Portfolio (optional)",
    ],
    targetAudience: ["students", "alumni"],
    isPublished: true,
    slug: "career-fair-recruitment-drive",
  },
  // ID 5: Sports Day 2025
  {
    title: "Sports Day 2025",
    description:
      "Annual inter-departmental sports competition featuring football, basketball, volleyball, athletics, table tennis, and more. Join the excitement and represent your department! Prizes for winners and participation certificates for all. Come show your sportsmanship and team spirit!",
    summary: "Annual inter-departmental sports competition",
    date: new Date(Date.now() + 5 * 86400000),
    endDate: new Date(Date.now() + 5 * 86400000 + 8 * 3600000),
    location: "University Sports Grounds",
    venue: "Sports Grounds",
    category: "sports",
    eventType: "sports",
    organizer: "Sports Department",
    organizerEmail: "sports@kaaf.edu",
    capacity: 300,
    registered: 150,
    registrationFee: 0,
    registrationDeadline: new Date(Date.now() + 2 * 86400000),
    status: "upcoming",
    participationMode: "physical",
    tags: ["sports", "competition", "fitness", "team", "athletics"],
    requirements: ["Sports kit", "Medical clearance", "Team registration"],
    targetAudience: ["students", "staff", "faculty"],
    isPublished: true,
    slug: "sports-day-2025",
  },
  // ID 6: AI & Machine Learning Summit
  {
    title: "AI & Machine Learning Summit",
    description:
      "Explore the future of artificial intelligence and machine learning with expert speakers, panel discussions, and hands-on workshops. Learn about the latest advancements in deep learning, neural networks, and real-world applications. Perfect for students, researchers, and professionals interested in AI.",
    summary: "The future of AI is here",
    date: new Date(Date.now() + 21 * 86400000),
    endDate: new Date(Date.now() + 21 * 86400000 + 6 * 3600000),
    location: "Engineering Block, Lecture Theatre",
    venue: "Engineering Block",
    category: "academic",
    eventType: "conference",
    organizer: "Computer Science Department",
    organizerEmail: "cs@kaaf.edu",
    capacity: 200,
    registered: 89,
    registrationFee: 50,
    registrationDeadline: new Date(Date.now() + 14 * 86400000),
    status: "upcoming",
    participationMode: "hybrid",
    tags: ["ai", "machine learning", "technology", "academic", "deep learning"],
    requirements: ["Basic programming knowledge", "Laptop"],
    targetAudience: ["students", "faculty", "professionals"],
    isPublished: true,
    slug: "ai-machine-learning-summit",
  },
  // ID 7: Alumni Homecoming Gala
  {
    title: "Alumni Homecoming Gala",
    description:
      "A formal evening bringing together alumni from all graduating classes. Reconnect with old friends, make new connections, and celebrate your alma mater. Enjoy dinner, music, and special recognition of outstanding alumni. Black-tie optional.",
    summary: "Reconnect with fellow alumni",
    date: new Date(Date.now() + 30 * 86400000),
    endDate: new Date(Date.now() + 30 * 86400000 + 4 * 3600000),
    location: "Grand Hall, Administration Block",
    venue: "Grand Hall",
    category: "social",
    eventType: "social",
    organizer: "Alumni Relations",
    organizerEmail: "alumni@kaaf.edu",
    capacity: 250,
    registered: 118,
    registrationFee: 100,
    registrationDeadline: new Date(Date.now() + 20 * 86400000),
    status: "upcoming",
    participationMode: "physical",
    tags: ["alumni", "networking", "gala", "formal", "reunion"],
    requirements: ["Formal attire", "Registration confirmation", "Valid ID"],
    targetAudience: ["alumni", "staff"],
    isPublished: true,
    slug: "alumni-homecoming-gala",
  },
  // ID 8: Research Symposium 2025
  {
    title: "Research Symposium 2025",
    description:
      "Showcase your research and learn from fellow researchers across all disciplines. Submit your abstracts and present your work. Awards for best presentations in each category. This is an excellent opportunity to gain feedback on your research and network with faculty.",
    summary: "Showcase your research",
    date: new Date(Date.now() + 18 * 86400000),
    endDate: new Date(Date.now() + 18 * 86400000 + 7 * 3600000),
    location: "Research Center, Conference Hall",
    venue: "Research Center",
    category: "academic",
    eventType: "academic",
    organizer: "Research Office",
    organizerEmail: "research@kaaf.edu",
    capacity: 150,
    registered: 95,
    registrationFee: 25,
    registrationDeadline: new Date(Date.now() + 10 * 86400000),
    status: "upcoming",
    participationMode: "physical",
    tags: ["research", "academic", "presentation", "poster", "symposium"],
    requirements: [
      "Abstract submission",
      "Research poster",
      "Registration fee",
    ],
    targetAudience: ["faculty", "students", "researchers"],
    isPublished: true,
    slug: "research-symposium-2025",
  },
  // ID 9: Wellness & Mindfulness Workshop
  {
    title: "Wellness & Mindfulness Workshop",
    description:
      "Learn techniques for stress management, meditation, and maintaining mental wellness in academic life. This workshop covers practical strategies for reducing anxiety, improving focus, and achieving work-life balance. Open to all students, staff, and faculty.",
    summary: "Take care of your mental health",
    date: new Date(Date.now() + 12 * 86400000),
    endDate: new Date(Date.now() + 12 * 86400000 + 2 * 3600000),
    location: "Wellness Center, Room 101",
    venue: "Wellness Center",
    category: "workshop",
    eventType: "workshop",
    organizer: "Counseling Services",
    organizerEmail: "counseling@kaaf.edu",
    capacity: 50,
    registered: 32,
    registrationFee: 0,
    registrationDeadline: new Date(Date.now() + 8 * 86400000),
    status: "upcoming",
    participationMode: "physical",
    tags: ["wellness", "mental health", "mindfulness", "stress", "meditation"],
    requirements: ["Comfortable clothing", "Yoga mat (optional)"],
    targetAudience: ["students", "staff", "faculty"],
    isPublished: true,
    slug: "wellness-mindfulness-workshop",
  },
  // ID 10: Entrepreneurship Bootcamp
  {
    title: "Entrepreneurship Bootcamp",
    description:
      "Intensive 2-day bootcamp for aspiring entrepreneurs. Learn from successful founders, develop business plans, and pitch your ideas to investors. Topics include business model canvas, customer discovery, fundraising, and scaling. Work in teams and get hands-on experience.",
    summary: "Launch your startup journey",
    date: new Date(Date.now() + 25 * 86400000),
    endDate: new Date(Date.now() + 27 * 86400000),
    location: "Business School, Innovation Hub",
    venue: "Innovation Hub",
    category: "workshop",
    eventType: "workshop",
    organizer: "Entrepreneurship Club",
    organizerEmail: "entrepreneurship@kaaf.edu",
    capacity: 40,
    registered: 25,
    registrationFee: 75,
    registrationDeadline: new Date(Date.now() + 18 * 86400000),
    status: "upcoming",
    participationMode: "physical",
    tags: ["entrepreneurship", "business", "startup", "innovation", "pitch"],
    requirements: ["Business idea", "Team of 2-4 people", "Laptop"],
    targetAudience: ["students", "alumni"],
    isPublished: true,
    slug: "entrepreneurship-bootcamp",
  },
  // Ongoing Event
  {
    title: "Spring Career Expo",
    description:
      "Connect with top employers from various industries. On-the-spot interviews and resume reviews available. This is an ongoing event that runs throughout the week. Drop by anytime to meet recruiters and learn about job opportunities.",
    summary: "Ongoing career expo",
    date: new Date(Date.now() - 1 * 86400000),
    endDate: new Date(Date.now() + 1 * 86400000),
    location: "Convention Center",
    venue: "Convention Center",
    category: "career",
    eventType: "career",
    organizer: "Career Services",
    organizerEmail: "careers@kaaf.edu",
    capacity: 500,
    registered: 450,
    registrationFee: 0,
    registrationDeadline: new Date(Date.now() - 2 * 86400000),
    status: "ongoing",
    participationMode: "physical",
    tags: ["career", "jobs", "expo", "networking"],
    requirements: ["Professional attire", "Resume copies", "Portfolio"],
    targetAudience: ["students", "alumni"],
    isPublished: true,
    slug: "spring-career-expo",
  },
  // Completed Event
  {
    title: "Past Event: Tech Summit 2024",
    description:
      "A successful technology summit held last year. This event featured keynotes from industry leaders and hands-on workshops. While this event has passed, you can still access presentation slides and recordings.",
    summary: "Annual tech summit (completed)",
    date: new Date(Date.now() - 365 * 86400000),
    endDate: new Date(Date.now() - 364 * 86400000),
    location: "Main Auditorium",
    venue: "Main Auditorium",
    category: "conference",
    eventType: "conference",
    organizer: "IT Department",
    organizerEmail: "it@kaaf.edu",
    capacity: 300,
    registered: 300,
    registrationFee: 0,
    registrationDeadline: new Date(Date.now() - 370 * 86400000),
    status: "completed",
    participationMode: "physical",
    tags: ["technology", "past event", "conference"],
    requirements: [],
    targetAudience: ["students", "staff"],
    isPublished: true,
    slug: "past-event-tech-summit-2024",
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================
const validateEvent = (event) => {
  const errors = [];

  if (!event.title) errors.push("Title is required");
  if (!event.description) errors.push("Description is required");
  if (!event.date) errors.push("Date is required");
  if (!event.endDate) errors.push("End date is required");
  if (!event.location) errors.push("Location is required");
  if (!event.organizer) errors.push("Organizer is required");
  if (event.date && event.endDate && event.date > event.endDate) {
    errors.push("End date must be after start date");
  }
  if (event.capacity && event.capacity < 1) {
    errors.push("Capacity must be at least 1");
  }

  return errors;
};

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

// ============================================================
// MAIN SEEDING FUNCTION
// ============================================================
async function seedEvents() {
  const startTime = Date.now();

  logger.info("🚀 Starting event seeding process...");
  logger.info(`📊 Mode: ${CONFIG.DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}`);
  logger.info(`🗄️  Database: ${CONFIG.MONGODB_URI}`);

  if (CONFIG.DRY_RUN) {
    logger.warn("⚠️  DRY RUN MODE - No changes will be made to the database");
  }

  if (CONFIG.CLEAR_FIRST && !CONFIG.DRY_RUN) {
    logger.warn("⚠️  Clearing all existing events...");
    await Event.deleteMany({});
    logger.success("✅ All events cleared");
  }

  try {
    // Connect to MongoDB
    logger.info("🔌 Connecting to MongoDB...");
    await mongoose.connect(CONFIG.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.success("✅ Connected to MongoDB successfully");

    // Check existing events
    const existingCount = await Event.countDocuments();
    logger.info(`📊 Existing events in database: ${existingCount}`);

    if (existingCount > 0 && !CONFIG.FORCE && !CONFIG.CLEAR_FIRST) {
      logger.warn(
        "⚠️  Database already has events. Use --force to upsert or --clear-first to clear all.",
      );
      logger.info("💡 Tips:");
      logger.info("   • Run with --force to upsert events");
      logger.info("   • Run with --clear-first to clear all events first");
      logger.info("   • Run with --dry-run to preview changes");

      const answer = await new Promise((resolve) => {
        process.stdin.once("data", (data) => {
          resolve(data.toString().trim().toLowerCase());
        });
        console.log(
          "\x1b[33m❓ Do you want to continue anyway? (y/N): \x1b[0m",
        );
      });

      if (answer !== "y" && answer !== "yes") {
        logger.info("❌ Seeding cancelled by user");
        process.exit(0);
      }
    }

    // Process events
    let created = 0;
    let updated = 0;
    let errors = [];

    for (let i = 0; i < sampleEvents.length; i++) {
      const eventData = sampleEvents[i];
      logger.progress(i + 1, sampleEvents.length);

      // Validate event data
      const validationErrors = validateEvent(eventData);
      if (validationErrors.length > 0) {
        errors.push({ title: eventData.title, errors: validationErrors });
        logger.error(
          `Validation failed for "${eventData.title}": ${validationErrors.join(", ")}`,
        );
        continue;
      }

      // Add slug if not present
      const eventToSave = {
        ...eventData,
        slug: eventData.slug || generateSlug(eventData.title),
      };

      if (CONFIG.DRY_RUN) {
        logger.info(`[DRY RUN] Would save: ${eventData.title}`);
        created++;
        continue;
      }

      // Upsert event
      const result = await Event.findOneAndUpdate(
        { title: eventData.title },
        eventToSave,
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      if (result.isNew) {
        created++;
        logger.success(`✨ Created new event: ${eventData.title}`);
      } else {
        updated++;
        logger.info(`🔄 Updated existing event: ${eventData.title}`);
      }
    }

    // Print summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(60));
    logger.success("📋 SEEDING COMPLETE");
    console.log("=".repeat(60));
    logger.info(`⏱️  Time taken: ${duration} seconds`);
    logger.info(`📊 Total events processed: ${sampleEvents.length}`);

    if (!CONFIG.DRY_RUN) {
      logger.success(`✨ New events created: ${created}`);
      logger.info(`🔄 Existing events updated: ${updated}`);
    }

    if (errors.length > 0) {
      logger.warn(`⚠️  Events with errors: ${errors.length}`);
      if (CONFIG.VERBOSE) {
        console.log("\nError details:");
        errors.forEach((err) => {
          console.log(`  - ${err.title}: ${err.errors.join(", ")}`);
        });
      }
    }

    // Verify final count
    const finalCount = await Event.countDocuments();
    logger.info(`📊 Final event count in database: ${finalCount}`);

    // Show all upcoming events with IDs
    const upcomingEvents = await Event.find({ status: "upcoming" })
      .sort({ date: 1 })
      .select("title date capacity registered slug");

    if (upcomingEvents.length > 0) {
      console.log("\n📅 Upcoming Events:");
      upcomingEvents.forEach((event, idx) => {
        console.log(`  ${idx + 1}. ${event.title}`);
        console.log(`     📍 Date: ${event.date.toLocaleDateString()}`);
        console.log(`     👥 Spots: ${event.registered}/${event.capacity}`);
        console.log(`     🔗 Slug: ${event.slug}\n`);
      });
    }

    // Show event IDs for reference
    const allEvents = await Event.find({}).select("title slug");
    console.log("\n📋 All Events in Database:");
    allEvents.forEach((event, idx) => {
      console.log(`  ${idx + 1}. ${event.title} (slug: ${event.slug})`);
    });
  } catch (error) {
    logger.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      logger.info("🔌 MongoDB connection closed");
    }
  }
}

// ============================================================
// COMMAND LINE INTERFACE
// ============================================================
function showHelp() {
  console.log(`
\x1b[36m╔══════════════════════════════════════════════════════════════╗
║              EVENT SEEDING SCRIPT - HELP                          ║
╚══════════════════════════════════════════════════════════════════╝\x1b[0m

\x1b[33mUsage:\x1b[0m
  node seedEvents.js [options]

\x1b[33mOptions:\x1b[0m
  --dry-run       Preview what would be added without modifying database
  --verbose       Show detailed output and debug information
  --force         Force upsert even if events already exist
  --clear-first   Clear all existing events before seeding
  --help          Show this help message

\x1b[33mExamples:\x1b[0m
  node seedEvents.js                 # Normal execution
  node seedEvents.js --dry-run       # Preview only
  node seedEvents.js --verbose       # With detailed output
  node seedEvents.js --force         # Force overwrite existing
  node seedEvents.js --clear-first   # Clear all then seed fresh

\x1b[33mEnvironment Variables:\x1b[0m
  MONGODB_URI    MongoDB connection string (default: mongodb://localhost:27017/kaaf_noticeboard)

\x1b[33mCreated Events (IDs 1-10):\x1b[0m
  1. Annual Tech Conference 2025 (Conference)
  2. Student Leadership Workshop (Workshop)
  3. Cultural Night 2025 (Cultural)
  4. Career Fair & Recruitment Drive (Career)
  5. Sports Day 2025 (Sports)
  6. AI & Machine Learning Summit (Academic)
  7. Alumni Homecoming Gala (Social)
  8. Research Symposium 2025 (Academic)
  9. Wellness & Mindfulness Workshop (Workshop)
  10. Entrepreneurship Bootcamp (Workshop)
  + Spring Career Expo (Ongoing)
  + Past Event: Tech Summit 2024 (Completed)

\x1b[33mNote:\x1b[0m
  This script will create or update events in your database.
  Use --dry-run to preview changes before applying.
`);
}

// Parse command line arguments
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  showHelp();
  process.exit(0);
}

// Run the seeding
seedEvents()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Fatal error:", error);
    process.exit(1);
  });
