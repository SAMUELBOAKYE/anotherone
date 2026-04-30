// src/pages/help/SecurityTipsPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiLock,
  FiShield,
  FiEye,
  FiAlertTriangle,
  FiCheckCircle,
  FiSmartphone,
  FiKey,
  FiUserCheck,
} from "react-icons/fi";
import "../styles/components/SecurityTipsPage.css";

const SecurityTipsPage = () => {
  const tips = [
    {
      title: "Use Strong Passwords",
      icon: <FiLock size={24} />,
      description:
        "Create a password that is at least 12 characters long and includes uppercase letters, lowercase letters, numbers, and special characters.",
      dos: [
        "Use a passphrase with multiple words",
        "Include numbers and symbols",
        "Make it at least 12 characters",
      ],
      donts: [
        "Don't use common words or phrases",
        "Don't use personal information",
        "Don't reuse passwords across sites",
      ],
    },
    {
      title: "Enable Two-Factor Authentication",
      icon: <FiShield size={24} />,
      description:
        "Add an extra layer of security to your account by enabling 2FA. This requires a verification code from your phone in addition to your password.",
      dos: [
        "Use Google Authenticator or Authy",
        "Save backup codes in a safe place",
        "Keep your phone secure",
      ],
      donts: [
        "Don't share your verification codes",
        "Don't disable 2FA unless necessary",
        "Don't lose your backup codes",
      ],
    },
    {
      title: "Be Aware of Phishing Attempts",
      icon: <FiEye size={24} />,
      description:
        "Always verify the authenticity of emails and messages claiming to be from the university. Never click on suspicious links.",
      dos: [
        "Check sender email addresses",
        "Verify links before clicking",
        "Report suspicious messages",
      ],
      donts: [
        "Don't share your password via email",
        "Don't click on unknown links",
        "Don't ignore security warnings",
      ],
    },
    {
      title: "Keep Your Devices Secure",
      icon: <FiSmartphone size={24} />,
      description:
        "Ensure your computer and mobile devices are protected with up-to-date security software and operating system updates.",
      dos: [
        "Install security updates regularly",
        "Use antivirus software",
        "Lock your devices when not in use",
      ],
      donts: [
        "Don't use public computers for sensitive tasks",
        "Don't ignore update notifications",
        "Don't disable security features",
      ],
    },
    {
      title: "Monitor Account Activity",
      icon: <FiUserCheck size={24} />,
      description:
        "Regularly review your account activity and login history. Report any unauthorized access immediately.",
      dos: [
        "Check login history regularly",
        "Review your profile information",
        "Enable login notifications",
      ],
      donts: [
        "Don't ignore unusual activity",
        "Don't share your account",
        "Don't wait to report issues",
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
          <h1>Security Tips</h1>
          <p>
            Keep your account safe and secure with these essential security
            practices
          </p>
        </motion.div>

        <div className="security-alert">
          <FiAlertTriangle size={20} />
          <div>
            <strong>Important:</strong> Your account security is our priority.
            Follow these tips to protect your account.
          </div>
        </div>

        <div className="tips-container">
          {tips.map((tip, index) => (
            <motion.div
              key={index}
              className="tip-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="tip-header">
                <div className="tip-icon">{tip.icon}</div>
                <h2>{tip.title}</h2>
              </div>
              <p className="tip-description">{tip.description}</p>
              <div className="tip-grid">
                <div className="dos-box">
                  <h4>
                    <FiCheckCircle size={16} /> Do's:
                  </h4>
                  <ul>
                    {tip.dos.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="donts-box">
                  <h4>
                    <FiAlertTriangle size={16} /> Don'ts:
                  </h4>
                  <ul>
                    {tip.donts.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="emergency-contact">
          <h3>🚨 Report a Security Issue</h3>
          <p>
            If you suspect your account has been compromised or notice any
            suspicious activity, contact us immediately.
          </p>
          <div className="contact-buttons">
            <a href="mailto:security@kaaf.edu" className="btn-primary">
              Report Now
            </a>
            <Link to="/faq" className="btn-outline">
              View FAQs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityTipsPage;
