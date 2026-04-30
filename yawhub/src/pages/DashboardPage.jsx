// src/pages/DashboardPage.jsx - FIXED VERSION (No duplicate declarations)
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  FiCalendar,
  FiBell,
  FiUsers,
  FiEye,
  FiMoreVertical,
  FiRefreshCw,
  FiDownload,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiMail,
  FiMessageSquare,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiStar,
  FiHeart,
  FiBookmark,
  FiShare2,
  FiMapPin,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
  FiFilter,
  FiSliders,
} from "react-icons/fi";
import {
  MdDashboard,
  MdEvent,
  MdAnnouncement,
  MdPeople,
  MdVisibility,
  MdMoreVert,
  MdRefresh,
  MdDownload,
  MdAdd,
  MdEdit,
  MdDelete,
  MdTrendingUp,
  MdTrendingDown,
  MdSchedule,
  MdAccessTime,
  MdEmail,
  MdSms,
  MdPushPin,
  MdFavorite,
  MdSearch,
  MdClose,
  MdCheckCircle,
  MdWarning,
  MdInfo,
  MdStar,
  MdBookmark,
  MdShare,
  MdLocationOn,
  MdPerson,
  MdSettings,
  MdLogout,
  MdMenu,
  MdChevronLeft,
  MdChevronRight,
  MdGridOn,
  MdList,
  MdFilterList,
  MdTune,
} from "react-icons/md";
import "../styles/components/DashboardPage.css";

// Sample Data
const upcomingEvents = [
  {
    id: 1,
    title: "Tech Conference 2025",
    date: "2025-01-25T10:00:00",
    time: "10:00 AM",
    venue: "Main Hall, Building A",
    attendees: 156,
    maxAttendees: 200,
    priority: "high",
    description:
      "Annual technology conference featuring industry leaders and innovative workshops.",
    category: "conference",
  },
  {
    id: 2,
    title: "Staff Monthly Meeting",
    date: "2025-01-20T14:00:00",
    time: "2:00 PM",
    venue: "Conference Room A",
    attendees: 45,
    maxAttendees: 50,
    priority: "medium",
    description: "Monthly staff meeting to discuss upcoming initiatives.",
    category: "meeting",
  },
  {
    id: 3,
    title: "Student Leadership Workshop",
    date: "2025-01-28T09:00:00",
    time: "9:00 AM",
    venue: "Student Center",
    attendees: 78,
    maxAttendees: 100,
    priority: "high",
    description: "Leadership development workshop for student leaders.",
    category: "workshop",
  },
  {
    id: 4,
    title: "Cultural Festival",
    date: "2025-02-01T16:00:00",
    time: "4:00 PM",
    venue: "University Grounds",
    attendees: 320,
    maxAttendees: 500,
    priority: "medium",
    description:
      "Annual cultural celebration with performances and food stalls.",
    category: "social",
  },
];

const DashboardPage = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [events, setEvents] = useState(upcomingEvents);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [viewMode, setViewMode] = useState("grid");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setRefreshing(false);
    showSnackbar("Dashboard refreshed!", "success");
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 4000);
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(handleRefresh, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, handleRefresh]);

  const handleExportData = (type) => {
    handleMenuClose();
    showSnackbar(`Exporting ${type}...`, "info");
    setTimeout(() => showSnackbar("Export completed!", "success"), 1200);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [events, searchQuery]);

  const handleCreateAction = (type) => {
    setCreateType(type);
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = () => {
    setCreateDialogOpen(false);
    showSnackbar(`${createType} created successfully!`, "success");
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
      showSnackbar("Event deleted successfully", "success");
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444", label: "High" },
      medium: {
        bg: "rgba(245, 158, 11, 0.1)",
        color: "#f59e0b",
        label: "Medium",
      },
      low: { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981", label: "Low" },
    };
    return colors[priority] || colors.medium;
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "EEE, MMM dd, yyyy");
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), "h:mm a");
  };

  const EventCard = ({ event }) => {
    const priorityColor = getPriorityColor(event.priority);
    const percentage = (event.attendees / event.maxAttendees) * 100;

    return (
      <motion.div
        className="event-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        <div className="event-card-header">
          <div className="event-card-badges">
            <span
              className="priority-badge"
              style={{
                backgroundColor: priorityColor.bg,
                color: priorityColor.color,
              }}
            >
              {priorityColor.label} Priority
            </span>
            <span className="category-badge">{event.category}</span>
          </div>
          <button className="event-menu-btn">
            <FiMoreVertical size={18} />
          </button>
        </div>

        <div className="event-card-content">
          <h3 className="event-card-title">{event.title}</h3>
          <p className="event-card-description">{event.description}</p>

          <div className="event-card-details">
            <div className="detail-item">
              <FiCalendar size={14} />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="detail-item">
              <FiClock size={14} />
              <span>{formatTime(event.date)}</span>
            </div>
            <div className="detail-item">
              <FiMapPin size={14} />
              <span>{event.venue}</span>
            </div>
            <div className="detail-item">
              <FiUsers size={14} />
              <span>
                {event.attendees}/{event.maxAttendees}
              </span>
            </div>
          </div>

          <div className="event-card-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="progress-text">
              {Math.round(percentage)}% filled
            </span>
          </div>

          <div className="event-card-actions">
            <button className="action-btn edit">
              <FiEdit2 size={14} /> Edit
            </button>
            <button
              className="action-btn delete"
              onClick={() => {
                setSelectedEvent(event);
                setDeleteDialogOpen(true);
              }}
            >
              <FiTrash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const EventTableRow = ({ event, index }) => {
    const priorityColor = getPriorityColor(event.priority);
    const percentage = (event.attendees / event.maxAttendees) * 100;

    return (
      <motion.tr
        className="event-table-row"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <td className="event-title-cell">{event.title}</td>
        <td>{formatDate(event.date)}</td>
        <td>{event.venue}</td>
        <td>
          <div className="capacity-cell">
            <span>
              {event.attendees}/{event.maxAttendees}
            </span>
            <div className="mini-progress">
              <div
                className="mini-progress-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </td>
        <td>
          <span
            className="priority-chip"
            style={{
              backgroundColor: priorityColor.bg,
              color: priorityColor.color,
            }}
          >
            {priorityColor.label}
          </span>
        </td>
        <td className="actions-cell">
          <button className="table-action-btn edit" title="Edit">
            <FiEdit2 size={16} />
          </button>
          <button
            className="table-action-btn delete"
            title="Delete"
            onClick={() => {
              setSelectedEvent(event);
              setDeleteDialogOpen(true);
            }}
          >
            <FiTrash2 size={16} />
          </button>
        </td>
      </motion.tr>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">
              <MdDashboard size={28} /> Dashboard
            </h1>
            <p className="dashboard-subtitle">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div className="header-actions">
            <div className="auto-refresh-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">Auto Refresh</span>
            </div>
            <button
              className="header-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <MdRefresh size={18} className={refreshing ? "spin" : ""} />{" "}
              Refresh
            </button>
            <div className="dropdown">
              <button className="header-btn" onClick={handleMenuOpen}>
                <MdDownload size={18} /> Export
              </button>
              {anchorEl && (
                <div className="dropdown-menu">
                  <button onClick={() => handleExportData("PDF")}>PDF</button>
                  <button onClick={() => handleExportData("Excel")}>
                    Excel
                  </button>
                  <button onClick={() => handleExportData("CSV")}>CSV</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading Bar */}
        {loading && (
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="search-section">
          <div className="search-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search events by title or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery("")}
              >
                <FiX size={16} />
              </button>
            )}
          </div>
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <FiGrid size={18} /> Grid
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <FiList size={18} /> List
            </button>
          </div>
        </div>

        {/* Events Display */}
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No events found</h3>
            <p>Try adjusting your search or create a new event</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="events-grid">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="events-table-container">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Capacity</th>
                  <th>Priority</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event, idx) => (
                  <EventTableRow key={event.id} event={event} index={idx} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick Action */}
        <div className="quick-action">
          <button
            className="create-btn"
            onClick={() => handleCreateAction("Event")}
          >
            <FiPlus size={18} /> Create New Event
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {deleteDialogOpen && (
            <div
              className="dialog-overlay"
              onClick={() => setDeleteDialogOpen(false)}
            >
              <motion.div
                className="dialog-container dialog-small"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="dialog-header">
                  <h3 className="dialog-title">Delete Event</h3>
                  <button
                    className="dialog-close"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    <FiX size={20} />
                  </button>
                </div>
                <div className="dialog-body">
                  <div className="alert-warning">
                    <FiAlertCircle size={24} />
                    <div>
                      <strong>Are you sure?</strong>
                      <p>
                        This will permanently delete "{selectedEvent?.title}"
                        and all associated data.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="dialog-footer">
                  <button
                    className="btn-secondary"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn-danger" onClick={handleDeleteEvent}>
                    Delete Event
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Dialog */}
        <AnimatePresence>
          {createDialogOpen && (
            <div
              className="dialog-overlay"
              onClick={() => setCreateDialogOpen(false)}
            >
              <motion.div
                className="dialog-container"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="dialog-header">
                  <h3 className="dialog-title">Create {createType}</h3>
                  <button
                    className="dialog-close"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    <FiX size={20} />
                  </button>
                </div>
                <div className="dialog-body">
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter title"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      rows="3"
                      placeholder="Enter description"
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date & Time</label>
                    <input type="datetime-local" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Venue</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter venue"
                    />
                  </div>
                </div>
                <div className="dialog-footer">
                  <button
                    className="btn-secondary"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleCreateSubmit}>
                    Create
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Snackbar */}
        <AnimatePresence>
          {snackbar.open && (
            <motion.div
              className={`snackbar ${snackbar.severity}`}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {snackbar.severity === "success" ? (
                <FiCheckCircle size={18} />
              ) : (
                <FiAlertCircle size={18} />
              )}
              <span>{snackbar.message}</span>
              <button
                className="snackbar-close"
                onClick={() =>
                  setSnackbar((prev) => ({ ...prev, open: false }))
                }
              >
                <FiX size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardPage;
