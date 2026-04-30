// src/pages/MyRegistrationsPage.jsx - Plain CSS Version
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiDownload,
  FiEye,
  FiTrash2,
  FiFileText,
  FiImage,
  FiGrid,
  FiList,
  FiFilter,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiHeart,
  FiShare2,
  FiBookmark,
  FiUser,
  FiMail,
  FiPhone,
  FiInfo,
  FiAward,
} from "react-icons/fi";
import {
  MdEventAvailable,
  MdCancel,
  MdEventNote,
  MdCalendarToday,
  MdAccessTime,
  MdLocationOn,
  MdCheckCircle,
  MdPending,
  MdClearAll,
  MdDownload,
  MdWarningAmber,
  MdPictureAsPdf,
  MdImage,
  MdQrCode,
  MdEvent,
  MdPeople,
  MdVerified,
  MdStar,
  MdFavorite,
  MdShare,
  MdBookmark,
} from "react-icons/md";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../styles/components/MyRegistrationsPage.css";

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SAMPLE_REGISTRATIONS = [
  {
    id: 101,
    eventId: "1",
    registrationDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: "confirmed",
    ticketNumber: "TKT-2025-001234",
    qrCode:
      "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TKT-2025-001234",
    event: {
      id: "1",
      title: "Annual Tech Conference 2025",
      description:
        "Join us for a full-day technology conference featuring keynotes from industry leaders...",
      date: new Date(Date.now() + 7 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 7 * 86400000 + 8 * 3600000).toISOString(),
      location: "Main Auditorium, Block A",
      category: "conference",
      organizer: "IT Department",
      capacity: 500,
      registered: 342,
    },
  },
  {
    id: 102,
    eventId: "2",
    registrationDate: new Date(Date.now() - 12 * 86400000).toISOString(),
    status: "confirmed",
    ticketNumber: "TKT-2025-001567",
    qrCode:
      "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TKT-2025-001567",
    event: {
      id: "2",
      title: "Student Leadership Workshop",
      description:
        "An interactive workshop designed to develop leadership skills...",
      date: new Date(Date.now() + 3 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 3 * 86400000 + 3 * 3600000).toISOString(),
      location: "Conference Room B, Admin Block",
      category: "workshop",
      organizer: "Student Affairs",
      capacity: 80,
      registered: 78,
    },
  },
  {
    id: 103,
    eventId: "3",
    registrationDate: new Date(Date.now() - 20 * 86400000).toISOString(),
    status: "pending",
    ticketNumber: null,
    qrCode: null,
    event: {
      id: "3",
      title: "Cultural Night 2025",
      description:
        "Celebrate the rich diversity of our university community...",
      date: new Date(Date.now() + 14 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 14 * 86400000 + 5 * 3600000).toISOString(),
      location: "Open Grounds, Main Campus",
      category: "social",
      organizer: "Cultural Committee",
      capacity: 1000,
      registered: 210,
    },
  },
  {
    id: 104,
    eventId: "5",
    registrationDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "cancelled",
    ticketNumber: null,
    qrCode: null,
    event: {
      id: "5",
      title: "Career Fair & Recruitment Drive",
      description: "Connect with top employers across industries...",
      date: new Date(Date.now() + 10 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 10 * 86400000 + 4 * 3600000).toISOString(),
      location: "Sports Complex, Ground Floor",
      category: "career",
      organizer: "Career Services",
      capacity: 600,
      registered: 401,
    },
  },
];

const STATUS_CONFIG = {
  confirmed: {
    label: "Confirmed",
    color: "#10b981",
    icon: <FiCheckCircle size={14} />,
  },
  pending: {
    label: "Pending",
    color: "#f59e0b",
    icon: <FiAlertCircle size={14} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "#ef4444",
    icon: <FiXCircle size={14} />,
  },
};

const CATEGORY_COLORS = {
  conference: "#6366f1",
  workshop: "#f59e0b",
  academic: "#3b82f6",
  social: "#10b981",
  career: "#8b5cf6",
  sports: "#ef4444",
};

// ============================================================================
// HELPERS
// ============================================================================

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isEventUpcoming = (eventDate) => new Date(eventDate) > new Date();
const isEventOngoing = (eventDate, endDate) => {
  const now = new Date();
  return now >= new Date(eventDate) && now <= new Date(endDate);
};

// ============================================================================
// TICKET PDF GENERATION
// ============================================================================

const generateTicketPDF = async (registration, user) => {
  const { event, ticketNumber, registrationDate, qrCode } = registration;
  const ticketElement = document.createElement("div");
  ticketElement.className = "ticket-pdf-container";
  ticketElement.innerHTML = `
    <div class="ticket-pdf">
      <div class="ticket-pdf-header">
        <h1>KAAF University</h1>
        <p>Official Noticeboard & Events Portal</p>
      </div>
      <div class="ticket-pdf-body">
        <h2>Event Ticket</h2>
        <h3>${event.title}</h3>
        <p>${event.description.substring(0, 150)}...</p>
        <div class="ticket-pdf-details">
          <div><strong>DATE:</strong> ${formatDate(event.date)}</div>
          <div><strong>TIME:</strong> ${formatTime(event.date)} - ${formatTime(event.endDate)}</div>
          <div><strong>LOCATION:</strong> ${event.location}</div>
          <div><strong>ORGANIZER:</strong> ${event.organizer}</div>
          <div><strong>TICKET:</strong> ${ticketNumber}</div>
          <div><strong>REGISTERED:</strong> ${formatDateTime(registrationDate)}</div>
        </div>
        <div class="ticket-pdf-footer">
          <div><strong>${user?.name || "Valued Attendee"}</strong><br/>${user?.email || ""}</div>
          ${qrCode ? `<img src="${qrCode}" alt="QR Code" />` : ""}
        </div>
      </div>
      <div class="ticket-pdf-bottom">
        <p>This ticket is valid for entry. Please present this ticket at the venue.</p>
      </div>
    </div>
  `;
  document.body.appendChild(ticketElement);
  try {
    const canvas = await html2canvas(ticketElement, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      imgWidth,
      imgHeight,
    );
    pdf.save(`ticket-${event.title.replace(/\s+/g, "-")}-${ticketNumber}.pdf`);
  } finally {
    document.body.removeChild(ticketElement);
  }
};

// ============================================================================
// REGISTRATION CARD COMPONENT
// ============================================================================

const RegistrationCard = ({
  registration,
  onCancel,
  onViewDetails,
  onViewTicket,
  index,
}) => {
  const { event, status, registrationDate, ticketNumber } = registration;
  const statusConfig = STATUS_CONFIG[status];
  const categoryColor = CATEGORY_COLORS[event.category] || "#6366f1";
  const isUpcoming = isEventUpcoming(event.date);
  const canCancel = status === "confirmed" && isUpcoming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="registration-card"
    >
      <div
        className="card-accent"
        style={{
          background: `linear-gradient(90deg, ${categoryColor}, ${categoryColor}80)`,
        }}
      />
      <div
        className="card-status-badge"
        style={{ background: statusConfig.color, color: "white" }}
      >
        {statusConfig.icon} {statusConfig.label}
      </div>

      <div className="card-content">
        <div className="card-header">
          <span
            className="category-chip"
            style={{ background: `${categoryColor}18`, color: categoryColor }}
          >
            {event.category}
          </span>
        </div>

        <h3 className="card-title">{event.title}</h3>
        <p className="card-organizer">By {event.organizer}</p>

        <div className="card-details">
          <div className="detail-row">
            <FiCalendar size={14} />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="detail-row">
            <FiClock size={14} />
            <span>
              {formatTime(event.date)} – {formatTime(event.endDate)}
            </span>
          </div>
          <div className="detail-row">
            <FiMapPin size={14} />
            <span>{event.location}</span>
          </div>
        </div>

        <div className="card-divider"></div>

        <div className="card-registration-info">
          <div>
            <span className="info-label">Registered on</span>
            <span className="info-value">
              {formatDateTime(registrationDate)}
            </span>
          </div>
          {ticketNumber && (
            <div>
              <span className="info-label">Ticket ID</span>
              <span className="info-value ticket-id">{ticketNumber}</span>
            </div>
          )}
        </div>

        {isUpcoming && status === "confirmed" && (
          <div className="capacity-section">
            <div className="capacity-header">
              <span>
                Capacity: {event.registered}/{event.capacity}
              </span>
              <span>
                {Math.round((event.registered / event.capacity) * 100)}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(event.registered / event.capacity) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="card-divider"></div>

      <div className="card-actions">
        <button
          className="btn-outline small"
          onClick={() => onViewDetails(event.id)}
        >
          <FiEye size={14} /> View Event
        </button>
        {ticketNumber && status === "confirmed" && (
          <button
            className="btn-icon"
            onClick={() => onViewTicket(registration)}
            title="View Ticket"
          >
            <FiDownload size={16} />
          </button>
        )}
        {canCancel && (
          <button
            className="btn-danger small"
            onClick={() => onCancel(registration)}
          >
            <FiXCircle size={14} /> Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// SKELETON CARD
// ============================================================================

const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-accent"></div>
    <div className="skeleton-content">
      <div className="skeleton-chip"></div>
      <div className="skeleton-title"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-detail"></div>
      <div className="skeleton-detail"></div>
      <div className="skeleton-divider"></div>
      <div className="skeleton-info"></div>
      <div className="skeleton-actions"></div>
    </div>
  </div>
);

// ============================================================================
// MOCK AUTH HOOK (TEMPORARY SOLUTION)
// ============================================================================

// This is a temporary mock useAuth hook
// Replace this with your actual auth import when ready
const useMockAuth = () => {
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@kaafuniversity.edu",
    id: "STU12345",
    role: "student",
  });

  return { user, setUser };
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const MyRegistrationsPage = () => {
  const navigate = useNavigate();
  // USING MOCK AUTH INSTEAD OF REAL useAuth
  // Replace this line with: const { user } = useAuth(); when your auth is ready
  const { user } = useMockAuth();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const itemsPerPage = 6;

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRegistrations(SAMPLE_REGISTRATIONS);
      setLoading(false);
    }, 800);
  }, []);

  const showSnackbar = (message, type) => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 4000);
  };

  const filteredRegistrations = useMemo(() => {
    let list = [...registrations];

    // Filter by active tab
    if (activeTab === 1) {
      list = list.filter(
        (r) => r.status === "confirmed" && isEventUpcoming(r.event.date),
      );
    } else if (activeTab === 2) {
      list = list.filter((r) => r.status === "pending");
    } else if (activeTab === 3) {
      list = list.filter((r) => r.status === "cancelled");
    } else if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.event.title.toLowerCase().includes(q) ||
          r.event.organizer.toLowerCase().includes(q),
      );
    }

    // Sort by registration date (newest first)
    return list.sort(
      (a, b) => new Date(b.registrationDate) - new Date(a.registrationDate),
    );
  }, [registrations, searchQuery, statusFilter, activeTab]);

  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, activeTab]);

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter((r) => r.status === "confirmed").length,
    pending: registrations.filter((r) => r.status === "pending").length,
    cancelled: registrations.filter((r) => r.status === "cancelled").length,
    upcoming: registrations.filter(
      (r) => r.status === "confirmed" && isEventUpcoming(r.event.date),
    ).length,
  };

  const tabs = [
    { label: "All", count: stats.total },
    { label: "Upcoming", count: stats.upcoming },
    { label: "Pending", count: stats.pending },
    { label: "Cancelled", count: stats.cancelled },
  ];

  const handleCancel = (registration) => {
    setSelectedRegistration(registration);
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (selectedRegistration) {
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === selectedRegistration.id
            ? { ...r, status: "cancelled", ticketNumber: null, qrCode: null }
            : r,
        ),
      );
      showSnackbar(
        `Cancelled registration for "${selectedRegistration.event.title}"`,
        "success",
      );
    }
    setCancelDialogOpen(false);
    setSelectedRegistration(null);
  };

  const handleViewTicket = (registration) => {
    setSelectedRegistration(registration);
    setTicketDialogOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (selectedRegistration) {
      await generateTicketPDF(selectedRegistration, user);
      showSnackbar("Ticket downloaded as PDF!", "success");
      setTicketDialogOpen(false);
    }
  };

  const handleDownloadImage = async () => {
    if (selectedRegistration) {
      const { event, ticketNumber } = selectedRegistration;
      const ticketElement = document.createElement("div");
      ticketElement.className = "ticket-image-container";
      ticketElement.innerHTML = `
        <div class="ticket-image">
          <h3>${event.title}</h3>
          <p>${formatDate(event.date)} | ${event.location}</p>
          <p>Ticket: ${ticketNumber}</p>
        </div>
      `;
      document.body.appendChild(ticketElement);
      try {
        const canvas = await html2canvas(ticketElement);
        const link = document.createElement("a");
        link.download = `ticket-${event.title.replace(/\s+/g, "-")}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        showSnackbar("Ticket downloaded as Image!", "success");
        setTicketDialogOpen(false);
      } finally {
        document.body.removeChild(ticketElement);
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setActiveTab(0);
  };

  const hasFilters = searchQuery || statusFilter !== "all" || activeTab !== 0;

  return (
    <div className="registrations-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="container">
          <h1 className="hero-title">My Registrations</h1>
          <p className="hero-subtitle">
            Track and manage all your event registrations in one place.
          </p>
          <div className="hero-stats">
            <div>
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div>
              <span className="stat-value" style={{ color: "#10b981" }}>
                {stats.confirmed}
              </span>
              <span className="stat-label">Confirmed</span>
            </div>
            <div>
              <span className="stat-value" style={{ color: "#f59e0b" }}>
                {stats.upcoming}
              </span>
              <span className="stat-label">Upcoming</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-section">
        <div className="container">
          {/* Search and Filter Bar */}
          <div className="filter-bar">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search your registrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {hasFilters && (
              <button className="clear-btn" onClick={clearFilters}>
                <FiX size={16} /> Clear
              </button>
            )}
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

          {/* Results Count */}
          <div className="results-count">
            {loading
              ? "Loading your registrations..."
              : `${filteredRegistrations.length} registration${filteredRegistrations.length !== 1 ? "s" : ""} found`}
          </div>

          {/* Registrations Grid */}
          {loading ? (
            <div className="registrations-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="empty-state">
              <MdEventAvailable size={64} />
              <h3>No registrations found</h3>
              <p>
                {hasFilters
                  ? "Try adjusting your filters to see more results."
                  : "You haven't registered for any events yet."}
              </p>
              {hasFilters ? (
                <button className="btn-outline" onClick={clearFilters}>
                  Clear Filters
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => navigate("/events")}
                >
                  Browse Events
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="registrations-grid">
                {paginatedRegistrations.map((reg, idx) => (
                  <RegistrationCard
                    key={reg.id}
                    registration={reg}
                    onCancel={handleCancel}
                    onViewDetails={(id) => navigate(`/events/${id}`)}
                    onViewTicket={handleViewTicket}
                    index={idx}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className={`pagination-btn ${currentPage === 1 ? "disabled" : ""}`}
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((p) => p - 1);
                      window.scrollTo({ top: 0 });
                    }}
                  >
                    <FiChevronLeft size={16} /> Previous
                  </button>
                  <div className="pagination-pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          className={`pagination-page ${currentPage === p ? "active" : ""}`}
                          onClick={() => {
                            setCurrentPage(p);
                            window.scrollTo({ top: 0 });
                          }}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    className={`pagination-btn ${currentPage === totalPages ? "disabled" : ""}`}
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((p) => p + 1);
                      window.scrollTo({ top: 0 });
                    }}
                  >
                    Next <FiChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AnimatePresence>
        {cancelDialogOpen && selectedRegistration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="dialog-overlay"
            onClick={() => setCancelDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="dialog-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dialog-header">
                <h3>Cancel Registration</h3>
                <button
                  className="dialog-close"
                  onClick={() => setCancelDialogOpen(false)}
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
                      Cancel your registration for{" "}
                      <strong>"{selectedRegistration.event.title}"</strong>?
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="dialog-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setCancelDialogOpen(false)}
                >
                  Keep Registration
                </button>
                <button className="btn-danger" onClick={confirmCancel}>
                  Yes, Cancel Registration
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket Dialog */}
      <AnimatePresence>
        {ticketDialogOpen && selectedRegistration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="dialog-overlay"
            onClick={() => setTicketDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="dialog-container ticket-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dialog-header">
                <h3>Your Event Ticket</h3>
                <button
                  className="dialog-close"
                  onClick={() => setTicketDialogOpen(false)}
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="dialog-body">
                <div className="ticket-preview">
                  <div className="ticket-header">
                    <h2>{selectedRegistration.event.title}</h2>
                    <p className="ticket-subtitle">
                      {selectedRegistration.event.organizer}
                    </p>
                  </div>
                  <div className="ticket-details-grid">
                    <div className="ticket-detail-item">
                      <FiCalendar size={18} />
                      <div>
                        <strong>Date</strong>
                        <span>
                          {formatDate(selectedRegistration.event.date)}
                        </span>
                      </div>
                    </div>
                    <div className="ticket-detail-item">
                      <FiClock size={18} />
                      <div>
                        <strong>Time</strong>
                        <span>
                          {formatTime(selectedRegistration.event.date)} -{" "}
                          {formatTime(selectedRegistration.event.endDate)}
                        </span>
                      </div>
                    </div>
                    <div className="ticket-detail-item">
                      <FiMapPin size={18} />
                      <div>
                        <strong>Location</strong>
                        <span>{selectedRegistration.event.location}</span>
                      </div>
                    </div>
                    <div className="ticket-detail-item">
                      <FiUser size={18} />
                      <div>
                        <strong>Attendee</strong>
                        <span>{user?.name || "Guest"}</span>
                      </div>
                    </div>
                    <div className="ticket-detail-item">
                      <FiMail size={18} />
                      <div>
                        <strong>Email</strong>
                        <span>{user?.email || "guest@example.com"}</span>
                      </div>
                    </div>
                    <div className="ticket-detail-item">
                      <FiAward size={18} />
                      <div>
                        <strong>Ticket ID</strong>
                        <span className="ticket-id-value">
                          {selectedRegistration.ticketNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedRegistration.qrCode && (
                    <div className="ticket-qr-section">
                      <img
                        src={selectedRegistration.qrCode}
                        alt="QR Code"
                        className="ticket-qr"
                      />
                      <p>Scan this QR code at the venue entrance</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="dialog-footer">
                <button className="btn-outline" onClick={handleDownloadPDF}>
                  <MdPictureAsPdf size={18} /> Download PDF
                </button>
                <button className="btn-primary" onClick={handleDownloadImage}>
                  <MdImage size={18} /> Save as Image
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setTicketDialogOpen(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snackbar/Toast Notifications */}
      <AnimatePresence>
        {snackbar.open && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className={`snackbar ${snackbar.type}`}
          >
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
              <FiX size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyRegistrationsPage;
