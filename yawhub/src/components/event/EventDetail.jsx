// src/components/event/EventDetail.jsx - No images, pure CSS styling
import React, { useState, useCallback, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiShare2,
  FiBookmark,
  FiCheckCircle,
  FiX,
  FiCalendar as FiEventAvailable,
  FiClock as FiTimer,
  FiInfo,
  FiMail,
  FiMessageCircle,
  FiTwitter,
  FiCopy,
  FiPrinter,
  FiPhone,
  FiUserCheck,
  FiMap,
  FiAward,
  FiStar,
  FiHeart,
  FiTrendingUp,
  FiAlertCircle,
  FiChevronRight,
  FiChevronLeft,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiSettings,
  FiUser,
  FiBriefcase,
  FiBookOpen,
  FiTarget,
  FiGlobe,
  FiLinkedin,
  FiGithub,
  FiInstagram,
  FiFacebook,
  FiYoutube,
  FiPlus,
  FiMinus,
} from "react-icons/fi";
import {
  MdCalendarToday,
  MdAccessTime,
  MdLocationOn,
  MdPeople,
  MdShare,
  MdBookmarkBorder,
  MdBookmark,
  MdCheckCircle,
  MdClose,
  MdEventAvailable,
  MdTimer,
  MdInfo,
  MdEmail,
  MdWhatsApp,
  MdTwitter,
  MdContentCopy,
  MdPrint,
  MdPhone,
  MdVerified,
  MdGroup,
  MdRoom,
  MdSchedule,
  MdStar,
  MdFavorite,
  MdFavoriteBorder,
  MdEvent,
  MdPerson,
  MdBusiness,
  MdSchool,
  MdWork,
  MdLocationCity,
} from "react-icons/md";
import {
  FaWhatsapp,
  FaTwitter,
  FaEnvelope,
  FaPrint,
  FaShare,
  FaBookmark,
  FaRegBookmark,
  FaCheckCircle,
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaUserTie,
  FaMicrophone,
  FaChalkboardTeacher,
} from "react-icons/fa";
import "../../styles/components/EventDetail.css";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (date) => {
  if (!date) return "TBD";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (date) => {
  if (!date) return "TBD";
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatRelativeTime = (date) => {
  const now = new Date();
  const eventDate = new Date(date);
  const diffTime = eventDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Event ended";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return `${diffDays} days left`;
  return `${Math.ceil(diffDays / 7)} weeks left`;
};

const getCategoryConfig = (category) => {
  const configs = {
    conference: {
      color: "#6366f1",
      bg: "rgba(99, 102, 241, 0.1)",
      gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      icon: <FaUserTie size={16} />,
      label: "Conference",
    },
    workshop: {
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
      gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
      icon: <FaChalkboardTeacher size={16} />,
      label: "Workshop",
    },
    academic: {
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.1)",
      gradient: "linear-gradient(135deg, #3b82f6, #06b6d4)",
      icon: <FiBookOpen size={16} />,
      label: "Academic",
    },
    social: {
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)",
      gradient: "linear-gradient(135deg, #10b981, #34d399)",
      icon: <FiUsers size={16} />,
      label: "Social",
    },
    career: {
      color: "#8b5cf6",
      bg: "rgba(139, 92, 246, 0.1)",
      gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
      icon: <FiBriefcase size={16} />,
      label: "Career",
    },
    sports: {
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.1)",
      gradient: "linear-gradient(135deg, #ef4444, #f87171)",
      icon: <FiAward size={16} />,
      label: "Sports",
    },
  };
  return configs[category] || configs.conference;
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

const EventDetailSkeleton = () => {
  return (
    <div className="event-detail-skeleton">
      <div className="skeleton-container">
        <div className="skeleton-grid">
          <div className="skeleton-main">
            <div className="skeleton-card">
              <div className="skeleton-chip"></div>
              <div className="skeleton-title"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-heading"></div>
              <div className="skeleton-paragraph"></div>
              <div className="skeleton-paragraph"></div>
            </div>
          </div>
          <div className="skeleton-sidebar">
            <div className="skeleton-card">
              <div className="skeleton-heading"></div>
              <div className="skeleton-info-item"></div>
              <div className="skeleton-info-item"></div>
              <div className="skeleton-info-item"></div>
              <div className="skeleton-button"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// REGISTRATION DIALOG
// ============================================================================

const RegistrationDialog = ({ open, event, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    studentId: "",
    department: "",
    yearOfStudy: "",
    specialRequirements: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onConfirm(formData);
      onClose();
      setStep(1);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        studentId: "",
        department: "",
        yearOfStudy: "",
        specialRequirements: "",
      });
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <motion.div
        className="dialog-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <h3 className="dialog-title">Register for Event</h3>
            <p className="dialog-subtitle">{event?.title}</p>
          </div>
          <button className="dialog-close" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>

        <div className="dialog-body">
          {step === 1 ? (
            <div>
              <div className="alert-info">
                <FiInfo size={18} />
                <span>
                  Please provide your personal information to complete
                  registration.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  placeholder="+1234567890"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Student ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                  placeholder="Optional for students"
                />
                <small className="form-helper">
                  Required for student events
                </small>
              </div>
            </div>
          ) : (
            <div>
              <div className="alert-success">
                <FiCheckCircle size={18} />
                <span>Almost there! Please provide additional details.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder="Your department"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Year of Study</label>
                <select
                  className="form-select"
                  value={formData.yearOfStudy}
                  onChange={(e) =>
                    setFormData({ ...formData, yearOfStudy: e.target.value })
                  }
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="postgraduate">Postgraduate</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Special Requirements / Accessibility Needs
                </label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={formData.specialRequirements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specialRequirements: e.target.value,
                    })
                  }
                  placeholder="Any special accommodations needed..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          {step === 1 ? (
            <>
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleNext}
                disabled={
                  !formData.fullName || !formData.email || !formData.phone
                }
              >
                Next <FiChevronRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={handleBack}>
                <FiChevronLeft size={16} /> Back
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <div className="spinner-small"></div>
                ) : (
                  "Confirm Registration"
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================================
// SHARE DIALOG
// ============================================================================

const ShareDialog = ({ open, event, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const shareOptions = [
    {
      icon: <MdEmail size={20} />,
      label: "Email",
      color: "#ea4335",
      action: () =>
        (window.location.href = `mailto:?subject=${encodeURIComponent(event?.title || "Event")}&body=${encodeURIComponent(shareUrl)}`),
    },
    {
      icon: <FaWhatsapp size={20} />,
      label: "WhatsApp",
      color: "#25D366",
      action: () =>
        window.open(
          `https://wa.me/?text=${encodeURIComponent(event?.title + " - " + shareUrl)}`,
          "_blank",
        ),
    },
    {
      icon: <FaTwitter size={20} />,
      label: "Twitter",
      color: "#1DA1F2",
      action: () =>
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(event?.title)}&url=${encodeURIComponent(shareUrl)}`,
          "_blank",
        ),
    },
    {
      icon: <MdContentCopy size={20} />,
      label: copied ? "Copied!" : "Copy Link",
      color: "#6b7280",
      action: handleCopy,
    },
  ];

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <motion.div
        className="dialog-container dialog-small"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 className="dialog-title">Share Event</h3>
          <button className="dialog-close" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>
        <div className="dialog-body">
          <p className="share-description">
            Share this event with friends and colleagues
          </p>
          <div className="share-grid">
            {shareOptions.map((option, index) => (
              <button
                key={index}
                className="share-option"
                onClick={option.action}
                style={{ borderColor: `${option.color}40` }}
              >
                <span style={{ color: option.color }}>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================================
// MAIN EVENT DETAIL COMPONENT
// ============================================================================

const EventDetail = ({ event, loading }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [registered, setRegistered] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (event && user) {
      const registeredEvents = JSON.parse(
        localStorage.getItem("registered_events") || "[]",
      );
      setRegistered(registeredEvents.includes(event.id));
    }
  }, [event, user]);

  useEffect(() => {
    if (event) {
      const favorites = JSON.parse(
        localStorage.getItem("favorite_events") || "[]",
      );
      setIsFavorite(favorites.includes(event.id));
    }
  }, [event]);

  const showSnackbar = (message, type) => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 4000);
  };

  if (loading) return <EventDetailSkeleton />;
  if (!event) return null;

  const categoryConfig = getCategoryConfig(event.category);
  const isUpcoming = event?.date ? new Date(event.date) > new Date() : false;
  const isFull = event?.registered >= event?.capacity;
  const capacityPct = event?.capacity
    ? Math.round((event.registered / event.capacity) * 100)
    : 0;
  const canRegister =
    isUpcoming && !isFull && !registered && event?.registrationOpen !== false;

  const handleRegister = () => {
    if (!user) {
      showSnackbar("Please login to register for events", "warning");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }
    setRegisterDialogOpen(true);
  };

  const handleConfirmRegistration = async (formData) => {
    try {
      const registeredEvents = JSON.parse(
        localStorage.getItem("registered_events") || "[]",
      );
      registeredEvents.push(event.id);
      localStorage.setItem(
        "registered_events",
        JSON.stringify(registeredEvents),
      );

      const registrations = JSON.parse(
        localStorage.getItem("event_registrations") || "[]",
      );
      registrations.push({
        eventId: event.id,
        eventTitle: event.title,
        registrationDate: new Date().toISOString(),
        ...formData,
      });
      localStorage.setItem(
        "event_registrations",
        JSON.stringify(registrations),
      );

      setRegistered(true);
      showSnackbar("Successfully registered for the event!", "success");
    } catch (error) {
      showSnackbar("Registration failed. Please try again.", "error");
    }
  };

  const handleFavoriteToggle = () => {
    const favorites = JSON.parse(
      localStorage.getItem("favorite_events") || "[]",
    );
    const newFavorites = isFavorite
      ? favorites.filter((id) => id !== event.id)
      : [...favorites, event.id];
    localStorage.setItem("favorite_events", JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    showSnackbar(
      isFavorite ? "Removed from favorites" : "Added to favorites",
      "success",
    );
  };

  const handlePrint = () => window.print();

  return (
    <div className="event-detail-page">
      <div className="event-detail-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <button onClick={() => navigate("/")} className="breadcrumb-link">
            Home
          </button>
          <span className="breadcrumb-separator">/</span>
          <button
            onClick={() => navigate("/events")}
            className="breadcrumb-link"
          >
            Events
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{event.title}</span>
        </div>

        <div className="event-detail-grid">
          {/* Main Content */}
          <div className="event-main-content">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="main-card"
            >
              {/* Hero Section */}
              <div
                className="hero-section"
                style={{
                  background: `linear-gradient(135deg, ${categoryConfig.bg}, transparent)`,
                }}
              >
                <div className="hero-chips">
                  <span
                    className="category-chip"
                    style={{
                      background: categoryConfig.bg,
                      color: categoryConfig.color,
                    }}
                  >
                    {categoryConfig.icon} {categoryConfig.label}
                  </span>
                  {event.isFeatured && (
                    <span className="featured-chip">
                      <MdVerified size={14} /> Featured
                    </span>
                  )}
                  {!isUpcoming && (
                    <span className="past-chip">
                      <MdEventAvailable size={14} /> Past Event
                    </span>
                  )}
                  {isFull && <span className="full-chip">Fully Booked</span>}
                  {registered && (
                    <span className="registered-chip">
                      <MdCheckCircle size={14} /> Registered
                    </span>
                  )}
                </div>

                <h1 className="event-title">{event.title}</h1>

                <div className="event-organizer">
                  <span>Organized by {event.organizer}</span>
                  {event.verified && (
                    <span className="verified-badge" title="Verified Organizer">
                      <MdVerified size={16} />
                    </span>
                  )}
                </div>

                {isUpcoming && (
                  <div
                    className="countdown-timer"
                    style={{ background: categoryConfig.bg }}
                  >
                    <MdTimer
                      size={18}
                      style={{ color: categoryConfig.color }}
                    />
                    <span style={{ color: categoryConfig.color }}>
                      {formatRelativeTime(event.date)}
                    </span>
                  </div>
                )}
              </div>

              <div className="event-content">
                <h2 className="section-title">About This Event</h2>
                <p className="event-description">{event.description}</p>

                <div className="section-divider"></div>

                {event.agenda && event.agenda.length > 0 && (
                  <>
                    <h2 className="section-title">Event Agenda</h2>
                    <div className="agenda-list">
                      {event.agenda.map((item, idx) => (
                        <div key={idx} className="agenda-item">
                          <span
                            className="agenda-time"
                            style={{ color: categoryConfig.color }}
                          >
                            {item.time}
                          </span>
                          <span className="agenda-title">{item.title}</span>
                          {item.location && (
                            <span className="agenda-location">
                              <FiMapPin size={12} /> {item.location}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="section-divider"></div>
                  </>
                )}

                {event.speakers && event.speakers.length > 0 && (
                  <>
                    <h2 className="section-title">Speakers</h2>
                    <div className="speakers-grid">
                      {event.speakers.map((speaker, idx) => (
                        <div key={idx} className="speaker-card">
                          <div
                            className="speaker-avatar"
                            style={{ background: categoryConfig.gradient }}
                          >
                            {speaker.name?.charAt(0)}
                          </div>
                          <div className="speaker-info">
                            <div className="speaker-name">{speaker.name}</div>
                            <div className="speaker-role">{speaker.role}</div>
                            {speaker.company && (
                              <div className="speaker-company">
                                {speaker.company}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="event-sidebar">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="sidebar-card"
            >
              <h3 className="sidebar-title">Event Details</h3>

              <div className="info-list">
                <div className="info-item">
                  <MdCalendarToday
                    className="info-icon"
                    style={{ color: categoryConfig.color }}
                  />
                  <div>
                    <div className="info-label">Date</div>
                    <div className="info-value">{formatDate(event.date)}</div>
                  </div>
                </div>

                <div className="info-item">
                  <MdAccessTime
                    className="info-icon"
                    style={{ color: categoryConfig.color }}
                  />
                  <div>
                    <div className="info-label">Time</div>
                    <div className="info-value">
                      {formatTime(event.date)} – {formatTime(event.endDate)}
                    </div>
                  </div>
                </div>

                <div className="info-item">
                  <MdLocationOn
                    className="info-icon"
                    style={{ color: categoryConfig.color }}
                  />
                  <div>
                    <div className="info-label">Location</div>
                    <div className="info-value">{event.location}</div>
                  </div>
                </div>

                <div className="info-item">
                  <MdPeople
                    className="info-icon"
                    style={{ color: categoryConfig.color }}
                  />
                  <div className="capacity-info">
                    <div className="info-label">Capacity</div>
                    <div className="info-value">
                      {event.registered} / {event.capacity} registered
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${isFull ? "full" : capacityPct >= 75 ? "warning" : "success"}`}
                        style={{ width: `${capacityPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sidebar-divider"></div>

              {event.price && event.price > 0 ? (
                <div className="price-section">
                  <div
                    className="price-amount"
                    style={{ color: categoryConfig.color }}
                  >
                    ${event.price}
                  </div>
                  <div className="price-label">per person</div>
                </div>
              ) : (
                <div className="alert-success free-alert">
                  <MdCheckCircle size={18} /> Free Admission
                </div>
              )}

              {registered ? (
                <div className="alert-success registered-alert">
                  <MdCheckCircle size={18} /> You are registered for this event!
                </div>
              ) : (
                <button
                  className={`register-button ${!canRegister ? "disabled" : ""}`}
                  disabled={!canRegister}
                  onClick={handleRegister}
                >
                  {!isUpcoming
                    ? "Event Ended"
                    : isFull
                      ? "Fully Booked"
                      : "Register Now"}
                </button>
              )}

              <div className="action-buttons">
                <button
                  className="share-button"
                  onClick={() => setShareDialogOpen(true)}
                >
                  <MdShare size={18} /> Share
                </button>
                <button
                  className={`favorite-button ${isFavorite ? "active" : ""}`}
                  onClick={handleFavoriteToggle}
                >
                  {isFavorite ? (
                    <MdBookmark size={18} />
                  ) : (
                    <MdBookmarkBorder size={18} />
                  )}
                </button>
                <button className="print-button" onClick={handlePrint}>
                  <MdPrint size={18} />
                </button>
              </div>

              {event.contactEmail && (
                <div
                  className="help-section"
                  style={{ background: categoryConfig.bg }}
                >
                  <div className="help-title">Need Help?</div>
                  {event.contactEmail && (
                    <div className="help-contact">
                      <MdEmail size={14} /> {event.contactEmail}
                    </div>
                  )}
                  {event.contactPhone && (
                    <div className="help-contact">
                      <MdPhone size={14} /> {event.contactPhone}
                    </div>
                  )}
                </div>
              )}

              {event.tags && event.tags.length > 0 && (
                <div className="tags-section">
                  <div className="tags-label">Tags</div>
                  <div className="tags-list">
                    {event.tags.map((tag, idx) => (
                      <span key={idx} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {registerDialogOpen && (
          <RegistrationDialog
            open={registerDialogOpen}
            event={event}
            onClose={() => setRegisterDialogOpen(false)}
            onConfirm={handleConfirmRegistration}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {shareDialogOpen && (
          <ShareDialog
            open={shareDialogOpen}
            event={event}
            onClose={() => setShareDialogOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {snackbar.open && (
          <motion.div
            className={`snackbar ${snackbar.type}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            {snackbar.type === "success" ? (
              <MdCheckCircle size={20} />
            ) : (
              <FiAlertCircle size={20} />
            )}
            <span>{snackbar.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(EventDetail);
