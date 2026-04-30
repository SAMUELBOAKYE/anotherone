// src/pages/help/NotificationsSetupPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiBell,
  FiMail,
  FiMessageCircle,
  FiSmartphone,
  FiCheckCircle,
  FiSettings,
  FiSliders,
  FiVolume2,
} from "react-icons/fi";
import "../styles/components/NotificationsSetupPage.css";

const NotificationsSetupPage = () => {
  const notificationTypes = [
    {
      type: "Email Notifications",
      icon: <FiMail size={20} />,
      description: "Receive updates directly in your inbox",
      steps: [
        "Go to Profile → Preferences",
        "Toggle 'Email Notifications' on",
        "Select which types of emails you want to receive",
      ],
    },
    {
      type: "Push Notifications",
      icon: <FiBell size={20} />,
      description: "Get real-time alerts on your browser",
      steps: [
        "Go to Profile → Preferences",
        "Toggle 'Push Notifications' on",
        "Allow browser notifications when prompted",
      ],
    },
    {
      type: "SMS Alerts",
      icon: <FiMessageCircle size={20} />,
      description: "Receive text message alerts for important updates",
      steps: [
        "Go to Profile → Preferences",
        "Toggle 'SMS Alerts' on",
        "Verify your phone number",
      ],
    },
    {
      type: "Event Reminders",
      icon: <FiSliders size={20} />,
      description: "Get reminders before your registered events",
      steps: [
        "Go to Profile → Preferences",
        "Toggle 'Event Reminders' on",
        "Set your preferred reminder time",
      ],
    },
  ];

  return (
    <div className="help-article-page">
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
          <h1>Notification Setup Guide</h1>
          <p>Configure your notification preferences to stay updated</p>
        </motion.div>

        <div className="setup-guide">
          <div className="setup-steps">
            <h2>How to Configure Notifications</h2>
            <ol>
              <li>Log in to your account</li>
              <li>Click on your avatar in the top right corner</li>
              <li>Select "Profile" from the dropdown menu</li>
              <li>Navigate to the "Preferences" tab</li>
              <li>Toggle the notification types you want to receive</li>
              <li>Save your changes</li>
            </ol>
          </div>

          <div className="notification-types">
            <h2>Notification Types Available</h2>
            <div className="types-grid">
              {notificationTypes.map((type, index) => (
                <motion.div
                  key={index}
                  className="type-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="type-icon">{type.icon}</div>
                  <h3>{type.type}</h3>
                  <p>{type.description}</p>
                  <details>
                    <summary>Setup Steps</summary>
                    <ul>
                      {type.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </details>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="troubleshooting">
            <h2>Troubleshooting</h2>
            <div className="troubleshooting-list">
              <div className="trouble-item">
                <h4>Not receiving email notifications?</h4>
                <p>
                  Check your spam folder and ensure our email address is
                  whitelisted. Verify your email settings in your profile.
                </p>
              </div>
              <div className="trouble-item">
                <h4>Push notifications not working?</h4>
                <p>
                  Check your browser settings to ensure notifications are
                  allowed. Clear your browser cache and try again.
                </p>
              </div>
              <div className="trouble-item">
                <h4>SMS alerts not arriving?</h4>
                <p>
                  Verify your phone number is correct. Check if your carrier
                  blocks short codes or promotional messages.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="helpful-links">
          <h3>Related Articles</h3>
          <div className="links-grid">
            <Link to="/help/getting-started" className="help-link">
              Getting Started Guide
            </Link>
            <Link to="/help/security-tips" className="help-link">
              Security Tips
            </Link>
            <Link to="/faq" className="help-link">
              Frequently Asked Questions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSetupPage;
