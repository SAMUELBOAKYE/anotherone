// src/hooks/useNotification.js
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import notificationService from "../services/notificationService";
import toast from "react-hot-toast";

// Destructure exports for easier use
const {
  getNotifications,
  getUnreadCount,
  getPreferences,
  subscribeToMessages,
  markAsRead: markNotificationAsRead,
  markAllAsRead: markAllNotificationsAsRead,
  updatePreferences: updateUserPreferences,
  deleteNotification: deleteNotificationById,
  connectSocket: connectSocketService,
  disconnectSocket: disconnectSocketService,
  getSocket,
  isAuthenticated,
  requestDesktopNotificationPermission,
} = notificationService;

export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState(null);

  const mountedRef = useRef(true);

  // ---------------------------
  // CONNECT SOCKET (exposed for App.jsx)
  // ---------------------------
  const connectSocket = useCallback(() => {
    if (!isAuthenticated()) {
      console.warn("Not authenticated, skipping socket connection");
      return null;
    }

    const socket = connectSocketService();
    const connected = socket?.connected || false;
    setIsConnected(connected);

    // Listen to connection events
    if (socket) {
      socket.on("connect", () => setIsConnected(true));
      socket.on("disconnect", () => setIsConnected(false));
    }

    return socket;
  }, []);

  // ---------------------------
  // INITIALIZE SOCKET (alias for connectSocket)
  // ---------------------------
  const initializeSocket = useCallback(() => {
    return connectSocket();
  }, [connectSocket]);

  // ---------------------------
  // REQUEST DESKTOP PERMISSION
  // ---------------------------
  const requestDesktopPermission = useCallback(async () => {
    try {
      const granted = await requestDesktopNotificationPermission();
      if (granted && preferences) {
        // Update preferences if needed
        await updateUserPreferences({
          ...preferences,
          desktopNotifications: true,
          permissionRequested: true,
        });
      }
      return granted;
    } catch (err) {
      console.error("Failed to request desktop permission:", err);
      return false;
    }
  }, [preferences]);

  // ---------------------------
  // INITIAL LOAD + SOCKET SETUP
  // ---------------------------
  useEffect(() => {
    mountedRef.current = true;

    if (!isAuthenticated()) {
      setLoading(false);
      return; // skip if no token
    }

    const loadInitialData = async () => {
      await Promise.all([
        loadNotifications(),
        loadUnreadCount(),
        loadPreferences(),
      ]);
    };

    loadInitialData();

    // Connect socket
    connectSocket();

    // Subscribe to incoming messages
    const unsubscribeMessages = subscribeToMessages((notification) => {
      if (mountedRef.current) handleNewNotification(notification);
    });

    return () => {
      mountedRef.current = false;
      if (unsubscribeMessages && typeof unsubscribeMessages === "function") {
        unsubscribeMessages();
      }
      disconnectSocketService();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------
  // DATA LOADERS
  // ---------------------------
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      if (mountedRef.current) {
        setNotifications(Array.isArray(data) ? data : []);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      if (mountedRef.current) setUnreadCount(count);
    } catch (err) {
      console.error("Failed to load unread count:", err);
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await getPreferences();
      if (mountedRef.current) setPreferences(prefs);
    } catch (err) {
      console.error("Failed to load preferences:", err);
    }
  }, []);

  // ---------------------------
  // HANDLE NEW NOTIFICATION
  // ---------------------------
  const handleNewNotification = useCallback((notification) => {
    if (!mountedRef.current) return;

    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Show toast
    toast.success(notification.title || "New notification", {
      duration: 5000,
      position: "top-right",
      icon:
        notification.type === "success"
          ? "✅"
          : notification.type === "warning"
            ? "⚠️"
            : notification.type === "error"
              ? "❌"
              : "🔔",
    });
  }, []);

  // ---------------------------
  // ACTIONS
  // ---------------------------
  const markAsRead = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
      if (mountedRef.current) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
      toast.error("Failed to mark notification as read");
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      if (mountedRef.current) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Failed to mark all as read");
    }
  }, []);

  const deleteNotification = useCallback(
    async (id) => {
      try {
        await deleteNotificationById(id);
        if (mountedRef.current) {
          const deleted = notifications.find((n) => n.id === id);
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          if (deleted && !deleted.read)
            setUnreadCount((prev) => Math.max(prev - 1, 0));
        }
        toast.success("Notification deleted");
      } catch (err) {
        console.error("Failed to delete notification:", err);
        toast.error("Failed to delete notification");
      }
    },
    [notifications],
  );

  const updatePreferences = useCallback(async (newPrefs) => {
    try {
      const result = await updateUserPreferences(newPrefs);
      if (mountedRef.current) setPreferences(result);
      toast.success("Preferences updated");
      return result;
    } catch (err) {
      console.error("Failed to update preferences:", err);
      toast.error("Failed to update preferences");
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadNotifications(),
      loadUnreadCount(),
      loadPreferences(),
    ]);
  }, [loadNotifications, loadUnreadCount, loadPreferences]);

  // ---------------------------
  // UTILITIES
  // ---------------------------
  const getUnreadNotifications = useCallback(
    () => notifications.filter((n) => !n.read),
    [notifications],
  );

  const getNotificationsByType = useCallback(
    (type) => notifications.filter((n) => n.type === type),
    [notifications],
  );

  const groupNotificationsByDate = useCallback(() => {
    const grouped = {};
    notifications.forEach((n) => {
      const date = new Date(n.createdAt).toDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(n);
    });
    return grouped;
  }, [notifications]);

  // ---------------------------
  // STATS
  // ---------------------------
  const stats = useMemo(
    () => ({
      total: notifications.length,
      unread: unreadCount,
      read: notifications.length - unreadCount,
      byType: {
        event: getNotificationsByType("event").length,
        announcement: getNotificationsByType("announcement").length,
        reminder: getNotificationsByType("reminder").length,
        system: getNotificationsByType("system").length,
        message: getNotificationsByType("message").length,
      },
    }),
    [notifications, unreadCount, getNotificationsByType],
  );

  // ---------------------------
  // RETURN (with all required functions)
  // ---------------------------
  return {
    // State
    notifications,
    unreadCount,
    isConnected,
    loading,
    error,
    preferences,
    stats,

    // Socket functions (for App.jsx)
    connectSocket,
    initializeSocket,
    disconnectSocket: disconnectSocketService,
    getSocket,
    isSocketConnected: isConnected,

    // Permission functions
    requestDesktopPermission,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    refresh,

    // Utilities
    getUnreadNotifications,
    getNotificationsByType,
    groupNotificationsByDate,
  };
};
