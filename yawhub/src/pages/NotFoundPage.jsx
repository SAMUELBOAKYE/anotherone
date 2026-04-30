import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  ArrowRight,
  Lightbulb,
  LayoutDashboard,
  Calendar,
  User,
  Bell,
  Settings,
  ArrowLeft,
} from "lucide-react";
import "../styles/components/NotFoundPage.css";

/**
 * NotFoundPage Component
 *
 * Handles 404 errors with:
 * - Animated 404 display
 * - Interactive elements
 * - Search functionality
 * - Suggested links
 * - Auto-redirect countdown
 * - Fun easter eggs
 * - Responsive design
 */
const NotFoundPage = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  // Create particles on mount
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, () => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.3,
    }));
    setParticles(newParticles);

    const animateParticles = setInterval(() => {
      setParticles((prev) =>
        prev.map((particle) => ({
          ...particle,
          x: particle.x + particle.speedX,
          y: particle.y + particle.speedY,
          ...(particle.x > 100 ||
          particle.x < 0 ||
          particle.y > 100 ||
          particle.y < 0
            ? {
                x: Math.random() * 100,
                y: Math.random() * 100,
              }
            : {}),
        })),
      );
    }, 50);

    return () => clearInterval(animateParticles);
  }, []);

  /**
   * Handle mouse move for parallax effect
   */
  const handleMouseMove = useCallback((e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 20;
    const y = (clientY / innerHeight - 0.5) * 20;
    setMousePosition({ x, y });
  }, []);

  /**
   * Handle click on 404 text for easter egg
   */
  const handleEasterEggClick = useCallback(() => {
    setClickCount((prev) => {
      const newCount = prev + 1;
      if (newCount === 7) {
        setShowEasterEgg(true);
        setTimeout(() => setShowEasterEgg(false), 5000);
        return 0;
      }
      return newCount;
    });
  }, []);

  /**
   * Handle search
   */
  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      if (searchTerm.trim()) {
        window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
      }
    },
    [searchTerm],
  );

  /**
   * Get random fun fact
   */
  const getFunFact = useCallback(() => {
    const facts = [
      "Did you know? The number 404 is often called a 'Page Not Found' error.",
      "Fun fact: 404 errors are named after room 404 at CERN where the web was born!",
      "The first 404 error was recorded in 1993.",
      "Some websites create custom 404 pages with games and easter eggs.",
      "You're not lost, you're just in a different dimension of the internet!",
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  }, []);

  /**
   * Get random suggestion
   */
  const getSuggestions = useCallback(() => {
    return [
      { name: "Go to Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Browse Events", path: "/events", icon: Calendar },
      { name: "View Profile", path: "/profile", icon: User },
      { name: "Check Notifications", path: "/notifications", icon: Bell },
      { name: "Explore Settings", path: "/settings", icon: Settings },
    ];
  }, []);

  return (
    <div className="not-found-page" onMouseMove={handleMouseMove}>
      {/* Animated Background Particles */}
      <div className="particles-container">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Main Content with Parallax */}
      <div
        className="not-found-content"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
        }}
      >
        {/* Animated 404 Text */}
        <div className="error-code-container">
          <div className="error-code" onClick={handleEasterEggClick}>
            <span className="digit">4</span>
            <span className="digit zero">
              0<div className="zero-ring"></div>
              <div className="zero-glow"></div>
            </span>
            <span className="digit">4</span>
          </div>
          {showEasterEgg && (
            <div className="easter-egg">
              <span>🎉 You found the secret! 🎉</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        <h2 className="error-title">Page Not Found</h2>
        <p className="error-message">
          Oops! The page you're looking for seems to have wandered off into the
          digital wilderness.
        </p>

        {/* Fun Fact */}
        <div className="fun-fact">
          <Lightbulb className="fun-fact-icon" size={20} />
          <p>{getFunFact()}</p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="search-box">
          <input
            type="text"
            placeholder="Search for what you're looking for..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            <Search size={18} />
            Search
          </button>
        </form>

        {/* Suggested Links */}
        <div className="suggestions">
          <h3>You might want to try:</h3>
          <div className="suggestions-grid">
            {getSuggestions().map((suggestion, index) => {
              const IconComponent = suggestion.icon;
              return (
                <Link
                  key={index}
                  to={suggestion.path}
                  className="suggestion-link"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <IconComponent className="suggestion-icon" size={18} />
                  <span>{suggestion.name}</span>
                  <ArrowRight size={14} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="countdown">
          <div className="countdown-ring">
            <svg width="60" height="60" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth="6"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 339.292,
                  strokeDashoffset: 339.292 * (1 - countdown / 10),
                  transform: "rotate(-90deg)",
                  transformOrigin: "50% 50%",
                }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="countdown-number">{countdown}</span>
          </div>
          <p>Redirecting to homepage in {countdown} seconds</p>
          <button onClick={() => navigate("/")} className="redirect-now">
            Take me now
          </button>
        </div>

        {/* Home Link */}
        <Link to="/" className="home-link">
          <Home size={18} />
          Return to Homepage
        </Link>
      </div>

      {/* Decorative Elements */}
      <div className="decorative-elements">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
      </div>
    </div>
  );
};

export default NotFoundPage;
