// src/components/notification/NotificationBell.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  useMemo,
} from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // ✅ fixed missing import
import PropTypes from "prop-types";
import { useNotification } from "../../hooks/useNotification";
import NotificationList from "./NotificationList";
import "../../styles/components/NotificationBell.css";

// ============================================================================
// Animation Variants
// ============================================================================
const dropdownVariants = {
  initial: { opacity: 0, y: -12, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.96 },
};

const badgeVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
};

// ============================================================================
// Helper: Portal
// ============================================================================
const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted) return null;
  return ReactDOM.createPortal(children, document.body);
};

Portal.propTypes = {
  children: PropTypes.node.isRequired,
};

// ============================================================================
// Main Component
// ============================================================================
const NotificationBell = memo(
  ({
    maxItems = 5,
    position = "right",
    onNotificationClick,
    onOpen,
    onClose,
    className = "",
    disabled = false,
    autoCloseOnClick = true,
    showMarkAllAsRead = true,
    usePortal = false,
  }) => {
    // ===== State =====
    const [isOpen, setIsOpen] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    // ===== Refs =====
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const previousUnreadCount = useRef(0);
    const previouslyFocusedElement = useRef(null);

    // ===== Hooks =====
    const notificationContext = useNotification();
    const navigate = useNavigate();

    const unreadCount = notificationContext?.unreadCount ?? 0;
    const markAllAsRead =
      notificationContext?.markAllAsRead ?? (async () => {});
    const loading = notificationContext?.loading ?? false;

    // ===== Memoized Helpers =====
    const getBadgeContent = useCallback((count) => {
      if (count <= 0) return "";
      return count > 99 ? "99+" : count.toString();
    }, []);

    const getAriaLabel = useCallback(() => {
      if (unreadCount === 0) return "Notifications, no unread messages";
      return `Notifications, ${unreadCount} unread ${
        unreadCount === 1 ? "message" : "messages"
      }`;
    }, [unreadCount]);

    // =========================================================================
    // Dropdown Controls
    // =========================================================================
    const closeDropdown = useCallback(() => {
      setIsOpen(false);
      onClose?.();
    }, [onClose]);

    const openDropdown = useCallback(() => {
      if (!disabled) {
        setIsOpen(true);
        onOpen?.();
      }
    }, [onOpen, disabled]);

    const toggleDropdown = useCallback(() => {
      if (disabled) return;
      if (isOpen) closeDropdown();
      else openDropdown();
    }, [isOpen, closeDropdown, openDropdown, disabled]);

    // =========================================================================
    // Effects
    // =========================================================================

    // Track unread count changes
    useEffect(() => {
      const isNotificationSupported =
        typeof window !== "undefined" && "Notification" in window;

      if (
        unreadCount > previousUnreadCount.current &&
        unreadCount > 0 &&
        isNotificationSupported &&
        !document.hidden &&
        Notification.permission === "granted"
      ) {
        // Optional: show browser notification
        // new Notification("New notification", { body: "You have unread messages" });
      }
      previousUnreadCount.current = unreadCount;
    }, [unreadCount]);

    // Restore focus on close
    useEffect(() => {
      if (!isOpen && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
        previouslyFocusedElement.current = null;
      }
    }, [isOpen]);

    // Focus trap
    useEffect(() => {
      if (!isOpen || !dropdownRef.current) return;

      const focusableSelectors =
        "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1']):not([disabled])";

      const focusableElements = Array.from(
        dropdownRef.current.querySelectorAll(focusableSelectors),
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (document.activeElement instanceof HTMLElement) {
        previouslyFocusedElement.current = document.activeElement;
      }

      const handleTabKey = (e) => {
        if (e.key !== "Tab") return;
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      firstElement.focus();
      document.addEventListener("keydown", handleTabKey);

      return () => {
        document.removeEventListener("keydown", handleTabKey);
      };
    }, [isOpen]);

    // ESC key
    useEffect(() => {
      const handleEsc = (e) => {
        if (e.key === "Escape" && isOpen) {
          e.preventDefault();
          closeDropdown();
        }
      };
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen, closeDropdown]);

    // Click outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        const target = event.target;
        const isClickOutsideDropdown =
          dropdownRef.current && !dropdownRef.current.contains(target);
        const isClickOutsideButton =
          buttonRef.current && !buttonRef.current.contains(target);

        if (isClickOutsideDropdown && isClickOutsideButton) closeDropdown();
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
          document.removeEventListener("touchstart", handleClickOutside);
        };
      }
    }, [isOpen, closeDropdown]);

    // ===== Event Handlers =====
    const handleViewAll = useCallback(() => {
      closeDropdown();
      navigate("/notifications");
    }, [closeDropdown, navigate]);

    const handleMarkAllAsRead = useCallback(async () => {
      if (isMarkingAll || loading || unreadCount === 0) return;
      setIsMarkingAll(true);
      try {
        await markAllAsRead();
      } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
      } finally {
        setIsMarkingAll(false);
      }
    }, [markAllAsRead, isMarkingAll, loading, unreadCount]);

    const handleNotificationClickInternal = useCallback(
      (notificationId) => {
        if (autoCloseOnClick) closeDropdown();
        onNotificationClick?.(notificationId);
      },
      [closeDropdown, onNotificationClick, autoCloseOnClick],
    );

    // ===== Render Helpers =====
    const badgeContent = useMemo(
      () => getBadgeContent(unreadCount),
      [unreadCount, getBadgeContent],
    );

    const dropdownContent = (
      <motion.div
        ref={dropdownRef}
        className={`notification-dropdown notification-dropdown--${position}`}
        variants={dropdownVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: 0.2,
          ease: [0.23, 1, 0.32, 1],
          opacity: { duration: 0.15 },
        }}
        role="dialog"
        aria-label="Notifications panel"
        aria-modal="false"
      >
        {/* Header */}
        <div className="dropdown-header">
          <h3 className="dropdown-title">
            Notifications
            {unreadCount > 0 && (
              <span
                className="dropdown-title-badge"
                aria-label={`${unreadCount} new`}
              >
                {unreadCount}
              </span>
            )}
          </h3>
          <div className="dropdown-actions">
            {showMarkAllAsRead && unreadCount > 0 && (
              <button
                type="button"
                className="dropdown-action-btn"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll || loading}
                aria-label="Mark all notifications as read"
              >
                {isMarkingAll ? "Marking..." : "Mark all as read"}
              </button>
            )}
            <button
              type="button"
              className="dropdown-view-all-btn"
              onClick={handleViewAll}
              aria-label="View all notifications"
            >
              View All
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="dropdown-body">
          <NotificationList
            limit={maxItems}
            onNotificationClick={handleNotificationClickInternal}
          />
        </div>

        {/* Footer */}
        <div className="dropdown-footer">
          <button
            type="button"
            className="dropdown-footer-btn"
            onClick={handleViewAll}
            aria-label="See all notifications"
          >
            <span>See all notifications</span>
            <svg
              className="dropdown-footer-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </motion.div>
    );

    // =========================================================================
    // JSX
    // =========================================================================
    return (
      <div className={`notification-bell-container ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          className={`bell-button ${
            isOpen ? "bell-button--active" : ""
          } ${disabled ? "bell-button--disabled" : ""}`}
          onClick={toggleDropdown}
          aria-label={getAriaLabel()}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-disabled={disabled}
          disabled={disabled}
        >
          {/* Bell Icon */}
          <svg
            className="bell-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <motion.span
              className="notification-badge"
              variants={badgeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 15,
                mass: 0.5,
              }}
              aria-label={`${unreadCount} unread notifications`}
            >
              {badgeContent}
            </motion.span>
          )}
        </button>

        {/* Dropdown with optional Portal */}
        <AnimatePresence mode="wait">
          {isOpen &&
            (usePortal ? <Portal>{dropdownContent}</Portal> : dropdownContent)}
        </AnimatePresence>
      </div>
    );
  },
);

NotificationBell.displayName = "NotificationBell";

// ============================================================================
// PropTypes
// ============================================================================
NotificationBell.propTypes = {
  maxItems: PropTypes.number,
  position: PropTypes.oneOf(["left", "right"]),
  onNotificationClick: PropTypes.func,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  autoCloseOnClick: PropTypes.bool,
  showMarkAllAsRead: PropTypes.bool,
  usePortal: PropTypes.bool,
};

export default NotificationBell;
