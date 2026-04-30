// src/pages/admin/AdminNoticesPage.jsx - FIXED (removed duplicate declarations)
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiUser,
  FiTag,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiDownload,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiMoreVertical,
  FiCopy,
  FiShare2,
  FiPrinter,
} from "react-icons/fi";
import {
  MdAnnouncement,
  MdDelete,
  MdEdit,
  MdVisibility,
  MdAdd,
  MdRefresh,
  MdDownload,
  MdStar,
  MdAccessTime,
  MdPerson,
  MdCategory,
  MdLabel,
  MdFilterList,
  MdGridView,
  MdViewList,
  MdMoreVert,
} from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/components/AdminNoticesPage.css";

// ============================================================================
// CONSTANTS & CONFIGURATIONS
// ============================================================================

const ITEMS_PER_PAGE = 9;

const CATEGORIES = [
  {
    value: "all",
    label: "All Categories",
    color: "#6366f1",
    icon: <MdCategory size={14} />,
  },
  {
    value: "academic",
    label: "Academic",
    color: "#3b82f6",
    icon: <MdCategory size={14} />,
  },
  {
    value: "career",
    label: "Career",
    color: "#8b5cf6",
    icon: <MdCategory size={14} />,
  },
  {
    value: "sports",
    label: "Sports",
    color: "#ef4444",
    icon: <MdCategory size={14} />,
  },
  {
    value: "scholarship",
    label: "Scholarship",
    color: "#10b981",
    icon: <MdCategory size={14} />,
  },
  {
    value: "general",
    label: "General",
    color: "#6b7280",
    icon: <MdCategory size={14} />,
  },
];

const STATUS_CONFIG = {
  published: {
    label: "Published",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
    icon: <FiCheckCircle size={12} />,
  },
  draft: {
    label: "Draft",
    color: "#6b7280",
    bg: "rgba(107, 114, 128, 0.1)",
    icon: <FiEdit2 size={12} />,
  },
  archived: {
    label: "Archived",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
    icon: <FiClock size={12} />,
  },
};

const PRIORITY_CONFIG = {
  high: { label: "High", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  medium: { label: "Medium", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
  low: { label: "Low", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateString);
};

// ============================================================================
// COMPONENTS
// ============================================================================

const LoadingSkeleton = () => (
  <div className="loading-skeleton">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-header"></div>
        <div className="skeleton-body">
          <div className="skeleton-title"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-meta"></div>
        </div>
        <div className="skeleton-footer"></div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ onClearFilters, hasFilters }) => (
  <div className="empty-state">
    <div className="empty-icon">📭</div>
    <h3>No notices found</h3>
    <p>
      {hasFilters
        ? "Try adjusting your search or filters"
        : "No notices have been created yet"}
    </p>
    {hasFilters && (
      <button className="clear-filters-btn" onClick={onClearFilters}>
        Clear all filters
      </button>
    )}
  </div>
);

const DeleteConfirmDialog = ({ isOpen, notice, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <motion.div
        className="dialog-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3>Delete Notice</h3>
          <button className="dialog-close" onClick={onCancel}>
            <FiX size={20} />
          </button>
        </div>
        <div className="dialog-body">
          <div className="alert-warning">
            <FiAlertCircle size={24} />
            <div>
              <strong>Are you sure?</strong>
              <p>
                This will permanently delete "{notice?.title}" and all
                associated data. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            Delete Notice
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Snackbar = ({ message, type, onClose }) => {
  if (!message) return null;

  return (
    <motion.div
      className={`snackbar ${type}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
    >
      {type === "success" ? (
        <FiCheckCircle size={18} />
      ) : (
        <FiAlertCircle size={18} />
      )}
      <span>{message}</span>
      <button className="snackbar-close" onClick={onClose}>
        <FiX size={14} />
      </button>
    </motion.div>
  );
};

// ============================================================================
// NOTICE CARD COMPONENT
// ============================================================================

const NoticeCard = ({
  notice,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onView,
}) => {
  const category =
    CATEGORIES.find((c) => c.value === notice.category) || CATEGORIES[0];
  const status = STATUS_CONFIG[notice.status] || STATUS_CONFIG.draft;
  const priority = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.medium;

  return (
    <motion.div
      className={`notice-card ${isSelected ? "selected" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className="notice-card-header">
        <div className="notice-badges">
          <span
            className="category-badge"
            style={{ background: `${category.color}18`, color: category.color }}
          >
            {category.label}
          </span>
          <span
            className="status-badge"
            style={{ background: status.bg, color: status.color }}
          >
            {status.icon} {status.label}
          </span>
          <span
            className="priority-badge"
            style={{ background: priority.bg, color: priority.color }}
          >
            {priority.label}
          </span>
          {notice.isPinned && (
            <span className="pinned-badge">
              <FiStar size={12} /> Pinned
            </span>
          )}
        </div>
        <input
          type="checkbox"
          className="notice-checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(notice.id, e.target.checked)}
        />
      </div>

      <div className="notice-card-content" onClick={() => onView(notice.id)}>
        <h3 className="notice-title">{notice.title}</h3>
        <p className="notice-preview">{notice.content.substring(0, 120)}...</p>

        <div className="notice-meta">
          <span title={formatDate(notice.date)}>
            <FiCalendar size={12} /> {formatRelativeTime(notice.date)}
          </span>
          <span>
            <FiUser size={12} /> {notice.author}
          </span>
          <span>
            <FiEye size={12} /> {notice.views.toLocaleString()} views
          </span>
        </div>

        {notice.tags && notice.tags.length > 0 && (
          <div className="notice-tags">
            {notice.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="tag">
                {tag}
              </span>
            ))}
            {notice.tags.length > 3 && (
              <span className="tag-more">+{notice.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="notice-card-actions">
        <button className="action-btn view" onClick={() => onView(notice.id)}>
          <FiEye size={14} /> View
        </button>
        <button className="action-btn edit" onClick={() => onEdit(notice.id)}>
          <FiEdit2 size={14} /> Edit
        </button>
        <button className="action-btn delete" onClick={() => onDelete(notice)}>
          <FiTrash2 size={14} /> Delete
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdminNoticesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotices, setSelectedNotices] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Load notices
  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch from API
      const response = await api.get("/notices/admin");
      setNotices(response.data || []);
    } catch (error) {
      console.error("Failed to load notices:", error);
      // Fallback to sample data for demo
      const SAMPLE_NOTICES = [
        {
          id: 1,
          title: "Important: Semester Examination Schedule Released",
          content:
            "The final examination schedule for the Spring 2025 semester has been released. Please check your department notice board for details.",
          category: "academic",
          priority: "high",
          status: "published",
          date: new Date(Date.now() - 2 * 86400000).toISOString(),
          author: "Academic Affairs",
          views: 1245,
          isPinned: true,
          tags: ["exams", "academic", "schedule"],
        },
        {
          id: 2,
          title: "Career Fair 2025 - Registration Open",
          content:
            "Annual career fair featuring top employers. Register now to secure your spot.",
          category: "career",
          priority: "medium",
          status: "published",
          date: new Date(Date.now() - 5 * 86400000).toISOString(),
          author: "Career Services",
          views: 856,
          isPinned: false,
          tags: ["career", "jobs", "networking"],
        },
        {
          id: 3,
          title: "Sports Day 2025 - Call for Participants",
          content:
            "Annual sports day competition. Register your teams before the deadline.",
          category: "sports",
          priority: "medium",
          status: "draft",
          date: new Date(Date.now() - 7 * 86400000).toISOString(),
          author: "Sports Department",
          views: 432,
          isPinned: false,
          tags: ["sports", "competition"],
        },
        {
          id: 4,
          title: "Scholarship Opportunities for International Students",
          content:
            "Multiple scholarship opportunities available for international students.",
          category: "scholarship",
          priority: "high",
          status: "published",
          date: new Date(Date.now() - 10 * 86400000).toISOString(),
          author: "Financial Aid Office",
          views: 2100,
          isPinned: true,
          tags: ["scholarship", "financial aid", "international"],
        },
        {
          id: 5,
          title: "Campus Cleanup Day",
          content:
            "Join us for a campus-wide cleanup initiative. Volunteers needed.",
          category: "general",
          priority: "low",
          status: "published",
          date: new Date(Date.now() - 3 * 86400000).toISOString(),
          author: "Facilities Management",
          views: 234,
          isPinned: false,
          tags: ["cleanup", "volunteer", "campus"],
        },
      ];
      setNotices(SAMPLE_NOTICES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  // Filter notices
  const filteredNotices = useMemo(() => {
    let result = [...notices];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query) ||
          n.author.toLowerCase().includes(query),
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((n) => n.category === selectedCategory);
    }

    if (selectedStatus !== "all") {
      result = result.filter((n) => n.status === selectedStatus);
    }

    return result;
  }, [notices, searchQuery, selectedCategory, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredNotices.length / ITEMS_PER_PAGE);
  const paginatedNotices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotices, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus]);

  // Handlers
  const showSnackbar = (message, type = "success") => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 4000);
  };

  const handleDeleteNotice = async () => {
    if (!noticeToDelete) return;

    setIsDeleting(true);
    try {
      await api.delete(`/notices/${noticeToDelete.id}`);
      setNotices((prev) => prev.filter((n) => n.id !== noticeToDelete.id));
      showSnackbar("Notice deleted successfully", "success");
      setDeleteDialogOpen(false);
      setNoticeToDelete(null);
    } catch (error) {
      console.error("Failed to delete notice:", error);
      showSnackbar("Failed to delete notice", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedNotices.map((id) => api.delete(`/notices/${id}`)),
      );
      setNotices((prev) => prev.filter((n) => !selectedNotices.includes(n.id)));
      showSnackbar(
        `${selectedNotices.length} notices deleted successfully`,
        "success",
      );
      setSelectedNotices([]);
    } catch (error) {
      console.error("Failed to delete notices:", error);
      showSnackbar("Failed to delete selected notices", "error");
    }
  };

  const handleSelectNotice = (id, checked) => {
    setSelectedNotices((prev) =>
      checked ? [...prev, id] : prev.filter((pid) => pid !== id),
    );
  };

  const handleSelectAll = () => {
    if (selectedNotices.length === paginatedNotices.length) {
      setSelectedNotices([]);
    } else {
      setSelectedNotices(paginatedNotices.map((n) => n.id));
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== "all" || selectedStatus !== "all";

  // Loading state
  if (loading) {
    return (
      <div className="admin-notices-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Manage Notices</h1>
            <p className="page-subtitle">
              Create, edit, and manage all university notices
            </p>
          </div>
          <div className="skeleton-btn"></div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="admin-notices-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Notices</h1>
          <p className="page-subtitle">
            Create, edit, and manage all university announcements
          </p>
        </div>
        <button
          className="create-btn"
          onClick={() => navigate("/admin/notices/create")}
        >
          <FiPlus size={18} /> Create New Notice
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, content, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery("")}>
              <FiX size={16} />
            </button>
          )}
        </div>

        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <FiGrid size={18} />
          </button>
          <button
            className={`view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            <FiList size={18} />
          </button>
        </div>

        <button className="refresh-btn" onClick={loadNotices} title="Refresh">
          <FiRefreshCw size={18} />
        </button>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <span className="results-count">
          {filteredNotices.length} notice
          {filteredNotices.length !== 1 ? "s" : ""} found
        </span>
        {hasActiveFilters && (
          <button className="clear-filters-link" onClick={clearFilters}>
            Clear all filters
          </button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedNotices.length > 0 && (
        <motion.div
          className="bulk-actions-bar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="bulk-info">
            <FiCheckCircle size={16} />
            <span>
              {selectedNotices.length} notice
              {selectedNotices.length !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="bulk-actions">
            <button
              className="bulk-btn export"
              onClick={() => showSnackbar("Export feature coming soon", "info")}
            >
              <FiDownload size={16} /> Export
            </button>
            <button className="bulk-btn delete" onClick={handleBulkDelete}>
              <FiTrash2 size={16} /> Delete Selected
            </button>
          </div>
        </motion.div>
      )}

      {/* Notices Display */}
      {filteredNotices.length === 0 ? (
        <EmptyState
          onClearFilters={clearFilters}
          hasFilters={hasActiveFilters}
        />
      ) : viewMode === "grid" ? (
        <div className="notices-grid">
          {paginatedNotices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              isSelected={selectedNotices.includes(notice.id)}
              onSelect={handleSelectNotice}
              onEdit={(id) => navigate(`/admin/notices/edit/${id}`)}
              onDelete={(notice) => {
                setNoticeToDelete(notice);
                setDeleteDialogOpen(true);
              }}
              onView={(id) => navigate(`/notices/${id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="notices-table-container">
          <table className="notices-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={
                      selectedNotices.length === paginatedNotices.length &&
                      paginatedNotices.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Author</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedNotices.map((notice) => {
                const category =
                  CATEGORIES.find((c) => c.value === notice.category) ||
                  CATEGORIES[0];
                const status =
                  STATUS_CONFIG[notice.status] || STATUS_CONFIG.draft;
                const priority =
                  PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.medium;

                return (
                  <tr key={notice.id} className="notice-table-row">
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selectedNotices.includes(notice.id)}
                        onChange={(e) =>
                          handleSelectNotice(notice.id, e.target.checked)
                        }
                      />
                    </td>
                    <td className="title-cell">
                      <div className="title-name">{notice.title}</div>
                      {notice.isPinned && (
                        <span className="pinned-indicator">
                          <FiStar size={12} /> Pinned
                        </span>
                      )}
                    </td>
                    <td className="category-cell">
                      <span
                        className="category-chip"
                        style={{
                          background: `${category.color}18`,
                          color: category.color,
                        }}
                      >
                        {category.label}
                      </span>
                    </td>
                    <td className="priority-cell">
                      <span
                        className="priority-chip"
                        style={{
                          background: priority.bg,
                          color: priority.color,
                        }}
                      >
                        {priority.label}
                      </span>
                    </td>
                    <td className="status-cell">
                      <span
                        className="status-chip"
                        style={{ background: status.bg, color: status.color }}
                      >
                        {status.icon} {status.label}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(notice.date)}</td>
                    <td className="author-cell">{notice.author}</td>
                    <td className="views-cell">
                      {notice.views.toLocaleString()}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="table-action"
                        onClick={() => navigate(`/notices/${notice.id}`)}
                        title="View"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        className="table-action"
                        onClick={() =>
                          navigate(`/admin/notices/edit/${notice.id}`)
                        }
                        title="Edit"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        className="table-action delete"
                        onClick={() => {
                          setNoticeToDelete(notice);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            <FiChevronLeft size={18} /> Previous
          </button>
          <div className="pagination-pages">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`pagination-page ${currentPage === pageNum ? "active" : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next <FiChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        notice={noticeToDelete}
        onConfirm={handleDeleteNotice}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setNoticeToDelete(null);
        }}
      />

      {/* Snackbar */}
      <AnimatePresence>
        {snackbar.open && (
          <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminNoticesPage;
