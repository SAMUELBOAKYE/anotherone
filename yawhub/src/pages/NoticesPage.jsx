// src/pages/NoticesPage.jsx - Plain CSS Version
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiBell,
  FiFlag,
  FiBookmark,
  FiBookmark as FiBookmarkSolid,
  FiShare2,
  FiArrowRight,
  FiClock,
  FiUser,
  FiEye,
  FiThumbsUp,
  FiMessageCircle,
  FiDownload,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiGrid,
  FiList,
  FiFilter,
  FiSliders,
  FiStar,
  FiHeart,
  FiAward,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import {
  MdAnnouncement,
  MdPriorityHigh,
  MdClearAll,
  MdBookmarkBorder,
  MdBookmark,
  MdShare,
  MdArrowForward,
  MdAccessTime,
  MdPerson,
  MdVisibility,
  MdThumbUp,
  MdComment,
  MdDownload,
  MdClose,
  MdExpandMore,
  MdExpandLess,
  MdSchool,
  MdBusiness,
  MdSportsEsports,
  MdInfo,
  MdLabel,
  MdStar,
  MdVerified,
  MdWarning,
  MdCheckCircle,
  MdFilterList,
  MdGridOn,
  MdViewList,
} from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import "../styles/components/NoticesPage.css";

// ============================================================================
// SAMPLE DATA
// ============================================================================
const SAMPLE_NOTICES = [
  {
    id: 1,
    title: "Important: Semester Examination Schedule Released",
    content:
      "The final examination schedule for the Spring 2025 semester has been released. Please check your department notice board for details.",
    summary: "Examination schedule for Spring 2025 is now available.",
    category: "academic",
    priority: "high",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    author: "Academic Affairs",
    views: 1245,
    likes: 89,
    comments: 23,
    isPinned: true,
    isFeatured: true,
    isBookmarked: false,
    tags: ["exams", "academic", "schedule"],
    attachments: ["exam_schedule.pdf"],
  },
  {
    id: 2,
    title: "Career Fair 2025 - Registration Open",
    content:
      "Annual career fair featuring top employers. Register now to secure your spot.",
    summary: "Career fair registration now open.",
    category: "career",
    priority: "medium",
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    author: "Career Services",
    views: 856,
    likes: 45,
    comments: 12,
    isPinned: false,
    isFeatured: true,
    isBookmarked: false,
    tags: ["career", "jobs", "networking"],
  },
  {
    id: 3,
    title: "Sports Day 2025 - Call for Participants",
    content:
      "Annual sports day competition. Register your teams before the deadline.",
    summary: "Sports day participation registration.",
    category: "sports",
    priority: "medium",
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    author: "Sports Department",
    views: 432,
    likes: 67,
    comments: 8,
    isPinned: false,
    isFeatured: false,
    isBookmarked: false,
    tags: ["sports", "competition"],
  },
  {
    id: 4,
    title: "Scholarship Opportunities for International Students",
    content:
      "Multiple scholarship opportunities available for international students.",
    summary: "Scholarship applications now open.",
    category: "scholarship",
    priority: "high",
    date: new Date(Date.now() - 10 * 86400000).toISOString(),
    author: "Financial Aid Office",
    views: 2100,
    likes: 156,
    comments: 34,
    isPinned: true,
    isFeatured: true,
    isBookmarked: false,
    tags: ["scholarship", "financial aid", "international"],
  },
];

const NOTICE_CATEGORIES = [
  {
    value: "all",
    label: "All Categories",
    icon: <MdAnnouncement size={16} />,
    color: "#6366f1",
  },
  {
    value: "academic",
    label: "Academic",
    icon: <MdSchool size={16} />,
    color: "#3b82f6",
  },
  {
    value: "career",
    label: "Career",
    icon: <MdBusiness size={16} />,
    color: "#8b5cf6",
  },
  {
    value: "sports",
    label: "Sports",
    icon: <MdSportsEsports size={16} />,
    color: "#ef4444",
  },
  {
    value: "scholarship",
    label: "Scholarship",
    icon: <MdSchool size={16} />,
    color: "#10b981",
  },
  {
    value: "general",
    label: "General",
    icon: <MdAnnouncement size={16} />,
    color: "#6b7280",
  },
];

const PRIORITY_CONFIG = {
  high: {
    label: "High Priority",
    color: "#ef4444",
    icon: <FiAlertCircle size={12} />,
  },
  medium: {
    label: "Medium Priority",
    color: "#f59e0b",
    icon: <FiFlag size={12} />,
  },
  low: {
    label: "Low Priority",
    color: "#10b981",
    icon: <FiCheckCircle size={12} />,
  },
};

const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "views", label: "Most Viewed" },
  { value: "likes", label: "Most Liked" },
  { value: "comments", label: "Most Discussed" },
];

const formatDate = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const truncateText = (text, maxLength = 150) =>
  text.length <= maxLength ? text : text.substring(0, maxLength) + "...";

// ============================================================================
// NOTICE CARD COMPONENT
// ============================================================================
const NoticeCard = ({ notice, onBookmark, onLike, onViewDetails, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(notice.isBookmarked);
  const priorityConfig = PRIORITY_CONFIG[notice.priority];
  const categoryConfig = NOTICE_CATEGORIES.find(
    (c) => c.value === notice.category,
  );

  const handleLike = () => {
    setLiked(!liked);
    onLike(notice.id);
  };
  const handleBookmarkToggle = () => {
    setBookmarked(!bookmarked);
    onBookmark(notice.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      className="notice-card"
      onClick={() => onViewDetails(notice.id)}
    >
      {notice.priority === "high" && (
        <div
          className="priority-ribbon"
          style={{ backgroundColor: priorityConfig.color }}
        >
          <FiAlertCircle size={14} /> High Priority
        </div>
      )}
      {notice.isPinned && <div className="pinned-badge">📌</div>}

      <div
        className="card-accent"
        style={{
          background: `linear-gradient(90deg, ${priorityConfig.color}, ${priorityConfig.color}40)`,
        }}
      />

      <div className="card-content">
        <div className="card-header">
          <div className="card-badges">
            <span
              className="category-chip"
              style={{
                background: `${categoryConfig?.color}18`,
                color: categoryConfig?.color,
              }}
            >
              {categoryConfig?.icon} {categoryConfig?.label}
            </span>
            <span
              className="priority-chip"
              style={{
                background: `${priorityConfig.color}18`,
                color: priorityConfig.color,
              }}
            >
              {priorityConfig.icon} {priorityConfig.label}
            </span>
            {notice.isFeatured && (
              <span className="featured-chip">
                <FiStar size={12} /> Featured
              </span>
            )}
          </div>
          <button
            className="bookmark-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleBookmarkToggle();
            }}
          >
            {bookmarked ? (
              <MdBookmark size={18} color="#fbbf24" />
            ) : (
              <MdBookmarkBorder size={18} />
            )}
          </button>
        </div>

        <h3 className="card-title">{notice.title}</h3>
        <p className="card-description">
          {expanded ? notice.content : truncateText(notice.content, 120)}
        </p>

        {notice.content.length > 120 && (
          <button
            className="read-more-btn"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <>
                <FiChevronUp size={14} /> Show less
              </>
            ) : (
              <>
                <FiChevronDown size={14} /> Read more
              </>
            )}
          </button>
        )}

        <div className="card-meta">
          <div className="meta-item">
            <FiClock size={12} />
            {formatDate(notice.date)}
          </div>
          <div className="meta-item">
            <FiUser size={12} />
            {notice.author}
          </div>
        </div>

        {notice.tags && notice.tags.length > 0 && (
          <div className="card-tags">
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

      <div className="card-divider"></div>

      <div className="card-actions">
        <div className="action-stats">
          <button
            className="action-btn like"
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
          >
            <FiThumbsUp size={14} />{" "}
            <span>{notice.likes + (liked ? 1 : 0)}</span>
          </button>
          <button
            className="action-btn comment"
            onClick={(e) => e.stopPropagation()}
          >
            <FiMessageCircle size={14} /> <span>{notice.comments}</span>
          </button>
          <button
            className="action-btn view"
            onClick={(e) => e.stopPropagation()}
          >
            <FiEye size={14} /> <span>{notice.views}</span>
          </button>
        </div>
        <button
          className="read-more-link"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(notice.id);
          }}
        >
          Read More <FiArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// SKELETON CARD
// ============================================================================
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-accent"></div>
    <div className="skeleton-content">
      <div className="skeleton-chip"></div>
      <div className="skeleton-title"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text short"></div>
      <div className="skeleton-meta"></div>
      <div className="skeleton-tags"></div>
    </div>
    <div className="skeleton-divider"></div>
    <div className="skeleton-actions"></div>
  </div>
);

// ============================================================================
// NOTICE DETAIL MODAL
// ============================================================================
const NoticeDetailModal = ({ open, notice, onClose, onLike, onBookmark }) => {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(notice?.isBookmarked || false);
  if (!notice) return null;

  const priorityConfig = PRIORITY_CONFIG[notice.priority];
  const categoryConfig = NOTICE_CATEGORIES.find(
    (c) => c.value === notice.category,
  );

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-badges">
            <span
              className="category-chip"
              style={{
                background: `${categoryConfig?.color}18`,
                color: categoryConfig?.color,
              }}
            >
              {categoryConfig?.icon} {categoryConfig?.label}
            </span>
            <span
              className="priority-chip"
              style={{
                background: `${priorityConfig.color}18`,
                color: priorityConfig.color,
              }}
            >
              {priorityConfig.icon} {priorityConfig.label}
            </span>
            {notice.isPinned && <span className="pinned-chip">📌 Pinned</span>}
            {notice.isFeatured && (
              <span className="featured-chip">
                <FiStar size={12} /> Featured
              </span>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <h2 className="modal-title">{notice.title}</h2>

        <div className="modal-meta">
          <span>
            <FiUser size={14} /> {notice.author}
          </span>
          <span>
            <FiClock size={14} /> {formatDate(notice.date)}
          </span>
          <span>
            <FiEye size={14} /> {notice.views} views
          </span>
        </div>

        <div className="modal-divider"></div>

        <div className="modal-body">
          <p>{notice.content}</p>
          {notice.attachments?.length > 0 && (
            <div className="modal-attachments">
              <h4>Attachments</h4>
              <div className="attachments-list">
                {notice.attachments.map((file, idx) => (
                  <button key={idx} className="attachment-btn">
                    <FiDownload size={14} /> {file}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-divider"></div>

        <div className="modal-footer">
          <div className="modal-actions">
            <button
              className={`action-btn ${liked ? "active" : ""}`}
              onClick={() => {
                setLiked(!liked);
                onLike(notice.id);
              }}
            >
              <FiThumbsUp size={16} /> {notice.likes + (liked ? 1 : 0)} Likes
            </button>
            <button className="action-btn">
              <FiMessageCircle size={16} /> {notice.comments} Comments
            </button>
            <button className="action-btn">
              <FiShare2 size={16} /> Share
            </button>
            <button
              className={`action-btn ${bookmarked ? "active" : ""}`}
              onClick={() => {
                setBookmarked(!bookmarked);
                onBookmark(notice.id);
              }}
            >
              {bookmarked ? (
                <MdBookmark size={16} />
              ) : (
                <MdBookmarkBorder size={16} />
              )}{" "}
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          </div>
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
const NoticesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const itemsPerPage = 9;

  useEffect(() => {
    setTimeout(() => {
      setNotices(SAMPLE_NOTICES);
      setLoading(false);
    }, 800);
  }, []);

  const showSnackbar = (message, type) => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 3000);
  };

  const filteredNotices = useMemo(() => {
    let list = [...notices];
    if (selectedCategory !== "all")
      list = list.filter((n) => n.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.author.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.date) - new Date(a.date);
      if (sortBy === "date_asc") return new Date(a.date) - new Date(b.date);
      if (sortBy === "views") return b.views - a.views;
      if (sortBy === "likes") return b.likes - a.likes;
      if (sortBy === "comments") return b.comments - a.comments;
      return 0;
    });
    return list;
  }, [notices, searchQuery, selectedCategory, sortBy]);

  const paginatedNotices = filteredNotices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);
  useEffect(() => setCurrentPage(1), [searchQuery, selectedCategory, sortBy]);

  const handleBookmark = (id) => {
    setNotices((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, isBookmarked: !n.isBookmarked } : n,
      ),
    );
    showSnackbar("Bookmark updated", "success");
  };
  const handleLike = (id) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, likes: n.likes + 1 } : n)),
    );
  };
  const handleViewDetails = (id) => {
    const notice = notices.find((n) => n.id === id);
    setSelectedNotice(notice);
    setModalOpen(true);
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, views: n.views + 1 } : n)),
    );
  };
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("date_desc");
  };
  const hasFilters = searchQuery || selectedCategory !== "all";
  const stats = {
    total: notices.length,
    pinned: notices.filter((n) => n.isPinned).length,
    featured: notices.filter((n) => n.isFeatured).length,
    highPriority: notices.filter((n) => n.priority === "high").length,
  };

  return (
    <div className="notices-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="container">
          <h1 className="hero-title">Announcements & Notices</h1>
          <p className="hero-subtitle">
            Stay updated with the latest announcements from the university
            community.
          </p>
          <div className="hero-stats">
            <div>
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Notices</span>
            </div>
            <div>
              <span className="stat-value">{stats.pinned}</span>
              <span className="stat-label">Pinned</span>
            </div>
            <div>
              <span className="stat-value">{stats.featured}</span>
              <span className="stat-label">Featured</span>
            </div>
            <div>
              <span className="stat-value">{stats.highPriority}</span>
              <span className="stat-label">High Priority</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-section">
        <div className="container">
          {/* Filter Bar */}
          <div className="filter-bar glass-card">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {NOTICE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button className="clear-btn" onClick={clearFilters}>
                <FiX size={16} /> Clear
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="results-count">
            {loading
              ? "Loading notices..."
              : `${filteredNotices.length} notice${filteredNotices.length !== 1 ? "s" : ""} found`}
          </div>

          {/* Notices Grid */}
          {loading ? (
            <div className="notices-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="empty-state">
              <MdAnnouncement size={64} />
              <h3>No notices found</h3>
              <p>
                Try adjusting your search or filters to find what you're looking
                for.
              </p>
              <button className="btn-outline" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="notices-grid">
                {paginatedNotices.map((notice, idx) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onBookmark={handleBookmark}
                    onLike={handleLike}
                    onViewDetails={handleViewDetails}
                    index={idx}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className={`pagination-btn ${currentPage === 1 ? "disabled" : ""}`}
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((p) => p - 1);
                      window.scrollTo({ top: 0 });
                    }}
                  >
                    Previous
                  </button>
                  <div className="pagination-pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          className={`pagination-page ${currentPage === p ? "active" : ""}`}
                          onClick={() => {
                            setCurrentPage(p);
                            window.scrollTo({ top: 0 });
                          }}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    className={`pagination-btn ${currentPage === totalPages ? "disabled" : ""}`}
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((p) => p + 1);
                      window.scrollTo({ top: 0 });
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notice Detail Modal */}
      <AnimatePresence>
        {modalOpen && (
          <NoticeDetailModal
            open={modalOpen}
            notice={selectedNotice}
            onClose={() => setModalOpen(false)}
            onLike={handleLike}
            onBookmark={handleBookmark}
          />
        )}
      </AnimatePresence>

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`snackbar ${snackbar.type}`}>
          {snackbar.type === "success" ? (
            <FiCheckCircle size={18} />
          ) : (
            <FiAlertCircle size={18} />
          )}
          <span>{snackbar.message}</span>
          <button
            className="snackbar-close"
            onClick={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default NoticesPage;
