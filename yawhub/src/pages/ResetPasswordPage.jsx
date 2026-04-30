import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Key,
  Shield,
  ShieldCheck,
  Info,
  RefreshCw,
  Home,
  Smartphone,
  AlertTriangle,
  Check,
  XCircle,
  Award,
  Zap,
  Clock,
  Mail,
} from "lucide-react";
import { authService } from "../services/authService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Alert from "../components/common/Alert";
import "../styles/components/ResetPasswordPage.css";

// Constants
const PASSWORD_RESET_STATES = {
  VALIDATING: "validating",
  READY: "ready",
  RESETTING: "resetting",
  COMPLETED: "completed",
  ERROR: "error",
};

const VALIDATION_RULES = {
  password: {
    required: true,
    minLength: 8,
    pattern:
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message:
      "Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters",
  },
  confirmPassword: {
    required: true,
    match: "password",
    message: "Passwords do not match",
  },
};

// Password strength calculator
const getPasswordStrength = (password) => {
  if (!password)
    return { score: 0, label: "None", color: "gray", requirements: [] };

  const requirements = [
    {
      test: password.length >= 8,
      text: "At least 8 characters",
      icon: "length",
    },
    {
      test: /[a-z]/.test(password),
      text: "Contains lowercase letter",
      icon: "lowercase",
    },
    {
      test: /[A-Z]/.test(password),
      text: "Contains uppercase letter",
      icon: "uppercase",
    },
    { test: /\d/.test(password), text: "Contains number", icon: "number" },
    {
      test: /[@$!%*?&]/.test(password),
      text: "Contains special character",
      icon: "special",
    },
  ];

  const passedCount = requirements.filter((req) => req.test).length;

  const strengthMap = {
    0: { label: "Very Weak", color: "danger", width: "20%", score: 0 },
    1: { label: "Weak", color: "danger", width: "40%", score: 1 },
    2: { label: "Fair", color: "warning", width: "60%", score: 2 },
    3: { label: "Good", color: "success", width: "80%", score: 3 },
    4: { label: "Strong", color: "success", width: "100%", score: 4 },
    5: { label: "Very Strong", color: "success", width: "100%", score: 5 },
  };

  return {
    ...strengthMap[passedCount],
    score: passedCount,
    requirements,
    passedCount,
  };
};

// Custom hook for form validation
const useFormValidation = (initialValues, rules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);

  const validateField = useCallback(
    (name, value, allValues) => {
      const rule = rules[name];
      if (!rule) return null;

      if (rule.required && !value) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
      }

      if (rule.minLength && value.length < rule.minLength) {
        return `${name} must be at least ${rule.minLength} characters`;
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        return `${name} cannot exceed ${rule.maxLength} characters`;
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message;
      }

      if (rule.match && value !== allValues[rule.match]) {
        return rule.message;
      }

      return null;
    },
    [rules],
  );

  const handleChange = useCallback(
    (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      const error = validateField(name, value, { ...values, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: error }));
      if (touched[name]) {
        setTouched((prev) => ({ ...prev, [name]: true }));
      }
    },
    [validateField, values, touched],
  );

  const handleBlur = useCallback(
    (name) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, values[name], values);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField, values],
  );

  const validateAll = useCallback(() => {
    const newErrors = {};
    Object.keys(rules).forEach((field) => {
      const error = validateField(field, values[field], values);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validateField, rules]);

  useEffect(() => {
    const isValidForm =
      Object.values(errors).every((error) => !error) &&
      Object.values(values).every(
        (value) => value !== undefined && value !== "",
      );
    setIsValid(isValidForm);
  }, [errors, values]);

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validateAll,
    setValues,
    setErrors,
  };
};

// Requirement Indicator Component
const RequirementIndicator = ({ text, isMet }) => {
  return (
    <div className={`requirement-item ${isMet ? "met" : "unmet"}`}>
      {isMet ? (
        <Check size={12} className="requirement-icon success" />
      ) : (
        <XCircle size={12} className="requirement-icon" />
      )}
      <span className="requirement-text">{text}</span>
    </div>
  );
};

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useParams();

  const [state, setState] = useState(PASSWORD_RESET_STATES.VALIDATING);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [tokenValid, setTokenValid] = useState(false);
  const [resetAttempts, setResetAttempts] = useState(0);
  const [securityTips, setSecurityTips] = useState([]);

  const {
    values: passwordValues,
    errors: passwordErrors,
    touched: passwordTouched,
    isValid: isPasswordValid,
    handleChange: handlePasswordChange,
    handleBlur: handlePasswordBlur,
    validateAll: validatePassword,
  } = useFormValidation(
    { password: "", confirmPassword: "" },
    VALIDATION_RULES,
  );

  // Security tips for strong passwords
  useEffect(() => {
    setSecurityTips([
      "Use a mix of uppercase and lowercase letters",
      "Include numbers and special characters",
      "Avoid using personal information",
      "Make it at least 8 characters long",
      "Don't reuse passwords from other accounts",
    ]);
  }, []);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      const resetToken =
        token || new URLSearchParams(location.search).get("token");

      if (!resetToken) {
        setState(PASSWORD_RESET_STATES.ERROR);
        setError(
          "No reset token provided. Please request a new password reset link.",
        );
        return;
      }

      setLoading(true);
      try {
        const response = await authService.validateResetToken(resetToken);
        if (response.valid) {
          setTokenValid(true);
          setEmail(response.email);
          setState(PASSWORD_RESET_STATES.READY);
        } else {
          setState(PASSWORD_RESET_STATES.ERROR);
          setError(
            response.message ||
              "Invalid or expired reset token. Please request a new password reset link.",
          );
        }
      } catch (err) {
        setState(PASSWORD_RESET_STATES.ERROR);
        setError(
          err.message || "Failed to validate reset token. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, location]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      const firstError = document.querySelector(".form-group.has-error");
      if (firstError)
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const resetToken =
        token || new URLSearchParams(location.search).get("token");

      await authService.resetPassword({
        token: resetToken,
        newPassword: passwordValues.password,
      });

      setState(PASSWORD_RESET_STATES.COMPLETED);
      setSuccess("Your password has been reset successfully!");

      // Track reset attempt
      setResetAttempts((prev) => prev + 1);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Password reset successful! Please log in with your new password.",
            type: "success",
          },
        });
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");

      // Track failed attempt
      setResetAttempts((prev) => prev + 1);

      // If too many attempts, show warning
      if (resetAttempts >= 2) {
        setError(
          "Multiple failed attempts. Please request a new reset link if you continue to have issues.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    navigate("/forgot-password", {
      state: {
        email: email,
        message: "Request a new password reset link",
      },
    });
  };

  const passwordStrength = getPasswordStrength(passwordValues.password);
  const isPasswordValidForSubmit =
    passwordValues.password &&
    !passwordErrors.password &&
    passwordValues.confirmPassword &&
    !passwordErrors.confirmPassword;

  // Loading state
  if (state === PASSWORD_RESET_STATES.VALIDATING) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="loading-container">
            <Loader2 size={48} className="spinning" />
            <h3>Validating Reset Link</h3>
            <p>Please wait while we verify your request...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state === PASSWORD_RESET_STATES.ERROR) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container error-container">
          <div className="error-icon">
            <AlertCircle size={64} />
          </div>
          <h2>Invalid Reset Link</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button
              onClick={handleRequestNewLink}
              className="reset-button secondary"
            >
              <RefreshCw size={20} />
              Request New Link
            </button>
            <Link to="/login" className="reset-button outline">
              <ArrowLeft size={20} />
              Back to Login
            </Link>
          </div>
          <div className="help-section">
            <div className="help-item">
              <Smartphone size={16} />
              <span>Need help? </span>
              <Link to="/support" className="help-link">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (state === PASSWORD_RESET_STATES.COMPLETED) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container success-container">
          <div className="success-icon">
            <CheckCircle size={64} />
          </div>
          <h2>Password Reset Successful!</h2>
          <p>Your password has been reset successfully.</p>
          <div className="success-tips">
            <Award size={20} />
            <span>Tips for keeping your account secure:</span>
            <ul>
              <li>Use a unique password for this account</li>
              <li>Enable two-factor authentication</li>
              <li>Never share your password with anyone</li>
              <li>Update your password regularly</li>
            </ul>
          </div>
          <p className="redirect-message">Redirecting to login page...</p>
          <LoadingSpinner size="small" />
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        {/* Header */}
        <div className="reset-header">
          <Link to="/login" className="back-link">
            <ArrowLeft size={20} />
            Back to Login
          </Link>
          <div className="header-icon">
            <Key size={32} />
          </div>
          <h1>Create New Password</h1>
          <p className="header-description">
            Set a new strong password for your account
          </p>
          {email && (
            <div className="email-badge">
              <Mail size={14} />
              <span>{email}</span>
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            type="error"
            message={error}
            dismissible
            onClose={() => setError("")}
            icon={<AlertCircle size={18} />}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            dismissible
            onClose={() => setSuccess("")}
            icon={<CheckCircle size={18} />}
          />
        )}

        {/* Form */}
        <form onSubmit={handleResetPassword} className="reset-form">
          {/* New Password */}
          <div
            className={`form-group ${passwordErrors.password && passwordTouched.password ? "has-error" : ""}`}
          >
            <label htmlFor="password">
              <Lock size={16} />
              New Password
              <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={passwordValues.password}
                onChange={(e) =>
                  handlePasswordChange("password", e.target.value)
                }
                onBlur={() => handlePasswordBlur("password")}
                placeholder="Enter your new password"
                autoComplete="new-password"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordErrors.password && passwordTouched.password && (
              <div className="error-message">
                <AlertCircle size={14} />
                {passwordErrors.password}
              </div>
            )}
          </div>

          {/* Password Strength Indicator */}
          {passwordValues.password && (
            <div className="password-strength-section">
              <div className="strength-header">
                <span>Password Strength</span>
                <span className={`strength-label ${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="strength-bar-container">
                <div
                  className={`strength-bar ${passwordStrength.color}`}
                  style={{ width: passwordStrength.width }}
                />
              </div>
              <div className="requirements-grid">
                {passwordStrength.requirements.map((req, index) => (
                  <RequirementIndicator
                    key={index}
                    text={req.text}
                    isMet={req.test}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div
            className={`form-group ${passwordErrors.confirmPassword && passwordTouched.confirmPassword ? "has-error" : ""}`}
          >
            <label htmlFor="confirmPassword">
              <Shield size={16} />
              Confirm Password
              <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <Shield size={18} className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={passwordValues.confirmPassword}
                onChange={(e) =>
                  handlePasswordChange("confirmPassword", e.target.value)
                }
                onBlur={() => handlePasswordBlur("confirmPassword")}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordErrors.confirmPassword &&
              passwordTouched.confirmPassword && (
                <div className="error-message">
                  <AlertCircle size={14} />
                  {passwordErrors.confirmPassword}
                </div>
              )}
          </div>

          {/* Password Match Indicator */}
          {passwordValues.confirmPassword &&
            !passwordErrors.confirmPassword &&
            passwordValues.password === passwordValues.confirmPassword && (
              <div className="match-indicator success">
                <CheckCircle size={14} />
                <span>Passwords match</span>
              </div>
            )}

          {/* Security Tips */}
          <div className="security-tips">
            <div className="tips-header">
              <ShieldCheck size={16} />
              <span>Security Tips</span>
            </div>
            <ul className="tips-list">
              {securityTips.map((tip, index) => (
                <li key={index}>
                  <Zap size={12} />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="reset-button primary"
            disabled={loading || !isPasswordValidForSubmit}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="spinning" />
                Resetting Password...
              </>
            ) : (
              <>
                <ShieldCheck size={20} />
                Reset Password
              </>
            )}
          </button>
        </form>

        {/* Additional Help */}
        <div className="additional-help">
          <div className="help-item">
            <Clock size={14} />
            <span>This link will expire in 24 hours</span>
          </div>
          <div className="help-item">
            <Info size={14} />
            <button
              className="help-link"
              onClick={() => window.open("/security-guide", "_blank")}
            >
              Learn about account security
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
