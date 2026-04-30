import React, { memo, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { formatDistanceToNow, format } from "date-fns";
import { motion } from "framer-motion";
import "../../styles/components/NotificationItem.css";

// ============================================================================
// SVG Icons (Professional replacements for emojis)
// ============================================================================

const ICONS = {
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
        strokeLinejoin="round"
      />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 6L9 17L4 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 9v4M12 17h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 3L1 21h22L12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  ),
};

// ============================================================================
// Animation Variants
// ============================================================================

const itemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
};

// ============================================================================
// PropTypes
// ============================================================================

const propTypes = {
  /** Notification object containing all details */
  notification: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["notice", "event", "system", "success", "warning", "error"]),
    read: PropTypes.bool,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    link: PropTypes.string,
    priority: PropTypes.oneOf(["low", "medium", "high"]),
    metadata: PropTypes.object,
  }).isRequired,
  /** Callback when notification is clicked */
  onClick: PropTypes.func,
  /** Whether the notification is currently being processed */
  isProcessing: PropTypes.bool,
  /** Disable click handler */
  disabled: PropTypes.bool,
  /** Show compact version (without message preview) */
  compact: PropTypes.bool,
  /** Enable hover animations */
  enableAnimations: PropTypes.bool,
};

const defaultProps = {
  onClick: null,
  isProcessing: false,
  disabled: false,
  compact: false,
  enableAnimations: true,
};

// ============================================================================
// Helper Components
// ============================================================================

const PriorityBadge = memo(({ priority }) => {
  if (!priority || priority === "low") return null;
  
  const priorityConfig = {
    medium: { class: "priority-medium", label: "Medium" },
    high: { class: "priority-high", label: "High" },
  };
  
  const config = priorityConfig[priority];
  if (!config) return null;
  
  return (
    <span className={`priority-badge ${config.class}`} aria-label={`Priority: ${config.label}`}>
      {config.label}
    </span>
  );
});

PriorityBadge.displayName = "PriorityBadge";
PriorityBadge.propTypes = { priority: PropTypes.string };

const TimeAgo = memo(({ date, tooltip = true }) => {
  const parsedDate = useMemo(() => new Date(date), [date]);
  const timeAgo = useMemo(
    () => formatDistanceToNow(parsedDate, { addSuffix: true }),
    [parsedDate]
  );
  const formattedDate = useMemo(
    () => format(parsedDate, "PPP 'at' p"),
    [parsedDate]
  );

  return (
    <time
      className="notification-time"
      dateTime={parsedDate.toISOString()}
      title={tooltip ? formattedDate : undefined}
      aria-label={`Sent ${timeAgo}`}
    >
      {timeAgo}
    </time>
  );
});

TimeAgo.displayName = "TimeAgo";
TimeAgo.propTypes = { date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]), tooltip: PropTypes.bool };

// ============================================================================
// Main Component
// ============================================================================

/**
 * NotificationItem component – displays a single notification with icon, content, and metadata.
 * Supports different types, priority levels, and accessibility features.
 */
const NotificationItem = memo(
  ({ 
    notification, 
    onClick, 
    isProcessing = false, 
    disabled = false,
    compact = false,
    enableAnimations = true,
  }) => {
    const { 
      _id, 
      title, 
      message, 
      type = "default", 
      read = false, 
      createdAt, 
      priority,
      metadata 
    } = notification;

    // ===== Memoized Values =====
    const icon = useMemo(() => ICONS[type] || ICONS.default, [type]);
    
    const containerClasses = useMemo(() => {
      const classes = ["notification-item"];
      if (!read) classes.push("unread");
      if (isProcessing) classes.push("processing");
      if (disabled) classes.push("disabled");
      if (compact) classes.push("compact");
      if (priority === "high") classes.push("high-priority");
      return classes.join(" ");
    }, [read, isProcessing, disabled, compact, priority]);

    const ariaLabel = useMemo(() => {
      let label = `${title}. ${message}`;
      if (!read) label += ". Unread";
      if (priority === "high") label += ". High priority";
      return label;
    }, [title, message, read, priority]);

    // ===== Handlers =====
    const handleClick = useCallback(() => {
      if (disabled || isProcessing) return;
      if (onClick) {
        onClick(notification);
      }
    }, [onClick, notification, disabled, isProcessing]);

    const handleKeyDown = useCallback(
      (event) => {
        if (disabled || isProcessing) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      },
      [handleClick, disabled, isProcessing]
    );

    // ===== Render Content =====
    const renderContent = () => (
      <>
        <div className="notification-icon-wrapper" aria-hidden="true">
          <div className={`notification-icon notification-icon--${type}`}>
            {icon}
          </div>
        </div>

        <div className="notification-content">
          <div className="notification-header">
            <div className="notification-title-wrapper">
              <h4 className="notification-title">{title}</h4>
              <PriorityBadge priority={priority} />
              {!read && <span className="unread-dot" aria-label="Unread" />}
            </div>
            <TimeAgo date={createdAt} />
          </div>

          {!compact && (
            <p className="notification-message">{message}</p>
          )}

          {metadata && !compact && (
            <div className="notification-metadata">
              {Object.entries(metadata).map(([key, value]) => (
                <span key={key} className="metadata-item">
                  <strong>{key}:</strong> {value}
                </span>
              ))}
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="processing-overlay" aria-label="Processing">
            <div className="spinner-small" />
          </div>
        )}
      </>
    );

    // ===== Render =====
    const Component = enableAnimations ? motion.div : "div";
    const animationProps = enableAnimations
      ? {
          variants: itemVariants,
          initial: "initial",
          animate: "animate",
          exit: "exit",
          whileHover: "hover",
          whileTap: "tap",
          layout: true,
        }
      : {};

    return (
      <Component
        className={containerClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        data-notification-id={_id}
        data-read={read}
        data-type={type}
        {...animationProps}
      >
        {renderContent()}
      </Component>
    );
  }
);

// ============================================================================
// Display Name & PropTypes
// ============================================================================

NotificationItem.displayName = "NotificationItem";

NotificationItem.propTypes = propTypes;
NotificationItem.defaultProps = defaultProps;

export default NotificationItem;