// src/services/api.js
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const REQUEST_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;
const IS_DEVELOPMENT = import.meta.env.DEV;
const ENABLE_LOGGING =
  import.meta.env.VITE_ENABLE_LOGGING === "true" || IS_DEVELOPMENT;

// ─── URLs that should never trigger a session-expired redirect ───────────────
const SILENT_401_PATTERNS = ["/notifications"];

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

      // ── RULE: only redirect when there is genuinely no session at all ─────
      if (isSilent || inGrace || hasSession) {
        // Attempt a quiet token refresh (skip during grace period to avoid
        // hammering refresh endpoint before auth is fully settled)
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
        // Silently pass the error back — NotificationContext etc. handle it
        return Promise.reject(error);
      }

      // Genuinely no session — redirect
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
// EXPORTS
// ============================================================================

export default api;
export { api };
export const get = (url, params, config) => api.get(url, { params, ...config });
export const post = (url, data, config) => api.post(url, data, config);
export const put = (url, data, config) => api.put(url, data, config);
export const patch = (url, data, config) => api.patch(url, data, config);
export const del = (url, config) => api.delete(url, config);
