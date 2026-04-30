// src/services/noticeService.js

import { API_ENDPOINTS } from "../utils/constants";

// ================================
// Constants
// ================================

const CACHE_DURATION = 5 * 60 * 1000;
const NOTICE_CACHE_KEY = "notices_cache";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

// ================================
// Helpers
// ================================

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken")
  );
};

const sanitizeHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/g, "")
    .replace(/javascript:/gi, "");
};

const apiCall = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "API error");
  }

  return response.status === 204 ? null : response.json();
};

// ================================
// Cache
// ================================

let cache = new Map();

const initCache = () => {
  try {
    const cached = localStorage.getItem(NOTICE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      Object.entries(parsed).forEach(([key, value]) => {
        if (Date.now() - value.timestamp < CACHE_DURATION) {
          cache.set(key, value.data);
        }
      });
    }
  } catch {}
};

const persistCache = () => {
  const obj = {};
  cache.forEach((v, k) => {
    obj[k] = { data: v, timestamp: Date.now() };
  });
  localStorage.setItem(NOTICE_CACHE_KEY, JSON.stringify(obj));
};

const clearNoticeCache = (noticeId = null) => {
  if (!noticeId) {
    cache.clear();
  } else {
    [...cache.keys()].forEach((k) => {
      if (k.includes(`notice:${noticeId}`)) cache.delete(k);
    });
  }
  persistCache();
};

// ✅ ONLY ONE GLOBAL CLEAR FUNCTION
export const clearAllCache = () => {
  cache.clear();
  localStorage.removeItem(NOTICE_CACHE_KEY);
};

initCache();

// ================================
// CRUD
// ================================

export const getNotices = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const key = `notices:${query}`;

  if (cache.has(key)) return cache.get(key);

  const data = await apiCall(
    `${API_ENDPOINTS.NOTICES.BASE}${query ? `?${query}` : ""}`,
  );

  cache.set(key, data);
  persistCache();

  return data;
};

export const getNoticeById = async (id) => {
  const key = `notice:${id}`;
  if (cache.has(key)) return cache.get(key);

  const data = await apiCall(API_ENDPOINTS.NOTICES.BY_ID(id));

  cache.set(key, data);
  persistCache();

  return data;
};

export const createNotice = async (data) => {
  const res = await apiCall(API_ENDPOINTS.NOTICES.BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });

  clearNoticeCache();
  return res;
};

export const updateNotice = async (id, data) => {
  const res = await apiCall(API_ENDPOINTS.NOTICES.BY_ID(id), {
    method: "PUT",
    body: JSON.stringify(data),
  });

  clearNoticeCache(id);
  return res;
};

export const deleteNotice = async (id) => {
  const res = await apiCall(API_ENDPOINTS.NOTICES.BY_ID(id), {
    method: "DELETE",
  });

  clearNoticeCache(id);
  return res;
};

// ================================
// Extra
// ================================

export const getFeaturedNotices = () => apiCall(API_ENDPOINTS.NOTICES.FEATURED);

export const getPinnedNotices = () => apiCall(API_ENDPOINTS.NOTICES.PINNED);

// ================================
// Service Object
// ================================

export const noticeService = {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  getFeaturedNotices,
  getPinnedNotices,

  // cache
  clearCache: clearNoticeCache,
  clearAllCache,
};

export default noticeService;
