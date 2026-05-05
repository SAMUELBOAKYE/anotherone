// src/components/common/Navbar.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import logo from "../../assets/images/kaaf.jpg";
import NotificationBell from "../notification/NotificationBell";
import "../../styles/components/navbar.css";

// ============================================================
// ADMIN SECRET
// ============================================================
const ADMIN_SECRET =
  import.meta.env.VITE_ADMIN_SECRET || "kaaf-super-admin-2024";

const STATIC_ADMIN_EMAIL = "boakyesamuel189@gmail.com";

// ============================================================
// Icons
// ============================================================
const MenuIcon = React.memo(() => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M3 12H21M3 6H21M3 18H21" />
  </svg>
));

const CloseIcon = React.memo(() => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M18 6L6 18M6 6L18 18" />
  </svg>
));

const UserIcon = React.memo(() => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21M16 7C16 9.2 14.2 11 12 11C9.8 11 8 9.2 8 7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7Z" />
  </svg>
));

const ChevronIcon = React.memo(() => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9L12 15L18 9" />
  </svg>
));

const ShieldIcon = React.memo(() => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L3 7L12 12L21 7L12 2Z" />
    <path d="M12 12V22" />
    <path d="M12 12L21 7" />
  </svg>
));

const HomeIcon = React.memo(() => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" />
  </svg>
));

const NoticeIcon = React.memo(() => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38756 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38756 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9" />
  </svg>
));

const EventIcon = React.memo(() => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" />
  </svg>
));

const DashboardIcon = React.memo(() => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M4 6H20M4 12H20M4 18H20" />
    <rect x="4" y="3" width="16" height="18" rx="2" />
  </svg>
));

// ============================================================
// Navbar Component
// ============================================================
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

  const isAdminUser = useCallback(
    () =>
      user?.role === "admin" ||
      user?.role === "super_admin" ||
      user?.email === STATIC_ADMIN_EMAIL ||
      isUserAdmin,
    [user, isUserAdmin],
  );

  const adminPortalUrl = `/admin/register-standalone?key=${ADMIN_SECRET}`;

  // Scroll effect
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location]);

  // Click outside + body scroll lock
  useEffect(() => {
    const onMouseDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        mobileMenuBtnRef.current &&
        !mobileMenuBtnRef.current.contains(e.target)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
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
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, [logout, navigate]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((p) => !p);
    setIsDropdownOpen(false);
  }, []);

  const toggleDropdown = useCallback(() => setIsDropdownOpen((p) => !p), []);

  const handleLinkClick = useCallback(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, []);

  const isActiveLink = useCallback(
    (to, exact = false) =>
      exact ? location.pathname === to : location.pathname.startsWith(to),
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

  const navigationLinks = [
    { to: "/", label: "Home", exact: true, icon: <HomeIcon /> },
    { to: "/notices", label: "Notices", icon: <NoticeIcon /> },
    { to: "/events", label: "Events", icon: <EventIcon /> },
  ];

  // Loading state
  if (authLoading) {
    return (
      <nav className="navbar navbar-loading" aria-label="Loading navigation">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div className="navbar-brand-logo-placeholder" />
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
    <>
      {/* Navbar bar */}
      <nav
        className={`navbar ${isScrolled ? "navbar-scrolled" : ""}`}
        aria-label="Main navigation"
      >
        <div className="navbar-container">
          {/* Brand / Logo */}
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

          {/* Desktop Navigation - ONLY visible on tablet/desktop */}
          <div className="navbar-desktop-nav">
            {navigationLinks.map(({ to, label, exact, icon }) => (
              <Link
                key={to}
                to={to}
                className={`navbar-desktop-link ${isActiveLink(to, exact) ? "active" : ""}`}
                onClick={handleLinkClick}
              >
                {icon}
                <span>{label}</span>
              </Link>
            ))}

            {/* Desktop Auth Section */}
            <div className="navbar-desktop-auth">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="navbar-desktop-link">
                    <DashboardIcon />
                    <span>Dashboard</span>
                  </Link>

                  <div className="navbar-notification-wrapper">
                    <NotificationBell />
                  </div>

                  {/* Desktop Dropdown */}
                  <div className="navbar-dropdown" ref={dropdownRef}>
                    <button
                      className="navbar-dropdown-trigger"
                      onClick={toggleDropdown}
                      aria-expanded={isDropdownOpen}
                    >
                      <span className="user-avatar">
                        {getUserAvatar() ? (
                          <img
                            src={getUserAvatar()}
                            alt={getUserDisplayName()}
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
                      <div className="dropdown-menu">
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
                            <span className="user-role-badge">
                              {getUserRole()}
                            </span>
                          </div>
                        </div>
                        <div className="dropdown-divider" />
                        <Link
                          to="/profile"
                          className="dropdown-item"
                          onClick={handleLinkClick}
                        >
                          Profile Settings
                        </Link>
                        <Link
                          to="/settings"
                          className="dropdown-item"
                          onClick={handleLinkClick}
                        >
                          Account Settings
                        </Link>
                        {isAdminUser() && (
                          <>
                            <div className="dropdown-divider" />
                            <Link
                              to="/admin/dashboard"
                              className="dropdown-item admin-item"
                              onClick={handleLinkClick}
                            >
                              <ShieldIcon /> Admin Dashboard
                            </Link>
                            <Link
                              to={adminPortalUrl}
                              className="dropdown-item admin-item"
                              onClick={handleLinkClick}
                            >
                              <ShieldIcon /> Admin Portal
                            </Link>
                          </>
                        )}
                        <div className="dropdown-divider" />
                        <button
                          onClick={handleLogout}
                          className="dropdown-item logout-btn"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="navbar-desktop-link">
                    Login
                  </Link>
                  <Link to="/register" className="navbar-desktop-link">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Hamburger Button - ONLY visible on mobile */}
          <button
            ref={mobileMenuBtnRef}
            className="mobile-menu-btn"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel - ONLY visible on mobile when open */}
      <div
        id="navbar-menu"
        ref={menuRef}
        className={`navbar-menu ${isMenuOpen ? "active" : ""}`}
      >
        <div className="navbar-menu-inner">
          <nav className="navbar-nav">
            {navigationLinks.map(({ to, label, exact, icon }) => (
              <Link
                key={to}
                to={to}
                className={`navbar-link ${isActiveLink(to, exact) ? "active" : ""}`}
                onClick={handleLinkClick}
              >
                {icon}
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="navbar-auth-section">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="navbar-link"
                  onClick={handleLinkClick}
                >
                  <DashboardIcon />
                  <span>Dashboard</span>
                </Link>
                <div className="navbar-notification-wrapper">
                  <NotificationBell />
                </div>
                <div className="navbar-dropdown">
                  <button
                    className="navbar-dropdown-trigger"
                    onClick={toggleDropdown}
                  >
                    <span className="user-avatar">
                      {getUserAvatar() ? (
                        <img src={getUserAvatar()} alt="" />
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
                    <div className="dropdown-menu">
                      <div className="dropdown-user-info">
                        <div className="user-avatar-large">
                          {getUserAvatar() ? (
                            <img src={getUserAvatar()} alt="" />
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
                          <span className="user-role-badge">
                            {getUserRole()}
                          </span>
                        </div>
                      </div>
                      <div className="dropdown-divider" />
                      <Link
                        to="/profile"
                        className="dropdown-item"
                        onClick={handleLinkClick}
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to="/settings"
                        className="dropdown-item"
                        onClick={handleLinkClick}
                      >
                        Account Settings
                      </Link>
                      {isAdminUser() && (
                        <>
                          <div className="dropdown-divider" />
                          <Link
                            to="/admin/dashboard"
                            className="dropdown-item admin-item"
                            onClick={handleLinkClick}
                          >
                            <ShieldIcon /> Admin Dashboard
                          </Link>
                          <Link
                            to={adminPortalUrl}
                            className="dropdown-item admin-item"
                            onClick={handleLinkClick}
                          >
                            <ShieldIcon /> Admin Portal
                          </Link>
                        </>
                      )}
                      <div className="dropdown-divider" />
                      <button
                        onClick={handleLogout}
                        className="dropdown-item logout-btn"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="navbar-link"
                  onClick={handleLinkClick}
                >
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="navbar-link"
                  onClick={handleLinkClick}
                >
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div className="navbar-overlay" onClick={() => setIsMenuOpen(false)} />
      )}
    </>
  );
};

Navbar.displayName = "Navbar";
export default React.memo(Navbar);
