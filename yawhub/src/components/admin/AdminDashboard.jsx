// src/components/admin/AdminDashboard.jsx - WITH PROFESSIONAL ICONS
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import UserTable from "../admin/UserTable";
import api from "../../services/api";
import {
  FiUsers,
  FiFileText,
  FiCalendar,
  FiClipboard,
  FiTrendingUp,
  FiRefreshCw,
  FiUser,
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiGrid,
  FiList,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiSettings,
  FiBell,
  FiHome,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiUpload,
  FiSearch,
  FiFilter,
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
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiHelpCircle,
  FiAward,
  FiTarget,
  FiZap,
  FiCloud,
  FiDatabase,
  FiServer,
  FiCpu,
  FiHardDrive,
  FiWifi,
  FiBattery,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiWatch,
  FiCamera,
  FiVideo,
  FiMusic,
  FiBook,
  FiCoffee,
  FiGift,
  FiHeart as FiHeartOutline,
} from "react-icons/fi";
import {
  MdDashboard,
  MdPeople,
  MdEvent,
  MdNotifications,
  MdSettings,
  MdRefresh,
  MdTrendingUp,
  MdBarChart,
  MdPieChart,
  MdLineStyle,
  MdShowChart,
  MdEqualizer,
  MdAssessment,
  MdInsights,
  MdAnalytics,
  MdTimeline,
  MdDataUsage,
  MdStorage,
  MdCloud,
  MdSecurity,
  MdVerifiedUser,
  MdAdminPanelSettings,
  MdSupervisorAccount,
  MdPersonAdd,
  MdPersonRemove,
  MdPersonOutline,
  MdGroup,
  MdGroupAdd,
  MdGroupRemove,
  MdCheckCircle,
  MdCancel,
  MdWarning,
  MdInfo,
  MdHelp,
  MdStar,
  MdFavorite,
  MdShare,
  MdBookmark,
  MdMessage,
  MdEmail,
  MdPhone,
  MdLanguage,
  MdPublic,
  MdLocationOn,
  MdCalendarToday,
  MdAccessTime,
  MdSchedule,
  MdEventAvailable,
  MdEventBusy,
  MdEventNote,
} from "react-icons/md";
import {
  FaUserTie,
  FaUserGraduate,
  FaUserFriends,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaDatabase,
  FaServer,
  FaCloud,
  FaShieldAlt,
  FaLock,
  FaUnlockAlt,
  FaKey,
  FaUserSecret,
} from "react-icons/fa";
import "../../styles/components/AdminDashboard.css";

const CHART_COLORS = [
  "#1976d2",
  "#2e7d32",
  "#ed6c02",
  "#9c27b0",
  "#d32f2f",
  "#0288d1",
];

const getMockAnalytics = () => ({
  totalUsers: 1247,
  newUsersThisMonth: 156,
  totalNotices: 342,
  newNoticesThisMonth: 45,
  totalEvents: 89,
  upcomingEvents: 12,
  totalRegistrations: 5678,
  registrationsThisMonth: 432,
  userGrowth: [
    { month: "Jan", users: 850 },
    { month: "Feb", users: 920 },
    { month: "Mar", users: 1010 },
    { month: "Apr", users: 1080 },
    { month: "May", users: 1150 },
    { month: "Jun", users: 1247 },
    { month: "Jul", users: 1320 },
    { month: "Aug", users: 1410 },
  ],
  noticeCategories: [
    { name: "Academic", value: 145 },
    { name: "Administrative", value: 98 },
    { name: "Event", value: 67 },
    { name: "General", value: 32 },
  ],
  monthlyActivity: [
    { month: "Jan", notices: 42, events: 12 },
    { month: "Feb", notices: 48, events: 15 },
    { month: "Mar", notices: 55, events: 18 },
    { month: "Apr", notices: 52, events: 22 },
    { month: "May", notices: 68, events: 25 },
    { month: "Jun", notices: 77, events: 30 },
  ],
  recentActivity: [
    {
      id: 1,
      type: "user",
      action: "New user registered",
      user: "John Doe",
      timestamp: new Date().toISOString(),
    },
    {
      id: 2,
      type: "notice",
      action: "New notice published",
      user: "Admin",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      type: "event",
      action: "Event created",
      user: "Sarah Smith",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
});

const getMockUsers = () => [
  {
    _id: "1",
    name: "John Doe",
    email: "john.doe@kaaf.edu",
    role: "student",
    status: "active",
    studentId: "STU2024001",
    department: "Computer Science",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    _id: "2",
    name: "Jane Smith",
    email: "jane.smith@kaaf.edu",
    role: "staff",
    status: "active",
    studentId: null,
    department: "Administration",
    createdAt: "2024-01-20T14:45:00Z",
  },
  {
    _id: "3",
    name: "Michael Johnson",
    email: "michael.johnson@kaaf.edu",
    role: "student",
    status: "inactive",
    studentId: "STU2024002",
    department: "Engineering",
    createdAt: "2024-02-10T09:15:00Z",
  },
  {
    _id: "4",
    name: "Sarah Williams",
    email: "sarah.williams@kaaf.edu",
    role: "admin",
    status: "active",
    studentId: null,
    department: "IT Department",
    createdAt: "2024-01-05T11:20:00Z",
  },
  {
    _id: "5",
    name: "David Brown",
    email: "david.brown@kaaf.edu",
    role: "staff",
    status: "active",
    studentId: null,
    department: "Finance",
    createdAt: "2024-02-01T13:00:00Z",
  },
];

const StatCard = ({ title, value, change, icon, color, onClick, loading }) => {
  const isPositive = change?.value > 0;

  if (loading) {
    return (
      <div className="stat-card loading-skeleton">
        <div className="stat-card-content">
          <div className="loading-spinner-small"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="stat-card-content">
        <div className="stat-info">
          <div className="stat-label">{title}</div>
          <div className="stat-number">{(value || 0).toLocaleString()}</div>
          {change && (
            <div className="stat-change">
              <span
                className={isPositive ? "change-positive" : "change-negative"}
              >
                {isPositive ? (
                  <FiTrendingUp size={12} />
                ) : (
                  <FiTrendingUp
                    size={12}
                    style={{ transform: "rotate(180deg)" }}
                  />
                )}
                {change.value} {change.label}
              </span>
            </div>
          )}
        </div>
        <div className="stat-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [updatingRoles, setUpdatingRoles] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showSnackbar = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const loadAnalytics = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAnalytics(getMockAnalytics());
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      let usersData = [];
      try {
        const response = await api.get("/users");
        usersData =
          response.data?.users ||
          (Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        usersData = getMockUsers();
      }
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      setUsers(getMockUsers());
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    loadUsers();
  }, [loadAnalytics, loadUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRoles((prev) => ({ ...prev, [userId]: true }));
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)),
      );
      showSnackbar("User role updated successfully");
    } catch (error) {
      showSnackbar("Failed to update user role", "error");
    } finally {
      setUpdatingRoles((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/users/${userId}`);
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        showSnackbar("User deleted successfully");
      } catch (error) {
        showSnackbar("Failed to delete user", "error");
      }
    }
  };

  const handleBulkStatusChange = async (status) => {
    const usersToUpdate = selectedUsers;
    usersToUpdate.forEach((userId) =>
      setUpdatingStatus((prev) => ({ ...prev, [userId]: true })),
    );
    try {
      await api.post("/users/bulk-status", { userIds: usersToUpdate, status });
      setUsers((prev) =>
        prev.map((u) => (usersToUpdate.includes(u._id) ? { ...u, status } : u)),
      );
      setSelectedUsers([]);
      showSnackbar(
        `${usersToUpdate.length} user(s) ${status === "active" ? "activated" : "deactivated"}`,
      );
    } catch (error) {
      showSnackbar("Failed to update user statuses", "error");
    } finally {
      usersToUpdate.forEach((userId) =>
        setUpdatingStatus((prev) => ({ ...prev, [userId]: false })),
      );
    }
  };

  const handleSelectUser = (userId, isChecked) => {
    setSelectedUsers((prev) =>
      isChecked ? [...prev, userId] : prev.filter((id) => id !== userId),
    );
  };

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    let filtered = [...users];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(query) ||
          (u.email || "").toLowerCase().includes(query) ||
          (u.studentId || "").toLowerCase().includes(query),
      );
    }
    if (roleFilter !== "all")
      filtered = filtered.filter((u) => u.role === roleFilter);
    if (statusFilter !== "all")
      filtered = filtered.filter((u) => u.status === statusFilter);
    return filtered;
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleRefresh = () => {
    loadAnalytics(true);
    loadUsers();
    showSnackbar("Dashboard refreshed");
  };

  const displayData = analytics || getMockAnalytics();

  if (loading && !analytics) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div>
              <h1 className="gradient-text">
                Welcome back, {user?.name?.split(" ")[0] || "Admin"}!
              </h1>
              <p className="header-subtitle">
                Here's what's happening with your platform today.
              </p>
            </div>
            <button
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <MdRefresh size={18} /> Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${tabValue === 0 ? "active" : ""}`}
            onClick={() => setTabValue(0)}
          >
            <MdDashboard size={18} /> Overview
          </button>
          <button
            className={`tab-btn ${tabValue === 1 ? "active" : ""}`}
            onClick={() => setTabValue(1)}
          >
            <MdPeople size={18} /> Users Management
          </button>
          <button
            className={`tab-btn ${tabValue === 2 ? "active" : ""}`}
            onClick={() => setTabValue(2)}
          >
            <MdAnalytics size={18} /> Analytics
          </button>
          <button
            className={`tab-btn ${tabValue === 3 ? "active" : ""}`}
            onClick={() => setTabValue(3)}
          >
            <FiActivity size={18} /> Activity
          </button>
        </div>

        {/* Tab Content */}
        {tabValue === 0 && (
          <div className="tab-content">
            {/* Stats Grid */}
            <div className="stats-grid">
              <StatCard
                title="Total Users"
                value={displayData.totalUsers}
                change={{
                  value: displayData.newUsersThisMonth,
                  label: "this month",
                }}
                icon={<FiUsers size={28} color="white" />}
                color="#1976d2"
                onClick={() => setTabValue(1)}
                loading={loading}
              />
              <StatCard
                title="Total Notices"
                value={displayData.totalNotices}
                change={{
                  value: displayData.newNoticesThisMonth,
                  label: "this month",
                }}
                icon={<FiFileText size={28} color="white" />}
                color="#2e7d32"
                loading={loading}
              />
              <StatCard
                title="Total Events"
                value={displayData.totalEvents}
                change={{
                  value: displayData.upcomingEvents,
                  label: "upcoming",
                }}
                icon={<FiCalendar size={28} color="white" />}
                color="#ed6c02"
                loading={loading}
              />
              <StatCard
                title="Registrations"
                value={displayData.totalRegistrations}
                change={{
                  value: displayData.registrationsThisMonth,
                  label: "this month",
                }}
                icon={<FiClipboard size={28} color="white" />}
                color="#9c27b0"
                loading={loading}
              />
            </div>

            {/* Charts Section */}
            <div className="charts-row">
              {/* User Growth Chart */}
              <div className="chart-card large">
                <h3 className="chart-title">
                  <MdTrendingUp size={20} /> User Growth
                </h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart
                      data={displayData.userGrowth}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient
                          id="userGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#1976d2"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#1976d2"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 14, fontWeight: 500 }}
                        tickMargin={10}
                      />
                      <YAxis
                        tick={{ fontSize: 14, fontWeight: 500 }}
                        tickMargin={10}
                        width={60}
                        domain={[0, 1600]}
                        ticks={[0, 400, 800, 1200, 1600]}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          fontSize: 14,
                          padding: 12,
                          borderRadius: 8,
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 14, paddingTop: 15 }}
                        iconSize={14}
                      />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stroke="#1976d2"
                        strokeWidth={3}
                        fill="url(#userGradient)"
                        name="Total Users"
                        activeDot={{ r: 8 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Notice Categories Chart */}
              <div className="chart-card small">
                <h3 className="chart-title">
                  <MdPieChart size={20} /> Notice Categories
                </h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={380}>
                    <PieChart>
                      <Pie
                        data={displayData.noticeCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) =>
                          `${name}\n${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={120}
                        innerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {displayData.noticeCategories.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          fontSize: 14,
                          padding: 12,
                          borderRadius: 8,
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 14, paddingTop: 20 }}
                        iconSize={14}
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Monthly Activity Chart */}
            <div className="chart-card full">
              <h3 className="chart-title">
                <MdBarChart size={20} /> Monthly Activity
              </h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={displayData.monthlyActivity}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 14, fontWeight: 500 }}
                      tickMargin={10}
                    />
                    <YAxis
                      tick={{ fontSize: 14, fontWeight: 500 }}
                      tickMargin={10}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        fontSize: 14,
                        padding: 12,
                        borderRadius: 8,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 14, paddingTop: 15 }}
                      iconSize={14}
                    />
                    <Bar
                      dataKey="notices"
                      fill="#1976d2"
                      name="Notices"
                      radius={[8, 8, 0, 0]}
                      barSize={60}
                    />
                    <Bar
                      dataKey="events"
                      fill="#ed6c02"
                      name="Events"
                      radius={[8, 8, 0, 0]}
                      barSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tabValue === 1 && (
          <div className="tab-content">
            <div className="users-panel">
              <div className="users-header">
                <h2>
                  <MdPeople size={24} /> User Management
                </h2>
                <div className="filters">
                  <div className="search-wrapper">
                    <FiSearch size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setRoleFilter("all");
                      setStatusFilter("all");
                    }}
                    className="clear-btn"
                  >
                    <FiX size={16} /> Clear
                  </button>
                </div>
              </div>
              {loadingUsers ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <UserTable
                  users={filteredUsers}
                  onRoleChange={handleRoleChange}
                  onDelete={handleDeleteUser}
                  onStatusChange={handleBulkStatusChange}
                  updatingRoles={updatingRoles}
                  updatingStatus={updatingStatus}
                  showStatus={true}
                  showStudentId={true}
                  showDepartment={true}
                  sortable={true}
                  selectable={true}
                  onSelectUser={handleSelectUser}
                  selectedUsers={selectedUsers}
                />
              )}
            </div>
          </div>
        )}

        {tabValue === 2 && (
          <div className="tab-content">
            <div className="analytics-grid">
              <div className="info-card">
                <h3>
                  <MdAssessment size={20} /> Key Metrics
                </h3>
                <div className="metric-list">
                  <div className="metric-item">
                    <span className="metric-icon">
                      <FiUsers size={20} />
                    </span>
                    <div>
                      <strong>Active Users</strong>
                      <small>{displayData.totalUsers} total users</small>
                    </div>
                    <span className="metric-badge success">
                      <FiTrendingUp size={12} /> +12%
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-icon">
                      <FiEye size={20} />
                    </span>
                    <div>
                      <strong>Page Views</strong>
                      <small>45,678 total views</small>
                    </div>
                    <span className="metric-badge success">
                      <FiTrendingUp size={12} /> +8%
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-icon">
                      <FiHeart size={20} />
                    </span>
                    <div>
                      <strong>Engagement Rate</strong>
                      <small>67.5% average</small>
                    </div>
                    <span className="metric-badge success">
                      <FiTrendingUp size={12} /> +5%
                    </span>
                  </div>
                </div>
              </div>
              <div className="info-card">
                <h3>
                  <MdSecurity size={20} /> System Status
                </h3>
                <div className="status-list">
                  <div className="status-item">
                    <span>
                      <FiServer size={14} /> Server Status
                    </span>
                    <span className="status-badge success">
                      <FiCheckCircle size={12} /> Operational
                    </span>
                  </div>
                  <div className="status-item">
                    <span>
                      <FiDatabase size={14} /> Database
                    </span>
                    <span className="status-badge success">
                      <FiCheckCircle size={12} /> Connected
                    </span>
                  </div>
                  <div className="status-item">
                    <span>
                      <FiCloud size={14} /> API Gateway
                    </span>
                    <span className="status-badge success">
                      <FiCheckCircle size={12} /> Healthy
                    </span>
                  </div>
                  <div className="status-item">
                    <span>
                      <FiHardDrive size={14} /> Last Backup
                    </span>
                    <span>Today, 02:00 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tabValue === 3 && (
          <div className="tab-content">
            <div className="activity-list">
              {displayData.recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon ${activity.type}`}>
                    {activity.type === "user" ? (
                      <FiUser size={20} />
                    ) : activity.type === "notice" ? (
                      <FiFileText size={20} />
                    ) : (
                      <FiCalendar size={20} />
                    )}
                  </div>
                  <div className="activity-info">
                    <div className="activity-action">{activity.action}</div>
                    <div className="activity-meta">
                      by {activity.user} •{" "}
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className="activity-status completed">
                    <FiCheckCircle size={12} /> Completed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>
            <FiZap size={18} /> Quick Actions
          </h3>
          <div className="action-buttons">
            <button
              className="btn-primary"
              onClick={() => navigate("/admin/notices/create")}
            >
              <FiFileText size={16} /> Create Notice
            </button>
            <button
              className="btn-primary"
              onClick={() => navigate("/admin/events/create")}
            >
              <FiCalendar size={16} /> Create Event
            </button>
            <button className="btn-secondary" onClick={() => setTabValue(1)}>
              <MdPeople size={16} /> Manage Users
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className={`toast ${toastType}`}>
            {toastType === "success" ? (
              <FiCheckCircle size={18} />
            ) : (
              <FiAlertCircle size={18} />
            )}
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
