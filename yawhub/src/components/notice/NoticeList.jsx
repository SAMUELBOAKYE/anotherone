// src/components/notice/NoticeList.jsx

import React, { useState, useEffect, useCallback } from "react";
import NoticeCard from "./NoticeCard";
import Pagination from "../common/Pagination";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorAlert from "../common/ErrorAlert";
import { noticeService } from "../../services/noticeService";
import "../../styles/components/NoticeList.css";

const NoticeList = ({
  filters: initialFilters = {},
  initialPage = 1,
  showFilters = true,
  showSearch = true,
  itemsPerPage = 10,
  onNoticeClick,
  variant = "default",
}) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotices, setTotalNotices] = useState(0);
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });
  const [viewMode, setViewMode] = useState("grid");
  const [selectedNotices, setSelectedNotices] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const categories = [
    { value: "", label: "All Categories" },
    { value: "Academic", label: "Academic" },
    { value: "Administrative", label: "Administrative" },
    { value: "Event", label: "Event" },
    { value: "Announcement", label: "Announcement" },
    { value: "Urgent", label: "Urgent" },
    { value: "Exam", label: "Exam" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date" },
    { value: "title", label: "Title" },
    { value: "views", label: "Views" },
    { value: "priority", label: "Priority" },
  ];

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const queryParams = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      if (filters.category) queryParams.category = filters.category;
      if (filters.search) queryParams.search = filters.search;

      const response = await noticeService.getNotices(queryParams);

      // FIXED: Handle response structure safely
      const noticesData =
        response?.data?.notices ||
        response?.data?.data ||
        response?.notices ||
        [];
      const paginationData =
        response?.data?.pagination || response?.pagination || {};

      setNotices(noticesData);
      setTotalPages(paginationData.pages || paginationData.totalPages || 1);
      setTotalNotices(
        paginationData.total ||
          paginationData.totalNotices ||
          noticesData.length,
      );
    } catch (error) {
      console.error("Failed to fetch notices:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load notices. Please try again.",
      );
      setNotices([]);
      setTotalPages(1);
      setTotalNotices(0);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    filters.category,
    filters.search,
    filters.sortBy,
    filters.sortOrder,
    itemsPerPage,
  ]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (currentPage === 1) {
        fetchNotices();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters.search]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      category: "",
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setCurrentPage(1);
  };

  const handleSelectNotice = (noticeId) => {
    setSelectedNotices((prev) =>
      prev.includes(noticeId)
        ? prev.filter((id) => id !== noticeId)
        : [...prev, noticeId],
    );
  };

  const handleSelectAll = () => {
    if (selectedNotices.length === notices.length) {
      setSelectedNotices([]);
    } else {
      setSelectedNotices(notices.map((notice) => notice._id || notice.id));
    }
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedNotices.length} notice(s)?`,
      )
    ) {
      try {
        await noticeService.bulkDeleteNotices(selectedNotices);
        fetchNotices();
        setSelectedNotices([]);
        setIsBulkMode(false);
      } catch (error) {
        setError("Failed to delete selected notices");
      }
    }
  };

  const handleExport = () => {
    const exportData = notices.map((notice) => ({
      title: notice.title,
      category: notice.category,
      content: notice.content,
      createdAt: new Date(notice.createdAt).toLocaleDateString(),
      views: notice.views,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notices_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="notice-list-loading">
        <LoadingSpinner size="large" text="Loading notices..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="notice-list-error">
        <ErrorAlert message={error} onClose={() => setError("")} />
        <button className="retry-btn" onClick={fetchNotices}>
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
          Try Again
        </button>
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="notice-list-empty">
        {showFilters && (
          <div className="notice-filters">
            {/* Simplified filter rendering for empty state */}
          </div>
        )}
        <div className="empty-state">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M22 12h-4l-3 9-4-18-3 9H2" />
          </svg>
          <h3>No notices found</h3>
          <p>Try adjusting your search or filter criteria</p>
          {(filters.category || filters.search) && (
            <button
              className="clear-filters-empty"
              onClick={handleClearFilters}
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="notice-list-container">
      {showFilters && (
        <div className="notice-filters">
          <div className="filters-row">
            {showSearch && (
              <div className="filter-group search-group">
                <div className="search-input-wrapper">
                  <svg
                    className="search-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search notices..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                  />
                  {filters.search && (
                    <button
                      className="clear-search"
                      onClick={() => handleFilterChange("search", "")}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="filter-group">
              <select
                className="filter-select"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                className="filter-select"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Sort by {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <button
                className={`sort-order-btn ${filters.sortOrder}`}
                onClick={() =>
                  handleFilterChange(
                    "sortOrder",
                    filters.sortOrder === "desc" ? "asc" : "desc",
                  )
                }
                aria-label={`Sort ${filters.sortOrder === "desc" ? "ascending" : "descending"}`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {filters.sortOrder === "desc" ? (
                    <polyline points="6 9 12 15 18 9" />
                  ) : (
                    <polyline points="18 15 12 9 6 15" />
                  )}
                </svg>
              </button>
            </div>

            {(filters.category || filters.search) && (
              <div className="filter-group">
                <button
                  className="clear-filters-btn"
                  onClick={handleClearFilters}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="filters-actions">
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
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
              </button>
              <button
                className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
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
              </button>
            </div>

            <button className="export-btn" onClick={handleExport}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>

            <button
              className={`bulk-mode-btn ${isBulkMode ? "active" : ""}`}
              onClick={() => setIsBulkMode(!isBulkMode)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
              Bulk Actions
            </button>
          </div>
        </div>
      )}

      {isBulkMode && (
        <div className="bulk-bar">
          <div className="bulk-info">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={
                  selectedNotices.length === notices.length &&
                  notices.length > 0
                }
                onChange={handleSelectAll}
              />
              <span>Select All ({notices.length})</span>
            </label>
            <span className="bulk-count">
              {selectedNotices.length} selected
            </span>
          </div>
          <div className="bulk-actions">
            <button className="bulk-delete-btn" onClick={handleBulkDelete}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4h8v2" />
              </svg>
              Delete Selected
            </button>
            <button
              className="bulk-cancel-btn"
              onClick={() => {
                setIsBulkMode(false);
                setSelectedNotices([]);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="notice-stats">
        <div className="stats-info">
          <span className="stats-count">
            Showing <strong>{notices.length}</strong> of{" "}
            <strong>{totalNotices}</strong> notices
          </span>
          {filters.search && (
            <span className="stats-search">
              Search results for: "{filters.search}"
            </span>
          )}
        </div>
        <div className="stats-refresh">
          <button className="refresh-btn" onClick={fetchNotices}>
            <svg
              width="14"
              height="14"
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
            Refresh
          </button>
        </div>
      </div>

      <div
        className={`notice-list ${viewMode === "grid" ? "grid-view" : "list-view"} ${variant}`}
      >
        {notices.map((notice) => (
          <div key={notice._id || notice.id} className="notice-list-item">
            {isBulkMode && (
              <div className="notice-checkbox">
                <input
                  type="checkbox"
                  checked={selectedNotices.includes(notice._id || notice.id)}
                  onChange={() => handleSelectNotice(notice._id || notice.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <NoticeCard
              notice={notice}
              variant={viewMode === "list" ? "compact" : "default"}
              onClick={onNoticeClick}
            />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="notice-pagination">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showTotal={true}
            totalItems={totalNotices}
            pageSize={itemsPerPage}
          />
        </div>
      )}
    </div>
  );
};

export default NoticeList;
