// src/components/notice/NoticeForm.jsx
import React, { useState, useEffect, useRef } from "react";
import "../../styles/components/NoticeForm.css";

const NoticeForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    priority: "medium",
    attachments: [],
    tags: [],
    startDate: "",
    endDate: "",
    isPinned: false,
    isUrgent: false,
    contactEmail: "",
    contactPhone: "",
    location: "",
    maxAttendees: "",
    status: "draft",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  const maxTitleLength = 100;
  const maxContentLength = 5000;

  // Categories options
  const categories = [
    { value: "general", label: "General", icon: "📢", color: "#3b82f6" },
    { value: "academic", label: "Academic", icon: "📚", color: "#8b5cf6" },
    { value: "event", label: "Event", icon: "🎉", color: "#ec4899" },
    { value: "deadline", label: "Deadline", icon: "⏰", color: "#ef4444" },
    {
      value: "opportunity",
      label: "Opportunity",
      icon: "💼",
      color: "#10b981",
    },
    {
      value: "announcement",
      label: "Announcement",
      icon: "📣",
      color: "#f59e0b",
    },
    {
      value: "maintenance",
      label: "Maintenance",
      icon: "🔧",
      color: "#6b7280",
    },
    { value: "other", label: "Other", icon: "📝", color: "#94a3b8" },
  ];

  // Priority options
  const priorities = [
    { value: "low", label: "Low", icon: "🟢", color: "#10b981" },
    { value: "medium", label: "Medium", icon: "🟡", color: "#f59e0b" },
    { value: "high", label: "High", icon: "🔴", color: "#ef4444" },
  ];

  // Status options
  const statuses = [
    { value: "draft", label: "Draft", icon: "📝" },
    { value: "published", label: "Published", icon: "✓" },
    { value: "archived", label: "Archived", icon: "📦" },
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        startDate: initialData.startDate || "",
        endDate: initialData.endDate || "",
        tags: initialData.tags || [],
        attachments: initialData.attachments || [],
      });
      setCharCount(initialData.content?.length || 0);
    }
  }, [initialData]);

  useEffect(() => {
    setCharCount(formData.content.length);
  }, [formData.content]);

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "title":
        if (!value.trim()) error = "Title is required";
        else if (value.length < 5)
          error = "Title must be at least 5 characters";
        else if (value.length > maxTitleLength)
          error = `Title cannot exceed ${maxTitleLength} characters`;
        break;

      case "content":
        if (!value.trim()) error = "Content is required";
        else if (value.length < 20)
          error = "Content must be at least 20 characters";
        else if (value.length > maxContentLength)
          error = `Content cannot exceed ${maxContentLength} characters`;
        break;

      case "category":
        if (!value) error = "Please select a category";
        break;

      case "priority":
        if (!value) error = "Please select a priority";
        break;

      case "startDate":
        if (
          formData.endDate &&
          value &&
          new Date(value) > new Date(formData.endDate)
        ) {
          error = "Start date cannot be after end date";
        }
        break;

      case "endDate":
        if (
          formData.startDate &&
          value &&
          new Date(value) < new Date(formData.startDate)
        ) {
          error = "End date cannot be before start date";
        }
        break;

      case "contactEmail":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;

      case "contactPhone":
        if (
          value &&
          !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(
            value,
          )
        ) {
          error = "Please enter a valid phone number";
        }
        break;

      case "maxAttendees":
        if (value && (isNaN(value) || parseInt(value) < 1)) {
          error = "Please enter a valid number";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleAddTag = () => {
    if (
      tagInput.trim() &&
      !formData.tags.includes(tagInput.trim()) &&
      formData.tags.length < 10
    ) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          attachments: `File ${file.name} exceeds 5MB limit`,
        }));
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          attachments: `File ${file.name} type not supported`,
        }));
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // In real implementation, upload to server here
      setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            ...validFiles.map((file) => ({
              file,
              name: file.name,
              size: file.size,
              type: file.type,
              url: URL.createObjectURL(file),
            })),
          ],
        }));
        setUploadProgress(0);
        clearInterval(interval);
      }, 1000);
    }
  };

  const handleRemoveAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = ["title", "content", "category", "priority"];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (formData.startDate && formData.endDate) {
      const startError = validateField("startDate", formData.startDate);
      const endError = validateField("endDate", formData.endDate);
      if (startError) newErrors.startDate = startError;
      if (endError) newErrors.endDate = endError;
    }

    if (formData.contactEmail) {
      const emailError = validateField("contactEmail", formData.contactEmail);
      if (emailError) newErrors.contactEmail = emailError;
    }

    if (formData.contactPhone) {
      const phoneError = validateField("contactPhone", formData.contactPhone);
      if (phoneError) newErrors.contactPhone = phoneError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector(".form-group.error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data for submission
      const submitData = {
        ...formData,
        attachments: formData.attachments.map((att) => ({
          name: att.name,
          size: att.size,
          type: att.type,
          url: att.url,
        })),
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors((prev) => ({
        ...prev,
        submit: error.message || "Failed to submit form",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all changes?")) {
      setFormData({
        title: "",
        content: "",
        category: "general",
        priority: "medium",
        attachments: [],
        tags: [],
        startDate: "",
        endDate: "",
        isPinned: false,
        isUrgent: false,
        contactEmail: "",
        contactPhone: "",
        location: "",
        maxAttendees: "",
        status: "draft",
      });
      setErrors({});
      setTouched({});
      setTagInput("");
      setCharCount(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getCharColor = () => {
    if (charCount > maxContentLength * 0.9) return "#ef4444";
    if (charCount > maxContentLength * 0.7) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="notice-form-container">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="notice-form"
        noValidate
      >
        <div className="form-header">
          <h2 className="form-title">
            {isEditing ? "✏️ Edit Notice" : "📝 Create New Notice"}
          </h2>
          <p className="form-description">
            Fill in the details below to {isEditing ? "update" : "create"} your
            notice
          </p>
        </div>

        {errors.submit && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{errors.submit}</span>
          </div>
        )}

        <div className="form-sections">
          {/* Basic Information Section */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📋</span>
              Basic Information
            </h3>

            <div className="form-group">
              <label htmlFor="title" className="form-label required">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${touched.title && errors.title ? "error" : ""}`}
                placeholder="Enter notice title..."
                maxLength={maxTitleLength}
                disabled={isSubmitting}
              />
              {touched.title && errors.title && (
                <span className="error-message">{errors.title}</span>
              )}
              <span className="char-counter" style={{ color: getCharColor() }}>
                {formData.title.length}/{maxTitleLength}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="content" className="form-label required">
                Content
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-textarea ${touched.content && errors.content ? "error" : ""}`}
                placeholder="Write your notice content here..."
                rows={8}
                maxLength={maxContentLength}
                disabled={isSubmitting}
              />
              {touched.content && errors.content && (
                <span className="error-message">{errors.content}</span>
              )}
              <span className="char-counter" style={{ color: getCharColor() }}>
                {charCount}/{maxContentLength} characters
              </span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category" className="form-label required">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-select ${touched.category && errors.category ? "error" : ""}`}
                  disabled={isSubmitting}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
                {touched.category && errors.category && (
                  <span className="error-message">{errors.category}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="priority" className="form-label required">
                  Priority
                </label>
                <div className="priority-buttons">
                  {priorities.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      className={`priority-btn ${formData.priority === priority.value ? "active" : ""}`}
                      style={{
                        borderColor:
                          formData.priority === priority.value
                            ? priority.color
                            : "#e2e8f0",
                        backgroundColor:
                          formData.priority === priority.value
                            ? `${priority.color}10`
                            : "transparent",
                      }}
                      onClick={() => {
                        handleChange({
                          target: { name: "priority", value: priority.value },
                        });
                      }}
                      disabled={isSubmitting}
                    >
                      <span>{priority.icon}</span>
                      <span>{priority.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details Section */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">⚙️</span>
              Additional Details
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate" className="form-label">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${touched.startDate && errors.startDate ? "error" : ""}`}
                  disabled={isSubmitting}
                />
                {touched.startDate && errors.startDate && (
                  <span className="error-message">{errors.startDate}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="endDate" className="form-label">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${touched.endDate && errors.endDate ? "error" : ""}`}
                  disabled={isSubmitting}
                />
                {touched.endDate && errors.endDate && (
                  <span className="error-message">{errors.endDate}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location" className="form-label">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Event location or venue"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxAttendees" className="form-label">
                  Max Attendees (Optional)
                </label>
                <input
                  type="number"
                  id="maxAttendees"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${touched.maxAttendees && errors.maxAttendees ? "error" : ""}`}
                  placeholder="Unlimited if empty"
                  min="1"
                  disabled={isSubmitting}
                />
                {touched.maxAttendees && errors.maxAttendees && (
                  <span className="error-message">{errors.maxAttendees}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactEmail" className="form-label">
                  Contact Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${touched.contactEmail && errors.contactEmail ? "error" : ""}`}
                  placeholder="contact@example.com"
                  disabled={isSubmitting}
                />
                {touched.contactEmail && errors.contactEmail && (
                  <span className="error-message">{errors.contactEmail}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contactPhone" className="form-label">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${touched.contactPhone && errors.contactPhone ? "error" : ""}`}
                  placeholder="+1 234 567 8900"
                  disabled={isSubmitting}
                />
                {touched.contactPhone && errors.contactPhone && (
                  <span className="error-message">{errors.contactPhone}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <div className="tags-input">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add tags (press Enter)"
                  className="form-input"
                  disabled={isSubmitting || formData.tags.length >= 10}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="add-tag-btn"
                  disabled={
                    isSubmitting ||
                    !tagInput.trim() ||
                    formData.tags.length >= 10
                  }
                >
                  Add
                </button>
              </div>
              <div className="tags-list">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="remove-tag"
                      disabled={isSubmitting}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📎</span>
              Attachments
            </h3>

            <div className="form-group">
              <div className="file-upload-area">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                  className="file-input"
                  id="file-upload"
                  disabled={isSubmitting}
                />
                <label htmlFor="file-upload" className="file-upload-label">
                  <span className="upload-icon">📁</span>
                  <span>Click or drag files to upload</span>
                  <span className="upload-hint">
                    Max 5MB per file (JPG, PNG, PDF, DOC)
                  </span>
                </label>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <span className="progress-text">{uploadProgress}%</span>
                  </div>
                </div>
              )}

              {formData.attachments.length > 0 && (
                <div className="attachments-list">
                  <h4 className="attachments-title">
                    Uploaded Files ({formData.attachments.length})
                  </h4>
                  {formData.attachments.map((attachment, index) => (
                    <div key={index} className="attachment-item">
                      <div className="attachment-info">
                        <span className="attachment-icon">
                          {attachment.type.includes("image") ? "🖼️" : "📄"}
                        </span>
                        <div className="attachment-details">
                          <span className="attachment-name">
                            {attachment.name}
                          </span>
                          <span className="attachment-size">
                            {(attachment.size / 1024).toFixed(2)} KB
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="remove-attachment"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Options Section */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">⚙️</span>
              Options
            </h3>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isPinned"
                  checked={formData.isPinned}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <span className="checkbox-text">
                  <strong>Pin this notice</strong>
                  <small>Pinned notices appear at the top of the list</small>
                </span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <span className="checkbox-text">
                  <strong>Mark as urgent</strong>
                  <small>Urgent notices will be highlighted</small>
                </span>
              </label>
            </div>

            {isEditing && (
              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                  disabled={isSubmitting}
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.icon} {status.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={isSubmitting || isLoading}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <>
                <span className="spinner"></span>
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEditing ? "Update Notice" : "Create Notice"}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoticeForm;
