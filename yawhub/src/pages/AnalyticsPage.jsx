// src/pages/AnalyticsPage.jsx - FIXED VERSION
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiUsers,
  FiEye,
  FiTrendingUp,
  FiDownload,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiUserCheck,
  FiUserX,
  FiAward,
  FiStar,
  FiHeart,
  FiThumbsUp,
  FiShare2,
  FiMessageCircle,
} from "react-icons/fi";
import {
  MdEvent,
  MdAnalytics,
  MdTimeline,
  MdShowChart,
  MdPieChart,
  MdBarChart,
  MdLineStyle,
  MdTrendingUp,
  MdTrendingDown,
  MdEqualizer,
  MdAssessment,
  MdInsights,
} from "react-icons/md";
import "../styles/components/AnalyticsPage.css";

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("week");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState("overview");

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalyticsData({
        overview: {
          totalUsers: 1247,
          activeUsers: 892,
          newUsersThisMonth: 156,
          totalEvents: 48,
          upcomingEvents: 12,
          completedEvents: 36,
          totalRegistrations: 3421,
          attendanceRate: 78.5,
          engagementScore: 8.4,
        },
        userGrowth: [
          { month: "Jan", users: 850 },
          { month: "Feb", users: 920 },
          { month: "Mar", users: 980 },
          { month: "Apr", users: 1050 },
          { month: "May", users: 1120 },
          { month: "Jun", users: 1247 },
        ],
        eventStats: [
          { name: "Tech Conference", registrations: 450, attendance: 380 },
          { name: "Workshop", registrations: 280, attendance: 245 },
          { name: "Seminar", registrations: 320, attendance: 290 },
          { name: "Webinar", registrations: 410, attendance: 365 },
        ],
        popularEvents: [
          {
            id: 1,
            name: "Annual Tech Conference",
            registrations: 450,
            views: 2340,
          },
          { id: 2, name: "Leadership Summit", registrations: 380, views: 1890 },
          {
            id: 3,
            name: "Innovation Workshop",
            registrations: 320,
            views: 1560,
          },
        ],
        userActivity: {
          daily: [120, 135, 148, 162, 175, 188, 201],
          weekly: [850, 920, 980, 1050, 1120, 1180, 1247],
          monthly: [3200, 3450, 3680, 3920, 4150, 4380, 4620],
        },
      });
      setLoading(false);
    }, 1000);
  }, []);

  const metrics = [
    { id: "overview", label: "Overview", icon: <MdAssessment size={20} /> },
    { id: "users", label: "Users", icon: <FiUsers size={20} /> },
    { id: "events", label: "Events", icon: <MdEvent size={20} /> },
    { id: "engagement", label: "Engagement", icon: <FiActivity size={20} /> },
  ];

  const StatCard = ({ title, value, change, icon, color }) => (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className="stat-card-header">
        <div className={`stat-icon ${color}`}>{icon}</div>
        <div className="stat-info">
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
          {change && (
            <div
              className={`stat-change ${change > 0 ? "positive" : "negative"}`}
            >
              {change > 0 ? "↑" : "↓"} {Math.abs(change)}% from last month
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  // FIXED: ChartBar component that properly handles objects
  const ChartBar = ({ data, height = 200 }) => {
    // Extract values based on data structure
    const values = data.map((item) => {
      if (typeof item === "number") return item;
      if (item.value) return item.value;
      if (item.users) return item.users;
      if (item.registrations) return item.registrations;
      return 0;
    });

    const maxValue = Math.max(...values);

    return (
      <div className="chart-bar-container" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          // Get the value based on data structure
          let value = 0;
          let label = "";

          if (typeof item === "number") {
            value = item;
            label = `${index + 1}`;
          } else if (item.value) {
            value = item.value;
            label = item.label || `${index + 1}`;
          } else if (item.users) {
            value = item.users;
            label = item.month || `${index + 1}`;
          } else if (item.registrations) {
            value = item.registrations;
            label = item.name || `${index + 1}`;
          } else {
            value = 0;
            label = `${index + 1}`;
          }

          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div key={index} className="chart-bar-item">
              <motion.div
                className="chart-bar-wrapper"
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="chart-bar" style={{ height: `${percentage}%` }}>
                  <span className="chart-bar-value">{value}</span>
                </div>
              </motion.div>
              <div className="chart-bar-label">{label}</div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">
            <MdAnalytics className="title-icon" /> Analytics Dashboard
          </h1>
          <p className="analytics-subtitle">
            Track your platform's performance and user engagement
          </p>
        </div>
        <div className="header-actions">
          <div className="date-range-selector">
            <button
              className={`date-btn ${dateRange === "week" ? "active" : ""}`}
              onClick={() => setDateRange("week")}
            >
              Week
            </button>
            <button
              className={`date-btn ${dateRange === "month" ? "active" : ""}`}
              onClick={() => setDateRange("month")}
            >
              Month
            </button>
            <button
              className={`date-btn ${dateRange === "year" ? "active" : ""}`}
              onClick={() => setDateRange("year")}
            >
              Year
            </button>
          </div>
          <button className="export-btn">
            <FiDownload size={18} /> Export Report
          </button>
          <button className="refresh-btn">
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Metrics Tabs */}
      <div className="metrics-tabs">
        {metrics.map((metric) => (
          <button
            key={metric.id}
            className={`metric-tab ${selectedMetric === metric.id ? "active" : ""}`}
            onClick={() => setSelectedMetric(metric.id)}
          >
            {metric.icon}
            <span>{metric.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={analyticsData.overview.totalUsers.toLocaleString()}
          change={12.5}
          icon={<FiUsers size={24} />}
          color="primary"
        />
        <StatCard
          title="Active Users"
          value={analyticsData.overview.activeUsers.toLocaleString()}
          change={8.3}
          icon={<FiActivity size={24} />}
          color="success"
        />
        <StatCard
          title="Total Events"
          value={analyticsData.overview.totalEvents}
          change={5.2}
          icon={<MdEvent size={24} />}
          color="warning"
        />
        <StatCard
          title="Registrations"
          value={analyticsData.overview.totalRegistrations.toLocaleString()}
          change={15.8}
          icon={<FiUsers size={24} />}
          color="info"
        />
        <StatCard
          title="Attendance Rate"
          value={`${analyticsData.overview.attendanceRate}%`}
          change={3.2}
          icon={<FiUserCheck size={24} />}
          color="success"
        />
        <StatCard
          title="Engagement Score"
          value={`${analyticsData.overview.engagementScore}/10`}
          change={0.8}
          icon={<FiStar size={24} />}
          color="primary"
        />
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* User Growth Chart */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="chart-header">
            <h3 className="chart-title">
              <MdTrendingUp size={20} /> User Growth
            </h3>
            <select className="chart-select">
              <option>Last 6 months</option>
              <option>Last year</option>
              <option>All time</option>
            </select>
          </div>
          <ChartBar data={analyticsData.userGrowth} height={250} />
        </motion.div>

        {/* Event Performance */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="chart-header">
            <h3 className="chart-title">
              <MdBarChart size={20} /> Event Performance
            </h3>
            <select className="chart-select">
              <option>Registrations vs Attendance</option>
            </select>
          </div>
          <div className="double-chart">
            {analyticsData.eventStats.map((event, idx) => (
              <div key={idx} className="event-stat-item">
                <div className="event-stat-name">{event.name}</div>
                <div className="event-stat-bars">
                  <div className="stat-bar-wrapper">
                    <div className="stat-bar-label">Registrations</div>
                    <div className="stat-bar">
                      <div
                        className="stat-bar-fill registrations"
                        style={{
                          width: `${(event.registrations / 500) * 100}%`,
                        }}
                      >
                        <span>{event.registrations}</span>
                      </div>
                    </div>
                  </div>
                  <div className="stat-bar-wrapper">
                    <div className="stat-bar-label">Attendance</div>
                    <div className="stat-bar">
                      <div
                        className="stat-bar-fill attendance"
                        style={{ width: `${(event.attendance / 500) * 100}%` }}
                      >
                        <span>{event.attendance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Popular Events */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="chart-header">
            <h3 className="chart-title">
              <FiStar size={20} /> Popular Events
            </h3>
          </div>
          <div className="popular-events-list">
            {analyticsData.popularEvents.map((event, idx) => (
              <div key={event.id} className="popular-event-item">
                <div className="popular-event-rank">#{idx + 1}</div>
                <div className="popular-event-info">
                  <div className="popular-event-name">{event.name}</div>
                  <div className="popular-event-stats">
                    <span>
                      <FiUsers size={14} /> {event.registrations} registrations
                    </span>
                    <span>
                      <FiEye size={14} /> {event.views} views
                    </span>
                  </div>
                </div>
                <div className="popular-event-trend">
                  {idx === 0 && <FiTrendingUp className="trend-up" />}
                  {idx === 1 && <FiActivity className="trend-neutral" />}
                  {idx === 2 && <FiTrendingUp className="trend-up" />}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Engagement Metrics */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="chart-header">
            <h3 className="chart-title">
              <FiHeart size={20} /> Engagement Metrics
            </h3>
          </div>
          <div className="engagement-metrics">
            <div className="metric-circle">
              <svg viewBox="0 0 100 100">
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
                <circle className="metric-circle-bg" cx="50" cy="50" r="45" />
                <circle
                  className="metric-circle-fill"
                  cx="50"
                  cy="50"
                  r="45"
                  style={{
                    strokeDasharray: 283,
                    strokeDashoffset:
                      283 - (283 * analyticsData.overview.engagementScore) / 10,
                  }}
                />
              </svg>
              <div className="metric-circle-value">
                {analyticsData.overview.engagementScore}
                <span>/10</span>
              </div>
            </div>
            <div className="metric-details">
              <div className="metric-detail-item">
                <span className="metric-dot success"></span>
                <span>User Satisfaction: 8.9/10</span>
              </div>
              <div className="metric-detail-item">
                <span className="metric-dot warning"></span>
                <span>Retention Rate: 76%</span>
              </div>
              <div className="metric-detail-item">
                <span className="metric-dot info"></span>
                <span>Avg. Session: 12.4 min</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        className="activity-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="activity-header">
          <h3 className="activity-title">
            <FiActivity size={20} /> Recent Activity
          </h3>
          <button className="view-all-btn">View All</button>
        </div>
        <div className="activity-timeline">
          {[1, 2, 3, 4, 5].map((_, idx) => (
            <div key={idx} className="timeline-item">
              <div className="timeline-icon">
                <div className="timeline-dot"></div>
              </div>
              <div className="timeline-content">
                <div className="timeline-title">New user registration</div>
                <div className="timeline-description">
                  John Doe joined the platform
                </div>
                <div className="timeline-time">2 hours ago</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;
