import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import PropTypes from "prop-types";
import { AnimatePresence } from "framer-motion";
import notificationService from "../../services/notificationService";
import LoadingSpinner from "../common/LoadingSpinner";
import "../../styles/components/NotificationPreferences.css";

// ============================================================================
// SVG Icons (Professional replacements for emojis)
// ============================================================================

const Icons = {
  // Delivery Methods
  email: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M22 6L12 13L2 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  push: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 11.3137 8.68629 14 12 14C15.3137 14 18 11.3137 18 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 14V22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 19H15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 2V4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  inApp: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="2"
        y="3"
        width="20"
        height="14"
        rx="2"
        ry="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M8 21H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 17V21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 7H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),

  // Notification Types
  notice: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 6v6l4 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  ),
  event: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        ry="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
      <circle cx="16" cy="15" r="1" fill="currentColor" />
      <circle cx="8" cy="15" r="1" fill="currentColor" />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 8v4M12 16h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  marketing: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 12C21 13.2 20.5 14.2 19.7 15.1C18.9 15.9 17.8 16.5 16.5 16.8C15.2 17.1 13.8 17.1 12.3 16.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M3 12V8C3 5.8 4.8 4 7 4H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M8 21L12 17L16 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 4V17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M17 9L21 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M17 5L21 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  security: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L3 7L3 12C3 16.97 7.03 21 12 22C16.97 21 21 16.97 21 12L21 7L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 8V12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  ),

  // Section Icons
  delivery: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22 12H18L15 21L9 3L6 12H2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  notification: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 11.3137 8.68629 14 12 14C15.3137 14 18 11.3137 18 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 14V22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 19H15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  quiet: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 6V12L16 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M22 2L18 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18 2L22 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  digest: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M8 12H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 8H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 16H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 6L9 17L4 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  ),
};

// ============================================================================
// Constants
// ============================================================================

const ANIMATION_VARIANTS = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const DELIVERY_METHODS = [
  {
    id: "emailNotifications",
    label: "Email Notifications",
    icon: Icons.email,
    description: "Receive notifications via email",
  },
  {
    id: "pushNotifications",
    label: "Push Notifications",
    icon: Icons.push,
    description: "Receive real-time push notifications",
  },
  {
    id: "inAppNotifications",
    label: "In-App Notifications",
    icon: Icons.inApp,
    description: "Show notifications within the app",
  },
];

const NOTIFICATION_TYPES = [
  {
    id: "noticeAlerts",
    label: "Notice Alerts",
    icon: Icons.notice,
    description: "Important announcements and updates",
  },
  {
    id: "eventAlerts",
    label: "Event Alerts",
    icon: Icons.event,
    description: "Upcoming events and reminders",
  },
  {
    id: "systemAlerts",
    label: "System Alerts",
    icon: Icons.system,
    description: "System maintenance and updates",
  },
  {
    id: "marketingAlerts",
    label: "Marketing Alerts",
    icon: Icons.marketing,
    description: "Promotions and special offers",
  },
  {
    id: "securityAlerts",
    label: "Security Alerts",
    icon: Icons.security,
    description: "Security-related notifications",
  },
];

// ============================================================================
// PropTypes
// ============================================================================

const propTypes = {
  onSave: PropTypes.func,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  showAdvanced: PropTypes.bool,
  className: PropTypes.string,
};

const defaultProps = {
  onSave: null,
  onChange: null,
  disabled: false,
  showAdvanced: false,
  className: "",
};

// ============================================================================
// Helper Components
// ============================================================================

const IconWrapper = memo(({ icon, className = "", size = 20 }) => (
  <span
    className={`icon-wrapper ${className}`}
    style={{ width: size, height: size }}
  >
    {React.cloneElement(icon, { width: size, height: size })}
  </span>
));

IconWrapper.displayName = "IconWrapper";
IconWrapper.propTypes = {
  icon: PropTypes.element.isRequired,
  className: PropTypes.string,
  size: PropTypes.number,
};

const PreferenceSection = memo(({ title, icon, children, description }) => (
  <motion.div
    className="preference-section"
    variants={ITEM_VARIANTS}
    initial="hidden"
    animate="visible"
  >
    <div className="section-header">
      {icon && <IconWrapper icon={icon} className="section-icon" size={24} />}
      <h3 className="section-title">{title}</h3>
    </div>
    {description && <p className="section-description">{description}</p>}
    <div className="preference-group">{children}</div>
  </motion.div>
));

PreferenceSection.displayName = "PreferenceSection";
PreferenceSection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.element,
  children: PropTypes.node.isRequired,
  description: PropTypes.string,
};

const PreferenceItem = memo(
  ({ id, label, description, icon, checked, onChange, disabled }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onChange(id);
      }
    };

    return (
      <motion.label
        className={`preference-item ${isHovered ? "hover" : ""}`}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        variants={ITEM_VARIANTS}
        whileTap={{ scale: 0.99 }}
      >
        <div className="preference-item-content">
          <div className="preference-item-left">
            {icon && (
              <IconWrapper icon={icon} className="preference-icon" size={20} />
            )}
            <div className="preference-item-text">
              <span className="preference-label">{label}</span>
              {description && (
                <span className="preference-description">{description}</span>
              )}
            </div>
          </div>
          <div className="preference-item-right">
            <button
              type="button"
              role="switch"
              aria-checked={checked}
              aria-label={`Toggle ${label}`}
              aria-describedby={description ? `${id}-description` : undefined}
              className={`toggle-switch ${checked ? "active" : ""}`}
              onClick={() => onChange(id)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              tabIndex={0}
            >
              <span className="toggle-slider" />
            </button>
          </div>
        </div>
        {description && (
          <div id={`${id}-description`} className="visually-hidden">
            {description}
          </div>
        )}
      </motion.label>
    );
  },
);

PreferenceItem.displayName = "PreferenceItem";
PreferenceItem.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.element,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const Toast = memo(({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return Icons.success;
      case "error":
        return Icons.error;
      default:
        return Icons.info;
    }
  };

  return (
    <motion.div
      className={`toast toast--${type}`}
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      role="alert"
      aria-live="polite"
    >
      <IconWrapper icon={getIcon()} className="toast-icon" size={20} />
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </motion.div>
  );
});

Toast.displayName = "Toast";
Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "info"]).isRequired,
  onClose: PropTypes.func.isRequired,
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * NotificationPreferences component – allows users to configure their notification preferences
 * with support for delivery methods, notification types, and advanced settings.
 */
const NotificationPreferences = memo(
  ({
    onSave,
    onChange,
    disabled: globallyDisabled,
    showAdvanced,
    className,
  }) => {
    // ===== State =====
    const [preferences, setPreferences] = useState({
      emailNotifications: true,
      pushNotifications: true,
      inAppNotifications: true,
      noticeAlerts: true,
      eventAlerts: true,
      systemAlerts: true,
      marketingAlerts: false,
      securityAlerts: true,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
      },
      digestFrequency: "realtime",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [initialPreferences, setInitialPreferences] = useState(null);

    // ===== Fetch Preferences =====
    const fetchPreferences = useCallback(async () => {
      setLoading(true);
      try {
        const data = await notificationService.getPreferences();
        setPreferences(data);
        setInitialPreferences(data);
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
        setToast({
          message: "Failed to load preferences. Please try again.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchPreferences();
    }, [fetchPreferences]);

    // ===== Check for Changes =====
    useEffect(() => {
      if (initialPreferences) {
        const hasUnsavedChanges =
          JSON.stringify(preferences) !== JSON.stringify(initialPreferences);
        setHasChanges(hasUnsavedChanges);
      }
    }, [preferences, initialPreferences]);

    // ===== Handlers =====
    const handlePreferenceChange = useCallback(
      (preferenceId) => {
        setPreferences((prev) => {
          const newPreferences = {
            ...prev,
            [preferenceId]: !prev[preferenceId],
          };

          if (onChange) {
            onChange(newPreferences);
          }

          return newPreferences;
        });
      },
      [onChange],
    );

    const handleQuietHoursChange = useCallback((field, value) => {
      setPreferences((prev) => ({
        ...prev,
        quietHours: {
          ...prev.quietHours,
          [field]: value,
        },
      }));
    }, []);

    const handleDigestFrequencyChange = useCallback((e) => {
      setPreferences((prev) => ({
        ...prev,
        digestFrequency: e.target.value,
      }));
    }, []);

    const handleSubmit = useCallback(
      async (e) => {
        e.preventDefault();
        if (saving || !hasChanges) return;

        setSaving(true);
        try {
          await notificationService.updatePreferences(preferences);
          setInitialPreferences(preferences);
          setHasChanges(false);
          setToast({
            message: "Preferences saved successfully!",
            type: "success",
          });

          if (onSave) {
            onSave(preferences);
          }
        } catch (error) {
          console.error("Failed to save preferences:", error);
          setToast({
            message:
              error.message || "Failed to save preferences. Please try again.",
            type: "error",
          });
        } finally {
          setSaving(false);
        }
      },
      [preferences, saving, hasChanges, onSave],
    );

    const handleReset = useCallback(() => {
      if (initialPreferences) {
        setPreferences(initialPreferences);
        setHasChanges(false);
        setToast({
          message: "Preferences reset to last saved state",
          type: "info",
        });
      }
    }, [initialPreferences]);

    const clearToast = useCallback(() => setToast(null), []);

    // ===== Memoized Values =====
    const isDisabled = useMemo(
      () => globallyDisabled || saving || loading,
      [globallyDisabled, saving, loading],
    );

    // ===== Loading State =====
    if (loading) {
      return (
        <div className="notification-preferences-loading">
          <LoadingSpinner size="large" />
          <p>Loading your preferences...</p>
        </div>
      );
    }

    // ===== Render =====
    return (
      <div className={`notification-preferences ${className}`}>
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={clearToast}
            />
          )}
        </AnimatePresence>

        <motion.div
          className="preferences-container"
          variants={ANIMATION_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="preferences-header">
            <h2 className="preferences-title">Notification Preferences</h2>
            <p className="preferences-description">
              Customize how and when you receive notifications
            </p>
          </div>

          <form onSubmit={handleSubmit} className="preferences-form">
            {/* Delivery Methods Section */}
            <PreferenceSection
              title="Delivery Methods"
              icon={Icons.delivery}
              description="Choose how you want to receive notifications"
            >
              {DELIVERY_METHODS.map((method) => (
                <PreferenceItem
                  key={method.id}
                  id={method.id}
                  label={method.label}
                  description={method.description}
                  icon={method.icon}
                  checked={preferences[method.id] || false}
                  onChange={handlePreferenceChange}
                  disabled={isDisabled}
                />
              ))}
            </PreferenceSection>

            {/* Notification Types Section */}
            <PreferenceSection
              title="Notification Types"
              icon={Icons.notification}
              description="Select which types of notifications you want to receive"
            >
              {NOTIFICATION_TYPES.map((type) => (
                <PreferenceItem
                  key={type.id}
                  id={type.id}
                  label={type.label}
                  description={type.description}
                  icon={type.icon}
                  checked={preferences[type.id] || false}
                  onChange={handlePreferenceChange}
                  disabled={isDisabled}
                />
              ))}
            </PreferenceSection>

            {/* Advanced Preferences (Conditional) */}
            {showAdvanced && (
              <>
                {/* Quiet Hours Section */}
                <PreferenceSection
                  title="Quiet Hours"
                  icon={Icons.quiet}
                  description="Schedule times when you don't want to be disturbed"
                >
                  <div className="quiet-hours-controls">
                    <label className="quiet-hours-toggle">
                      <input
                        type="checkbox"
                        checked={preferences.quietHours?.enabled || false}
                        onChange={(e) =>
                          handleQuietHoursChange("enabled", e.target.checked)
                        }
                        disabled={isDisabled}
                      />
                      <span>Enable Quiet Hours</span>
                    </label>

                    {preferences.quietHours?.enabled && (
                      <motion.div
                        className="quiet-hours-schedule"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="time-input-group">
                          <label>
                            <span>Start Time</span>
                            <input
                              type="time"
                              value={preferences.quietHours.start}
                              onChange={(e) =>
                                handleQuietHoursChange("start", e.target.value)
                              }
                              disabled={isDisabled}
                            />
                          </label>
                          <label>
                            <span>End Time</span>
                            <input
                              type="time"
                              value={preferences.quietHours.end}
                              onChange={(e) =>
                                handleQuietHoursChange("end", e.target.value)
                              }
                              disabled={isDisabled}
                            />
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </PreferenceSection>

                {/* Digest Settings Section */}
                <PreferenceSection
                  title="Digest Settings"
                  icon={Icons.digest}
                  description="Configure how often you receive notification digests"
                >
                  <div className="digest-settings">
                    <label className="digest-frequency">
                      <span>Email Digest Frequency</span>
                      <select
                        value={preferences.digestFrequency}
                        onChange={handleDigestFrequencyChange}
                        disabled={isDisabled}
                      >
                        <option value="realtime">Real-time</option>
                        <option value="hourly">Hourly Digest</option>
                        <option value="daily">Daily Digest</option>
                        <option value="weekly">Weekly Digest</option>
                      </select>
                    </label>
                  </div>
                </PreferenceSection>
              </>
            )}

            {/* Form Actions */}
            <motion.div
              className="form-actions"
              variants={ITEM_VARIANTS}
              initial="hidden"
              animate="visible"
            >
              <div className="action-buttons">
                <button
                  type="button"
                  className="btn-reset"
                  onClick={handleReset}
                  disabled={!hasChanges || isDisabled}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={!hasChanges || isDisabled}
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <IconWrapper icon={Icons.success} size={16} />
                      <span>Save Preferences</span>
                    </>
                  )}
                </button>
              </div>
              {hasChanges && (
                <p className="unsaved-changes" aria-live="polite">
                  You have unsaved changes
                </p>
              )}
            </motion.div>
          </form>
        </motion.div>
      </div>
    );
  },
);

// ============================================================================
// Display Name & PropTypes
// ============================================================================

NotificationPreferences.displayName = "NotificationPreferences";

NotificationPreferences.propTypes = propTypes;
NotificationPreferences.defaultProps = defaultProps;

export default NotificationPreferences;
