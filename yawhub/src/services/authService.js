// src/services/authService.js - COMPLETE SECURE VERSION
// NO HARDCODED CREDENTIALS - REQUIRES BACKEND VALIDATION

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";
export const STORAGE_KEYS = {
  TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user_data",
  TOKEN_EXPIRY: "token_expiry",
  REMEMBER_ME: "remember_me",
};

const ENABLE_LOGGING = import.meta.env.DEV;

// ============================================================
// JWT HELPER FUNCTIONS
// ============================================================

export const parseJwt = (token) => {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("[authService] JWT parsing failed:", error);
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

const getStorage = (remember = false) => {
  return remember ? localStorage : sessionStorage;
};

export const getToken = () => {
  const storages = [localStorage, sessionStorage];
  const keys = [STORAGE_KEYS.TOKEN, "token", "accessToken", "authToken"];
  for (const storage of storages) {
    for (const key of keys) {
      const token = storage.getItem(key);
      if (token) return token;
    }
  }
  return null;
};

export const setToken = (token, remember = false) => {
  if (!token) return;
  const storage = getStorage(remember);
  storage.setItem(STORAGE_KEYS.TOKEN, token);
  storage.setItem("token", token);
  storage.setItem("accessToken", token);
};

export const removeToken = () => {
  const allKeys = [
    STORAGE_KEYS.TOKEN,
    "token",
    "accessToken",
    "authToken",
    STORAGE_KEYS.TOKEN_EXPIRY,
  ];
  allKeys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

export const getRefreshToken = () => {
  return (
    localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
    localStorage.getItem("refreshToken") ||
    sessionStorage.getItem("refreshToken") ||
    null
  );
};

export const setRefreshToken = (token, remember = false) => {
  if (!token) return;
  const storage = getStorage(remember);
  storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  storage.setItem("refreshToken", token);
};

export const removeRefreshToken = () => {
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("refreshToken");
};

export const getCurrentUser = () => {
  const storages = [localStorage, sessionStorage];
  const keys = [STORAGE_KEYS.USER, "user", "auth_user"];
  for (const storage of storages) {
    for (const key of keys) {
      const raw = storage.getItem(key);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          continue;
        }
      }
    }
  }
  return null;
};

export const setCurrentUser = (user, remember = false) => {
  if (!user) return;
  const storage = getStorage(remember);
  storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  storage.setItem("user", JSON.stringify(user));
  console.log("[authService] User stored:", user.email, "Role:", user.role);
};

export const removeCurrentUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
  sessionStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
};

export const clearAllAuthData = () => {
  removeToken();
  removeRefreshToken();
  removeCurrentUser();
  localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  sessionStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  console.log("[authService] All auth data cleared");
};

export const initializeAuth = () => {
  console.log("[authService] Initializing authentication...");
  const token = getToken();
  const user = getCurrentUser();

  if (token && !isTokenExpired(token) && user) {
    console.log("[authService] User restored:", user.email, "Role:", user.role);
    return { isAuthenticated: true, user, token };
  } else if (token && isTokenExpired(token)) {
    clearAllAuthData();
  }
  console.log("[authService] No valid auth found");
  return { isAuthenticated: false, user: null, token: null };
};

const authApi = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ============================================================
// SECURE LOGIN - REQUIRES BACKEND VALIDATION
// ============================================================

export const login = async (identifier, password, rememberMe = false) => {
  console.log("[authService] Login attempt for:", identifier);
  clearAllAuthData();

  try {
    const response = await authApi.post("/auth/login", {
      email: identifier,
      password,
    });

    console.log("[authService] API Response:", response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || "Login failed");
    }

    const token = response.data?.token;
    const user = response.data?.user;

    if (!token) throw new Error("No token received");
    if (!user) throw new Error("No user data received");

    // Use role EXACTLY as returned from backend - NO FORCING
    const normalizedUser = {
      id: user._id || user.id,
      _id: user._id || user.id,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      name:
        user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      role: user.role || "user",
      avatar: user.avatar || null,
      username: user.username || user.email?.split("@")[0],
    };

    console.log("[authService] Final user object:", normalizedUser);
    console.log("[authService] FINAL ROLE:", normalizedUser.role);

    setToken(token, rememberMe);
    setCurrentUser(normalizedUser, rememberMe);

    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
    }

    window.dispatchEvent(
      new CustomEvent("auth:login", {
        detail: { user: normalizedUser, token, rememberMe },
      }),
    );

    return { user: normalizedUser, token, rememberMe };
  } catch (error) {
    console.error("[authService] Login error:", error);
    clearAllAuthData();

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Login failed. Please check your credentials.");
  }
};

export const register = async (userData) => {
  const payload = {
    firstName: userData.firstName?.trim(),
    lastName: userData.lastName?.trim(),
    email: userData.email?.toLowerCase().trim(),
    password: userData.password,
    role: userData.role || "student",
    username:
      userData.username ||
      userData.email
        ?.split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, ""),
    phone: userData.phone || null,
    department: userData.department || null,
    yearOfStudy: userData.yearOfStudy
      ? parseInt(userData.yearOfStudy, 10)
      : null,
    designation: userData.designation || null,
    idVerified: userData.idVerified || false,
  };

  try {
    const response = await authApi.post("/auth/register", payload);
    return response.data;
  } catch (error) {
    console.error("[authService] Registration error:", error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Registration failed");
  }
};

export const logout = async (allDevices = false) => {
  try {
    const token = getToken();
    if (token) {
      await authApi.post("/auth/logout", { allDevices });
    }
  } catch (error) {
    console.error("[authService] Logout error:", error);
  } finally {
    clearAllAuthData();
    window.dispatchEvent(
      new CustomEvent("auth:logout", { detail: { allDevices } }),
    );
  }
};

export const refreshToken = async () => {
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) throw new Error("No refresh token available");
  try {
    const response = await authApi.post("/auth/refresh-token", {
      refreshToken: refreshTokenValue,
    });
    const { token, refreshToken: newRefreshToken } = response.data;
    if (!token) throw new Error("No token received");
    const rememberMe =
      localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === "true";
    setToken(token, rememberMe);
    if (newRefreshToken) setRefreshToken(newRefreshToken, rememberMe);
    return { token, refreshToken: newRefreshToken };
  } catch (error) {
    clearAllAuthData();
    throw error;
  }
};

export const isAuthenticated = () => {
  const token = getToken();
  const user = getCurrentUser();
  return !!(token && user && !isTokenExpired(token));
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

export const hasRole = (roles) => {
  const userRole = getUserRole();
  if (!userRole) return false;
  if (Array.isArray(roles)) return roles.includes(userRole);
  return userRole === roles;
};

export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const forgotPassword = async (identifier) => {
  try {
    const response = await authApi.post("/auth/forgot-password", {
      identifier,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (token, password, confirmPassword) => {
  try {
    const response = await authApi.post(`/auth/reset-password/${token}`, {
      password,
      confirmPassword,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyEmail = async (token) => {
  try {
    const response = await authApi.get(`/auth/verify-email/${token}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const initResult = initializeAuth();
export const authInitialization = initResult;

export const authService = {
  STORAGE_KEYS,
  getToken,
  setToken,
  removeToken,
  parseJwt,
  isTokenExpired,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  getCurrentUser,
  setCurrentUser,
  removeCurrentUser,
  isAuthenticated,
  getUserRole,
  hasRole,
  getAuthHeaders,
  initializeAuth,
  clearAllAuthData,
  login,
  register,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
};


// ============================================================
// VERIFY STUDENT ID WITH AI
// ============================================================

export const verifyStudentIdWithAI = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append("idImage", imageFile);

    const response = await axios.post(`${API_URL}/auth/verify-student-id`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    console.error("[authService] ID verification error:", error);
    if (error.response?.data) return error.response.data;
    throw new Error("ID verification failed. Please try again.");
  }
};
export default authService;

