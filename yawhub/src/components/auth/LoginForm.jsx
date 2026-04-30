// src/components/auth/LoginForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/components/LoginForm.css";

const LoginForm = ({ onSuccess, redirectPath, showHelpText = true }) => {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  // Debounce ref to prevent multiple rapid submissions
  const isSubmittingRef = useRef(false);
  const submitTimeoutRef = useRef(null);

  // ── Restore lock state ───────────────────────────────────────────────────
  useEffect(() => {
    const lockUntil = localStorage.getItem("accountLockUntil");
    if (lockUntil && Date.now() < parseInt(lockUntil, 10)) {
      const remainingSeconds = Math.ceil(
        (parseInt(lockUntil, 10) - Date.now()) / 1000,
      );
      setIsLocked(true);
      setLockTimer(remainingSeconds);

      // Start countdown timer
      const interval = setInterval(() => {
        setLockTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsLocked(false);
            localStorage.removeItem("accountLockUntil");
            localStorage.removeItem("loginAttempts");
            setLoginAttempts(0);
            setError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setError(
        `Too many failed attempts. Please try again in ${Math.ceil(remainingSeconds / 60)} minute(s).`,
      );

      return () => clearInterval(interval);
    } else if (lockUntil) {
      localStorage.removeItem("accountLockUntil");
      localStorage.removeItem("loginAttempts");
      setIsLocked(false);
      setLoginAttempts(0);
      setLockTimer(0);
    }
  }, []);

  // ── Restore saved identifier ─────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("savedIdentifier");
    if (saved) {
      setFormData((prev) => ({ ...prev, identifier: saved, rememberMe: true }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.identifier.trim()) {
      setError("Email or username is required");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple rapid submissions
    if (isSubmittingRef.current) {
      console.log("Login already in progress, ignoring duplicate submission");
      return;
    }

    if (isLocked) {
      setError(`Account is locked. Please try again in ${lockTimer} seconds.`);
      return;
    }

    if (!validateForm()) return;

    // Clear any pending timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const response = await login(
        formData.identifier.trim(),
        formData.password,
        formData.rememberMe,
      );

      // Clear any client-side lock tracking on success
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("accountLockUntil");
      setLoginAttempts(0);

      // Persist identifier if "remember me" is checked
      if (formData.rememberMe) {
        localStorage.setItem("savedIdentifier", formData.identifier.trim());
      } else {
        localStorage.removeItem("savedIdentifier");
      }

      if (onSuccess) onSuccess(response);
    } catch (err) {
      // Check if it's a rate limit error (429)
      if (err.response?.status === 429 || err.status === 429) {
        const retryAfter = err.response?.data?.retryAfter || 900;
        const minutes = Math.ceil(retryAfter / 60);
        setError(
          `Too many login attempts. Please try again in ${minutes} minutes.`,
        );
        setIsLocked(true);
        const lockUntil = Date.now() + retryAfter * 1000;
        localStorage.setItem("accountLockUntil", lockUntil.toString());
        return;
      }

      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem("loginAttempts", newAttempts.toString());

      if (newAttempts >= 5) {
        const lockUntil = Date.now() + 15 * 60 * 1000;
        localStorage.setItem("accountLockUntil", lockUntil.toString());
        setIsLocked(true);
        setLockTimer(900);
        setError(
          "Too many failed attempts. Your account has been locked for 15 minutes.",
        );

        // Start countdown
        const interval = setInterval(() => {
          setLockTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsLocked(false);
              localStorage.removeItem("accountLockUntil");
              localStorage.removeItem("loginAttempts");
              setLoginAttempts(0);
              setError("");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        const serverMessage =
          err.response?.data?.message || err.message || "Invalid credentials";
        setError(
          `${serverMessage} — ${5 - newAttempts} attempt${5 - newAttempts !== 1 ? "s" : ""} remaining.`,
        );
      }
    } finally {
      setLoading(false);
      // Reset submitting flag after a delay to prevent rapid re-submission
      submitTimeoutRef.current = setTimeout(() => {
        isSubmittingRef.current = false;
      }, 2000);
    }
  };

  // Format lock timer as MM:SS
  const formatLockTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="login-form-component">
      {error && (
        <div className="error-alert" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Close">
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="identifier">
            Email or Username <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter your email or username"
              disabled={loading || isLocked}
              autoComplete="username"
              aria-disabled={loading || isLocked}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">
            Password <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={loading || isLocked}
              autoComplete="current-password"
              aria-disabled={loading || isLocked}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((p) => !p)}
              disabled={loading || isLocked}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={loading || isLocked}
            />
            <span>Remember me for 2 weeks</span>
          </label>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={loading || isLocked}
          aria-busy={loading}
        >
          {loading
            ? "Logging in..."
            : isLocked
              ? `Locked (${formatLockTime(lockTimer)})`
              : "Login"}
        </button>

        {showHelpText && (
          <div className="help-section">
            <p className="help-text">
              Need help? Contact the IT Help Desk: +233 53 437 9725
              <br />
              Email: boakyesamuel189@gmail.com
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
