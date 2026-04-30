// src/components/common/AdminRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box, CircularProgress, Typography, Paper } from "@mui/material";
import { AdminPanelSettings, Lock } from "@mui/icons-material";
import "../../styles/components/AdminRoute.css";
/**
 * AdminRoute Component
 * Protects admin-only routes and handles unauthorized access
 * Supports both admin and super_admin roles
 */
const AdminRoute = ({
  children,
  requireSuperAdmin = false,
  redirectTo = "/login",
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <CircularProgress size={48} sx={{ color: "#6366f1", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Verifying access...
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Not authenticated - redirect to login with return URL
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{
          from: location.pathname,
          message: "Please login to access admin area",
        }}
        replace
      />
    );
  }

  // Check if user has admin role
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  if (!isAdmin) {
    // User is authenticated but not an admin
    return (
      <Navigate
        to="/dashboard"
        state={{
          error: "Access denied. Admin privileges required.",
          from: location.pathname,
        }}
        replace
      />
    );
  }

  // Check if super_admin is required
  if (requireSuperAdmin && user?.role !== "super_admin") {
    return (
      <Navigate
        to="/admin/dashboard"
        state={{
          error: "Super admin privileges required for this action.",
          from: location.pathname,
        }}
        replace
      />
    );
  }

  // User is admin, render children
  return children;
};

/**
 * Higher-order component to wrap admin pages
 * @param {React.Component} Component - The component to wrap
 * @param {Object} options - Route options
 * @returns {React.Component} - Wrapped component with admin protection
 */
export const withAdminProtection = (Component, options = {}) => {
  const WrappedComponent = (props) => (
    <AdminRoute {...options}>
      <Component {...props} />
    </AdminRoute>
  );

  WrappedComponent.displayName = `withAdminProtection(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
};

/**
 * Component for displaying access denied message
 */
export const AccessDenied = ({ requiredRole, userRole }) => {
  const location = useLocation();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          textAlign: "center",
          maxWidth: 500,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            mx: "auto",
            mb: 3,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lock sx={{ fontSize: 40, color: "white" }} />
        </Box>

        <Typography variant="h4" fontWeight={700} gutterBottom>
          Access Denied
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          You don't have permission to access this page.
        </Typography>

        {requiredRole && (
          <Typography variant="body2" color="error" sx={{ mb: 3 }}>
            Required role: {requiredRole}
            {userRole && ` • Your role: ${userRole}`}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <button
            onClick={() => window.history.back()}
            className="admin-route-button admin-route-button-secondary"
          >
            Go Back
          </button>
          <button
            onClick={() => (window.location.href = "/admin/dashboard")}
            className="admin-route-button admin-route-button-primary"
          >
            Go to Dashboard
          </button>
        </Box>
      </Paper>
    </Box>
  );
};

/**
 * Custom hook for checking admin access
 */
export const useAdminAccess = (requireSuperAdmin = false) => {
  const { user, isAuthenticated, loading } = useAuth();

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";
  const hasAccess =
    isAuthenticated && isAdmin && (!requireSuperAdmin || isSuperAdmin);

  return {
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    hasAccess,
    loading,
    user,
  };
};

export default AdminRoute;
