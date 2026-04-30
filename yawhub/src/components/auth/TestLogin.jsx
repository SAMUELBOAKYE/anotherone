// src/components/auth/TestLogin.jsx - Plain CSS Version
import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLogIn,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiHome,
  FiShield,
  FiKey,
  FiStar,
  FiAward,
} from "react-icons/fi";
import {
  MdAdminPanelSettings,
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdLogin,
  MdPerson,
  MdCheckCircle,
  MdErrorOutline,
  MdRefresh,
  MdHome,
  MdSecurity,
  MdVpnKey,
  MdStar,
  MdVerified,
} from "react-icons/md";
import "../../styles/components/TestLogin.css";

const TestLogin = () => {
  const { login, isAuthenticated, user, loading, error } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "rememberMe" ? checked : value,
    }));
    setLoginError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(false);

    console.log("[TestLogin] Attempting login for:", formData.email);

    const result = await login(
      formData.email,
      formData.password,
      formData.rememberMe,
    );

    console.log("[TestLogin] Login result:", result);

    if (result.success) {
      setLoginSuccess(true);
      console.log("[TestLogin] User after login:", result.user);

      const token = localStorage.getItem("token");
      const accessToken = localStorage.getItem("access_token");
      console.log(
        "[TestLogin] Token in localStorage:",
        token ? "Present" : "Missing",
      );
      console.log(
        "[TestLogin] Access token:",
        accessToken ? "Present" : "Missing",
      );

      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 1500);
    } else {
      setLoginError(
        result.error || "Login failed. Please check your credentials.",
      );
    }
  };

  const handleClear = () => {
    setFormData({
      email: "",
      password: "",
      rememberMe: true,
    });
    setLoginError(null);
    setLoginSuccess(false);
  };

  if (isAuthenticated && !loginSuccess) {
    return (
      <div className="test-login-container">
        <div className="login-card">
          <div className="login-card-header">
            <div className="header-icon">
              <MdAdminPanelSettings size={40} />
            </div>
            <h1>Already Authenticated</h1>
            <p>You are currently logged in to the system</p>
          </div>
          <div className="login-card-body">
            <div className="auth-success-card">
              <div className="success-icon">
                <FiCheckCircle size={48} />
              </div>
              <h2 className="success-title">Welcome Back!</h2>

              <div className="user-info-card">
                <div className="user-info-row">
                  <span className="user-info-label">Name:</span>
                  <span className="user-info-value">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
                <div className="user-info-row">
                  <span className="user-info-label">Email:</span>
                  <span className="user-info-value">{user?.email}</span>
                </div>
                <div className="user-info-row">
                  <span className="user-info-label">Role:</span>
                  <span className="user-info-value">
                    <span className={`role-badge ${user?.role}`}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </span>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="action-btn action-btn-primary"
                  onClick={() => (window.location.href = "/admin/dashboard")}
                >
                  Go to Dashboard
                </button>
                <button
                  className="action-btn action-btn-secondary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="test-login-container">
      <div className="login-card">
        <div className="login-card-header">
          <div className="header-icon">
            <MdAdminPanelSettings size={40} />
          </div>
          <h1>Admin Login</h1>
          <p>Enter your credentials to access the admin dashboard</p>
        </div>

        <div className="login-card-body">
          {loginSuccess && (
            <div className="alert alert-success">
              <span className="alert-icon">
                <FiCheckCircle size={18} />
              </span>
              <span className="alert-message">
                Login successful! Redirecting to dashboard...
              </span>
              <button
                className="alert-close"
                onClick={() => setLoginSuccess(false)}
              >
                ✕
              </button>
            </div>
          )}

          {(error || loginError) && (
            <div className="alert alert-error">
              <span className="alert-icon">
                <FiAlertCircle size={18} />
              </span>
              <span className="alert-message">{loginError || error}</span>
              <button
                className="alert-close"
                onClick={() => setLoginError(null)}
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <FiMail size={18} />
                </span>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <FiLock size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="input-field"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span className="checkbox-text">Remember me</span>
              </label>
              <a href="/forgot-password" className="forgot-link">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              <span className="button-content">
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Logging in...
                  </>
                ) : (
                  <>
                    <FiLogIn size={18} />
                    Login
                  </>
                )}
              </span>
            </button>

            <button
              type="button"
              className="clear-button"
              onClick={handleClear}
              disabled={loading}
            >
              Clear Form
            </button>
          </form>

          <div className="divider">
            <span>Test Credentials</span>
          </div>

          <div className="demo-credentials">
            <span className="demo-title">Demo Admin Account</span>
            <div className="demo-info">
              <div className="demo-item">
                <span className="demo-label">Email:</span>
                <span className="demo-value">admin@kaaf.edu</span>
              </div>
              <div className="demo-item">
                <span className="demo-label">Password:</span>
                <span className="demo-value">admin123</span>
              </div>
            </div>
          </div>

          <div className="login-card-footer">
            <p className="footer-text">
              This is a test login page for development purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestLogin;
