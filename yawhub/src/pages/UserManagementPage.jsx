// src/pages/UserManagementPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { adminService } from "../services/adminService";
import ErrorAlert from "../components/common/ErrorAlert";
import LoadingSpinner from "../components/common/LoadingSpinner";
import "../styles/components/UserManagementPage.css";

// ============================================================================
// MODAL COMPONENT
// ============================================================================

const Modal = ({ isOpen, onClose, title, children, size = "medium" }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-container ${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// CONSTANTS
// ============================================================================

const USER_ROLES = {
  admin: "Administrator",
  faculty: "Faculty",
  student: "Student",
  staff: "Staff",
};

const USER_STATUS = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  pending: "Pending",
};

const SORT_OPTIONS = {
  name: "Name",
  email: "Email",
  role: "Role",
  createdAt: "Join Date",
  lastActive: "Last Active",
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UserManagementPage = () => {
  const { user, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ===== State =====
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  // Form states
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "student",
    status: "active",
    password: "",
    confirmPassword: "",
    department: "",
    phone: "",
  });

  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    pending: 0,
    admins: 0,
    faculty: 0,
    students: 0,
    staff: 0,
  });

  // ===== Mock Data for Development =====
  const mockUsers = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@kaaf.edu.gh",
      role: "admin",
      status: "active",
      department: "Information Technology",
      phone: "+233 20 123 4567",
      createdAt: "2024-01-15T10:00:00Z",
      lastActive: "2024-06-07T15:30:00Z",
      avatar: null,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@kaaf.edu.gh",
      role: "faculty",
      status: "active",
      department: "Computer Science",
      phone: "+233 20 123 4568",
      createdAt: "2024-01-20T10:00:00Z",
      lastActive: "2024-06-06T14:20:00Z",
      avatar: null,
    },
    {
      id: 3,
      name: "Michael Johnson",
      email: "michael.johnson@kaaf.edu.gh",
      role: "student",
      status: "pending",
      department: "Engineering",
      phone: "+233 20 123 4569",
      createdAt: "2024-02-01T10:00:00Z",
      lastActive: null,
      avatar: null,
    },
    {
      id: 4,
      name: "Sarah Williams",
      email: "sarah.williams@kaaf.edu.gh",
      role: "faculty",
      status: "active",
      department: "Mathematics",
      phone: "+233 20 123 4570",
      createdAt: "2024-01-10T10:00:00Z",
      lastActive: "2024-06-05T11:00:00Z",
      avatar: null,
    },
    {
      id: 5,
      name: "David Brown",
      email: "david.brown@kaaf.edu.gh",
      role: "student",
      status: "inactive",
      department: "Business Administration",
      phone: "+233 20 123 4571",
      createdAt: "2024-01-25T10:00:00Z",
      lastActive: "2024-05-20T09:00:00Z",
      avatar: null,
    },
    {
      id: 6,
      name: "Emily Davis",
      email: "emily.davis@kaaf.edu.gh",
      role: "staff",
      status: "active",
      department: "Administration",
      phone: "+233 20 123 4572",
      createdAt: "2024-02-10T10:00:00Z",
      lastActive: "2024-06-06T16:45:00Z",
      avatar: null,
    },
    {
      id: 7,
      name: "Christopher Wilson",
      email: "chris.wilson@kaaf.edu.gh",
      role: "student",
      status: "suspended",
      department: "Computer Science",
      phone: "+233 20 123 4573",
      createdAt: "2024-01-05T10:00:00Z",
      lastActive: "2024-05-15T10:30:00Z",
      avatar: null,
    },
    {
      id: 8,
      name: "Amanda Taylor",
      email: "amanda.taylor@kaaf.edu.gh",
      role: "faculty",
      status: "active",
      department: "Physics",
      phone: "+233 20 123 4574",
      createdAt: "2024-01-18T10:00:00Z",
      lastActive: "2024-06-06T13:15:00Z",
      avatar: null,
    },
    {
      id: 9,
      name: "James Anderson",
      email: "james.anderson@kaaf.edu.gh",
      role: "student",
      status: "active",
      department: "Information Technology",
      phone: "+233 20 123 4575",
      createdAt: "2024-02-15T10:00:00Z",
      lastActive: "2024-06-07T09:00:00Z",
      avatar: null,
    },
    {
      id: 10,
      name: "Patricia Martinez",
      email: "patricia.martinez@kaaf.edu.gh",
      role: "staff",
      status: "active",
      department: "Finance",
      phone: "+233 20 123 4576",
      createdAt: "2024-01-28T10:00:00Z",
      lastActive: "2024-06-05T15:30:00Z",
      avatar: null,
    },
    {
      id: 11,
      name: "Robert Garcia",
      email: "robert.garcia@kaaf.edu.gh",
      role: "faculty",
      status: "inactive",
      department: "Chemistry",
      phone: "+233 20 123 4577",
      createdAt: "2024-01-12T10:00:00Z",
      lastActive: "2024-05-25T11:00:00Z",
      avatar: null,
    },
    {
      id: 12,
      name: "Jennifer Lee",
      email: "jennifer.lee@kaaf.edu.gh",
      role: "student",
      status: "active",
      department: "Law",
      phone: "+233 20 123 4578",
      createdAt: "2024-02-20T10:00:00Z",
      lastActive: "2024-06-06T10:00:00Z",
      avatar: null,
    },
  ];

  // ===== Authentication Check =====
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location.pathname,
          message: "Please login to access user management",
        },
      });
      return;
    }
    if (!hasRole("admin")) {
      navigate("/dashboard", {
        state: {
          message: "You do not have permission to access user management",
        },
      });
    }
  }, [isAuthenticated, hasRole, navigate, location]);

  // ===== Fetch Users =====
  useEffect(() => {
    if (isAuthenticated && hasRole("admin")) {
      fetchUsers();
    }
  }, [isAuthenticated, hasRole]);

  // ===== Filter and Sort Users =====
  useEffect(() => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.department?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterRole !== "all") {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((u) => u.status === filterStatus);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "email":
          comparison = (a.email || "").localeCompare(b.email || "");
          break;
        case "role":
          comparison = (a.role || "").localeCompare(b.role || "");
          break;
        case "createdAt":
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case "lastActive":
          comparison =
            (a.lastActive ? new Date(a.lastActive) : 0) -
            (b.lastActive ? new Date(b.lastActive) : 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, filterRole, filterStatus, sortBy, sortOrder]);

  // ===== Fetch Users Function =====
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use mock data for development
      setTimeout(() => {
        setUsers(mockUsers);
        calculateStats(mockUsers);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError(error.message || "Failed to load users");
      setLoading(false);
    }
  };

  // ===== Calculate Statistics =====
  const calculateStats = (userList) => {
    setStats({
      total: userList.length,
      active: userList.filter((u) => u.status === "active").length,
      inactive: userList.filter((u) => u.status === "inactive").length,
      suspended: userList.filter((u) => u.status === "suspended").length,
      pending: userList.filter((u) => u.status === "pending").length,
      admins: userList.filter((u) => u.role === "admin").length,
      faculty: userList.filter((u) => u.role === "faculty").length,
      students: userList.filter((u) => u.role === "student").length,
      staff: userList.filter((u) => u.role === "staff").length,
    });
  };

  // ===== Create User =====
  const handleCreateUser = async () => {
    if (!newUser.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!newUser.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!newUser.password) {
      setError("Password is required");
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newUser.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setProcessing(true);
    try {
      const createdUser = {
        id: users.length + 1,
        ...newUser,
        createdAt: new Date().toISOString(),
        lastActive: null,
        avatar: null,
      };
      setUsers([...users, createdUser]);
      setShowCreateModal(false);
      setNewUser({
        name: "",
        email: "",
        role: "student",
        status: "active",
        password: "",
        confirmPassword: "",
        department: "",
        phone: "",
      });
      setSuccess("User created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message || "Failed to create user");
    } finally {
      setProcessing(false);
    }
  };

  // ===== Update User Role =====
  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, role: selectedRole } : u,
        ),
      );
      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRole("");
      setSuccess("User role updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message || "Failed to update role");
    } finally {
      setProcessing(false);
    }
  };

  // ===== Update User Status =====
  const handleUpdateStatus = async (userId, status) => {
    try {
      setUsers(users.map((u) => (u.id === userId ? { ...u, status } : u)));
      setSuccess(`User status updated to ${USER_STATUS[status]}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message || "Failed to update status");
    }
  };

  // ===== Delete Users =====
  const handleDeleteUsers = async () => {
    setProcessing(true);
    try {
      setUsers(users.filter((u) => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
      setShowDeleteModal(false);
      setSuccess(`${selectedUsers.length} user(s) deleted successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message || "Failed to delete users");
    } finally {
      setProcessing(false);
    }
  };

  // ===== Selection Handlers =====
  const toggleSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map((u) => u.id));
    }
  };

  // ===== Helper Functions =====
  const getStatusBadgeClass = (status) => {
    const classes = {
      active: "status-active",
      inactive: "status-inactive",
      suspended: "status-suspended",
      pending: "status-pending",
    };
    return classes[status] || "";
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      admin: "role-admin",
      faculty: "role-faculty",
      student: "role-student",
      staff: "role-staff",
    };
    return classes[role] || "";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  // ===== Pagination =====
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // ===== Render =====
  if (!isAuthenticated || !hasRole("admin")) return null;

  if (loading) {
    return (
      <div className="user-management-page">
        <div className="loading-container">
          <LoadingSpinner size="large" text="Loading users..." />
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <div className="header-text">
              <h1>User Management</h1>
              <p>Manage users, roles, and permissions across the platform</p>
            </div>
            <div className="header-stats">
              <div className="stat-badge">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total Users</span>
              </div>
              <div className="stat-badge">
                <span className="stat-value">{stats.active}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-badge">
                <span className="stat-value">{stats.admins}</span>
                <span className="stat-label">Admins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Success Message */}
        {success && (
          <div className="success-message">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {/* Action Bar */}
        <div className="action-bar">
          <div className="action-left">
            {selectedUsers.length > 0 && (
              <div className="bulk-actions">
                <span className="selected-count">
                  {selectedUsers.length} selected
                </span>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bulk-delete-btn"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="action-right">
            <button
              onClick={() => setShowCreateModal(true)}
              className="create-btn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add User
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="filters-bar">
          <div className="search-box">
            <svg
              className="search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            {Object.entries(USER_ROLES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            {Object.entries(USER_STATUS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {Object.entries(SORT_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="sort-order-btn"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3>No users found</h3>
            <p>Try adjusting your search or filter criteria</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="create-btn"
            >
              Add Your First User
            </button>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="select-all">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={
                    selectedUsers.length === currentUsers.length &&
                    currentUsers.length > 0
                  }
                  onChange={toggleSelectAll}
                />
                <span>Select All ({filteredUsers.length})</span>
              </label>
            </div>

            {/* Users Grid */}
            <div className="users-grid">
              {currentUsers.map((user) => (
                <div key={user.id} className="user-card">
                  <div className="user-select">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelection(user.id)}
                    />
                  </div>

                  <div className="user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div
                        className="avatar-placeholder"
                        style={{
                          background: `hsl(${(user.id * 37) % 360}, 70%, 50%)`,
                        }}
                      >
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="user-info">
                    <h3>{user.name}</h3>
                    <p className="user-email">{user.email}</p>
                    {user.department && (
                      <p className="user-department">{user.department}</p>
                    )}
                    <div className="user-badges">
                      <span
                        className={`role-badge ${getRoleBadgeClass(user.role)}`}
                      >
                        {USER_ROLES[user.role] || user.role}
                      </span>
                      <span
                        className={`status-badge ${getStatusBadgeClass(user.status)}`}
                      >
                        {USER_STATUS[user.status] || user.status}
                      </span>
                    </div>
                  </div>

                  <div className="user-meta">
                    <div className="meta-item">
                      <span>Joined: {formatDate(user.createdAt)}</span>
                    </div>
                    <div className="meta-item">
                      <span>Active: {formatDate(user.lastActive)}</span>
                    </div>
                  </div>

                  <div className="user-actions">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setSelectedRole(user.role);
                        setShowRoleModal(true);
                      }}
                      className="action-btn"
                      title="Change role"
                    >
                      👤
                    </button>

                    <select
                      value={user.status}
                      onChange={(e) =>
                        handleUpdateStatus(user.id, e.target.value)
                      }
                      className="status-select"
                      title="Change status"
                    >
                      {Object.entries(USER_STATUS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      className="action-btn"
                      title="View details"
                    >
                      👁️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? "active" : ""}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== MODALS ===== */}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New User"
        size="medium"
      >
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            placeholder="Enter full name"
          />
        </div>

        <div className="form-group">
          <label>Email Address *</label>
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="Enter email address"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Role *</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              {Object.entries(USER_ROLES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Status *</label>
            <select
              value={newUser.status}
              onChange={(e) =>
                setNewUser({ ...newUser, status: e.target.value })
              }
            >
              {Object.entries(USER_STATUS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            value={newUser.department}
            onChange={(e) =>
              setNewUser({ ...newUser, department: e.target.value })
            }
            placeholder="Enter department"
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={newUser.phone}
            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
            placeholder="Enter phone number"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              placeholder="Enter password"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              value={newUser.confirmPassword}
              onChange={(e) =>
                setNewUser({ ...newUser, confirmPassword: e.target.value })
              }
              placeholder="Confirm password"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            onClick={() => setShowCreateModal(false)}
            className="secondary-button"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateUser}
            className="primary-button"
            disabled={processing}
          >
            {processing ? "Creating..." : "Create User"}
          </button>
        </div>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Change User Role"
        size="small"
      >
        <p>
          Change role for <strong>{selectedUser?.name}</strong>
        </p>
        <div className="form-group">
          <label>New Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {Object.entries(USER_ROLES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button
            onClick={() => setShowRoleModal(false)}
            className="secondary-button"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateRole}
            className="primary-button"
            disabled={processing}
          >
            {processing ? "Updating..." : "Update Role"}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Users"
        size="small"
      >
        <div className="delete-modal-content">
          <svg
            className="warning-icon"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3>Delete Selected Users?</h3>
          <p>
            This will permanently delete {selectedUsers.length} user(s). This
            action cannot be undone.
          </p>
        </div>
        <div className="modal-actions">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="secondary-button"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteUsers}
            className="danger-button"
            disabled={processing}
          >
            {processing ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </Modal>

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Details"
        size="medium"
      >
        {selectedUser && (
          <div className="user-details-modal">
            <div className="user-profile-header">
              <div className="user-avatar-large">
                <div
                  className="avatar-placeholder-large"
                  style={{
                    background: `hsl(${(selectedUser.id * 37) % 360}, 70%, 50%)`,
                  }}
                >
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="user-info-header">
                <h3>{selectedUser.name}</h3>
                <p>{selectedUser.email}</p>
                <div className="user-badges">
                  <span
                    className={`role-badge ${getRoleBadgeClass(selectedUser.role)}`}
                  >
                    {USER_ROLES[selectedUser.role] || selectedUser.role}
                  </span>
                  <span
                    className={`status-badge ${getStatusBadgeClass(selectedUser.status)}`}
                  >
                    {USER_STATUS[selectedUser.status] || selectedUser.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="user-details-grid">
              <div className="detail-item">
                <label>Department</label>
                <p>{selectedUser.department || "Not specified"}</p>
              </div>
              <div className="detail-item">
                <label>Phone Number</label>
                <p>{selectedUser.phone || "Not specified"}</p>
              </div>
              <div className="detail-item">
                <label>Join Date</label>
                <p>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="detail-item">
                <label>Last Active</label>
                <p>
                  {selectedUser.lastActive
                    ? new Date(selectedUser.lastActive).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowUserModal(false)}
                className="secondary-button"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagementPage;
