// src/pages/FAQPage.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiChevronRight,
  FiHelpCircle,
  FiUser,
  FiCalendar,
  FiBell,
  FiLock,
  FiFileText,
  FiMail,
  FiMessageCircle,
  FiShield,
  FiSettings,
} from "react-icons/fi";
import "../styles/components/FAQPage.css";

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const categories = [
    {
      id: "all",
      name: "All Questions",
      icon: <FiHelpCircle size={18} />,
      count: 24,
    },
    {
      id: "account",
      name: "Account & Profile",
      icon: <FiUser size={18} />,
      count: 8,
    },
    { id: "events", name: "Events", icon: <FiCalendar size={18} />, count: 6 },
    {
      id: "notices",
      name: "Notices",
      icon: <FiFileText size={18} />,
      count: 4,
    },
    { id: "security", name: "Security", icon: <FiLock size={18} />, count: 3 },
    {
      id: "notifications",
      name: "Notifications",
      icon: <FiBell size={18} />,
      count: 3,
    },
  ];

  const faqs = [
    {
      id: 1,
      category: "account",
      question: "How do I create an account?",
      answer:
        "To create an account, click on the 'Register' button on the login page. Fill in your personal information including your name, email address, and create a secure password. You'll receive a verification email to confirm your account. Once verified, you can log in and access all features.",
    },
    {
      id: 2,
      category: "account",
      question: "How do I reset my password?",
      answer:
        "Click on 'Forgot Password' on the login page. Enter your registered email address, and we'll send you a password reset link. Follow the instructions in the email to create a new password. Make sure to check your spam folder if you don't see the email.",
    },
    {
      id: 3,
      category: "account",
      question: "How do I update my profile information?",
      answer:
        "Go to your Profile page by clicking on your avatar in the top right corner. Click 'Edit Profile' to update your name, email, phone number, location, bio, and social media links. Don't forget to save your changes.",
    },
    {
      id: 4,
      category: "events",
      question: "How do I register for an event?",
      answer:
        "Browse the Events page, find the event you're interested in, and click the 'Register' button. Fill in the required information and confirm your registration. You'll receive a confirmation email with your ticket. You can view all your registrations in 'My Registrations'.",
    },
    {
      id: 5,
      category: "events",
      question: "Can I cancel my event registration?",
      answer:
        "Yes, you can cancel your registration from your 'My Registrations' page. Find the event and click 'Cancel Registration'. Please note that cancellations may be subject to deadlines. Some events may have non-refundable fees.",
    },
    {
      id: 6,
      category: "events",
      question: "How do I get my event ticket?",
      answer:
        "After successful registration, you'll receive a confirmation email with your ticket. You can also download your ticket from 'My Registrations' page. The ticket includes a QR code for entry verification.",
    },
    {
      id: 7,
      category: "notices",
      question: "How do I receive notice updates?",
      answer:
        "By default, you'll receive email notifications for new notices. You can manage your notification preferences in your Profile Settings under 'Notification Preferences'. You can choose to receive updates via email, SMS, or push notifications.",
    },
    {
      id: 8,
      category: "notices",
      question: "Can I filter notices by category?",
      answer:
        "Yes, on the Notices page, you can use the category filter to view notices by type (Academic, Career, Sports, General, etc.). You can also search for specific notices using the search bar.",
    },
    {
      id: 9,
      category: "security",
      question: "How do I enable Two-Factor Authentication?",
      answer:
        "Go to your Profile > Security tab. Click on 'Enable 2FA' and follow the setup instructions. You'll need to scan a QR code with an authenticator app like Google Authenticator or Authy. This adds an extra layer of security to your account.",
    },
    {
      id: 10,
      category: "security",
      question: "What should I do if I suspect unauthorized access?",
      answer:
        "Immediately change your password and contact support. You can also review your login history in the Security tab of your Profile to see all recent logins. If you see any suspicious activity, report it immediately.",
    },
    {
      id: 11,
      category: "notifications",
      question: "How do I manage notification settings?",
      answer:
        "Navigate to your Profile > Preferences tab. There you can toggle email notifications, SMS alerts, push notifications, event reminders, notice updates, and more based on your preferences. You can also set quiet hours.",
    },
    {
      id: 12,
      category: "notifications",
      question: "Why am I not receiving notifications?",
      answer:
        "Check your notification settings in your Profile. Ensure that email notifications are enabled and that our emails aren't going to your spam folder. Also, check your browser permissions for push notifications.",
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="faq-page">
      {/* Hero Section */}
      <div className="faq-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="hero-title">Frequently Asked Questions</h1>
            <p className="hero-subtitle">
              Find answers to common questions about our platform
            </p>
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container">
        {/* Categories */}
        <div className="categories-section">
          <div className="categories-grid">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-pill ${activeCategory === category.id ? "active" : ""}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.icon}
                <span>{category.name}</span>
                <span className="category-count">{category.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="faq-list-section">
          {filteredFaqs.length === 0 ? (
            <div className="no-results">
              <FiHelpCircle size={64} />
              <h2>No results found</h2>
              <p>Try adjusting your search or select a different category</p>
            </div>
          ) : (
            <div className="faq-grid">
              {filteredFaqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  className={`faq-card ${expandedId === faq.id ? "expanded" : ""}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <button
                    className="faq-question"
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <span>{faq.question}</span>
                    <FiChevronRight
                      className={`chevron ${expandedId === faq.id ? "rotated" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedId === faq.id && (
                      <motion.div
                        className="faq-answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Still Need Help */}
        <div className="help-section">
          <div className="help-card">
            <h2>Still have questions?</h2>
            <p>
              Can't find the answer you're looking for? Our support team is here
              to help.
            </p>
            <div className="help-actions">
              <a href="/help" className="btn-outline">
                Visit Help Center
              </a>
              <a href="/contact" className="btn-primary">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
