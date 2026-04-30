// src/components/layout/AdminLayout.jsx - COMPLETELY FIXED
import React, { useState, useEffect, useCallback } from "react";
import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// Import ONLY valid icons from react-icons/fi
import {
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiPlus,
  FiList,
  FiEdit,
  FiSettings,
  FiBell,
  FiLogOut,
  FiRefreshCw,
  FiSun,
  FiMoon,
  FiUser,
  FiMail,
  FiHome,
  FiCalendar,
  FiUsers,
  FiBarChart2,
  FiFileText,
  FiShield,
  FiUserPlus,
  FiEye,
  FiEyeOff,
  FiLock,
  FiGrid,
  FiStar,
  FiHeart,
  FiShare2,
  FiBookmark,
  FiCamera,
  FiVideo,
  FiMusic,
  FiMap,
  FiFlag,
  FiAward,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiInfo,
  FiHelpCircle,
} from "react-icons/fi";

// Import icons from react-icons/md
import {
  MdDashboard,
  MdEvent,
  MdPeople,
  MdAnalytics,
  MdSettings,
  MdNotifications,
  MdLogout,
  MdAdminPanelSettings,
  MdAdd,
  MdList,
  MdArticle,
  MdDarkMode,
  MdLightMode,
  MdExpandMore,
  MdChevronRight,
  MdRefresh,
  MdPerson,
  MdEmail,
  MdVerified,
  MdSecurity,
  MdStar,
  MdVerifiedUser,
  MdDashboardCustomize,
  MdCalendarToday,
  MdDescription,
  MdWarning,
  MdInfo,
  MdCheckCircle,
  MdError,
  MdClose,
  MdMenu,
  MdChevronLeft,
  MdBuild,
  MdDataUsage,
  MdMemory,
  MdSpeed,
  MdCloudUpload,
  MdRestorePage,
  MdBackup,
  MdStorage,
} from "react-icons/md";

import "../../styles/components/AdminLayout.css";

// ============================================================================
// CONSTANTS
// ============================================================================

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 80;

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

const getNavigationItems = () => [
  {
    title: "Dashboard",
    path: "/admin/dashboard",
    icon: <MdDashboard size={22} />,
    allowedRoles: ["admin", "super_admin", "faculty"],
  },
  {
    title: "Events",
    icon: <MdEvent size={22} />,
    children: [
      {
        title: "All Events",
        path: "/admin/events",
        icon: <MdList size={20} />,
      },
      {
        title: "Create Event",
        path: "/admin/events/create",
        icon: <MdAdd size={20} />,
      },
    ],
  },
  {
    title: "Notices",
    icon: <MdArticle size={22} />,
    children: [
      {
        title: "All Notices",
        path: "/admin/notices",
        icon: <MdList size={20} />,
      },
      {
        title: "Create Notice",
        path: "/admin/notices/create",
        icon: <MdAdd size={20} />,
      },
    ],
  },
  {
    title: "Users",
    path: "/admin/users",
    icon: <MdPeople size={22} />,
    allowedRoles: ["admin", "super_admin"],
  },
  {
    title: "Analytics",
    path: "/admin/analytics",
    icon: <MdAnalytics size={22} />,
    allowedRoles: ["admin", "super_admin", "faculty"],
  },
  {
    title: "Settings",
    path: "/admin/settings",
    icon: <MdSettings size={22} />,
    allowedRoles: ["admin", "super_admin"],
  },
];

// ============================================================================
// MAIN ADMIN LAYOUT COMPONENT
// ============================================================================

const AdminLayout = ({
  requireAdmin = false,
  requiredPermissions = [],
  showBreadcrumb = true,
  showNotifications = true,
  maxWidth = "1400px",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading, logout, hasPermission } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState(() => {
    const currentPath = location.pathname;
    const expanded = [];
    getNavigationItems().forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => currentPath === child.path,
        );
        if (hasActiveChild) {
          expanded.push(item.title);
        }
      }
    });
    return expanded;
  });
  const [pageLoading, setPageLoading] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New user registered",
      message: "A new user has joined the platform",
      time: "5 min ago",
      read: false,
    },
    {
      id: 2,
      title: "Event registration deadline",
      message: "Tech Conference registration ends tomorrow",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      title: "System update completed",
      message: "The system has been updated to version 2.0",
      time: "2 hours ago",
      read: true,
    },
  ]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [themeMode, setThemeMode] = useState(
    localStorage.getItem("themeMode") || "light",
  );

  // Handle responsive
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle page loading
  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => setPageLoading(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  // Apply theme
  useEffect(() => {
    document.body.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  // Check for required permissions
  const hasRequiredPermissions = useCallback(() => {
    if (requiredPermissions.length === 0) return true;
    return requiredPermissions.every((permission) => hasPermission(permission));
  }, [requiredPermissions, hasPermission]);

  // Check if user can access a navigation item
  const canAccessItem = (item) => {
    if (item.allowedRoles && !item.allowedRoles.includes(user?.role))
      return false;
    return true;
  };

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname;

    for (const item of getNavigationItems()) {
      if (item.path === path) return item.title;
      if (item.children) {
        const child = item.children.find((c) => c.path === path);
        if (child) return child.title;
      }
    }

    const titles = {
      dashboard: "Dashboard",
      users: "User Management",
      analytics: "Analytics",
      settings: "Settings",
      notices: "Notices",
      events: "Events",
    };

    const pathSegment = path.split("/").pop();
    return titles[pathSegment] || "Admin Panel";
  };

  // Get breadcrumb items
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const path = "/" + pathSegments.slice(0, i + 1).join("/");
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);

      if (segment === "create") label = "Create";
      else if (segment === "edit") label = "Edit";
      else if (segment.match(/^[0-9a-fA-F]{24}$/)) label = "Edit Event";

      breadcrumbs.push({ label, path });
    }

    return breadcrumbs;
  };

  // Handle logout
  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate("/login");
  };

  // Toggle menu expansion
  const toggleMenuExpansion = (title) => {
    setExpandedMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  // Check if menu is expanded
  const isMenuExpanded = (title) => expandedMenus.includes(title);

  // Mark notification as read
  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setNotificationMenuOpen(false);
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = themeMode === "light" ? "dark" : "light";
    setThemeMode(newTheme);
    localStorage.setItem("themeMode", newTheme);
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-layout">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Admin role check
  if (requireAdmin && user?.role !== "admin" && user?.role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Permissions check
  if (!hasRequiredPermissions()) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Drawer content
  const drawerContent = (
    <div className="drawer-container">
      {/* Logo Area */}
      <div className="drawer-logo">
        <MdAdminPanelSettings className="drawer-logo-icon" />
        {sidebarOpen && <h6 className="drawer-logo-text">Admin Panel</h6>}
      </div>

      {/* Navigation */}
      <div className="drawer-nav">
        <nav className="nav-list">
          {getNavigationItems().map((item) => {
            if (!canAccessItem(item)) return null;

            if (item.children) {
              const isExpanded = isMenuExpanded(item.title);
              return (
                <React.Fragment key={item.title}>
                  <div
                    className={`nav-item ${isExpanded ? "expanded" : ""}`}
                    onClick={() => toggleMenuExpansion(item.title)}
                  >
                    <div className="nav-icon">{item.icon}</div>
                    {sidebarOpen && (
                      <>
                        <div className="nav-text">{item.title}</div>
                        {isExpanded ? (
                          <MdExpandMore size={20} />
                        ) : (
                          <MdChevronRight size={20} />
                        )}
                      </>
                    )}
                  </div>
                  {sidebarOpen && (
                    <div className={`submenu ${isExpanded ? "expanded" : ""}`}>
                      {item.children.map((child) => {
                        const isActive = location.pathname === child.path;
                        return (
                          <div
                            key={child.title}
                            className={`submenu-item ${isActive ? "active" : ""}`}
                            onClick={() => navigate(child.path)}
                          >
                            <div className="submenu-icon">{child.icon}</div>
                            <div className="submenu-text">{child.title}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            }

            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.title}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <div className="nav-icon">{item.icon}</div>
                {sidebarOpen && <div className="nav-text">{item.title}</div>}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Area */}
      <div className="drawer-footer">
        <div className="logout-item" onClick={handleLogout}>
          <div className="logout-icon">
            <MdLogout size={22} />
          </div>
          {sidebarOpen && <div className="logout-text">Logout</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-layout" data-theme={themeMode}>
      {/* Page Loading Overlay */}
      <AnimatePresence>
        {pageLoading && (
          <motion.div
            className="page-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="loading-spinner"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Overlay */}
      {isMobile && sidebarOpen && (
        <div className="drawer-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Drawer */}
      <div
        className={`admin-drawer ${sidebarOpen ? "expanded" : "collapsed"} ${isMobile ? "mobile" : "desktop"}`}
      >
        {drawerContent}
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* App Bar */}
        <div className="admin-appbar">
          <div className="appbar-toolbar">
            <div className="appbar-left">
              <button
                className="menu-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <MdChevronLeft size={24} />
                ) : (
                  <FiMenu size={24} />
                )}
              </button>

              {/* Page Title & Breadcrumbs */}
              <div>
                <div className="page-title">{getPageTitle()}</div>
                {showBreadcrumb && getBreadcrumbs().length > 1 && (
                  <div className="breadcrumb">
                    {getBreadcrumbs().map((crumb, index) => (
                      <span key={crumb.path}>
                        {index > 0 && " / "}
                        {index === getBreadcrumbs().length - 1 ? (
                          <span className="breadcrumb-current">
                            {crumb.label}
                          </span>
                        ) : (
                          <span
                            className="breadcrumb-link"
                            onClick={() => navigate(crumb.path)}
                          >
                            {crumb.label}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="appbar-right">
              {/* Refresh Button */}
              <button
                className="icon-btn"
                onClick={() => window.location.reload()}
                title="Refresh page"
              >
                <MdRefresh size={22} />
              </button>

              {/* Theme Toggle */}
              <button
                className="icon-btn"
                onClick={toggleTheme}
                title={themeMode === "light" ? "Dark mode" : "Light mode"}
              >
                {themeMode === "dark" ? (
                  <FiSun size={22} />
                ) : (
                  <FiMoon size={22} />
                )}
              </button>

              {/* Notifications */}
              {showNotifications && (
                <div className="notification-wrapper">
                  <button
                    className="icon-btn"
                    onClick={() =>
                      setNotificationMenuOpen(!notificationMenuOpen)
                    }
                    title="Notifications"
                  >
                    <div className="notification-badge-container">
                      <MdNotifications size={22} />
                      {unreadCount > 0 && (
                        <span className="notification-badge">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {notificationMenuOpen && (
                      <motion.div
                        className="notification-menu"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="notification-header">
                          <span className="notification-title">
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <button
                              className="mark-all-btn"
                              onClick={markAllAsRead}
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        {notifications.length === 0 ? (
                          <div className="notification-empty">
                            <p>No notifications</p>
                          </div>
                        ) : (
                          <>
                            {notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`notification-item ${!notif.read ? "unread" : ""}`}
                                onClick={() => markNotificationAsRead(notif.id)}
                              >
                                <div className="notification-content">
                                  <div className="notification-item-title">
                                    {notif.title}
                                  </div>
                                  <div className="notification-item-message">
                                    {notif.message}
                                  </div>
                                  <div className="notification-item-time">
                                    {notif.time}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        <div className="notification-footer">
                          <button
                            className="view-all-btn"
                            onClick={() => {
                              setNotificationMenuOpen(false);
                              navigate("/notifications");
                            }}
                          >
                            View all notifications
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* User Menu */}
              <div className="user-menu-wrapper">
                <button
                  className="user-avatar-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="user-avatar">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "A"}
                  </div>
                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      className="user-menu"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="user-info">
                        <div className="user-name">
                          {user?.name || "Admin User"}
                        </div>
                        <div className="user-email">
                          {user?.email || "admin@kaaf.edu"}
                        </div>
                      </div>
                      <button
                        className="menu-item"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate("/profile");
                        }}
                      >
                        <FiUser size={18} />
                        <span>My Profile</span>
                      </button>
                      <button
                        className="menu-item"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate("/admin/settings");
                        }}
                      >
                        <MdSettings size={18} />
                        <span>Settings</span>
                      </button>
                      <div className="menu-divider"></div>
                      <button
                        className="menu-item logout-item"
                        onClick={handleLogout}
                      >
                        <MdLogout size={18} />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="content-container">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="admin-footer">
          <div className="footer-content">
            <div className="footer-copyright">
              &copy; {new Date().getFullYear()} KAAF University. All rights
              reserved.
            </div>
            <div className="footer-links">
              <a href="/help" className="footer-link">
                Help
              </a>
              <a href="/privacy" className="footer-link">
                Privacy
              </a>
              <a href="/terms" className="footer-link">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;


