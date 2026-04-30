// src/components/common/ErrorAlert.jsx
import React, { useState, useEffect } from "react";
import "../../styles/components/ErrorAlert.css";

const ErrorAlert = ({
  message,
  onClose,
  dismissible = true,
  type = "error",
  autoDismiss = false,
  autoDismissTime = 5000,
  showIcon = true,
  title = "",
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    let timeoutId;
    let dismissTimeoutId;

    if (autoDismiss && dismissible && message) {
      timeoutId = setTimeout(() => {
        handleClose();
      }, autoDismissTime);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (dismissTimeoutId) clearTimeout(dismissTimeoutId);
    };
  }, [autoDismiss, autoDismissTime, dismissible, message]);

  const handleClose = () => {
    if (!dismissible) return;

    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!message || !isVisible) return null;

  const alertTypes = {
    error: {
      icon: "error",
      className: "error-alert-error",
    },
    warning: {
      icon: "warning",
      className: "error-alert-warning",
    },
    info: {
      icon: "info",
      className: "error-alert-info",
    },
    success: {
      icon: "success",
      className: "error-alert-success",
    },
  };

  const currentType = alertTypes[type] || alertTypes.error;

  const renderIcon = () => {
    const icons = {
      error: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      warning: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
          <path d="M12 6v2" />
        </svg>
      ),
      info: (
        <svg
          width="20"
          height="20"
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
      success: (
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
    return icons[currentType.icon] || icons.error;
  };

  return (
    <div
      className={`error-alert ${currentType.className} ${isLeaving ? "leaving" : ""}`}
      role="alert"
    >
      {showIcon && <div className="error-icon">{renderIcon()}</div>}
      <div className="error-content">
        {title && <div className="error-title">{title}</div>}
        <div className="error-message">{message}</div>
      </div>
      {dismissible && (
        <button
          className="error-close"
          onClick={handleClose}
          aria-label="Close alert"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      {autoDismiss && dismissible && (
        <div className="error-progress-bar">
          <div
            className="error-progress-fill"
            style={{ animationDuration: `${autoDismissTime}ms` }}
          />
        </div>
      )}
    </div>
  );
};

export default ErrorAlert;
