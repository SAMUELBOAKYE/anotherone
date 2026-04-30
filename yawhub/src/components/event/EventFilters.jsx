import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/components/EventFilters.css";

const EventFilters = ({
  onFilterChange,
  initialFilters = {},
  showAdvanced = false,
  loading = false
}) => {
  const [filters, setFilters] = useState({
    search: initialFilters.search || "",
    type: initialFilters.type || "all",
    dateRange: initialFilters.dateRange || "upcoming",
    sortBy: initialFilters.sortBy || "date",
    sortOrder: initialFilters.sortOrder || "asc",
    location: initialFilters.location || "",
    capacity: initialFilters.capacity || "all"
  });

  const [focused, setFocused] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(showAdvanced);

  /* =========================
     DEBOUNCE FILTER
  ========================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 400);

    return () => clearTimeout(timer);
  }, [filters]);

  /* =========================
     HANDLERS
  ========================= */
  const handleChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: value,
      sortOrder:
        prev.sortBy === value && prev.sortOrder === "asc" ? "desc" : "asc"
    }));
  };

  const resetFilters = () => {
    const reset = {
      search: "",
      type: "all",
      dateRange: "upcoming",
      sortBy: "date",
      sortOrder: "asc",
      location: "",
      capacity: "all"
    };
    setFilters(reset);
    onFilterChange(reset);
  };

  const hasFilters =
    filters.search ||
    filters.type !== "all" ||
    filters.dateRange !== "upcoming" ||
    filters.location ||
    filters.capacity !== "all";

  /* =========================
     OPTIONS
  ========================= */
  const eventTypes = ["all", "academic", "exam", "meeting"];
  const capacities = ["all", "low", "medium", "high"];
  const sortOptions = ["date", "title", "capacity"];

  /* =========================
     UI
  ========================= */
  return (
    <motion.div
      className="event-filters-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* HEADER */}
      <div className="filters-header">
        <h3 className="filters-title">Filter Events</h3>

        <AnimatePresence>
          {hasFilters && (
            <motion.button
              className="reset-all-btn"
              onClick={resetFilters}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              Reset
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* FILTER GRID */}
      <div className="filters-grid">
        {/* SEARCH */}
        <div className="floating-group">
          <input
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            onFocus={() => setFocused("search")}
            onBlur={() => setFocused("")}
          />
          <label className={filters.search || focused === "search" ? "active" : ""}>
            Search events...
          </label>
        </div>

        {/* TYPE */}
        <div className="floating-group">
          <select
            value={filters.type}
            onChange={(e) => handleChange("type", e.target.value)}
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label className="active">Type</label>
        </div>

        {/* DATE */}
        <div className="floating-group">
          <select
            value={filters.dateRange}
            onChange={(e) => handleChange("dateRange", e.target.value)}
          >
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
          <label className="active">Date</label>
        </div>

        {/* LOCATION */}
        <div className="floating-group">
          <input
            value={filters.location}
            onChange={(e) => handleChange("location", e.target.value)}
            onFocus={() => setFocused("location")}
            onBlur={() => setFocused("")}
          />
          <label className={filters.location || focused === "location" ? "active" : ""}>
            Location
          </label>
        </div>

        {/* ADVANCED TOGGLE */}
        <button
          className="advanced-toggle"
          onClick={() => setShowAdvancedFilters((prev) => !prev)}
        >
          Advanced Filters
        </button>
      </div>

      {/* ADVANCED FILTERS */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            className="advanced-filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="advanced-filters-grid">
              {/* SORT */}
              <div className="sort-buttons">
                {sortOptions.map((opt) => (
                  <button
                    key={opt}
                    className={`sort-btn ${
                      filters.sortBy === opt ? "active" : ""
                    }`}
                    onClick={() => handleSortChange(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* CAPACITY */}
              <div className="floating-group">
                <select
                  value={filters.capacity}
                  onChange={(e) => handleChange("capacity", e.target.value)}
                >
                  {capacities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <label className="active">Capacity</label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTER CHIPS */}
      <AnimatePresence>
        {hasFilters && (
          <motion.div className="filter-chips">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || value === "all" || value === "upcoming") return null;

              return (
                <motion.div
                  key={key}
                  className="chip"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  {key}: {value}
                  <button onClick={() => handleChange(key, "")}>×</button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SKELETON */}
      {loading && (
        <div className="skeleton-container">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default EventFilters;