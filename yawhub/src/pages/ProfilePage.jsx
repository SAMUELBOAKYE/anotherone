// src/pages/ProfilePage.jsx - Plain CSS Version
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEdit2,
  FiSave,
  FiX,
  FiCamera,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiCalendar as FiEvent,
  FiBell,
  FiShield,
  FiGlobe,
  FiSun,
  FiMoon,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiBarChart2,
  FiStar,
  FiHeart,
  FiShare2,
  FiLink,
  FiTrendingUp,
  FiEye,
  FiThumbsUp,
  FiMessageCircle,
  FiDownload,
  FiPrinter,
  FiUser,
  FiUsers,
  FiLogOut,
  FiTrash2,
  FiSettings,
  FiClock,
  FiGrid,
  FiList,
  FiPlus,
  FiMinus,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import {
  MdDashboard,
  MdEvent,
  MdAnnouncement,
  MdNotificationsActive,
  MdSecurity,
  MdLanguage,
  MdDarkMode,
  MdLightMode,
  MdLock,
  MdVerifiedUser,
  MdHistory,
  MdFavorite,
  MdShare,
  MdLink,
  MdCheckCircle,
  MdWarning,
  MdInfo,
  MdTrendingUp,
  MdVisibility,
  MdThumbUp,
  MdComment,
  MdDownload,
  MdPrint,
  MdPerson,
  MdGroup,
  MdLogout,
  MdDeleteForever,
  MdBackup,
  MdQrCode,
  MdShield,
  MdGppGood,
  MdVerified,
  MdSettings,
  MdAccessTime,
  MdCalendarToday,
  MdLocationOn,
  MdWork,
  MdSchool,
  MdCode,
  MdMusicNote,
  MdSportsEsports,
  MdRestaurant,
  MdFlight,
  MdBusiness,
  MdPersonAdd,
  MdGroupAdd,
  MdFingerprint,
  MdDevices,
  MdStar,
  MdStarBorder,
  MdEdit,
  MdSave,
  MdCancel,
  MdPhotoCamera,
} from "react-icons/md";
import "../styles/components/ProfilePage.css";

// ============================================================================
// MOCK AUTH HOOK (TEMPORARY SOLUTION - ADD THIS)
// ============================================================================

const useMockAuth = () => {
  const [user, setUser] = useState({
    name: "Yaw Boakye",
    email: "boakyesamuel189@gmail.com",
    id: 1,
    role: "Software Developer",
  });
  return { user, setUser };
};

// ============================================================================
// ENHANCED USER DATA
// ============================================================================

const userData = {
  id: 1,
  name: "Yaw Boakye",
  email: "boakyesamuel189@gmail.com",
  phone: "+233 (534) 379-725",
  role: "Software Developer",
  department: "Computer Science",
  location: "Ghana, Accra",
  joinDate: "January 15, 2023",
  avatar: null,
  coverPhoto: null,
  bio: "Experienced Software Developer with over 5 years of experience. Passionate in creativity and solving problems",
  interests: ["Technology", "Gaming and Esports", "Networking", "Photography"],
  socialLinks: {
    linkedin: "https://linkedin.com/in/yaw-boakye",
    github: "https://github.com/samuelboakye",
  },
  preferences: {
    emailNotifications: true,
    smsAlerts: false,
    pushNotifications: true,
    eventReminders: true,
    noticeUpdates: true,
    newsletterSubscription: true,
    darkMode: false,
    language: "English",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
  },
  stats: {
    eventsAttended: 24,
    eventsCreated: 12,
    noticesPosted: 8,
    totalViews: 3450,
    totalLikes: 892,
    totalShares: 234,
    engagementRate: 78,
    satisfactionScore: 4.8,
  },
  achievements: [
    {
      id: 1,
      title: "Event Master",
      description: "Created 10+ successful events",
      icon: <MdEvent size={24} />,
      achieved: true,
      date: "2024-01-15",
    },
    {
      id: 2,
      title: "Community Star",
      description: "Posted 50+ notices",
      icon: <MdAnnouncement size={24} />,
      achieved: false,
      progress: 45,
    },
    {
      id: 3,
      title: "Engagement Expert",
      description: "Reached 1000+ views",
      icon: <MdVisibility size={24} />,
      achieved: true,
      date: "2024-01-10",
    },
    {
      id: 4,
      title: "Top Contributor",
      description: "Featured contributor of the month",
      icon: <MdStar size={24} />,
      achieved: false,
      progress: 60,
    },
  ],
  recentActivity: [
    {
      id: 1,
      action: 'Created event "Tech Conference 2025"',
      date: "2025-01-10",
      type: "event",
      metadata: { attendees: 156 },
    },
    {
      id: 2,
      action: 'Posted notice "Holiday Announcement"',
      date: "2025-01-08",
      type: "notice",
      metadata: { views: 234 },
    },
    {
      id: 3,
      action: 'Registered for "AI Workshop"',
      date: "2025-01-05",
      type: "registration",
      metadata: { workshop: "Machine Learning" },
    },
    {
      id: 4,
      action: "Updated profile information",
      date: "2025-01-03",
      type: "profile",
      metadata: { field: "Bio" },
    },
    {
      id: 5,
      action: 'Shared event "Cultural Fest"',
      date: "2025-01-01",
      type: "share",
      metadata: { platform: "LinkedIn" },
    },
  ],
  security: {
    twoFactorEnabled: false,
    lastLogin: "2025-01-18 09:30 AM",
    lastLoginDevice: "Chrome on Windows",
    lastLoginIP: "192.168.1.1",
    loginHistory: [
      {
        device: "Chrome on Windows",
        location: "New York, NY",
        time: "2025-01-18 09:30 AM",
        ip: "192.168.1.1",
        browser: "Chrome 120",
        os: "Windows 11",
      },
      {
        device: "Safari on iPhone",
        location: "New York, NY",
        time: "2025-01-17 08:15 PM",
        ip: "192.168.1.2",
        browser: "Safari 17",
        os: "iOS 17",
      },
    ],
    connectedDevices: [
      {
        name: "Windows Laptop",
        lastActive: "2025-01-18 09:30 AM",
        current: true,
      },
      {
        name: "iPhone 15 Pro",
        lastActive: "2025-01-17 08:15 PM",
        current: false,
      },
    ],
  },
  skills: [
    "Event Planning",
    "Project Management",
    "Team Leadership",
    "Budget Management",
    "Vendor Coordination",
    "Risk Management",
  ],
  certifications: [
    {
      name: "Certified Event Planner",
      issuer: "Event Management Institute",
      year: 2023,
    },
    { name: "Digital Marketing Expert", issuer: "Google", year: 2022 },
  ],
};

const ProfilePage = () => {
  // USING MOCK AUTH INSTEAD OF REAL useAuth
  // Replace this line with: const { user } = useAuth(); when your auth is ready
  const { user } = useMockAuth();

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState(userData);
  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    location: userData.location,
    bio: userData.bio,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const showSnackbar = (message, type) => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 4000);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setProfile({ ...profile, ...formData });
    setEditMode(false);
    setLoading(false);
    showSnackbar("Profile updated successfully!", "success");
  };

  const handleCancelEdit = () => {
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      bio: profile.bio,
    });
    setEditMode(false);
  };

  const handlePreferenceChange = (pref) => {
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        [pref]: !profile.preferences[pref],
      },
    });
    showSnackbar("Preferences updated", "success");
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar("Passwords do not match!", "error");
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setPasswordDialog(false);
    setLoading(false);
    showSnackbar("Password changed successfully!", "success");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleUploadAvatar = async () => {
    setUploadDialog(false);
    showSnackbar("Avatar updated successfully!", "success");
  };

  const tabs = [
    { label: "Overview", icon: <MdDashboard size={18} /> },
    { label: "Edit Profile", icon: <FiEdit2 size={18} /> },
    { label: "Preferences", icon: <MdSettings size={18} /> },
    { label: "Security", icon: <MdSecurity size={18} /> },
    { label: "Activity", icon: <MdHistory size={18} /> },
    { label: "Achievements", icon: <MdStar size={18} /> },
  ];

  const StatCard = ({ title, value, icon, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="stat-card"
    >
      <div
        className="stat-icon"
        style={{ backgroundColor: `${color}18`, color: color }}
      >
        {icon}
      </div>
      <div className="stat-value">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="stat-title">{title}</div>
      {trend && <div className="stat-trend">↑ {trend}% from last month</div>}
    </motion.div>
  );

  const AchievementCard = ({ achievement }) => (
    <motion.div whileHover={{ y: -2 }} className="achievement-card">
      <div
        className="achievement-icon"
        style={{
          backgroundColor: achievement.achieved
            ? `${profile.stats.satisfactionScore > 4 ? "#10b981" : "#64748b"}18`
            : "#64748b18",
          color: achievement.achieved
            ? profile.stats.satisfactionScore > 4
              ? "#10b981"
              : "#64748b"
            : "#64748b",
        }}
      >
        {achievement.icon}
      </div>
      <div className="achievement-info">
        <div className="achievement-title">{achievement.title}</div>
        <div className="achievement-description">{achievement.description}</div>
        {achievement.achieved ? (
          <div className="achievement-badge">
            <FiCheckCircle size={12} /> Achieved on {achievement.date}
          </div>
        ) : (
          <div className="achievement-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
            <div className="progress-text">
              {achievement.progress}% Complete
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Loading Overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Profile Header */}
        <div className="profile-header glass-card">
          <div
            className="cover-photo"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <button className="edit-cover-btn">
              <FiCamera size={16} />
            </button>
          </div>
          <div className="profile-info">
            <div className="avatar-wrapper">
              <div className="profile-avatar">{profile.name.charAt(0)}</div>
              <button
                className="edit-avatar-btn"
                onClick={() => setUploadDialog(true)}
              >
                <FiCamera size={14} />
              </button>
            </div>
            <h1 className="profile-name">{profile.name}</h1>
            <div className="profile-badges">
              <span className="badge primary">
                <MdVerifiedUser size={14} /> {profile.role}
              </span>
              <span className="badge outline">{profile.department}</span>
              <span className="badge warning">
                <MdStar size={14} /> 4.8 Rating
              </span>
            </div>
            <div className="profile-details">
              <span>
                <FiMail size={14} /> {profile.email}
              </span>
              <span>
                <FiPhone size={14} /> {profile.phone}
              </span>
              <span>
                <FiMapPin size={14} /> {profile.location}
              </span>
              <span>
                <FiCalendar size={14} /> Joined {profile.joinDate}
              </span>
            </div>
            {!editMode && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="edit-btn"
                onClick={() => setEditMode(true)}
              >
                <FiEdit2 size={16} /> Edit Profile
              </motion.button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs glass-card">
          <div className="tabs-header">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                className={`tab-btn ${activeTab === idx ? "active" : ""}`}
                onClick={() => setActiveTab(idx)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="tabs-content">
            {/* Tab 0: Overview */}
            {activeTab === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="tab-pane"
              >
                <div className="section">
                  <h2 className="section-title">About Me</h2>
                  <p className="bio-text">{profile.bio}</p>
                </div>

                <div className="section">
                  <h2 className="section-title">Interests</h2>
                  <div className="interests-list">
                    {profile.interests.map((interest, idx) => (
                      <span key={idx} className="interest-chip">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="section">
                  <h2 className="section-title">Skills & Expertise</h2>
                  <div className="skills-list">
                    {profile.skills.map((skill, idx) => (
                      <span key={idx} className="skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="section-divider"></div>

                <div className="section">
                  <h2 className="section-title">Statistics</h2>
                  <div className="stats-grid">
                    <StatCard
                      title="Events Attended"
                      value={profile.stats.eventsAttended}
                      icon={<MdEvent size={24} />}
                      color="#6366f1"
                      trend={12}
                    />
                    <StatCard
                      title="Events Created"
                      value={profile.stats.eventsCreated}
                      icon={<MdEvent size={24} />}
                      color="#10b981"
                      trend={8}
                    />
                    <StatCard
                      title="Notices Posted"
                      value={profile.stats.noticesPosted}
                      icon={<MdAnnouncement size={24} />}
                      color="#f59e0b"
                      trend={5}
                    />
                    <StatCard
                      title="Total Views"
                      value={profile.stats.totalViews}
                      icon={<MdVisibility size={24} />}
                      color="#3b82f6"
                      trend={15}
                    />
                    <StatCard
                      title="Engagement Rate"
                      value={`${profile.stats.engagementRate}%`}
                      icon={<MdTrendingUp size={24} />}
                      color="#8b5cf6"
                      trend={3}
                    />
                  </div>
                </div>

                <div className="section-divider"></div>

                <div className="section">
                  <h2 className="section-title">Recent Activity</h2>
                  <div className="activity-list">
                    {profile.recentActivity.map((activity, idx) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="activity-item"
                      >
                        <div className="activity-icon">
                          {activity.type === "event" && <MdEvent size={20} />}
                          {activity.type === "notice" && (
                            <MdAnnouncement size={20} />
                          )}
                          {activity.type === "registration" && (
                            <FiCheckCircle size={20} />
                          )}
                          {activity.type === "profile" && <FiEdit2 size={20} />}
                          {activity.type === "share" && <MdShare size={20} />}
                        </div>
                        <div className="activity-info">
                          <div className="activity-action">
                            {activity.action}
                          </div>
                          <div className="activity-date">{activity.date}</div>
                        </div>
                        <span className="activity-type">{activity.type}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 1: Edit Profile */}
            {activeTab === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="tab-pane"
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={editMode ? formData.name : profile.name}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={editMode ? formData.email : profile.email}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      value={editMode ? formData.phone : profile.phone}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      name="location"
                      className="form-input"
                      value={editMode ? formData.location : profile.location}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Bio</label>
                    <textarea
                      name="bio"
                      rows="4"
                      className="form-textarea"
                      value={editMode ? formData.bio : profile.bio}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="form-group full-width">
                    <h4 className="subsection-title">Social Links</h4>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="LinkedIn"
                      value={profile.socialLinks.linkedin}
                      disabled={!editMode}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="GitHub"
                      value={profile.socialLinks.github}
                      disabled={!editMode}
                    />
                  </div>
                  {editMode && (
                    <div className="form-actions">
                      <button
                        className="btn-secondary"
                        onClick={handleCancelEdit}
                      >
                        <FiX size={16} /> Cancel
                      </button>
                      <button
                        className="btn-primary"
                        onClick={handleSaveProfile}
                      >
                        <FiSave size={16} /> Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tab 2: Preferences */}
            {activeTab === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="tab-pane"
              >
                <h2 className="section-title">Notification Preferences</h2>
                <div className="preferences-list">
                  <div className="pref-item">
                    <div className="pref-icon">
                      <FiMail size={20} />
                    </div>
                    <div className="pref-info">
                      <div className="pref-label">Email Notifications</div>
                      <div className="pref-description">
                        Receive notifications via email
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={profile.preferences.emailNotifications}
                        onChange={() =>
                          handlePreferenceChange("emailNotifications")
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="pref-item">
                    <div className="pref-icon">
                      <FiPhone size={20} />
                    </div>
                    <div className="pref-info">
                      <div className="pref-label">SMS Alerts</div>
                      <div className="pref-description">
                        Receive text message alerts
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={profile.preferences.smsAlerts}
                        onChange={() => handlePreferenceChange("smsAlerts")}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="pref-item">
                    <div className="pref-icon">
                      <FiBell size={20} />
                    </div>
                    <div className="pref-info">
                      <div className="pref-label">Push Notifications</div>
                      <div className="pref-description">
                        Receive push notifications on browser
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={profile.preferences.pushNotifications}
                        onChange={() =>
                          handlePreferenceChange("pushNotifications")
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="pref-item">
                    <div className="pref-icon">
                      <MdEvent size={20} />
                    </div>
                    <div className="pref-info">
                      <div className="pref-label">Event Reminders</div>
                      <div className="pref-description">
                        Get reminders for upcoming events
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={profile.preferences.eventReminders}
                        onChange={() =>
                          handlePreferenceChange("eventReminders")
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="section-divider"></div>

                <h2 className="section-title">Appearance & Language</h2>
                <div className="preferences-list">
                  <div className="pref-item">
                    <div className="pref-icon">
                      <FiMoon size={20} />
                    </div>
                    <div className="pref-info">
                      <div className="pref-label">Dark Mode</div>
                      <div className="pref-description">
                        Switch between light and dark theme
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={profile.preferences.darkMode}
                        onChange={() => handlePreferenceChange("darkMode")}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="pref-item">
                    <div className="pref-icon">
                      <FiGlobe size={20} />
                    </div>
                    <div className="pref-info">
                      <div className="pref-label">Language</div>
                      <div className="pref-description">
                        Select your preferred language
                      </div>
                    </div>
                    <select
                      className="pref-select"
                      value={profile.preferences.language}
                      onChange={(e) => {
                        setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            language: e.target.value,
                          },
                        });
                      }}
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                  <div className="pref-item">
                    <div className="pref-icon">
                      <FiClock size={20} />
                    </div>
                    <div className="pref-info">
                      <div className="pref-label">Timezone</div>
                      <div className="pref-description">
                        Select your timezone
                      </div>
                    </div>
                    <select
                      className="pref-select"
                      value={profile.preferences.timezone}
                      onChange={(e) => {
                        setProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            timezone: e.target.value,
                          },
                        });
                      }}
                    >
                      <option>America/New_York</option>
                      <option>America/Chicago</option>
                      <option>America/Los_Angeles</option>
                      <option>Europe/London</option>
                      <option>Asia/Tokyo</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 3: Security */}
            {activeTab === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="tab-pane"
              >
                <div className="alert-info">
                  <FiInfo size={18} /> <strong>Security Tip:</strong> Enable
                  two-factor authentication to add an extra layer of security to
                  your account.
                </div>

                <div className="security-card">
                  <div className="security-info">
                    <h3>Password</h3>
                    <p>Last changed 30 days ago</p>
                  </div>
                  <button
                    className="btn-outline"
                    onClick={() => setPasswordDialog(true)}
                  >
                    <FiLock size={16} /> Change Password
                  </button>
                </div>

                <div className="security-card">
                  <div className="security-info">
                    <h3>Two-Factor Authentication (2FA)</h3>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <button
                    className={
                      profile.security.twoFactorEnabled
                        ? "btn-outline"
                        : "btn-primary"
                    }
                    onClick={() => {
                      setProfile({
                        ...profile,
                        security: {
                          ...profile.security,
                          twoFactorEnabled: !profile.security.twoFactorEnabled,
                        },
                      });
                      showSnackbar(
                        profile.security.twoFactorEnabled
                          ? "2FA Disabled"
                          : "2FA Enabled",
                        "success",
                      );
                    }}
                  >
                    <MdFingerprint size={16} />{" "}
                    {profile.security.twoFactorEnabled
                      ? "Disable 2FA"
                      : "Enable 2FA"}
                  </button>
                </div>

                <h3 className="subsection-title">Recent Login History</h3>
                {profile.security.loginHistory.map((login, idx) => (
                  <div key={idx} className="login-item">
                    <div className="login-icon">
                      <MdDevices size={20} />
                    </div>
                    <div className="login-info">
                      <div className="login-device">{login.device}</div>
                      <div className="login-details">
                        {login.location} • {login.time} • IP: {login.ip}
                      </div>
                    </div>
                    {idx === 0 && (
                      <span className="badge success">Current Session</span>
                    )}
                  </div>
                ))}

                <h3 className="subsection-title">Connected Devices</h3>
                {profile.security.connectedDevices.map((device, idx) => (
                  <div key={idx} className="device-item">
                    <div className="device-icon">
                      <MdDevices size={20} />
                    </div>
                    <div className="device-info">
                      <div className="device-name">{device.name}</div>
                      <div className="device-active">
                        Last active: {device.lastActive}
                      </div>
                    </div>
                    {device.current && (
                      <span className="badge primary">Current Device</span>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Tab 4: Activity */}
            {activeTab === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="tab-pane"
              >
                <h2 className="section-title">All Activity Log</h2>
                {profile.recentActivity.map((activity, idx) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === "event" && <MdEvent size={20} />}
                      {activity.type === "notice" && (
                        <MdAnnouncement size={20} />
                      )}
                      {activity.type === "registration" && (
                        <FiCheckCircle size={20} />
                      )}
                      {activity.type === "profile" && <FiEdit2 size={20} />}
                      {activity.type === "share" && <MdShare size={20} />}
                    </div>
                    <div className="activity-info">
                      <div className="activity-action">{activity.action}</div>
                      <div className="activity-date">{activity.date}</div>
                    </div>
                    {activity.metadata &&
                      Object.entries(activity.metadata).map(([key, val]) => (
                        <span key={key} className="activity-chip">
                          {key}: {val}
                        </span>
                      ))}
                  </div>
                ))}
                <div className="action-buttons">
                  <button className="btn-outline">
                    <FiDownload size={16} /> Download Activity Report
                  </button>
                  <button className="btn-outline">
                    <FiPrinter size={16} /> Print Activity Log
                  </button>
                </div>
              </motion.div>
            )}

            {/* Tab 5: Achievements */}
            {activeTab === 5 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="tab-pane"
              >
                <h2 className="section-title">Your Achievements</h2>
                {profile.achievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                  />
                ))}

                <div className="section-divider"></div>

                <h2 className="section-title">Certifications</h2>
                <div className="certifications-grid">
                  {profile.certifications.map((cert, idx) => (
                    <div key={idx} className="cert-card">
                      <div className="cert-icon">
                        <MdVerified size={24} />
                      </div>
                      <div className="cert-info">
                        <div className="cert-name">{cert.name}</div>
                        <div className="cert-issuer">
                          {cert.issuer} • {cert.year}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Password Dialog */}
      {passwordDialog && (
        <div
          className="dialog-overlay"
          onClick={() => setPasswordDialog(false)}
        >
          <div
            className="dialog-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <h3>Change Password</h3>
              <button
                className="dialog-close"
                onClick={() => setPasswordDialog(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="dialog-body">
              <input
                type="password"
                className="form-input"
                placeholder="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
              />
              <input
                type="password"
                className="form-input"
                placeholder="New Password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
              />
              <input
                type="password"
                className="form-input"
                placeholder="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="dialog-footer">
              <button
                className="btn-secondary"
                onClick={() => setPasswordDialog(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handlePasswordChange}>
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Avatar Dialog */}
      {uploadDialog && (
        <div className="dialog-overlay" onClick={() => setUploadDialog(false)}>
          <div
            className="dialog-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <h3>Upload Profile Picture</h3>
              <button
                className="dialog-close"
                onClick={() => setUploadDialog(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="dialog-body upload-area">
              <div className="avatar-preview">{profile.name.charAt(0)}</div>
              <button className="btn-primary">
                <FiCamera size={16} /> Choose Image
              </button>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div>{uploadProgress}% uploaded</div>
                </div>
              )}
            </div>
            <div className="dialog-footer">
              <button
                className="btn-secondary"
                onClick={() => setUploadDialog(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleUploadAvatar}>
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`snackbar ${snackbar.type}`}>
          {snackbar.type === "success" ? (
            <FiCheckCircle size={18} />
          ) : (
            <FiAlertCircle size={18} />
          )}
          <span>{snackbar.message}</span>
          <button
            className="snackbar-close"
            onClick={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
