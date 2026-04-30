// src/components/auth/RegisterForm.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ErrorAlert from "../common/ErrorAlert";
import SuccessAlert from "../common/SuccessAlert";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiBriefcase,
} from "react-icons/fi";
import {
  MdSchool,
  MdCloudUpload,
  MdInfoOutline,
  MdHowToReg,
} from "react-icons/md";
import "../../styles/components/RegistrationForm.css";

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "student",
    studentIdFile: null,
    studentIdFileName: "",
    indexNumber: "",
    department: "",
    yearOfStudy: "",
    facultyDepartment: "",
    designation: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [touched, setTouched] = useState({});

  // 🆕 AI ID verification states
  const [idVerificationStatus, setIdVerificationStatus] = useState(null); // null | 'verifying' | 'verified' | 'failed'
  const [idVerificationMessage, setIdVerificationMessage] = useState("");
  const [idVerificationData, setIdVerificationData] = useState(null); // extracted data from ID

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const password = formData.password;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordChecks(checks);
    setPasswordStrength(Object.values(checks).filter(Boolean).length);
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // 🆕 Verify the uploaded image via backend, which calls Anthropic API
  const verifyStudentIdWithAI = async (file) => {
    setIdVerificationStatus("verifying");
    setIdVerificationMessage("Verifying your Student ID with AI…");
    setIdVerificationData(null);

    try {
      const formPayload = new FormData();
      formPayload.append("idImage", file);

      const response = await fetch("/api/auth/verify-student-id", {
        method: "POST",
        body: formPayload,
      });

      const result = await response.json();

      if (result.success && result.isStudentID) {
        setIdVerificationStatus("verified");
        setIdVerificationData(result.extractedData);
        setIdVerificationMessage(
          `✓ Valid school ID detected${result.extractedData?.institution ? ` — ${result.extractedData.institution}` : ""}`,
        );

        // 🆕 Auto-fill index number if extracted and field is empty
        if (result.extractedData?.studentNumber && !formData.indexNumber) {
          setFormData((prev) => ({
            ...prev,
            indexNumber: result.extractedData.studentNumber,
          }));
        }
      } else {
        setIdVerificationStatus("failed");
        setIdVerificationMessage(
          result.reason ||
            "This image does not appear to be a valid school ID card. Please upload a clear photo of your Student ID.",
        );
      }
    } catch (err) {
      setIdVerificationStatus("failed");
      setIdVerificationMessage(
        "ID verification failed. Please check your connection and try again.",
      );
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid file (JPEG, PNG, or PDF)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      studentIdFile: file,
      studentIdFileName: file.name,
    }));
    setError("");

    // 🆕 Trigger AI verification immediately after upload
    // PDFs can't be visually verified — skip AI check for PDF, still allow upload
    if (file.type === "application/pdf") {
      setIdVerificationStatus("verified");
      setIdVerificationMessage("PDF uploaded — will be reviewed manually.");
    } else {
      await verifyStudentIdWithAI(file);
    }
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
      studentIdFile: null,
      studentIdFileName: "",
      indexNumber: "",
      department: "",
      yearOfStudy: "",
      facultyDepartment: "",
      designation: "",
    }));
    setError("");
    setTouched({});
    // 🆕 Reset verification on role change
    setIdVerificationStatus(null);
    setIdVerificationMessage("");
    setIdVerificationData(null);
  };

  const validateKAAFIndexNumber = (indexNumber) => {
    const patterns = [
      /^KAAF\/\d{4}\/\d{4}$/i,
      /^KAAF-\d{4}-\d{4}$/i,
      /^KAAF\d{8}$/i,
      /^\d{8}$/,
      /^KAAF\/\d{2}\/\d{4}$/i,
      /^KAAF-\d{2}-\d{4}$/i,
    ];
    return patterns.some((p) => p.test(indexNumber.trim()));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return false;
    }
    if (formData.firstName.length < 2 || formData.firstName.length > 50) {
      setError("First name must be between 2 and 50 characters");
      return false;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return false;
    }
    if (formData.lastName.length < 2 || formData.lastName.length > 50) {
      setError("Last name must be between 2 and 50 characters");
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!passwordChecks.length) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (!passwordChecks.uppercase) {
      setError("Password must contain at least one uppercase letter");
      return false;
    }
    if (!passwordChecks.lowercase) {
      setError("Password must contain at least one lowercase letter");
      return false;
    }
    if (!passwordChecks.number) {
      setError("Password must contain at least one number");
      return false;
    }

    if (formData.role === "student") {
      if (!formData.indexNumber) {
        setError("KAAF University Index Number is required");
        return false;
      }
      if (!validateKAAFIndexNumber(formData.indexNumber)) {
        setError(
          "Please enter a valid KAAF Index Number (e.g. KAAF/2024/0001 or 51200622)",
        );
        return false;
      }
      if (!formData.studentIdFile) {
        setError("Please upload your Student ID card for verification");
        return false;
      }

      // 🆕 Block submission if AI verification failed or still running
      if (idVerificationStatus === "verifying") {
        setError("Please wait — your Student ID is still being verified.");
        return false;
      }
      if (idVerificationStatus === "failed") {
        setError(
          "Your Student ID could not be verified. Please upload a clear photo of your valid school ID card.",
        );
        return false;
      }
      if (idVerificationStatus === null) {
        setError("Please upload your Student ID card to continue.");
        return false;
      }

      if (!formData.yearOfStudy) {
        setError("Year of study is required");
        return false;
      }
      const yearNum = parseInt(formData.yearOfStudy, 10);
      if (isNaN(yearNum) || yearNum < 1 || yearNum > 6) {
        setError("Year of study must be between 1 and 6");
        return false;
      }
      if (!formData.department) {
        setError("Department is required");
        return false;
      }
    }

    if (formData.role === "faculty") {
      if (!formData.facultyDepartment) {
        setError("Department is required");
        return false;
      }
      if (!formData.designation) {
        setError("Designation is required");
        return false;
      }
    }

    if (formData.phone) {
      const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError("Please enter a valid phone number");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role,
        phone: formData.phone || null,
        // 🆕 Pass verification status and extracted data to backend
        idVerified: idVerificationStatus === "verified",
        idExtractedData: idVerificationData || null,
      };

      if (formData.role === "student") {
        registrationData.department = formData.department || null;
        registrationData.yearOfStudy = parseInt(formData.yearOfStudy, 10);
        registrationData.indexNumber = formData.indexNumber.trim() || null;
      } else if (formData.role === "faculty") {
        registrationData.department = formData.facultyDepartment || null;
        registrationData.designation = formData.designation || null;
      }

      const result = await register(registrationData);
      console.log("📥 Registration result:", result);

      const successMessage =
        formData.role === "faculty"
          ? `Faculty registration successful! Welcome ${formData.firstName} ${formData.lastName}. You can now log in.`
          : `Registration successful! Welcome ${formData.firstName} ${formData.lastName}. Please check your email to verify your account. Redirecting to login…`;

      setSuccess(successMessage);

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        role: "student",
        studentIdFile: null,
        studentIdFileName: "",
        indexNumber: "",
        department: "",
        yearOfStudy: "",
        facultyDepartment: "",
        designation: "",
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
      // 🆕 Reset verification state
      setIdVerificationStatus(null);
      setIdVerificationMessage("");
      setIdVerificationData(null);

      setTimeout(() => navigate("/login"), 4000);
    } catch (err) {
      console.error("❌ Registration error:", err);
      let errorMessage =
        err.message || "Registration failed. Please try again.";

      if (/email.*exist|exist.*email/i.test(errorMessage))
        errorMessage = "An account with this email already exists.";
      else if (/password/i.test(errorMessage))
        errorMessage = "Password does not meet requirements.";
      else if (/yearOfStudy|year of study/i.test(errorMessage))
        errorMessage = "Please select a valid year of study (1–6).";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthInfo = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { text: "Very Weak", color: "#ef4444", width: "20%" };
      case 2:
        return { text: "Weak", color: "#f59e0b", width: "40%" };
      case 3:
        return { text: "Medium", color: "#f59e0b", width: "60%" };
      case 4:
        return { text: "Strong", color: "#10b981", width: "80%" };
      case 5:
        return { text: "Very Strong", color: "#10b981", width: "100%" };
      default:
        return { text: "", color: "#cbd5e1", width: "0%" };
    }
  };

  const strengthInfo = getPasswordStrengthInfo();

  // 🆕 Helper: styles for verification badge
  const verificationBadge = () => {
    if (!idVerificationStatus) return null;
    const map = {
      verifying: {
        bg: "#eff6ff",
        border: "#93c5fd",
        color: "#1d4ed8",
        text: "Verifying ID…",
      },
      verified: {
        bg: "#f0fdf4",
        border: "#86efac",
        color: "#15803d",
        text: idVerificationMessage,
      },
      failed: {
        bg: "#fef2f2",
        border: "#fca5a5",
        color: "#b91c1c",
        text: idVerificationMessage,
      },
    };
    const s = map[idVerificationStatus];
    return (
      <div
        style={{
          marginTop: 8,
          padding: "8px 12px",
          borderRadius: 8,
          background: s.bg,
          border: `1px solid ${s.border}`,
          color: s.color,
          fontSize: 13,
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        {idVerificationStatus === "verifying" && (
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: "50%",
              border: "2px solid #93c5fd",
              borderTopColor: "#1d4ed8",
              animation: "spin 0.7s linear infinite",
              flexShrink: 0,
              marginTop: 1,
            }}
          />
        )}
        {idVerificationStatus === "verified" && (
          <FiCheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        )}
        {idVerificationStatus === "failed" && (
          <FiAlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        )}
        <span>{s.text}</span>
      </div>
    );
  };

  return (
    <div className="auth-form-wrapper">
      {/* 🆕 spin keyframe for verifying spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="role-tabs">
        {[
          {
            value: "student",
            label: "Student Registration",
            icon: <FiUser size={16} />,
          },
          {
            value: "faculty",
            label: "Faculty Registration",
            icon: <FiBriefcase size={16} />,
          },
        ].map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            className={`role-tab ${formData.role === value ? "active" : ""}`}
            onClick={() => handleRoleChange(value)}
            disabled={loading}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <ErrorAlert message={error} onClose={() => setError("")} />
        <SuccessAlert message={success} onClose={() => setSuccess("")} />

        {/* Basic Information */}
        <div className="form-section">
          <h3 className="form-section-title">
            <FiUser size={18} /> Basic Information
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">
                First Name <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={() => setTouched({ ...touched, firstName: true })}
                  required
                  placeholder="Enter your first name"
                  disabled={loading}
                  autoComplete="given-name"
                  className={
                    touched.firstName && !formData.firstName ? "error" : ""
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="lastName">
                Last Name <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={() => setTouched({ ...touched, lastName: true })}
                  required
                  placeholder="Enter your last name"
                  disabled={loading}
                  autoComplete="family-name"
                  className={
                    touched.lastName && !formData.lastName ? "error" : ""
                  }
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email address"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <div className="input-wrapper">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+233 XX XXX XXXX"
                disabled={loading}
                autoComplete="tel"
              />
            </div>
          </div>
        </div>

        {/* Student fields */}
        {formData.role === "student" && (
          <div className="form-section">
            <h3 className="form-section-title">
              <MdSchool size={18} /> Student Verification
            </h3>

            <div className="verification-notice">
              <MdInfoOutline size={16} />
              <span>
                Your KAAF University Index Number and Student ID card will be
                verified using AI before your account is created.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="indexNumber">
                KAAF University Index Number <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="indexNumber"
                  name="indexNumber"
                  value={formData.indexNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., KAAF/2024/0001 or 51200622"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 🆕 Student ID upload with live AI verification badge */}
            <div className="form-group">
              <label htmlFor="studentIdUpload">
                <MdCloudUpload size={14} /> Student ID Card{" "}
                <span className="required">*</span>
              </label>
              <div className="file-upload-wrapper">
                <div
                  className={`file-upload-area ${idVerificationStatus === "verified" ? "upload-verified" : ""} ${idVerificationStatus === "failed" ? "upload-failed" : ""}`}
                >
                  <p className="upload-text">
                    {formData.studentIdFileName ||
                      "Click or drag to upload Student ID card"}
                  </p>
                  <p className="upload-hint">
                    JPEG or PNG only · Max 5MB · Must be a real school ID
                  </p>
                  <input
                    type="file"
                    id="studentIdUpload"
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    disabled={loading || idVerificationStatus === "verifying"}
                    className="file-input"
                  />
                </div>
              </div>
              {/* 🆕 Verification badge renders here */}
              {verificationBadge()}
            </div>

            <div className="form-group">
              <label htmlFor="yearOfStudy">
                Year of Study <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <select
                  id="yearOfStudy"
                  name="yearOfStudy"
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Year of Study</option>
                  {[1, 2, 3, 4, 5, 6].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="department">
                Department <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">
                    Information Technology
                  </option>
                  <option value="Business Administration">
                    Business Administration
                  </option>
                  <option value="Engineering">Engineering</option>
                  <option value="Law">Law</option>
                  <option value="Allied Health">Allied Health</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Faculty fields */}
        {formData.role === "faculty" && (
          <div className="form-section">
            <h3 className="form-section-title">
              <FiBriefcase size={18} /> Faculty Information
            </h3>

            <div className="form-group">
              <label htmlFor="facultyDepartment">
                Department <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <select
                  id="facultyDepartment"
                  name="facultyDepartment"
                  value={formData.facultyDepartment}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">
                    Information Technology
                  </option>
                  <option value="Business Administration">
                    Business Administration
                  </option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="designation">
                Designation <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <select
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Designation</option>
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">
                    Associate Professor
                  </option>
                  <option value="Senior Lecturer">Senior Lecturer</option>
                  <option value="Lecturer">Lecturer</option>
                  <option value="Assistant Lecturer">Assistant Lecturer</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        <div className="form-section">
          <h3 className="form-section-title">
            <FiLock size={18} /> Security
          </h3>

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
                required
                placeholder="Create a strong password"
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>

            {formData.password && (
              <div className="password-strength">
                <div className="strength-meter">
                  <div
                    className="strength-fill"
                    style={{
                      width: strengthInfo.width,
                      backgroundColor: strengthInfo.color,
                    }}
                  />
                </div>
                <span style={{ color: strengthInfo.color }}>
                  {strengthInfo.text}
                </span>
              </div>
            )}

            <div className="password-requirements">
              <p>Password must contain:</p>
              <ul>
                {[
                  [passwordChecks.length, "At least 8 characters"],
                  [passwordChecks.uppercase, "One uppercase letter"],
                  [passwordChecks.lowercase, "One lowercase letter"],
                  [passwordChecks.number, "One number"],
                  [passwordChecks.special, "One special character (!@#$%^&*)"],
                ].map(([ok, label]) => (
                  <li key={label} className={ok ? "valid" : "invalid"}>
                    {ok ? (
                      <FiCheckCircle size={12} />
                    ) : (
                      <FiAlertCircle size={12} />
                    )}{" "}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <FiEyeOff size={16} />
                ) : (
                  <FiEye size={16} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 🆕 Disable submit while verifying or if verification failed */}
        <button
          type="submit"
          className="submit-btn"
          disabled={loading || idVerificationStatus === "verifying"}
        >
          {loading ? (
            <LoadingSpinner size="small" text="Creating account..." />
          ) : (
            <>
              <MdHowToReg size={18} /> Create Account
            </>
          )}
        </button>

        <div className="form-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;


