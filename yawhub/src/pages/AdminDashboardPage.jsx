// src/pages/admin/AdminDashboardPage.jsx - Plain CSS Version
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiCalendar,
  FiBell,
  FiSettings,
  FiDownload,
  FiRefreshCw,
  FiTrendingUp,
  FiArrowRight,
  FiPlus,
  FiBarChart2,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiClock,
  FiMapPin,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiStar,
  FiHeart,
  FiShare2,
  FiBookmark,
  FiMessageSquare,
  FiMail,
  FiPhone,
  FiGlobe,
  FiTwitter,
  FiFacebook,
  FiInstagram,
  FiLinkedin,
  FiGithub,
  FiSun,
  FiMoon,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import {
  MdDashboard,
  MdEvent,
  MdNotifications,
  MdSettings as MdSettingsIcon,
  MdRefresh,
  MdDownload,
  MdTrendingUp,
  MdArrowForward,
  MdAdd,
  MdAnalytics,
  MdPeople,
  MdArticle,
  MdCheckCircle,
  MdCancel,
  MdSchedule,
  MdLocationOn,
  MdCalendarToday,
  MdAccessTime,
  MdVerified,
  MdStar,
  MdFavorite,
  MdShare,
} from "react-icons/md";
import "../styles/components/AdminDashboardPage.css";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const STATS = {
  totalUsers: 1247,
  newUsers: 156,
  totalEvents: 45,
  upcomingEvents: 12,
  totalNotices: 342,
  published: 289,
  totalRegs: 5678,
  regsMonth: 432,
};

const ACTIVITIES = [
  {
    id: 1,
    type: "user",
    action: "New user registered",
    user: "John Doe",
    time: "5 min ago",
    status: "success",
  },
  {
    id: 2,
    type: "event",
    action: "New event created",
    user: "Admin",
    time: "1 hr ago",
    status: "info",
  },
  {
    id: 3,
    type: "notice",
    action: "Notice published",
    user: "Sarah Smith",
    time: "2 hrs ago",
    status: "success",
  },
  {
    id: 4,
    type: "registration",
    action: "Event registration",
    user: "Michael Brown",
    time: "3 hrs ago",
    status: "pending",
  },
  {
    id: 5,
    type: "user",
    action: "User account updated",
    user: "Emily Davis",
    time: "5 hrs ago",
    status: "info",
  },
];

const EVENTS = [
  {
    id: 1,
    title: "Annual Tech Conference",
    date: "2025-04-20",
    registrations: 342,
    capacity: 500,
    status: "upcoming",
  },
  {
    id: 2,
    title: "Student Leadership Workshop",
    date: "2025-04-15",
    registrations: 78,
    capacity: 80,
    status: "upcoming",
  },
  {
    id: 3,
    title: "Cultural Night 2025",
    date: "2025-05-01",
    registrations: 210,
    capacity: 1000,
    status: "upcoming",
  },
];

// ─── Animated Counter Component ───────────────────────────────────────────────
const Counter = ({ value, duration = 1.4 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = () => {
    const hour = time.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      upcoming: {
        label: "Upcoming",
        color: "#fbbf24",
        bg: "rgba(251,191,36,0.1)",
      },
      ongoing: {
        label: "Ongoing",
        color: "#34d399",
        bg: "rgba(52,211,153,0.1)",
      },
      completed: {
        label: "Completed",
        color: "#64748b",
        bg: "rgba(100,116,139,0.07)",
      },
      cancelled: {
        label: "Cancelled",
        color: "#fb7185",
        bg: "rgba(251,113,133,0.1)",
      },
    };
    return configs[status] || configs.upcoming;
  };

  const getActivityIcon = (type) => {
    const icons = {
      user: <FiUsers size={16} />,
      event: <MdEvent size={16} />,
      notice: <MdArticle size={16} />,
      registration: <MdDashboard size={16} />,
    };
    return icons[type] || <MdDashboard size={16} />;
  };

  const getActivityColor = (status) => {
    const colors = {
      success: "#34d399",
      info: "#818cf8",
      pending: "#fbbf24",
    };
    return colors[status] || colors.info;
  };

  const statsCards = [
    {
      title: "Total Users",
      value: STATS.totalUsers,
      change: `+${STATS.newUsers}`,
      changeLabel: "this month",
      icon: <FiUsers size={26} />,
      color: "#4f46e5",
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Total Events",
      value: STATS.totalEvents,
      change: STATS.upcomingEvents,
      changeLabel: "upcoming",
      icon: <MdEvent size={26} />,
      color: "#d97706",
      onClick: () => navigate("/admin/events"),
    },
    {
      title: "Total Notices",
      value: STATS.totalNotices,
      change: STATS.published,
      changeLabel: "published",
      icon: <MdArticle size={26} />,
      color: "#0d9488",
      onClick: () => navigate("/admin/notices"),
    },
    {
      title: "Registrations",
      value: STATS.totalRegs,
      change: `+${STATS.regsMonth}`,
      changeLabel: "this month",
      icon: <FiBarChart2 size={26} />,
      color: "#be185d",
      onClick: () => navigate("/admin/analytics"),
    },
  ];

  const quickActions = [
    {
      label: "Create Event",
      icon: <MdAdd size={18} />,
      primary: true,
      onClick: () => navigate("/admin/events/create"),
    },
    {
      label: "Post Notice",
      icon: <MdArticle size={18} />,
      primary: false,
      onClick: () => navigate("/admin/notices/create"),
    },
    {
      label: "Manage Users",
      icon: <FiUsers size={18} />,
      primary: false,
      onClick: () => navigate("/admin/users"),
    },
    {
      label: "View Analytics",
      icon: <FiBarChart2 size={18} />,
      primary: false,
      onClick: () => navigate("/admin/analytics"),
    },
  ];

  return (
    <div className="dashboard-root">
      {/* Animated Background */}
      <div className="dashboard-bg" />
      <div className="dashboard-grid" />
      <div className="dashboard-orb orb-1" />
      <div className="dashboard-orb orb-2" />
      <div className="dashboard-orb orb-3" />

      <div className="dashboard-container">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.08, delayChildren: 0.1 },
            },
          }}
        >
          {/* Header Section */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 35 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            style={{ marginBottom: 28 }}
          >
            <div className="dashboard-header-card">
              <div className="header-content">
                <div>
                  <h1 className="dashboard-greeting">
                    {greeting()}, {user?.name?.split(" ")[0] || "Admin"}!
                  </h1>
                  <p className="dashboard-subtitle">
                    Here's what's happening with your platform today.
                  </p>
                  <div className="live-status">
                    <div className="live-dot" />
                    <span className="live-text">Live</span>
                    <div className="time-display">{formatTime(time)}</div>
                  </div>
                </div>
                <div className="header-actions">
                  <button
                    className="icon-btn"
                    onClick={() => navigate("/admin/notifications")}
                  >
                    <MdNotifications size={20} />
                    <span className="notification-dot" />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setRefresh(true);
                      setTimeout(() => setRefresh(false), 1000);
                    }}
                  >
                    <motion.div
                      animate={refresh ? { rotate: 360 } : { rotate: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      <MdRefresh size={20} />
                    </motion.div>
                  </button>
                  <button className="icon-btn">
                    <MdDownload size={20} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => navigate("/admin/settings")}
                  >
                    <MdSettingsIcon size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.07 } },
            }}
            className="stats-grid"
          >
            {statsCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                variants={{
                  hidden: { opacity: 0, scale: 0.92 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.5, delay: index * 0.07 },
                  },
                }}
                whileHover={{ y: -6 }}
                className="stat-card"
                onClick={stat.onClick}
                style={{
                  background: `linear-gradient(135deg, ${stat.color}, ${stat.color}cc)`,
                }}
              >
                <div className="stat-card-orb" />
                <div className="stat-card-shine" />
                <div className="stat-card-body">
                  <div className="stat-label">{stat.title}</div>
                  <div className="stat-value">
                    <Counter value={stat.value} />
                  </div>
                  <div className="stat-trend">
                    <FiTrendingUp size={13} />
                    <span>
                      {stat.change} {stat.changeLabel}
                    </span>
                  </div>
                </div>
                <div className="stat-icon-wrapper">{stat.icon}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Activities and Events Section */}
          <div className="two-column-grid">
            {/* Recent Activities */}
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -24 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
              }}
              className="glass-card"
            >
              <div className="card-header">
                <div className="section-title">
                  <div className="title-accent" />
                  Recent Activities
                </div>
                <button
                  className="view-all-btn"
                  onClick={() => navigate("/admin/activities")}
                >
                  View All <FiArrowRight size={14} />
                </button>
              </div>
              <div className="activities-list">
                {ACTIVITIES.map((activity, idx) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.07, duration: 0.4 }}
                    className="activity-item"
                  >
                    <div
                      className="activity-avatar"
                      style={{
                        backgroundColor: `${getActivityColor(activity.status)}18`,
                        color: getActivityColor(activity.status),
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-content">
                      <div className="activity-action">{activity.action}</div>
                      <div className="activity-meta">
                        by <strong>{activity.user}</strong> · {activity.time}
                      </div>
                    </div>
                    <div
                      className="activity-status"
                      style={{
                        backgroundColor: `${getActivityColor(activity.status)}18`,
                        color: getActivityColor(activity.status),
                      }}
                    >
                      {activity.status}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 35 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
              className="glass-card"
            >
              <div className="card-header">
                <div className="section-title">
                  <div className="title-accent" />
                  Upcoming Events
                </div>
                <button
                  className="view-all-btn"
                  onClick={() => navigate("/admin/events")}
                >
                  Manage <FiArrowRight size={14} />
                </button>
              </div>
              <div className="events-table">
                <div className="table-header">
                  <div>Event</div>
                  <div>Date</div>
                  <div>Capacity</div>
                  <div>Status</div>
                </div>
                <div className="table-body">
                  {EVENTS.map((event, idx) => {
                    const percentage = Math.round(
                      (event.registrations / event.capacity) * 100,
                    );
                    const barColor =
                      percentage >= 90
                        ? "#fb7185"
                        : percentage >= 70
                          ? "#fbbf24"
                          : "#34d399";
                    const statusConfig = getStatusConfig(event.status);
                    return (
                      <motion.div
                        key={event.id}
                        className="table-row"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + idx * 0.08, duration: 0.4 }}
                      >
                        <div className="event-name">{event.title}</div>
                        <div className="event-date">
                          <MdCalendarToday size={12} />
                          {formatDate(event.date)}
                        </div>
                        <div className="event-capacity">
                          <div className="capacity-text">
                            {event.registrations} / {event.capacity}
                          </div>
                          <div className="capacity-bar">
                            <div
                              className="capacity-fill"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <span
                            className="status-chip"
                            style={{
                              backgroundColor: statusConfig.bg,
                              color: statusConfig.color,
                            }}
                          >
                            <span
                              className="status-dot"
                              style={{ backgroundColor: statusConfig.color }}
                            />
                            {statusConfig.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <button
                className="create-event-btn"
                onClick={() => navigate("/admin/events/create")}
              >
                <FiPlus size={16} /> Create New Event
              </button>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 35 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            className="glass-card"
          >
            <div className="card-header">
              <div className="section-title">
                <div className="title-accent" />
                Quick Actions
              </div>
            </div>
            <div className="quick-actions-grid">
              {quickActions.map((action, idx) => (
                <motion.button
                  key={action.label}
                  variants={{
                    hidden: { opacity: 0, scale: 0.92 },
                    visible: {
                      opacity: 1,
                      scale: 1,
                      transition: { duration: 0.5, delay: idx * 0.06 },
                    },
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`quick-action-btn ${action.primary ? "primary" : "ghost"}`}
                  onClick={action.onClick}
                >
                  {action.icon}
                  {action.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
