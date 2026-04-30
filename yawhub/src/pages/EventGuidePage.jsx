// src/pages/help/EventGuidePage.jsx - FULLY FIXED
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiFilter,
  FiBookmark,
  FiShare2,
  FiDownload,
  FiChevronRight,
  FiStar,
  FiHeart,
  FiEye,
  FiTrendingUp,
  FiUserPlus,
  FiBell,
  FiMail,
  FiMessageCircle,
  FiXCircle,
  FiHelpCircle,
} from "react-icons/fi";
import {
  MdEvent,
  MdEventAvailable,
  MdLocationOn,
  MdPeople,
  MdConfirmationNumber,
  MdQrCode,
  MdShare,
  MdBookmark,
  MdNotificationsActive,
  MdEmail,
  MdPhone,
  MdChat,
} from "react-icons/md";
import "../styles/components/EventGuidePage.css";

const EventGuidePage = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedFaq, setExpandedFaq] = useState(null);

  const sections = [
    { id: "overview", title: "Overview", icon: <MdEvent size={18} /> },
    { id: "browse", title: "Browse Events", icon: <FiSearch size={18} /> },
    { id: "register", title: "Registration", icon: <FiUserPlus size={18} /> },
    {
      id: "tickets",
      title: "Tickets & Entry",
      icon: <MdConfirmationNumber size={18} />,
    },
    {
      id: "manage",
      title: "Manage Registrations",
      icon: <FiBookmark size={18} />,
    },
    { id: "faq", title: "FAQ", icon: <FiHelpCircle size={18} /> },
  ];

  const faqs = [
    {
      question: "How do I find events that interest me?",
      answer:
        "Use the search bar on the Events page to search by title, location, or organizer. You can also filter events by category, date, and status (upcoming, ongoing, past). Save your favorite events to your bookmarks for quick access.",
    },
    {
      question: "What happens after I register for an event?",
      answer:
        "After successful registration, you'll receive a confirmation email with your ticket. You can also view and download your ticket from the 'My Registrations' page. The ticket includes a QR code for entry verification.",
    },
    {
      question: "Can I cancel my registration?",
      answer:
        "Yes, you can cancel your registration from the 'My Registrations' page before the cancellation deadline. Some events may have non-refundable fees. Please check the event details for specific cancellation policies.",
    },
    {
      question: "How do I get my event ticket?",
      answer:
        "Tickets are available for download immediately after registration. Go to 'My Registrations', find your event, and click 'Download Ticket'. You can download as PDF or PNG. The ticket contains a QR code for entry.",
    },
    {
      question: "What if an event is full?",
      answer:
        "When an event reaches capacity, the registration button will show 'Event Full'. Some events may have a waitlist option. Join the waitlist to be notified if spots become available.",
    },
    {
      question: "How do I receive event reminders?",
      answer:
        "Enable notifications in your Profile Settings. You'll receive email and push notifications before your registered events. You can also add events to your calendar directly from the event page.",
    },
  ];

  const steps = [
    {
      title: "Browse Available Events",
      icon: <FiSearch size={24} />,
      description:
        "Visit the Events page to see all upcoming events. Use filters to narrow down by category, date, or location.",
      tips: [
        "Check the 'Featured' events for highlighted activities",
        "Use the search bar to find specific events",
        "Sort events by date, popularity, or name",
      ],
    },
    {
      title: "Select an Event",
      icon: <FiEye size={24} />,
      description:
        "Click on any event card to view full details including description, agenda, speakers, venue, and capacity.",
      tips: [
        "Read the full description carefully",
        "Check the capacity status before registering",
        "Review any requirements or prerequisites",
      ],
    },
    {
      title: "Complete Registration",
      icon: <FiUserPlus size={24} />,
      description:
        "Click 'Register Now' and fill in the required information. Some events may require additional details like dietary restrictions.",
      tips: [
        "Double-check your contact information",
        "Add any special accommodations if needed",
        "Review the terms before confirming",
      ],
    },
    {
      title: "Download Your Ticket",
      icon: <FiDownload size={24} />,
      description:
        "After registration, download your ticket from the confirmation page or from 'My Registrations'.",
      tips: [
        "Save the ticket to your device",
        "Print a physical copy as backup",
        "The QR code is needed for entry",
      ],
    },
    {
      title: "Attend the Event",
      icon: <FiCalendar size={24} />,
      description:
        "Arrive at the venue with your ticket (digital or printed). Present your QR code for scanning at the entrance.",
      tips: [
        "Arrive 15-30 minutes early",
        "Bring a valid ID if required",
        "Check for any last-minute updates via email",
      ],
    },
  ];

  const features = [
    {
      title: "Smart Search",
      description:
        "Find events quickly with our intelligent search that understands event titles, locations, and organizers.",
      icon: <FiSearch size={24} />,
    },
    {
      title: "Advanced Filters",
      description:
        "Filter events by category, date range, location, and capacity status to find exactly what you're looking for.",
      icon: <FiFilter size={24} />,
    },
    {
      title: "Save to Bookmarks",
      description:
        "Bookmark interesting events to revisit later and receive updates about registration opening.",
      icon: <FiBookmark size={24} />,
    },
    {
      title: "Share Events",
      description:
        "Share events with friends via email, WhatsApp, or social media directly from the event page.",
      icon: <FiShare2 size={24} />,
    },
    {
      title: "Digital Tickets",
      description:
        "Download digital tickets with QR codes for easy entry. Tickets available in PDF and PNG formats.",
      icon: <MdConfirmationNumber size={24} />,
    },
    {
      title: "Email Reminders",
      description:
        "Automatic email reminders before your registered events to ensure you never miss an event.",
      icon: <FiMail size={24} />,
    },
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="help-article-page">
      <div className="container">
        {/* Back Link */}
        <Link to="/help" className="back-link">
          <FiArrowLeft size={16} /> Back to Help Center
        </Link>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="article-header"
        >
          <h1>Event Registration Guide</h1>
          <p>
            Your complete guide to finding, registering for, and attending
            events
          </p>
        </motion.div>

        {/* Quick Navigation */}
        <div className="quick-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`nav-link ${activeSection === section.id ? "active" : ""}`}
              onClick={() => scrollToSection(section.id)}
            >
              {section.icon}
              <span>{section.title}</span>
            </button>
          ))}
        </div>

        {/* Overview Section */}
        <section id="overview" className="guide-section">
          <h2>Overview</h2>
          <p>
            The KAAF University Events platform makes it easy to discover,
            register for, and attend campus events. From academic conferences
            and workshops to social gatherings and sports competitions, find
            everything you need in one place.
          </p>

          <div className="stats-highlight">
            <div className="stat">
              <div className="stat-number">50+</div>
              <div className="stat-label">Events Monthly</div>
            </div>
            <div className="stat">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat">
              <div className="stat-number">95%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Browse Events Section */}
        <section id="browse" className="guide-section">
          <h2>Browse Events</h2>
          <div className="steps-container">
            {steps.slice(0, 1).map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">1</div>
                <div className="step-icon">{step.icon}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
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
              </div>
            ))}
          </div>

          <div className="tip-card info-card">
            <h3>🔍 Finding the Right Event</h3>
            <ul>
              <li>
                Use the category filter to browse by event type (Conference,
                Workshop, Social, etc.)
              </li>
              <li>Check the "Featured" badge for highlighted events</li>
              <li>View capacity status to see if spots are still available</li>
              <li>Save events to your bookmarks to track them</li>
            </ul>
          </div>
        </section>

        {/* Registration Section */}
        <section id="register" className="guide-section">
          <h2>Registration Process</h2>
          <div className="steps-container">
            {steps.slice(1, 3).map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{index + 2}</div>
                <div className="step-icon">{step.icon}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
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
              </div>
            ))}
          </div>

          <div className="alert-info">
            <FiAlertCircle size={20} />
            <div>
              <strong>Important:</strong> Some events may require additional
              information during registration such as dietary restrictions,
              accommodation needs, or emergency contact details. Please provide
              accurate information for the best experience.
            </div>
          </div>
        </section>

        {/* Tickets & Entry Section */}
        <section id="tickets" className="guide-section">
          <h2>Tickets & Entry</h2>
          <div className="steps-container">
            {steps.slice(3, 5).map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{index + 4}</div>
                <div className="step-icon">{step.icon}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
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
              </div>
            ))}
          </div>

          <div className="tip-card success-card">
            <h3>✅ Entry Requirements</h3>
            <ul>
              <li>Digital or printed ticket with QR code</li>
              <li>
                Valid student/faculty ID (for student/faculty-only events)
              </li>
              <li>Event-specific requirements (noted on event page)</li>
              <li>Arrive 15-30 minutes before start time</li>
            </ul>
          </div>
        </section>

        {/* Manage Registrations Section */}
        <section id="manage" className="guide-section">
          <h2>Manage Your Registrations</h2>
          <div className="manage-grid">
            <div className="manage-card">
              <div className="manage-icon">
                <FiEye size={24} />
              </div>
              <h3>View Registrations</h3>
              <p>
                Access all your registered events from the 'My Registrations'
                page. See upcoming, past, and cancelled registrations at a
                glance.
              </p>
            </div>
            <div className="manage-card">
              <div className="manage-icon">
                <FiDownload size={24} />
              </div>
              <h3>Download Tickets</h3>
              <p>
                Download tickets in PDF or PNG format. Each ticket contains a
                unique QR code for entry verification.
              </p>
            </div>
            <div className="manage-card">
              <div className="manage-icon">
                <FiXCircle size={24} />
              </div>
              <h3>Cancel Registration</h3>
              <p>
                Cancel your registration before the deadline. Your spot will be
                released for other participants.
              </p>
            </div>
            <div className="manage-card">
              <div className="manage-icon">
                <FiBell size={24} />
              </div>
              <h3>Receive Updates</h3>
              <p>
                Get email notifications about event changes, reminders, and
                important announcements.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="guide-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${expandedFaq === index ? "expanded" : ""}`}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>
                  <FiChevronRight
                    className={`chevron ${expandedFaq === index ? "rotated" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {expandedFaq === index && (
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
              </div>
            ))}
          </div>
        </section>

        {/* Still Need Help */}
        <div className="helpful-links">
          <h3>Need more help with events?</h3>
          <div className="links-grid">
            <Link to="/help/getting-started" className="help-link">
              Getting Started Guide
            </Link>
            <Link to="/help/security-tips" className="help-link">
              Security Tips
            </Link>
            <Link to="/help/notifications" className="help-link">
              Notification Setup
            </Link>
            <Link to="/faq" className="help-link">
              General FAQ
            </Link>
          </div>
          <div className="contact-options">
            <a href="mailto:events@kaaf.edu" className="contact-link">
              <FiMail size={16} /> events@kaaf.edu
            </a>
            <a href="tel:+233123456789" className="contact-link">
              <FiMessageCircle size={16} /> Live Chat Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventGuidePage;
