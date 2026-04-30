// src/components/notification/NotificationList.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  useRef,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "../../context/NotificationContext";
import NotificationItem from "./NotificationItem";
import LoadingSpinner from "../common/LoadingSpinner";
import "../../styles/components/NotificationList.css";

// ============================================================================
// Constants
// ============================================================================

const ANIMATION_VARIANTS = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const ITEM_ANIMATION = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const DEFAULT_LIMIT = 50;
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds

// ============================================================================
// PropTypes
// ============================================================================

const propTypes = {
  limit: PropTypes.number,
  onNotificationClick: PropTypes.func,
  enableRealtime: PropTypes.bool,
  refreshInterval: PropTypes.number,
  emptyMessage: PropTypes.string,
  errorMessagePrefix: PropTypes.string,
  showHeader: PropTypes.bool,
  showFooter: PropTypes.bool,
  className: PropTypes.string,
};

const defaultProps = {
  limit: DEFAULT_LIMIT,
  onNotificationClick: null,
  enableRealtime: true,
  refreshInterval: DEFAULT_REFRESH_INTERVAL,
  emptyMessage: "No notifications yet",
  errorMessagePrefix: "Failed to load notifications",
  showHeader: true,
  showFooter: true,
  className: "",
};

// ============================================================================
// Helper Components
// ============================================================================

const EmptyState = memo(({ message }) => (
  <motion.div
    className="empty-notifications"
    variants={ANIMATION_VARIANTS}
    initial="initial"
    animate="animate"
    exit="exit"
    aria-live="polite"
    role="status"
  >
    <svg
      className="empty-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
    <p>{message}</p>
  </motion.div>
));

EmptyState.displayName = "EmptyState";
EmptyState.propTypes = { message: PropTypes.string };

const ErrorState = memo(({ message, onRetry, isRetrying }) => (
  <motion.div
    className="notification-list-error"
    variants={ANIMATION_VARIANTS}
    initial="initial"
    animate="animate"
    exit="exit"
    role="alert"
    aria-live="assertive"
  >
    <svg
      className="error-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <p>{message}</p>
    <button
      type="button"
      className="notification-list-retry"
      onClick={onRetry}
      disabled={isRetrying}
      aria-label="Retry loading notifications"
    >
      {isRetrying ? (
        <>
          <span className="spinner-small" aria-hidden="true" />
          Retrying...
        </>
      ) : (
        "Retry"
      )}
    </button>
  </motion.div>
));

ErrorState.displayName = "ErrorState";
ErrorState.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func,
  isRetrying: PropTypes.bool,
};

const LoadingState = memo(() => (
  <motion.div
    className="notification-list-loading"
    variants={ANIMATION_VARIANTS}
    initial="initial"
    animate="animate"
    exit="exit"
    aria-live="polite"
  >
    <LoadingSpinner size="medium" />
    <span className="visually-hidden">Loading notifications...</span>
  </motion.div>
));

LoadingState.displayName = "LoadingState";

// ============================================================================
// Main Component
// ============================================================================

const NotificationList = memo(
  ({
    limit = DEFAULT_LIMIT,
    onNotificationClick: externalOnClick,
    enableRealtime = true,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    emptyMessage = "No notifications yet",
    errorMessagePrefix = "Failed to load notifications",
    showHeader = true,
    showFooter = true,
    className = "",
  }) => {
    // ===== State =====
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [markingAll, setMarkingAll] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [processingIds, setProcessingIds] = useState(new Set());

    // ===== Refs =====
    const refreshTimerRef = useRef(null);
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(null);

    // ===== Hooks =====
    const {
      notifications: hookNotifications,
      loading: hookLoading,
      error: hookError,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refresh,
      isConnected,
    } = useNotification();

    const navigate = useNavigate();

    // ===== Load Notifications =====
    const loadNotifications = useCallback(async () => {
      if (!fetchNotifications) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const data = await fetchNotifications(limit, {
          signal: abortControllerRef.current.signal,
        });

        if (isMountedRef.current && data) {
          setNotifications(
            Array.isArray(data) ? data : data.notifications || [],
          );
        }
      } catch (err) {
        if (err.name === "AbortError") return;

        if (isMountedRef.current) {
          console.error("Failed to load notifications:", err);
          setError(err.message || `${errorMessagePrefix}. Please try again.`);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
        abortControllerRef.current = null;
      }
    }, [fetchNotifications, limit, errorMessagePrefix]);

    // ===== Initial Load =====
    useEffect(() => {
      loadNotifications();

      if (enableRealtime && refreshInterval > 0) {
        refreshTimerRef.current = setInterval(() => {
          loadNotifications();
        }, refreshInterval);

        return () => {
          if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
          }
        };
      }
    }, [loadNotifications, enableRealtime, refreshInterval]);

    // ===== Sync with hook notifications =====
    useEffect(() => {
      if (hookNotifications && !loading && !hookLoading) {
        setNotifications(hookNotifications);
      }
    }, [hookNotifications, hookLoading, loading]);

    // ===== Handle Single Notification Click =====
    const handleNotificationClick = useCallback(
      async (notification) => {
        if (processingIds.has(notification._id || notification.id)) return;

        const shouldMarkAsRead = !notification.read;

        if (shouldMarkAsRead && markAsRead) {
          setProcessingIds((prev) =>
            new Set(prev).add(notification._id || notification.id),
          );

          try {
            await markAsRead(notification._id || notification.id);

            if (isMountedRef.current) {
              setNotifications((prev) =>
                prev.map((n) =>
                  (n._id || n.id) === (notification._id || notification.id)
                    ? { ...n, read: true }
                    : n,
                ),
              );
            }
          } catch (err) {
            console.error("Failed to mark notification as read:", err);
          } finally {
            if (isMountedRef.current) {
              setProcessingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(notification._id || notification.id);
                return newSet;
              });
            }
          }
        }

        if (externalOnClick) {
          externalOnClick(notification);
        }

        if (notification.link) {
          navigate(notification.link);
        }
      },
      [markAsRead, navigate, externalOnClick, processingIds],
    );

    // ===== Handle Mark All as Read =====
    const handleMarkAllRead = useCallback(async () => {
      const unreadCount = notifications.filter((n) => !n.read).length;
      if (markingAll || unreadCount === 0 || !markAllAsRead) return;

      setMarkingAll(true);
      try {
        await markAllAsRead();

        if (isMountedRef.current) {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }
      } catch (err) {
        console.error("Failed to mark all as read:", err);
        setError("Failed to mark all as read. Please try again.");
        setTimeout(() => {
          if (isMountedRef.current) setError(null);
        }, 3000);
      } finally {
        if (isMountedRef.current) setMarkingAll(false);
      }
    }, [markAllAsRead, notifications, markingAll]);

    // ===== Handle Retry =====
    const handleRetry = useCallback(async () => {
      setRetrying(true);
      if (refresh) {
        await refresh();
      }
      await loadNotifications();
      setRetrying(false);
    }, [refresh, loadNotifications]);

    // ===== Computed Values =====
    const unreadCount = useMemo(
      () => notifications.filter((n) => !n.read).length,
      [notifications],
    );

    const hasUnread = unreadCount > 0;

    // ===== Cleanup =====
    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, []);

    // ===== Render =====
    return (
      <div className={`notification-list-wrapper ${className}`}>
        {showHeader && (
          <div className="notification-list-header">
            <div className="header-info">
              <h3 className="header-title">Notifications</h3>
              {notifications.length > 0 && (
                <span
                  className="notification-count"
                  aria-label={`${notifications.length} total notifications`}
                >
                  {notifications.length}
                </span>
              )}
              {hasUnread && (
                <span
                  className="unread-badge"
                  aria-label={`${unreadCount} unread`}
                >
                  {unreadCount} new
                </span>
              )}
              {isConnected && <span className="connection-badge online" />}
            </div>

            <div className="header-actions">
              {hasUnread && (
                <button
                  type="button"
                  className="mark-all-read-btn"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  aria-label="Mark all notifications as read"
                >
                  {markingAll ? (
                    <>
                      <span className="spinner-small" aria-hidden="true" />
                      Marking...
                    </>
                  ) : (
                    "Mark all as read"
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="notification-list-content">
          <AnimatePresence mode="wait">
            {loading ? (
              <LoadingState key="loading" />
            ) : error ? (
              <ErrorState
                key="error"
                message={error}
                onRetry={handleRetry}
                isRetrying={retrying}
              />
            ) : notifications.length === 0 ? (
              <EmptyState key="empty" message={emptyMessage} />
            ) : (
              <motion.div
                key="list"
                className="notifications-container"
                role="list"
                aria-label="Notifications list"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 },
                  },
                }}
              >
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification._id || notification.id || index}
                    variants={ITEM_ANIMATION}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <NotificationItem
                      notification={notification}
                      onClick={handleNotificationClick}
                      isProcessing={processingIds.has(
                        notification._id || notification.id,
                      )}
                      onDelete={deleteNotification}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {showFooter && !loading && !error && notifications.length > 0 && (
          <div className="notification-list-footer">
            <button
              type="button"
              className="view-all-btn"
              onClick={() => navigate("/notifications")}
              aria-label="View all notifications"
            >
              View all notifications
              <svg
                className="arrow-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  },
);

NotificationList.displayName = "NotificationList";
NotificationList.propTypes = propTypes;
NotificationList.defaultProps = defaultProps;

export default NotificationList;
