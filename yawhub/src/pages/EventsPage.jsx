// src/pages/EventsPage.jsx - Plain CSS Version
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiBookmark,
  FiBookmark as FiBookmarkSolid,
  FiArrowRight,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiGrid,
  FiList,
  FiStar,
  FiHeart,
  FiShare2,
  FiEye,
  FiTrendingUp,
} from "react-icons/fi";
import {
  MdEvent,
  MdLocationOn,
  MdPeople,
  MdCalendarToday,
  MdAccessTime,
  MdAdd,
  MdClearAll,
  MdTune,
  MdFilterList,
  MdStar,
  MdFavorite,
  MdShare,
  MdVisibility,
  MdTrendingUp,
} from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import "../styles/components/EventsPage.css";

// Category Configuration
const CAT_CFG = {
  conference: {
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.25)",
    icon: "🎤",
    grad: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
    label: "Conference",
  },
  workshop: {
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.2)",
    icon: "🛠️",
    grad: "linear-gradient(135deg,#d97706,#fbbf24)",
    label: "Workshop",
  },
  academic: {
    color: "#22d3ee",
    glow: "rgba(34,211,238,0.2)",
    icon: "🎓",
    grad: "linear-gradient(135deg,#0891b2,#22d3ee)",
    label: "Academic",
  },
  social: {
    color: "#34d399",
    glow: "rgba(52,211,153,0.2)",
    icon: "🎉",
    grad: "linear-gradient(135deg,#059669,#34d399)",
    label: "Social",
  },
  career: {
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.2)",
    icon: "💼",
    grad: "linear-gradient(135deg,#7c3aed,#a78bfa)",
    label: "Career",
  },
  sports: {
    color: "#f87171",
    glow: "rgba(248,113,113,0.2)",
    icon: "🏅",
    grad: "linear-gradient(135deg,#dc2626,#f87171)",
    label: "Sports",
  },
};

const getCat = (c) =>
  CAT_CFG[c] || {
    color: "#64748b",
    glow: "rgba(100,116,139,0.2)",
    icon: "📌",
    grad: "linear-gradient(135deg,#475569,#64748b)",
    label: "Event",
  };

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "conference", label: "Conference" },
  { value: "workshop", label: "Workshop" },
  { value: "academic", label: "Academic" },
  { value: "social", label: "Social" },
  { value: "career", label: "Career" },
  { value: "sports", label: "Sports" },
];

const SORT_OPTIONS = [
  { value: "date_asc", label: "Soonest First" },
  { value: "date_desc", label: "Latest First" },
  { value: "capacity", label: "Most Popular" },
  { value: "title", label: "A – Z" },
];

const SAMPLE_EVENTS = [
  {
    id: 1,
    title: "Annual Tech Conference 2025",
    description:
      "Join us for a full-day technology conference featuring keynotes from industry leaders, hands-on workshops, and networking opportunities.",
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000 + 8 * 3600000).toISOString(),
    location: "Main Auditorium, Block A",
    category: "conference",
    status: "upcoming",
    capacity: 500,
    registered: 342,
    organizer: "IT Department",
    tags: ["technology", "networking", "workshop"],
    isFeatured: true,
    registrationOpen: true,
  },
  {
    id: 2,
    title: "Student Leadership Workshop",
    description:
      "An interactive workshop designed to develop leadership skills, communication, and team management among students.",
    date: new Date(Date.now() + 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 3 * 86400000 + 3 * 3600000).toISOString(),
    location: "Conference Room B, Admin Block",
    category: "workshop",
    status: "upcoming",
    capacity: 80,
    registered: 78,
    organizer: "Student Affairs",
    tags: ["leadership", "skills"],
    isFeatured: false,
    registrationOpen: true,
  },
  {
    id: 3,
    title: "Cultural Night 2025",
    description:
      "Celebrate the rich diversity of our university community with performances, food stalls, and cultural exhibitions.",
    date: new Date(Date.now() + 14 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 14 * 86400000 + 5 * 3600000).toISOString(),
    location: "Open Grounds, Main Campus",
    category: "social",
    status: "upcoming",
    capacity: 1000,
    registered: 210,
    organizer: "Cultural Committee",
    tags: ["culture", "diversity"],
    isFeatured: true,
    registrationOpen: true,
  },
  {
    id: 4,
    title: "Research Symposium — Spring",
    description:
      "Present and explore cutting-edge research across all faculties. Open to faculty, postgraduates, and invited undergraduates.",
    date: new Date(Date.now() + 21 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 21 * 86400000 + 6 * 3600000).toISOString(),
    location: "Faculty of Science, Lecture Hall 1",
    category: "academic",
    status: "upcoming",
    capacity: 200,
    registered: 95,
    organizer: "Research Office",
    tags: ["research", "academic"],
    isFeatured: false,
    registrationOpen: true,
  },
  {
    id: 5,
    title: "Career Fair & Recruitment Drive",
    description:
      "Connect with top employers across industries. Bring your CV and dress for success — interviews may happen on the day.",
    date: new Date(Date.now() + 10 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 10 * 86400000 + 4 * 3600000).toISOString(),
    location: "Sports Complex, Ground Floor",
    category: "career",
    status: "upcoming",
    capacity: 600,
    registered: 401,
    organizer: "Career Services",
    tags: ["career", "jobs", "recruitment"],
    isFeatured: true,
    registrationOpen: true,
  },
  {
    id: 6,
    title: "Sports Day 2025",
    description:
      "Annual inter-departmental sports competition. Events include football, basketball, athletics, and table tennis.",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 2 * 86400000 + 8 * 3600000).toISOString(),
    location: "University Sports Grounds",
    category: "sports",
    status: "past",
    capacity: 300,
    registered: 300,
    organizer: "Sports Department",
    tags: ["sports", "competition"],
    isFeatured: false,
    registrationOpen: false,
  },
];

// Helper Functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Skeleton Card Component
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-accent"></div>
    <div className="skeleton-body">
      <div className="skeleton-chip"></div>
      <div className="skeleton-title"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text short"></div>
      <div className="skeleton-meta"></div>
      <div className="skeleton-meta"></div>
      <div className="skeleton-bar"></div>
    </div>
    <div className="skeleton-footer">
      <div className="skeleton-organizer"></div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

// Event Card Component
const EventCard = ({ event, bookmarked, onBookmark, index }) => {
  const navigate = useNavigate();
  const cat = getCat(event.category);
  const isPast = event.status === "past";
  const isFull = event.registered >= event.capacity;
  const percentage = Math.min(
    Math.round((event.registered / event.capacity) * 100),
    100,
  );

  const getPercentageClass = () => {
    if (percentage >= 100) return "full";
    if (percentage >= 90) return "high";
    if (percentage >= 60) return "mid";
    return "low";
  };

  const getFillColor = () => {
    if (percentage >= 100) return "#f87171";
    if (percentage >= 90) return "#fb923c";
    if (percentage >= 60) return "#fbbf24";
    return "#34d399";
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            delay: index * 0.07,
          },
        },
      }}
      initial="hidden"
      animate="visible"
      className={`event-card ${isPast ? "past" : ""}`}
      style={{
        "--cat-color": cat.color,
        "--cat-glow": cat.glow,
        "--cat-bg": `${cat.color}18`,
        "--cat-border": `${cat.color}35`,
        "--cat-grad": cat.grad,
      }}
    >
      <div className="event-card-accent" style={{ background: cat.grad }} />

      <div className="event-card-body">
        <div className="event-card-header">
          <div className="event-card-badges">
            <span
              className="category-chip"
              style={{ background: `${cat.color}18`, color: cat.color }}
            >
              {cat.icon} {cat.label}
            </span>
            {event.isFeatured && (
              <span className="featured-badge">
                <FiStar size={12} /> Featured
              </span>
            )}
            {isPast && <span className="past-badge">Past</span>}
          </div>
          <button className="bookmark-btn" onClick={() => onBookmark(event.id)}>
            {bookmarked ? (
              <FiBookmarkSolid size={18} color="#fbbf24" />
            ) : (
              <FiBookmark size={18} />
            )}
          </button>
        </div>

        <h3 className="event-card-title">{event.title}</h3>
        <p className="event-card-description">
          {event.description.substring(0, 100)}...
        </p>

        <div className="event-meta">
          <div className="meta-row">
            <FiCalendar size={14} className="meta-icon" />
            <span className="meta-text">{formatDate(event.date)}</span>
          </div>
          <div className="meta-row">
            <FiClock size={14} className="meta-icon" />
            <span className="meta-text">
              {formatTime(event.date)} — {formatTime(event.endDate)}
            </span>
          </div>
          <div className="meta-row">
            <FiMapPin size={14} className="meta-icon" />
            <span className="meta-text">{event.location}</span>
          </div>
        </div>

        {!isPast && (
          <div className="capacity-section">
            <div className="capacity-header">
              <span className="capacity-label">
                <FiUsers size={12} /> {event.registered} / {event.capacity}
              </span>
              <span className={`capacity-percent ${getPercentageClass()}`}>
                {isFull ? "FULL" : `${percentage}%`}
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${percentage}%`, background: getFillColor() }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="event-card-footer">
        <span className="event-organizer">By {event.organizer}</span>
        {isPast ? (
          <button
            className="cta-btn disabled"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            View
          </button>
        ) : isFull ? (
          <button
            className="cta-btn full"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            Full
          </button>
        ) : (
          <button
            className="cta-btn primary"
            style={{ background: cat.grad }}
            onClick={() => navigate(`/events/${event.id}`)}
          >
            Register <FiArrowRight size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Stat Pill Component
const StatPill = ({ value, label, emoji, color, delay }) => (
  <motion.div
    className="stat-pill"
    initial={{ opacity: 0, y: 20 }}
    animate={{
      opacity: 1,
      y: 0,
      transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }}
    whileHover={{ scale: 1.03 }}
  >
    <span className="stat-value" style={{ color: color }}>
      {emoji} {value}
    </span>
    <span className="stat-label">{label}</span>
  </motion.div>
);

// Main Events Page Component
const EventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date_asc");
  const [statusFilter, setStatusFilter] = useState("upcoming");
  const [page, setPage] = useState(1);
  const [bookmarked, setBookmarked] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 6;

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setEvents(SAMPLE_EVENTS);
      setLoading(false);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  const handleBookmark = (id) => {
    setBookmarked((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("date_asc");
    setStatusFilter("upcoming");
    setPage(1);
  };

  const hasFilters =
    searchQuery || selectedCategory !== "all" || statusFilter !== "upcoming";

  const filtered = useMemo(() => {
    let result = [...events];
    if (statusFilter !== "all")
      result = result.filter((e) => e.status === statusFilter);
    if (selectedCategory !== "all")
      result = result.filter((e) => e.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      if (sortBy === "date_asc") return new Date(a.date) - new Date(b.date);
      if (sortBy === "date_desc") return new Date(b.date) - new Date(a.date);
      if (sortBy === "capacity") return b.registered - a.registered;
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });
    return result;
  }, [events, searchQuery, selectedCategory, sortBy, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [filtered]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filtered, page],
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const upcomingCount = events.filter((e) => e.status === "upcoming").length;
  const pastCount = events.filter((e) => e.status === "past").length;

  return (
    <div className="events-page">
      {/* Background Elements */}
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>
      <div className="particle p1"></div>
      <div className="particle p2"></div>
      <div className="particle p3"></div>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="hero-title">Upcoming Events</h1>
            <p className="hero-subtitle">
              Discover workshops, conferences, social events and more happening
              at your university.
            </p>
            <div className="stats-row">
              <StatPill
                value={upcomingCount}
                label="Upcoming"
                emoji="📅"
                color="#a78bfa"
                delay={0.2}
              />
              <StatPill
                value={pastCount}
                label="Past"
                emoji="✅"
                color="#34d399"
                delay={0.3}
              />
              <StatPill
                value={bookmarked.length}
                label="Saved"
                emoji="🔖"
                color="#fbbf24"
                delay={0.4}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-section">
        <div className="container">
          {/* Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="filter-bar"
          >
            <div className="filter-bar-main">
              <div className="search-wrapper">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="status-toggles">
                <button
                  className={`status-btn ${statusFilter === "upcoming" ? "active" : ""}`}
                  onClick={() => setStatusFilter("upcoming")}
                >
                  upcoming
                </button>
                <button
                  className={`status-btn ${statusFilter === "past" ? "active" : ""}`}
                  onClick={() => setStatusFilter("past")}
                >
                  past
                </button>
                <button
                  className={`status-btn ${statusFilter === "all" ? "active" : ""}`}
                  onClick={() => setStatusFilter("all")}
                >
                  all
                </button>
              </div>

              <button
                className={`filter-toggle ${showFilters ? "active" : ""}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <MdTune size={18} />
              </button>

              {hasFilters && (
                <button className="clear-btn" onClick={clearFilters}>
                  <MdClearAll size={16} /> Clear
                </button>
              )}

              {isAdmin && (
                <button
                  className="admin-btn"
                  onClick={() => navigate("/events/create")}
                >
                  <MdAdd size={16} /> New Event
                </button>
              )}
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="advanced-filters"
                >
                  <div className="filter-group">
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
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results Bar */}
          <div className="results-bar">
            <span className="results-count">
              {loading ? (
                "Loading events..."
              ) : (
                <>
                  <span>{filtered.length}</span> event
                  {filtered.length !== 1 ? "s" : ""} found
                </>
              )}
            </span>
            {hasFilters && (
              <button className="results-clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="events-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="empty-state"
            >
              <div className="empty-icon">🔍</div>
              <h3 className="empty-title">No events found</h3>
              <p className="empty-subtitle">
                Try adjusting your search or filters.
              </p>
              <button className="empty-btn" onClick={clearFilters}>
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <>
              <div className="events-grid">
                {paginated.map((event, i) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    bookmarked={bookmarked.includes(event.id)}
                    onBookmark={handleBookmark}
                    index={i}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className={`pagination-btn ${page === 1 ? "disabled" : ""}`}
                    disabled={page === 1}
                    onClick={() => {
                      setPage((prev) => prev - 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Previous
                  </button>
                  <div className="pagination-pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          className={`pagination-page ${page === p ? "active" : ""}`}
                          onClick={() => {
                            setPage(p);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    className={`pagination-btn ${page === totalPages ? "disabled" : ""}`}
                    disabled={page === totalPages}
                    onClick={() => {
                      setPage((prev) => prev + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
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
    </div>
  );
};

export default EventsPage;
