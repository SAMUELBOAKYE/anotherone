// src/context/NotificationContext.jsx - Fully Updated with Debouncing
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import api from "../services/api";
import { useDebouncedCallback, useDebounce } from "../hooks/useDebounce";

// ======================================================
// CONSTANTS
// ======================================================
export const NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  EVENT: "event",
  NOTICE: "notice",
  SYSTEM: "system",
};

export const NOTIFICATION_PRIORITIES = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  URGENT: 3,
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 10000,
};

// ======================================================
// CONTEXT
// ======================================================
export const NotificationContext = createContext(null);
NotificationContext.displayName = "NotificationContext";

// ======================================================
// PROVIDER
// ======================================================
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    desktop: false,
    sound: true,
    eventReminders: true,
    noticeAlerts: true,
    systemUpdates: true,
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] =
    useState(false);
  const [retryCount, setRetryCount] = useState({});

  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const abortControllerRef = useRef(null);
  const { isAuthenticated, user } = useAuth();

  // ======================================================
  // HELPER FUNCTIONS
  // ======================================================

  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return "✅";
      case NOTIFICATION_TYPES.ERROR:
        return "❌";
      case NOTIFICATION_TYPES.WARNING:
        return "⚠️";
      case NOTIFICATION_TYPES.EVENT:
        return "📅";
      case NOTIFICATION_TYPES.NOTICE:
        return "📢";
      case NOTIFICATION_TYPES.SYSTEM:
        return "⚙️";
      default:
        return "🔔";
    }
  }, []);

  const withRetry = useCallback(async (fn, key, options = {}) => {
    const {
      maxRetries = RATE_LIMIT_CONFIG.MAX_RETRIES,
      baseDelay = RATE_LIMIT_CONFIG.BASE_DELAY,
    } = options;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const isRateLimit = err.response?.status === 429;
        const isServerError = err.response?.status >= 500;

        if ((isRateLimit || isServerError) && attempt < maxRetries) {
          const delay = Math.min(
            baseDelay * Math.pow(2, attempt),
            RATE_LIMIT_CONFIG.MAX_DELAY,
          );
          console.log(
            `[Notification] Retry ${attempt + 1}/${maxRetries} for ${key} after ${delay}ms`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
  }, []);

  // ======================================================
  // SOUND NOTIFICATIONS
  // ======================================================
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || !preferences.sound) return;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/notification-sound.mp3");
        audioRef.current.volume = 0.5;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn("Could not play notification sound:", err);
      });
    } catch (err) {
      console.warn("Audio not supported:", err);
    }
  }, [soundEnabled, preferences.sound]);

  // ======================================================
  // DESKTOP NOTIFICATIONS
  // ======================================================
  const requestDesktopPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      setDesktopNotificationsEnabled(true);
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      const granted = permission === "granted";
      setDesktopNotificationsEnabled(granted);
      return granted;
    }

    return false;
  }, []);

  const showDesktopNotification = useCallback(
    (title, body, icon) => {
      if (!desktopNotificationsEnabled || !preferences.desktop) return;

      try {
        const notification = new Notification(title, {
          body,
          icon: icon || "/logo192.png",
          silent: false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 5000);
      } catch (err) {
        console.warn("Failed to show desktop notification:", err);
      }
    },
    [desktopNotificationsEnabled, preferences.desktop],
  );

  // ======================================================
  // WEBSOCKET CONNECTION
  // ======================================================
  const connectWebSocket = useCallback(() => {
    if (!isAuthenticated || !user) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/notifications?userId=${user.id}`;

    try {
      if (socketRef.current) {
        socketRef.current.close();
      }

      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log("[Notification] WebSocket connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[Notification] Received:", data);

          const newNotification = {
            id: data.id || `ws_${Date.now()}`,
            type: data.type || NOTIFICATION_TYPES.INFO,
            title: data.title || "",
            message: data.message || "",
            read: false,
            createdAt: new Date().toISOString(),
            priority: data.priority || NOTIFICATION_PRIORITIES.MEDIUM,
            link: data.link || null,
            metadata: data.metadata || {},
          };

          setNotifications((prev) => [newNotification, ...prev].slice(0, 100));
          setUnreadCount((prev) => prev + 1);

          toast(newNotification.title || newNotification.message, {
            icon: getNotificationIcon(newNotification.type),
            duration: 5000,
          });

          playNotificationSound();
          showDesktopNotification(
            newNotification.title || "New Notification",
            newNotification.message,
            getNotificationIcon(newNotification.type),
          );
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("[Notification] WebSocket error:", error);
        setIsConnected(false);
      };

      socketRef.current.onclose = () => {
        console.log("[Notification] WebSocket disconnected");
        setIsConnected(false);

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000,
          );
          setTimeout(connectWebSocket, delay);
        }
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setIsConnected(false);
    }
  }, [
    isAuthenticated,
    user,
    playNotificationSound,
    showDesktopNotification,
    getNotificationIcon,
  ]);

  // ======================================================
  // API CALLS - WITH DEBOUNCING AND RETRY
  // ======================================================

  // Debounced fetch notifications - prevents 429 errors
  const debouncedFetchNotifications = useDebouncedCallback(
    async (params = {}) => {
      if (!isAuthenticated) {
        setNotifications([]);
        return [];
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setLoading(true);
        setError(null);

        const response = await withRetry(
          () =>
            api.get("/notifications", { params, signal: controller.signal }),
          "fetchNotifications",
        );

        if (controller.signal.aborted) return [];

        let notificationsList = [];
        if (
          response.data?.success &&
          Array.isArray(response.data.notifications)
        ) {
          notificationsList = response.data.notifications;
        } else if (Array.isArray(response.data)) {
          notificationsList = response.data;
        } else if (Array.isArray(response.data?.data)) {
          notificationsList = response.data.data;
        }

        notificationsList.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        setNotifications(notificationsList);
        const unread = notificationsList.filter((n) => !n.read).length;
        setUnreadCount(unread);
        return notificationsList;
      } catch (err) {
        if (err.name === "AbortError" || err.code === "ERR_CANCELED") {
          console.log("[Notification] Fetch aborted");
          return [];
        }
        console.error("Failed to fetch notifications:", err);
        if (err.response?.status !== 401) {
          setError(err.message || "Failed to load notifications");
        }
        return [];
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    1000, // 1 second debounce
    { trailing: true },
  );

  // Debounced fetch unread count
  const debouncedFetchUnreadCount = useDebouncedCallback(
    async () => {
      if (!isAuthenticated) return 0;
      try {
        const response = await withRetry(
          () => api.get("/notifications/unread-count"),
          "fetchUnreadCount",
        );
        const count =
          response.data?.count ??
          response.data?.unreadCount ??
          response.data ??
          0;
        setUnreadCount(count);
        return count;
      } catch (err) {
        console.warn("Could not fetch unread count:", err.message);
        return unreadCount;
      }
    },
    500,
    { trailing: true },
  );

  const fetchNotifications = useCallback(
    (params = {}) => debouncedFetchNotifications(params),
    [debouncedFetchNotifications],
  );

  const fetchUnreadCount = useCallback(
    () => debouncedFetchUnreadCount(),
    [debouncedFetchUnreadCount],
  );

  const markAsRead = useCallback(
    async (id) => {
      if (!isAuthenticated) return false;
      try {
        await withRetry(
          () => api.put(`/notifications/${id}/read`),
          `markAsRead_${id}`,
        );
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === id || n.id === id ? { ...n, read: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        return true;
      } catch (err) {
        console.error("Failed to mark as read:", err);
        throw err;
      }
    },
    [isAuthenticated, withRetry],
  );

  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return false;
    try {
      await withRetry(
        () => api.put("/notifications/read-all"),
        "markAllAsRead",
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
      return true;
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Failed to mark all as read");
      throw err;
    }
  }, [isAuthenticated, withRetry]);

  const deleteNotification = useCallback(
    async (id) => {
      if (!isAuthenticated) return false;
      try {
        await withRetry(
          () => api.delete(`/notifications/${id}`),
          `deleteNotification_${id}`,
        );
        const deleted = notifications.find((n) => n._id === id || n.id === id);
        setNotifications((prev) =>
          prev.filter((n) => n._id !== id && n.id !== id),
        );
        if (deleted && !deleted.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        toast.success("Notification deleted");
        return true;
      } catch (err) {
        console.error("Failed to delete notification:", err);
        toast.error("Failed to delete notification");
        throw err;
      }
    },
    [isAuthenticated, notifications, withRetry],
  );

  const deleteReadNotifications = useCallback(async () => {
    if (!isAuthenticated) return false;
    try {
      await withRetry(
        () => api.delete("/notifications/delete-read"),
        "deleteReadNotifications",
      );
      setNotifications((prev) => prev.filter((n) => !n.read));
      toast.success("Read notifications cleared");
      return true;
    } catch (err) {
      console.error("Failed to delete read notifications:", err);
      toast.error("Failed to clear notifications");
      throw err;
    }
  }, [isAuthenticated, withRetry]);

  // ======================================================
  // LOCAL NOTIFICATION
  // ======================================================

  const addLocalNotification = useCallback(
    (notif) => {
      const newNotif = {
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        type: notif.type || NOTIFICATION_TYPES.INFO,
        message: notif.message || "",
        title: notif.title || "",
        read: false,
        createdAt: new Date().toISOString(),
        isLocal: true,
        priority: notif.priority || NOTIFICATION_PRIORITIES.MEDIUM,
        link: notif.link || null,
        metadata: notif.metadata || {},
      };

      setNotifications((prev) => [newNotif, ...prev].slice(0, 100));
      setUnreadCount((prev) => prev + 1);

      const msg = newNotif.title || newNotif.message;
      const icon = getNotificationIcon(newNotif.type);

      switch (newNotif.type) {
        case NOTIFICATION_TYPES.SUCCESS:
          toast.success(msg);
          break;
        case NOTIFICATION_TYPES.ERROR:
          toast.error(msg);
          break;
        case NOTIFICATION_TYPES.WARNING:
          toast(msg, { icon });
          break;
        default:
          toast(msg, { icon });
      }

      playNotificationSound();
      showDesktopNotification(
        newNotif.title || "New Notification",
        newNotif.message,
        icon,
      );

      return newNotif.id;
    },
    [playNotificationSound, showDesktopNotification, getNotificationIcon],
  );

  // ======================================================
  // PREFERENCES
  // ======================================================

  const updatePreferences = useCallback(
    async (newPrefs) => {
      setPreferences((prev) => ({ ...prev, ...newPrefs }));
      localStorage.setItem(
        "notificationPreferences",
        JSON.stringify({
          ...preferences,
          ...newPrefs,
        }),
      );
      toast.success("Notification preferences updated");
      return newPrefs;
    },
    [preferences],
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
    toast.success(
      `Sound notifications ${!soundEnabled ? "enabled" : "disabled"}`,
    );
  }, [soundEnabled]);

  const toggleDesktopNotifications = useCallback(async () => {
    if (!desktopNotificationsEnabled) {
      const granted = await requestDesktopPermission();
      if (granted) {
        setDesktopNotificationsEnabled(true);
        toast.success("Desktop notifications enabled");
      } else {
        toast.error("Could not enable desktop notifications");
      }
    } else {
      setDesktopNotificationsEnabled(false);
      toast.info("Desktop notifications disabled");
    }
  }, [desktopNotificationsEnabled, requestDesktopPermission]);

  // ======================================================
  // UTILITY FUNCTIONS
  // ======================================================

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  const getUnreadNotifications = useCallback(
    () => notifications.filter((n) => !n.read),
    [notifications],
  );

  const getNotificationsByType = useCallback(
    (type) => notifications.filter((n) => n.type === type),
    [notifications],
  );

  const getHighPriorityNotifications = useCallback(
    () =>
      notifications.filter((n) => n.priority >= NOTIFICATION_PRIORITIES.HIGH),
    [notifications],
  );

  const groupNotificationsByDate = useCallback(() => {
    const groups = { today: [], yesterday: [], thisWeek: [], earlier: [] };
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach((notif) => {
      const date = new Date(notif.createdAt);
      date.setHours(0, 0, 0, 0);
      if (date.getTime() === today.getTime()) groups.today.push(notif);
      else if (date.getTime() === yesterday.getTime())
        groups.yesterday.push(notif);
      else if (date > weekAgo) groups.thisWeek.push(notif);
      else groups.earlier.push(notif);
    });

    return groups;
  }, [notifications]);

  // ======================================================
  // INITIALIZATION
  // ======================================================

  // Load preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem("notificationPreferences");
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (err) {
        console.error("Failed to parse saved preferences:", err);
      }
    }
    requestDesktopPermission();
  }, [requestDesktopPermission]);

  // Fetch notifications and connect WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refresh();
      connectWebSocket();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setIsConnected(false);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [isAuthenticated, refresh, connectWebSocket]);

  // Auto-refresh unread count every 60 seconds (reduced frequency to prevent 429)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000); // Changed from 30s to 60s

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  // ======================================================
  // CONTEXT VALUE
  // ======================================================

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      isConnected,
      preferences,
      soundEnabled,
      desktopNotificationsEnabled,
      stats: {
        total: notifications.length,
        unread: unreadCount,
        read: notifications.length - unreadCount,
        highPriority: getHighPriorityNotifications().length,
      },
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteReadNotifications,
      updatePreferences,
      addLocalNotification,
      refresh,
      getUnreadNotifications,
      getNotificationsByType,
      getHighPriorityNotifications,
      groupNotificationsByDate,
      toggleSound,
      toggleDesktopNotifications,
      hasUnread: unreadCount > 0,
      isSoundEnabled: soundEnabled,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      isConnected,
      preferences,
      soundEnabled,
      desktopNotificationsEnabled,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteReadNotifications,
      updatePreferences,
      addLocalNotification,
      refresh,
      getUnreadNotifications,
      getNotificationsByType,
      getHighPriorityNotifications,
      groupNotificationsByDate,
      toggleSound,
      toggleDesktopNotifications,
    ],
  );

  return React.createElement(NotificationContext.Provider, { value }, children);
};

// ======================================================
// HOOKS
// ======================================================

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used inside NotificationProvider");
  }
  return ctx;
};

export const useNotificationToast = () => {
  const { addLocalNotification } = useNotification();
  return {
    success: (message, title, options = {}) =>
      addLocalNotification({
        type: NOTIFICATION_TYPES.SUCCESS,
        message,
        title,
        ...options,
      }),
    error: (message, title, options = {}) =>
      addLocalNotification({
        type: NOTIFICATION_TYPES.ERROR,
        message,
        title,
        ...options,
      }),
    warning: (message, title, options = {}) =>
      addLocalNotification({
        type: NOTIFICATION_TYPES.WARNING,
        message,
        title,
        ...options,
      }),
    info: (message, title, options = {}) =>
      addLocalNotification({
        type: NOTIFICATION_TYPES.INFO,
        message,
        title,
        ...options,
      }),
    event: (message, title, options = {}) =>
      addLocalNotification({
        type: NOTIFICATION_TYPES.EVENT,
        message,
        title,
        ...options,
      }),
    notice: (message, title, options = {}) =>
      addLocalNotification({
        type: NOTIFICATION_TYPES.NOTICE,
        message,
        title,
        ...options,
      }),
  };
};

export default NotificationProvider;
