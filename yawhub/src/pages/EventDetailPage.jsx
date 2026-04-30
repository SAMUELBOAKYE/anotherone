// src/pages/EventDetailPage.jsx - FULLY UPDATED WITH CORRECT ICONS
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiWifiOff,
  FiCloudOff,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiUsers,
  FiCalendar as FiEventIcon,
  FiShare2,
  FiBookmark,
  FiBookmark as FiBookmarkSolid,
  FiCheckCircle,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheck,
  FiCopy,
  FiMail,
  FiMessageCircle,
  FiTag,
  FiStar,
  FiHeart,
  FiEye,
  FiTrendingUp,
  FiInfo,
  FiAward,
} from "react-icons/fi";
import {
  MdEvent,
  MdLocationOn,
  MdPeople,
  MdPerson,
  MdCalendarToday,
  MdAccessTime,
  MdShare,
  MdBookmarkBorder,
  MdBookmark,
  MdCheckCircle,
  MdRefresh,
  MdWarning,
  MdVerified,
  MdLocalOffer,
  MdConfirmationNumber,
  MdContentCopy,
  MdArrowBack,
  MdErrorOutline,
  MdInfoOutline,
  MdStar,
  MdFavorite,
  MdVisibility,
  MdEventAvailable,
  MdEventBusy,
  MdEventNote,
  MdLocalActivity,
  MdEmail,
} from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import "../styles/components/EventDetailPage.css";

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

// ============================================================================
// COMPREHENSIVE SAMPLE EVENT DATA
// ============================================================================

const SAMPLE_EVENTS = {
  1: {
    id: "1",
    title: "Annual Tech Conference 2025",
    description:
      "Join us for a full-day technology conference featuring keynotes from industry leaders, hands-on workshops, and networking opportunities. This is the premier tech event of the year where you'll learn about the latest trends in AI, cloud computing, cybersecurity, and more.",
    summary: "A full-day technology conference with industry leaders",
    shortDescription: "The premier technology event of the year",
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000 + 8 * 3600000).toISOString(),
    location: "Main Auditorium, Block A",
    venue: "Main Auditorium, Block A",
    category: "conference",
    eventType: "conference",
    organizer: "IT Department",
    organizerEmail: "it@kaaf.edu",
    capacity: 500,
    registered: 342,
    registrationCount: 342,
    registrationFee: 0,
    status: "upcoming",
    participationMode: "physical",
    tags: ["technology", "conference", "networking", "ai", "cloud"],
    requirements: ["Valid Student ID", "Registration Confirmation"],
    speakers: [
      { name: "Dr. Sarah Johnson", title: "AI Research Lead" },
      { name: "Prof. Michael Chen", title: "Cloud Architect" },
      { name: "Ms. Emily Davis", title: "Cybersecurity Expert" },
    ],
  },
  2: {
    id: "2",
    title: "Student Leadership Workshop",
    description:
      "An interactive workshop designed to develop leadership skills, team building, effective communication, and decision-making for student leaders.",
    summary: "Leadership development workshop for students",
    shortDescription: "Develop essential leadership skills",
    date: new Date(Date.now() + 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 3 * 86400000 + 3 * 3600000).toISOString(),
    location: "Conference Room B, Admin Block",
    venue: "Conference Room B, Admin Block",
    category: "workshop",
    eventType: "workshop",
    organizer: "Student Affairs",
    organizerEmail: "studentaffairs@kaaf.edu",
    capacity: 80,
    registered: 78,
    registrationCount: 78,
    registrationFee: 0,
    status: "upcoming",
    participationMode: "physical",
    tags: ["leadership", "workshop", "students", "development"],
    requirements: ["Must be a student leader", "Recommendation letter"],
    speakers: [
      { name: "Dr. James Wilson", title: "Leadership Coach" },
      { name: "Ms. Lisa Anderson", title: "Student Affairs Director" },
    ],
  },
};

// ============================================================================
// API SERVICE
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

const eventService = {
  async fetchEventById(id, options = {}) {
    const { signal, retryCount = 0, useMockAsLastResort = true } = options;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/events/${id}`, {
        signal,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 404 && SAMPLE_EVENTS[id]) {
          console.log(`[EventDetail] Event ${id} not in DB, using sample data`);
          return SAMPLE_EVENTS[id];
        }
        throw new Error(`Failed to fetch event (${response.status})`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      if (error.name === "AbortError") throw error;
      if (useMockAsLastResort && SAMPLE_EVENTS[id]) {
        console.log(
          `[EventDetail] Using sample data for event ${id} after API error`,
        );
        return SAMPLE_EVENTS[id];
      }
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCount];
        console.log(
          `[EventDetail] Retry ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return eventService.fetchEventById(id, {
          ...options,
          retryCount: retryCount + 1,
        });
      }
      throw error;
    }
  },

  async getCachedEvent(id) {
    try {
      const cached = localStorage.getItem(`event_${id}`);
      if (cached) {
        const data = JSON.parse(cached);
        const cacheAge = Date.now() - data.timestamp;
        const maxCacheAge = 24 * 60 * 60 * 1000;
        if (cacheAge < maxCacheAge) {
          console.log(
            `[EventDetail] Using cached event ${id} (age: ${Math.round(cacheAge / 60000)} minutes)`,
          );
          return data.event;
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to load cached event:", error);
      return null;
    }
  },

  async cacheEvent(id, event) {
    try {
      localStorage.setItem(
        `event_${id}`,
        JSON.stringify({
          event,
          timestamp: Date.now(),
        }),
      );
      console.log(`[EventDetail] Cached event ${id}`);
    } catch (error) {
      console.error("Failed to cache event:", error);
    }
  },

  clearCache(id) {
    if (id) {
      localStorage.removeItem(`event_${id}`);
    } else {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("event_")) {
          localStorage.removeItem(key);
        }
      });
    }
    console.log(`[EventDetail] Cache cleared for ${id || "all events"}`);
  },
};

// ============================================================================
// SKELETON LOADER
// ============================================================================

const EventDetailSkeleton = () => (
  <div className="skeleton-container">
    <div className="skeleton-header">
      <div className="skeleton-back-btn"></div>
      <div className="skeleton-title"></div>
    </div>
    <div className="skeleton-grid">
      <div className="skeleton-main">
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
      </div>
      <div className="skeleton-sidebar">
        <div className="skeleton-card"></div>
      </div>
    </div>
  </div>
);

// ============================================================================
// LOADING STATE
// ============================================================================

const LoadingState = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 90));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="loading-container">
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-progress-text">{Math.round(progress)}%</div>
      </div>
      <h3 className="loading-title">Loading event details...</h3>
      <p className="loading-subtitle">
        Please wait while we fetch the latest information
      </p>
      <div className="loading-progress-bar">
        <div
          className="loading-progress-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

// ============================================================================
// ERROR STATE
// ============================================================================

const ErrorState = ({
  error,
  onRetry,
  onBack,
  retryCount = 0,
  maxRetries = 3,
}) => {
  const getErrorDetails = () => {
    if (error?.message?.includes("404")) {
      return {
        title: "Event Not Found",
        message:
          "The event you're looking for doesn't exist or has been removed.",
        icon: <FiAlertCircle size={48} />,
        color: "#ef4444",
        showRetry: false,
      };
    }
    if (
      error?.message?.includes("network") ||
      error?.message?.includes("fetch")
    ) {
      return {
        title: "Network Error",
        message:
          "Unable to connect to the server. Please check your internet connection.",
        icon: <FiWifiOff size={48} />,
        color: "#f59e0b",
        showRetry: true,
      };
    }
    if (error?.message?.includes("login")) {
      return {
        title: "Authentication Required",
        message: "Please login to view event details.",
        icon: <FiUser size={48} />,
        color: "#3b82f6",
        showRetry: false,
      };
    }
    return {
      title: "Something Went Wrong",
      message:
        error?.message || "An unexpected error occurred. Please try again.",
      icon: <FiAlertCircle size={48} />,
      color: "#ef4444",
      showRetry: true,
    };
  };

  const details = getErrorDetails();
  const canRetry = details.showRetry && retryCount < maxRetries;

  return (
    <div className="error-container">
      <div className="error-card" style={{ borderColor: `${details.color}20` }}>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: 2 }}
        >
          <div className="error-icon" style={{ color: details.color }}>
            {details.icon}
          </div>
        </motion.div>
        <h2 className="error-title" style={{ color: details.color }}>
          {details.title}
        </h2>
        <p className="error-message">{details.message}</p>
        {canRetry && retryCount > 0 && (
          <p className="error-retry-count">
            Attempt {retryCount} of {maxRetries}
          </p>
        )}
        <div className="error-actions">
          <button className="btn-outline" onClick={onBack}>
            <FiArrowLeft size={16} /> Back to Events
          </button>
          {canRetry && (
            <button
              className="btn-primary"
              onClick={onRetry}
              style={{ background: details.color }}
            >
              <FiRefreshCw size={16} /> Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CACHE ALERT
// ============================================================================

const CacheAlert = ({ onRefresh }) => (
  <div className="cache-alert">
    <FiCloudOff size={18} />
    <span>You are viewing cached data. Click refresh for latest updates.</span>
    <button onClick={onRefresh}>
      <FiRefreshCw size={14} /> Refresh
    </button>
  </div>
);

// ============================================================================
// SHARE MENU
// ============================================================================

const ShareMenu = ({ event, onClose }) => {
  const url = window.location.href;

  const shareOptions = [
    {
      icon: <MdContentCopy size={18} />,
      label: "Copy Link",
      action: () => navigator.clipboard.writeText(url),
    },
    {
      icon: <FaWhatsapp size={18} style={{ color: "#25D366" }} />,
      label: "WhatsApp",
      action: () =>
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${event.title}\n\n${url}`)}`,
          "_blank",
        ),
    },
    {
      icon: <MdEmail size={18} style={{ color: "#EA4335" }} />,
      label: "Email",
      action: () =>
        (window.location.href = `mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`Check out this event: ${event.title}\n\n${url}`)}`),
    },
  ];

  return (
    <div className="share-menu">
      <div className="share-menu-header">Share this event</div>
      {shareOptions.map((opt, idx) => (
        <button
          key={idx}
          className="share-option"
          onClick={() => {
            opt.action();
            onClose();
          }}
        >
          {opt.icon} {opt.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// EVENT DETAIL COMPONENT
// ============================================================================

const EventDetailComponent = ({ event, onRefresh }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = () => {
    switch (event.status) {
      case "upcoming":
        return "#f59e0b";
      case "ongoing":
        return "#10b981";
      case "completed":
        return "#6b7280";
      case "cancelled":
        return "#ef4444";
      default:
        return "#667eea";
    }
  };

  const getStatusLabel = () => {
    switch (event.status) {
      case "upcoming":
        return "Upcoming";
      case "ongoing":
        return "Ongoing";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return event.status;
    }
  };

  const fillRate =
    event.capacity > 0 ? (event.registered / event.capacity) * 100 : 0;
  const isAlmostFull = fillRate >= 85;
  const isFull = fillRate >= 100;
  const daysUntil = Math.ceil(
    (new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24),
  );

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 3000);
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
      <div className="event-detail-page">
        <div className="event-detail-container">
          {/* Back Button */}
          <motion.div variants={fadeInUp}>
            <button className="back-button" onClick={() => navigate("/events")}>
              <FiArrowLeft size={18} /> Back to Events
            </button>
          </motion.div>

          {/* Event Header */}
          <motion.div variants={scaleIn}>
            <div className="event-header-card">
              <div className="event-header-banner">
                <MdEvent size={80} className="event-header-icon" />
                <div
                  className={`status-badge ${event.status}`}
                  style={{ backgroundColor: getStatusColor() }}
                >
                  {getStatusLabel()}
                </div>
                {daysUntil > 0 &&
                  daysUntil <= 7 &&
                  event.status === "upcoming" && (
                    <div className="days-left-badge">
                      {daysUntil} day{daysUntil !== 1 ? "s" : ""} left
                    </div>
                  )}
              </div>
              <div className="event-header-content">
                <div className="event-header-info">
                  <div>
                    <span className="category-chip">
                      {event.eventType || event.category}
                    </span>
                    <h1 className="event-title">{event.title}</h1>
                    <p className="event-description">{event.description}</p>
                  </div>
                  <div className="event-actions">
                    <button
                      className="icon-btn"
                      onClick={() => setIsSaved(!isSaved)}
                      title="Save for later"
                    >
                      {isSaved ? (
                        <MdBookmark size={20} />
                      ) : (
                        <MdBookmarkBorder size={20} />
                      )}
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      title="Share"
                    >
                      <MdShare size={20} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={onRefresh}
                      title="Refresh"
                    >
                      <MdRefresh size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Share Menu Dropdown */}
          {showShareMenu && (
            <div
              className="share-menu-overlay"
              onClick={() => setShowShareMenu(false)}
            >
              <div
                className="share-menu-container"
                onClick={(e) => e.stopPropagation()}
              >
                <ShareMenu
                  event={event}
                  onClose={() => setShowShareMenu(false)}
                />
              </div>
            </div>
          )}

          {/* Event Details Grid */}
          <div className="event-details-grid">
            <div className="event-main-content">
              <motion.div variants={fadeInUp}>
                <div className="info-card">
                  <h3 className="card-title">About This Event</h3>
                  <p className="card-text">{event.description}</p>

                  {event.requirements && event.requirements.length > 0 && (
                    <div className="info-section">
                      <h4 className="section-subtitle">
                        <MdVerified size={16} /> Requirements:
                      </h4>
                      <div className="tags-list">
                        {event.requirements.map((req, idx) => (
                          <span key={idx} className="tag-outline">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.tags && event.tags.length > 0 && (
                    <div className="info-section">
                      <h4 className="section-subtitle">
                        <MdLocalOffer size={16} /> Tags:
                      </h4>
                      <div className="tags-list">
                        {event.tags.map((tag, idx) => (
                          <span key={idx} className="tag-primary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(event.speakers || event.performers) && (
                    <div className="info-section">
                      <h4 className="section-subtitle">
                        <FiUsers size={16} />{" "}
                        {event.speakers ? "Featured Speakers:" : "Performers:"}
                      </h4>
                      <div className="speakers-list">
                        {(event.speakers || event.performers).map(
                          (person, idx) => (
                            <div key={idx} className="speaker-item">
                              <div className="speaker-avatar">
                                {person.name?.charAt(0) || "S"}
                              </div>
                              <div>
                                <div className="speaker-name">
                                  {person.name}
                                </div>
                                <div className="speaker-title">
                                  {person.title || person.role}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="event-sidebar">
              <motion.div variants={fadeInUp}>
                <div className="sidebar-card">
                  <h3 className="card-title">Event Details</h3>
                  <div className="divider"></div>

                  <div className="info-list">
                    <div className="info-row">
                      <MdCalendarToday size={20} className="info-icon" />
                      <div>
                        <div className="info-label">Date</div>
                        <div className="info-value">
                          {formatDate(event.date)}
                        </div>
                      </div>
                    </div>
                    <div className="info-row">
                      <MdAccessTime size={20} className="info-icon" />
                      <div>
                        <div className="info-label">Time</div>
                        <div className="info-value">
                          {formatTime(event.date)} - {formatTime(event.endDate)}
                        </div>
                      </div>
                    </div>
                    <div className="info-row">
                      <MdLocationOn size={20} className="info-icon" />
                      <div>
                        <div className="info-label">Location</div>
                        <div className="info-value">
                          {event.location || event.venue}
                        </div>
                      </div>
                    </div>
                    <div className="info-row">
                      <FiUser size={20} className="info-icon" />
                      <div>
                        <div className="info-label">Organizer</div>
                        <div className="info-value">{event.organizer}</div>
                      </div>
                    </div>
                    <div className="info-row">
                      <FiUsers size={20} className="info-icon" />
                      <div>
                        <div className="info-label">Capacity</div>
                        <div className="info-value">
                          {event.registered || 0} / {event.capacity} registered
                        </div>
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${isFull ? "full" : isAlmostFull ? "warning" : "success"}`}
                            style={{ width: `${Math.min(fillRate, 100)}%` }}
                          />
                        </div>
                        {isAlmostFull && !isFull && (
                          <div className="info-warning">
                            Almost full! Only{" "}
                            {event.capacity - (event.registered || 0)} spots
                            left
                          </div>
                        )}
                        {isFull && (
                          <div className="info-error">Event is full!</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {event.registrationFee > 0 && (
                    <div className="alert-info">
                      <MdConfirmationNumber size={16} /> Registration Fee: $
                      {event.registrationFee}
                    </div>
                  )}

                  <button
                    className="register-button"
                    onClick={() => navigate(`/events/${event.id}/register`)}
                    disabled={event.status === "completed" || isFull}
                  >
                    {event.status === "completed"
                      ? "Event Completed"
                      : isFull
                        ? "Event Full"
                        : "Register Now"}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`snackbar ${snackbar.severity}`}>
          {snackbar.severity === "success" ? (
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
    </motion.div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchEvent = useCallback(
    async (isRetry = false) => {
      if (!id) {
        setError(new Error("No event ID provided"));
        setLoading(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        if (!isRetry) setLoading(true);
        setError(null);

        if (!isRetry && !fromCache) {
          const cachedEvent = await eventService.getCachedEvent(id);
          if (cachedEvent) {
            setEvent(cachedEvent);
            setFromCache(true);
          }
        }

        const freshEvent = await eventService.fetchEventById(id, {
          signal: controller.signal,
          retryCount: isRetry ? retryCount : 0,
        });

        if (freshEvent && !controller.signal.aborted) {
          setEvent(freshEvent);
          setFromCache(false);
          await eventService.cacheEvent(id, freshEvent);
          setRetryCount(0);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        if (!event && !controller.signal.aborted) setError(err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [id, event, fromCache, retryCount],
  );

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
    fetchEvent(true);
  };

  const handleRefresh = () => {
    eventService.clearCache(id);
    setFromCache(false);
    fetchEvent(true);
  };

  const handleBack = () => navigate("/events");

  useEffect(() => {
    fetchEvent();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchEvent]);

  useEffect(() => {
    const handleOnline = () => {
      if (error?.message?.includes("network")) handleRetry();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [error]);

  if (loading && !event) return <LoadingState />;
  if (error && !event) {
    return (
      <ErrorState
        error={error}
        onRetry={handleRetry}
        onBack={handleBack}
        retryCount={retryCount}
        maxRetries={MAX_RETRIES}
      />
    );
  }
  if (!event) {
    return (
      <ErrorState
        error={new Error("Event not found")}
        onRetry={handleRetry}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="event-detail-wrapper">
      {fromCache && <CacheAlert onRefresh={handleRefresh} />}
      <EventDetailComponent event={event} onRefresh={handleRefresh} />
    </div>
  );
};

export default EventDetailPage;
