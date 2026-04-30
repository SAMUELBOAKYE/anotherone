// src/pages/NotificationsPage.jsx - Plain CSS Version
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  differenceInDays,
} from "date-fns";
import {
  FiBell,
  FiBellOff,
  FiCalendar,
  FiFileText,
  FiTrash2,
  FiCheckCircle,
  FiSettings,
  FiSearch,
  FiRefreshCw,
  FiStar,
  FiStar as FiStarSolid,
  FiClock,
  FiArchive,
  FiMail,
  FiMessageSquare,
  FiBell as FiBellActive,
  FiAlertCircle,
  FiInfo,
  FiCheck,
  FiX,
  FiMoreVertical,
  FiFilter,
  FiSliders,
  FiTag,
  FiFlag,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import {
  MdNotificationsActive,
  MdNotificationsNone,
  MdEvent,
  MdAnnouncement,
  MdDelete,
  MdDeleteSweep,
  MdDoneAll,
  MdSettings,
  MdSearch,
  MdUpdate,
  MdWarning,
  MdEmail,
  MdSms,
  MdPushPin,
  MdStar,
  MdStarBorder,
  MdAccessTime,
  MdArchive,
  MdRefresh,
  MdSortByAlpha,
  MdViewList,
  MdAddAlert,
  MdDone,
  MdInfo,
  MdCheckCircle,
  MdError,
  MdCancel,
  MdClose,
  MdFilterList,
  MdFlag,
  MdLabel,
} from "react-icons/md";
import notificationService from "../services/notificationService";
import { useAuth } from "../context/AuthContext";
import "../styles/components/NotificationsPage.css";

// ============================================================================
// HELPERS
// ============================================================================

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "#ef4444";
    case "medium":
      return "#f59e0b";
    case "low":
      return "#10b981";
    default:
      return "#64748b";
  }
};

const getPriorityIcon = (priority) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return <FiAlertCircle size={12} />;
    case "medium":
      return <FiFlag size={12} />;
    case "low":
      return <FiCheckCircle size={12} />;
    default:
      return <FiInfo size={12} />;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const NotificationsPage = () => {
  const { user, isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [filterCategory, setFilterCategory] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    pushEnabled: true,
    desktopEnabled: false,
    soundEnabled: true,
    eventReminders: true,
    noticeAlerts: true,
    systemUpdates: true,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  });

  const itemsPerPage = 10;

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 3000);
  };

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await notificationService.getNotifications({
        page: currentPage,
        limit: itemsPerPage,
      });
      const notificationList = Array.isArray(result.notifications)
        ? result.notifications
        : [];
      setNotifications(notificationList);
      setTotalPages(result.pagination?.pages || 1);
      setTotalNotifications(result.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      showSnackbar("Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentPage]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filteredNotifications = useMemo(() => {
    let list = [...notifications];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.message?.toLowerCase().includes(q),
      );
    }
    if (activeTab === 1) list = list.filter((n) => !n.read);
    if (showUnreadOnly) list = list.filter((n) => !n.read);
    if (filterCategory !== "all")
      list = list.filter((n) => n.type === filterCategory);
    list.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
    return list;
  }, [
    notifications,
    searchQuery,
    activeTab,
    showUnreadOnly,
    filterCategory,
    sortOrder,
  ]);

  const paginatedNotifications = filteredNotifications.slice(0, itemsPerPage);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const groupedNotifications = useMemo(() => {
    const getGroup = (date) => {
      const d = new Date(date);
      if (isToday(d)) return "Today";
      if (isYesterday(d)) return "Yesterday";
      if (differenceInDays(new Date(), d) <= 7) return "This Week";
      return "Earlier";
    };
    return paginatedNotifications.reduce((acc, n) => {
      const g = getGroup(n.createdAt || n.date);
      if (!acc[g]) acc[g] = [];
      acc[g].push(n);
      return acc;
    }, {});
  }, [paginatedNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
    showSnackbar("Notifications refreshed!");
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id || n._id === id ? { ...n, read: true } : n,
        ),
      );
      showSnackbar("Marked as read");
    } catch (error) {
      showSnackbar("Failed to mark as read", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showSnackbar("All notifications marked as read");
    } catch (error) {
      showSnackbar("Failed to mark all as read", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) =>
        prev.filter((n) => n.id !== id && n._id !== id),
      );
      setSelectedNotifications((prev) => prev.filter((sid) => sid !== id));
      showSnackbar("Notification deleted", "info");
    } catch (error) {
      showSnackbar("Failed to delete notification", "error");
    }
  };

  const handleDeleteSelected = async () => {
    try {
      for (const id of selectedNotifications) {
        await notificationService.deleteNotification(id);
      }
      setNotifications((prev) =>
        prev.filter(
          (n) =>
            !selectedNotifications.includes(n.id) &&
            !selectedNotifications.includes(n._id),
        ),
      );
      showSnackbar(
        `${selectedNotifications.length} notification(s) deleted`,
        "info",
      );
      setSelectedNotifications([]);
      setSelectMode(false);
    } catch (error) {
      showSnackbar("Failed to delete notifications", "error");
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await notificationService.deleteReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.read));
      showSnackbar("All read notifications cleared", "info");
    } catch (error) {
      showSnackbar("Failed to delete read notifications", "error");
    }
  };

  const handleToggleImportant = (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id || n._id === id ? { ...n, important: !n.important } : n,
      ),
    );
  };

  const handleSelectNotification = (id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === paginatedNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(
        paginatedNotifications.map((n) => n.id || n._id),
      );
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      event: <MdEvent size={18} />,
      notice: <MdAnnouncement size={18} />,
      announcement: <MdAnnouncement size={18} />,
      alert: <MdWarning size={18} />,
      warning: <MdWarning size={18} />,
      error: <MdError size={18} />,
      success: <MdCheckCircle size={18} />,
      info: <MdInfo size={18} />,
      system: <MdSettings size={18} />,
      update: <MdUpdate size={18} />,
    };
    return icons[type?.toLowerCase()] ?? <MdNotificationsActive size={18} />;
  };

  const getNotificationColor = (type) => {
    const colors = {
      event: "#6366f1",
      notice: "#8b5cf6",
      announcement: "#8b5cf6",
      alert: "#ef4444",
      warning: "#f59e0b",
      error: "#ef4444",
      success: "#10b981",
      info: "#3b82f6",
      system: "#64748b",
      update: "#3b82f6",
    };
    return colors[type?.toLowerCase()] ?? "#64748b";
  };

  const tabs = [
    { label: "All", count: totalNotifications },
    { label: "Unread", count: unreadCount },
    {
      label: "Important",
      count: notifications.filter((n) => n.important).length,
    },
  ];

  if (loading && !refreshing) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="container">
        {/* Header */}
        <div className="page-header glass-card">
          <div className="header-title">
            <MdNotificationsActive size={32} className="header-icon" />
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <MdRefresh size={20} className={refreshing ? "spin" : ""} />
            </button>
            {selectMode ? (
              <>
                <button
                  className="btn-outline small"
                  onClick={() => setSelectMode(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger small"
                  onClick={handleDeleteSelected}
                  disabled={selectedNotifications.length === 0}
                >
                  <MdDelete size={16} /> Delete ({selectedNotifications.length})
                </button>
                <button className="btn-outline small" onClick={handleSelectAll}>
                  {selectedNotifications.length ===
                  paginatedNotifications.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-outline"
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <MdDoneAll size={16} /> Mark All Read
                </button>
                <button
                  className="btn-outline-danger"
                  onClick={handleDeleteAllRead}
                  disabled={notifications.filter((n) => n.read).length === 0}
                >
                  <MdDeleteSweep size={16} /> Clear Read
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="filters-bar glass-card">
          <div className="filters-row">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="category-filters">
              {["all", "event", "notice", "system"].map((cat) => (
                <button
                  key={cat}
                  className={`filter-chip ${filterCategory === cat ? "active" : ""}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  {cat !== "all" ? "s" : ""}
                </button>
              ))}
            </div>
            <div className="filter-options">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Unread only</span>
              </label>
              <button
                className="sort-btn"
                onClick={() =>
                  setSortOrder((o) => (o === "desc" ? "asc" : "desc"))
                }
              >
                <MdSortByAlpha size={16} /> Date{" "}
                {sortOrder === "desc" ? "↓" : "↑"}
              </button>
              <button
                className={`select-btn ${selectMode ? "active" : ""}`}
                onClick={() => setSelectMode(!selectMode)}
              >
                <MdViewList size={16} /> Select
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                className={`tab-btn ${activeTab === idx ? "active" : ""}`}
                onClick={() => setActiveTab(idx)}
              >
                {tab.label} <span className="tab-count">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {paginatedNotifications.length === 0 ? (
          <div className="empty-state glass-card">
            <MdNotificationsNone size={64} />
            <h3>No notifications to display</h3>
            <p>When you receive notifications, they will appear here.</p>
            <button className="btn-outline" onClick={handleRefresh}>
              Refresh
            </button>
          </div>
        ) : (
          <div className="notifications-list">
            {Object.entries(groupedNotifications).map(([group, items]) => (
              <div key={group} className="notification-group">
                <div className="group-header">
                  <span className="group-title">{group}</span>
                </div>
                {items.map((notification) => {
                  const notifId = notification.id || notification._id;
                  const notificationColor = getNotificationColor(
                    notification.type,
                  );
                  return (
                    <div
                      key={notifId}
                      className={`notification-item ${selectedNotifications.includes(notifId) ? "selected" : ""} ${!notification.read ? "unread" : ""}`}
                    >
                      {selectMode && (
                        <input
                          type="checkbox"
                          className="select-checkbox"
                          checked={selectedNotifications.includes(notifId)}
                          onChange={() => handleSelectNotification(notifId)}
                        />
                      )}
                      {notification.pinned && (
                        <div className="pinned-icon">
                          <MdPushPin size={14} />
                        </div>
                      )}
                      <div
                        className="notification-avatar"
                        style={{
                          backgroundColor: `${notificationColor}18`,
                          color: notificationColor,
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <div className="notification-header">
                          <span
                            className="notification-title"
                            style={{
                              fontWeight: !notification.read ? "700" : "500",
                            }}
                          >
                            {notification.title}
                          </span>
                          <div className="notification-badges">
                            {!notification.read && (
                              <span className="badge new">New</span>
                            )}
                            {notification.important && (
                              <span className="badge important">Important</span>
                            )}
                            {notification.type && (
                              <span className="badge type">
                                {notification.type}
                              </span>
                            )}
                            {notification.priority && (
                              <span
                                className="badge priority"
                                style={{
                                  backgroundColor: `${getPriorityColor(notification.priority)}18`,
                                  color: getPriorityColor(
                                    notification.priority,
                                  ),
                                }}
                              >
                                {getPriorityIcon(notification.priority)}{" "}
                                {notification.priority}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="notification-message">
                          {notification.message}
                        </p>
                        <div className="notification-time">
                          <FiClock size={12} />
                          <span>
                            {formatDistanceToNow(
                              new Date(
                                notification.createdAt || notification.date,
                              ),
                              { addSuffix: true },
                            )}
                          </span>
                        </div>
                      </div>
                      {!selectMode && (
                        <div className="notification-actions">
                          {!notification.read && (
                            <button
                              className="action-btn"
                              onClick={() => handleMarkAsRead(notifId)}
                              title="Mark as read"
                            >
                              <MdDone size={16} />
                            </button>
                          )}
                          <button
                            className="action-btn"
                            onClick={() => handleToggleImportant(notifId)}
                            title={
                              notification.important
                                ? "Remove from important"
                                : "Mark as important"
                            }
                          >
                            {notification.important ? (
                              <MdStar size={16} color="#fbbf24" />
                            ) : (
                              <MdStarBorder size={16} />
                            )}
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(notifId)}
                            title="Delete"
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className={`pagination-btn ${currentPage === 1 ? "disabled" : ""}`}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        className={`pagination-page ${currentPage === p ? "active" : ""}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>
                <button
                  className={`pagination-btn ${currentPage === totalPages ? "disabled" : ""}`}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="btn-primary" onClick={() => setSettingsOpen(true)}>
            <FiMail size={16} /> Email Preferences
          </button>
          <button className="btn-outline" onClick={() => setSettingsOpen(true)}>
            <MdSettings size={16} /> Notification Settings
          </button>
          <button
            className="btn-outline"
            onClick={() => {
              if (Notification.permission === "granted") {
                new Notification("Desktop notifications enabled");
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
              }
            }}
          >
            <MdAddAlert size={16} /> Enable Desktop Alerts
          </button>
        </div>
      </div>

      {/* Settings Dialog */}
      <AnimatePresence>
        {settingsOpen && (
          <div
            className="dialog-overlay"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              className="dialog-container"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dialog-header">
                <h3>
                  <MdSettings size={20} /> Notification Settings
                </h3>
                <button
                  className="dialog-close"
                  onClick={() => setSettingsOpen(false)}
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="dialog-body">
                <h4 className="settings-section-title">
                  Notification Channels
                </h4>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailEnabled}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        emailEnabled: e.target.checked,
                      }))
                    }
                  />{" "}
                  Email Notifications
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.pushEnabled}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        pushEnabled: e.target.checked,
                      }))
                    }
                  />{" "}
                  Push Notifications
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.desktopEnabled}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        desktopEnabled: e.target.checked,
                      }))
                    }
                  />{" "}
                  Desktop Notifications
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.soundEnabled}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        soundEnabled: e.target.checked,
                      }))
                    }
                  />{" "}
                  Sound Alerts
                </label>

                <h4 className="settings-section-title">Notification Types</h4>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.eventReminders}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        eventReminders: e.target.checked,
                      }))
                    }
                  />{" "}
                  Event Reminders
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.noticeAlerts}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        noticeAlerts: e.target.checked,
                      }))
                    }
                  />{" "}
                  Notice Alerts
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.systemUpdates}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        systemUpdates: e.target.checked,
                      }))
                    }
                  />{" "}
                  System Updates
                </label>

                <h4 className="settings-section-title">Quiet Hours</h4>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notificationSettings.quietHoursEnabled}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        quietHoursEnabled: e.target.checked,
                      }))
                    }
                  />{" "}
                  Enable Quiet Hours
                </label>
                {notificationSettings.quietHoursEnabled && (
                  <div className="quiet-hours-inputs">
                    <input
                      type="time"
                      value={notificationSettings.quietHoursStart}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          quietHoursStart: e.target.value,
                        }))
                      }
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={notificationSettings.quietHoursEnd}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          quietHoursEnd: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>
              <div className="dialog-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setSettingsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSettingsOpen(false);
                    showSnackbar("Settings saved!");
                  }}
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

export default NotificationsPage;
