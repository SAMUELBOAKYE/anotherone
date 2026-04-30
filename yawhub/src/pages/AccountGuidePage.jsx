// src/pages/help/AccountGuidePage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiLock,
  FiShield,
  FiBell,
  FiEye,
  FiEyeOff,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiSettings,
  FiKey,
  FiSmartphone,
  FiLogOut,
  FiSave,
  FiRefreshCw,
  FiUserCheck,
  FiUserX,
  FiCreditCard,
  FiGlobe,
  FiMoon,
  FiSun,
  FiMonitor,
} from "react-icons/fi";
import "../styles/components/HelpArticle.css";

const AccountGuidePage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const sections = [
    {
      id: "overview",
      title: "Account Overview",
      icon: <FiUser size={20} />,
      content: {
        intro:
          "Your account is your gateway to all KAAF University Noticeboard Platform features. Understanding your account settings helps you make the most of the platform.",
        features: [
          "Personalized dashboard with relevant notices",
          "Event registration and ticket management",
          "Notification preferences and alerts",
          "Profile customization and privacy controls",
          "Activity history and login tracking",
        ],
      },
    },
    {
      id: "profile",
      title: "Profile Management",
      icon: <FiEdit2 size={20} />,
      content: {
        steps: [
          {
            title: "Access Your Profile",
            description:
              "Click on your avatar or name in the top right corner, then select 'My Profile' from the dropdown menu.",
          },
          {
            title: "Edit Personal Information",
            description:
              "Update your name, contact information, department, and student/faculty ID. Keep this information current for important communications.",
          },
          {
            title: "Upload Profile Photo",
            description:
              "Click on the camera icon on your profile picture to upload a new photo. Accepted formats: JPG, PNG (max 5MB).",
          },
          {
            title: "Add Bio and Details",
            description:
              "Share your academic interests, research areas, or professional background in your bio section.",
          },
        ],
        tips: [
          "Use a professional photo for official communications",
          "Keep your contact information up to date",
          "Add your student/faculty ID for verification",
          "Review your information quarterly",
        ],
      },
    },
    {
      id: "security",
      title: "Security Settings",
      icon: <FiShield size={20} />,
      content: {
        features: [
          {
            name: "Two-Factor Authentication (2FA)",
            description:
              "Add an extra layer of security to your account by requiring a verification code from your mobile device.",
            status: "Recommended",
            action: "Enable 2FA",
          },
          {
            name: "Login Alerts",
            description:
              "Receive notifications when your account is accessed from a new device or location.",
            status: "Available",
            action: "Configure Alerts",
          },
          {
            name: "Session Management",
            description:
              "View and manage all active sessions across different devices.",
            status: "Active",
            action: "Manage Sessions",
          },
          {
            name: "Login History",
            description:
              "Review your account access history including timestamps and IP addresses.",
            status: "Available",
            action: "View History",
          },
        ],
      },
    },
    {
      id: "password",
      title: "Password Management",
      icon: <FiKey size={20} />,
      content: {
        requirements: [
          "Minimum 12 characters long",
          "At least one uppercase letter (A-Z)",
          "At least one lowercase letter (a-z)",
          "At least one number (0-9)",
          "At least one special character (!@#$%^&*)",
          "Not previously used password",
        ],
        steps: [
          "Go to Settings > Security > Change Password",
          "Enter your current password",
          "Create a new strong password",
          "Confirm your new password",
          "Click 'Save Changes'",
        ],
        warning:
          "Never share your password with anyone. KAAF University staff will never ask for your password.",
      },
    },
    {
      id: "notifications",
      title: "Notification Preferences",
      icon: <FiBell size={20} />,
      content: {
        categories: [
          {
            name: "Email Notifications",
            options: [
              "Event reminders",
              "Important announcements",
              "Weekly digest",
              "Security alerts",
            ],
          },
          {
            name: "Push Notifications",
            options: [
              "Real-time updates",
              "Event start reminders",
              "Message alerts",
              "System notifications",
            ],
          },
          {
            name: "In-App Notifications",
            options: [
              "Activity updates",
              "Event confirmations",
              "Profile updates",
              "System maintenance",
            ],
          },
        ],
      },
    },
    {
      id: "privacy",
      title: "Privacy Controls",
      icon: <FiEye size={20} />,
      content: {
        settings: [
          {
            setting: "Profile Visibility",
            options: [
              "Public",
              "Only KAAF Community",
              "Only Connections",
              "Private",
            ],
          },
          {
            setting: "Email Visibility",
            options: ["Everyone", "Only Connections", "No One"],
          },
          {
            setting: "Activity Status",
            options: ["Show when active", "Hide activity status"],
          },
          {
            setting: "Data Sharing",
            options: ["Allow analytics", "Opt-out of analytics"],
          },
        ],
      },
    },
  ];

  const quickActions = [
    {
      icon: <FiUser size={18} />,
      label: "Edit Profile",
      link: "/profile",
      color: "#4f46e5",
    },
    {
      icon: <FiLock size={18} />,
      label: "Change Password",
      link: "/settings/security",
      color: "#10b981",
    },
    {
      icon: <FiBell size={18} />,
      label: "Notifications",
      link: "/settings/notifications",
      color: "#f59e0b",
    },
    {
      icon: <FiShield size={18} />,
      label: "Security",
      link: "/settings/security",
      color: "#ef4444",
    },
    {
      icon: <FiLogOut size={18} />,
      label: "Sign Out",
      link: "/logout",
      color: "#6b7280",
    },
  ];

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  return (
    <div className="help-article-page account-guide-page">
      <div className="container">
        <Link to="/help" className="back-link">
          <FiArrowLeft size={16} /> Back to Help Center
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="article-header"
        >
          <h1>Account Guide</h1>
          <p>
            Complete guide to managing your KAAF University Noticeboard account
          </p>
        </motion.div>

        {/* Quick Actions Bar */}
        <div className="quick-actions-bar">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              className="quick-action-item"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={action.link}
                className="quick-action-link"
                style={{
                  backgroundColor: `${action.color}15`,
                  color: action.color,
                }}
              >
                {action.icon}
                <span>{action.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Account Status Card */}
        <motion.div
          className="account-status-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="status-header">
            <FiCheckCircle size={24} className="status-icon" />
            <div>
              <h3>Account Status: Verified & Active</h3>
              <p>
                Your account is in good standing with all features available
              </p>
            </div>
          </div>
          <div className="status-details">
            <div className="status-item">
              <span className="label">Member Since:</span>
              <span className="value">January 15, 2024</span>
            </div>
            <div className="status-item">
              <span className="label">Last Login:</span>
              <span className="value">Today at 9:30 AM</span>
            </div>
            <div className="status-item">
              <span className="label">Account Type:</span>
              <span className="value badge">Student</span>
            </div>
            <div className="status-item">
              <span className="label">Verification:</span>
              <span className="value badge success">Email Verified</span>
            </div>
          </div>
        </motion.div>

        {/* Main Content with Tabs */}
        <div className="guide-main-content">
          <div className="tabs-navigation">
            {sections.map((section) => (
              <button
                key={section.id}
                className={`tab-button ${activeTab === section.id ? "active" : ""}`}
                onClick={() => setActiveTab(section.id)}
              >
                {section.icon}
                <span>{section.title}</span>
              </button>
            ))}
          </div>

          <div className="tab-content">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="tab-pane"
                >
                  <h2>Welcome to Your Account Dashboard</h2>
                  <p className="section-intro">
                    {sections.find((s) => s.id === "overview").content.intro}
                  </p>

                  <div className="features-grid">
                    {sections
                      .find((s) => s.id === "overview")
                      .content.features.map((feature, idx) => (
                        <div key={idx} className="feature-card">
                          <FiCheckCircle size={20} />
                          <span>{feature}</span>
                        </div>
                      ))}
                  </div>

                  <div className="info-box">
                    <FiAlertCircle size={20} />
                    <div>
                      <strong>Pro Tip:</strong> Complete your profile to get
                      personalized notice recommendations and event suggestions
                      based on your department and interests.
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="tab-pane"
                >
                  <h2>Manage Your Profile</h2>

                  <div className="steps-container-guide">
                    {sections
                      .find((s) => s.id === "profile")
                      .content.steps.map((step, idx) => (
                        <div key={idx} className="step-item">
                          <div className="step-number-guide">{idx + 1}</div>
                          <div className="step-content-guide">
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="tips-section">
                    <h3>💡 Profile Tips</h3>
                    <ul>
                      {sections
                        .find((s) => s.id === "profile")
                        .content.tips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                    </ul>
                  </div>

                  <div className="action-buttons">
                    <button className="btn-primary-guide">
                      <FiEdit2 size={16} /> Edit Your Profile
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="tab-pane"
                >
                  <h2>Security Features</h2>

                  <div className="security-features">
                    {sections
                      .find((s) => s.id === "security")
                      .content.features.map((feature, idx) => (
                        <div key={idx} className="security-card">
                          <div className="security-card-header">
                            <FiShield size={24} />
                            <div>
                              <h3>{feature.name}</h3>
                              <span
                                className={`status-badge ${feature.status === "Recommended" ? "recommended" : "active"}`}
                              >
                                {feature.status}
                              </span>
                            </div>
                          </div>
                          <p>{feature.description}</p>
                          <button className="security-action">
                            {feature.action} →
                          </button>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "password" && (
                <motion.div
                  key="password"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="tab-pane"
                >
                  <h2>Password Management</h2>

                  <div className="password-requirements">
                    <h3>Password Requirements:</h3>
                    <ul>
                      {sections
                        .find((s) => s.id === "password")
                        .content.requirements.map((req, idx) => (
                          <li key={idx}>
                            <FiCheckCircle size={14} />
                            <span>{req}</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="password-steps">
                    <h3>How to Change Your Password:</h3>
                    <ol>
                      {sections
                        .find((s) => s.id === "password")
                        .content.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                    </ol>
                  </div>

                  <div className="warning-box">
                    <FiAlertCircle size={20} />
                    <div>
                      <strong>Security Warning:</strong>{" "}
                      {
                        sections.find((s) => s.id === "password").content
                          .warning
                      }
                    </div>
                  </div>

                  <div className="password-demo">
                    <h3>Test Password Strength:</h3>
                    <div className="password-input-demo">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter a password to test strength"
                        className="demo-input"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="toggle-password"
                      >
                        {showPassword ? (
                          <FiEyeOff size={18} />
                        ) : (
                          <FiEye size={18} />
                        )}
                      </button>
                    </div>
                    <div className="strength-meter">
                      <div className="strength-bar"></div>
                      <div className="strength-bar"></div>
                      <div className="strength-bar"></div>
                      <div className="strength-bar"></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "notifications" && (
                <motion.div
                  key="notifications"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="tab-pane"
                >
                  <h2>Notification Preferences</h2>

                  <div className="notification-categories">
                    {sections
                      .find((s) => s.id === "notifications")
                      .content.categories.map((category, idx) => (
                        <div key={idx} className="notification-category">
                          <h3>{category.name}</h3>
                          <div className="notification-options">
                            {category.options.map((option, optIdx) => (
                              <label
                                key={optIdx}
                                className="notification-option"
                              >
                                <input
                                  type="checkbox"
                                  defaultChecked={optIdx < 2}
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="action-buttons">
                    <button className="btn-primary-guide">
                      <FiSave size={16} /> Save Preferences
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === "privacy" && (
                <motion.div
                  key="privacy"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="tab-pane"
                >
                  <h2>Privacy Controls</h2>

                  <div className="privacy-settings">
                    {sections
                      .find((s) => s.id === "privacy")
                      .content.settings.map((setting, idx) => (
                        <div key={idx} className="privacy-setting">
                          <div className="setting-info">
                            <h3>{setting.setting}</h3>
                            <p>
                              Control who can see your{" "}
                              {setting.setting.toLowerCase()}
                            </p>
                          </div>
                          <div className="setting-options">
                            <select className="privacy-select">
                              {setting.options.map((option, optIdx) => (
                                <option
                                  key={optIdx}
                                  value={option.toLowerCase()}
                                >
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="data-export">
                    <h3>Your Data</h3>
                    <p>
                      Download a copy of your account data or request account
                      deletion
                    </p>
                    <div className="data-actions">
                      <button className="btn-outline-guide">
                        <FiRefreshCw size={16} /> Download Data
                      </button>
                      <button className="btn-danger-guide">
                        <FiTrash2 size={16} /> Delete Account
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Helpful Resources */}
        <div className="helpful-resources">
          <h3>📚 Additional Resources</h3>
          <div className="resources-grid">
            <Link to="/help/security-tips" className="resource-card">
              <FiShield size={24} />
              <div>
                <strong>Security Tips</strong>
                <p>Best practices for account protection</p>
              </div>
            </Link>
            <Link to="/help/getting-started" className="resource-card">
              <FiUser size={24} />
              <div>
                <strong>Getting Started</strong>
                <p>New user onboarding guide</p>
              </div>
            </Link>
            <Link to="/faq" className="resource-card">
              <FiHelpCircle size={24} />
              <div>
                <strong>FAQs</strong>
                <p>Frequently asked questions</p>
              </div>
            </Link>
            <Link to="/contact" className="resource-card">
              <FiMail size={24} />
              <div>
                <strong>Contact Support</strong>
                <p>Get help from our team</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountGuidePage;
