// src/services/userService.js

import api from "./api";
import { API_ENDPOINTS } from "./apiEndpoints";
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from "./apiErrors";
import toast from "react-hot-toast";

// Constants
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const USER_CACHE_KEY = "users_cache";

/**
 * User Service with advanced features
 */
class UserService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.initCache();
  }

  initCache() {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        Object.entries(data).forEach(([key, value]) => {
          if (Date.now() - value.timestamp < CACHE_DURATION) {
            this.cache.set(key, value.data);
          }
        });
      }
    } catch (error) {
      console.error("Failed to load user cache:", error);
    }
  }

  persistCache() {
    try {
      const cacheData = {};
      this.cache.forEach((value, key) => {
        cacheData[key] = {
          data: value,
          timestamp: Date.now(),
        };
      });
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Failed to persist user cache:", error);
    }
  }

  async getUsers(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        role = "",
        status = "",
        sortBy = "createdAt",
        sortOrder = "desc",
        department = "",
        ...filters
      } = params;

      const cacheKey = `users:${JSON.stringify(params)}`;

      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const response = await api.get(API_ENDPOINTS.USERS.BASE, {
        params: {
          page,
          limit,
          search,
          role,
          status,
          sortBy,
          sortOrder,
          department,
          ...filters,
        },
      });

      const data = response.data;
      this.cache.set(cacheKey, data);
      this.persistCache();

      return data;
    } catch (error) {
      this.handleError(error, "fetching users");
      throw error;
    }
  }

  async getUserById(id, options = {}) {
    try {
      const { forceRefresh = false, include = [] } = options;
      const cacheKey = `user:${id}:${include.join(",")}`;

      if (!forceRefresh && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const response = await api.get(API_ENDPOINTS.USERS.GET_BY_ID(id), {
        params: { include: include.join(",") },
      });

      const userData = response.data;
      this.cache.set(cacheKey, userData);
      this.persistCache();

      return userData;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundError("User not found");
      }
      this.handleError(error, `fetching user ${id}`);
      throw error;
    }
  }

  async getCurrentUserProfile() {
    try {
      const response = await api.get(API_ENDPOINTS.USERS.PROFILE);
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      this.handleError(error, "fetching current user profile");
      throw error;
    }
  }

  async updateProfile(userId, userData, options = {}) {
    try {
      const { validateOnly = false, uploadAvatar = false } = options;

      const validation = this.validateUserData(userData);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join(", "));
      }

      if (validateOnly) {
        return { valid: true, errors: [] };
      }

      const sanitizedData = this.sanitizeUserData(userData);

      const response = await api.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, {
        ...sanitizedData,
        ...(uploadAvatar && { avatar: userData.avatar }),
      });

      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, ...response.data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      this.clearUserCache(userId);
      toast.success("Profile updated successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "updating profile");
      throw error;
    }
  }

  async uploadAvatar(userId, file, onProgress) {
    try {
      const validation = this.validateAvatar(file);
      if (!validation.isValid) {
        throw new ValidationError(validation.error);
      }

      const formData = new FormData();
      formData.append("avatar", file);

      const response = await api.post(`/users/${userId}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percent);
          }
        },
      });

      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, avatar: response.data.avatar };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      this.clearUserCache(userId);
      toast.success("Avatar uploaded successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "uploading avatar");
      throw error;
    }
  }

  async removeAvatar(userId) {
    try {
      const response = await api.delete(`/users/${userId}/avatar`);

      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, avatar: null };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      this.clearUserCache(userId);
      toast.success("Avatar removed successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "removing avatar");
      throw error;
    }
  }

  async changePassword(userId, passwordData) {
    try {
      const { currentPassword, newPassword, confirmPassword } = passwordData;

      if (newPassword !== confirmPassword) {
        throw new ValidationError("New passwords do not match");
      }

      const passwordStrength = this.validatePasswordStrength(newPassword);
      if (!passwordStrength.isValid) {
        throw new ValidationError(passwordStrength.errors.join(", "));
      }

      const response = await api.put(API_ENDPOINTS.USERS.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });

      toast.success("Password changed successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "changing password");
      throw error;
    }
  }

  async updateUserRole(userId, role) {
    try {
      const validRoles = ["admin", "faculty", "student", "staff"];
      if (!validRoles.includes(role)) {
        throw new ValidationError("Invalid user role");
      }

      const response = await api.put(API_ENDPOINTS.ADMIN.UPDATE_USER(userId), {
        role,
      });

      this.clearUserCache(userId);
      toast.success("User role updated successfully");
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new AuthorizationError(
          "Insufficient permissions to change user role",
        );
      }
      this.handleError(error, "updating user role");
      throw error;
    }
  }

  async updateUserStatus(userId, status) {
    try {
      const validStatuses = ["active", "inactive", "suspended", "pending"];
      if (!validStatuses.includes(status)) {
        throw new ValidationError("Invalid user status");
      }

      const response = await api.put(`/admin/users/${userId}/status`, {
        status,
      });

      this.clearUserCache(userId);
      toast.success(`User status updated to ${status}`);
      return response.data;
    } catch (error) {
      this.handleError(error, "updating user status");
      throw error;
    }
  }

  async deleteUser(userId, permanent = false) {
    try {
      const response = await api.delete(
        API_ENDPOINTS.ADMIN.DELETE_USER(userId),
        {
          params: { permanent },
        },
      );

      this.clearUserCache(userId);
      toast.success("User deleted successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "deleting user");
      throw error;
    }
  }

  async bulkDeleteUsers(userIds) {
    try {
      if (!userIds || userIds.length === 0) {
        throw new ValidationError("No users selected for deletion");
      }

      const response = await api.post("/admin/users/bulk-delete", { userIds });
      userIds.forEach((id) => this.clearUserCache(id));
      toast.success(`${userIds.length} user(s) deleted successfully`);
      return response.data;
    } catch (error) {
      this.handleError(error, "bulk deleting users");
      throw error;
    }
  }

  async bulkUpdateRoles(userIds, role) {
    try {
      const validRoles = ["admin", "faculty", "student", "staff"];
      if (!validRoles.includes(role)) {
        throw new ValidationError("Invalid user role");
      }

      const response = await api.post("/admin/users/bulk-update-roles", {
        userIds,
        role,
      });

      userIds.forEach((id) => this.clearUserCache(id));
      toast.success(`${userIds.length} user(s) role updated to ${role}`);
      return response.data;
    } catch (error) {
      this.handleError(error, "bulk updating roles");
      throw error;
    }
  }

  async getUserActivity(userId, params = {}) {
    try {
      const { page = 1, limit = 20, startDate, endDate, action } = params;
      const response = await api.get(API_ENDPOINTS.USERS.ACTIVITY_LOG, {
        params: { userId, page, limit, startDate, endDate, action },
      });
      return response.data;
    } catch (error) {
      this.handleError(error, "fetching user activity");
      throw error;
    }
  }

  async exportUserData(userId, format = "json") {
    try {
      const response = await api.get(`/users/${userId}/export`, {
        params: { format },
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user_data_${userId}_${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("User data exported successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "exporting user data");
      throw error;
    }
  }

  async getUserStats(userId) {
    try {
      const response = await api.get(`/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      this.handleError(error, "fetching user statistics");
      throw error;
    }
  }

  async searchUsers(criteria) {
    try {
      const { query, role, department, status, limit = 20 } = criteria;
      const response = await api.get("/users/search", {
        params: { q: query, role, department, status, limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error, "searching users");
      throw error;
    }
  }

  async getUserPreferences(userId) {
    try {
      const response = await api.get(`/users/${userId}/preferences`);
      return response.data;
    } catch (error) {
      this.handleError(error, "fetching user preferences");
      throw error;
    }
  }

  async updateUserPreferences(userId, preferences) {
    try {
      const response = await api.put(
        `/users/${userId}/preferences`,
        preferences,
      );

      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = {
          ...currentUser,
          preferences: response.data.preferences,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      toast.success("Preferences updated successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "updating user preferences");
      throw error;
    }
  }

  async getUserNotificationSettings(userId) {
    try {
      const response = await api.get(`/users/${userId}/notifications/settings`);
      return response.data;
    } catch (error) {
      this.handleError(error, "fetching notification settings");
      throw error;
    }
  }

  async updateNotificationSettings(userId, settings) {
    try {
      const response = await api.put(
        `/users/${userId}/notifications/settings`,
        settings,
      );
      toast.success("Notification settings updated");
      return response.data;
    } catch (error) {
      this.handleError(error, "updating notification settings");
      throw error;
    }
  }

  async requestAccountDeletion(userId, reason) {
    try {
      const response = await api.post(`/users/${userId}/delete-request`, {
        reason,
      });
      toast.success("Account deletion request submitted");
      return response.data;
    } catch (error) {
      this.handleError(error, "requesting account deletion");
      throw error;
    }
  }

  async cancelDeletionRequest(userId) {
    try {
      const response = await api.post(`/users/${userId}/cancel-deletion`);
      toast.success("Account deletion request cancelled");
      return response.data;
    } catch (error) {
      this.handleError(error, "cancelling deletion request");
      throw error;
    }
  }

  getCurrentUser() {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Failed to parse current user:", error);
      return null;
    }
  }

  clearUserCache(userId) {
    const keysToDelete = [];
    this.cache.forEach((_, key) => {
      if (key.includes(`user:${userId}`) || key.includes(`users:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
    this.persistCache();
  }

  clearAllCache() {
    this.cache.clear();
    localStorage.removeItem(USER_CACHE_KEY);
    toast.success("User cache cleared successfully");
  }

  validateUserData(userData) {
    const errors = [];

    if (userData.name !== undefined) {
      if (!userData.name || userData.name.trim().length === 0) {
        errors.push("Name is required");
      } else if (userData.name.length < 2) {
        errors.push("Name must be at least 2 characters");
      } else if (userData.name.length > 100) {
        errors.push("Name must be less than 100 characters");
      }
    }

    if (userData.email !== undefined) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(userData.email)) {
        errors.push("Invalid email format");
      }
    }

    if (userData.phone !== undefined && userData.phone) {
      const phoneRegex =
        /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(userData.phone)) {
        errors.push("Invalid phone number format");
      }
    }

    if (userData.bio !== undefined && userData.bio.length > 500) {
      errors.push("Bio must be less than 500 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateAvatar(file) {
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error:
          "File type not supported. Please upload JPEG, PNG, or WebP image.",
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size too large. Maximum size is 5MB.",
      };
    }

    return { isValid: true };
  }

  validatePasswordStrength(password) {
    const errors = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push(
        "Password must contain at least one special character (!@#$%^&*)",
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  sanitizeUserData(userData) {
    const sanitized = {};

    if (userData.name !== undefined) {
      sanitized.name = userData.name.trim().replace(/[<>]/g, "");
    }

    if (userData.email !== undefined) {
      sanitized.email = userData.email.trim().toLowerCase();
    }

    if (userData.phone !== undefined) {
      sanitized.phone = userData.phone.replace(/[^\d+]/g, "");
    }

    if (userData.bio !== undefined) {
      sanitized.bio = userData.bio.trim().substring(0, 500);
    }

    return sanitized;
  }

  handleError(error, context) {
    console.error(`User Service Error (${context}):`, error);

    if (error.response?.status === 404) {
      toast.error("User not found");
    } else if (error.response?.status === 403) {
      toast.error("Insufficient permissions");
    } else if (error.response?.status === 409) {
      toast.error("Email already in use");
    } else if (!error.response) {
      toast.error("Network error. Please check your connection.");
    } else if (error instanceof ValidationError) {
      toast.error(error.message);
    } else {
      toast.error(`Failed to ${context}. Please try again.`);
    }
  }
}

// Create and export singleton instance (ONLY DEFAULT EXPORT)
const userService = new UserService();
export default userService;
