// src/pages/help/GettingStartedGuide.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiLock,
  FiCheckCircle,
  FiCalendar,
  FiBell,
  FiFileText,
  FiSettings,
  FiHelpCircle,
} from "react-icons/fi";
import "../styles/components/HelpArticle.css";

const GettingStartedGuide = () => {
  const steps = [
    {
      title: "Create Your Account",
      icon: <FiUser size={24} />,
      description:
        "Click on the 'Register' button on the login page. Fill in your personal information including your name, email address, and create a secure password.",
      tips: [
        "Use a valid email address",
        "Choose a strong password",
        "Save your login credentials",
      ],
    },
    {
      title: "Verify Your Email",
      icon: <FiMail size={24} />,
      description:
        "After registration, you'll receive a verification email. Click the link in the email to verify your account.",
      tips: [
        "Check your spam folder",
        "The link expires in 24 hours",
        "Contact support if you don't receive the email",
      ],
    },
    {
      title: "Complete Your Profile",
      icon: <FiSettings size={24} />,
      description:
        "Log in and navigate to your Profile page. Add your photo, bio, department, and other relevant information.",
      tips: [
        "Upload a professional photo",
        "Keep your information up to date",
        "Add your student/faculty ID",
      ],
    },
    {
      title: "Explore Events",
      icon: <FiCalendar size={24} />,
      description:
        "Browse the Events page to find upcoming events that interest you. Register for events and download your tickets.",
      tips: [
        "Check event details carefully",
        "Register early as spots are limited",
        "Download your ticket for entry",
      ],
    },
    {
      title: "Stay Updated",
      icon: <FiBell size={24} />,
      description:
        "Configure your notification preferences to receive updates about events, notices, and important announcements.",
      tips: [
        "Enable email notifications",
        "Turn on push notifications",
        "Check your settings regularly",
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
          <h1>Getting Started Guide</h1>
          <p>
            Your complete guide to getting started with the KAAF University
            Noticeboard Platform
          </p>
        </motion.div>

        <div className="steps-container">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="step-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-icon">{step.icon}</div>
              <div className="step-content">
                <h2>{step.title}</h2>
                <p>{step.description}</p>
                <div className="tips-box">
                  <h4>💡 Pro Tips:</h4>
                  <ul>
                    {step.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="helpful-links">
          <h3>Need more help?</h3>
          <div className="links-grid">
            <Link to="/faq" className="help-link">
              Browse FAQs
            </Link>
            <Link to="/contact" className="help-link">
              Contact Support
            </Link>
            <Link to="/help/security-tips" className="help-link">
              Security Tips
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GettingStartedGuide;
