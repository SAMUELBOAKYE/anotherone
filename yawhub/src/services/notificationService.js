// src/services/notificationService.js

/**
 * Notification Service Module
 * Enterprise-grade notification management with real-time socket updates,
 * comprehensive error handling, offline support, and push notifications.
 *
 * @version 3.0.0
 * @author BOAKYE SAMUEL YIADOM
 */

import axios from "axios";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || "/api";
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Feature flags
const ENABLE_LOGGING =
  import.meta.env.VITE_ENABLE_LOGGING === "true" || import.meta.env.DEV;
const ENABLE_DESKTOP_NOTIFICATIONS =
  import.meta.env.VITE_ENABLE_DESKTOP_NOTIFICATIONS === "true";
const ENABLE_SOUND_NOTIFICATIONS =
  import.meta.env.VITE_ENABLE_SOUND_NOTIFICATIONS === "true";

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user_data",
  NOTIFICATION_PREFERENCES: "notification_preferences",
  LAST_NOTIFICATION_CHECK: "last_notification_check",
  REMEMBER_ME: "remember_me",
};

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Get authentication token from storage
 * @returns {string|null} Access token
 */
export const getToken = () => {
  if (typeof localStorage === "undefined") return null;

  return (
    localStorage.getItem(STORAGE_KEYS.TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.TOKEN) ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    null
  );
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  // Check token expiry if it's a JWT
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return false;
      }
    }
  } catch (e) {
    // If parsing fails, assume token is valid
  }

  return true;
};

/**
 * Clear authentication data
 */
export const clearAuthData = () => {
  if (typeof localStorage === "undefined") return;

  const keys = [STORAGE_KEYS.TOKEN, "token", "accessToken", "authToken"];
  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  // Dispatch event for other parts of the app
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }
};

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (ENABLE_LOGGING) {
      console.log(
        `[Notification API] ${config.method.toUpperCase()} ${config.url}`,
      );
    }

    return config;
  },
  (error) => {
    console.error("[Notification API] Request error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (originalRequest) {
        originalRequest._retry = true;
      }

      // Check if we have a refresh token
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (refreshToken) {
        try {
          // Attempt to refresh token
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });

          if (response.data?.token) {
            const rememberMe =
              localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === "true";
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem(STORAGE_KEYS.TOKEN, response.data.token);

            // Retry original request
            if (originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
              return api(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error(
            "[Notification API] Token refresh failed:",
            refreshError,
          );
          clearAuthData();
        }
      } else {
        // No refresh token, just clear auth
        clearAuthData();
      }
    }

    // Don't throw for 401/403 on notification endpoints - just return empty data
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (ENABLE_LOGGING) {
        console.log("[Notification API] Auth error, returning empty data");
      }
      return Promise.resolve({ data: [] });
    }

    return Promise.reject(error);
  },
);

// ============================================================================
// RETRY UTILITY
// ============================================================================

/**
 * Retry a failed request with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise} Result of function
 */
const withRetry = async (fn, maxRetries = MAX_RETRIES) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on auth errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }

      if (i < maxRetries - 1) {
        const delay = RETRY_DELAY * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// ============================================================================
// NOTIFICATION API CALLS
// ============================================================================

/**
 * Get all notifications for current user
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {boolean} options.unreadOnly - Only unread notifications
 * @returns {Promise<Array>} Array of notifications
 */
export const getNotifications = async (options = {}) => {
  const { page = 1, limit = 50, unreadOnly = false } = options;

  // Check authentication before making request
  if (!isAuthenticated()) {
    if (ENABLE_LOGGING) {
      console.warn("[NotificationService] Not authenticated, skipping fetch");
    }
    return [];
  }

  try {
    const response = await withRetry(async () => {
      return await api.get("/notifications", {
        params: { page, limit, unreadOnly },
      });
    });

    // Handle different response structures
    let notifications = [];

    if (response.data?.success) {
      notifications = Array.isArray(response.data.notifications)
        ? response.data.notifications
        : [];
    } else if (Array.isArray(response.data)) {
      notifications = response.data;
    } else if (Array.isArray(response.data?.data)) {
      notifications = response.data.data;
    } else if (Array.isArray(response.data?.notifications)) {
      notifications = response.data.notifications;
    }

    // Ensure each notification has an id property
    notifications = notifications.map((notif) => ({
      ...notif,
      id: notif._id || notif.id,
    }));

    if (ENABLE_LOGGING) {
      console.log(
        `[NotificationService] Fetched ${notifications.length} notifications`,
      );
    }

    return notifications;
  } catch (error) {
    console.error(
      "[NotificationService] Failed to fetch notifications:",
      error.message,
    );
    return [];
  }
};

/**
 * Get unread notification count
 * @returns {Promise<number>} Number of unread notifications
 */
export const getUnreadCount = async () => {
  if (!isAuthenticated()) return 0;

  try {
    const response = await withRetry(async () => {
      return await api.get("/notifications/unread-count");
    });

    // Handle different response structures
    if (response.data?.success) {
      return response.data.count || 0;
    }
    return response.data?.count || response.data || 0;
  } catch (error) {
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      console.error(
        "[NotificationService] Failed to get unread count:",
        error.message,
      );
    }
    return 0;
  }
};

/**
 * Get notification preferences
 * @returns {Promise<Object>} User preferences
 */
export const getPreferences = async () => {
  const defaultPreferences = {
    email: true,
    push: true,
    desktop: false,
    sound: true,
    desktopNotifications: false,
    permissionRequested: false,
    types: {
      notice: true,
      announcement: true,
      event: true,
      system: true,
    },
  };

  if (!isAuthenticated()) {
    return defaultPreferences;
  }

  try {
    const response = await withRetry(async () => {
      return await api.get("/notifications/preferences");
    });

    const preferences = response.data?.success
      ? response.data.preferences
      : response.data || {};
    return { ...defaultPreferences, ...preferences };
  } catch (error) {
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      console.error(
        "[NotificationService] Failed to get preferences:",
        error.message,
      );
    }

    // Try to load from cache
    const cached = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Ignore parse errors
      }
    }

    return defaultPreferences;
  }
};

/**
 * Update notification preferences
 * @param {Object} preferences - New preferences
 * @returns {Promise<Object>} Updated preferences
 */
export const updatePreferences = async (preferences) => {
  if (!isAuthenticated()) {
    throw new Error("Not authenticated");
  }

  try {
    const response = await withRetry(async () => {
      return await api.put("/notifications/preferences", preferences);
    });

    const updated = response.data?.success
      ? response.data.preferences
      : response.data || preferences;

    // Cache preferences
    localStorage.setItem(
      STORAGE_KEYS.NOTIFICATION_PREFERENCES,
      JSON.stringify(updated),
    );

    // Apply desktop notification setting
    if (ENABLE_DESKTOP_NOTIFICATIONS && updated.desktop) {
      requestDesktopNotificationPermission();
    }

    if (ENABLE_LOGGING) {
      console.log("[NotificationService] Preferences updated");
    }

    return updated;
  } catch (error) {
    console.error(
      "[NotificationService] Failed to update preferences:",
      error.message,
    );
    throw error;
  }
};

/**
 * Mark a single notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Response data
 */
export const markAsRead = async (notificationId) => {
  if (!isAuthenticated() || !notificationId) {
    return null;
  }

  try {
    const response = await withRetry(async () => {
      return await api.put(`/notifications/${notificationId}/read`);
    });

    if (ENABLE_LOGGING) {
      console.log(`[NotificationService] Marked ${notificationId} as read`);
    }

    return response.data;
  } catch (error) {
    console.error(
      "[NotificationService] Failed to mark as read:",
      error.message,
    );
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Response data
 */
export const markAllAsRead = async () => {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    const response = await withRetry(async () => {
      return await api.put("/notifications/read-all");
    });

    if (ENABLE_LOGGING) {
      console.log("[NotificationService] Marked all as read");
    }

    return response.data;
  } catch (error) {
    console.error(
      "[NotificationService] Failed to mark all as read:",
      error.message,
    );
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Response data
 */
export const deleteNotification = async (notificationId) => {
  if (!isAuthenticated() || !notificationId) {
    return null;
  }

  try {
    const response = await withRetry(async () => {
      return await api.delete(`/notifications/${notificationId}`);
    });

    if (ENABLE_LOGGING) {
      console.log(`[NotificationService] Deleted ${notificationId}`);
    }

    return response.data;
  } catch (error) {
    console.error(
      "[NotificationService] Failed to delete notification:",
      error.message,
    );
    throw error;
  }
};

/**
 * Delete read notifications
 * @returns {Promise<Object>} Response data
 */
export const deleteReadNotifications = async () => {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    const response = await withRetry(async () => {
      return await api.delete("/notifications/delete-read");
    });

    if (ENABLE_LOGGING) {
      console.log("[NotificationService] Deleted read notifications");
    }

    return response.data;
  } catch (error) {
    console.error(
      "[NotificationService] Failed to delete read notifications:",
      error.message,
    );
    throw error;
  }
};

// ============================================================================
// DESKTOP NOTIFICATIONS
// ============================================================================

let desktopNotificationPermission = false;

/**
 * Request permission for desktop notifications
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestDesktopNotificationPermission = async () => {
  if (!ENABLE_DESKTOP_NOTIFICATIONS || typeof window === "undefined") {
    return false;
  }

  if (!("Notification" in window)) {
    console.warn("[NotificationService] Desktop notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    desktopNotificationPermission = true;
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    desktopNotificationPermission = permission === "granted";
    return desktopNotificationPermission;
  }

  return false;
};

/**
 * Show a desktop notification
 * @param {Object} notification - Notification object
 */
export const showDesktopNotification = (notification) => {
  if (!ENABLE_DESKTOP_NOTIFICATIONS || typeof window === "undefined") {
    return;
  }

  if (!desktopNotificationPermission && Notification.permission !== "granted") {
    return;
  }

  try {
    const options = {
      body: notification.message,
      icon: "/favicon.ico",
      tag: notification.id || notification._id,
      requireInteraction: notification.priority === "urgent",
    };

    const desktopNotif = new Notification(notification.title, options);

    desktopNotif.onclick = () => {
      window.focus();
      if (notification.data?.url) {
        window.location.href = notification.data.url;
      }
      desktopNotif.close();
    };

    setTimeout(() => desktopNotif.close(), 5000);
  } catch (error) {
    console.error(
      "[NotificationService] Failed to show desktop notification:",
      error,
    );
  }
};

// ============================================================================
// SOUND NOTIFICATIONS
// ============================================================================

let notificationSound = null;

/**
 * Initialize audio for sound notifications
 */
const initAudio = () => {
  if (!ENABLE_SOUND_NOTIFICATIONS || typeof window === "undefined") {
    return;
  }

  try {
    notificationSound = new Audio("/sounds/notification.mp3");
    notificationSound.volume = 0.5;
  } catch (error) {
    console.error("[NotificationService] Failed to initialize audio:", error);
  }
};

/**
 * Play notification sound
 */
export const playNotificationSound = async () => {
  if (!ENABLE_SOUND_NOTIFICATIONS || !notificationSound) {
    return;
  }

  try {
    notificationSound.currentTime = 0;
    await notificationSound.play();
  } catch (error) {
    console.debug("[NotificationService] Could not play sound:", error);
  }
};

// Initialize audio on module load
if (typeof window !== "undefined") {
  initAudio();

  const enableAudioOnInteraction = () => {
    if (notificationSound) {
      notificationSound.volume = 0.5;
      notificationSound.load();
    }
    window.removeEventListener("click", enableAudioOnInteraction);
    window.removeEventListener("keydown", enableAudioOnInteraction);
  };

  window.addEventListener("click", enableAudioOnInteraction);
  window.addEventListener("keydown", enableAudioOnInteraction);
}

// ============================================================================
// SOCKET.IO REAL-TIME CONNECTION
// ============================================================================

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
let notificationCallbacks = [];

/**
 * Create socket connection
 * @param {string} token - Authentication token
 * @returns {Object|null} Socket instance
 */
export const createSocketConnection = (token) => {
  if (!token || typeof window === "undefined") {
    return null;
  }

  return io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    autoConnect: true,
  });
};

/**
 * Connect to socket for real-time notifications
 * @returns {Object|null} Socket instance
 */
export const connectSocket = () => {
  const token = getToken();

  if (!token || !isAuthenticated()) {
    if (ENABLE_LOGGING) {
      console.warn(
        "[NotificationService] Not authenticated, skipping socket connection",
      );
    }
    return null;
  }

  if (socket && socket.connected) {
    if (ENABLE_LOGGING) {
      console.log("[NotificationService] Socket already connected");
    }
    return socket;
  }

  if (socket && socket.disconnected) {
    socket.connect();
    return socket;
  }

  socket = createSocketConnection(token);

  if (!socket) {
    return null;
  }

  // Socket event handlers
  socket.on("connect", () => {
    if (ENABLE_LOGGING) {
      console.log("[NotificationService] Socket connected:", socket.id);
    }
    reconnectAttempts = 0;
  });

  socket.on("disconnect", (reason) => {
    if (ENABLE_LOGGING) {
      console.log("[NotificationService] Socket disconnected:", reason);
    }

    if (reason === "io server disconnect") {
      socket.connect();
    }
  });

  socket.on("connect_error", (error) => {
    console.error(
      "[NotificationService] Socket connection error:",
      error.message,
    );
    reconnectAttempts++;

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error("[NotificationService] Max reconnection attempts reached");
      socket.disconnect();
    }
  });

  socket.on("reconnect_attempt", (attempt) => {
    if (ENABLE_LOGGING) {
      console.log(`[NotificationService] Reconnection attempt ${attempt}`);
    }

    const newToken = getToken();
    if (newToken && socket) {
      socket.auth = { token: newToken };
    }
  });

  socket.on("reconnect_failed", () => {
    console.error("[NotificationService] Socket reconnection failed");
  });

  socket.on("notification", (notification) => {
    if (ENABLE_LOGGING) {
      console.log("[NotificationService] Received notification:", notification);
    }

    // Ensure notification has id
    const enrichedNotification = {
      ...notification,
      id: notification._id || notification.id,
    };

    // Show desktop notification if enabled
    getPreferences().then((prefs) => {
      if (prefs.desktop || prefs.desktopNotifications) {
        showDesktopNotification(enrichedNotification);
      }
      if (prefs.sound) {
        playNotificationSound();
      }
    });

    // Notify all subscribers
    notificationCallbacks.forEach((callback) => {
      try {
        callback(enrichedNotification);
      } catch (error) {
        console.error("[NotificationService] Callback error:", error);
      }
    });
  });

  return socket;
};

/**
 * Subscribe to real-time notifications
 * @param {Function} callback - Callback function for new notifications
 * @returns {Function} Unsubscribe function
 */
export const subscribeToNotifications = (callback) => {
  if (typeof callback !== "function") {
    throw new Error("Callback must be a function");
  }

  notificationCallbacks.push(callback);

  // Ensure socket is connected
  connectSocket();

  // Return unsubscribe function
  return () => {
    notificationCallbacks = notificationCallbacks.filter(
      (cb) => cb !== callback,
    );
  };
};

/**
 * Alias for subscribeToNotifications (backward compatibility)
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMessages = subscribeToNotifications;

/**
 * Disconnect socket connection
 * @returns {void}
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    notificationCallbacks = [];

    if (ENABLE_LOGGING) {
      console.log("[NotificationService] Socket disconnected");
    }
  }
};

/**
 * Get current socket instance
 * @returns {Object|null} Socket instance
 */
export const getSocket = () => socket;

/**
 * Check if socket is connected
 * @returns {boolean} True if connected
 */
export const isSocketConnected = () => {
  return socket && socket.connected;
};

/**
 * Reconnect socket with new token
 * @returns {Object|null} Socket instance
 */
export const reconnectSocket = () => {
  disconnectSocket();
  return connectSocket();
};

// ============================================================================
// POLLING FALLBACK
// ============================================================================

let pollingInterval = null;
let pollingEnabled = false;

/**
 * Start polling for notifications (fallback when socket is unavailable)
 * @param {Function} callback - Callback for new notifications
 * @param {number} interval - Polling interval in ms
 * @returns {void}
 */
export const startPolling = (callback, interval = 30000) => {
  if (pollingInterval) {
    stopPolling();
  }

  pollingEnabled = true;

  const poll = async () => {
    if (!pollingEnabled || !isAuthenticated()) return;

    try {
      const lastCheck = localStorage.getItem(
        STORAGE_KEYS.LAST_NOTIFICATION_CHECK,
      );
      const notifications = await getNotifications({ limit: 10 });

      if (notifications.length > 0 && callback) {
        const newNotifications = notifications.filter((n) => {
          return !lastCheck || new Date(n.createdAt) > new Date(lastCheck);
        });

        newNotifications.forEach(callback);
      }

      localStorage.setItem(
        STORAGE_KEYS.LAST_NOTIFICATION_CHECK,
        new Date().toISOString(),
      );
    } catch (error) {
      console.error("[NotificationService] Polling error:", error);
    }
  };

  pollingInterval = setInterval(poll, interval);
  poll();

  if (ENABLE_LOGGING) {
    console.log(`[NotificationService] Started polling every ${interval}ms`);
  }
};

/**
 * Stop polling for notifications
 * @returns {void}
 */
export const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    pollingEnabled = false;

    if (ENABLE_LOGGING) {
      console.log("[NotificationService] Stopped polling");
    }
  }
};

// ============================================================================
// AUTO-CONNECT ON AUTH
// ============================================================================

if (typeof window !== "undefined") {
  window.addEventListener("auth:login", () => {
    setTimeout(() => connectSocket(), 1000);
  });

  window.addEventListener("auth:logout", () => {
    disconnectSocket();
  });
}

// ============================================================================
// SERVICE EXPORT
// ============================================================================

const notificationService = {
  // Core functions
  getNotifications,
  getUnreadCount,
  getPreferences,
  updatePreferences,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,

  // Socket functions
  connectSocket,
  disconnectSocket,
  subscribeToNotifications,
  subscribeToMessages,
  getSocket,
  isSocketConnected,
  reconnectSocket,

  // Desktop notifications
  requestDesktopNotificationPermission,
  showDesktopNotification,

  // Sound notifications
  playNotificationSound,

  // Polling fallback
  startPolling,
  stopPolling,

  // Auth helpers
  isAuthenticated,
  getToken,
  clearAuthData,
};

export default notificationService;
