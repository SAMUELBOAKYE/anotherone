// src/pages/ForgotPasswordPage.jsx - Plain CSS Version
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMail,
  FiArrowLeft,
  FiSend,
  FiCheckCircle,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiMail as FiMailOpen,
  FiPhone,
  FiAlertCircle,
  FiMessageCircle,
  FiLogIn,
  FiHome,
  FiKey,
  FiUserCheck,
  FiClock,
  FiInfo,
} from "react-icons/fi";
import {
  MdEmail,
  MdArrowBack,
  MdSend,
  MdCheckCircle,
  MdLockReset,
  MdVisibility,
  MdVisibilityOff,
  MdSecurity,
  MdMarkEmailRead,
  MdPhone,
  MdErrorOutline,
  MdWhatsApp,
  MdLogin,
  MdHome,
  MdKey,
  MdVerifiedUser,
  MdAccessTime,
  MdInfoOutline,
} from "react-icons/md";
import "../styles/components/ForgotPasswordPage.css";

// ============================================================================
// API SERVICE
// ============================================================================

const passwordResetService = {
  async requestReset(email, options = {}) {
    const { signal, retryCount = 0 } = options;

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to send reset email");
      }

      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") throw error;
      if (
        retryCount < 2 &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError"))
      ) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return passwordResetService.requestReset(email, {
          ...options,
          retryCount: retryCount + 1,
        });
      }
      throw error;
    }
  },

  async verifyResetToken(token, options = {}) {
    const { signal } = options;
    const response = await fetch(`/api/auth/verify-reset-token/${token}`, {
      method: "GET",
      signal,
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Invalid or expired reset token");
    }
    return await response.json();
  },

  async resetPassword(token, newPassword, options = {}) {
    const { signal } = options;
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to reset password");
    }
    return await response.json();
  },
};

// ============================================================================
// PASSWORD STRENGTH INDICATOR
// ============================================================================

const PasswordStrengthIndicator = ({ password }) => {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const feedbacks = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    setStrength(score);
    setFeedback(feedbacks[Math.min(score, 4)]);
  }, [password]);

  const getStrengthColor = () => {
    if (strength <= 2) return "#ef4444";
    if (strength === 3) return "#f59e0b";
    if (strength === 4) return "#10b981";
    return "#22c55e";
  };

  const getStrengthWidth = () => (strength / 5) * 100;

  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="strength-header">
        <span className="strength-label">Password strength:</span>
        <span className="strength-value" style={{ color: getStrengthColor() }}>
          {feedback}
        </span>
      </div>
      <div className="strength-bar">
        <div
          className="strength-fill"
          style={{
            width: `${getStrengthWidth()}%`,
            backgroundColor: getStrengthColor(),
          }}
        />
      </div>
      <div className="strength-requirements">
        <span>Requirements:</span>
        <span style={{ color: password.length >= 8 ? "#22c55e" : "#64748b" }}>
          • 8+ chars
        </span>
        <span style={{ color: /[A-Z]/.test(password) ? "#22c55e" : "#64748b" }}>
          • Uppercase
        </span>
        <span style={{ color: /[0-9]/.test(password) ? "#22c55e" : "#64748b" }}>
          • Number
        </span>
        <span
          style={{
            color: /[^A-Za-z0-9]/.test(password) ? "#22c55e" : "#64748b",
          }}
        >
          • Special char
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// STEP 1: REQUEST RESET
// ============================================================================

const RequestResetStep = ({ email, setEmail, onSubmit, loading }) => {
  const [emailError, setEmailError] = useState("");
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;

  const validateEmail = () => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = () => {
    if (validateEmail()) onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="step-container">
        <div className="step-icon floating-icon">
          <MdLockReset size={48} />
        </div>
        <h2 className="step-title gradient-text">Forgot Password?</h2>
        <p className="step-description">
          No worries! Enter your email address and we'll send you a reset link.
        </p>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-wrapper">
            <div className="input-icon">
              <FiMail size={18} />
            </div>
            <input
              type="email"
              className={`form-input ${emailError ? "error" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>
          {emailError && <div className="form-error">{emailError}</div>}
        </div>

        <button
          className="btn-primary submit-btn"
          onClick={handleSubmit}
          disabled={loading || !email}
        >
          {loading ? (
            <div className="spinner-small"></div>
          ) : (
            <>
              <FiSend size={16} /> Send Reset Link
            </>
          )}
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          className="btn-outline back-btn"
          onClick={() => window.history.back()}
        >
          <FiArrowLeft size={16} /> Back to Login
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// STEP 2: RESET PASSWORD
// ============================================================================

const ResetPasswordStep = ({ token, onSubmit, loading: parentLoading }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validatePasswords = () => {
    const newErrors = {};
    if (!newPassword) newErrors.newPassword = "Password is required";
    else if (newPassword.length < 8)
      newErrors.newPassword = "Password must be at least 8 characters";
    if (!confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (newPassword !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validatePasswords()) {
      setLoading(true);
      await onSubmit(newPassword);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="step-container">
        <div className="step-icon floating-icon">
          <MdSecurity size={48} />
        </div>
        <h2 className="step-title gradient-text">Create New Password</h2>
        <p className="step-description">
          Your new password must be different from previous ones.
        </p>

        <div className="form-group">
          <label className="form-label">New Password</label>
          <div className="input-wrapper">
            <div className="input-icon">
              <FiLock size={18} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              className={`form-input ${errors.newPassword ? "error" : ""}`}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={loading || parentLoading}
            />
            <button
              className="input-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {errors.newPassword && (
            <div className="form-error">{errors.newPassword}</div>
          )}
        </div>

        <PasswordStrengthIndicator password={newPassword} />

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <div className="input-wrapper">
            <div className="input-icon">
              <FiCheckCircle size={18} />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              className={`form-input ${errors.confirmPassword ? "error" : ""}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              disabled={loading || parentLoading}
            />
            <button
              className="input-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <FiEyeOff size={18} />
              ) : (
                <FiEye size={18} />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <div className="form-error">{errors.confirmPassword}</div>
          )}
        </div>

        <button
          className="btn-primary reset-btn"
          onClick={handleSubmit}
          disabled={
            loading || parentLoading || !newPassword || !confirmPassword
          }
        >
          {loading || parentLoading ? (
            <div className="spinner-small"></div>
          ) : (
            <>
              <FiLock size={16} /> Reset Password
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// STEP 3: SUCCESS
// ============================================================================

const SuccessStep = ({ email }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <div className="step-container success-step">
        <div className="success-animation">
          <div className="success-checkmark">
            <div className="check-icon">
              <span className="icon-line line-tip"></span>
              <span className="icon-line line-long"></span>
              <div className="icon-circle"></div>
              <div className="icon-fix"></div>
            </div>
          </div>
        </div>

        <h2 className="step-title gradient-text">Check Your Email</h2>
        <p className="step-description">We've sent a password reset link to</p>

        <div className="email-pill">
          <FiMail size={16} /> <span>{email}</span>
        </div>

        <p className="step-note">
          Click the link in the email to reset your password. The link will
          expire in 1 hour.
        </p>

        <div className="divider">
          <span>Didn't receive the email?</span>
        </div>

        <button
          className="btn-outline resend-btn"
          onClick={() => window.location.reload()}
        >
          <FiMailOpen size={16} /> Resend Reset Link
        </button>

        <button
          className="btn-primary login-btn"
          onClick={() => navigate("/login")}
        >
          <FiLogIn size={16} /> Back to Login
        </button>

        <button className="btn-text home-btn" onClick={() => navigate("/")}>
          <FiHome size={16} /> Go to Homepage
        </button>

        <div className="alert-info">
          <FiInfo size={14} /> Check your spam folder if you don't see the email
          in your inbox.
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// TOKEN VERIFICATION LOADING
// ============================================================================

const TokenVerificationLoading = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <h3 className="loading-title">Verifying reset token...</h3>
    <p className="loading-subtitle">
      Please wait while we validate your reset link
    </p>
  </div>
);

// ============================================================================
// TOKEN ERROR STATE
// ============================================================================

const TokenErrorState = ({ message, onBack }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="step-container error-step">
      <div className="step-icon error-icon">
        <FiAlertCircle size={48} />
      </div>
      <h2 className="step-title error-title">Invalid Reset Link</h2>
      <p className="step-description">
        {message || "This password reset link is invalid or has expired."}
      </p>
      <button className="btn-primary" onClick={onBack}>
        Request New Reset Link
      </button>
    </div>
  </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [tokenError, setTokenError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get("token");
    if (resetToken) {
      setToken(resetToken);
      setActiveStep(1);
      verifyToken(resetToken);
    }
  }, []);

  const verifyToken = async (resetToken) => {
    setVerifyingToken(true);
    try {
      await passwordResetService.verifyResetToken(resetToken);
      setTokenError(null);
    } catch (error) {
      setTokenError(error.message);
    } finally {
      setVerifyingToken(false);
    }
  };

  const showSnackbar = (message, type) => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 6000);
  };

  const handleRequestReset = async () => {
    setLoading(true);
    try {
      await passwordResetService.requestReset(email);
      setActiveStep(2);
      showSnackbar("Reset link sent! Please check your email.", "success");
    } catch (error) {
      showSnackbar(
        error.message || "Failed to send reset link. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (newPassword) => {
    setLoading(true);
    try {
      await passwordResetService.resetPassword(token, newPassword);
      setActiveStep(3);
      showSnackbar("Password reset successful! You can now login.", "success");
    } catch (error) {
      showSnackbar(
        error.message || "Failed to reset password. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRequest = () => {
    navigate("/forgot-password");
    setActiveStep(0);
    setToken(null);
    setTokenError(null);
  };

  return (
    <div className="forgot-password-page">
      <div className="page-background">
        <div className="bg-gradient"></div>
        <div className="bg-grid"></div>
        <div className="particle p1"></div>
        <div className="particle p2"></div>
      </div>

      <div className="page-container">
        <div className="glass-card main-card">
          <div className="card-accent"></div>

          <div className="card-content">
            {/* Step Indicators */}
            <div className="step-indicators">
              <div
                className={`step-indicator ${activeStep >= 0 ? "active" : ""} ${activeStep > 0 ? "completed" : ""}`}
              >
                <div className="step-dot">
                  {activeStep > 0 ? <FiCheckCircle size={14} /> : 1}
                </div>
                <span className="step-text">Request</span>
              </div>
              <div className="step-line"></div>
              <div
                className={`step-indicator ${activeStep >= 1 ? "active" : ""} ${activeStep > 1 ? "completed" : ""}`}
              >
                <div className="step-dot">
                  {activeStep > 1 ? <FiCheckCircle size={14} /> : 2}
                </div>
                <span className="step-text">Reset</span>
              </div>
              <div className="step-line"></div>
              <div
                className={`step-indicator ${activeStep >= 2 ? "active" : ""}`}
              >
                <div className="step-dot">3</div>
                <span className="step-text">Success</span>
              </div>
            </div>

            {/* Step Content */}
            {activeStep === 0 && (
              <RequestResetStep
                email={email}
                setEmail={setEmail}
                onSubmit={handleRequestReset}
                loading={loading}
              />
            )}

            {activeStep === 1 && (
              <>
                {verifyingToken ? (
                  <TokenVerificationLoading />
                ) : tokenError ? (
                  <TokenErrorState
                    message={tokenError}
                    onBack={handleBackToRequest}
                  />
                ) : (
                  <ResetPasswordStep
                    token={token}
                    onSubmit={handleResetPassword}
                    loading={loading}
                  />
                )}
              </>
            )}

            {activeStep === 2 && <SuccessStep email={email} />}
          </div>
        </div>

        {/* Help Section */}
        <div className="help-section">
          <p>
            Need help? <a href="mailto:support@kaaf.edu.gh">Contact Support</a>{" "}
            or{" "}
            <a href="https://wa.me/233123456789">
              <FiMessageCircle size={12} /> WhatsApp Support
            </a>
          </p>
        </div>
      </div>

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

export default ForgotPasswordPage;
