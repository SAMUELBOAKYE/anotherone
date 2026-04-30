// src/components/admin/StandaloneAdminRegistration.jsx
// FULLY FIXED VERSION
// Fix 1: ALL hooks moved to TOP — no hooks after conditional returns (React rules)
// Fix 2: Uses AuthContext.login() for proper auth state update
// Fix 3: Secret key protection via URL ?key=

import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiLogIn,
} from "react-icons/fi";
import { MdAdminPanelSettings, MdEmail, MdLock } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import "../../styles/components/StandaloneAdminRegistration.css";

const ADMIN_SECRET =
  import.meta.env.VITE_ADMIN_SECRET || "kaaf-super-admin-2024";

const STATIC_ADMIN_EMAIL = "boakyesamuel189@gmail.com";

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
  },
};

const StandaloneAdminRegistration = () => {
  // ============================================================
  // ✅ ALL HOOKS FIRST — React requires hooks before any
  // conditional returns. Previous version had useAuth() AFTER
  // the key-check return, causing the component to crash and
  // React to fall back to rendering the student/faculty form.
  // ============================================================
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ── Secret key check (safe to do AFTER hooks) ────────────────
  const params = new URLSearchParams(location.search);
  const providedKey = params.get("key");

  if (providedKey !== ADMIN_SECRET) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoggingIn(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("[AdminLogin] Attempting login for:", email);

      const response = await login(email, password, true);
      console.log("[AdminLogin] Response:", response);

      const user = response?.user;
      const isAdmin =
        user?.role === "admin" ||
        user?.role === "super_admin" ||
        user?.email === STATIC_ADMIN_EMAIL;

      if (!isAdmin) {
        setError(
          "This account does not have administrator privileges. " +
            "Please use your admin email and password.",
        );
        return;
      }

      setSuccess("Admin login successful! Redirecting to dashboard…");
      setTimeout(() => navigate("/admin/dashboard"), 1500);
    } catch (err) {
      console.error("[AdminLogin] Error:", err);
      const msg = err?.response?.data?.message || err?.message || "";

      if (/invalid|credentials|password|email/i.test(msg)) {
        setError("Invalid email or password. Please check your credentials.");
      } else if (/pending|verify/i.test(msg)) {
        setError(
          "Account pending verification. Check your backend logs — " +
            "in development this should auto-activate.",
        );
      } else if (/suspended/i.test(msg)) {
        setError("Your account has been suspended. Please contact support.");
      } else if (/network|connection|ECONNREFUSED/i.test(msg)) {
        setError(
          "Cannot connect to server. Make sure the backend is running on port 5000.",
        );
      } else {
        setError(msg || "Login failed. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="admin-registration-container">
      <div className="registration-background">
        <div className="background-particles"></div>
        <div className="background-gradient"></div>
      </div>

      <div className="registration-wrapper">
        <div className="registration-inner">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <div className="registration-card">
              <div className="card-header">
                <motion.div
                  className="header-icon"
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <MdAdminPanelSettings size={48} />
                </motion.div>
                <h1 className="header-title">Admin Login</h1>
                <p className="header-subtitle">
                  Enter your administrator credentials
                </p>
              </div>

              <div className="header-divider"></div>

              <div className="card-body">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="error-alert"
                  >
                    <div className="alert-icon error">
                      <FiAlertCircle size={20} />
                    </div>
                    <div className="alert-content">
                      <div className="alert-title">Error</div>
                      <div className="alert-message">{error}</div>
                    </div>
                    <button
                      className="alert-close"
                      onClick={() => setError(null)}
                    >
                      ×
                    </button>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="success-alert"
                  >
                    <div className="alert-icon success">
                      <FiCheckCircle size={20} />
                    </div>
                    <div className="alert-content">
                      <div className="alert-title">Success</div>
                      <div className="alert-message">{success}</div>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleAdminLogin}>
                  <div className="form-group">
                    <label className="form-label">
                      <FiMail className="label-icon" /> Email Address
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <MdEmail size={20} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="Enter your admin email"
                        autoComplete="email"
                        disabled={isLoggingIn}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <FiLock className="label-icon" /> Password
                    </label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <MdLock size={20} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={isLoggingIn}
                      />
                      <button
                        type="button"
                        className="input-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoggingIn}
                      >
                        {showPassword ? (
                          <FiEyeOff size={20} />
                        ) : (
                          <FiEye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="submit-button"
                  >
                    {isLoggingIn ? (
                      <div className="spinner"></div>
                    ) : (
                      <>
                        <FiLogIn size={18} /> Login as Admin
                      </>
                    )}
                  </button>
                </form>

                <div className="footer-divider"></div>

                <button
                  type="button"
                  className="back-button"
                  onClick={() => navigate("/")}
                >
                  <FiArrowLeft size={18} /> Back to Home
                </button>

                <div className="footer-note">
                  <FiInfo size={14} />
                  <span>
                    Only authorized administrators can access this portal.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StandaloneAdminRegistration;
