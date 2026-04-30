// src/pages/help/TroubleshootingPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiWifi,
  FiLogIn,
  FiFileText,
  FiBell,
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiHelpCircle,
  FiMail,
  FiUser,
  FiLock,
  FiSmartphone,
  FiPrinter,
  FiEye,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import "../styles/components/HelpArticle.css";

const TroubleshootingPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    {
      id: "account",
      title: "Account & Login Issues",
      icon: <FiLogIn size={20} />,
      color: "#4f46e5",
      problems: [
        {
          id: 1,
          title: "Can't log in to my account",
          symptoms: [
            "Incorrect username or password error",
            "Account locked after multiple attempts",
            "Login page not loading properly",
          ],
          solutions: [
            "Verify your email address and password are correct",
            "Use the 'Forgot Password' link to reset your password",
            "Clear your browser cache and cookies",
            "Try logging in from an incognito/private window",
            "Contact support if the issue persists",
          ],
          resolution:
            "Most login issues are resolved by password reset or clearing browser data.",
        },
        {
          id: 2,
          title: "Forgot password reset email not received",
          symptoms: [
            "No email after requesting password reset",
            "Reset link expired",
            "Email not in spam folder",
          ],
          solutions: [
            "Check your spam/junk folder",
            "Wait 5-10 minutes as emails may be delayed",
            "Request a new reset link",
            "Add noreply@kaaf.edu to your contacts",
            "Contact IT support for manual reset",
          ],
          resolution:
            "Check spam folder and request a new reset link. Contact support if still not received.",
        },
        {
          id: 3,
          title: "Account locked or suspended",
          symptoms: [
            "Cannot access account features",
            "Account suspended message",
            "Verification required notification",
          ],
          solutions: [
            "Wait 15-30 minutes for automatic unlock",
            "Verify your email address",
            "Complete any pending verification steps",
            "Contact support to verify your identity",
            "Check for any policy violations",
          ],
          resolution:
            "Account lock typically resolves after waiting or completing verification.",
        },
      ],
    },
    {
      id: "connection",
      title: "Connection & Performance Issues",
      icon: <FiWifi size={20} />,
      color: "#10b981",
      problems: [
        {
          id: 4,
          title: "Page loading slowly or timing out",
          symptoms: [
            "Pages take long to load",
            "Connection timeout errors",
            "Images not displaying properly",
          ],
          solutions: [
            "Check your internet connection speed",
            "Refresh the page (Ctrl+F5 for hard refresh)",
            "Try accessing during off-peak hours",
            "Disable VPN or proxy temporarily",
            "Use a wired connection instead of WiFi",
          ],
          resolution:
            "Check internet speed and try during off-peak hours for better performance.",
        },
        {
          id: 5,
          title: "Mobile app not working properly",
          symptoms: [
            "App crashes on launch",
            "Features not loading",
            "Push notifications not working",
          ],
          solutions: [
            "Update to the latest app version",
            "Clear app cache and data",
            "Reinstall the application",
            "Check device storage space",
            "Update your device operating system",
          ],
          resolution:
            "Update or reinstall the app to resolve most mobile issues.",
        },
      ],
    },
    {
      id: "events",
      title: "Events & Registration Issues",
      icon: <FiCalendar size={20} />,
      color: "#f59e0b",
      problems: [
        {
          id: 6,
          title: "Can't register for an event",
          symptoms: [
            "Registration button disabled",
            "Event full message",
            "Payment processing error",
          ],
          solutions: [
            "Check if registration deadline has passed",
            "Verify event capacity hasn't been reached",
            "Clear browser cache and retry",
            "Try a different browser or device",
            "Contact event coordinator",
          ],
          resolution:
            "Check event availability and deadlines. Contact coordinator for assistance.",
        },
        {
          id: 7,
          title: "Event ticket not downloading",
          symptoms: [
            "Download button not working",
            "PDF generation error",
            "Ticket not in email",
          ],
          solutions: [
            "Disable pop-up blocker",
            "Check email spam folder for ticket",
            "Try downloading from different browser",
            "Request ticket resend from event page",
            "Take screenshot as temporary proof",
          ],
          resolution:
            "Disable pop-up blockers and check spam folder for email tickets.",
        },
      ],
    },
    {
      id: "notifications",
      title: "Notification Issues",
      icon: <FiBell size={20} />,
      color: "#ec4899",
      problems: [
        {
          id: 8,
          title: "Not receiving email notifications",
          symptoms: [
            "No event reminders",
            "Missed announcement emails",
            "Weekly digest not arriving",
          ],
          solutions: [
            "Check notification settings in profile",
            "Add noreply@kaaf.edu to safe senders",
            "Verify email address is correct",
            "Check spam/junk folder",
            "Update email preferences",
          ],
          resolution:
            "Verify email settings and check spam folder for missing notifications.",
        },
        {
          id: 9,
          title: "Push notifications not working on mobile",
          symptoms: [
            "No alerts on phone",
            "Notifications disabled message",
            "Browser permissions issue",
          ],
          solutions: [
            "Enable notifications in device settings",
            "Check browser notification permissions",
            "Re-enable notifications in app",
            "Update app to latest version",
            "Restart your device",
          ],
          resolution:
            "Check device and browser notification permissions to restore push alerts.",
        },
      ],
    },
  ];

  const faqs = [
    {
      question: "How do I reset my password?",
      answer:
        "Click on 'Forgot Password' on the login page. Enter your registered email address and follow the instructions sent to your email. If you don't receive the email within 10 minutes, check your spam folder or contact support.",
    },
    {
      question: "Why can't I see certain events?",
      answer:
        "Some events may be restricted to specific departments or user roles. Ensure you're logged in with the correct account type (student/faculty/staff). Some events may also be hidden if registration has closed or if you've already registered.",
    },
    {
      question: "How do I update my profile information?",
      answer:
        "Navigate to your Profile page from the dashboard. Click 'Edit Profile' to update your personal information, contact details, and profile photo. Changes may take a few minutes to reflect across the system.",
    },
    {
      question: "What should I do if I encounter a bug?",
      answer:
        "Take screenshots of the issue, note the time it occurred, and report it to support@kaaf.edu with a detailed description of the problem. Include your browser version and device information for faster resolution.",
    },
    {
      question: "How do I unsubscribe from notifications?",
      answer:
        "Go to Settings > Notifications. You can toggle off specific notification types or adjust frequency. Email notifications can also be managed by clicking 'Unsubscribe' at the bottom of any notification email.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="help-article-page troubleshooting-page">
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
          <h1>Troubleshooting Guide</h1>
          <p>Find solutions to common issues and get back on track quickly</p>
        </motion.div>

        {/* Search Bar */}
        <div className="troubleshooting-search">
          <FiSearch size={20} />
          <input
            type="text"
            placeholder="Search for solutions, error messages, or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Quick Help Banner */}
        <div className="quick-help">
          <FiHelpCircle size={24} />
          <div>
            <strong>Need immediate assistance?</strong>
            <p>
              Our support team is available 24/7 to help you resolve any issues
            </p>
          </div>
          <Link to="/contact" className="quick-help-btn">
            Contact Support
          </Link>
        </div>

        {/* Problem Categories */}
        <div className="categories-section">
          <h2>Common Problems by Category</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                className="category-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ borderTopColor: category.color }}
              >
                <div
                  className="category-header"
                  style={{ color: category.color }}
                >
                  {category.icon}
                  <h3>{category.title}</h3>
                </div>
                <div className="problem-list">
                  {category.problems.map((problem) => (
                    <details key={problem.id} className="problem-details">
                      <summary>
                        <FiAlertCircle size={16} />
                        {problem.title}
                        <FiChevronDown className="details-arrow" />
                      </summary>
                      <div className="problem-content">
                        <div className="symptoms">
                          <h4>📋 Common Symptoms:</h4>
                          <ul>
                            {problem.symptoms.map((symptom, i) => (
                              <li key={i}>{symptom}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="solutions">
                          <h4>✅ Solutions to Try:</h4>
                          <ul>
                            {problem.solutions.map((solution, i) => (
                              <li key={i}>{solution}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="resolution">
                          <FiCheckCircle size={16} />
                          <span>{problem.resolution}</span>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <p className="faq-subtitle">Quick answers to common questions</p>

          {searchTerm && (
            <div className="search-results-count">
              Found {filteredFaqs.length} result
              {filteredFaqs.length !== 1 ? "s" : ""} for "{searchTerm}"
            </div>
          )}

          <div className="faq-list">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  className={`faq-item ${expandedFaq === index ? "expanded" : ""}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    className="faq-question"
                    onClick={() => toggleFaq(index)}
                  >
                    <span>{faq.question}</span>
                    {expandedFaq === index ? (
                      <FiChevronUp />
                    ) : (
                      <FiChevronDown />
                    )}
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
                </motion.div>
              ))
            ) : (
              <div className="no-results">
                <FiSearch size={48} />
                <h3>No results found</h3>
                <p>Try different keywords or browse the categories above</p>
                <button onClick={() => setSearchTerm("")}>Clear Search</button>
              </div>
            )}
          </div>
        </div>

        {/* Still Need Help Section */}
        <div className="still-need-help">
          <div className="help-content">
            <h3>Still experiencing issues?</h3>
            <p>
              Our dedicated support team is ready to assist you with any
              technical problems
            </p>
            <div className="help-options">
              <Link to="/contact" className="help-option">
                <FiMail size={20} />
                <span>Email Support</span>
              </Link>
              <Link to="/faq" className="help-option">
                <FiHelpCircle size={20} />
                <span>Visit FAQ</span>
              </Link>
              <a href="tel:+233123456789" className="help-option">
                <FiSmartphone size={20} />
                <span>Call Support</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingPage;
