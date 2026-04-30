// src/services/adminService.js
import api from "./api";

/**
 * Admin Service - Handles all admin-related API operations
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_SORT = "-createdAt";

// API Endpoints
const API_ENDPOINTS = {
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    USERS_BULK_DELETE: "/admin/users/bulk-delete",
    USERS_BULK_UPDATE: "/admin/users/bulk-update",
    ROLES: "/admin/roles",
    NOTICES: "/admin/notices",
    EVENTS: "/admin/events",
    SETTINGS: "/admin/settings",
    STATS_USERS: "/admin/stats/users",
    STATS_ACTIVITY: "/admin/stats/activity",
    EXPORT_USERS: "/admin/export/users",
  },
};

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Get all users with pagination and filters
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Users data with pagination
 */
const getUsers = async (params = {}) => {
  try {
    const queryParams = {
      page: params.page || DEFAULT_PAGE,
      limit: params.limit || DEFAULT_LIMIT,
      sort: params.sort || DEFAULT_SORT,
      ...(params.search && { search: params.search }),
      ...(params.role && { role: params.role }),
      ...(params.status && { status: params.status }),
      ...(params.department && { department: params.department }),
    };

    const response = await api.get(API_ENDPOINTS.ADMIN.USERS, {
      params: queryParams,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch users",
      }
    );
  }
};

/**
 * Get single user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User data
 */
const getUserById = async (userId) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch user",
      }
    );
  }
};

/**
 * Create new user (admin only)
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async (userData) => {
  try {
    const response = await api.post(API_ENDPOINTS.ADMIN.USERS, userData);
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to create user",
      }
    );
  }
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user
 */
const updateUser = async (userId, updateData) => {
  try {
    const response = await api.put(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}`,
      updateData,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to update user",
      }
    );
  }
};

/**
 * Delete user (soft delete)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to delete user",
      }
    );
  }
};

/**
 * Permanently delete user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Deletion result
 */
const permanentlyDeleteUser = async (userId) => {
  try {
    const response = await api.delete(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/permanent`,
    );
    return response.data;
  } catch (error) {
    console.error("Error permanently deleting user:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to permanently delete user",
      }
    );
  }
};

/**
 * Restore deleted user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Restored user
 */
const restoreUser = async (userId) => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/restore`,
    );
    return response.data;
  } catch (error) {
    console.error("Error restoring user:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to restore user",
      }
    );
  }
};

/**
 * Bulk delete users
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Promise<Object>} Bulk deletion result
 */
const bulkDeleteUsers = async (userIds) => {
  try {
    const response = await api.post(API_ENDPOINTS.ADMIN.USERS_BULK_DELETE, {
      userIds,
    });
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting users:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to delete users",
      }
    );
  }
};

/**
 * Bulk update user roles
 * @param {Array<Object>} updates - Array of user role updates
 * @returns {Promise<Object>} Bulk update result
 */
const bulkUpdateRoles = async (updates) => {
  try {
    const response = await api.post(API_ENDPOINTS.ADMIN.USERS_BULK_UPDATE, {
      updates,
    });
    return response.data;
  } catch (error) {
    console.error("Error bulk updating roles:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to update roles",
      }
    );
  }
};

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

/**
 * Get all roles
 * @returns {Promise<Object>} Roles data
 */
const getRoles = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ADMIN.ROLES);
    return response.data;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch roles",
      }
    );
  }
};

/**
 * Update user role
 * @param {string} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<Object>} Updated user
 */
const updateUserRole = async (userId, role) => {
  try {
    const response = await api.put(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/role`,
      { role },
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to update user role",
      }
    );
  }
};

// ============================================================================
// USER STATUS MANAGEMENT
// ============================================================================

/**
 * Activate user account
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Activation result
 */
const activateUser = async (userId) => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/activate`,
    );
    return response.data;
  } catch (error) {
    console.error("Error activating user:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to activate user",
      }
    );
  }
};

/**
 * Deactivate user account
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Deactivation result
 */
const deactivateUser = async (userId) => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/deactivate`,
    );
    return response.data;
  } catch (error) {
    console.error("Error deactivating user:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to deactivate user",
      }
    );
  }
};

/**
 * Suspend user account
 * @param {string} userId - User ID
 * @param {string} reason - Suspension reason
 * @returns {Promise<Object>} Suspension result
 */
const suspendUser = async (userId, reason) => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/suspend`,
      { reason },
    );
    return response.data;
  } catch (error) {
    console.error("Error suspending user:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to suspend user",
      }
    );
  }
};

/**
 * Ban user account
 * @param {string} userId - User ID
 * @param {string} reason - Ban reason
 * @returns {Promise<Object>} Ban result
 */
const banUser = async (userId, reason) => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/ban`,
      { reason },
    );
    return response.data;
  } catch (error) {
    console.error("Error banning user:", error);
    throw (
      error.response?.data || { success: false, message: "Failed to ban user" }
    );
  }
};

// ============================================================================
// VERIFICATION MANAGEMENT
// ============================================================================

/**
 * Verify user account
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Verification result
 */
const verifyUser = async (userId) => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/verify`,
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying user:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to verify user",
      }
    );
  }
};

/**
 * Approve user registration
 * @param {string} userId - User ID
 * @param {Object} data - Approval data
 * @returns {Promise<Object>} Approval result
 */
const approveUser = async (userId, data = {}) => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/approve`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Error approving user:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to approve user",
      }
    );
  }
};

/**
 * Reject user registration
 * @param {string} userId - User ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Rejection result
 */
const rejectUser = async (userId, reason) => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/reject`,
      { reason },
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting user:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to reject user",
      }
    );
  }
};

// ============================================================================
// STATISTICS & REPORTS
// ============================================================================

/**
 * Get admin dashboard statistics
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Dashboard statistics
 */
const getDashboardStats = async (params = {}) => {
  try {
    const response = await api.get(API_ENDPOINTS.ADMIN.DASHBOARD, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch dashboard statistics",
      }
    );
  }
};

/**
 * Get user statistics
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} User statistics
 */
const getUserStats = async (params = {}) => {
  try {
    const response = await api.get(API_ENDPOINTS.ADMIN.STATS_USERS, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch user statistics",
      }
    );
  }
};

/**
 * Get activity statistics
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Activity statistics
 */
const getActivityStats = async (params = {}) => {
  try {
    const response = await api.get(API_ENDPOINTS.ADMIN.STATS_ACTIVITY, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch activity statistics",
      }
    );
  }
};

/**
 * Export users data
 * @param {Object} params - Export parameters
 * @returns {Promise<Blob>} Export file blob
 */
const exportUsers = async (params = {}) => {
  try {
    const format = params.format || "csv";
    const response = await api.get(
      `${API_ENDPOINTS.ADMIN.EXPORT_USERS}?format=${format}`,
      {
        params: params.filters,
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error exporting users:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to export users",
      }
    );
  }
};

/**
 * Download export file
 * @param {Blob} blob - File blob
 * @param {string} filename - File name
 */
const downloadExportFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ============================================================================
// NOTICE MANAGEMENT (Admin)
// ============================================================================

/**
 * Get all notices (admin view)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Notices data
 */
const getNotices = async (params = {}) => {
  try {
    const response = await api.get(API_ENDPOINTS.ADMIN.NOTICES, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching notices:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch notices",
      }
    );
  }
};

/**
 * Create notice
 * @param {Object} noticeData - Notice data
 * @returns {Promise<Object>} Created notice
 */
const createNotice = async (noticeData) => {
  try {
    const response = await api.post(API_ENDPOINTS.ADMIN.NOTICES, noticeData);
    return response.data;
  } catch (error) {
    console.error("Error creating notice:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to create notice",
      }
    );
  }
};

/**
 * Update notice
 * @param {string} noticeId - Notice ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated notice
 */
const updateNotice = async (noticeId, updateData) => {
  try {
    const response = await api.put(
      `${API_ENDPOINTS.ADMIN.NOTICES}/${noticeId}`,
      updateData,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating notice:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to update notice",
      }
    );
  }
};

/**
 * Delete notice
 * @param {string} noticeId - Notice ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteNotice = async (noticeId) => {
  try {
    const response = await api.delete(
      `${API_ENDPOINTS.ADMIN.NOTICES}/${noticeId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting notice:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to delete notice",
      }
    );
  }
};

/**
 * Publish notice
 * @param {string} noticeId - Notice ID
 * @returns {Promise<Object>} Publication result
 */
const publishNotice = async (noticeId) => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.ADMIN.NOTICES}/${noticeId}/publish`,
    );
    return response.data;
  } catch (error) {
    console.error("Error publishing notice:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to publish notice",
      }
    );
  }
};

/**
 * Archive notice
 * @param {string} noticeId - Notice ID
 * @returns {Promise<Object>} Archive result
 */
const archiveNotice = async (noticeId) => {
  try {
    const response = await api.post(
      `${API_ENDPOINTS.ADMIN.NOTICES}/${noticeId}/archive`,
    );
    return response.data;
  } catch (error) {
    console.error("Error archiving notice:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to archive notice",
      }
    );
  }
};

// ============================================================================
// EVENT MANAGEMENT (Admin)
// ============================================================================

/**
 * Get all events (admin view)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Events data
 */
const getEvents = async (params = {}) => {
  try {
    const response = await api.get(API_ENDPOINTS.ADMIN.EVENTS, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch events",
      }
    );
  }
};

/**
 * Create event
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Created event
 */
const createEvent = async (eventData) => {
  try {
    const response = await api.post(API_ENDPOINTS.ADMIN.EVENTS, eventData);
    return response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to create event",
      }
    );
  }
};

/**
 * Update event
 * @param {string} eventId - Event ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated event
 */
const updateEvent = async (eventId, updateData) => {
  try {
    const response = await api.put(
      `${API_ENDPOINTS.ADMIN.EVENTS}/${eventId}`,
      updateData,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating event:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to update event",
      }
    );
  }
};

/**
 * Delete event
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(
      `${API_ENDPOINTS.ADMIN.EVENTS}/${eventId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to delete event",
      }
    );
  }
};

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

/**
 * Get system settings
 * @returns {Promise<Object>} System settings
 */
const getSettings = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ADMIN.SETTINGS);
    return response.data;
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to fetch settings",
      }
    );
  }
};

/**
 * Update system settings
 * @param {Object} settingsData - Settings data
 * @returns {Promise<Object>} Updated settings
 */
const updateSettings = async (settingsData) => {
  try {
    const response = await api.put(API_ENDPOINTS.ADMIN.SETTINGS, settingsData);
    return response.data;
  } catch (error) {
    console.error("Error updating settings:", error);
    throw (
      error.response?.data || {
        success: false,
        message: "Failed to update settings",
      }
    );
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export const adminService = {
  // User Management
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  permanentlyDeleteUser,
  restoreUser,
  bulkDeleteUsers,
  bulkUpdateRoles,

  // Role Management
  getRoles,
  updateUserRole,

  // Status Management
  activateUser,
  deactivateUser,
  suspendUser,
  banUser,

  // Verification Management
  verifyUser,
  approveUser,
  rejectUser,

  // Statistics & Reports
  getDashboardStats,
  getUserStats,
  getActivityStats,
  exportUsers,
  downloadExportFile,

  // Notice Management
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  publishNotice,
  archiveNotice,

  // Event Management
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,

  // System Settings
  getSettings,
  updateSettings,
};

export default adminService;
