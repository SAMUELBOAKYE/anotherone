// src/pages/AboutPage.jsx - FIXED
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTerminal,
  FiCpu,
  FiDatabase,
  FiServer,
  FiCloud,
  FiCode,
  FiGitBranch,
  FiUsers,
  FiCalendar,
  FiClock,
  FiShield,
  FiLock,
  FiZap,
  FiTrendingUp,
  FiAward,
  FiStar,
  FiHeart,
  FiGlobe,
  FiMail,
  FiGithub,
  FiLinkedin,
  FiTwitter,
  FiFacebook,
  FiInstagram,
  FiChevronRight,
  FiCommand,
  FiHardDrive,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiBox,
  FiLayers,
  FiWifi,
  FiBattery,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiCheckCircle,
} from "react-icons/fi";
import {
  MdCode,
  MdStorage,
  MdSecurity,
  MdAnalytics,
  MdSpeed,
  MdPeople,
  MdEvent,
  MdAnnouncement,
  MdDashboard,
  MdSettings,
  MdNotifications,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdAccessTime,
} from "react-icons/md";
import "../styles/components/AboutPage.css";

const AboutPage = () => {
  const [commandInput, setCommandInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState([
    { type: "system", content: "KAAF University Noticeboard System v5.0.0" },
    { type: "system", content: "Interactive System Information Terminal" },
    { type: "system", content: "Type 'help' to see available commands" },
    { type: "system", content: "─".repeat(60) },
    { type: "output", content: "" },
  ]);
  const [activeCommand, setActiveCommand] = useState(null);
  const [typingEffect, setTypingEffect] = useState(false);

  // System information data
  const systemInfo = {
    version: "5.0.0",
    releaseDate: "2025-01-15",
    buildNumber: "BUILD-2025.01.15-001",
    environment: "Production",
    status: "Operational",
    uptime: "99.98%",
    lastDeploy: "2025-01-15 08:30:00 UTC",
    framework: "React 18.3.1",
    backend: "Node.js + Express",
    database: "MongoDB + Redis",
    hosting: "AWS Cloud",
    apiVersion: "v2.1.0",
    websocket: "Socket.io v4.5.0",
  };

  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalEvents: 89,
    totalNotices: 342,
    totalRegistrations: 5678,
    dailyActive: 456,
    monthlyGrowth: "+15.3%",
    satisfaction: "94.8%",
  };

  const features = [
    {
      name: "Event Management",
      status: " Active",
      icon: <MdEvent size={16} />,
    },
    {
      name: "Notice Board",
      status: " Active",
      icon: <MdAnnouncement size={16} />,
    },
    {
      name: "User Authentication",
      status: " Secure",
      icon: <FiShield size={16} />,
    },
    {
      name: "Real-time Notifications",
      status: " Online",
      icon: <MdNotifications size={16} />,
    },
    {
      name: "Analytics Dashboard",
      status: " Live",
      icon: <MdAnalytics size={16} />,
    },
    { name: "API Gateway", status: " Connected", icon: <FiGlobe size={16} /> },
    {
      name: "Database",
      status: " Operational",
      icon: <FiDatabase size={16} />,
    },
    { name: "CDN", status: " Global", icon: <FiGlobe size={16} /> },
  ];

  const team = [
    {
      role: "Lead Developer",
      name: "Samuel Boakye",
      expertise: "Full Stack Architecture",
      icon: <FiCode size={20} />,
    },
    {
      role: "Backend Engineer",
      name: "Boakye Samuel",
      expertise: "API & Database",
      icon: <FiServer size={20} />,
    },
    {
      role: "Frontend Developer",
      name: "Boakye Yiadom",
      expertise: "UI/UX & React",
      icon: <FiMonitor size={20} />,
    },
    {
      role: "Security Analyst",
      name: "Samuel Boakye Yiadom",
      expertise: "Cybersecurity",
      icon: <FiShield size={20} />,
    },
  ];

  const technologies = [
    { name: "React 18", category: "Frontend", version: "18.3.1" },
    { name: "Node.js", category: "Backend", version: "20.x" },
    { name: "Express", category: "Backend", version: "4.18.x" },
    { name: "MongoDB", category: "Database", version: "6.0" },
    { name: "Redis", category: "Cache", version: "7.2" },
    { name: "Socket.io", category: "WebSocket", version: "4.5" },
    { name: "JWT", category: "Auth", version: "9.0" },
    { name: "AWS S3", category: "Storage", version: "latest" },
  ];

  const commands = {
    help: "Show available commands",
    info: "Display system information",
    stats: "Show platform statistics",
    features: "List all active features",
    tech: "Display technology stack",
    team: "Show development team",
    status: "Check system status",
    clear: "Clear terminal screen",
    about: "About this system",
    version: "Show version info",
  };

  const executeCommand = (cmd) => {
    const command = cmd.toLowerCase().trim();
    let output = [];

    switch (command) {
      case "help":
        output.push({ type: "output", content: "Available Commands:" });
        Object.entries(commands).forEach(([cmdKey, desc]) => {
          output.push({
            type: "command",
            content: `  ${cmdKey.padEnd(10)} → ${desc}`,
          });
        });
        break;

      case "info":
        output.push({ type: "output", content: "═".repeat(50) });
        output.push({ type: "output", content: "SYSTEM INFORMATION" });
        output.push({ type: "output", content: "═".repeat(50) });
        Object.entries(systemInfo).forEach(([key, value]) => {
          output.push({
            type: "info",
            content: `${key.padEnd(15)} : ${value}`,
          });
        });
        break;

      case "stats":
        output.push({ type: "output", content: "═".repeat(50) });
        output.push({ type: "output", content: "PLATFORM STATISTICS" });
        output.push({ type: "output", content: "═".repeat(50) });
        Object.entries(stats).forEach(([key, value]) => {
          output.push({
            type: "info",
            content: `${key.padEnd(18)} : ${value}`,
          });
        });
        break;

      case "features":
        output.push({ type: "output", content: "═".repeat(50) });
        output.push({ type: "output", content: "ACTIVE FEATURES" });
        output.push({ type: "output", content: "═".repeat(50) });
        features.forEach((feature) => {
          output.push({
            type: "success",
            content: `${feature.icon} ${feature.name.padEnd(25)} ${feature.status}`,
          });
        });
        break;

      case "tech":
        output.push({ type: "output", content: "═".repeat(50) });
        output.push({ type: "output", content: "TECHNOLOGY STACK" });
        output.push({ type: "output", content: "═".repeat(50) });
        technologies.forEach((tech) => {
          output.push({
            type: "info",
            content: `${tech.name.padEnd(15)} | ${tech.category.padEnd(12)} | v${tech.version}`,
          });
        });
        break;

      case "team":
        output.push({ type: "output", content: "═".repeat(50) });
        output.push({ type: "output", content: "DEVELOPMENT TEAM" });
        output.push({ type: "output", content: "═".repeat(50) });
        team.forEach((member) => {
          output.push({
            type: "info",
            content: `${member.role.padEnd(18)} → ${member.name} (${member.expertise})`,
          });
        });
        break;

      case "status":
        output.push({ type: "output", content: "═".repeat(50) });
        output.push({ type: "output", content: "SYSTEM STATUS" });
        output.push({ type: "output", content: "═".repeat(50) });
        output.push({ type: "success", content: "✓ API Server: Online" });
        output.push({ type: "success", content: "✓ Database: Connected" });
        output.push({ type: "success", content: "✓ WebSocket: Active" });
        output.push({ type: "success", content: "✓ Redis Cache: Operational" });
        output.push({ type: "success", content: "✓ CDN: Global Distribution" });
        break;

      case "about":
        output.push({ type: "output", content: "═".repeat(50) });
        output.push({ type: "output", content: "ABOUT KAAF NOTICEBOARD" });
        output.push({ type: "output", content: "═".repeat(50) });
        output.push({
          type: "output",
          content:
            "KAAF University Noticeboard is a comprehensive digital platform",
        });
        output.push({
          type: "output",
          content:
            "designed to streamline communication between the university",
        });
        output.push({
          type: "output",
          content:
            "administration, faculty, and students. The platform provides",
        });
        output.push({
          type: "output",
          content: "real-time notices, event management, registration system,",
        });
        output.push({
          type: "output",
          content: "and analytics dashboards to enhance campus communication.",
        });
        break;

      case "version":
        output.push({
          type: "output",
          content: `KAAF Noticeboard v${systemInfo.version}`,
        });
        output.push({
          type: "output",
          content: `Build: ${systemInfo.buildNumber}`,
        });
        output.push({
          type: "output",
          content: `Release: ${systemInfo.releaseDate}`,
        });
        break;

      case "clear":
        return { clear: true };

      default:
        output.push({
          type: "error",
          content: `Command not found: '${cmd}'. Type 'help' for available commands.`,
        });
    }

    return { output, clear: false };
  };

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const historyEntry = [{ type: "input", content: `$ ${commandInput}` }];

    const result = executeCommand(commandInput);

    if (result.clear) {
      setTerminalHistory([]);
    } else {
      setTerminalHistory((prev) => [
        ...prev,
        ...historyEntry,
        ...result.output,
      ]);
    }

    setCommandInput("");
    setActiveCommand(commandInput);
  };

  return (
    <div className="about-page">
      <div className="about-container">
        {/* Hero Section */}
        <div className="hero-section">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-icon">
              <FiTerminal size={48} />
            </div>
            <h1 className="hero-title">System Overview</h1>
            <p className="hero-subtitle">
              KAAF University Noticeboard - Enterprise Information System
            </p>
            <div className="hero-badges">
              <span className="badge">
                <FiCheckCircle size={14} /> Production Ready
              </span>
              <span className="badge">
                <FiShield size={14} /> Enterprise Grade
              </span>
              <span className="badge">
                <FiZap size={14} /> High Performance
              </span>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {Object.entries(stats).map(([key, value], index) => (
            <motion.div
              key={key}
              className="stat-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <div className="stat-icon">
                {key === "totalUsers" && <FiUsers size={24} />}
                {key === "activeUsers" && <FiActivity size={24} />}
                {key === "totalEvents" && <MdEvent size={24} />}
                {key === "totalNotices" && <MdAnnouncement size={24} />}
                {key === "totalRegistrations" && <FiDatabase size={24} />}
                {key === "dailyActive" && <FiBarChart2 size={24} />}
                {key === "monthlyGrowth" && <FiTrendingUp size={24} />}
                {key === "satisfaction" && <FiStar size={24} />}
              </div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Terminal Section */}
        <motion.div
          className="terminal-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="terminal-header">
            <div className="terminal-controls">
              <span className="control red"></span>
              <span className="control yellow"></span>
              <span className="control green"></span>
            </div>
            <div className="terminal-title">
              <FiTerminal size={14} /> SYSTEM TERMINAL - KAAF Noticeboard v5.0.0
            </div>
            <div className="terminal-status">
              <span className="status-dot"></span> ONLINE
            </div>
          </div>

          <div className="terminal-body">
            <div className="terminal-output">
              {terminalHistory.map((line, index) => (
                <div key={index} className={`terminal-line ${line.type}`}>
                  {line.type === "input" && <span className="prompt">$</span>}
                  {line.type === "command" && <span className="prompt">→</span>}
                  {line.type === "output" && (
                    <span className="prompt">{">"}</span>
                  )}
                  {line.type === "info" && <span className="prompt">ℹ</span>}
                  {line.type === "success" && <span className="prompt">✓</span>}
                  {line.type === "error" && <span className="prompt">✗</span>}
                  <span className="line-content">{line.content}</span>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleCommandSubmit}
              className="terminal-input-line"
            >
              <span className="prompt">$</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                className="terminal-input"
                placeholder="Type a command..."
                autoFocus
              />
              <span className="cursor">█</span>
            </form>
          </div>
        </motion.div>

        {/* System Architecture */}
        <motion.div
          className="architecture-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="section-title">System Architecture</h2>
          <div className="architecture-grid">
            <div className="arch-card">
              <FiServer size={32} />
              <h3>Frontend Layer</h3>
              <p>React 18 • Redux Toolkit • Framer Motion • Vite</p>
              <div className="arch-stats">
                <span>SPA Architecture</span>
                <span>PWA Ready</span>
                <span>Responsive Design</span>
              </div>
            </div>
            <div className="arch-card">
              <FiDatabase size={32} />
              <h3>Backend Layer</h3>
              <p>Node.js • Express • MongoDB • Redis • JWT</p>
              <div className="arch-stats">
                <span>RESTful API</span>
                <span>WebSocket</span>
                <span>Rate Limiting</span>
              </div>
            </div>
            <div className="arch-card">
              <FiCloud size={32} />
              <h3>Infrastructure</h3>
              <p>AWS • CloudFront • S3 • EC2 • CloudWatch</p>
              <div className="arch-stats">
                <span>Auto-scaling</span>
                <span>CDN Global</span>
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Technology Stack */}
        <motion.div
          className="tech-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="section-title">Technology Stack</h2>
          <div className="tech-grid">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                className="tech-item"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <div className="tech-name">{tech.name}</div>
                <div className="tech-category">{tech.category}</div>
                <div className="tech-version">{tech.version}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="features-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="section-title">Platform Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ x: 4 }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-name">{feature.name}</div>
                <div className="feature-status">{feature.status}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          className="team-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="section-title">Development Team</h2>
          <div className="team-grid">
            {team.map((member, index) => (
              <motion.div
                key={index}
                className="team-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="team-icon">{member.icon}</div>
                <div className="team-role">{member.role}</div>
                <div className="team-name">{member.name}</div>
                <div className="team-expertise">{member.expertise}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="about-footer">
          <div className="footer-info">
            <div className="footer-item">
              <FiGlobe size={16} /> KAAF University Noticeboard
            </div>
            <div className="footer-item">
              <FiCalendar size={16} /> Established 2026
            </div>
            <div className="footer-item">
              <FiHeart size={16} /> Version {systemInfo.version}
            </div>
          </div>
          <div className="footer-links">
            <a href="/privacy" className="footer-link">
              Privacy Policy
            </a>
            <a href="/terms" className="footer-link">
              Terms of Service
            </a>
            <a href="/contact" className="footer-link">
              Contact Us
            </a>
            <a href="/help" className="footer-link">
              Help Center
            </a>
          </div>
          <div className="copyright">
            © 2025 KAAF University. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
