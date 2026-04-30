// src/pages/PrivacyPolicyPage.jsx
import React from "react";
import { motion } from "framer-motion";
import {
  FiShield,
  FiLock,
  FiEye,
  FiDatabase,
  FiMail,
  FiGlobe,
  FiAlertCircle,
  FiCheckCircle,
  FiUserCheck,
  FiServer,
  FiCpu,
  FiHardDrive,
  FiCloud,
} from "react-icons/fi";
import "../styles/components/PrivacyPolicyPage.css";

const PrivacyPolicyPage = () => {
  const sections = [
    {
      id: "information",
      title: "Information We Collect",
      icon: <FiDatabase size={24} />,
      content: [
        "Personal information (name, email address, phone number)",
        "Account credentials (username, password)",
        "Profile information (avatar, bio, department, year of study)",
        "Event registration data (events you've registered for, tickets)",
        "Usage data (pages visited, features used, time spent)",
        "Device information (browser type, IP address, device type)",
      ],
    },
    {
      id: "usage",
      title: "How We Use Your Information",
      icon: <FiEye size={24} />,
      content: [
        "To create and manage your account",
        "To process event registrations and issue tickets",
        "To send notifications about events, notices, and updates",
        "To improve our services and user experience",
        "To communicate with you about important announcements",
        "To analyze usage patterns and optimize performance",
      ],
    },
    {
      id: "sharing",
      title: "Information Sharing",
      icon: <FiGlobe size={24} />,
      content: [
        "We do not sell your personal information to third parties",
        "Information may be shared with event organizers for event management",
        "We may share data with service providers who assist our operations",
        "Legal requirements may necessitate disclosure of information",
        "Aggregated, anonymized data may be used for analytics",
      ],
    },
    {
      id: "security",
      title: "Data Security",
      icon: <FiShield size={24} />,
      content: [
        "We use industry-standard encryption for data transmission",
        "Passwords are hashed and stored securely",
        "Regular security audits and vulnerability assessments",
        "Access controls and authentication measures",
        "Secure data centers with 24/7 monitoring",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and Tracking",
      icon: <FiHardDrive size={24} />,
      content: [
        "We use cookies to enhance your browsing experience",
        "Session cookies for authentication",
        "Analytics cookies to understand usage patterns",
        "You can disable cookies in your browser settings",
        "Third-party services may also use cookies",
      ],
    },
    {
      id: "rights",
      title: "Your Rights",
      icon: <FiUserCheck size={24} />,
      content: [
        "Access your personal data",
        "Request correction of inaccurate data",
        "Request deletion of your data",
        "Opt-out of marketing communications",
        "Data portability where applicable",
        "Lodge complaints with supervisory authorities",
      ],
    },
  ];

  return (
    <div className="privacy-page">
      {/* Hero Section */}
      <div className="privacy-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="hero-title">Privacy Policy</h1>
            <p className="hero-subtitle">Last updated: January 15, 2025</p>
            <p className="hero-description">
              Your privacy is important to us. This policy explains how we
              collect, use, and protect your personal information when you use
              our platform.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container">
        {/* Introduction */}
        <div className="intro-section">
          <div className="intro-card">
            <FiAlertCircle size={32} className="intro-icon" />
            <h2>Commitment to Privacy</h2>
            <p>
              KAAF University is committed to protecting your privacy and
              ensuring the security of your personal information. This Privacy
              Policy describes our practices regarding the collection, use, and
              disclosure of information that we collect through our platform.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="sections-grid">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              className="policy-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <div className="card-header">
                <div className="card-icon">{section.icon}</div>
                <h2>{section.title}</h2>
              </div>
              <ul className="card-list">
                {section.content.map((item, idx) => (
                  <li key={idx}>
                    <FiCheckCircle className="list-icon" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="contact-section">
          <h2>Questions About Privacy?</h2>
          <p>
            If you have any questions about this Privacy Policy or our data
            practices, please contact our Data Protection Officer.
          </p>
          <div className="contact-info">
            <div className="contact-item">
              <FiMail size={20} />
              <span>boakyesamuel189@gmail.com</span>
            </div>
            <div className="contact-item">
              <FiGlobe size={20} />
              <span>boakyesamuel189@gmail.com</span>
            </div>
          </div>
          <div className="update-notice">
            <FiAlertCircle size={16} />
            <span>This policy is reviewed annually and updated as needed.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
