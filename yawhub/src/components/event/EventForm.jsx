// src/components/event/EventForm.jsx - Completely Fixed Version
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import eventService from "../../services/eventService";
import ErrorAlert from "../common/ErrorAlert";
import SuccessAlert from "../common/SuccessAlert";
import LoadingSpinner from "../common/LoadingSpinner";
import ConfirmDialog from "../common/ConfirmDialog";
import "../../styles/components/EventForm.css";

const EventForm = ({
  eventId,
  initialData = null,
  onSubmit,
  onCancel,
  loading: externalLoading,
}) => {
  const navigate = useNavigate();
  const quillRef = useRef(null);
  const [formData, setFormData] = useState({
    title: "",
    eventType: "academic",
    description: "",
    date: "",
    endDate: "",
    time: "",
    location: "",
    capacity: 100,
    image: "",
    isPinned: false,
    registrationDeadline: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!eventId);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isSubmitting =
    externalLoading !== undefined ? externalLoading : loading;

  // ============================================================
  // IMAGE UPLOAD HANDLER - Defined FIRST
  // ============================================================

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const formDataObj = new FormData();
        formDataObj.append("image", file);

        try {
          setLoading(true);
          setUploadProgress(0);

          // Simulate progress
          const interval = setInterval(() => {
            setUploadProgress((prev) => Math.min(prev + 10, 90));
          }, 200);

          const response = await eventService.uploadImage(formDataObj);

          clearInterval(interval);
          setUploadProgress(100);

          setFormData((prev) => ({ ...prev, image: response.data.url }));
          setSuccess("Image uploaded successfully!");
          setIsDirty(true);
          setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
          setError("Failed to upload image");
        } finally {
          setLoading(false);
          setTimeout(() => setUploadProgress(0), 1000);
        }
      }
    };
  }, []);

  // ============================================================
  // QUILL MODULES - Defined after handleImageUpload
  // ============================================================

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["link", "image", "video"],
        ["blockquote", "code-block"],
        ["clean"],
      ],
      handlers: {
        image: handleImageUpload,
      },
    },
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "check",
    "indent",
    "align",
    "link",
    "image",
    "video",
    "blockquote",
    "code-block",
  ];

  // ============================================================
  // RENDER ICON HELPER
  // ============================================================

  const renderIcon = useCallback((iconName) => {
    const icons = {
      title: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 20h16M6 4h12M8 4v16M16 4v16" />
        </svg>
      ),
      calendar: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      time: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      location: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      capacity: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      image: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
      email: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 7L2 7" />
        </svg>
      ),
      phone: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
      pin: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 17v5M5 17h14v-1c0-2-1-4-4-4h-6c-3 0-4 2-4 4v1z" />
          <path d="M8 12h8" />
          <circle cx="12" cy="8" r="4" />
        </svg>
      ),
      upload: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M13 2L6 9v10h12V2z" />
          <path d="M13 2v7h7" />
        </svg>
      ),
      close: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ),
    };
    return icons[iconName];
  }, []);

  // ============================================================
  // GET EVENT TYPE ICON
  // ============================================================

  const getEventTypeIcon = useCallback((type) => {
    const icons = {
      academic: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
      exam: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
      registration: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      ),
      meeting: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      holiday: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
      workshop: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
        </svg>
      ),
      seminar: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    };
    return icons[type] || icons.academic;
  }, []);

  // ============================================================
  // FETCH EVENT
  // ============================================================

  useEffect(() => {
    if (eventId && !initialData) {
      const fetchEvent = async () => {
        try {
          const response = await eventService.getEventById(eventId);
          setFormData({
            title: response.data.title || "",
            eventType: response.data.eventType || "academic",
            description: response.data.description || "",
            date: response.data.date?.split("T")[0] || "",
            endDate: response.data.endDate?.split("T")[0] || "",
            time: response.data.time || "",
            location: response.data.location || "",
            capacity: response.data.capacity || 100,
            image: response.data.image || "",
            isPinned: response.data.isPinned || false,
            registrationDeadline:
              response.data.registrationDeadline?.split("T")[0] || "",
            contactEmail: response.data.contactEmail || "",
            contactPhone: response.data.contactPhone || "",
          });
          setIsDirty(false);
        } catch (err) {
          setError("Failed to load event");
        } finally {
          setFetchLoading(false);
        }
      };
      fetchEvent();
    } else if (initialData) {
      setFormData(initialData);
      setIsDirty(false);
      setFetchLoading(false);
    }
  }, [eventId, initialData]);

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setIsDirty(true);
    setError("");
  }, []);

  const handleDescriptionChange = useCallback((content) => {
    setFormData((prev) => ({
      ...prev,
      description: content,
    }));
    setIsDirty(true);
    setError("");
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.title.trim()) {
      setError("Event title is required");
      return false;
    }
    if (formData.title.length < 5) {
      setError("Title must be at least 5 characters");
      return false;
    }
    if (formData.title.length > 200) {
      setError("Title cannot exceed 200 characters");
      return false;
    }
    if (!formData.date) {
      setError("Event date is required");
      return false;
    }
    if (!formData.location.trim()) {
      setError("Event location is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Event description is required");
      return false;
    }
    if (formData.description.length < 10) {
      setError("Description must be at least 10 characters");
      return false;
    }
    if (formData.capacity < 1) {
      setError("Capacity must be at least 1");
      return false;
    }
    if (formData.capacity > 10000) {
      setError("Capacity cannot exceed 10,000");
      return false;
    }
    if (
      formData.endDate &&
      new Date(formData.endDate) < new Date(formData.date)
    ) {
      setError("End date cannot be before start date");
      return false;
    }
    if (
      formData.registrationDeadline &&
      new Date(formData.registrationDeadline) > new Date(formData.date)
    ) {
      setError("Registration deadline must be before the event date");
      return false;
    }
    if (
      formData.contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)
    ) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (!validateForm()) return;

      if (onSubmit) {
        onSubmit(formData);
        return;
      }

      setLoading(true);

      try {
        const submitData = {
          ...formData,
          capacity: parseInt(formData.capacity),
        };

        if (eventId) {
          await eventService.updateEvent(eventId, submitData);
          setSuccess("Event updated successfully!");
          setTimeout(() => {
            navigate(`/events/${eventId}`);
          }, 1500);
        } else {
          await eventService.createEvent(submitData);
          setSuccess("Event created successfully!");
          setTimeout(() => {
            navigate("/events");
          }, 1500);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to save event");
      } finally {
        setLoading(false);
      }
    },
    [formData, onSubmit, eventId, navigate, validateForm],
  );

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else if (isDirty) {
      setShowCancelDialog(true);
    } else {
      navigate(-1);
    }
  }, [onCancel, isDirty, navigate]);

  const eventTypes = [
    { value: "academic", label: "Academic", icon: "academic" },
    { value: "exam", label: "Exam", icon: "exam" },
    { value: "registration", label: "Registration", icon: "registration" },
    { value: "meeting", label: "Meeting", icon: "meeting" },
    { value: "holiday", label: "Holiday", icon: "holiday" },
    { value: "workshop", label: "Workshop", icon: "workshop" },
    { value: "seminar", label: "Seminar", icon: "seminar" },
  ];

  if (fetchLoading) {
    return (
      <div className="event-form-loading">
        <LoadingSpinner size="large" text="Loading event details..." />
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-header">
          <h2>{eventId ? "Edit Event" : "Create New Event"}</h2>
          <p className="form-subtitle">
            {eventId
              ? "Update the event details below"
              : "Fill in the details to create a new event"}
          </p>
        </div>

        <ErrorAlert message={error} onClose={() => setError("")} />
        <SuccessAlert message={success} onClose={() => setSuccess("")} />

        <div className="form-grid">
          {/* Left Column - Main Fields */}
          <div className="form-main">
            <div className="form-group">
              <label htmlFor="title">
                {renderIcon("title")}
                Event Title
                <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter event title"
                className="form-input"
                maxLength="200"
              />
              <small className="form-hint">
                {formData.title.length}/200 characters
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">
                  {renderIcon("calendar")}
                  Start Date
                  <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="form-input"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">
                  {renderIcon("calendar")}
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="form-input"
                  min={formData.date || new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="time">
                  {renderIcon("time")}
                  Time (Optional)
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">
                  {renderIcon("location")}
                  Location
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="Enter event location"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="capacity">
                  {renderIcon("capacity")}
                  Capacity
                  <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  max="10000"
                  placeholder="Maximum participants"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="registrationDeadline">
                  {renderIcon("calendar")}
                  Registration Deadline (Optional)
                </label>
                <input
                  type="date"
                  id="registrationDeadline"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  className="form-input"
                  max={formData.date}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="image">
                {renderIcon("image")}
                Event Image URL (Optional)
              </label>
              <div className="image-upload-area">
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="form-input"
                />
                <button
                  type="button"
                  className="upload-btn"
                  onClick={handleImageUpload}
                  disabled={loading}
                >
                  {loading && uploadProgress > 0
                    ? `${uploadProgress}%`
                    : renderIcon("upload")}
                  Upload Image
                </button>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${uploadProgress}%` }}
                  />
                  <span>{uploadProgress}%</span>
                </div>
              )}
              {formData.image && (
                <div className="image-preview">
                  <img
                    src={formData.image}
                    alt="Preview"
                    onError={(e) => {
                      e.target.src = "/images/placeholder.jpg";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, image: "" }))
                    }
                  >
                    {renderIcon("close")}
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description
                <span className="required">*</span>
              </label>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Write event description..."
                modules={modules}
                formats={formats}
                className="event-editor"
              />
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="form-sidebar">
            <div className="settings-card">
              <h3>Event Settings</h3>

              <div className="form-group">
                <label htmlFor="eventType">Event Type</label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="form-select"
                >
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {getEventTypeIcon(type.value)} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isPinned"
                    checked={formData.isPinned}
                    onChange={handleChange}
                  />
                  {renderIcon("pin")}
                  <span>Pin this event</span>
                </label>
                <small className="form-hint">
                  Pinned events appear at the top
                </small>
              </div>
            </div>

            <div className="settings-card">
              <h3>Contact Information</h3>

              <div className="form-group">
                <label htmlFor="contactEmail">
                  {renderIcon("email")}
                  Contact Email (Optional)
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactPhone">
                  {renderIcon("phone")}
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="+233 XX XXX XXXX"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoadingSpinner size="small" text="" />
            ) : eventId ? (
              "Update Event"
            ) : (
              "Create Event"
            )}
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave?"
        onConfirm={() => navigate(-1)}
        onCancel={() => setShowCancelDialog(false)}
        confirmText="Leave"
        cancelText="Stay"
        type="warning"
      />
    </>
  );
};

export default EventForm;
