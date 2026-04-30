// src/components/common/UserTable.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CheckCircle,
  Circle,
  AlertCircle,
  Trash2,
  Edit,
  Mail,
  Briefcase,
  Calendar,
  Shield,
  GraduationCap,
  Eye,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  UserCheck,
  UserX,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/components/UserTable.css";

const ROLE_OPTIONS = [
  { value: "student", label: "Student", icon: GraduationCap, color: "info" },
  { value: "staff", label: "Staff", icon: Briefcase, color: "success" },
  { value: "admin", label: "Admin", icon: Shield, color: "danger" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active", icon: CheckCircle, color: "success" },
  { value: "inactive", label: "Inactive", icon: Circle, color: "warning" },
  {
    value: "suspended",
    label: "Suspended",
    icon: AlertCircle,
    color: "danger",
  },
];

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const tableVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.05 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, x: -100, transition: { duration: 0.3 } },
};

const UserTable = ({
  users = [],
  onRoleChange = () => {},
  onDelete = () => {},
  onStatusChange = () => {},
  updatingRoles = {},
  updatingStatus = {},
  showStatus = false,
  showStudentId = true,
  showDepartment = true,
  sortable = true,
  selectable = false,
  onSelectUser,
  selectedUsers = [],
  onRefresh,
  onExport,
  itemsPerPage: initialItemsPerPage = 10,
  showPagination = true,
  showSearch = true,
  showFilter = true,
  showExport = true,
  className = "",
}) => {
  const safeUsers = React.useMemo(() => {
    if (!users) return [];
    if (Array.isArray(users)) return users;
    if (typeof users === "object") return Object.values(users);
    return [];
  }, [users]);

  const safeSelectedUsers = React.useMemo(() => {
    if (!selectedUsers) return [];
    if (Array.isArray(selectedUsers)) return selectedUsers;
    return [];
  }, [selectedUsers]);

  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [viewMode, setViewMode] = useState("table");
  const [showFilters, setShowFilters] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!safeUsers.length) return [];
    let filtered = [...safeUsers];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          (user?.name || "").toLowerCase().includes(query) ||
          (user?.email || "").toLowerCase().includes(query) ||
          (user?.studentId || "").toLowerCase().includes(query) ||
          (user?.department || "").toLowerCase().includes(query),
      );
    }
    if (roleFilter !== "all")
      filtered = filtered.filter((user) => user?.role === roleFilter);
    if (statusFilter !== "all" && showStatus)
      filtered = filtered.filter((user) => user?.status === statusFilter);
    return filtered;
  }, [safeUsers, searchQuery, roleFilter, statusFilter, showStatus]);

  const sortedUsers = useMemo(() => {
    if (!sortable || !filteredUsers.length) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      let aValue = a?.[sortConfig.key];
      let bValue = b?.[sortConfig.key];
      if (sortConfig.key === "createdAt") {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortConfig, sortable]);

  const paginatedUsers = useMemo(() => {
    if (!showPagination || !sortedUsers.length) return sortedUsers;
    const start = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(start, start + itemsPerPage);
  }, [sortedUsers, currentPage, itemsPerPage, showPagination]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  useEffect(
    () => setCurrentPage(1),
    [searchQuery, roleFilter, statusFilter, itemsPerPage],
  );

  const handleSort = useCallback(
    (key) => {
      if (!sortable) return;
      setSortConfig((prev) => ({
        key,
        direction:
          prev.key === key && prev.direction === "asc" ? "desc" : "asc",
      }));
    },
    [sortable],
  );

  const handleRoleChange = useCallback(
    async (userId, newRole) => {
      if (!userId || !onRoleChange) return;
      try {
        await onRoleChange(userId, newRole);
      } catch (error) {
        console.error("Role change failed:", error);
      }
    },
    [onRoleChange],
  );

  const handleDelete = useCallback(
    (userId, userName) => {
      if (!userId || !onDelete) return;
      if (
        window.confirm(
          `Are you sure you want to delete "${userName || "this user"}"?`,
        )
      )
        onDelete(userId);
    },
    [onDelete],
  );

  const handleBulkDelete = useCallback(() => {
    if (!onDelete || !safeSelectedUsers.length) return;
    if (window.confirm(`Delete ${safeSelectedUsers.length} user(s)?`))
      onDelete(safeSelectedUsers);
  }, [onDelete, safeSelectedUsers]);

  const handleSelectAll = useCallback(
    (e) => {
      if (!onSelectUser || !paginatedUsers.length) return;
      paginatedUsers.forEach(
        (user) => user && user._id && onSelectUser(user._id, e.target.checked),
      );
    },
    [paginatedUsers, onSelectUser],
  );

  const handleSelectUser = useCallback(
    (userId, isChecked) => {
      if (onSelectUser && userId) onSelectUser(userId, isChecked);
    },
    [onSelectUser],
  );

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp size={14} className="sort-active" />
    ) : (
      <ArrowDown size={14} className="sort-active" />
    );
  };

  const getRoleConfig = (role) => {
    const roleConfig =
      ROLE_OPTIONS.find((r) => r.value === role) || ROLE_OPTIONS[0];
    return { ...roleConfig, icon: roleConfig.icon };
  };

  const getStatusConfig = (status) => {
    const statusConfig =
      STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
    return { ...statusConfig, icon: statusConfig.icon };
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      const dateObj = new Date(date);
      const now = new Date();
      const diffDays = Math.ceil(
        Math.abs(now - dateObj) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getGradient = (id) => {
    const gradients = [
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    ];
    return gradients[(id?.length || 0) % gradients.length];
  };

  const handleExport = () => {
    if (!sortedUsers.length) return;
    const headers = ["Name", "Email", "Role", "Status", "Department", "Joined"];
    const data = sortedUsers.map((user) => [
      user?.name || "",
      user?.email || "",
      user?.role || "",
      user?.status || "",
      user?.department || "N/A",
      formatDate(user?.createdAt),
    ]);
    const csvContent = [headers, ...data]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const allSelected = useMemo(
    () =>
      selectable &&
      paginatedUsers.length > 0 &&
      paginatedUsers.every(
        (user) => user && user._id && safeSelectedUsers.includes(user._id),
      ),
    [selectable, paginatedUsers, safeSelectedUsers],
  );
  const someSelected = useMemo(
    () =>
      selectable &&
      paginatedUsers.length > 0 &&
      paginatedUsers.some(
        (user) => user && user._id && safeSelectedUsers.includes(user._id),
      ),
    [selectable, paginatedUsers, safeSelectedUsers],
  );

  if (!safeUsers.length) {
    return (
      <motion.div
        className="user-table-empty"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="empty-state-icon">
          <Users size={64} strokeWidth={1.5} />
        </div>
        <h3>No users found</h3>
        <p>There are no users to display at this time.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`user-table-wrapper ${className}`}
      initial="hidden"
      animate="visible"
      variants={tableVariants}
    >
      {/* Toolbar */}
      <div className="user-table-toolbar">
        <div className="toolbar-left">
          {showSearch && (
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
          {showFilter && (
            <button
              className={`filter-toggle ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
          )}
        </div>
        <div className="toolbar-right">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <TableIcon size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          {onRefresh && (
            <button className="toolbar-btn" onClick={onRefresh}>
              <RefreshCw size={18} />
            </button>
          )}
          {showExport && (
            <button className="toolbar-btn" onClick={onExport || handleExport}>
              <Download size={18} />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="filters-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="filters-grid">
              <div className="filter-group">
                <label>Role</label>
                <div className="filter-options">
                  <button
                    className={`filter-option ${roleFilter === "all" ? "active" : ""}`}
                    onClick={() => setRoleFilter("all")}
                  >
                    All
                  </button>
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      key={role.value}
                      className={`filter-option ${roleFilter === role.value ? "active" : ""}`}
                      onClick={() => setRoleFilter(role.value)}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
              {showStatus && (
                <div className="filter-group">
                  <label>Status</label>
                  <div className="filter-options">
                    <button
                      className={`filter-option ${statusFilter === "all" ? "active" : ""}`}
                      onClick={() => setStatusFilter("all")}
                    >
                      All
                    </button>
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status.value}
                        className={`filter-option ${statusFilter === status.value ? "active" : ""}`}
                        onClick={() => setStatusFilter(status.value)}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="filter-group">
                <label>Items per page</label>
                <select
                  className="items-per-page-select"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} per page
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="filter-actions">
              <button
                className="filter-clear"
                onClick={() => {
                  setRoleFilter("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear all filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results info */}
      <div className="results-info">
        <span>
          Showing <strong>{paginatedUsers.length}</strong> of{" "}
          <strong>{sortedUsers.length}</strong> users
        </span>
        {selectable && someSelected && (
          <span className="selected-info">
            {safeSelectedUsers.length} selected
          </span>
        )}
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                {selectable && (
                  <th className="checkbox-cell">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input)
                            input.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={handleSelectAll}
                      />
                      <span className="checkbox-custom"></span>
                    </label>
                  </th>
                )}
                <th
                  onClick={() => handleSort("name")}
                  className={sortable ? "sortable" : ""}
                >
                  Name{" "}
                  {sortable && (
                    <span className="sort-icon">{getSortIcon("name")}</span>
                  )}
                </th>
                <th
                  onClick={() => handleSort("email")}
                  className={sortable ? "sortable" : ""}
                >
                  Email{" "}
                  {sortable && (
                    <span className="sort-icon">{getSortIcon("email")}</span>
                  )}
                </th>
                {showStudentId && <th>ID</th>}
                {showDepartment && <th>Department</th>}
                <th>Role</th>
                {showStatus && <th>Status</th>}
                <th
                  onClick={() => handleSort("createdAt")}
                  className={sortable ? "sortable" : ""}
                >
                  Joined{" "}
                  {sortable && (
                    <span className="sort-icon">
                      {getSortIcon("createdAt")}
                    </span>
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {paginatedUsers.map((user, index) => {
                  if (!user || !user._id) return null;
                  const roleConfig = getRoleConfig(user.role);
                  const statusConfig = getStatusConfig(user.status || "active");
                  const RoleIcon = roleConfig.icon;
                  const StatusIcon = statusConfig.icon;
                  const isUpdating =
                    updatingRoles[user._id] || updatingStatus[user._id];
                  return (
                    <motion.tr
                      key={user._id}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ delay: index * 0.02 }}
                      className="user-row"
                    >
                      {selectable && (
                        <td className="checkbox-cell">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={safeSelectedUsers.includes(user._id)}
                              onChange={(e) =>
                                handleSelectUser(user._id, e.target.checked)
                              }
                            />
                            <span className="checkbox-custom"></span>
                          </label>
                        </td>
                      )}
                      <td className="user-name-cell">
                        <div className="user-info">
                          <div
                            className="user-avatar"
                            style={{ background: getGradient(user._id) }}
                          >
                            <span>{getInitials(user.name)}</span>
                          </div>
                          <div className="user-details">
                            <span className="user-fullname">
                              {user.name || "Unknown"}
                            </span>
                            {user.username && (
                              <span className="user-username">
                                @{user.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="user-email-cell">
                        <a href={`mailto:${user.email}`} className="email-link">
                          <Mail size={14} />
                          {user.email || "No email"}
                        </a>
                      </td>
                      {showStudentId && (
                        <td className="user-id-cell">
                          <code className="user-id">
                            {user.studentId || "—"}
                          </code>
                        </td>
                      )}
                      {showDepartment && (
                        <td className="user-dept-cell">
                          {user.department || "—"}
                        </td>
                      )}
                      <td className="user-role-cell">
                        <select
                          value={user.role || "student"}
                          onChange={(e) =>
                            handleRoleChange(user._id, e.target.value)
                          }
                          className={`role-select ${roleConfig.color}`}
                          disabled={isUpdating}
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {isUpdating && (
                          <span className="updating-spinner"></span>
                        )}
                      </td>
                      {showStatus && (
                        <td className="user-status-cell">
                          <span
                            className={`status-badge ${statusConfig.color}`}
                          >
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                        </td>
                      )}
                      <td className="user-joined-cell">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="user-actions-cell">
                        <div className="action-buttons">
                          <button
                            className="action-btn view-btn"
                            onClick={() =>
                              (window.location.href = `/admin/users/${user._id}`)
                            }
                            title="View user details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="action-btn edit-btn"
                            onClick={() =>
                              (window.location.href = `/admin/users/${user._id}/edit`)
                            }
                            title="Edit user"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(user._id, user.name)}
                            disabled={user.role === "admin"}
                            title={
                              user.role === "admin"
                                ? "Cannot delete admin users"
                                : "Delete user"
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="user-grid-container">
          <div className="user-grid">
            <AnimatePresence mode="wait">
              {paginatedUsers.map((user, index) => {
                if (!user || !user._id) return null;
                const roleConfig = getRoleConfig(user.role);
                const statusConfig = getStatusConfig(user.status || "active");
                const RoleIcon = roleConfig.icon;
                const StatusIcon = statusConfig.icon;
                return (
                  <motion.div
                    key={user._id}
                    className="user-card"
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="user-card-header">
                      <div
                        className="user-card-avatar"
                        style={{ background: getGradient(user._id) }}
                      >
                        <span>{getInitials(user.name)}</span>
                      </div>
                      {selectable && (
                        <label className="card-checkbox">
                          <input
                            type="checkbox"
                            checked={safeSelectedUsers.includes(user._id)}
                            onChange={(e) =>
                              handleSelectUser(user._id, e.target.checked)
                            }
                          />
                          <span className="checkbox-custom"></span>
                        </label>
                      )}
                    </div>
                    <div className="user-card-body">
                      <h4 className="user-card-name">
                        {user.name || "Unknown"}
                      </h4>
                      <a
                        href={`mailto:${user.email}`}
                        className="user-card-email"
                      >
                        <Mail size={14} />
                        {user.email || "No email"}
                      </a>
                      <div className="user-card-details">
                        {showStudentId && user.studentId && (
                          <div className="user-card-detail">
                            <span className="detail-label">ID:</span>
                            <code>{user.studentId}</code>
                          </div>
                        )}
                        {showDepartment && user.department && (
                          <div className="user-card-detail">
                            <span className="detail-label">Dept:</span>
                            <span>{user.department}</span>
                          </div>
                        )}
                        <div className="user-card-detail">
                          <span className="detail-label">Joined:</span>
                          <span>{formatDate(user.createdAt)}</span>
                        </div>
                      </div>
                      <div className="user-card-badges">
                        <span className={`role-badge ${roleConfig.color}`}>
                          <RoleIcon size={12} />
                          {roleConfig.label}
                        </span>
                        {showStatus && (
                          <span
                            className={`status-badge ${statusConfig.color}`}
                          >
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="user-card-footer">
                      <button
                        className="card-action-btn view"
                        onClick={() =>
                          (window.location.href = `/admin/users/${user._id}`)
                        }
                        title="View user details"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        className="card-action-btn edit"
                        onClick={() =>
                          (window.location.href = `/admin/users/${user._id}/edit`)
                        }
                        title="Edit user"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        className="card-action-btn delete"
                        onClick={() => handleDelete(user._id, user.name)}
                        disabled={user.role === "admin"}
                        title={
                          user.role === "admin"
                            ? "Cannot delete admin users"
                            : "Delete user"
                        }
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="user-table-pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
            Previous
          </button>
          <div className="pagination-pages">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2)
                pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
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
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Bulk Actions */}
      {selectable && someSelected && (
        <motion.div
          className="bulk-actions-bar"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="bulk-actions-info">
            <strong>{safeSelectedUsers.length}</strong> user
            {safeSelectedUsers.length !== 1 ? "s" : ""} selected
          </div>
          <div className="bulk-actions-buttons">
            <button onClick={() => onStatusChange?.("active")}>
              <UserCheck size={16} />
              Activate
            </button>
            <button onClick={() => onStatusChange?.("inactive")}>
              <UserX size={16} />
              Deactivate
            </button>
            <button className="danger" onClick={handleBulkDelete}>
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

UserTable.propTypes = {
  users: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  onRoleChange: PropTypes.func,
  onDelete: PropTypes.func,
  onStatusChange: PropTypes.func,
  updatingRoles: PropTypes.object,
  updatingStatus: PropTypes.object,
  showStatus: PropTypes.bool,
  showStudentId: PropTypes.bool,
  showDepartment: PropTypes.bool,
  sortable: PropTypes.bool,
  selectable: PropTypes.bool,
  onSelectUser: PropTypes.func,
  selectedUsers: PropTypes.array,
  onRefresh: PropTypes.func,
  onExport: PropTypes.func,
  itemsPerPage: PropTypes.number,
  showPagination: PropTypes.bool,
  showSearch: PropTypes.bool,
  showFilter: PropTypes.bool,
  showExport: PropTypes.bool,
  className: PropTypes.string,
};

export default React.memo(UserTable);
