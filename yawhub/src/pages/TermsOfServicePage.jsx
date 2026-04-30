// src/pages/TermsOfServicePage.jsx
import React from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiUserX,
  FiLock,
  FiMail,
  FiGlobe,
  FiBook,
  FiStar,
  FiHeart,
  FiShare2,
  FiUserCheck,
  FiServer,
  FiCloud,
} from "react-icons/fi";
import "../styles/components/TermsOfServicePage.css";

const TermsOfServicePage = () => {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      icon: <FiCheckCircle size={24} />,
      content:
        "By accessing or using the KAAF University Noticeboard Platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the platform.",
    },
    {
      title: "2. Account Registration",
      icon: <FiUserCheck size={24} />,
      content:
        "You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
    },
    {
      title: "3. User Responsibilities",
      icon: <FiShield size={24} />,
      content:
        "You agree to use the platform responsibly and in compliance with all applicable laws. You shall not: post false or misleading information; harass, abuse, or harm others; attempt to gain unauthorized access; or engage in any activity that disrupts the platform.",
    },
    {
      title: "4. Content Guidelines",
      icon: <FiFileText size={24} />,
      content:
        "Users are solely responsible for the content they post. The platform reserves the right to remove any content that violates these terms or is otherwise objectionable. Content should be respectful, accurate, and relevant.",
    },
    {
      title: "5. Event Registration and Tickets",
      icon: <FiBook size={24} />,
      content:
        "Event registrations are subject to availability. Tickets are non-transferable unless specified otherwise. The platform reserves the right to cancel registrations for violations of these terms.",
    },
    {
      title: "6. Intellectual Property",
      icon: <FiStar size={24} />,
      content:
        "All content on the platform, including logos, designs, and software, is the property of KAAF University or its licensors. You may not reproduce, distribute, or create derivative works without permission.",
    },
    {
      title: "7. Privacy and Data Protection",
      icon: <FiLock size={24} />,
      content:
        "Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. By using the platform, you consent to our data practices.",
    },
    {
      title: "8. Termination",
      icon: <FiUserX size={24} />,
      content:
        "We may terminate or suspend your account immediately for violations of these terms. You may also delete your account at any time. Upon termination, your right to use the platform will cease.",
    },
    {
      title: "9. Limitation of Liability",
      icon: <FiAlertCircle size={24} />,
      content:
        "The platform is provided 'as is' without warranties. KAAF University shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.",
    },
    {
      title: "10. Changes to Terms",
      icon: <FiGlobe size={24} />,
      content:
        "We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. Material changes will be notified via email.",
    },
  ];

  return (
    <div className="terms-page">
      {/* Hero Section */}
      <div className="terms-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="hero-title">Terms of Service</h1>
            <p className="hero-subtitle">Effective Date: January 1, 2025</p>
            <p className="hero-description">
              These Terms of Service govern your use of the KAAF University
              Noticeboard Platform. Please read them carefully before using our
              services.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container">
        {/* Introduction */}
        <div className="intro-card">
          <h2>Welcome to KAAF University Noticeboard</h2>
          <p>
            The KAAF University Noticeboard Platform ("we," "us," or "our")
            provides a centralized platform for students, faculty, and staff to
            access notices, events, and other university communications. By
            using our platform, you agree to these Terms of Service.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="terms-sections">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              className="term-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.03 }}
              whileHover={{ x: 4 }}
            >
              <div className="term-icon">{section.icon}</div>
              <div className="term-content">
                <h3>{section.title}</h3>
                <p>{section.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Governing Law */}
        <div className="governing-law">
          <h3>Governing Law</h3>
          <p>
            These terms shall be governed by and construed in accordance with
            the laws of Ghana, without regard to its conflict of law provisions.
            Any disputes arising under these terms shall be subject to the
            exclusive jurisdiction of the courts located in Accra, Ghana.
          </p>
        </div>

        {/* Contact Information */}
        <div className="contact-box">
          <h3>Contact Us</h3>
          <p>
            If you have any questions about these Terms of Service, please
            contact us:
          </p>
          <div className="contact-details">
            <div className="contact-item">
              <FiMail size={18} />
              <span>legal@kaaf.edu</span>
            </div>
            <div className="contact-item">
              <FiGlobe size={18} />
              <span>www.kaaf.edu/legal</span>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="last-updated">
          <FiAlertCircle size={14} />
          <span>Last Updated: January 15, 2025</span>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
