// src/components/dashboard/UserDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../common/UserAvatar";
import NotificationBell from "../notification/NotificationBell";
import LoadingSpinner from "../common/LoadingSpinner";
import "../../styles/components/UserDashboard.css";

// ============================================================================
// SVG Icons
// ============================================================================

const Icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 3H10V10H3V3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 3H21V10H14V3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 14H21V21H14V14Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M3 14H10V21H3V14Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  notices: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 11.3137 8.68629 14 12 14C15.3137 14 18 11.3137 18 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 14V22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 19H15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  events: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        ry="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M19.4 15.05C19.8266 14.4766 20.0468 13.787 20.024 13.087C20.0011 12.387 19.7368 11.7126 19.276 11.166L19.4 15.05Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M4.6 15.05L4.724 11.166C4.2632 11.7126 3.9989 12.387 3.976 13.087C3.9532 13.787 4.1734 14.4766 4.6 15.05Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M7.3 19.5C7.944 19.9315 8.7062 20.1644 9.49 20.1655C10.2738 20.1666 11.0367 19.9359 11.682 19.506L7.3 19.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M16.7 19.5L12.318 19.506C12.9633 19.9359 13.7262 20.1666 14.51 20.1655C15.2938 20.1644 16.056 19.9315 16.7 19.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M7.3 4.5L11.682 4.494C11.0367 4.0641 10.2738 3.8334 9.49 3.8345C8.7062 3.8356 7.944 4.0685 7.3 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M16.7 4.5C16.056 4.0685 15.2938 3.8356 14.51 3.8345C13.7262 3.8334 12.9633 4.0641 12.318 4.494L16.7 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M20 21C20 17.5 16.5 15 12 15C7.5 15 4 17.5 4 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 12C21 13.2 20.5 14.2 19.7 15.1C18.9 15.9 17.8 16.5 16.5 16.8C15.2 17.1 13.8 17.1 12.3 16.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M3 12V8C3 5.8 4.8 4 7 4H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M8 21L12 17L16 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 4V17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M16 17L21 12L16 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M21 12H9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="6"
        x2="21"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="18"
        x2="21"
        y2="18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line
        x1="18"
        y1="6"
        x2="6"
        y2="18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="6"
        y1="6"
        x2="18"
        y2="18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="11"
        cy="11"
        r="8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="21"
        y1="21"
        x2="16.65"
        y2="16.65"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  notification: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 11.3137 8.68629 14 12 14C15.3137 14 18 11.3137 18 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 14V22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 19H15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  help: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="17"
        x2="12.01"
        y2="17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};

// ============================================================================
// PropTypes
// ============================================================================

const propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    email: PropTypes.string,
    avatar: PropTypes.string,
    role: PropTypes.string,
  }).isRequired,
  onLogout: PropTypes.func,
  onNavigate: PropTypes.func,
  activeModule: PropTypes.string,
  modules: PropTypes.array,
  showNotifications: PropTypes.bool,
  showSidebar: PropTypes.bool,
  className: PropTypes.string,
  enableAnimations: PropTypes.bool,
};

const defaultProps = {
  onLogout: null,
  onNavigate: null,
  activeModule: "dashboard",
  modules: null,
  showNotifications: true,
  showSidebar: true,
  className: "",
  enableAnimations: true,
};

// ============================================================================
// Helper Components
// ============================================================================

const IconWrapper = memo(({ icon, className = "", size = 20 }) => (
  <span
    className={`icon-wrapper ${className}`}
    style={{ width: size, height: size }}
  >
    {React.cloneElement(icon, { width: size, height: size })}
  </span>
));

IconWrapper.displayName = "IconWrapper";
IconWrapper.propTypes = {
  icon: PropTypes.element.isRequired,
  className: PropTypes.string,
  size: PropTypes.number,
};

const StatCard = memo(({ title, value, icon, trend, color, onClick }) => (
  <motion.div
    className={`stat-card ${onClick ? "clickable" : ""}`}
    style={{ borderTopColor: color }}
    onClick={onClick}
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2 }}
  >
    <div className="stat-card-header">
      <div
        className="stat-card-icon"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <IconWrapper icon={icon} size={24} />
      </div>
      {trend && (
        <div className={`stat-trend ${trend > 0 ? "positive" : "negative"}`}>
          {trend > 0 ? "+" : ""}
          {trend}%
        </div>
      )}
    </div>
    <div className="stat-card-content">
      <h3 className="stat-title">{title}</h3>
      <p className="stat-value">{value}</p>
    </div>
  </motion.div>
));

StatCard.displayName = "StatCard";
StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.element.isRequired,
  trend: PropTypes.number,
  color: PropTypes.string,
  onClick: PropTypes.func,
};

const NavItem = memo(({ icon, label, active, onClick, badge }) => (
  <motion.button
    className={`nav-item ${active ? "active" : ""}`}
    onClick={onClick}
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2 }}
  >
    <IconWrapper icon={icon} size={20} />
    <span className="nav-label">{label}</span>
    {badge && badge > 0 && (
      <span className="nav-badge">{badge > 99 ? "99+" : badge}</span>
    )}
  </motion.button>
));

NavItem.displayName = "NavItem";
NavItem.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
  badge: PropTypes.number,
};

// ============================================================================
// Main Dashboard Component
// ============================================================================

const UserDashboard = memo(
  ({
    user,
    onLogout,
    onNavigate,
    activeModule: propActiveModule,
    modules: propModules,
    showNotifications = true,
    showSidebar = true,
    className = "",
    enableAnimations = true,
  }) => {
    // ===== State =====
    const [activeModule, setActiveModule] = useState(
      propActiveModule || "dashboard",
    );
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({
      notices: 24,
      events: 12,
      messages: 8,
      unreadNotifications: 3,
    });
    const [greeting, setGreeting] = useState("");

    // ===== Hooks =====
    const navigate = useNavigate();

    // ===== Default Navigation Modules =====
    const defaultModules = useMemo(
      () => [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: Icons.dashboard,
          path: "/dashboard",
        },
        {
          id: "notices",
          label: "Notices",
          icon: Icons.notices,
          path: "/notices",
        },
        { id: "events", label: "Events", icon: Icons.events, path: "/events" },
        {
          id: "messages",
          label: "Messages",
          icon: Icons.messages,
          path: "/messages",
          badge: stats.messages,
        },
        {
          id: "analytics",
          label: "Analytics",
          icon: Icons.analytics,
          path: "/analytics",
        },
        {
          id: "profile",
          label: "Profile",
          icon: Icons.profile,
          path: "/profile",
        },
        {
          id: "settings",
          label: "Settings",
          icon: Icons.settings,
          path: "/settings",
        },
      ],
      [stats.messages],
    );

    const modules = propModules || defaultModules;

    // ===== Set Greeting Based on Time =====
    useEffect(() => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good morning");
      else if (hour < 18) setGreeting("Good afternoon");
      else setGreeting("Good evening");
    }, []);

    // ===== Handle Navigation =====
    const handleNavigate = useCallback(
      (moduleId, path) => {
        setActiveModule(moduleId);
        setIsMobileMenuOpen(false);

        if (onNavigate) {
          onNavigate(moduleId);
        } else if (path) {
          navigate(path);
        }
      },
      [onNavigate, navigate],
    );

    // ===== Handle Logout =====
    const handleLogout = useCallback(async () => {
      if (onLogout) {
        await onLogout();
      } else {
        navigate("/login");
      }
    }, [onLogout, navigate]);

    // ===== Toggle Mobile Menu =====
    const toggleMobileMenu = useCallback(() => {
      setIsMobileMenuOpen((prev) => !prev);
    }, []);

    // ===== Close Mobile Menu on Resize =====
    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth > 768 && isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [isMobileMenuOpen]);

    // ===== Prevent Body Scroll When Mobile Menu Open =====
    useEffect(() => {
      if (isMobileMenuOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [isMobileMenuOpen]);

    // ===== Animation Variants =====
    const pageVariants = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    };

    const sidebarVariants = {
      open: { x: 0 },
      closed: { x: "-100%" },
    };

    // ===== Active Module Content =====
    const renderModuleContent = () => {
      switch (activeModule) {
        case "dashboard":
          return (
            <div className="dashboard-content">
              <div className="stats-grid">
                <StatCard
                  title="Total Notices"
                  value={stats.notices}
                  icon={Icons.notices}
                  trend={12}
                  color="#3b82f6"
                  onClick={() => handleNavigate("notices", "/notices")}
                />
                <StatCard
                  title="Upcoming Events"
                  value={stats.events}
                  icon={Icons.events}
                  trend={-5}
                  color="#8b5cf6"
                  onClick={() => handleNavigate("events", "/events")}
                />
                <StatCard
                  title="Unread Messages"
                  value={stats.messages}
                  icon={Icons.messages}
                  trend={8}
                  color="#10b981"
                  onClick={() => handleNavigate("messages", "/messages")}
                />
                <StatCard
                  title="Notifications"
                  value={stats.unreadNotifications}
                  icon={Icons.notification}
                  trend={0}
                  color="#f59e0b"
                />
              </div>

              <div className="dashboard-widgets">
                <div className="widget recent-activity">
                  <h3 className="widget-title">Recent Activity</h3>
                  <div className="activity-list">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        className="activity-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="activity-icon">
                          <IconWrapper icon={Icons.notices} size={16} />
                        </div>
                        <div className="activity-content">
                          <p className="activity-text">
                            New notice posted: System Update {i}
                          </p>
                          <span className="activity-time">
                            {i} hour{i > 1 ? "s" : ""} ago
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="widget quick-actions">
                  <h3 className="widget-title">Quick Actions</h3>
                  <div className="quick-actions-grid">
                    <button
                      className="quick-action-btn"
                      onClick={() => handleNavigate("notices", "/notices/new")}
                    >
                      <IconWrapper icon={Icons.notices} size={20} />
                      <span>Post Notice</span>
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => handleNavigate("events", "/events/new")}
                    >
                      <IconWrapper icon={Icons.events} size={20} />
                      <span>Create Event</span>
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => handleNavigate("messages", "/messages")}
                    >
                      <IconWrapper icon={Icons.messages} size={20} />
                      <span>Send Message</span>
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => handleNavigate("profile", "/profile")}
                    >
                      <IconWrapper icon={Icons.profile} size={20} />
                      <span>Update Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return (
            <div className="module-placeholder">
              <IconWrapper icon={Icons.dashboard} size={64} />
              <h2>
                {modules.find((m) => m.id === activeModule)?.label || "Module"}
              </h2>
              <p>Content coming soon...</p>
            </div>
          );
      }
    };

    // ==========================================================================
    // Render
    // ==========================================================================
    const Component = enableAnimations ? motion.div : "div";

    return (
      <div className={`user-dashboard ${className}`}>
        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="mobile-menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileMenu}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        {showSidebar && (
          <motion.aside
            className={`dashboard-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}
            initial={false}
            animate={isMobileMenuOpen ? "open" : "closed"}
            variants={sidebarVariants}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="sidebar-header">
              <div className="logo">
                <div className="logo-icon">📢</div>
                <span className="logo-text">NoticeHub</span>
              </div>
              <button className="mobile-close-btn" onClick={toggleMobileMenu}>
                <IconWrapper icon={Icons.close} size={24} />
              </button>
            </div>

            <div className="user-info">
              <UserAvatar user={user} size="lg" interactive={false} />
              <div className="user-details">
                <h4 className="user-name">{user.name || "User"}</h4>
                <p className="user-email">{user.email}</p>
                {user.role && <span className="user-role">{user.role}</span>}
              </div>
            </div>

            <nav className="sidebar-nav">
              {modules.map((module) => (
                <NavItem
                  key={module.id}
                  icon={module.icon}
                  label={module.label}
                  active={activeModule === module.id}
                  onClick={() => handleNavigate(module.id, module.path)}
                  badge={module.badge}
                />
              ))}
            </nav>

            <div className="sidebar-footer">
              <button
                className="help-btn"
                onClick={() => handleNavigate("help", "/help")}
              >
                <IconWrapper icon={Icons.help} size={20} />
                <span>Help & Support</span>
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                <IconWrapper icon={Icons.logout} size={20} />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        )}

        {/* Main Content */}
        <main className="dashboard-main">
          <header className="dashboard-header">
            <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
              <IconWrapper icon={Icons.menu} size={24} />
            </button>

            <div className="header-greeting">
              <h1 className="greeting-title">
                {greeting}, {user.name?.split(" ")[0] || "User"}!
              </h1>
              <p className="greeting-subtitle">
                Welcome back to your dashboard
              </p>
            </div>

            <div className="header-actions">
              <div className="search-bar">
                <IconWrapper icon={Icons.search} size={18} />
                <input type="text" placeholder="Search..." />
              </div>
              {showNotifications && (
                <NotificationBell
                  maxItems={5}
                  position="right"
                  onNotificationClick={(notification) => {
                    console.log("Notification clicked:", notification);
                  }}
                />
              )}
            </div>
          </header>

          <Component
            className="dashboard-module-content"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {isLoading ? (
              <div className="loading-container">
                <LoadingSpinner size="large" />
                <p>Loading dashboard...</p>
              </div>
            ) : (
              renderModuleContent()
            )}
          </Component>
        </main>
      </div>
    );
  },
);

UserDashboard.displayName = "UserDashboard";
UserDashboard.propTypes = propTypes;
UserDashboard.defaultProps = defaultProps;

export default UserDashboard;
