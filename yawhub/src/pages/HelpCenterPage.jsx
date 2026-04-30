// src/pages/HelpCenterPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiHelpCircle,
  FiMail,
  FiPhone,
  FiMessageCircle,
  FiChevronRight,
  FiBook,
  FiUsers,
  FiShield,
  FiSettings,
  FiUser,
  FiLock,
  FiBell,
  FiCalendar,
  FiFileText,
  FiStar,
  FiHeart,
  FiShare2,
  FiArrowRight,
} from "react-icons/fi";
import {
  MdHelp,
  MdEmail,
  MdPhone,
  MdChat,
  MdSchool,
  MdEvent,
  MdAnnouncement,
  MdSecurity,
  MdAccountCircle,
} from "react-icons/md";
import "../styles/components/HelpCenterPage.css";

const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    {
      id: "all",
      label: "All Topics",
      icon: <FiHelpCircle size={20} />,
      color: "#6366f1",
    },
    {
      id: "account",
      label: "Account & Profile",
      icon: <FiUser size={20} />,
      color: "#3b82f6",
    },
    {
      id: "events",
      label: "Events",
      icon: <FiCalendar size={20} />,
      color: "#8b5cf6",
    },
    {
      id: "notices",
      label: "Notices",
      icon: <FiFileText size={20} />,
      color: "#10b981",
    },
    {
      id: "security",
      label: "Security",
      icon: <FiLock size={20} />,
      color: "#ef4444",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <FiBell size={20} />,
      color: "#f59e0b",
    },
  ];

  const faqs = [
    {
      id: 1,
      category: "account",
      question: "How do I create an account?",
      answer:
        "To create an account, click on the 'Register' button on the login page. Fill in your personal information including your name, email address, and create a secure password. You'll receive a verification email to confirm your account.",
    },
    {
      id: 2,
      category: "account",
      question: "How do I reset my password?",
      answer:
        "Click on 'Forgot Password' on the login page. Enter your registered email address, and we'll send you a password reset link. Follow the instructions in the email to create a new password.",
    },
    {
      id: 3,
      category: "events",
      question: "How do I register for an event?",
      answer:
        "Browse the Events page, find the event you're interested in, and click the 'Register' button. Fill in the required information and confirm your registration. You'll receive a confirmation email with your ticket.",
    },
    {
      id: 4,
      category: "events",
      question: "Can I cancel my event registration?",
      answer:
        "Yes, you can cancel your registration from your 'My Registrations' page. Find the event and click 'Cancel Registration'. Please note that cancellations may be subject to deadlines.",
    },
    {
      id: 5,
      category: "notices",
      question: "How do I receive notice updates?",
      answer:
        "By default, you'll receive email notifications for new notices. You can manage your notification preferences in your Profile Settings under 'Notification Preferences'.",
    },
    {
      id: 6,
      category: "security",
      question: "How do I enable Two-Factor Authentication?",
      answer:
        "Go to your Profile > Security tab. Click on 'Enable 2FA' and follow the setup instructions. You'll need to scan a QR code with an authenticator app like Google Authenticator.",
    },
    {
      id: 7,
      category: "notifications",
      question: "How do I manage notification settings?",
      answer:
        "Navigate to your Profile > Preferences tab. There you can toggle email notifications, SMS alerts, push notifications, and more based on your preferences.",
    },
    {
      id: 8,
      category: "account",
      question: "How do I update my profile information?",
      answer:
        "Go to your Profile page and click 'Edit Profile'. You can update your name, email, phone number, location, bio, and social media links.",
    },
  ];

  const popularArticles = [
    {
      title: "Getting Started Guide",
      icon: <FiBook size={20} />,
      link: "/help/getting-started",
    },
    {
      title: "Account Security Tips",
      icon: <FiShield size={20} />,
      link: "/help/security-tips",
    },
    {
      title: "Event Registration Guide",
      icon: <FiCalendar size={20} />,
      link: "/help/event-guide",
    },
    {
      title: "Notification Setup",
      icon: <FiBell size={20} />,
      link: "/help/notifications",
    },
  ];

  const contactMethods = [
    {
      icon: <FiMail size={20} />,
      label: "Email Support",
      value: "support@kaaf.edu",
      action: "mailto:support@kaaf.edu",
      color: "#3b82f6",
    },
    {
      icon: <FiMessageCircle size={20} />,
      label: "Live Chat",
      value: "Chat with us",
      action: "#",
      color: "#10b981",
    },
    {
      icon: <FiPhone size={20} />,
      label: "Phone Support",
      value: "+233 (0) 123 456 789",
      action: "tel:+2330123456789",
      color: "#ef4444",
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="help-center-page">
      {/* Hero Section */}
      <div className="help-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="hero-title">How can we help you?</h1>
            <p className="hero-subtitle">
              Find answers, guides, and support resources
            </p>
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search for help articles..."
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
          <h2 className="section-title">Browse by Category</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                className={`category-card ${selectedCategory === category.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(category.id)}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="category-icon"
                  style={{ color: category.color }}
                >
                  {category.icon}
                </div>
                <span className="category-label">{category.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <div className="faq-header">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Find quick answers to common questions
            </p>
          </div>
          <div className="faq-list">
            {filteredFaqs.length === 0 ? (
              <div className="no-results">
                <FiHelpCircle size={48} />
                <h3>No results found</h3>
                <p>Try adjusting your search or browse by category</p>
              </div>
            ) : (
              filteredFaqs.map((faq) => (
                <motion.div
                  key={faq.id}
                  className={`faq-item ${expandedFaq === faq.id ? "expanded" : ""}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    className="faq-question"
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <span>{faq.question}</span>
                    <FiChevronRight
                      className={`faq-icon ${expandedFaq === faq.id ? "rotated" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedFaq === faq.id && (
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
              ))
            )}
          </div>
        </div>

        {/* Popular Articles */}
        <div className="popular-articles">
          <h2 className="section-title">Popular Articles</h2>
          <div className="articles-grid">
            {popularArticles.map((article, index) => (
              <motion.a
                key={index}
                href={article.link}
                className="article-card"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="article-icon">{article.icon}</div>
                <div className="article-info">
                  <h3>{article.title}</h3>
                  <span>
                    Read more <FiArrowRight size={14} />
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="contact-section">
          <h2 className="section-title">Still need help?</h2>
          <p className="section-subtitle">
            Our support team is ready to assist you
          </p>
          <div className="contact-grid">
            {contactMethods.map((method, index) => (
              <motion.a
                key={index}
                href={method.action}
                className="contact-card"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="contact-icon" style={{ color: method.color }}>
                  {method.icon}
                </div>
                <div className="contact-info">
                  <h3>{method.label}</h3>
                  <p>{method.value}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
