import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import "../styles/components/AdminNotificationsPage.css";

// Icons
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21M9 11C11.2 11 13 9.2 13 7C13 4.8 11.2 3 9 3C6.8 3 5 4.8 5 7C5 9.2 6.8 11 9 11Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M23 21V19C22.9 16.8 21.1 15 18.9 15M16 3C18.2 3 20 4.8 20 7C20 9.2 18.2 11 16 11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 6H5H21M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 11V17M14 11V17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const AdminNotificationsPage = () => {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [showSendModal, setShowSendModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info",
    audience: "all",
    scheduledFor: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    read: 0,
    unread: 0,
    sent: 0,
  });
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Check admin access
  useEffect(() => {
    if (!isAdmin && user?.role !== "admin") {
      setAlert({
        show: true,
        type: "error",
        message: "Access denied. Admin privileges required.",
      });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    }
  }, [isAdmin, user]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/notifications");
      setNotifications(response.data.notifications || []);
      setStats(
        response.data.stats || { total: 0, read: 0, unread: 0, sent: 0 },
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setAlert({
        show: true,
        type: "error",
        message:
          error.response?.data?.message || "Failed to load notifications",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Send notification
  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!notificationForm.title.trim()) {
      setAlert({ show: true, type: "error", message: "Title is required" });
      return;
    }

    if (!notificationForm.message.trim()) {
      setAlert({ show: true, type: "error", message: "Message is required" });
      return;
    }

    try {
      setSending(true);
      const response = await api.post(
        "/admin/notifications/send",
        notificationForm,
      );

      setAlert({
        show: true,
        type: "success",
        message: response.data.message || "Notification sent successfully!",
      });

      setShowSendModal(false);
      setNotificationForm({
        title: "",
        message: "",
        type: "info",
        audience: "all",
        scheduledFor: "",
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error sending notification:", error);
      setAlert({
        show: true,
        type: "error",
        message: error.response?.data?.message || "Failed to send notification",
      });
    } finally {
      setSending(false);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      await api.delete(`/admin/notifications/${id}`);
      setAlert({
        show: true,
        type: "success",
        message: "Notification deleted successfully",
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      setAlert({
        show: true,
        type: "error",
        message:
          error.response?.data?.message || "Failed to delete notification",
      });
    }
  };

  // Mark as read
  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/admin/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (selectedType === "all") return true;
    if (selectedType === "read") return notif.read;
    if (selectedType === "unread") return !notif.read;
    return notif.type === selectedType;
  });

  // Get notification type class
  const getTypeClass = (type) => {
    switch (type) {
      case "success":
        return "notification-type-success";
      case "error":
        return "notification-type-error";
      case "warning":
        return "notification-type-warning";
      default:
        return "notification-type-info";
    }
  };

  // Auto-hide alert
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ show: false, type: "", message: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  if (!isAdmin && user?.role !== "admin") {
    return (
      <div className="admin-notifications-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <button onClick={() => (window.location.href = "/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-notifications-container">
      {/* Alert Banner */}
      {alert.show && (
        <div className={`alert-banner alert-${alert.type}`}>
          <span>{alert.message}</span>
          <button
            onClick={() => setAlert({ show: false, type: "", message: "" })}
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="notifications-header">
        <div className="header-title">
          <BellIcon />
          <h1>Notifications Management</h1>
        </div>
        <button
          className="send-notification-btn"
          onClick={() => setShowSendModal(true)}
        >
          <SendIcon />
          Send Notification
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">📬</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Notifications</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon sent">✅</div>
          <div className="stat-info">
            <h3>{stats.sent}</h3>
            <p>Sent</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon read">👁️</div>
          <div className="stat-info">
            <h3>{stats.read}</h3>
            <p>Read</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon unread">📩</div>
          <div className="stat-info">
            <h3>{stats.unread}</h3>
            <p>Unread</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${selectedType === "all" ? "active" : ""}`}
            onClick={() => setSelectedType("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${selectedType === "unread" ? "active" : ""}`}
            onClick={() => setSelectedType("unread")}
          >
            Unread
          </button>
          <button
            className={`filter-btn ${selectedType === "read" ? "active" : ""}`}
            onClick={() => setSelectedType("read")}
          >
            Read
          </button>
          <button
            className={`filter-btn ${selectedType === "info" ? "active" : ""}`}
            onClick={() => setSelectedType("info")}
          >
            Info
          </button>
          <button
            className={`filter-btn ${selectedType === "success" ? "active" : ""}`}
            onClick={() => setSelectedType("success")}
          >
            Success
          </button>
          <button
            className={`filter-btn ${selectedType === "warning" ? "active" : ""}`}
            onClick={() => setSelectedType("warning")}
          >
            Warning
          </button>
          <button
            className={`filter-btn ${selectedType === "error" ? "active" : ""}`}
            onClick={() => setSelectedType("error")}
          >
            Error
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <BellIcon />
            <h3>No notifications found</h3>
            <p>Send your first notification to get started</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? "unread" : ""} ${getTypeClass(notification.type)}`}
              onClick={() =>
                !notification.read && handleMarkAsRead(notification._id)
              }
            >
              <div className="notification-content">
                <div className="notification-header">
                  <h3>{notification.title}</h3>
                  <span className="notification-date">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="notification-message">{notification.message}</p>
                <div className="notification-meta">
                  <span
                    className={`notification-type-badge ${getTypeClass(notification.type)}`}
                  >
                    {notification.type}
                  </span>
                  <span className="notification-audience">
                    <UsersIcon />
                    {notification.audience === "all"
                      ? "All Users"
                      : notification.audience}
                  </span>
                </div>
              </div>
              <button
                className="delete-notification-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNotification(notification._id);
                }}
              >
                <TrashIcon />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="modal-overlay" onClick={() => setShowSendModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Notification</h2>
              <button
                className="modal-close"
                onClick={() => setShowSendModal(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleSendNotification}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={notificationForm.title}
                  onChange={(e) =>
                    setNotificationForm({
                      ...notificationForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter notification title"
                  maxLength="100"
                  required
                />
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea
                  value={notificationForm.message}
                  onChange={(e) =>
                    setNotificationForm({
                      ...notificationForm,
                      message: e.target.value,
                    })
                  }
                  placeholder="Enter notification message"
                  rows="4"
                  maxLength="500"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={notificationForm.type}
                    onChange={(e) =>
                      setNotificationForm({
                        ...notificationForm,
                        type: e.target.value,
                      })
                    }
                  >
                    <option value="info">Information</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Audience</label>
                  <select
                    value={notificationForm.audience}
                    onChange={(e) =>
                      setNotificationForm({
                        ...notificationForm,
                        audience: e.target.value,
                      })
                    }
                  >
                    <option value="all">All Users</option>
                    <option value="students">Students Only</option>
                    <option value="staff">Staff Only</option>
                    <option value="admins">Admins Only</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={notificationForm.scheduledFor}
                  onChange={(e) =>
                    setNotificationForm({
                      ...notificationForm,
                      scheduledFor: e.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowSendModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Send Notification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsPage;
