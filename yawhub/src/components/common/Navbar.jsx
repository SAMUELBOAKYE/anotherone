// src/components/common/Navbar.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import logo from "../../assets/images/kaaf.jpg";
import NotificationBell from "../notification/NotificationBell";
import "../../styles/components/navbar.css";

// ============================================================
// ADMIN SECRET — must match VITE_ADMIN_SECRET in .env.local
// ============================================================
const ADMIN_SECRET =
  import.meta.env.VITE_ADMIN_SECRET || "kaaf-super-admin-2024";

// Static admin email constant
const STATIC_ADMIN_EMAIL = "boakyesamuel189@gmail.com";

// Icons
const MenuIcon = React.memo(() => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 12H21M3 6H21M3 18H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
));
MenuIcon.displayName = "MenuIcon";

const CloseIcon = React.memo(() => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
));
CloseIcon.displayName = "CloseIcon";

const UserIcon = React.memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21M16 7C16 9.2 14.2 11 12 11C9.8 11 8 9.2 8 7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
));
UserIcon.displayName = "UserIcon";

const ChevronIcon = React.memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
ChevronIcon.displayName = "ChevronIcon";

const ShieldIcon = React.memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L3 7L12 12L21 7L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12V22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 12L21 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
));
ShieldIcon.displayName = "ShieldIcon";

const HomeIcon = React.memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
HomeIcon.displayName = "HomeIcon";

const NoticeIcon = React.memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38756 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38756 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
NoticeIcon.displayName = "NoticeIcon";

const EventIcon = React.memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
));
EventIcon.displayName = "EventIcon";

const DashboardIcon = React.memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 6H20M4 12H20M4 18H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect
      x="4"
      y="3"
      width="16"
      height="18"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
));
DashboardIcon.displayName = "DashboardIcon";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const {
    isAuthenticated,
    user,
    logout,
    isLoading: authLoading,
    isAdmin: isUserAdmin,
  } = useAuth();
  useNotification();

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const mobileMenuBtnRef = useRef(null);

  // ── Check if current user is admin ─────────────────────────
  const isAdminUser = useCallback(() => {
    return (
      user?.role === "admin" ||
      user?.role === "super_admin" ||
      user?.email === STATIC_ADMIN_EMAIL ||
      isUserAdmin
    );
  }, [user, isUserAdmin]);

  // ── Admin portal URL (includes secret key) ─────────────────
  const adminPortalUrl = `/admin/register-standalone?key=${ADMIN_SECRET}`;

  // ── Scroll effect ───────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Close menu on route change ──────────────────────────────
  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location]);

  // ── Click outside handler ───────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        mobileMenuBtnRef.current &&
        !mobileMenuBtnRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    // Prevent body scroll when menu is open
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // ── Escape key handler ──────────────────────────────────────
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setIsDropdownOpen(false);
      setIsMenuOpen(false);
      await logout();
      navigate("/login", {
        state: { message: "Successfully logged out" },
        replace: true,
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout, navigate]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
    setIsDropdownOpen(false);
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleLinkClick = useCallback(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, []);

  const isActiveLink = useCallback(
    (to, exact = false) => {
      if (exact) return location.pathname === to;
      return location.pathname.startsWith(to);
    },
    [location.pathname],
  );

  const getUserDisplayName = useCallback(() => {
    if (user?.firstName && user?.lastName)
      return `${user.firstName} ${user.lastName}`;
    if (user?.name) return user.name;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  }, [user?.firstName, user?.lastName, user?.name, user?.email]);

  const getUserAvatar = useCallback(() => user?.avatar || null, [user?.avatar]);

  const getUserRole = useCallback(() => {
    if (user?.email === STATIC_ADMIN_EMAIL) return "admin";
    return user?.role || "user";
  }, [user?.role, user?.email]);

  // Navigation links with icons for mobile
  const navigationLinks = [
    { to: "/", label: "Home", exact: true, icon: <HomeIcon /> },
    { to: "/notices", label: "Notices", icon: <NoticeIcon /> },
    { to: "/events", label: "Events", icon: <EventIcon /> },
  ];

  const unauthenticatedLinks = [
    { to: "/login", label: "Login", icon: null },
    { to: "/register", label: "Register", icon: null },
  ];

  if (authLoading) {
    return (
      <nav className="navbar navbar-loading" aria-label="Loading navigation">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div className="navbar-brand-logo-placeholder"></div>
            <div className="navbar-brand-text-group">
              <span className="navbar-brand-text">KAAF University</span>
              <span className="navbar-brand-subtext">Noticeboard</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`navbar ${isScrolled ? "navbar-scrolled" : ""}`}
      aria-label="Main navigation"
    >
      <div className="navbar-container">
        {/* Logo/Brand */}
        <Link
          to="/"
          className="navbar-brand"
          onClick={handleLinkClick}
          aria-label="Go to homepage"
        >
          {!logoError ? (
            <img
              src={logo}
              alt="KAAF University Logo"
              className="navbar-logo"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="navbar-logo-fallback">🏛️</div>
          )}
          <div className="navbar-brand-text-group">
            <span className="navbar-brand-text">KAAF University</span>
            <span className="navbar-brand-subtext">Noticeboard</span>
          </div>
        </Link>

        {/* Mobile Menu Button */}
        <button
          ref={mobileMenuBtnRef}
          className="mobile-menu-btn"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="navbar-menu"
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Navigation Menu */}
        <div
          id="navbar-menu"
          ref={menuRef}
          className={`navbar-menu ${isMenuOpen ? "active" : ""}`}
          aria-hidden={!isMenuOpen}
        >
          <div className="navbar-menu-inner">
            {/* Main Navigation Links */}
            <div
              className="navbar-nav"
              role="navigation"
              aria-label="Main links"
            >
              {navigationLinks.map(({ to, label, exact, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`navbar-link ${isActiveLink(to, exact) ? "active" : ""}`}
                  onClick={handleLinkClick}
                  aria-current={isActiveLink(to, exact) ? "page" : undefined}
                >
                  {icon && <span className="navbar-link-icon">{icon}</span>}
                  <span className="navbar-link-text">{label}</span>
                </Link>
              ))}
            </div>

            {/* Auth Section */}
            <div className="navbar-auth-section">
              {isAuthenticated ? (
                <>
                  {/* Dashboard link */}
                  <Link
                    to="/dashboard"
                    className={`navbar-link ${isActiveLink("/dashboard") ? "active" : ""}`}
                    onClick={handleLinkClick}
                  >
                    <DashboardIcon />
                    <span className="navbar-link-text">Dashboard</span>
                  </Link>

                  {/* Notification Bell */}
                  <div className="navbar-notification-wrapper">
                    <NotificationBell />
                  </div>

                  {/* User Dropdown */}
                  <div className="navbar-dropdown" ref={dropdownRef}>
                    <button
                      className="navbar-dropdown-trigger"
                      onClick={toggleDropdown}
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="true"
                      aria-label="User menu"
                    >
                      <span className="user-avatar">
                        {getUserAvatar() ? (
                          <img
                            src={getUserAvatar()}
                            alt={getUserDisplayName()}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <UserIcon />
                        )}
                      </span>
                      <span className="user-name">{getUserDisplayName()}</span>
                      <span
                        className={`dropdown-chevron ${isDropdownOpen ? "open" : ""}`}
                      >
                        <ChevronIcon />
                      </span>
                    </button>

                    {isDropdownOpen && (
                      <div
                        className="dropdown-menu"
                        role="menu"
                        aria-label="User menu options"
                      >
                        {/* User Info */}
                        <div className="dropdown-user-info">
                          <div className="user-avatar-large">
                            {getUserAvatar() ? (
                              <img
                                src={getUserAvatar()}
                                alt={getUserDisplayName()}
                              />
                            ) : (
                              <UserIcon />
                            )}
                          </div>
                          <div className="user-details">
                            <span className="user-name-full">
                              {getUserDisplayName()}
                            </span>
                            {user?.email && (
                              <span className="user-email">{user.email}</span>
                            )}
                            <span
                              className={`user-role-badge role-${getUserRole()}`}
                            >
                              {getUserRole()}
                            </span>
                          </div>
                        </div>

                        <div className="dropdown-divider" />

                        <Link
                          to="/profile"
                          className="dropdown-item"
                          onClick={handleLinkClick}
                          role="menuitem"
                        >
                          Profile Settings
                        </Link>

                        <Link
                          to="/settings"
                          className="dropdown-item"
                          onClick={handleLinkClick}
                          role="menuitem"
                        >
                          Account Settings
                        </Link>

                        {/* ── ADMIN LINKS — only visible when logged in as admin ── */}
                        {isAdminUser() && (
                          <>
                            <div className="dropdown-divider" />

                            {/* Admin Dashboard */}
                            <Link
                              to="/admin/dashboard"
                              className="dropdown-item admin-item"
                              onClick={handleLinkClick}
                              role="menuitem"
                            >
                              <ShieldIcon />
                              Admin Dashboard
                            </Link>

                            {/* Admin Portal — includes secret key so it works */}
                            <Link
                              to={adminPortalUrl}
                              className="dropdown-item admin-item"
                              onClick={handleLinkClick}
                              role="menuitem"
                            >
                              <ShieldIcon />
                              Admin Portal
                            </Link>
                          </>
                        )}

                        <div className="dropdown-divider" />

                        <button
                          onClick={handleLogout}
                          className="dropdown-item logout-btn"
                          role="menuitem"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* ── PUBLIC LINKS — Login & Register only ─────────── */}
                  {unauthenticatedLinks.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className={`navbar-link ${isActiveLink(to) ? "active" : ""}`}
                      onClick={handleLinkClick}
                      aria-current={isActiveLink(to) ? "page" : undefined}
                    >
                      <span className="navbar-link-text">{label}</span>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMenuOpen && (
        <div
          className="navbar-overlay"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
          role="presentation"
        />
      )}
    </nav>
  );
};

Navbar.displayName = "Navbar";
export default React.memo(Navbar);
