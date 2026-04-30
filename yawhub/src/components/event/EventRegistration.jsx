// src/components/event/EventRegistration.jsx
import React, { useState, useEffect } from "react";
import eventService from "../../services/eventService";
import ErrorAlert from "../common/ErrorAlert";
import SuccessAlert from "../common/SuccessAlert";
import LoadingSpinner from "../common/LoadingSpinner";
import "../styles/components/EventRegistration.css";

const EventRegistration = ({ eventId, eventTitle, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    studentId: "",
    yearOfStudy: "",
    additionalInfo: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const renderIcon = (iconName) => {
    const icons = {
      user: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
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
      department: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      ),
      studentId: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 4h16v16H4z" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="8" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="16" />
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
      info: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
      close: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ),
      check: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 6-6" />
        </svg>
      ),
    };
    return icons[iconName];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Full name is required");
      return false;
    }
    if (formData.name.length < 2) {
      setError("Name must be at least 2 characters");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Email address is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
      setError("Please enter a valid phone number");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone || null,
        department: formData.department || null,
        studentId: formData.studentId || null,
        yearOfStudy: formData.yearOfStudy
          ? parseInt(formData.yearOfStudy)
          : null,
        additionalInfo: formData.additionalInfo || null,
      };

      await eventService.registerForEvent(eventId, registrationData);
      setSuccess(
        "Registration successful! You will receive a confirmation email shortly.",
      );

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (errorMessage.includes("already registered")) {
        setError("You are already registered for this event.");
      } else if (errorMessage.includes("Event is full")) {
        setError("Sorry, this event is fully booked.");
      } else if (errorMessage.includes("Registration deadline has passed")) {
        setError("Registration deadline has passed for this event.");
      } else {
        setError(errorMessage || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFieldInvalid = (field) => {
    if (!touched[field]) return false;
    switch (field) {
      case "name":
        return !formData.name.trim() || formData.name.length < 2;
      case "email":
        return (
          !formData.email.trim() ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        );
      case "phone":
        return formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone);
      default:
        return false;
    }
  };

  const yearOptions = [
    { value: "", label: "Select Year" },
    { value: "1", label: "Year 1" },
    { value: "2", label: "Year 2" },
    { value: "3", label: "Year 3" },
    { value: "4", label: "Year 4" },
  ];

  return (
    <div className="event-registration-overlay">
      <div className="event-registration-modal">
        <div className="registration-header">
          <div className="header-left">
            <h3>
              {renderIcon("calendar")}
              Event Registration
            </h3>
            <p className="event-title">{eventTitle || "Register for Event"}</p>
          </div>
          <button className="close-btn" onClick={onCancel} aria-label="Close">
            {renderIcon("close")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <ErrorAlert message={error} onClose={() => setError("")} />
          <SuccessAlert message={success} onClose={() => setSuccess("")} />

          <div className="form-scrollable">
            <div className="form-group">
              <label htmlFor="name">
                {renderIcon("user")}
                Full Name
                <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur("name")}
                required
                placeholder="Enter your full name"
                className={isFieldInvalid("name") ? "error" : ""}
                disabled={loading}
                autoComplete="name"
              />
              {isFieldInvalid("name") && (
                <small className="error-hint">
                  Please enter your full name
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                {renderIcon("email")}
                Email Address
                <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur("email")}
                required
                placeholder="Enter your email address"
                className={isFieldInvalid("email") ? "error" : ""}
                disabled={loading}
                autoComplete="email"
              />
              {isFieldInvalid("email") && (
                <small className="error-hint">
                  Please enter a valid email address
                </small>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">
                  {renderIcon("phone")}
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur("phone")}
                  placeholder="+233 XX XXX XXXX"
                  className={isFieldInvalid("phone") ? "error" : ""}
                  disabled={loading}
                  autoComplete="tel"
                />
                {isFieldInvalid("phone") && (
                  <small className="error-hint">
                    Please enter a valid phone number
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="studentId">
                  {renderIcon("studentId")}
                  Student ID (Optional)
                </label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="Enter your student ID"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">
                  {renderIcon("department")}
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="yearOfStudy">
                  {renderIcon("calendar")}
                  Year of Study
                </label>
                <select
                  id="yearOfStudy"
                  name="yearOfStudy"
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {yearOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="additionalInfo">
                {renderIcon("info")}
                Additional Information
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                rows="3"
                placeholder="Any special requirements, dietary restrictions, or questions?"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <LoadingSpinner size="small" text="" />
              ) : (
                <>
                  {renderIcon("check")}
                  Confirm Registration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventRegistration;
