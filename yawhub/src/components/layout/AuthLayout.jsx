// src/components/layout/AuthLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import "../../styles/components/AuthLayout.css";

const AuthLayout = ({
  title = "KAAF University Noticeboard",
  subtitle = "Stay connected with university updates",
  backgroundImage = true,
  showFooter = true,
  companyName = "KAAF University",
  currentYear = new Date().getFullYear(),
}) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const getCurrentPageTitle = () => {
    switch (location.pathname) {
      case "/login":
        return "Welcome Back";
      case "/register":
        return "Create Account";
      case "/forgot-password":
        return "Reset Password";
      case "/verify-email":
        return "Verify Email";
      default:
        return "Authentication";
    }
  };

  return (
    <div className="auth-layout">
      {/* Loading overlay */}
      {isLoading && <div className="auth-loading-overlay" />}

      <div className="auth-container">
        <div className="auth-grid">
          {/* Left Side — Branding */}
          <div className="auth-branding">
            <div className="branding-content">
              <div className="branding-logo">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h1 className="branding-title">{companyName}</h1>
              <p className="branding-description">
                Excellence in education and research, building future leaders
                through innovation.
              </p>
              <div className="branding-features">
                <div className="feature-item">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <span>Real-time Updates</span>
                </div>
                <div className="feature-item">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Student Portal</span>
                </div>
                <div className="feature-item">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 12h-4l-3 9-4-18-3 9H2" />
                  </svg>
                  <span>Easy Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side — Auth Form */}
          <div className="auth-form-container">
            <div className="auth-card">
              <div className="auth-header">
                <div className="auth-badge">{getCurrentPageTitle()}</div>
                <h2 className="auth-title">{title}</h2>
                <p className="auth-subtitle">{subtitle}</p>
              </div>

              {/* Login / Register form renders here */}
              <div className="auth-content">
                <Outlet />
              </div>

              {/* ✅ Google & Facebook buttons REMOVED */}

              {showFooter && (
                <div className="auth-footer">
                  <p>
                    &copy; {currentYear} {companyName}. All rights reserved.
                  </p>
                  <div className="footer-links">
                    <Link to="/privacy">Privacy Policy</Link>
                    <Link to="/terms">Terms of Service</Link>
                    <Link to="/help">Help</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      {backgroundImage && (
        <div className="auth-background">
          <div className="bg-gradient"></div>
          <div className="bg-pattern"></div>
        </div>
      )}
    </div>
  );
};

export default AuthLayout;
