// src/services/eventService.js

import api from "./api";
import { API_ENDPOINTS } from "./apiEndpoints";
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from "./apiErrors";
import toast from "react-hot-toast";

// ======================================================
// CONSTANTS
// ======================================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const EVENT_CACHE_KEY = "events_cache";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Event status constants
export const EVENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  POSTPONED: "postponed",
};

// Event type constants
export const EVENT_TYPES = {
  WORKSHOP: "workshop",
  SEMINAR: "seminar",
  CONFERENCE: "conference",
  WEBINAR: "webinar",
  MEETUP: "meetup",
  TRAINING: "training",
  COMPETITION: "competition",
  SOCIAL: "social",
  OTHER: "other",
};

// Registration status constants
export const REGISTRATION_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  WAITLISTED: "waitlisted",
  ATTENDED: "attended",
  NO_SHOW: "no_show",
};

// ======================================================
// EVENT SERVICE CLASS
// ======================================================

class EventService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.initCache();
  }

  initCache() {
    try {
      const cached = localStorage.getItem(EVENT_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        Object.entries(data).forEach(([key, value]) => {
          if (Date.now() - value.timestamp < CACHE_DURATION) {
            this.cache.set(key, value.data);
          }
        });
      }
    } catch (error) {
      console.error("Failed to load event cache:", error);
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
      localStorage.setItem(EVENT_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Failed to persist event cache:", error);
    }
  }

  getCacheKey(endpoint, params = {}) {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  clearCache(eventId = null) {
    if (eventId) {
      const keysToDelete = [];
      this.cache.forEach((_, key) => {
        if (key.includes(`event:${eventId}`) || key.includes("events:")) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
    this.persistCache();
  }

  clearAllCache() {
    this.clearCache();
    toast.success("Event cache cleared successfully");
  }

  async retryRequest(fn, retries = MAX_RETRIES) {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && error.response?.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return this.retryRequest(fn, retries - 1);
      }
      throw error;
    }
  }

  async getEvents(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        type = "",
        status = "",
        startDate = null,
        endDate = null,
        location = "",
        organizer = "",
        isFree = null,
        hasCapacity = null,
        sortBy = "startDate",
        sortOrder = "asc",
        featured = null,
        category = "",
        tags = [],
        ...filters
      } = params;

      const cacheKey = this.getCacheKey("events", params);

      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      if (this.pendingRequests.has(cacheKey)) {
        return this.pendingRequests.get(cacheKey);
      }

      const requestPromise = this.retryRequest(async () => {
        // FIXED: Use correct API endpoint - /api/events instead of /
        const response = await api.get("/events", {
          params: {
            page,
            limit,
            search,
            type,
            status,
            startDate,
            endDate,
            location,
            organizer,
            isFree,
            hasCapacity,
            sortBy,
            sortOrder,
            featured,
            category,
            tags: tags.join(","),
            ...filters,
          },
        });

        // Ensure consistent response structure
        const data = response.data;

        // Transform response if needed to maintain consistency
        const transformedData = {
          data: {
            events: data.events || data.data || [],
            pagination: data.pagination || {
              page: page,
              pages: Math.ceil((data.total || 0) / limit),
              total: data.total || 0,
            },
          },
        };

        this.cache.set(cacheKey, transformedData);
        this.persistCache();
        return transformedData;
      });

      this.pendingRequests.set(cacheKey, requestPromise);

      try {
        const result = await requestPromise;
        return result;
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    } catch (error) {
      this.handleError(error, "fetching events");
      // Return empty data structure on error
      return {
        data: {
          events: [],
          pagination: { page: 1, pages: 1, total: 0 },
        },
      };
    }
  }

  async getEventById(id, options = {}) {
    try {
      if (!id) {
        throw new ValidationError("Event ID is required");
      }

      const { forceRefresh = false, include = [] } = options;
      const cacheKey = this.getCacheKey(`event:${id}`, { include });

      if (!forceRefresh && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const response = await this.retryRequest(async () => {
        return await api.get(`/events/${id}`, {
          params: { include: include.join(",") },
        });
      });

      const eventData = response.data;
      this.cache.set(cacheKey, eventData);
      this.persistCache();

      return eventData;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundError("Event not found");
      }
      this.handleError(error, `fetching event ${id}`);
      throw error;
    }
  }

  async createEvent(eventData) {
    try {
      const validation = this.validateEventData(eventData);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join(", "));
      }

      const sanitizedData = this.sanitizeEventData(eventData);
      const response = await api.post("/events", sanitizedData);

      this.clearCache();
      toast.success("Event created successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "creating event");
      throw error;
    }
  }

  async updateEvent(id, eventData) {
    try {
      if (!id) {
        throw new ValidationError("Event ID is required");
      }

      const validation = this.validateEventData(eventData, true);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join(", "));
      }

      const sanitizedData = this.sanitizeEventData(eventData);
      const response = await api.put(`/events/${id}`, sanitizedData);

      this.clearCache(id);
      toast.success("Event updated successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, `updating event ${id}`);
      throw error;
    }
  }

  async deleteEvent(id, permanent = false) {
    try {
      if (!id) {
        throw new ValidationError("Event ID is required");
      }

      const response = await api.delete(`/events/${id}`, {
        params: { permanent },
      });

      this.clearCache(id);
      toast.success("Event deleted successfully");
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new AuthorizationError(
          "You do not have permission to delete this event",
        );
      }
      this.handleError(error, `deleting event ${id}`);
      throw error;
    }
  }

  async registerForEvent(eventId, registrationData = {}) {
    try {
      if (!eventId) {
        throw new ValidationError("Event ID is required");
      }

      const validation = this.validateRegistrationData(registrationData);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join(", "));
      }

      const response = await api.post(
        `/events/${eventId}/register`,
        registrationData,
      );

      this.clearCache(eventId);
      toast.success("Successfully registered for event");
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("You are already registered for this event");
      } else if (error.response?.status === 400) {
        toast.error("Event is full or registration is closed");
      } else {
        this.handleError(error, "registering for event");
      }
      throw error;
    }
  }

  async cancelRegistration(eventId) {
    try {
      if (!eventId) {
        throw new ValidationError("Event ID is required");
      }

      const response = await api.delete(`/events/${eventId}/register`);
      this.clearCache(eventId);
      toast.success("Registration cancelled successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "cancelling registration");
      throw error;
    }
  }

  async getUserRegistrations(params = {}) {
    try {
      const { page = 1, limit = 20, status = "", upcoming = null } = params;
      const response = await api.get("/events/my-registrations", {
        params: { page, limit, status, upcoming },
      });
      return response.data;
    } catch (error) {
      this.handleError(error, "fetching user registrations");
      throw error;
    }
  }

  async getEventRegistrations(eventId, params = {}) {
    try {
      if (!eventId) {
        throw new ValidationError("Event ID is required");
      }

      const { page = 1, limit = 20, status = "", search = "" } = params;
      const response = await api.get(`/events/${eventId}/registrations`, {
        params: { page, limit, status, search },
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new AuthorizationError(
          "You do not have permission to view registrations",
        );
      }
      this.handleError(error, "fetching event registrations");
      throw error;
    }
  }

  async updateRegistrationStatus(eventId, registrationId, status, notes = "") {
    try {
      if (!eventId || !registrationId) {
        throw new ValidationError("Event ID and Registration ID are required");
      }

      const validStatuses = Object.values(REGISTRATION_STATUS);
      if (!validStatuses.includes(status)) {
        throw new ValidationError("Invalid registration status");
      }

      const response = await api.put(
        `/events/${eventId}/registrations/${registrationId}/status`,
        {
          status,
          notes,
        },
      );

      this.clearCache(eventId);
      toast.success(`Registration status updated to ${status}`);
      return response.data;
    } catch (error) {
      this.handleError(error, "updating registration status");
      throw error;
    }
  }

  async bulkUpdateRegistrationStatus(eventId, registrationIds, status) {
    try {
      if (!eventId || !registrationIds || registrationIds.length === 0) {
        throw new ValidationError("Event ID and registration IDs are required");
      }

      const validStatuses = Object.values(REGISTRATION_STATUS);
      if (!validStatuses.includes(status)) {
        throw new ValidationError("Invalid registration status");
      }

      const response = await api.post(
        `/events/${eventId}/registrations/bulk-update`,
        {
          registrationIds,
          status,
        },
      );

      this.clearCache(eventId);
      toast.success(
        `${registrationIds.length} registration(s) updated to ${status}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "bulk updating registration status");
      throw error;
    }
  }

  async exportRegistrations(eventId, format = "csv") {
    try {
      if (!eventId) {
        throw new ValidationError("Event ID is required");
      }

      const response = await api.get(
        `/events/${eventId}/registrations/export`,
        {
          params: { format },
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `event_${eventId}_registrations_${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Registrations exported successfully");
      return response.data;
    } catch (error) {
      this.handleError(error, "exporting registrations");
      throw error;
    }
  }

  async getUpcomingEvents(limit = 5) {
    try {
      const response = await api.get("/events/upcoming", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error, "fetching upcoming events");
      // Return empty array on error
      return [];
    }
  }

  async getFeaturedEvents(limit = 3) {
    try {
      const response = await api.get("/events/featured", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error, "fetching featured events");
      return [];
    }
  }

  async getEventCategories() {
    try {
      const cacheKey = "event_categories";

      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const response = await api.get("/events/categories");
      const categories = response.data;

      this.cache.set(cacheKey, categories);
      this.persistCache();

      return categories;
    } catch (error) {
      this.handleError(error, "fetching event categories");
      return [];
    }
  }

  async getEventStatistics(eventId = null) {
    try {
      const url = eventId
        ? `/events/${eventId}/statistics`
        : "/events/statistics";
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      this.handleError(error, "fetching event statistics");
      return null;
    }
  }

  validateEventData(eventData, isUpdate = false) {
    const errors = [];

    if (!isUpdate || eventData.title !== undefined) {
      if (!eventData.title || eventData.title.trim().length === 0) {
        errors.push("Event title is required");
      } else if (eventData.title.length < 3) {
        errors.push("Event title must be at least 3 characters");
      } else if (eventData.title.length > 200) {
        errors.push("Event title must be less than 200 characters");
      }
    }

    if (!isUpdate || eventData.description !== undefined) {
      if (!eventData.description || eventData.description.trim().length === 0) {
        errors.push("Event description is required");
      } else if (eventData.description.length < 20) {
        errors.push("Event description must be at least 20 characters");
      }
    }

    if (!isUpdate || eventData.startDate !== undefined) {
      if (!eventData.startDate) {
        errors.push("Start date is required");
      } else if (new Date(eventData.startDate) < new Date()) {
        errors.push("Start date cannot be in the past");
      }
    }

    if (!isUpdate || eventData.endDate !== undefined) {
      if (!eventData.endDate) {
        errors.push("End date is required");
      } else if (
        eventData.startDate &&
        new Date(eventData.endDate) <= new Date(eventData.startDate)
      ) {
        errors.push("End date must be after start date");
      }
    }

    if (!isUpdate || eventData.location !== undefined) {
      if (!eventData.location || eventData.location.trim().length === 0) {
        errors.push("Event location is required");
      }
    }

    if (!isUpdate || eventData.capacity !== undefined) {
      if (eventData.capacity !== undefined && eventData.capacity < 0) {
        errors.push("Capacity cannot be negative");
      }
    }

    if (!isUpdate || eventData.type !== undefined) {
      if (
        eventData.type &&
        !Object.values(EVENT_TYPES).includes(eventData.type)
      ) {
        errors.push("Invalid event type");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateRegistrationData(registrationData) {
    const errors = [];

    if (registrationData.name && registrationData.name.length < 2) {
      errors.push("Name must be at least 2 characters");
    }

    if (registrationData.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(registrationData.email)) {
        errors.push("Invalid email format");
      }
    }

    if (registrationData.phone) {
      const phoneRegex =
        /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(registrationData.phone)) {
        errors.push("Invalid phone number format");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  sanitizeEventData(eventData) {
    const sanitized = {};

    if (eventData.title !== undefined) {
      sanitized.title = eventData.title.trim().replace(/[<>]/g, "");
    }

    if (eventData.description !== undefined) {
      sanitized.description = eventData.description.trim();
    }

    if (eventData.location !== undefined) {
      sanitized.location = eventData.location.trim().replace(/[<>]/g, "");
    }

    if (eventData.startDate !== undefined) {
      sanitized.startDate = new Date(eventData.startDate).toISOString();
    }

    if (eventData.endDate !== undefined) {
      sanitized.endDate = new Date(eventData.endDate).toISOString();
    }

    if (eventData.capacity !== undefined) {
      sanitized.capacity = Math.max(0, parseInt(eventData.capacity) || 0);
    }

    if (eventData.type !== undefined) {
      sanitized.type = eventData.type;
    }

    if (eventData.status !== undefined) {
      sanitized.status = eventData.status;
    }

    if (eventData.price !== undefined) {
      sanitized.price = Math.max(0, parseFloat(eventData.price) || 0);
    }

    if (eventData.imageUrl !== undefined) {
      sanitized.imageUrl = eventData.imageUrl;
    }

    if (eventData.tags !== undefined) {
      sanitized.tags = Array.isArray(eventData.tags) ? eventData.tags : [];
    }

    return sanitized;
  }

  handleError(error, context) {
    console.error(`Event Service Error (${context}):`, error);

    if (error.response?.status === 404) {
      toast.error("Event not found");
    } else if (error.response?.status === 403) {
      toast.error("You do not have permission to perform this action");
    } else if (error.response?.status === 409) {
      toast.error("Conflict with existing data");
    } else if (error.response?.status === 400) {
      toast.error(error.response?.data?.message || "Invalid request");
    } else if (!error.response) {
      toast.error("Network error. Please check your connection.");
    } else if (error instanceof ValidationError) {
      toast.error(error.message);
    } else {
      toast.error(`Failed to ${context}. Please try again.`);
    }
  }
}

// Create and export singleton instance
const eventService = new EventService();
export default eventService;
