import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import UserTable from "./UserTable";
import Pagination from "../common/Pagination";
import LoadingSpinner from "../common/LoadingSpinner";
//import Alert from '../common/Alert';
import ConfirmDialog from "../common/ConfirmDialog";
import userService from "../../services/userService";
import "../../styles/components/UserManagement.css";

// Constants
const DEFAULT_PAGE_SIZE = 10;
const DEBOUNCE_DELAY = 500;

const UserManagement = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
  });

  // UI state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    userId: null,
    userName: "",
  });
  const [alert, setAlert] = useState({
    show: false,
    type: "success",
    message: "",
  });
  const [updatingRoles, setUpdatingRoles] = useState({});

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch users with current filters and pagination
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: DEFAULT_PAGE_SIZE,
        search: debouncedSearch,
        role: filters.role !== "all" ? filters.role : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
      };

      const response = await userService.getUsers(params);

      setUsers(response.data.users || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalUsers(response.data.pagination?.total || 0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch users. Please try again.",
      );
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, filters.role, filters.status]);

  // Effect for fetching users when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle filter changes
  const handleFilterChange = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  // Handle role update
  const handleRoleChange = useCallback(
    async (userId, newRole) => {
      setUpdatingRoles((prev) => ({ ...prev, [userId]: true }));

      try {
        await userService.updateUserRole(userId, newRole);

        // Optimistically update the user in the list
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user,
          ),
        );

        showAlert("success", "User role updated successfully");
      } catch (err) {
        showAlert(
          "error",
          err.response?.data?.message || "Failed to update user role",
        );
        console.error("Role update error:", err);

        // Refresh users to ensure consistency
        fetchUsers();
      } finally {
        setUpdatingRoles((prev) => ({ ...prev, [userId]: false }));
      }
    },
    [fetchUsers],
  );

  // Handle delete confirmation
  const handleDeleteClick = useCallback((userId, userName) => {
    setDeleteDialog({
      isOpen: true,
      userId,
      userName,
    });
  }, []);

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    const { userId, userName } = deleteDialog;

    try {
      await userService.deleteUser(userId);

      // Remove user from list if on current page
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));

      // If current page becomes empty and not first page, go to previous page
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchUsers(); // Refresh to get updated total count
      }

      showAlert("success", `User ${userName} has been deleted successfully`);
    } catch (err) {
      showAlert(
        "error",
        err.response?.data?.message || "Failed to delete user",
      );
      console.error("Delete user error:", err);
    } finally {
      setDeleteDialog({ isOpen: false, userId: null, userName: "" });
    }
  }, [deleteDialog, users.length, currentPage, fetchUsers]);

  // Handle cancel delete
  const handleCancelDelete = useCallback(() => {
    setDeleteDialog({ isOpen: false, userId: null, userName: "" });
  }, []);

  // Show alert message
  const showAlert = useCallback((type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, show: false }));
    }, 5000);
  }, []);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      role: "all",
      status: "all",
    });
    setCurrentPage(1);
  }, []);

  // Memoized filter counts for UI badges
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.role !== "all") count++;
    if (filters.status !== "all") count++;
    return count;
  }, [filters]);

  // Render loading state
  if (loading && users.length === 0) {
    return (
      <div className="user-management-loading">
        <LoadingSpinner size="large" text="Loading users..." />
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Alert notifications */}
      {alert.show && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
          dismissible
        />
      )}

      {/* Header section */}
      <div className="management-header">
        <div className="header-left">
          <h2>User Management</h2>
          {totalUsers > 0 && (
            <span className="user-count">({totalUsers} total users)</span>
          )}
        </div>

        <div className="management-filters">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="search-input"
              aria-label="Search users"
            />
            {filters.search && (
              <button
                className="clear-search"
                onClick={() => handleFilterChange("search", "")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <select
            value={filters.role}
            onChange={(e) => handleFilterChange("role", e.target.value)}
            className="role-filter"
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="status-filter"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="reset-filters-btn"
              aria-label="Reset all filters"
            >
              Reset Filters ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert
          type="error"
          message={error}
          dismissible
          onClose={() => setError(null)}
        />
      )}

      {/* Users table */}
      {users.length === 0 && !loading ? (
        <div className="empty-state">
          <svg
            className="empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h3>No users found</h3>
          <p>Try adjusting your filters or search criteria</p>
          {activeFilterCount > 0 && (
            <button onClick={handleResetFilters} className="reset-filters-btn">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <UserTable
            users={users}
            onRoleChange={handleRoleChange}
            onDelete={handleDeleteClick}
            updatingRoles={updatingRoles}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              showFirstLast
              siblingCount={1}
            />
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteDialog.userName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />
    </div>
  );
};

// PropTypes for better type checking (if not using TypeScript)
UserManagement.propTypes = {
  // Props can be added here if component accepts any
};

export default React.memo(UserManagement);
