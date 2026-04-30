// src/components/event/EventList.jsx

import React, { useState, useEffect, useCallback } from "react";
import EventCard from "./EventCard";
import Pagination from "../common/Pagination";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorAlert from "../common/ErrorAlert";
import eventService from "../../services/eventService";
import "../../styles/components/EventList.css";

const EventList = ({
  filters: initialFilters = {},
  initialPage = 1,
  viewMode: initialViewMode = "grid",
}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [filters, setFilters] = useState({
    eventType: "",
    status: "upcoming",
    search: "",
    ...initialFilters,
  });

  const renderIcon = (iconName) => {
    const icons = {
      grid: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
      list: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
      calendar: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      filter: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3" />
        </svg>
      ),
      refresh: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
          <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
        </svg>
      ),
    };
    return icons[iconName];
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const queryParams = {
        page: currentPage,
        limit: 9,
        type: filters.eventType || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        search: filters.search || undefined,
      };

      const response = await eventService.getEvents(queryParams);

      // FIXED: Handle response structure safely
      const eventsData =
        response?.data?.events ||
        response?.data?.data ||
        response?.events ||
        [];
      const paginationData =
        response?.data?.pagination || response?.pagination || {};

      setEvents(eventsData);
      setTotalPages(paginationData.pages || paginationData.totalPages || 1);
      setTotalEvents(
        paginationData.total || paginationData.totalEvents || eventsData.length,
      );
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch events",
      );
      setEvents([]);
      setTotalPages(1);
      setTotalEvents(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters.eventType, filters.status, filters.search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchEvents();
  };

  const eventTypes = [
    { value: "", label: "All Types" },
    { value: "academic", label: "Academic" },
    { value: "exam", label: "Exam" },
    { value: "registration", label: "Registration" },
    { value: "meeting", label: "Meeting" },
    { value: "holiday", label: "Holiday" },
    { value: "workshop", label: "Workshop" },
    { value: "seminar", label: "Seminar" },
  ];

  const statusOptions = [
    { value: "upcoming", label: "Upcoming" },
    { value: "ongoing", label: "Ongoing" },
    { value: "past", label: "Past" },
    { value: "all", label: "All Events" },
  ];

  if (loading) {
    return (
      <div className="event-list-loading">
        <LoadingSpinner size="large" text="Loading events..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-list-error">
        <ErrorAlert message={error} onClose={() => setError("")} />
        <button className="retry-btn" onClick={handleRefresh}>
          {renderIcon("refresh")}
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="event-list-wrapper">
      {/* Filters Bar */}
      <div className="event-filters-bar">
        <div className="filters-left">
          <div className="filter-group">
            <select
              value={filters.eventType}
              onChange={(e) => handleFilterChange("eventType", e.target.value)}
              className="filter-select"
            >
              {eventTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="filter-select"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filters-right">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              {renderIcon("grid")}
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              {renderIcon("list")}
            </button>
          </div>

          <button className="refresh-btn" onClick={handleRefresh}>
            {renderIcon("refresh")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="event-stats">
        <div className="stats-info">
          <span className="stats-count">
            Found <strong>{totalEvents}</strong> events
          </span>
          {filters.eventType && (
            <span className="stats-filter">
              {renderIcon("filter")}
              {eventTypes.find((t) => t.value === filters.eventType)?.label}
            </span>
          )}
          {filters.status !== "all" && filters.status !== "upcoming" && (
            <span className="stats-filter">
              {renderIcon("calendar")}
              {statusOptions.find((s) => s.value === filters.status)?.label}
            </span>
          )}
        </div>
      </div>

      {/* Events Grid/List */}
      {events.length === 0 ? (
        <div className="event-list-empty">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3>No events found</h3>
          <p>
            Try adjusting your filters or check back later for upcoming events.
          </p>
          {(filters.eventType || filters.status !== "upcoming") && (
            <button
              className="clear-filters-btn"
              onClick={() => {
                setFilters({ eventType: "", status: "upcoming", search: "" });
                setCurrentPage(1);
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className={`event-list ${viewMode === "grid" ? "grid-view" : "list-view"}`}
          >
            {events.map((event) => (
              <EventCard
                key={event._id || event.id}
                event={event}
                variant={viewMode === "list" ? "compact" : "default"}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="event-pagination">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                showTotal={true}
                totalItems={totalEvents}
                pageSize={9}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventList;
