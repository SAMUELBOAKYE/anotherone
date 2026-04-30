// src/components/layout/MainLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import Sidebar from "../common/Sidebar";
import LoadingSpinner from "../common/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/components/MainLayout.css";

const MainLayout = ({
  requireAuth = false,
  showSidebar = false,
  showNavbar = true,
  showFooter = true,
  maxWidth = "1200px",
  padding = true,
  className = "",
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle authentication redirect
  useEffect(() => {
    if (requireAuth && !authLoading && !user) {
      navigate("/login", {
        state: { from: location.pathname },
        replace: true,
      });
    }
  }, [requireAuth, authLoading, user, navigate, location]);

  // Handle page transitions
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPageLoading(true);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // Show loading spinner while checking auth
  if (requireAuth && authLoading) {
    return <LoadingSpinner fullScreen text="Checking authentication..." />;
  }

  // Redirect if authentication required but no user
  if (requireAuth && !user) {
    return null; // Will redirect in useEffect
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={`main-layout ${className}`}>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Loading Overlay */}
      {isPageLoading && (
        <div className="page-loading-overlay">
          <LoadingSpinner size="medium" text="Loading..." />
        </div>
      )}

      {/* Layout Structure */}
      <div
        className={`layout-container ${showSidebar ? "has-sidebar" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        {showSidebar && (
          <aside className="layout-sidebar">
            <Sidebar onToggle={toggleSidebar} />
          </aside>
        )}

        <div className="layout-main">
          {showNavbar && (
            <header className="layout-header">
              <Navbar />
            </header>
          )}

          <main
            id="main-content"
            className={`layout-content ${!padding ? "no-padding" : ""}`}
          >
            <div className="content-container" style={{ maxWidth }}>
              <Outlet />
            </div>
          </main>

          {showFooter && (
            <footer className="layout-footer">
              <Footer />
            </footer>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
