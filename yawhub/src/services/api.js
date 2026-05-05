// src/services/api.js
import axios from "axios";
import toast from "react-hot-toast";

// ✅ FIX: In production there is no proxy, so we need the full backend URL.
//         In development, "/api" is fine because Vite proxies it to localhost:5000.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://anotherone-2.onrender.com/api" : "/api");

const REQUEST_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;
const IS_DEVELOPMENT = import.meta.env.DEV;
const ENABLE_LOGGING =
  import.meta.env.VITE_ENABLE_LOGGING === "true" || IS_DEVELOPMENT;

// ─── URLs that should never trigger a session-expired redirect ───────────────
const SILENT_401_PATTERNS = [
  "/notifications",
  "/admin/notifications",
  "/admin/notifications/stats",
];

// ─── Grace period after login ────────────────────────────────────────────────
let lastLoginAt = 0;
const LOGIN_GRACE_MS = 15_000;

if (typeof window !== "undefined") {
  window.addEventListener("auth:login", () => {
    lastLoginAt = Date.now();
    if (IS_DEVELOPMENT)
      console.log("[api.js] auth:login — 15s redirect grace period started");
  });
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const TOKEN_KEYS = ["access_token", "token", "accessToken", "authToken"];
const USER_KEYS = ["user_data", "user", "auth_user"];
const REFRESH_KEYS = ["refresh_token", "refreshToken"];

const allStores = () =>
  typeof localStorage !== "undefined" ? [localStorage, sessionStorage] : [];

export const getToken = () => {
  for (const store of allStores())
    for (const key of TOKEN_KEYS) {
      const t = store.getItem(key);
      if (t) return t;
    }
  return null;
};

const getStoredUser = () => {
  for (const store of allStores())
    for (const key of USER_KEYS) {
      const raw = store.getItem(key);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          /* skip */
        }
      }
    }
  return null;
};

const getRefreshToken = () => {
  for (const store of allStores())
    for (const key of REFRESH_KEYS) {
      const t = store.getItem(key);
      if (t) return t;
    }
  return null;
};

const isJwtExpired = (token) => {
  if (!token) return true;
  try {
    const b64 = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!b64) return false;
    const payload = JSON.parse(atob(b64));
    return payload.exp ? Date.now() >= payload.exp * 1000 : false;
  } catch {
    return false;
  }
};

const clearAuthStorage = () =>
  [...TOKEN_KEYS, ...REFRESH_KEYS].forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  withCredentials: true,
});

// ── Request interceptor ──────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };

    const isPublic =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register") ||
      config.url?.includes("/auth/forgot-password") ||
      config.url?.includes("/auth/reset-password") ||
      config.url?.includes("/auth/verify-email");

    if (!isPublic) {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }

    if (ENABLE_LOGGING && IS_DEVELOPMENT)
      console.log(
        `[API Request] ${config.method.toUpperCase()} ${config.url}`,
        config.data || config.params || "",
      );

    return config;
  },
  (err) => Promise.reject(err),
);

// ── Response interceptor ─────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => {
    if (ENABLE_LOGGING && IS_DEVELOPMENT) {
      const ms =
        Date.now() - (response.config.metadata?.startTime || Date.now());
      console.log(
        `[API Response] ${response.config.method.toUpperCase()} ${response.config.url} - ${ms}ms`,
        response.status,
      );
    }
    return response;
  },

  async (error) => {
    const orig = error.config;
    if (axios.isCancel(error)) return Promise.reject(error);

    // ── 401 ──────────────────────────────────────────────────────────────────
    if (
      error.response?.status === 401 &&
      !orig?._retry &&
      !orig?.url?.includes("/auth/")
    ) {
      if (orig) orig._retry = true;

      const url = orig?.url ?? "";
      const isSilent = SILENT_401_PATTERNS.some((p) => url.includes(p));
      const inGrace = Date.now() - lastLoginAt < LOGIN_GRACE_MS;
      const token = getToken();
      const user = getStoredUser();
      const tokenValid = token && !isJwtExpired(token);
      const hasSession = tokenValid || !!user;

      if (IS_DEVELOPMENT)
        console.warn(
          `[api.js] 401 "${url}" | silent=${isSilent} grace=${inGrace} ` +
            `tokenValid=${tokenValid} hasSession=${hasSession}`,
        );

      if (isSilent || inGrace || hasSession) {
        if (!inGrace) {
          try {
            const rt = getRefreshToken();
            if (rt) {
              const resp = await axios.post(`${API_URL}/auth/refresh-token`, {
                refreshToken: rt,
              });
              const newToken = resp.data?.token || resp.data?.accessToken;
              if (newToken) {
                TOKEN_KEYS.forEach((k) => {
                  localStorage.setItem(k, newToken);
                  sessionStorage.setItem(k, newToken);
                });
                orig.headers.Authorization = `Bearer ${newToken}`;
                return api(orig);
              }
            }
          } catch {
            /* silent */
          }
        }
        return Promise.reject(error);
      }

      clearAuthStorage();
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        toast.error("Session expired. Please log in again.");
        setTimeout(() => (window.location.href = "/login"), 1500);
      }
    }

    // ── 403 ──────────────────────────────────────────────────────────────────
    if (error.response?.status === 403) {
      toast.error("You do not have permission to perform this action.");
      return Promise.reject(error);
    }

    // ── 422 ──────────────────────────────────────────────────────────────────
    if (error.response?.status === 422) {
      const errs = error.response.data?.errors;
      if (errs) {
        if (typeof errs === "object")
          Object.values(errs).forEach((m) => {
            if (Array.isArray(m)) m.forEach((s) => toast.error(s));
            else if (typeof m === "string") toast.error(m);
          });
        else if (typeof errs === "string") toast.error(errs);
      } else if (error.response.data?.message) {
        toast.error(error.response.data.message);
      }
      return Promise.reject(error);
    }

    // ── 429 ──────────────────────────────────────────────────────────────────
    if (error.response?.status === 429) {
      const after = error.response.headers["retry-after"] || 15;
      const minutes = Math.ceil(after / 60);
      toast.error(
        `Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
      );
      return Promise.reject(error);
    }

    // ── 5xx ──────────────────────────────────────────────────────────────────
    if (error.response?.status >= 500) {
      toast.error("Server error. Please try again later.");
      return Promise.reject(error);
    }

    // ── Other ─────────────────────────────────────────────────────────────────
    if (error.response?.data?.message && !orig?.url?.includes("/auth"))
      toast.error(error.response.data.message);

    return Promise.reject(error);
  },
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle API response and extract data
 */
const handleResponse = (response) => {
  if (response.data && response.data.success !== undefined) {
    return response.data;
  }
  return response.data || response;
};

/**
 * Handle API error with custom messaging
 */
const handleError = (error, customMessage = null) => {
  if (customMessage) {
    toast.error(customMessage);
  }
  throw error.response?.data || error;
};

// ============================================================================
// AUTHENTICATION APIS
// ============================================================================

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data;
    if (token) {
      TOKEN_KEYS.forEach((k) => {
        localStorage.setItem(k, token);
        sessionStorage.setItem(k, token);
      });
      if (user) {
        USER_KEYS.forEach((k) => {
          localStorage.setItem(k, JSON.stringify(user));
          sessionStorage.setItem(k, JSON.stringify(user));
        });
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:login"));
      }
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearAuthStorage();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
};

export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post("/auth/reset-password", { token, password });
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await api.post("/auth/verify-email", { token });
  return response.data;
};

export const refreshToken = async () => {
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) throw new Error("No refresh token");
  const response = await api.post("/auth/refresh-token", {
    refreshToken: refreshTokenValue,
  });
  const { token } = response.data;
  if (token) {
    TOKEN_KEYS.forEach((k) => {
      localStorage.setItem(k, token);
      sessionStorage.setItem(k, token);
    });
  }
  return response.data;
};

// ============================================================================
// USER APIS
// ============================================================================

export const getCurrentUser = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/users/profile", data);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post("/users/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const getAllUsers = async (params = {}) => {
  const response = await api.get("/users", { params });
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.put(`/users/${userId}/role`, { role });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

// ============================================================================
// NOTICE APIS
// ============================================================================

export const getNotices = async (params = {}) => {
  const response = await api.get("/notices", { params });
  return response.data;
};

export const getNotice = async (id) => {
  const response = await api.get(`/notices/${id}`);
  return response.data;
};

export const createNotice = async (data) => {
  const response = await api.post("/notices", data);
  return response.data;
};

export const updateNotice = async (id, data) => {
  const response = await api.put(`/notices/${id}`, data);
  return response.data;
};

export const deleteNotice = async (id) => {
  const response = await api.delete(`/notices/${id}`);
  return response.data;
};

export const archiveNotice = async (id) => {
  const response = await api.patch(`/notices/${id}/archive`);
  return response.data;
};

// ============================================================================
// EVENT APIS
// ============================================================================

export const getEvents = async (params = {}) => {
  const response = await api.get("/events", { params });
  return response.data;
};

export const getEvent = async (id) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};

export const createEvent = async (data) => {
  const response = await api.post("/events", data);
  return response.data;
};

export const updateEvent = async (id, data) => {
  const response = await api.put(`/events/${id}`, data);
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await api.delete(`/events/${id}`);
  return response.data;
};

export const registerForEvent = async (eventId) => {
  const response = await api.post(`/events/${eventId}/register`);
  return response.data;
};

export const cancelEventRegistration = async (eventId) => {
  const response = await api.delete(`/events/${eventId}/register`);
  return response.data;
};

// ============================================================================
// NOTIFICATION APIS (User)
// ============================================================================

export const getUserNotifications = async (params = {}) => {
  const response = await api.get("/notifications", { params });
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch("/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get("/notifications/unread/count");
  return response.data;
};

// ============================================================================
// ADMIN NOTIFICATION APIS
// ============================================================================

/**
 * Get all admin notifications with filtering and pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.type - Filter by type
 * @param {string} params.priority - Filter by priority
 * @param {string} params.audience - Filter by audience
 * @param {string} params.status - Filter by status
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {string} params.search - Search in title and message
 * @param {string} params.sortBy - Sort field
 * @param {string} params.sortOrder - Sort order (asc/desc)
 */
export const getAdminNotifications = async (params = {}) => {
  try {
    const response = await api.get("/admin/notifications", { params });
    return handleResponse(response);
  } catch (error) {
    return handleError(error, "Failed to fetch admin notifications");
  }
};

/**
 * Send a new notification to users
 * @param {Object} data - Notification data
 */
export const sendAdminNotification = async (data) => {
  try {
    const response = await api.post("/admin/notifications/send", data);
    toast.success(response.data.message || "Notification sent successfully");
    return handleResponse(response);
  } catch (error) {
    return handleError(error, "Failed to send notification");
  }
};

/**
 * Get a single notification by ID
 * @param {string} id - Notification ID
 */
export const getAdminNotification = async (id) => {
  try {
    const response = await api.get(`/admin/notifications/${id}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error, "Failed to fetch notification");
  }
};

/**
 * Delete a notification (soft delete)
 * @param {string} id - Notification ID
 */
export const deleteAdminNotification = async (id) => {
  try {
    const response = await api.delete(`/admin/notifications/${id}`);
    toast.success(response.data.message || "Notification deleted successfully");
    return handleResponse(response);
  } catch (error) {
    return handleError(error, "Failed to delete notification");
  }
};

/**
 * Get comprehensive notification statistics
 * @param {number} days - Number of days for timeline data
 */
export const getNotificationStats = async (days = 30) => {
  try {
    const response = await api.get("/admin/notifications/stats/overview", {
      params: { days },
    });
    return handleResponse(response);
  } catch (error) {
    return handleError(error, "Failed to fetch notification statistics");
  }
};

/**
 * Bulk delete multiple notifications
 * @param {Array} notificationIds - Array of notification IDs
 */
export const bulkDeleteNotifications = async (notificationIds) => {
  try {
    const response = await api.delete("/admin/notifications/bulk", {
      data: { notificationIds },
    });
    toast.success(
      response.data.message ||
        `${notificationIds.length} notification(s) deleted`,
    );
    return handleResponse(response);
  } catch (error) {
    return handleError(error, "Failed to delete notifications");
  }
};

/**
 * Resend a failed notification
 * @param {string} id - Notification ID
 * @param {Array} channels - Channels to resend
 */
export const resendNotification = async (id, channels = ["inApp"]) => {
  try {
    const response = await api.post(`/admin/notifications/${id}/resend`, {
      channels,
    });
    toast.success(response.data.message || "Notification queued for resend");
    return handleResponse(response);
  } catch (error) {
    return handleError(error, "Failed to resend notification");
  }
};

/**
 * Get delivery statistics for notifications
 */
export const getDeliveryStats = async () => {
  try {
    const response = await api.get("/admin/notifications/delivery-stats");
    return handleResponse(response);
  } catch (error) {
    return handleError(error, "Failed to fetch delivery statistics");
  }
};

// ============================================================================
// AVATAR APIS
// ============================================================================

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await api.post("/avatar/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteAvatar = async () => {
  const response = await api.delete("/avatar");
  return response.data;
};

// ============================================================================
// HEALTH APIS
// ============================================================================

export const checkHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

export const getDetailedHealth = async () => {
  const response = await api.get("/health/detailed");
  return response.data;
};

// ============================================================================
// EXPORTS - BOTH DEFAULT AND NAMED EXPORTS
// ============================================================================

// Default export of the axios instance
export default api;

// Named export of the axios instance (for compatibility)
export { api };

// Convenience exports for common operations
export const get = (url, params, config) => api.get(url, { params, ...config });
export const post = (url, data, config) => api.post(url, data, config);
export const put = (url, data, config) => api.put(url, data, config);
export const patch = (url, data, config) => api.patch(url, data, config);
export const del = (url, config) => api.delete(url, config);
