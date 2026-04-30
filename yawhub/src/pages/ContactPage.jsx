// src/pages/ContactPage.jsx - FULLY FIXED (removed all invalid MD icons)
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiMessageSquare,
  FiClock,
  FiGlobe,
  FiTwitter,
  FiFacebook,
  FiLinkedin,
  FiInstagram,
  FiGithub,
  FiYoutube,
  FiArrowRight,
  FiLoader,
  FiXCircle,
  FiStar,
  FiHeart,
  FiZap,
  FiShield,
} from "react-icons/fi";
import "../styles/components/ContactPage.css";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const contactInfo = [
    {
      icon: <FiMail size={24} />,
      title: "Email Us",
      details: ["boakyesamuel189@gmail.com", "boakyesamuel189@gmail.com"],
      link: "mailto:boakyesamuel189@gmail.com",
      color: "#6366f1",
    },
    {
      icon: <FiPhone size={24} />,
      title: "Call Us",
      details: ["+233 (0) 123 456 789", "+233 (0) 987 654 321"],
      link: "tel:+2330123456789",
      color: "#10b981",
    },
    {
      icon: <FiMapPin size={24} />,
      title: "Visit Us",
      details: ["123 University Avenue", "Accra, Ghana"],
      link: "https://maps.google.com",
      color: "#f59e0b",
    },
    {
      icon: <FiClock size={24} />,
      title: "Office Hours",
      details: [
        "Monday - Friday: 8:00 AM - 5:00 PM",
        "Saturday: 9:00 AM - 1:00 PM",
      ],
      color: "#8b5cf6",
    },
  ];

  const socialLinks = [
    {
      icon: <FiTwitter size={20} />,
      name: "Twitter",
      url: "https://twitter.com/kaaf",
      color: "#1DA1F2",
    },
    {
      icon: <FiFacebook size={20} />,
      name: "Facebook",
      url: "https://facebook.com/kaaf",
      color: "#4267B2",
    },
    {
      icon: <FiLinkedin size={20} />,
      name: "LinkedIn",
      url: "https://linkedin.com/school/kaaf",
      color: "#0077B5",
    },
    {
      icon: <FiInstagram size={20} />,
      name: "Instagram",
      url: "https://instagram.com/kaaf",
      color: "#E4405F",
    },
    {
      icon: <FiGithub size={20} />,
      name: "GitHub",
      url: "https://github.com/kaaf",
      color: "#333333",
    },
    {
      icon: <FiYoutube size={20} />,
      name: "YouTube",
      url: "https://youtube.com/kaaf",
      color: "#FF0000",
    },
  ];

  const faqs = [
    {
      question: "How quickly can I expect a response?",
      answer:
        "We typically respond within 24-48 hours during business days. For urgent matters, please call our support line.",
    },
    {
      question: "What information should I include in my message?",
      answer:
        "Please include your full name, student/faculty ID (if applicable), and a detailed description of your issue or question.",
    },
    {
      question: "Can I visit the campus for support?",
      answer:
        "Yes, our support office is located in the Administration Block, Room 101. Please check our office hours before visiting.",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <div className="contact-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="hero-title">Contact Us</h1>
            <p className="hero-subtitle">
              We'd love to hear from you. Send us a message and we'll respond as
              soon as possible.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container">
        {/* Contact Info Cards */}
        <div className="contact-info-grid">
          {contactInfo.map((info, index) => (
            <motion.a
              key={index}
              href={info.link || "#"}
              className="info-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="info-icon" style={{ color: info.color }}>
                {info.icon}
              </div>
              <h3>{info.title}</h3>
              {info.details.map((detail, i) => (
                <p key={i}>{detail}</p>
              ))}
            </motion.a>
          ))}
        </div>

        {/* Contact Form & Map Section */}
        <div className="contact-main-grid">
          {/* Contact Form */}
          <motion.div
            className="contact-form-container"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="form-header">
              <h2>Send us a Message</h2>
              <p>Fill out the form below and we'll get back to you shortly</p>
            </div>

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <FiUser size={14} /> Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-input ${errors.name ? "error" : ""}`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <div className="form-error">{errors.name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FiMail size={14} /> Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-input ${errors.email ? "error" : ""}`}
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <div className="form-error">{errors.email}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiMessageSquare size={14} /> Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`form-input ${errors.subject ? "error" : ""}`}
                  placeholder="What is this regarding?"
                />
                {errors.subject && (
                  <div className="form-error">{errors.subject}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiMessageSquare size={14} /> Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className={`form-textarea ${errors.message ? "error" : ""}`}
                  rows="5"
                  placeholder="Please provide details about your inquiry..."
                />
                {errors.message && (
                  <div className="form-error">{errors.message}</div>
                )}
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FiLoader size={18} className="spinning" /> Sending...
                  </>
                ) : (
                  <>
                    <FiSend size={18} /> Send Message
                  </>
                )}
              </button>

              {submitSuccess && (
                <motion.div
                  className="success-message"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <FiCheckCircle size={18} />
                  <span>
                    Thank you! Your message has been sent successfully.
                  </span>
                </motion.div>
              )}

              {submitError && (
                <motion.div
                  className="error-message"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <FiAlertCircle size={18} />
                  <span>{submitError}</span>
                </motion.div>
              )}
            </form>
          </motion.div>

          {/* Map & Location */}
          <motion.div
            className="map-container"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="map-header">
              <h2>Find Us Here</h2>
              <p>Visit our campus or connect with us online</p>
            </div>
            <div className="map-wrapper">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.0!2d-0.186!3d5.603!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwMzYnMTAuOCJOIDDCsDEwJzU5LjYiVw!5e0!3m2!1sen!2sgh!4v1!5m2!1sen!2sgh"
                title="University Location"
                className="map-iframe"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            {/* Social Links */}
            <div className="social-section">
              <h3>Connect With Us</h3>
              <div className="social-grid">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    style={{ borderColor: `${social.color}30` }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -2 }}
                  >
                    <span
                      className="social-icon"
                      style={{ color: social.color }}
                    >
                      {social.icon}
                    </span>
                    <span className="social-name">{social.name}</span>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <div className="faq-header">
            <h2>Frequently Asked Questions</h2>
            <p>Find quick answers to common questions</p>
          </div>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="faq-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Emergency Contact Banner */}
        <div className="emergency-banner">
          <div className="emergency-content">
            <div className="emergency-icon">🚨</div>
            <div className="emergency-text">
              <h3>Emergency Support</h3>
              <p>
                For urgent matters outside business hours, please call our
                emergency hotline
              </p>
            </div>
            <a href="tel:+233534379725" className="emergency-phone">
              <FiPhone size={18} /> +233 (0) 534 379 725
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
