// src/pages/ManageEventsPage.jsx - COMPLETELY IMAGE-FREE VERSION (FIXED)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiDownload,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiStar,
  FiGrid,
  FiList,
  FiFilter,
  FiSliders,
  FiX,
} from "react-icons/fi";
import {
  MdEvent,
  MdLocationOn,
  MdPeople,
  MdAccessTime,
  MdCheckCircle,
  MdCancel,
  MdWarning,
  MdDownload,
  MdRefresh,
  MdContentCopy,
  MdStar,
  MdEventAvailable,
  MdCategory,
  MdCalendarToday,
  MdDelete,
  MdEdit,
  MdVisibility,
  MdMoreVert,
} from "react-icons/md";
import "../styles/components/ManageEventsPage.css";

const ManageEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [viewMode, setViewMode] = useState("grid");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Mock events data - NO IMAGES
  useEffect(() => {
    const mockEvents = [
      {
        id: 1,
        title: "Annual Tech Conference 2024",
        description:
          "Join us for the biggest tech conference of the year featuring industry leaders, networking opportunities, and hands-on workshops with expert speakers from around the globe.",
        date: "2024-12-15T10:00:00",
        endDate: "2024-12-15T18:00:00",
        location: "Main Auditorium, Building A",
        category: "conference",
        status: "published",
        registered: 450,
        capacity: 500,
        organizer: "Tech Department",
        featured: true,
        price: 49.99,
        tags: ["technology", "conference", "networking", "innovation"],
      },
      {
        id: 2,
        title: "Leadership Workshop Series",
        description:
          "Develop your leadership skills with our expert facilitators. Learn practical strategies for effective team management and career growth.",
        date: "2024-12-20T09:00:00",
        endDate: "2024-12-20T17:00:00",
        location: "Business School Hall",
        category: "workshop",
        status: "published",
        registered: 120,
        capacity: 150,
        organizer: "Leadership Institute",
        featured: false,
        price: 29.99,
        tags: ["leadership", "workshop", "development", "career"],
      },
      {
        id: 3,
        title: "Research Symposium",
        description:
          "Showcase your research and connect with fellow researchers. Submit your papers for presentation and win amazing prizes.",
        date: "2025-01-10T08:00:00",
        endDate: "2025-01-10T16:00:00",
        location: "Research Center",
        category: "academic",
        status: "draft",
        registered: 0,
        capacity: 200,
        organizer: "Research Office",
        featured: false,
        price: 0,
        tags: ["research", "academic", "symposium", "science"],
      },
      {
        id: 4,
        title: "Networking Gala",
        description:
          "An evening of networking with industry professionals, great food, entertainment, and amazing opportunities.",
        date: "2024-12-25T18:00:00",
        endDate: "2024-12-25T22:00:00",
        location: "Grand Ballroom",
        category: "social",
        status: "cancelled",
        registered: 80,
        capacity: 300,
        organizer: "Alumni Association",
        featured: false,
        price: 75,
        tags: ["networking", "gala", "social", "party"],
      },
      {
        id: 5,
        title: "Career Fair 2024",
        description:
          "Connect with top employers and explore career opportunities. Bring your resume and meet industry leaders.",
        date: "2024-11-30T09:00:00",
        endDate: "2024-11-30T17:00:00",
        location: "Convention Center",
        category: "career",
        status: "ended",
        registered: 320,
        capacity: 350,
        organizer: "Career Services",
        featured: true,
        price: 0,
        tags: ["career", "jobs", "networking", "hiring"],
      },
      {
        id: 6,
        title: "Sports Championship",
        description:
          "Annual inter-college sports championship. Compete in various sports and win trophies.",
        date: "2025-02-15T09:00:00",
        endDate: "2025-02-15T18:00:00",
        location: "Sports Complex",
        category: "sports",
        status: "published",
        registered: 250,
        capacity: 500,
        organizer: "Sports Department",
        featured: false,
        price: 10,
        tags: ["sports", "championship", "competition"],
      },
    ];

    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  const showSnackbar = (message, type) => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 4000);
  };

  const getCategoryConfig = (category) => {
    const configs = {
      conference: {
        label: "Conference",
        color: "#6366f1",
        bg: "rgba(99, 102, 241, 0.1)",
        icon: <MdEvent size={14} />,
      },
      workshop: {
        label: "Workshop",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.1)",
        icon: <FiUsers size={14} />,
      },
      academic: {
        label: "Academic",
        color: "#3b82f6",
        bg: "rgba(59, 130, 246, 0.1)",
        icon: <FiCalendar size={14} />,
      },
      social: {
        label: "Social",
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.1)",
        icon: <FiUsers size={14} />,
      },
      career: {
        label: "Career",
        color: "#8b5cf6",
        bg: "rgba(139, 92, 246, 0.1)",
        icon: <FiStar size={14} />,
      },
      sports: {
        label: "Sports",
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.1)",
        icon: <FiStar size={14} />,
      },
    };
    return configs[category] || configs.conference;
  };

  const getStatusConfig = (status) => {
    const configs = {
      published: {
        label: "Published",
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.1)",
        icon: <FiCheckCircle size={14} />,
      },
      draft: {
        label: "Draft",
        color: "#6b7280",
        bg: "rgba(107, 114, 128, 0.1)",
        icon: <FiAlertCircle size={14} />,
      },
      cancelled: {
        label: "Cancelled",
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.1)",
        icon: <FiXCircle size={14} />,
      },
      ended: {
        label: "Ended",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.1)",
        icon: <FiClock size={14} />,
      },
    };
    return configs[status] || configs.draft;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || event.status === filterStatus;
    const matchesType = filterType === "all" || event.category === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleDeleteEvent = () => {
    if (eventToDelete) {
      setEvents(events.filter((e) => e.id !== eventToDelete.id));
      showSnackbar(`"${eventToDelete.title}" has been deleted`, "success");
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    const deletedCount = selectedEvents.length;
    setEvents(events.filter((e) => !selectedEvents.includes(e.id)));
    showSnackbar(
      `${deletedCount} event${deletedCount > 1 ? "s" : ""} deleted successfully`,
      "success",
    );
    setSelectedEvents([]);
  };

  const handleDuplicate = (event) => {
    const newEvent = {
      ...event,
      id: Date.now(),
      title: `${event.title} (Copy)`,
      status: "draft",
      registered: 0,
    };
    setEvents([...events, newEvent]);
    showSnackbar(`"${event.title}" duplicated successfully`, "success");
  };

  const handleToggleSelect = (eventId) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId],
    );
  };

  const handleSelectAll = () => {
    if (selectedEvents.length === paginatedEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(paginatedEvents.map((e) => e.id));
    }
  };

  const EventCard = ({ event }) => {
    const category = getCategoryConfig(event.category);
    const status = getStatusConfig(event.status);
    const attendanceRate = (event.registered / event.capacity) * 100;
    const isUpcoming = new Date(event.date) > new Date();

    return (
      <motion.div
        className="event-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
      >
        <div className="event-card-header">
          <div className="event-card-badges">
            <span
              className="category-badge"
              style={{ background: category.bg, color: category.color }}
            >
              {category.icon} {category.label}
            </span>
            <span
              className={`status-badge ${event.status}`}
              style={{ background: status.bg, color: status.color }}
            >
              {status.icon} {status.label}
            </span>
            {event.featured && (
              <span className="featured-badge">
                <FiStar size={12} /> Featured
              </span>
            )}
          </div>
          <div className="event-card-checkbox">
            <input
              type="checkbox"
              checked={selectedEvents.includes(event.id)}
              onChange={() => handleToggleSelect(event.id)}
              id={`select-${event.id}`}
            />
          </div>
        </div>

        <div className="event-card-content">
          <h3 className="event-card-title">{event.title}</h3>
          <p className="event-card-description">
            {event.description.substring(0, 120)}...
          </p>

          <div className="event-card-details">
            <div className="detail-item">
              <FiCalendar size={14} />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="detail-item">
              <FiMapPin size={14} />
              <span>{event.location}</span>
            </div>
            <div className="detail-item">
              <FiUsers size={14} />
              <span>
                {event.registered}/{event.capacity}
              </span>
            </div>
            {event.price > 0 && (
              <div className="detail-item price">
                <span>${event.price}</span>
              </div>
            )}
          </div>

          <div className="event-card-progress">
            <div className="progress-bar">
              <div
                className={`progress-fill ${attendanceRate >= 90 ? "full" : attendanceRate >= 75 ? "warning" : "success"}`}
                style={{ width: `${Math.min(attendanceRate, 100)}%` }}
              />
            </div>
            <span className="progress-text">
              {Math.round(attendanceRate)}% filled
            </span>
          </div>

          <div className="event-card-actions">
            <button
              className="action-btn view"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <FiEye size={16} /> View
            </button>
            <button
              className="action-btn edit"
              onClick={() => navigate(`/admin/events/edit/${event.id}`)}
            >
              <FiEdit2 size={16} /> Edit
            </button>
            <button
              className="action-btn duplicate"
              onClick={() => handleDuplicate(event)}
            >
              <FiCopy size={16} /> Copy
            </button>
            <button
              className="action-btn delete"
              onClick={() => {
                setEventToDelete(event);
                setDeleteDialogOpen(true);
              }}
            >
              <FiTrash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const EventTableRow = ({ event, index }) => {
    const category = getCategoryConfig(event.category);
    const status = getStatusConfig(event.status);
    const attendanceRate = (event.registered / event.capacity) * 100;

    return (
      <motion.tr
        className="event-table-row"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.04)" }}
      >
        <td className="checkbox-cell">
          <input
            type="checkbox"
            checked={selectedEvents.includes(event.id)}
            onChange={() => handleToggleSelect(event.id)}
            id={`select-table-${event.id}`}
          />
        </td>
        <td className="title-cell">
          <div className="title-info">
            <div
              className="title-icon"
              style={{ background: category.bg, color: category.color }}
            >
              {category.icon}
            </div>
            <div>
              <div className="title-name">{event.title}</div>
              <div className="title-organizer">{event.organizer}</div>
            </div>
          </div>
        </td>
        <td>
          <span
            className="category-chip"
            style={{ background: category.bg, color: category.color }}
          >
            {category.label}
          </span>
        </td>
        <td>{formatDate(event.date)}</td>
        <td>{event.location}</td>
        <td>
          <div className="capacity-info">
            <span>
              {event.registered}/{event.capacity}
            </span>
            <div className="mini-progress">
              <div
                className="mini-progress-fill"
                style={{ width: `${Math.min(attendanceRate, 100)}%` }}
              />
            </div>
          </div>
        </td>
        <td>
          <span className={`status-chip ${event.status}`}>
            {status.icon} {status.label}
          </span>
        </td>
        <td className="actions-cell">
          <button
            className="table-action-btn"
            title="View"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            <FiEye size={16} />
          </button>
          <button
            className="table-action-btn"
            title="Edit"
            onClick={() => navigate(`/admin/events/edit/${event.id}`)}
          >
            <FiEdit2 size={16} />
          </button>
          <button
            className="table-action-btn"
            title="Duplicate"
            onClick={() => handleDuplicate(event)}
          >
            <FiCopy size={16} />
          </button>
          <button
            className="table-action-btn delete"
            title="Delete"
            onClick={() => {
              setEventToDelete(event);
              setDeleteDialogOpen(true);
            }}
          >
            <FiTrash2 size={16} />
          </button>
        </td>
      </motion.tr>
    );
  };

  if (loading) {
    return (
      <div className="manage-events-loading">
        <div className="loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="manage-events-page">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">All Events</h1>
          <p className="page-subtitle">
            Manage and organize your events from one central dashboard
          </p>
        </div>
        <button
          className="create-event-btn"
          onClick={() => navigate("/admin/events/create")}
        >
          <FiPlus size={18} /> Create New Event
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search events by title, description, or organizer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm("")}>
              <FiX size={16} />
            </button>
          )}
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
            <option value="ended">Ended</option>
          </select>

          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="conference">Conference</option>
            <option value="workshop">Workshop</option>
            <option value="academic">Academic</option>
            <option value="social">Social</option>
            <option value="career">Career</option>
            <option value="sports">Sports</option>
          </select>

          <button
            className="filter-btn"
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
          >
            <FiSliders size={18} />
            <span>Filters</span>
          </button>

          <button
            className="view-toggle"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <FiList size={18} /> : <FiGrid size={18} />}
          </button>

          <button
            className="refresh-btn"
            onClick={() => window.location.reload()}
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {selectedEvents.length > 0 && (
        <motion.div
          className="bulk-actions-bar"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="bulk-info">
            <FiCheckCircle size={18} />
            <span>
              {selectedEvents.length} event
              {selectedEvents.length > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="bulk-actions">
            <button
              className="bulk-btn export"
              onClick={() => showSnackbar("Export started", "success")}
            >
              <FiDownload size={16} /> Export
            </button>
            <button className="bulk-btn delete" onClick={handleBulkDelete}>
              <FiTrash2 size={16} /> Delete Selected
            </button>
          </div>
        </motion.div>
      )}

      {filteredEvents.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="empty-icon">📭</div>
          <h3>No events found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <button
            className="clear-filters-btn"
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
              setFilterType("all");
            }}
          >
            Clear all filters
          </button>
        </motion.div>
      ) : viewMode === "grid" ? (
        <div className="events-grid">
          {paginatedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="events-table-container">
          <table className="events-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={
                      selectedEvents.length === paginatedEvents.length &&
                      paginatedEvents.length > 0
                    }
                    onChange={handleSelectAll}
                    id="select-all"
                  />
                </th>
                <th>Event</th>
                <th>Category</th>
                <th>Date</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.map((event, idx) => (
                <EventTableRow key={event.id} event={event} index={idx} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            <FiChevronLeft size={18} />
          </button>
          <div className="pagination-pages">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`pagination-page ${currentPage === pageNum ? "active" : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="pagination-ellipsis">...</span>
            )}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <button
                className="pagination-page"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </button>
            )}
          </div>
          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteDialogOpen && (
          <div
            className="dialog-overlay"
            onClick={() => setDeleteDialogOpen(false)}
          >
            <motion.div
              className="dialog-container dialog-small"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dialog-header">
                <h3 className="dialog-title">Delete Event</h3>
                <button
                  className="dialog-close"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="dialog-body">
                <div className="alert-warning">
                  <FiAlertCircle size={32} />
                  <div>
                    <strong>Are you absolutely sure?</strong>
                    <p>
                      This action cannot be undone. This will permanently delete{" "}
                      <strong>"{eventToDelete?.title}"</strong> and all
                      associated data including registrations and analytics.
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
                  <FiTrash2 size={16} /> Delete Event
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Snackbar Notifications */}
      <AnimatePresence>
        {snackbar.open && (
          <motion.div
            className={`snackbar ${snackbar.type}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {snackbar.type === "success" ? (
              <FiCheckCircle size={20} />
            ) : (
              <FiAlertCircle size={20} />
            )}
            <span>{snackbar.message}</span>
            <button
              className="snackbar-close"
              onClick={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            >
              <FiX size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageEventsPage;
