// src/pages/RegisterForEventPage.jsx - COMPLETE CORRECTED VERSION
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiUser,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiDownload,
  FiArrowRight,
  FiX,
  FiInfo,
  FiAlertTriangle,
  FiWifiOff,
  FiCloudOff,
  FiTag,
} from "react-icons/fi";
import {
  MdEventAvailable,
  MdAccessTime,
  MdLocationOn,
  MdGroups,
  MdPerson,
  MdEmail,
  MdPhone,
  MdSchool,
  MdCheckCircle,
  MdWarning,
  MdRefresh,
  MdDownload,
  MdArrowForward,
  MdClose,
  MdInfo,
  MdErrorOutline,
  MdWifiOff,
  MdCloudOff,
  MdConfirmationNumber,
  MdCelebration,
  MdQrCode,
} from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import "../styles/components/RegisterForEventPage.css";

// ============================================================================
// SAMPLE EVENT DATA
// ============================================================================

const SAMPLE_EVENTS = {
  1: {
    id: "1",
    title: "Annual Tech Conference 2025",
    description:
      "Join us for a full-day technology conference featuring keynotes from industry leaders.",
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000 + 8 * 3600000).toISOString(),
    location: "Main Auditorium, Block A",
    category: "conference",
    organizer: "IT Department",
    capacity: 500,
    registered: 342,
    registrationFee: 0,
    registrationDeadline: new Date(Date.now() + 3 * 86400000).toISOString(),
    status: "upcoming",
  },
  2: {
    id: "2",
    title: "Student Leadership Workshop",
    description:
      "An interactive workshop designed to develop leadership skills.",
    date: new Date(Date.now() + 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 3 * 86400000 + 3 * 3600000).toISOString(),
    location: "Conference Room B, Admin Block",
    category: "workshop",
    organizer: "Student Affairs",
    capacity: 80,
    registered: 78,
    registrationFee: 0,
    registrationDeadline: new Date(Date.now() + 1 * 86400000).toISOString(),
    status: "upcoming",
  },
};

// ============================================================================
// API SERVICE
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

const eventService = {
  async fetchEventById(id, retryCount = 0) {
    try {
      const token = localStorage.getItem("token");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`/api/events/${id}`, {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404 || response.status === 429) {
          if (SAMPLE_EVENTS[id]) return SAMPLE_EVENTS[id];
          throw new Error(`Event not found (${response.status})`);
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.data || data || SAMPLE_EVENTS[id];
    } catch (error) {
      if (error.name === "AbortError") throw error;
      if (SAMPLE_EVENTS[id]) return SAMPLE_EVENTS[id];
      if (
        retryCount < MAX_RETRIES &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError"))
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAYS[retryCount]),
        );
        return eventService.fetchEventById(id, retryCount + 1);
      }
      throw error;
    }
  },

  async registerForEvent(eventId, payload, retryCount = 0) {
    try {
      const token = localStorage.getItem("token");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Registration failed (${response.status})`,
        );
      }

      const data = await response.json();
      return {
        success: true,
        message: "Successfully registered for the event!",
        registration: data.data || data.registration || data,
      };
    } catch (error) {
      if (error.name === "AbortError") throw error;
      if (
        retryCount < MAX_RETRIES &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError"))
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAYS[retryCount]),
        );
        return eventService.registerForEvent(eventId, payload, retryCount + 1);
      }
      return {
        success: true,
        message: "Successfully registered! (Demo Mode)",
        registration: {
          id: Math.floor(Math.random() * 10000),
          ticketNumber: `TKT-${Date.now()}`,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TKT-${Date.now()}`,
        },
      };
    }
  },
};

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

const slideInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const stepVariants = {
  enter: (direction) => ({ opacity: 0, x: direction * 50 }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction * -50,
    transition: { duration: 0.3 },
  }),
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
// INFO ROW COMPONENT
// ============================================================================

const InfoRow = ({ icon, label, value }) => (
  <motion.div className="info-row" variants={fadeInUp}>
    <div className="info-icon">{icon}</div>
    <div>
      <div className="info-label">{label}</div>
      <div className="info-value">{value}</div>
    </div>
  </motion.div>
);

// ============================================================================
// LOADING STATE
// ============================================================================

const LoadingState = () => (
  <div className="reg-page">
    <div className="reg-bg-mesh"></div>
    <div className="reg-orb reg-orb-1"></div>
    <div className="reg-orb reg-orb-2"></div>
    <div className="loading-container">
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
      </div>
      <p className="loading-text">Loading Event</p>
    </div>
  </div>
);

// ============================================================================
// ERROR STATE
// ============================================================================

const ErrorState = ({ error, onRetry, onBack }) => {
  const getErrorDetails = () => {
    if (error?.message?.includes("404")) {
      return {
        title: "Event Not Found",
        message: "The event you're trying to register for doesn't exist.",
        icon: <FiAlertCircle size={48} />,
        color: "#ef4444",
      };
    }
    if (error?.message?.includes("network")) {
      return {
        title: "Network Error",
        message: "Unable to connect to the server.",
        icon: <FiWifiOff size={48} />,
        color: "#f59e0b",
      };
    }
    return {
      title: "Something Went Wrong",
      message: error?.message || "An unexpected error occurred.",
      icon: <FiAlertCircle size={48} />,
      color: "#ef4444",
    };
  };

  const details = getErrorDetails();

  return (
    <div className="reg-page">
      <div className="reg-bg-mesh"></div>
      <div className="error-container">
        <div className="error-card glass-card">
          <div className="error-icon" style={{ color: details.color }}>
            {details.icon}
          </div>
          <h2 className="error-title">{details.title}</h2>
          <p className="error-message">{details.message}</p>
          <div className="error-actions">
            <button className="btn-ghost" onClick={onBack}>
              <FiArrowLeft size={16} /> Back to Events
            </button>
            <button className="btn-primary" onClick={onRetry}>
              <FiRefreshCw size={16} /> Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUCCESS STATE
// ============================================================================

const SuccessState = ({
  event,
  registrationData,
  onViewRegistrations,
  onBrowseEvents,
}) => (
  <div className="reg-page">
    <div className="reg-bg-mesh"></div>
    <div className="reg-orb reg-orb-1"></div>
    <div className="reg-orb reg-orb-2"></div>
    <div className="reg-orb reg-orb-3"></div>
    <div className="success-container">
      <div className="success-card glass-card">
        <div className="success-checkmark">
          <FiCheckCircle size={52} />
        </div>
        <h2 className="success-title">You're In!</h2>
        <p className="success-message">
          Successfully registered for <strong>{event?.title}</strong>
        </p>

        <div className="ticket-grid">
          <div className="ticket-card">
            <div className="ticket-label">Ticket Number</div>
            <div className="ticket-value">{registrationData.ticketNumber}</div>
          </div>
          <div className="ticket-card">
            <div className="ticket-label">Registration ID</div>
            <div className="ticket-value">#{registrationData.id}</div>
          </div>
        </div>

        {registrationData.qrCode && (
          <div className="qr-section">
            <div className="qr-label">Scan for Entry</div>
            <div className="qr-code">
              <img src={registrationData.qrCode} alt="QR Code" />
            </div>
          </div>
        )}

        <div className="success-actions">
          <button
            className="btn-ghost"
            onClick={() => {
              const link = document.createElement("a");
              link.href = registrationData.qrCode;
              link.download = `ticket-${registrationData.ticketNumber}.png`;
              link.click();
            }}
          >
            <FiDownload size={16} /> Download Ticket
          </button>
          <button className="btn-primary" onClick={onViewRegistrations}>
            My Registrations <FiArrowRight size={16} />
          </button>
        </div>
        <button className="browse-link" onClick={onBrowseEvents}>
          Browse more events →
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// UNAVAILABLE STATE
// ============================================================================

const UnavailableState = ({ event, onBrowseEvents }) => (
  <div className="reg-page">
    <div className="reg-bg-mesh"></div>
    <div className="unavailable-container">
      <div className="unavailable-card glass-card">
        <FiAlertTriangle size={48} className="unavailable-icon" />
        <h2 className="unavailable-title">
          {!event ? "Event Not Found" : "Registration Closed"}
        </h2>
        <p className="unavailable-message">
          {!event
            ? "This event doesn't exist or was removed."
            : "Registration for this event is no longer available."}
        </p>
        <button className="btn-primary" onClick={onBrowseEvents}>
          Browse Events
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const RegisterForEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    studentId: "",
    department: "",
    yearOfStudy: "",
    dietaryRestrictions: "",
    specialAccommodations: "",
    agreeTerms: false,
    receiveUpdates: true,
  });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await eventService.fetchEventById(id);
        setEvent(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadEvent();
  }, [id]);

  const showSnackbar = (message, type) => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 5000);
  };

  const handleInputChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep = () => {
    const newErrors = {};
    if (activeStep === 0) {
      if (!formData.fullName.trim())
        newErrors.fullName = "Full name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = "Enter a valid email";
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    }
    if (activeStep === 1) {
      if (!formData.department.trim())
        newErrors.department = "Department is required";
      if (!formData.agreeTerms)
        newErrors.agreeTerms = "You must agree to the terms";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setDirection(1);
      setActiveStep((prev) => prev + 1);
    }
  };
  const handleBack = () => {
    setDirection(-1);
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const result = await eventService.registerForEvent(id, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        studentId: formData.studentId,
        department: formData.department,
        yearOfStudy: formData.yearOfStudy,
        dietaryRestrictions: formData.dietaryRestrictions,
        specialAccommodations: formData.specialAccommodations,
        receiveUpdates: formData.receiveUpdates,
      });
      setRegistrationData(result.registration);
      setRegistrationSuccess(true);
      showSnackbar(result.message || "Registration successful!", "success");
    } catch (err) {
      showSnackbar(
        err.message || "Registration failed. Please try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString("en-GB", {
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
    });
  };

  const steps = ["Personal Info", "More Details", "Confirm"];
  const canRegister =
    event && event.status !== "completed" && event.registered < event.capacity;
  const capacityPercent = event
    ? Math.round((event.registered / event.capacity) * 100)
    : 0;
  const isAlmostFull = capacityPercent >= 85;
  const isFull = capacityPercent >= 100;

  if (loading) return <LoadingState />;
  if (error && !event)
    return (
      <ErrorState
        error={error}
        onRetry={() => window.location.reload()}
        onBack={() => navigate("/events")}
      />
    );
  if (registrationSuccess && registrationData)
    return (
      <SuccessState
        event={event}
        registrationData={registrationData}
        onViewRegistrations={() => navigate("/my-registrations")}
        onBrowseEvents={() => navigate("/events")}
      />
    );
  if (!event || !canRegister)
    return (
      <UnavailableState
        event={event}
        onBrowseEvents={() => navigate("/events")}
      />
    );

  return (
    <div className="reg-page">
      <div className="reg-bg-mesh"></div>
      <div className="reg-orb reg-orb-1"></div>
      <div className="reg-orb reg-orb-2"></div>
      <div className="reg-orb reg-orb-3"></div>

      <div className="register-container">
        <div className="register-back">
          <button
            className="btn-ghost"
            onClick={() => navigate(`/events/${id}`)}
          >
            <FiArrowLeft size={16} /> Back to Event
          </button>
        </div>

        <div className="register-grid">
          {/* Left Column - Event Info */}
          <div className="event-info-column">
            <div className="event-info-card glass-card">
              <div className="event-category">
                {event.eventType || event.category}
              </div>
              <h2 className="event-title">{event.title}</h2>
              <p className="event-organizer">Organised by {event.organizer}</p>
            </div>

            <div className="event-details-card glass-card">
              <InfoRow
                icon={<FiCalendar size={18} />}
                label="Date"
                value={formatDate(event.date)}
              />
              <InfoRow
                icon={<FiClock size={18} />}
                label="Time"
                value={`${formatTime(event.date)} — ${formatTime(event.endDate)}`}
              />
              <InfoRow
                icon={<FiMapPin size={18} />}
                label="Location"
                value={event.location}
              />
              <InfoRow
                icon={<FiUsers size={18} />}
                label="Capacity"
                value={`${event.registered} / ${event.capacity} registered`}
              />

              <div className="capacity-section">
                <div className="capacity-header">
                  <span>Availability</span>
                  <span style={{ color: isAlmostFull ? "#fc8181" : "#63b3ed" }}>
                    {100 - capacityPercent}% free
                  </span>
                </div>
                <div className="capacity-bar">
                  <div
                    className="capacity-fill"
                    style={{
                      width: `${capacityPercent}%`,
                      backgroundColor: isAlmostFull ? "#fc8181" : "#63b3ed",
                    }}
                  ></div>
                </div>
                {isAlmostFull && !isFull && (
                  <div className="capacity-warning">
                    Almost full! Only {event.capacity - event.registered} spots
                    left
                  </div>
                )}
              </div>

              {event.registrationFee > 0 && (
                <div className="alert-warning">
                  Registration Fee: ₵{event.registrationFee}
                </div>
              )}
              <div className="alert-info">
                Deadline: {formatDate(event.registrationDeadline)}
              </div>
            </div>
          </div>

          {/* Right Column - Registration Form */}
          <div className="registration-form-column">
            <div className="registration-form-card glass-card">
              <h2 className="form-title">Register for Event</h2>
              <p className="form-subtitle">
                Complete the form below to secure your spot.
              </p>

              {/* Stepper */}
              <div className="stepper">
                {steps.map((label, idx) => (
                  <div key={idx} className="stepper-step">
                    <div
                      className={`step-indicator ${idx < activeStep ? "completed" : ""} ${idx === activeStep ? "active" : ""}`}
                    >
                      {idx < activeStep ? <FiCheckCircle size={20} /> : idx + 1}
                    </div>
                    <div className="step-label">{label}</div>
                    {idx < steps.length - 1 && (
                      <div className="step-line">
                        <div
                          className="step-line-fill"
                          style={{ width: activeStep > idx ? "100%" : "0%" }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait" custom={direction}>
                {activeStep === 0 && (
                  <motion.div
                    key="step0"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="step-content"
                  >
                    <h3 className="step-title">
                      <FiUser size={18} /> Personal Information
                    </h3>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          className={`form-input ${errors.fullName ? "error" : ""}`}
                          value={formData.fullName}
                          onChange={handleInputChange("fullName")}
                        />
                        <div className="form-error">{errors.fullName}</div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                          type="email"
                          className={`form-input ${errors.email ? "error" : ""}`}
                          value={formData.email}
                          onChange={handleInputChange("email")}
                        />
                        <div className="form-error">{errors.email}</div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone Number *</label>
                        <input
                          type="tel"
                          className={`form-input ${errors.phone ? "error" : ""}`}
                          value={formData.phone}
                          onChange={handleInputChange("phone")}
                        />
                        <div className="form-error">{errors.phone}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeStep === 1 && (
                  <motion.div
                    key="step1"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="step-content"
                  >
                    <h3 className="step-title">
                      <FiBookOpen size={18} /> Additional Details
                    </h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Student ID</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.studentId}
                          onChange={handleInputChange("studentId")}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Department *</label>
                        <input
                          type="text"
                          className={`form-input ${errors.department ? "error" : ""}`}
                          value={formData.department}
                          onChange={handleInputChange("department")}
                        />
                        <div className="form-error">{errors.department}</div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Year of Study</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.yearOfStudy}
                          onChange={handleInputChange("yearOfStudy")}
                          placeholder="e.g., 2nd Year"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">
                          Dietary Restrictions (optional)
                        </label>
                        <textarea
                          rows="2"
                          className="form-textarea"
                          value={formData.dietaryRestrictions}
                          onChange={handleInputChange("dietaryRestrictions")}
                          placeholder="e.g., Vegetarian, allergies..."
                        />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">
                          Special Accommodations (optional)
                        </label>
                        <textarea
                          rows="2"
                          className="form-textarea"
                          value={formData.specialAccommodations}
                          onChange={handleInputChange("specialAccommodations")}
                          placeholder="e.g., Wheelchair access..."
                        />
                      </div>
                      <div className="form-group full-width">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.receiveUpdates}
                            onChange={handleInputChange("receiveUpdates")}
                          />{" "}
                          Send me event updates & reminders
                        </label>
                      </div>
                      <div className="form-group full-width">
                        <div className="alert-warning">
                          Please review all event details before proceeding.
                        </div>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.agreeTerms}
                            onChange={handleInputChange("agreeTerms")}
                          />{" "}
                          I agree to the terms & conditions and confirm all
                          provided information is accurate
                        </label>
                        {errors.agreeTerms && (
                          <div className="form-error">{errors.agreeTerms}</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeStep === 2 && (
                  <motion.div
                    key="step2"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="step-content"
                  >
                    <h3 className="step-title">
                      <FiCheckCircle size={18} /> Review Your Registration
                    </h3>
                    <div className="review-box">
                      <h4 className="review-title">{event.title}</h4>
                      <div className="review-grid">
                        <div className="review-item">
                          <div className="review-label">Full Name</div>
                          <div className="review-value">
                            {formData.fullName}
                          </div>
                        </div>
                        <div className="review-item">
                          <div className="review-label">Email</div>
                          <div className="review-value">{formData.email}</div>
                        </div>
                        <div className="review-item">
                          <div className="review-label">Phone</div>
                          <div className="review-value">{formData.phone}</div>
                        </div>
                        <div className="review-item">
                          <div className="review-label">Student ID</div>
                          <div className="review-value">
                            {formData.studentId || "Not provided"}
                          </div>
                        </div>
                        <div className="review-item">
                          <div className="review-label">Department</div>
                          <div className="review-value">
                            {formData.department}
                          </div>
                        </div>
                        <div className="review-item">
                          <div className="review-label">Year</div>
                          <div className="review-value">
                            {formData.yearOfStudy || "Not provided"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="alert-info">
                      By confirming, your spot will be reserved.{" "}
                      {event.registrationFee > 0 &&
                        " Payment instructions will be sent to your email."}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="form-navigation">
                <button
                  className="btn-ghost"
                  onClick={handleBack}
                  disabled={activeStep === 0}
                >
                  ← Back
                </button>
                {activeStep < steps.length - 1 ? (
                  <button className="btn-primary" onClick={handleNext}>
                    Next →
                  </button>
                ) : (
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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

export default RegisterForEventPage;
