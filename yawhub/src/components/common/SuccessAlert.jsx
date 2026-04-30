// src/components/common/SuccessAlert.jsx
import React, { useState, useEffect } from "react";
import "../../styles/components/SuccessAlert.css";

const SuccessAlert = ({
  message,
  onClose,
  dismissible = true,
  type = "success",
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
        // eslint-disable-next-line react-hooks/immutability
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
    success: {
      icon: "success",
      className: "success-alert-success",
    },
    info: {
      icon: "info",
      className: "success-alert-info",
    },
    warning: {
      icon: "warning",
      className: "success-alert-warning",
    },
    error: {
      icon: "error",
      className: "success-alert-error",
    },
  };

  const currentType = alertTypes[type] || alertTypes.success;

  const renderIcon = () => {
    const icons = {
      success: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            d="M20 6L9 17l-5-5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
        </svg>
      ),
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
    };
    return icons[currentType.icon] || icons.success;
  };

  return (
    <div
      className={`success-alert ${currentType.className} ${isLeaving ? "leaving" : ""}`}
      role="alert"
    >
      {showIcon && <div className="success-icon">{renderIcon()}</div>}
      <div className="success-content">
        {title && <div className="success-title">{title}</div>}
        <div className="success-message">{message}</div>
      </div>
      {dismissible && (
        <button
          className="success-close"
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
        <div className="success-progress-bar">
          <div
            className="success-progress-fill"
            style={{ animationDuration: `${autoDismissTime}ms` }}
          />
        </div>
      )}
    </div>
  );
};

export default SuccessAlert;
