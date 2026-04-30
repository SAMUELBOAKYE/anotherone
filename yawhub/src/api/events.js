// src/api/events.js - Complete Events API Service

import api from "../services/api";

// ============================================================
// EVENT CRUD OPERATIONS
// ============================================================

/**
 * Create a new event
 * @param {Object} eventData - Event data object
 * @returns {Promise} API response
 */
export const createEvent = async (eventData) => {
  try {
    const response = await api.post("/events", eventData);
    return {
      success: true,
      message: "Event created successfully",
      event: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("Create event error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create event",
      error: error.response?.data,
    };
  }
};

/**
 * Get all events with pagination and filters
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.category - Filter by category
 * @param {string} params.status - Filter by status
 * @param {string} params.search - Search query
 * @param {string} params.sort - Sort order
 * @returns {Promise} API response
 */
export const getEvents = async (params = {}) => {
  try {
    const response = await api.get("/events", { params });
    return {
      success: true,
      data: response.data?.data || response.data,
      pagination: response.data?.pagination,
      total: response.data?.total || 0,
    };
  } catch (error) {
    console.error("Get events error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch events",
      data: [],
      total: 0,
    };
  }
};

/**
 * Get upcoming events
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getUpcomingEvents = async (params = {}) => {
  try {
    const response = await api.get("/events/upcoming", { params });
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("Get upcoming events error:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch upcoming events",
      data: [],
    };
  }
};

/**
 * Get single event by ID
 * @param {string} id - Event ID
 * @returns {Promise} API response
 */
export const getEventById = async (id) => {
  try {
    const response = await api.get(`/events/${id}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("Get event error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch event",
    };
  }
};

/**
 * Get event by slug
 * @param {string} slug - Event slug
 * @returns {Promise} API response
 */
export const getEventBySlug = async (slug) => {
  try {
    const response = await api.get(`/events/slug/${slug}`);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("Get event by slug error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch event",
    };
  }
};

/**
 * Update an existing event
 * @param {string} id - Event ID
 * @param {Object} eventData - Updated event data
 * @returns {Promise} API response
 */
export const updateEvent = async (id, eventData) => {
  try {
    const response = await api.put(`/events/${id}`, eventData);
    return {
      success: true,
      message: "Event updated successfully",
      event: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("Update event error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update event",
    };
  }
};

/**
 * Delete an event
 * @param {string} id - Event ID
 * @returns {Promise} API response
 */
export const deleteEvent = async (id) => {
  try {
    const response = await api.delete(`/events/${id}`);
    return {
      success: true,
      message: "Event deleted successfully",
    };
  } catch (error) {
    console.error("Delete event error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete event",
    };
  }
};

/**
 * Publish an event
 * @param {string} id - Event ID
 * @returns {Promise} API response
 */
export const publishEvent = async (id) => {
  try {
    const response = await api.put(`/events/${id}/publish`);
    return {
      success: true,
      message: "Event published successfully",
      event: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("Publish event error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to publish event",
    };
  }
};

/**
 * Cancel an event
 * @param {string} id - Event ID
 * @returns {Promise} API response
 */
export const cancelEvent = async (id) => {
  try {
    const response = await api.put(`/events/${id}/cancel`);
    return {
      success: true,
      message: "Event cancelled successfully",
    };
  } catch (error) {
    console.error("Cancel event error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to cancel event",
    };
  }
};

// ============================================================
// EVENT REGISTRATION OPERATIONS
// ============================================================

/**
 * Register for an event
 * @param {string} eventId - Event ID
 * @param {Object} registrationData - Registration data
 * @returns {Promise} API response
 */
export const registerForEvent = async (eventId, registrationData) => {
  try {
    const response = await api.post(
      `/events/${eventId}/register`,
      registrationData,
    );
    return {
      success: true,
      message: "Registration successful",
      registration: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("Register for event error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to register for event",
    };
  }
};

/**
 * Cancel event registration
 * @param {string} eventId - Event ID
 * @returns {Promise} API response
 */
export const cancelRegistration = async (eventId) => {
  try {
    const response = await api.delete(`/events/${eventId}/register`);
    return {
      success: true,
      message: "Registration cancelled successfully",
    };
  } catch (error) {
    console.error("Cancel registration error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to cancel registration",
    };
  }
};

/**
 * Get registration status for an event
 * @param {string} eventId - Event ID
 * @returns {Promise} API response
 */
export const getRegistrationStatus = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/registration-status`);
    return {
      success: true,
      isRegistered: response.data?.isRegistered || false,
      registration: response.data?.registration || null,
    };
  } catch (error) {
    console.error("Get registration status error:", error);
    return {
      success: false,
      isRegistered: false,
      registration: null,
    };
  }
};

/**
 * Get user's registered events
 * @returns {Promise} API response
 */
export const getMyRegistrations = async () => {
  try {
    const response = await api.get("/events/my-registrations");
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("Get my registrations error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch registrations",
      data: [],
    };
  }
};

/**
 * Get event registrations (Admin only)
 * @param {string} eventId - Event ID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getEventRegistrations = async (eventId, params = {}) => {
  try {
    const response = await api.get(`/events/${eventId}/registrations`, {
      params,
    });
    return {
      success: true,
      data: response.data?.data || response.data,
      pagination: response.data?.pagination,
    };
  } catch (error) {
    console.error("Get event registrations error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch registrations",
      data: [],
    };
  }
};

/**
 * Check in a participant (Admin only)
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {Object} data - Check-in data
 * @returns {Promise} API response
 */
export const checkInParticipant = async (eventId, userId, data = {}) => {
  try {
    const response = await api.put(`/events/${eventId}/checkin`, {
      userId,
      ...data,
    });
    return {
      success: true,
      message: "Checked in successfully",
    };
  } catch (error) {
    console.error("Check-in error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to check in",
    };
  }
};

// ============================================================
// EVENT FEEDBACK OPERATIONS
// ============================================================

/**
 * Submit feedback for an event
 * @param {string} eventId - Event ID
 * @param {Object} feedbackData - Feedback data
 * @returns {Promise} API response
 */
export const submitEventFeedback = async (eventId, feedbackData) => {
  try {
    const response = await api.post(
      `/events/${eventId}/feedback`,
      feedbackData,
    );
    return {
      success: true,
      message: "Feedback submitted successfully",
      feedback: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("Submit feedback error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to submit feedback",
    };
  }
};

/**
 * Get event feedback
 * @param {string} eventId - Event ID
 * @returns {Promise} API response
 */
export const getEventFeedback = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/feedback`);
    return {
      success: true,
      data: response.data?.data || response.data,
      averageRating: response.data?.averageRating || 0,
    };
  } catch (error) {
    console.error("Get feedback error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch feedback",
      data: [],
      averageRating: 0,
    };
  }
};

// ============================================================
// EVENT STATISTICS
// ============================================================

/**
 * Get event statistics
 * @returns {Promise} API response
 */
export const getEventStats = async () => {
  try {
    const response = await api.get("/events/stats");
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("Get event stats error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch statistics",
    };
  }
};

/**
 * Get event analytics (Admin only)
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getEventAnalytics = async (params = {}) => {
  try {
    const response = await api.get("/events/analytics", { params });
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("Get event analytics error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch analytics",
    };
  }
};

// ============================================================
// EVENT CATEGORIES
// ============================================================

/**
 * Get all event categories
 * @returns {Promise} API response
 */
export const getEventCategories = async () => {
  try {
    const response = await api.get("/events/categories");
    return {
      success: true,
      categories: response.data?.data || response.data || [],
    };
  } catch (error) {
    console.error("Get event categories error:", error);
    return {
      success: false,
      categories: [],
    };
  }
};

// ============================================================
// BULK OPERATIONS (Admin only)
// ============================================================

/**
 * Bulk delete events
 * @param {Array} eventIds - Array of event IDs
 * @returns {Promise} API response
 */
export const bulkDeleteEvents = async (eventIds) => {
  try {
    const response = await api.post("/events/bulk-delete", { eventIds });
    return {
      success: true,
      message: `${eventIds.length} events deleted successfully`,
    };
  } catch (error) {
    console.error("Bulk delete events error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete events",
    };
  }
};

/**
 * Bulk update event status
 * @param {Array} eventIds - Array of event IDs
 * @param {string} status - New status
 * @returns {Promise} API response
 */
export const bulkUpdateEventStatus = async (eventIds, status) => {
  try {
    const response = await api.put("/events/bulk-status", { eventIds, status });
    return {
      success: true,
      message: `${eventIds.length} events updated successfully`,
    };
  } catch (error) {
    console.error("Bulk update events error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update events",
    };
  }
};

// ============================================================
// EXPORT OPERATIONS
// ============================================================

/**
 * Export events to CSV
 * @param {Object} params - Filter parameters
 * @returns {Promise} API response
 */
export const exportEventsToCSV = async (params = {}) => {
  try {
    const response = await api.get("/events/export/csv", {
      params,
      responseType: "blob",
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `events_export_${new Date().toISOString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: "Events exported successfully",
    };
  } catch (error) {
    console.error("Export events error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to export events",
    };
  }
};

/**
 * Export registrations to CSV
 * @param {string} eventId - Event ID
 * @returns {Promise} API response
 */
export const exportRegistrationsToCSV = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/export/registrations`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `registrations_${eventId}_${new Date().toISOString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: "Registrations exported successfully",
    };
  } catch (error) {
    console.error("Export registrations error:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to export registrations",
    };
  }
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get event status color
 * @param {string} status - Event status
 * @returns {string} Color code
 */
export const getEventStatusColor = (status) => {
  const colors = {
    upcoming: "#f59e0b",
    ongoing: "#10b981",
    completed: "#6b7280",
    cancelled: "#ef4444",
    draft: "#9ca3af",
  };
  return colors[status] || "#6366f1";
};

/**
 * Get event status label
 * @param {string} status - Event status
 * @returns {string} Status label
 */
export const getEventStatusLabel = (status) => {
  const labels = {
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    completed: "Completed",
    cancelled: "Cancelled",
    draft: "Draft",
  };
  return labels[status] || status;
};

/**
 * Format event date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatEventDate = (dateString) => {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Format event time
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time
 */
export const formatEventTime = (dateString) => {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Default export for convenience
const eventsAPI = {
  createEvent,
  getEvents,
  getUpcomingEvents,
  getEventById,
  getEventBySlug,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
  registerForEvent,
  cancelRegistration,
  getRegistrationStatus,
  getMyRegistrations,
  getEventRegistrations,
  checkInParticipant,
  submitEventFeedback,
  getEventFeedback,
  getEventStats,
  getEventAnalytics,
  getEventCategories,
  bulkDeleteEvents,
  bulkUpdateEventStatus,
  exportEventsToCSV,
  exportRegistrationsToCSV,
  getEventStatusColor,
  getEventStatusLabel,
  formatEventDate,
  formatEventTime,
};

export default eventsAPI;
