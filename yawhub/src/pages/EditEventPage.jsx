// src/pages/admin/EditEventPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  FiSave,
  FiX,
  FiTrash2,
  FiPlus,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiFileText,
  FiTag,
  FiAlertCircle,
  FiEdit2,
  FiEye,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiInfo,
  FiSettings,
  FiUser,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiLink,
  FiImage,
  FiUpload,
  FiDownload,
  FiRefreshCw,
  FiMoreVertical,
  FiCopy,
  FiShare2,
  FiPrinter,
  FiStar,
  FiHeart,
  FiBookmark,
} from "react-icons/fi";
import {
  MdEvent,
  MdSchedule,
  MdDescription,
  MdPeople,
  MdSettings,
  MdCheckCircle,
  MdWarning,
  MdInfo,
  MdDelete,
  MdAdd,
  MdEdit,
  MdVisibility,
  MdCloudUpload,
  MdClose,
  MdCalendarToday,
  MdAccessTime,
  MdLocationOn,
  MdCategory,
  MdPriorityHigh,
  MdAttachFile,
  MdLink,
  MdEmail,
  MdPhone,
} from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/components/EditEventPage.css";

// Animation variants
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

const stepVariants = {
  enter: (direction) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeInOut" },
  },
  exit: (direction) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    transition: { duration: 0.4, ease: "easeInOut" },
  }),
};

// Sample event data for demo
const getSampleEvent = (id) => ({
  id: parseInt(id),
  title: "Annual Tech Conference 2025",
  description:
    "Join us for a full-day technology conference featuring keynotes from industry leaders, hands-on workshops, and networking opportunities. This is the premier tech event of the year where you'll learn about the latest trends in AI, cloud computing, cybersecurity, and more.",
  shortDescription: "The premier technology event of the year",
  category: "conference",
  type: "physical",
  priority: "high",
  status: "published",
  startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  endDate: new Date(Date.now() + 7 * 86400000 + 8 * 3600000).toISOString(),
  timezone: "America/New_York",
  venue: {
    name: "Convention Center",
    address: "123 Conference Blvd",
    city: "New York",
    state: "NY",
    country: "USA",
    zipCode: "10001",
    capacity: 1000,
    amenities: ["Parking", "WiFi", "Catering", "Accessibility"],
  },
  virtualLink: "",
  capacity: 500,
  registeredAttendees: 342,
  price: { earlyBird: 299, regular: 499, vip: 999, currency: "USD" },
  tags: ["technology", "conference", "networking", "ai", "cloud"],
  targetAudience: ["professionals", "students", "entrepreneurs"],
  organizer: {
    name: "IT Department",
    email: "it@kaaf.edu",
    phone: "+1 234 567 890",
  },
  speakers: [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      title: "AI Research Director",
      company: "Tech Corp",
      bio: "Leading AI researcher with 15+ years experience",
    },
    {
      id: 2,
      name: "Michael Chen",
      title: "CTO",
      company: "Innovate Labs",
      bio: "Expert in cloud architecture and scalability",
    },
  ],
  agenda: [
    {
      id: 1,
      time: "09:00 - 10:00",
      title: "Registration & Breakfast",
      location: "Lobby",
      type: "networking",
    },
    {
      id: 2,
      time: "10:00 - 11:00",
      title: "Keynote: Future of AI",
      speaker: "Dr. Sarah Johnson",
      location: "Main Hall",
      type: "keynote",
    },
    {
      id: 3,
      time: "11:15 - 12:30",
      title: "Workshop: Building Scalable Apps",
      speaker: "Michael Chen",
      location: "Room A",
      type: "workshop",
    },
  ],
  notificationSettings: {
    sendReminders: true,
    emailAttendees: true,
    smsAlerts: false,
  },
  socialMedia: {
    hashtags: ["#TechConf2025", "#Innovation"],
    shareMessage: "I'm excited to attend this event!",
  },
});

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [previewDialog, setPreviewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [speakerDialog, setSpeakerDialog] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [agendaDialog, setAgendaDialog] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      showSnackbar("You don't have permission to access this page", "error");
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    loadEventData();
  }, [id]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      // Try to fetch from API first
      try {
        const response = await api.get(`/events/${id}`);
        if (response.data) {
          setEventData(response.data);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.log("API fetch failed, using sample data");
      }
      // Fallback to sample data
      const sampleData = getSampleEvent(id);
      setEventData(sampleData);
    } catch (error) {
      console.error("Failed to load event:", error);
      showSnackbar("Failed to load event data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, type) => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 4000);
  };

  const handleInputChange = (field, value) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleVenueChange = (field, value) => {
    setEventData((prev) => ({
      ...prev,
      venue: { ...prev.venue, [field]: value },
    }));
    setUnsavedChanges(true);
  };

  const handleOrganizerChange = (field, value) => {
    setEventData((prev) => ({
      ...prev,
      organizer: { ...prev.organizer, [field]: value },
    }));
    setUnsavedChanges(true);
  };

  const handleAddSpeaker = () => {
    if (editingSpeaker) {
      setEventData((prev) => ({
        ...prev,
        speakers: prev.speakers.map((s) =>
          s.id === editingSpeaker.id ? editingSpeaker : s,
        ),
      }));
    } else {
      const newSpeaker = {
        id: Date.now(),
        name: "",
        title: "",
        company: "",
        bio: "",
      };
      setEventData((prev) => ({
        ...prev,
        speakers: [...prev.speakers, newSpeaker],
      }));
    }
    setSpeakerDialog(false);
    setEditingSpeaker(null);
    setUnsavedChanges(true);
  };

  const handleDeleteSpeaker = (speakerId) => {
    setEventData((prev) => ({
      ...prev,
      speakers: prev.speakers.filter((s) => s.id !== speakerId),
    }));
    setUnsavedChanges(true);
  };

  const handleAddAgendaItem = () => {
    if (editingAgenda) {
      setEventData((prev) => ({
        ...prev,
        agenda: prev.agenda.map((a) =>
          a.id === editingAgenda.id ? editingAgenda : a,
        ),
      }));
    } else {
      const newAgenda = {
        id: Date.now(),
        time: "",
        title: "",
        speaker: "",
        location: "",
        type: "session",
      };
      setEventData((prev) => ({
        ...prev,
        agenda: [...prev.agenda, newAgenda],
      }));
    }
    setAgendaDialog(false);
    setEditingAgenda(null);
    setUnsavedChanges(true);
  };

  const handleDeleteAgendaItem = (agendaId) => {
    setEventData((prev) => ({
      ...prev,
      agenda: prev.agenda.filter((a) => a.id !== agendaId),
    }));
    setUnsavedChanges(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!eventData?.title?.trim()) newErrors.title = "Event title is required";
    if (!eventData?.description?.trim())
      newErrors.description = "Event description is required";
    if (!eventData?.startDate) newErrors.startDate = "Start date is required";
    if (!eventData?.endDate) newErrors.endDate = "End date is required";
    if (
      eventData?.startDate &&
      eventData?.endDate &&
      new Date(eventData.startDate) >= new Date(eventData.endDate)
    ) {
      newErrors.endDate = "End date must be after start date";
    }
    if (eventData?.type === "physical" && !eventData?.venue?.name)
      newErrors.venue = "Venue is required for physical events";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (publish = false) => {
    if (!validateForm()) {
      showSnackbar("Please fix the errors before saving", "error");
      return;
    }
    setSaving(true);
    try {
      const updatedEvent = {
        ...eventData,
        status: publish ? "published" : "draft",
        updatedAt: new Date().toISOString(),
      };
      // In production: await api.put(`/events/${id}`, updatedEvent);
      setEventData(updatedEvent);
      setUnsavedChanges(false);
      showSnackbar(
        publish ? "Event published successfully!" : "Event saved as draft",
        "success",
      );
      if (publish) setTimeout(() => navigate(`/events/${id}`), 1500);
    } catch (error) {
      showSnackbar("Failed to save event", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    setSaving(true);
    try {
      // In production: await api.delete(`/events/${id}`);
      showSnackbar("Event deleted successfully", "success");
      setTimeout(() => navigate("/admin/events"), 1500);
    } catch (error) {
      showSnackbar("Failed to delete event", "error");
    } finally {
      setSaving(false);
      setDeleteDialog(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    return format(parseISO(dateStr), "MMM dd, yyyy hh:mm a");
  };

  const steps = [
    { label: "Basic Info", icon: <MdEvent size={20} /> },
    { label: "Date & Location", icon: <MdSchedule size={20} /> },
    { label: "Event Details", icon: <MdDescription size={20} /> },
    { label: "Speakers & Agenda", icon: <MdPeople size={20} /> },
    { label: "Settings", icon: <MdSettings size={20} /> },
    { label: "Review", icon: <MdCheckCircle size={20} /> },
  ];

  const handleNext = () => {
    let validationError = null;
    if (activeStep === 0 && !eventData?.title)
      validationError = "Event title is required";
    if (activeStep === 1 && (!eventData?.startDate || !eventData?.endDate))
      validationError = "Date and time are required";
    if (validationError) {
      showSnackbar(validationError, "error");
      return;
    }
    setDirection(1);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setActiveStep((prev) => prev - 1);
  };

  if (loading) {
    return (
      <div className="edit-event-loading">
        <div className="loading-spinner"></div>
        <p>Loading event data...</p>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="error-container">
        <div className="error-card">
          <FiAlertCircle size={48} />
          <h2>Event Not Found</h2>
          <p>The event you're trying to edit doesn't exist.</p>
          <button
            className="btn-primary"
            onClick={() => navigate("/admin/events")}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-event-page">
      <div className="edit-event-container">
        {/* Header */}
        <div className="edit-event-header">
          <div className="header-left">
            <button
              className="back-button"
              onClick={() => navigate("/admin/events")}
            >
              <FiArrowLeft size={18} /> Back
            </button>
            <div className="header-title-group">
              <h1 className="header-title">Edit Event</h1>
              <span className={`status-badge ${eventData.status}`}>
                {eventData.status === "published" ? (
                  <MdCheckCircle size={14} />
                ) : (
                  <FiEdit2 size={14} />
                )}
                {eventData.status === "published" ? "Published" : "Draft"}
              </span>
            </div>
            <p className="header-subtitle">
              Last updated: {formatDateTime(eventData.updatedAt) || "Just now"}
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn-outline"
              onClick={() => setPreviewDialog(true)}
            >
              <FiEye size={16} /> Preview
            </button>
            <button
              className="btn-outline"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              <FiSave size={16} /> Save Draft
            </button>
            <button
              className="btn-primary"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              {saving ? (
                <div className="spinner-small"></div>
              ) : (
                <>
                  <MdCheckCircle size={16} /> Publish
                </>
              )}
            </button>
            <button
              className="btn-outline-danger"
              onClick={() => setDeleteDialog(true)}
            >
              <FiTrash2 size={16} /> Delete
            </button>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {unsavedChanges && (
          <div className="alert-warning dismissible">
            <FiAlertCircle size={18} />
            <span>
              You have unsaved changes. Don't forget to save your work!
            </span>
            <button
              className="alert-close"
              onClick={() => setUnsavedChanges(false)}
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="edit-event-grid">
          {/* Stepper Sidebar */}
          <div className="stepper-sidebar">
            <div className="stepper-container">
              {steps.map((step, index) => (
                <div
                  key={step.label}
                  className={`stepper-step ${activeStep >= index ? "completed" : ""} ${activeStep === index ? "active" : ""}`}
                >
                  <div className="step-indicator">
                    {activeStep > index ? (
                      <MdCheckCircle size={18} />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="step-content">
                    <div className="step-label">{step.label}</div>
                    {index < steps.length - 1 && (
                      <div className="step-line"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="form-content">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="form-paper"
              >
                {/* Step 1: Basic Information */}
                {activeStep === 0 && (
                  <div className="form-step">
                    <h2 className="step-title">Basic Information</h2>
                    <p className="step-description">
                      Provide the essential details about your event
                    </p>

                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label className="form-label">Event Title *</label>
                        <input
                          type="text"
                          className={`form-input ${errors.title ? "error" : ""}`}
                          value={eventData.title}
                          onChange={(e) =>
                            handleInputChange("title", e.target.value)
                          }
                          placeholder="e.g., Annual Tech Conference 2025"
                        />
                        {errors.title && (
                          <div className="form-error">{errors.title}</div>
                        )}
                      </div>

                      <div className="form-group full-width">
                        <label className="form-label">Short Description</label>
                        <input
                          type="text"
                          className="form-input"
                          value={eventData.shortDescription || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "shortDescription",
                              e.target.value,
                            )
                          }
                          placeholder="Brief summary (max 200 chars)"
                          maxLength="200"
                        />
                        <div className="form-helper">
                          {eventData.shortDescription?.length || 0}/200
                          characters
                        </div>
                      </div>

                      <div className="form-group full-width">
                        <label className="form-label">Full Description *</label>
                        <textarea
                          className={`form-textarea ${errors.description ? "error" : ""}`}
                          rows={6}
                          value={eventData.description}
                          onChange={(e) =>
                            handleInputChange("description", e.target.value)
                          }
                          placeholder="Detailed description of the event"
                        />
                        {errors.description && (
                          <div className="form-error">{errors.description}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                          className="form-select"
                          value={eventData.category}
                          onChange={(e) =>
                            handleInputChange("category", e.target.value)
                          }
                        >
                          <option value="conference">Conference</option>
                          <option value="workshop">Workshop</option>
                          <option value="academic">Academic</option>
                          <option value="social">Social</option>
                          <option value="career">Career</option>
                          <option value="sports">Sports</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Priority</label>
                        <select
                          className="form-select"
                          value={eventData.priority}
                          onChange={(e) =>
                            handleInputChange("priority", e.target.value)
                          }
                        >
                          <option value="high">High Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="low">Low Priority</option>
                        </select>
                      </div>

                      <div className="form-group full-width">
                        <label className="form-label">Tags</label>
                        <div className="tags-input">
                          {eventData.tags?.map((tag, idx) => (
                            <span key={idx} className="tag">
                              {tag}
                              <button
                                onClick={() =>
                                  handleInputChange(
                                    "tags",
                                    eventData.tags.filter((_, i) => i !== idx),
                                  )
                                }
                              >
                                <FiX size={12} />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder="Add tag and press Enter"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.target.value) {
                                handleInputChange("tags", [
                                  ...(eventData.tags || []),
                                  e.target.value,
                                ]);
                                e.target.value = "";
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Date & Location */}
                {activeStep === 1 && (
                  <div className="form-step">
                    <h2 className="step-title">Date, Time & Location</h2>
                    <p className="step-description">
                      Set when and where your event will take place
                    </p>

                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">
                          Start Date & Time *
                        </label>
                        <input
                          type="datetime-local"
                          className={`form-input ${errors.startDate ? "error" : ""}`}
                          value={eventData.startDate?.slice(0, 16) || ""}
                          onChange={(e) =>
                            handleInputChange("startDate", e.target.value)
                          }
                        />
                        {errors.startDate && (
                          <div className="form-error">{errors.startDate}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">End Date & Time *</label>
                        <input
                          type="datetime-local"
                          className={`form-input ${errors.endDate ? "error" : ""}`}
                          value={eventData.endDate?.slice(0, 16) || ""}
                          onChange={(e) =>
                            handleInputChange("endDate", e.target.value)
                          }
                        />
                        {errors.endDate && (
                          <div className="form-error">{errors.endDate}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Event Type</label>
                        <select
                          className="form-select"
                          value={eventData.type}
                          onChange={(e) =>
                            handleInputChange("type", e.target.value)
                          }
                        >
                          <option value="physical">Physical Event</option>
                          <option value="virtual">Virtual Event</option>
                          <option value="hybrid">Hybrid Event</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Timezone</label>
                        <select
                          className="form-select"
                          value={eventData.timezone}
                          onChange={(e) =>
                            handleInputChange("timezone", e.target.value)
                          }
                        >
                          <option value="America/New_York">
                            Eastern Time (ET)
                          </option>
                          <option value="America/Chicago">
                            Central Time (CT)
                          </option>
                          <option value="America/Denver">
                            Mountain Time (MT)
                          </option>
                          <option value="America/Los_Angeles">
                            Pacific Time (PT)
                          </option>
                        </select>
                      </div>

                      {(eventData.type === "physical" ||
                        eventData.type === "hybrid") && (
                        <>
                          <div className="form-group full-width">
                            <label className="form-label">Venue Name *</label>
                            <input
                              type="text"
                              className={`form-input ${errors.venue ? "error" : ""}`}
                              value={eventData.venue?.name || ""}
                              onChange={(e) =>
                                handleVenueChange("name", e.target.value)
                              }
                            />
                          </div>
                          <div className="form-group full-width">
                            <label className="form-label">Address</label>
                            <input
                              type="text"
                              className="form-input"
                              value={eventData.venue?.address || ""}
                              onChange={(e) =>
                                handleVenueChange("address", e.target.value)
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">City</label>
                            <input
                              type="text"
                              className="form-input"
                              value={eventData.venue?.city || ""}
                              onChange={(e) =>
                                handleVenueChange("city", e.target.value)
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">State</label>
                            <input
                              type="text"
                              className="form-input"
                              value={eventData.venue?.state || ""}
                              onChange={(e) =>
                                handleVenueChange("state", e.target.value)
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Country</label>
                            <input
                              type="text"
                              className="form-input"
                              value={eventData.venue?.country || ""}
                              onChange={(e) =>
                                handleVenueChange("country", e.target.value)
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Event Details */}
                {activeStep === 2 && (
                  <div className="form-step">
                    <h2 className="step-title">Event Details</h2>
                    <p className="step-description">
                      Configure capacity, pricing, and more
                    </p>

                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Maximum Capacity</label>
                        <input
                          type="number"
                          className="form-input"
                          value={eventData.capacity}
                          onChange={(e) =>
                            handleInputChange(
                              "capacity",
                              parseInt(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Early Bird Price</label>
                        <input
                          type="number"
                          className="form-input"
                          value={eventData.price?.earlyBird || ""}
                          onChange={(e) =>
                            handleInputChange("price", {
                              ...eventData.price,
                              earlyBird: parseFloat(e.target.value),
                            })
                          }
                          placeholder="$"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Regular Price</label>
                        <input
                          type="number"
                          className="form-input"
                          value={eventData.price?.regular || ""}
                          onChange={(e) =>
                            handleInputChange("price", {
                              ...eventData.price,
                              regular: parseFloat(e.target.value),
                            })
                          }
                          placeholder="$"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">VIP Price</label>
                        <input
                          type="number"
                          className="form-input"
                          value={eventData.price?.vip || ""}
                          onChange={(e) =>
                            handleInputChange("price", {
                              ...eventData.price,
                              vip: parseFloat(e.target.value),
                            })
                          }
                          placeholder="$"
                        />
                      </div>

                      <div className="form-group full-width">
                        <label className="form-label">
                          Organizer Information
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Organizer Name"
                          value={eventData.organizer?.name || ""}
                          onChange={(e) =>
                            handleOrganizerChange("name", e.target.value)
                          }
                          style={{ marginBottom: "12px" }}
                        />
                        <input
                          type="email"
                          className="form-input"
                          placeholder="Organizer Email"
                          value={eventData.organizer?.email || ""}
                          onChange={(e) =>
                            handleOrganizerChange("email", e.target.value)
                          }
                          style={{ marginBottom: "12px" }}
                        />
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Organizer Phone"
                          value={eventData.organizer?.phone || ""}
                          onChange={(e) =>
                            handleOrganizerChange("phone", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-group full-width">
                        <label className="form-label">Target Audience</label>
                        <div className="tags-input">
                          {eventData.targetAudience?.map((audience, idx) => (
                            <span key={idx} className="tag">
                              {audience}
                              <button
                                onClick={() =>
                                  handleInputChange(
                                    "targetAudience",
                                    eventData.targetAudience.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  )
                                }
                              >
                                <FiX size={12} />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder="Add audience and press Enter"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.target.value) {
                                handleInputChange("targetAudience", [
                                  ...(eventData.targetAudience || []),
                                  e.target.value,
                                ]);
                                e.target.value = "";
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Speakers & Agenda */}
                {activeStep === 3 && (
                  <div className="form-step">
                    <h2 className="step-title">Speakers & Agenda</h2>
                    <p className="step-description">
                      Add speakers and schedule your event agenda
                    </p>

                    <div className="speakers-section">
                      <div className="section-header">
                        <h3>Speakers</h3>
                        <button
                          className="btn-small"
                          onClick={() => setSpeakerDialog(true)}
                        >
                          <FiPlus size={14} /> Add Speaker
                        </button>
                      </div>
                      <div className="speakers-grid">
                        {eventData.speakers?.map((speaker) => (
                          <div key={speaker.id} className="speaker-card">
                            <div className="speaker-avatar">
                              {speaker.name?.charAt(0) || "S"}
                            </div>
                            <div className="speaker-info">
                              <div className="speaker-name">{speaker.name}</div>
                              <div className="speaker-title">
                                {speaker.title}
                              </div>
                              <div className="speaker-company">
                                {speaker.company}
                              </div>
                            </div>
                            <div className="speaker-actions">
                              <button
                                onClick={() => {
                                  setEditingSpeaker(speaker);
                                  setSpeakerDialog(true);
                                }}
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteSpeaker(speaker.id)}
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="agenda-section">
                      <div className="section-header">
                        <h3>Agenda</h3>
                        <button
                          className="btn-small"
                          onClick={() => setAgendaDialog(true)}
                        >
                          <FiPlus size={14} /> Add Agenda Item
                        </button>
                      </div>
                      <div className="agenda-list">
                        {eventData.agenda?.map((item) => (
                          <div key={item.id} className="agenda-item">
                            <div className="agenda-time">
                              <MdSchedule size={16} /> {item.time}
                            </div>
                            <div className="agenda-info">
                              <div className="agenda-title">{item.title}</div>
                              <div className="agenda-location">
                                {item.speaker && `Speaker: ${item.speaker} • `}
                                Location: {item.location}
                              </div>
                            </div>
                            <div className="agenda-actions">
                              <button
                                onClick={() => {
                                  setEditingAgenda(item);
                                  setAgendaDialog(true);
                                }}
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteAgendaItem(item.id)}
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Settings */}
                {activeStep === 4 && (
                  <div className="form-step">
                    <h2 className="step-title">Settings</h2>
                    <p className="step-description">
                      Configure notification and social media settings
                    </p>

                    <div className="form-group full-width">
                      <h4 className="subsection-title">
                        Notification Settings
                      </h4>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={
                            eventData.notificationSettings?.sendReminders
                          }
                          onChange={(e) =>
                            handleInputChange("notificationSettings", {
                              ...eventData.notificationSettings,
                              sendReminders: e.target.checked,
                            })
                          }
                        />{" "}
                        Send Event Reminders
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={
                            eventData.notificationSettings?.emailAttendees
                          }
                          onChange={(e) =>
                            handleInputChange("notificationSettings", {
                              ...eventData.notificationSettings,
                              emailAttendees: e.target.checked,
                            })
                          }
                        />{" "}
                        Email Attendees
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={eventData.notificationSettings?.smsAlerts}
                          onChange={(e) =>
                            handleInputChange("notificationSettings", {
                              ...eventData.notificationSettings,
                              smsAlerts: e.target.checked,
                            })
                          }
                        />{" "}
                        SMS Alerts
                      </label>
                    </div>

                    <div className="form-group full-width">
                      <h4 className="subsection-title">
                        Social Media Settings
                      </h4>
                      <input
                        type="text"
                        className="form-input"
                        value={
                          eventData.socialMedia?.hashtags?.join(", ") || ""
                        }
                        onChange={(e) =>
                          handleInputChange("socialMedia", {
                            ...eventData.socialMedia,
                            hashtags: e.target.value
                              .split(",")
                              .map((t) => t.trim()),
                          })
                        }
                        placeholder="Hashtags (comma separated)"
                      />
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={eventData.socialMedia?.shareMessage || ""}
                        onChange={(e) =>
                          handleInputChange("socialMedia", {
                            ...eventData.socialMedia,
                            shareMessage: e.target.value,
                          })
                        }
                        placeholder="Share message for attendees"
                      />
                    </div>
                  </div>
                )}

                {/* Step 6: Review */}
                {activeStep === 5 && (
                  <div className="form-step">
                    <h2 className="step-title">Review & Publish</h2>
                    <p className="step-description">
                      Review all event details before publishing
                    </p>

                    <div className="review-card">
                      <h3>Event Summary</h3>
                      <div className="review-grid">
                        <div>
                          <strong>Title:</strong> {eventData.title}
                          <br />
                          <strong>Category:</strong> {eventData.category}
                          <br />
                          <strong>Type:</strong> {eventData.type}
                        </div>
                        <div>
                          <strong>Start:</strong>{" "}
                          {formatDateTime(eventData.startDate)}
                          <br />
                          <strong>End:</strong>{" "}
                          {formatDateTime(eventData.endDate)}
                          <br />
                          <strong>Capacity:</strong> {eventData.capacity}{" "}
                          attendees
                        </div>
                      </div>
                    </div>
                    <div className="review-card">
                      <h3>Description</h3>
                      <p>{eventData.description}</p>
                    </div>
                    <div className="review-card">
                      <h3>Publishing Options</h3>
                      <div className="alert-info">
                        Once published, your event will be visible to all users
                        and registration will open.
                      </div>
                      <label className="checkbox-label">
                        <input type="checkbox" defaultChecked /> Send
                        notification to all users
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" defaultChecked /> Enable early
                        bird pricing
                      </label>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="form-navigation">
                  <button
                    className="btn-secondary"
                    disabled={activeStep === 0}
                    onClick={handleBack}
                  >
                    <FiArrowLeft size={16} /> Back
                  </button>
                  {activeStep === steps.length - 1 ? (
                    <button
                      className="btn-primary"
                      onClick={() => handleSave(true)}
                    >
                      <MdCheckCircle size={16} /> Publish Event
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={handleNext}>
                      Continue <FiArrowRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      {previewDialog && (
        <div className="dialog-overlay" onClick={() => setPreviewDialog(false)}>
          <div
            className="dialog-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <h3>Event Preview</h3>
              <button
                className="dialog-close"
                onClick={() => setPreviewDialog(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="dialog-body">
              <h2>{eventData.title}</h2>
              <span className="category-badge">{eventData.category}</span>
              <p>{eventData.description}</p>
              <hr />
              <strong>Date:</strong> {formatDateTime(eventData.startDate)}
              <br />
              <strong>Location:</strong>{" "}
              {eventData.venue?.name || eventData.virtualLink || "TBD"}
            </div>
            <div className="dialog-footer">
              <button
                className="btn-secondary"
                onClick={() => setPreviewDialog(false)}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => setPreviewDialog(false)}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialog && (
        <div className="dialog-overlay" onClick={() => setDeleteDialog(false)}>
          <div
            className="dialog-container dialog-small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <h3>Delete Event</h3>
              <button
                className="dialog-close"
                onClick={() => setDeleteDialog(false)}
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
                    This will permanently delete "{eventData.title}" and all
                    associated data.
                  </p>
                </div>
              </div>
            </div>
            <div className="dialog-footer">
              <button
                className="btn-secondary"
                onClick={() => setDeleteDialog(false)}
              >
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteEvent}>
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Speaker Dialog */}
      {speakerDialog && (
        <div className="dialog-overlay" onClick={() => setSpeakerDialog(false)}>
          <div
            className="dialog-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <h3>{editingSpeaker ? "Edit Speaker" : "Add Speaker"}</h3>
              <button
                className="dialog-close"
                onClick={() => setSpeakerDialog(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="dialog-body">
              <input
                type="text"
                className="form-input"
                placeholder="Name"
                value={editingSpeaker?.name || ""}
                onChange={(e) =>
                  setEditingSpeaker((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                className="form-input"
                placeholder="Title"
                value={editingSpeaker?.title || ""}
                onChange={(e) =>
                  setEditingSpeaker((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                className="form-input"
                placeholder="Company"
                value={editingSpeaker?.company || ""}
                onChange={(e) =>
                  setEditingSpeaker((prev) => ({
                    ...prev,
                    company: e.target.value,
                  }))
                }
              />
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Bio"
                value={editingSpeaker?.bio || ""}
                onChange={(e) =>
                  setEditingSpeaker((prev) => ({
                    ...prev,
                    bio: e.target.value,
                  }))
                }
              />
            </div>
            <div className="dialog-footer">
              <button
                className="btn-secondary"
                onClick={() => setSpeakerDialog(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddSpeaker}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agenda Dialog */}
      {agendaDialog && (
        <div className="dialog-overlay" onClick={() => setAgendaDialog(false)}>
          <div
            className="dialog-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <h3>{editingAgenda ? "Edit Agenda Item" : "Add Agenda Item"}</h3>
              <button
                className="dialog-close"
                onClick={() => setAgendaDialog(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="dialog-body">
              <input
                type="text"
                className="form-input"
                placeholder="Time (e.g., 10:00 - 11:00)"
                value={editingAgenda?.time || ""}
                onChange={(e) =>
                  setEditingAgenda((prev) => ({
                    ...prev,
                    time: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                className="form-input"
                placeholder="Title"
                value={editingAgenda?.title || ""}
                onChange={(e) =>
                  setEditingAgenda((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                className="form-input"
                placeholder="Speaker"
                value={editingAgenda?.speaker || ""}
                onChange={(e) =>
                  setEditingAgenda((prev) => ({
                    ...prev,
                    speaker: e.target.value,
                  }))
                }
              />
              <input
                type="text"
                className="form-input"
                placeholder="Location"
                value={editingAgenda?.location || ""}
                onChange={(e) =>
                  setEditingAgenda((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            </div>
            <div className="dialog-footer">
              <button
                className="btn-secondary"
                onClick={() => setAgendaDialog(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddAgendaItem}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
            <FiX size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default EditEventPage;
