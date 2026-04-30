// src/pages/AdminRegistrationPage.jsx - Plain CSS Version
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiKey,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiShield,
  FiBriefcase,
  FiPhone,
  FiBuilding,
  FiUserCheck,
  FiLock as FiLockOutlined,
  FiUserPlus,
  FiAward,
  FiStar,
  FiTrendingUp,
  FiCalendar,
  FiClock,
  FiSettings,
  FiHelpCircle,
  FiCornerDownLeft,
} from "react-icons/fi";
import {
  MdAdminPanelSettings,
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdKey,
  MdArrowBack,
  MdCheckCircle,
  MdErrorOutline,
  MdInfoOutline,
  MdSecurity,
  MdBadge,
  MdWork,
  MdPhone,
  MdBusiness,
  MdVerifiedUser,
  MdLockOutline,
  MdHowToReg,
  MdCelebration,
  MdShield,
  MdPerson,
  MdEmail as MdEmailIcon,
  MdPhone as MdPhoneIcon,
  MdBusinessCenter,
  MdAssignment,
  MdVerified,
  MdStarOutline,
  MdTrendingUp as MdTrendingUpIcon,
} from "react-icons/md";
import api from "../services/api";
import "../styles/components/AdminRegistrationPage.css";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeInOut" },
  },
  exit: (direction) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    transition: { duration: 0.4, ease: "easeInOut" },
  }),
};

const AdminRegistrationPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    adminSecret: "",
    department: "Administration",
    phone: "",
    position: "System Administrator",
  });

  const steps = [
    "Personal Information",
    "Security Credentials",
    "Verification",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) return "First name is required";
    if (!formData.lastName.trim()) return "Last name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(formData.email)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const validateStep2 = () => {
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters";
    if (!/(?=.*[A-Z])/.test(formData.password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*[0-9])/.test(formData.password)) {
      return "Password must contain at least one number";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  const validateStep3 = () => {
    if (!formData.adminSecret.trim())
      return "Admin registration key is required";
    return null;
  };

  const handleNext = () => {
    let validationError = null;
    if (activeStep === 0) validationError = validateStep1();
    else if (activeStep === 1) validationError = validateStep2();
    else if (activeStep === 2) validationError = validateStep3();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    if (activeStep < steps.length - 1) {
      setDirection(1);
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setActiveStep((prev) => prev - 1);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const step1Error = validateStep1();
    const step2Error = validateStep2();
    const step3Error = validateStep3();

    if (step1Error || step2Error || step3Error) {
      setError(step1Error || step2Error || step3Error);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("accessToken");

      const response = await api.post("/auth/register", {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: "admin",
        adminSecret: formData.adminSecret.trim(),
        department: formData.department || "Administration",
        phone: formData.phone || null,
        position: formData.position || "System Administrator",
      });

      if (response.data) {
        setSuccess(
          response.data.message ||
            "Admin account created successfully! Please login.",
        );

        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          adminSecret: "",
          department: "Administration",
          phone: "",
          position: "System Administrator",
        });
        setActiveStep(0);

        setTimeout(() => {
          navigate("/login", {
            state: {
              message:
                "Admin account created successfully! Please log in with your credentials.",
              email: formData.email,
            },
          });
        }, 3000);
      }
    } catch (err) {
      console.error("Admin registration error:", err);

      let errorMessage = "Failed to create admin account. ";

      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.response?.data?.errors?.[0]?.msg) {
        errorMessage += err.response.data.errors[0].msg;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Please check your admin key and try again.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <motion.div
            key="step1"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="step-content"
          >
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <FiUser className="label-icon" /> First Name *
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <MdPerson size={20} />
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your first name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiUser className="label-icon" /> Last Name *
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <MdPerson size={20} />
                  </div>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  <FiMail className="label-icon" /> Email Address *
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <MdEmailIcon size={20} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="admin@kaaf.edu"
                    required
                  />
                </div>
                <div className="form-helper">
                  We'll send verification email to this address
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiPhone className="label-icon" /> Phone Number (Optional)
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <MdPhoneIcon size={20} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiBuilding className="label-icon" /> Department
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <MdBusiness size={20} />
                  </div>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Information Technology"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  <FiBriefcase className="label-icon" /> Position/Title
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <MdWork size={20} />
                  </div>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., System Administrator"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="step2"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="step-content"
          >
            <div className="form-group full-width">
              <label className="form-label">
                <FiLock className="label-icon" /> Password *
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
                  className="form-input"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              <div className="form-helper">
                Must be at least 6 characters with 1 uppercase and 1 number
              </div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">
                <FiLockOutlined className="label-icon" /> Confirm Password *
              </label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <MdLockOutline size={20} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${formData.confirmPassword && formData.password !== formData.confirmPassword ? "error" : ""}`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={20} />
                  ) : (
                    <FiEye size={20} />
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <div className="form-error">Passwords do not match</div>
                )}
            </div>

            <div className="alert-info">
              <MdSecurity size={18} />
              <div>
                <strong>Password Requirements:</strong>
                <ul>
                  <li>Minimum 6 characters</li>
                  <li>At least one uppercase letter (A-Z)</li>
                  <li>At least one number (0-9)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step3"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="step-content"
          >
            <div className="alert-warning">
              <MdSecurity size={20} />
              <div>
                <strong>Important Notice:</strong> The admin registration key is
                provided by the system administrator. This key is required to
                create administrator accounts. If you don't have a key, please
                contact your system administrator.
              </div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">
                <FiKey className="label-icon" /> Admin Registration Key *
              </label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <MdKey size={20} />
                </div>
                <input
                  type={showAdminSecret ? "text" : "password"}
                  name="adminSecret"
                  value={formData.adminSecret}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter the secret key"
                  required
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowAdminSecret(!showAdminSecret)}
                >
                  {showAdminSecret ? (
                    <FiEyeOff size={20} />
                  ) : (
                    <FiEye size={20} />
                  )}
                </button>
              </div>
              <div className="form-helper">
                Enter the secret key provided by your system administrator
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-header">
                <FiInfo size={18} />
                <strong>What happens next?</strong>
              </div>
              <ul className="info-card-list">
                <li>✓ Your admin account will be created</li>
                <li>✓ You'll receive a confirmation email</li>
                <li>✓ You can log in with your credentials</li>
                <li>✓ You'll have access to the admin dashboard</li>
              </ul>
            </div>
          </motion.div>
        );

      default:
        return null;
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
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <div className="registration-card">
              <div className="card-header">
                <motion.div
                  className="header-icon"
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <MdAdminPanelSettings size={48} />
                </motion.div>
                <h1 className="header-title">Admin Registration</h1>
                <p className="header-subtitle">
                  Create an administrator account for the KAAF University
                  Noticeboard System
                </p>
              </div>

              <div className="header-divider"></div>

              <div className="card-body">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
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
                    exit={{ opacity: 0, y: -20 }}
                    className="success-alert"
                  >
                    <div className="alert-icon success">
                      <FiCheckCircle size={20} />
                    </div>
                    <div className="alert-content">
                      <div className="alert-title">Success</div>
                      <div className="alert-message">{success}</div>
                    </div>
                    <button
                      className="alert-close"
                      onClick={() => setSuccess(null)}
                    >
                      ×
                    </button>
                  </motion.div>
                )}

                <div className="registration-stepper">
                  {steps.map((label, index) => (
                    <div
                      key={label}
                      className={`stepper-step ${index === activeStep ? "active" : index < activeStep ? "completed" : ""}`}
                    >
                      <div className="step-indicator">
                        {index < activeStep ? (
                          <FiCheckCircle size={18} />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="step-label">{label}</div>
                      {index < steps.length - 1 && (
                        <div className="step-line" />
                      )}
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait" custom={direction}>
                  {getStepContent(activeStep)}
                </AnimatePresence>

                <div className="navigation-buttons">
                  <button
                    className="nav-button back-button"
                    onClick={handleBack}
                    disabled={activeStep === 0 || loading}
                  >
                    <FiArrowLeft size={16} /> Back
                  </button>

                  {activeStep === steps.length - 1 ? (
                    <button
                      className="nav-button submit-button"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="spinner-small"></div>
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <MdHowToReg size={18} />
                          <span>Register Admin</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="nav-button next-button"
                      onClick={handleNext}
                      disabled={loading}
                    >
                      Next
                    </button>
                  )}
                </div>

                <div className="footer-divider"></div>

                <button
                  className="back-to-login"
                  onClick={() => navigate("/login")}
                >
                  <FiArrowLeft size={16} /> Back to Login
                </button>

                <div className="footer-note">
                  <FiInfo size={14} />
                  <span>
                    This registration is for authorized administrators only. All
                    accounts are subject to approval.
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

export default AdminRegistrationPage;
