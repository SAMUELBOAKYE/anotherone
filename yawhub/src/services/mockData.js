// src/services/mockData.js - Complete Mock Data System
import { faker } from "@faker-js/faker";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const MOCK_CONFIG = {
  USE_MOCK_DATA: true, // Set to false to use real API
  DELAY_RESPONSE: 500, // Simulate network delay (ms)
  ERROR_RATE: 0, // Percentage chance of error (0-100)
  PAGE_SIZE: 10,
  MAX_ITEMS: 100,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const delay = (ms = MOCK_CONFIG.DELAY_RESPONSE) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const shouldError = () => {
  if (MOCK_CONFIG.ERROR_RATE === 0) return false;
  return Math.random() * 100 < MOCK_CONFIG.ERROR_RATE;
};

const generateId = () =>
  Math.random().toString(36).substring(2, 10) + Date.now();

const formatDate = (date) => date.toISOString();

// ============================================================================
// MOCK USERS DATA
// ============================================================================

export const MOCK_USERS = {
  current: {
    id: "user_001",
    name: "Samuel Boakye",
    email: "boakyesamuel189@gmail.com",
    role: "admin",
    status: "active",
    avatar: `https://ui-avatars.com/api/?name=Samuel+Boakye&background=6366f1&color=fff`,
    studentId: "STU2024001",
    department: "Computer Science",
    yearOfStudy: "4th Year",
    phone: "+233 24 123 4567",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-06-01T14:20:00Z",
  },

  students: Array.from({ length: 50 }, (_, i) => ({
    id: `student_${i + 1}`,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: "student",
    status: faker.helpers.arrayElement(["active", "inactive", "suspended"]),
    avatar: faker.image.avatar(),
    studentId: `STU${String(i + 1).padStart(6, "0")}`,
    department: faker.helpers.arrayElement([
      "Computer Science",
      "Engineering",
      "Business",
      "Medicine",
      "Law",
      "Arts",
      "Sciences",
      "Education",
    ]),
    yearOfStudy: faker.helpers.arrayElement([
      "1st Year",
      "2nd Year",
      "3rd Year",
      "4th Year",
    ]),
    phone: faker.phone.number(),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
  })),

  staff: Array.from({ length: 20 }, (_, i) => ({
    id: `staff_${i + 1}`,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: "staff",
    status: "active",
    avatar: faker.image.avatar(),
    staffId: `STF${String(i + 1).padStart(6, "0")}`,
    department: faker.helpers.arrayElement([
      "Administration",
      "IT",
      "Finance",
      "HR",
      "Academic Affairs",
    ]),
    phone: faker.phone.number(),
    createdAt: faker.date.past({ years: 3 }).toISOString(),
  })),

  admins: [
    {
      id: "admin_001",
      name: "Samuel Boakye",
      email: "boakyesamuel189@gmail.com",
      role: "admin",
      status: "active",
      avatar: `https://ui-avatars.com/api/?name=Samuel+Boakye&background=6366f1&color=fff`,
      adminId: "ADM001",
      department: "IT Administration",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "admin_002",
      name: "Dr. Sarah Mensah",
      email: "sarah.mensah@kaaf.edu",
      role: "admin",
      status: "active",
      avatar: `https://ui-avatars.com/api/?name=Sarah+Mensah&background=764ba2&color=fff`,
      adminId: "ADM002",
      department: "Academic Affairs",
      createdAt: "2024-02-15T00:00:00Z",
    },
  ],
};

// ============================================================================
// MOCK EVENTS DATA
// ============================================================================

const generateEvent = (id, daysOffset, title, category) => ({
  id,
  title,
  description: faker.lorem.paragraphs(2),
  summary: faker.lorem.sentence(),
  date: formatDate(faker.date.future({ days: daysOffset })),
  endDate: formatDate(faker.date.future({ days: daysOffset + 1 })),
  location: faker.location.streetAddress(),
  venue: faker.location.streetAddress(),
  category,
  eventType: category,
  organizer: faker.company.name(),
  capacity: faker.number.int({ min: 50, max: 1000 }),
  registered: faker.number.int({ min: 0, max: 500 }),
  registrationFee: faker.helpers.arrayElement([0, 50, 100, 200]),
  registrationDeadline: formatDate(faker.date.future({ days: daysOffset - 7 })),
  status:
    daysOffset > 0 ? "upcoming" : daysOffset < 0 ? "completed" : "ongoing",
  participationMode: faker.helpers.arrayElement([
    "physical",
    "virtual",
    "hybrid",
  ]),
  image: `https://picsum.photos/id/${faker.number.int({ min: 1, max: 100 })}/800/400`,
  tags: faker.helpers.arrayElements(
    [
      "technology",
      "workshop",
      "seminar",
      "conference",
      "networking",
      "career",
      "sports",
      "cultural",
    ],
    faker.number.int({ min: 2, max: 4 }),
  ),
  requirements: ["Valid Student ID", "Registration Confirmation"],
  createdAt: formatDate(faker.date.past()),
  updatedAt: formatDate(faker.date.recent()),
});

export const MOCK_EVENTS = {
  upcoming: [
    generateEvent("evt_001", 7, "Annual Tech Conference 2025", "conference"),
    generateEvent("evt_002", 3, "Student Leadership Workshop", "workshop"),
    generateEvent("evt_003", 14, "Cultural Night 2025", "social"),
    generateEvent("evt_004", 10, "Career Fair & Recruitment Drive", "career"),
    generateEvent("evt_005", 21, "AI & Machine Learning Summit", "conference"),
    generateEvent("evt_006", 5, "Design Thinking Workshop", "workshop"),
    generateEvent("evt_007", 28, "Alumni Homecoming", "social"),
    generateEvent("evt_008", 12, "Hackathon 2025", "workshop"),
    generateEvent("evt_009", 18, "Research Symposium", "academic"),
    generateEvent("evt_010", 25, "Sports Festival", "sports"),
  ],

  ongoing: [
    {
      id: "evt_ongoing_001",
      title: "Spring Career Expo",
      description: "Connect with top employers from various industries.",
      date: formatDate(faker.date.recent({ days: 1 })),
      endDate: formatDate(faker.date.future({ days: 2 })),
      location: "Convention Center",
      category: "career",
      status: "ongoing",
      registered: 450,
      capacity: 500,
    },
  ],

  completed: Array.from({ length: 10 }, (_, i) =>
    generateEvent(
      `evt_completed_${i + 1}`,
      -Math.abs(i + 1) * 7,
      `Past Event ${i + 1}`,
      "conference",
    ),
  ),

  all: [],
};

MOCK_EVENTS.all = [
  ...MOCK_EVENTS.upcoming,
  ...MOCK_EVENTS.ongoing,
  ...MOCK_EVENTS.completed,
];

export const getEventById = (id) => {
  return (
    MOCK_EVENTS.all.find((event) => event.id === id) || MOCK_EVENTS.upcoming[0]
  );
};

// ============================================================================
// MOCK REGISTRATIONS DATA
// ============================================================================

export const MOCK_REGISTRATIONS = {
  user: Array.from({ length: 8 }, (_, i) => ({
    id: `reg_${i + 1}`,
    eventId: MOCK_EVENTS.upcoming[i % MOCK_EVENTS.upcoming.length]?.id,
    event: MOCK_EVENTS.upcoming[i % MOCK_EVENTS.upcoming.length],
    registrationDate: formatDate(faker.date.recent({ days: 30 })),
    status: faker.helpers.arrayElement(["confirmed", "pending", "cancelled"]),
    ticketNumber: `TKT-${faker.string.alphanumeric(8).toUpperCase()}`,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TKT-${Date.now()}-${i}`,
    attended: faker.datatype.boolean(),
    feedbackSubmitted: faker.datatype.boolean(),
    rating: faker.helpers.arrayElement([null, 3, 4, 5]),
    paymentStatus: faker.helpers.arrayElement(["paid", "pending", "refunded"]),
    amount: faker.helpers.arrayElement([0, 50, 100]),
    createdAt: formatDate(faker.date.recent({ days: 30 })),
  })),

  all: [],
};

MOCK_REGISTRATIONS.all = MOCK_REGISTRATIONS.user;

// ============================================================================
// MOCK NOTIFICATIONS DATA
// ============================================================================

export const MOCK_NOTIFICATIONS = {
  items: Array.from({ length: 15 }, (_, i) => ({
    id: `notif_${i + 1}`,
    title: faker.helpers.arrayElement([
      "New Event Added",
      "Registration Confirmed",
      "Event Reminder",
      "Payment Received",
      "Event Cancelled",
      "New Notice Published",
    ]),
    message: faker.lorem.sentence(),
    type: faker.helpers.arrayElement(["info", "success", "warning", "error"]),
    read: faker.datatype.boolean({ probability: 0.3 }),
    createdAt: formatDate(faker.date.recent({ days: i + 1 })),
    link: faker.helpers.arrayElement(["/events", "/notices", "/dashboard"]),
  })),

  unreadCount: () => MOCK_NOTIFICATIONS.items.filter((n) => !n.read).length,
};

// ============================================================================
// MOCK NOTICES DATA
// ============================================================================

export const MOCK_NOTICES = {
  items: Array.from({ length: 20 }, (_, i) => ({
    id: `notice_${i + 1}`,
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(2),
    summary: faker.lorem.sentence(),
    category: faker.helpers.arrayElement([
      "Academic",
      "Administrative",
      "Event",
      "General",
      "Urgent",
    ]),
    author: faker.person.fullName(),
    authorRole: faker.helpers.arrayElement(["Admin", "Faculty", "Committee"]),
    publishedAt: formatDate(faker.date.recent({ days: i + 1 })),
    expiresAt: formatDate(faker.date.future({ days: 30 })),
    isImportant: faker.datatype.boolean({ probability: 0.2 }),
    attachments: faker.datatype.boolean()
      ? [{ name: "document.pdf", url: "#", size: "2.5 MB" }]
      : [],
    views: faker.number.int({ min: 10, max: 1000 }),
    createdAt: formatDate(faker.date.recent({ days: i + 1 })),
  })),
};

// ============================================================================
// MOCK ANALYTICS DATA
// ============================================================================

export const MOCK_ANALYTICS = {
  overview: {
    totalUsers: 1247,
    activeUsers: 892,
    newUsersThisMonth: 156,
    totalEvents: 45,
    upcomingEvents: 12,
    totalRegistrations: 5678,
    registrationRate: 68,
    totalNotices: 342,
    publishedNotices: 289,
    engagementRate: 72.5,
  },

  userGrowth: Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i, 1).toLocaleString("default", { month: "short" }),
    users: 800 + Math.floor(Math.random() * 500) + i * 30,
    newUsers: 50 + Math.floor(Math.random() * 150),
  })),

  eventStats: {
    byCategory: [
      { name: "Conference", value: 15, color: "#6366f1" },
      { name: "Workshop", value: 12, color: "#f59e0b" },
      { name: "Social", value: 8, color: "#10b981" },
      { name: "Career", value: 6, color: "#8b5cf6" },
      { name: "Sports", value: 4, color: "#ef4444" },
    ],
    byMonth: Array.from({ length: 6 }, (_, i) => ({
      month: new Date(2024, i + 6, 1).toLocaleString("default", {
        month: "short",
      }),
      events: 3 + Math.floor(Math.random() * 8),
      registrations: 50 + Math.floor(Math.random() * 200),
    })),
  },

  noticeStats: {
    byCategory: [
      { name: "Academic", value: 145 },
      { name: "Administrative", value: 98 },
      { name: "Event", value: 67 },
      { name: "General", value: 32 },
    ],
    monthlyTrend: Array.from({ length: 6 }, (_, i) => ({
      month: new Date(2024, i + 6, 1).toLocaleString("default", {
        month: "short",
      }),
      notices: 40 + Math.floor(Math.random() * 30),
      views: 200 + Math.floor(Math.random() * 300),
    })),
  },

  topEvents: MOCK_EVENTS.upcoming.slice(0, 5).map((event) => ({
    ...event,
    registrationCount: event.registered,
    fillRate: Math.round((event.registered / event.capacity) * 100),
  })),
};

// ============================================================================
// MOCK FEEDBACK DATA
// ============================================================================

export const MOCK_FEEDBACK = {
  items: Array.from({ length: 25 }, (_, i) => ({
    id: `feedback_${i + 1}`,
    eventId: faker.helpers.arrayElement(MOCK_EVENTS.all).id,
    userId: faker.helpers.arrayElement(MOCK_USERS.students).id,
    userName: faker.person.fullName(),
    rating: faker.number.int({ min: 1, max: 5 }),
    comment: faker.lorem.paragraph(),
    isAnonymous: faker.datatype.boolean({ probability: 0.3 }),
    createdAt: formatDate(faker.date.recent({ days: 30 })),
    eventTitle: faker.helpers.arrayElement(MOCK_EVENTS.all).title,
  })),

  averageRating: 4.2,
  totalReviews: 25,
};

// ============================================================================
// MOCK SETTINGS
// ============================================================================

export const MOCK_SETTINGS = {
  general: {
    siteName: "KAAF University Noticeboard",
    siteDescription: "Official noticeboard and event management platform",
    siteLogo: "/logo.png",
    favicon: "/favicon.ico",
    timezone: "Africa/Accra",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    itemsPerPage: 10,
  },
  appearance: {
    theme: "dark",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    borderRadius: 12,
    animations: true,
    compactMode: false,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordExpiryDays: 90,
    requireStrongPassword: true,
    ipWhitelist: ["192.168.1.1", "10.0.0.1"],
    allowedDomains: ["kaaf.edu", "kaaf.org", "gmail.com"],
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    smsAlerts: false,
    adminEmail: "admin@kaaf.edu",
    smtpConfig: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
    },
  },
};

// ============================================================================
// MOCK API SERVICE
// ============================================================================

export const mockApi = {
  // Users
  async getUsers(params = {}) {
    await delay();
    if (shouldError()) throw new Error("Failed to fetch users");

    let users = [
      ...MOCK_USERS.students,
      ...MOCK_USERS.staff,
      ...MOCK_USERS.admins,
    ];
    const { page = 1, limit = 10, role, status, search } = params;

    if (role && role !== "all") users = users.filter((u) => u.role === role);
    if (status && status !== "all")
      users = users.filter((u) => u.status === status);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.studentId?.toLowerCase().includes(q),
      );
    }

    const start = (page - 1) * limit;
    const paginated = users.slice(start, start + limit);

    return {
      success: true,
      data: paginated,
      total: users.length,
      page,
      totalPages: Math.ceil(users.length / limit),
    };
  },

  async getUserById(id) {
    await delay();
    const user = [
      ...MOCK_USERS.students,
      ...MOCK_USERS.staff,
      ...MOCK_USERS.admins,
    ].find((u) => u.id === id);
    return { success: true, data: user || null };
  },

  async getCurrentUser() {
    await delay();
    return { success: true, data: MOCK_USERS.current };
  },

  // Events
  async getEvents(params = {}) {
    await delay();
    let events = [...MOCK_EVENTS.all];
    const { page = 1, limit = 10, category, status, search } = params;

    if (category && category !== "all")
      events = events.filter((e) => e.category === category);
    if (status && status !== "all")
      events = events.filter((e) => e.status === status);
    if (search) {
      const q = search.toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q),
      );
    }

    const start = (page - 1) * limit;
    const paginated = events.slice(start, start + limit);

    return {
      success: true,
      data: paginated,
      total: events.length,
      page,
      totalPages: Math.ceil(events.length / limit),
    };
  },

  async getEventById(id) {
    await delay();
    const event = getEventById(id);
    return { success: true, data: event };
  },

  async registerForEvent(eventId, registrationData) {
    await delay(1000);
    return {
      success: true,
      message: "Successfully registered for the event!",
      data: {
        registrationId: generateId(),
        ticketNumber: `TKT-${Date.now()}`,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TKT-${Date.now()}`,
        eventId,
        ...registrationData,
      },
    };
  },

  async cancelRegistration(eventId, registrationId) {
    await delay();
    return {
      success: true,
      message: "Registration cancelled successfully",
    };
  },

  async getUserRegistrations() {
    await delay();
    return {
      success: true,
      data: MOCK_REGISTRATIONS.user,
    };
  },

  // Notices
  async getNotices(params = {}) {
    await delay();
    let notices = [...MOCK_NOTICES.items];
    const { page = 1, limit = 10, category, search } = params;

    if (category && category !== "all")
      notices = notices.filter((n) => n.category === category);
    if (search) {
      const q = search.toLowerCase();
      notices = notices.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q),
      );
    }

    const start = (page - 1) * limit;
    const paginated = notices.slice(start, start + limit);

    return {
      success: true,
      data: paginated,
      total: notices.length,
      page,
      totalPages: Math.ceil(notices.length / limit),
    };
  },

  async getNoticeById(id) {
    await delay();
    const notice = MOCK_NOTICES.items.find((n) => n.id === id);
    return { success: true, data: notice };
  },

  // Notifications
  async getNotifications() {
    await delay();
    return {
      success: true,
      data: MOCK_NOTIFICATIONS.items,
      unreadCount: MOCK_NOTIFICATIONS.unreadCount(),
    };
  },

  async markNotificationAsRead(notificationId) {
    await delay();
    return { success: true };
  },

  async markAllNotificationsAsRead() {
    await delay();
    return { success: true };
  },

  // Analytics
  async getAnalytics() {
    await delay();
    return { success: true, data: MOCK_ANALYTICS };
  },

  async getDashboardStats() {
    await delay();
    return {
      success: true,
      data: {
        totalUsers: MOCK_ANALYTICS.overview.totalUsers,
        activeUsers: MOCK_ANALYTICS.overview.activeUsers,
        totalEvents: MOCK_ANALYTICS.overview.totalEvents,
        upcomingEvents: MOCK_ANALYTICS.overview.upcomingEvents,
        totalRegistrations: MOCK_ANALYTICS.overview.totalRegistrations,
        totalNotices: MOCK_ANALYTICS.overview.totalNotices,
        userGrowth: MOCK_ANALYTICS.userGrowth,
        eventStats: MOCK_ANALYTICS.eventStats,
      },
    };
  },

  // Feedback
  async submitFeedback(eventId, feedback) {
    await delay();
    return {
      success: true,
      message: "Thank you for your feedback!",
      data: {
        id: generateId(),
        ...feedback,
        createdAt: new Date().toISOString(),
      },
    };
  },

  async getEventFeedback(eventId) {
    await delay();
    const feedback = MOCK_FEEDBACK.items.filter((f) => f.eventId === eventId);
    return { success: true, data: feedback };
  },

  // Settings
  async getSettings() {
    await delay();
    return { success: true, data: MOCK_SETTINGS };
  },

  async updateSettings(settings) {
    await delay();
    Object.assign(MOCK_SETTINGS, settings);
    return { success: true, message: "Settings updated successfully" };
  },
};

// ============================================================================
// HELPER FUNCTIONS FOR COMPONENTS
// ============================================================================

export const getEventStatusColor = (status) => {
  switch (status) {
    case "upcoming":
      return "#f59e0b";
    case "ongoing":
      return "#10b981";
    case "completed":
      return "#6b7280";
    case "cancelled":
      return "#ef4444";
    default:
      return "#6366f1";
  }
};

export const getEventStatusLabel = (status) => {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "ongoing":
      return "Ongoing";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(amount);
};

export const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(date).toLocaleDateString();
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  MOCK_CONFIG,
  MOCK_USERS,
  MOCK_EVENTS,
  MOCK_REGISTRATIONS,
  MOCK_NOTIFICATIONS,
  MOCK_NOTICES,
  MOCK_ANALYTICS,
  MOCK_FEEDBACK,
  MOCK_SETTINGS,
  mockApi,
  getEventById,
  getEventStatusColor,
  getEventStatusLabel,
  formatCurrency,
  formatRelativeTime,
};
