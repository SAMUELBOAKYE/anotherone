/* eslint-disable no-unused-vars */
// src/pages/HomePage.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Megaphone,
  Calendar,
  Bell,
  BarChart3,
  ArrowRight,
  Users,
  TrendingUp,
  Sparkles,
  Shield,
  Zap,
  ChevronRight,
  Clock,
  MapPin,
  Star,
  Award,
  MessageSquare,
  Gift,
  Play,
  Pause,
  CheckCircle,
  Cloud,
  Activity,
  AlertCircle,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Rocket,
  Target,
  Crown,
  Diamond,
  Globe,
  Cpu,
  Heart,
  ThumbsUp,
  Eye,
  Share2,
} from "lucide-react";
import kaafLogo from "../assets/images/kaaf.jpg";
import NoticeList from "../components/notice/NoticeList";
import EventList from "../components/event/EventList";
import "../styles/components/HomePage.css";

const HomePage = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef();
  const testimonialIntervalRef = useRef();

  const stats = [
    {
      icon: Megaphone,
      value: 524,
      label: "Notices Published",
      suffix: "+",
      color: "#3b82f6",
    },
    {
      icon: Calendar,
      value: 128,
      label: "Events Hosted",
      suffix: "+",
      color: "#10b981",
    },
    {
      icon: Users,
      value: 5240,
      label: "Active Users",
      suffix: "+",
      color: "#f59e0b",
    },
    {
      icon: TrendingUp,
      value: 95,
      label: "Satisfaction Rate",
      suffix: "%",
      color: "#ef4444",
    },
  ];

  const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0));

  const features = [
    {
      icon: Megaphone,
      title: "Real-time Notices",
      description:
        "Get instant updates on university announcements and important notices",
      stat: "99.9% Uptime",
    },
    {
      icon: Calendar,
      title: "Event Management",
      description:
        "Discover and register for university events, workshops, and seminars",
      stat: "500+ Events Yearly",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Receive personalized notifications based on your interests",
      stat: "Instant Delivery",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track engagement and participation across the platform",
      stat: "Real-time Analytics",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Enterprise-grade security with encrypted data transmission",
      stat: "256-bit Encryption",
    },
    {
      icon: Cloud,
      title: "Cloud Integration",
      description:
        "Seamless integration with university systems and cloud services",
      stat: "24/7 Availability",
    },
  ];

  const testimonials = [
    // {
    //   name: "Dr. Sarah Johnson",
    //   role: "Professor, Computer Science",
    //   content:
    //     "The noticeboard has revolutionized how we communicate with students. It's efficient, reliable, and user-friendly.",
    //   avatar: "SJ",
    //   rating: 5,
    // },
    {
      name: "Kevin Aidoo",
      role: "Student, Engineering",
      content:
        "I never miss any important announcement now. The real-time notifications keep me updated with all campus events.",
      avatar: "MO",
      rating: 5,
    },
    {
      name: "Boakye Yiadom Samuel",
      role: "Student, CompSci",
      content:
        "An essential tool for campus communication. The analytics help us understand student engagement better.",
      avatar: "AS",
      rating: 5,
    },
    {
      name: "Ajala Emmanuel",
      role: "Student, CompSci",
      content:
        "The platform has streamlined our research announcements and seminar registrations significantly.",
      avatar: "JW",
      rating: 5,
    },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    if (isPlaying) {
      testimonialIntervalRef.current = setInterval(() => {
        setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
    }
    return () => clearInterval(testimonialIntervalRef.current);
  }, [isPlaying, testimonials.length]);

  // Mouse move effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Animate stats
  useEffect(() => {
    const timer = setTimeout(() => {
      stats.forEach((stat, index) => {
        let start = 0;
        const end = stat.value;
        const duration = 2000;
        const increment = end / (duration / 16);
        const interval = setInterval(() => {
          start += increment;
          if (start >= end) {
            setAnimatedStats((prev) => {
              const newStats = [...prev];
              newStats[index] = end;
              return newStats;
            });
            clearInterval(interval);
          } else {
            setAnimatedStats((prev) => {
              const newStats = [...prev];
              newStats[index] = Math.floor(start);
              return newStats;
            });
          }
        }, 16);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const revealElements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 },
    );
    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-overlay"></div>
        <div
          className="hero-gradient-effect"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)`,
          }}
        ></div>
        <div className="hero-blur-1"></div>
        <div className="hero-blur-2"></div>

        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-logo-wrapper">
              <img src={kaafLogo} alt="KAAF University" className="hero-logo" />
            </div>

            <div className="hero-badge">
              <Sparkles size={16} />
              <span>Welcome to KAAF University</span>
            </div>

            <h1 className="hero-title">
              Stay Connected with
              <span className="hero-title-gradient"> Campus Life</span>
            </h1>

            <p className="hero-description">
              Your central hub for university notices, events, and
              announcements. Never miss important updates.
            </p>

            <div className="hero-buttons">
              <Link to="/notices" className="btn-primary">
                <Megaphone size={18} />
                View Notices
                <ArrowRight size={16} />
              </Link>
              <Link to="/events" className="btn-secondary">
                <Calendar size={18} />
                Explore Events
              </Link>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="stat-card">
                    <Icon size={32} />
                    <div className="stat-number">
                      {animatedStats[index]}
                      {stat.suffix}
                    </div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-badge">
              <Zap size={14} />
              <span>Why Choose Us</span>
            </div>
            <h2 className="section-title">
              Powerful Features for Modern Campus Communication
            </h2>
            <p className="section-subtitle">
              Everything you need to stay informed and engaged with university
              life
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="feature-card reveal">
                  <div className="feature-icon">
                    <Icon size={32} />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                  <div className="feature-stats">
                    <Activity size={14} />
                    <span>{feature.stat}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Notices */}
      <section className="notices-section">
        <div className="container">
          <div className="section-header-row reveal">
            <div>
              <div className="section-badge">
                <Megaphone size={14} />
                <span>Latest Updates</span>
              </div>
              <h2 className="section-title">Recent Announcements</h2>
              <p className="section-subtitle">
                Stay informed with the latest notices from the university
              </p>
            </div>
            <Link to="/notices" className="view-all-link">
              View All Notices
              <ArrowRight size={16} />
            </Link>
          </div>
          <NoticeList filters={{ limit: 3 }} />
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="events-section">
        <div className="container">
          <div className="section-header-row reveal">
            <div>
              <div className="section-badge">
                <Calendar size={14} />
                <span>Upcoming Events</span>
              </div>
              <h2 className="section-title">What's Happening</h2>
              <p className="section-subtitle">
                Join us for these exciting upcoming events
              </p>
            </div>
            <Link to="/events" className="view-all-link">
              View All Events
              <ArrowRight size={16} />
            </Link>
          </div>
          <EventList filters={{ limit: 3, dateRange: "upcoming" }} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header-center reveal">
            <div className="section-badge-white">
              <MessageSquare size={14} />
              <span>Testimonials</span>
            </div>
            <h2 className="section-title-white">What Our Community Says</h2>
            <p className="section-subtitle-white">
              Trusted by students, faculty, and staff across campus
            </p>
          </div>

          <div className="testimonials-container">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`testimonial-card ${activeTestimonial === index ? "active" : ""}`}
              >
                <div className="testimonial-quote">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path
                      d="M15 18H9V12H15V18ZM24 18H18V12H24V18ZM15 27H9V21H15V27ZM24 27H18V21H24V27Z"
                      fill="#8b5cf6"
                      fillOpacity="0.2"
                    />
                  </svg>
                </div>
                <p className="testimonial-content">{testimonial.content}</p>
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{testimonial.avatar}</div>
                  <div>
                    <div className="testimonial-name">{testimonial.name}</div>
                    <div className="testimonial-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}

            <div className="testimonial-controls">
              <button
                onClick={() =>
                  setActiveTestimonial((prev) =>
                    prev === 0 ? testimonials.length - 1 : prev - 1,
                  )
                }
                className="control-btn"
              >
                <ChevronRight size={20} />
              </button>
              <div className="testimonial-dots">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`dot ${activeTestimonial === index ? "active" : ""}`}
                  />
                ))}
              </div>
              <button
                onClick={() =>
                  setActiveTestimonial(
                    (prev) => (prev + 1) % testimonials.length,
                  )
                }
                className="control-btn"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="play-pause-btn"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-overlay"></div>
        <div className="container">
          <div className="cta-content">
            <div className="cta-badge">
              <Gift size={14} />
              <span>Get Started Today</span>
            </div>
            <h2 className="cta-title">Join Our Growing Community</h2>
            <p className="cta-description">
              Create an account to get personalized updates, save your favorite
              notices, and never miss important announcements.
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="cta-btn-primary">
                Get Started
                <ArrowRight size={18} />
              </Link>
              <Link to="/about" className="cta-btn-secondary">
                Learn More
              </Link>
            </div>
            <div className="cta-features">
              <div className="cta-feature">
                <CheckCircle size={16} />
                <span>Free registration</span>
              </div>
              <div className="cta-feature">
                <CheckCircle size={16} />
                <span>Personalized notifications</span>
              </div>
              <div className="cta-feature">
                <CheckCircle size={16} />
                <span>Access to exclusive events</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src={kaafLogo} alt="Logo" />
                <span>KAAF University</span>
              </div>
              <p>
                Connecting the university community through effective
                communication.
              </p>
            </div>
            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li>
                  <Link to="/about">About Us</Link>
                </li>
                <li>
                  <Link to="/contact">Contact</Link>
                </li>
                <li>
                  <Link to="/privacy">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/terms">Terms of Service</Link>
                </li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Contact Info</h4>
              <ul>
                <li>
                  <MapPin size={16} /> Kasoa, Ghana
                </li>
                <li>
                  <Phone size={16} /> +233 123 456 789
                </li>
                <li>
                  <Mail size={16} /> info@kaafuniversity.edu.gh
                </li>
              </ul>
            </div>
            <div className="footer-social">
              <h4>Follow Us</h4>
              <div className="social-icons">
                <a href="#">
                  <Facebook size={18} />
                </a>
                <a href="#">
                  <Twitter size={18} />
                </a>
                <a href="#">
                  <Linkedin size={18} />
                </a>
                <a href="#">
                  <Youtube size={18} />
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 KAAF University. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
