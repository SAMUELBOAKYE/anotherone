import React, { useState, useCallback, useMemo, memo, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../common/LoadingSpinner";
import "../../styles/components/UserSettings.css";

// ============================================================================
// SVG Icons
// ============================================================================

const Icons = {
  profile: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M20 21C20 17.5 16.5 15 12 15C7.5 15 4 17.5 4 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  password: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M8 11V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
      <path d="M12 16V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 11.3137 8.68629 14 12 14C15.3137 14 18 11.3137 18 8Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M12 14V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 19H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  security: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 7L3 12C3 16.97 7.03 21 12 22C16.97 21 21 16.97 21 12L21 7L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M12 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="16" r="1" fill="currentColor"/>
    </svg>
  ),
  privacy: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="13" r="1.5" fill="currentColor"/>
    </svg>
  ),
  appearance: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M12 2C14.5 4.5 15 9 12 12C9 15 9.5 19.5 12 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  data: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12C21 13.2 20.5 14.2 19.7 15.1C18.9 15.9 17.8 16.5 16.5 16.8C15.2 17.1 13.8 17.1 12.3 16.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M3 12V8C3 5.8 4.8 4 7 4H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M8 21L12 17L16 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M12 4V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M19.4 15.1L18.4 15.1C18 15.1 17.6 15.3 17.4 15.6L16.9 16.4C16.5 17 16.6 17.8 17.1 18.3L17.7 18.9C18.3 19.5 18.3 20.5 17.7 21.1C17.1 21.7 16.1 21.7 15.5 21.1L14.9 20.5C14.4 20 13.6 19.9 13 20.3L12.2 20.8C11.5 21.2 11.5 22.2 12.2 22.7L13.2 23.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
};

// ============================================================================
// Lazy Load Components
// ============================================================================

const ProfileSettings = lazy(() => import("./ProfileSettings"));
const ChangePasswordForm = lazy(() => import("../auth/ChangePasswordForm"));
const NotificationPreferences = lazy(() => import("../notification/NotificationPreferences"));
const SecuritySettings = lazy(() => import("./SecuritySettings"));
const PrivacySettings = lazy(() => import("./PrivacySettings"));
const AppearanceSettings = lazy(() => import("./AppearanceSettings"));
const DataManagement = lazy(() => import("./DataManagement"));

// ============================================================================
// PropTypes
// ============================================================================

const propTypes = {
  /** Initial active tab ID */
  initialTab: PropTypes.string,
  /** Callback when tab changes */
  onTabChange: PropTypes.func,
  /** Custom CSS class name */
  className: PropTypes.string,
  /** Disable all settings */
  disabled: PropTypes.bool,
  /** Available tabs configuration */
  customTabs: PropTypes.array,
};

const defaultProps = {
  initialTab: "profile",
  onTabChange: null,
  className: "",
  disabled: false,
  customTabs: null,
};

// ============================================================================
// Helper Components
// ============================================================================

const IconWrapper = memo(({ icon, className = "", size = 20 }) => (
  <span className={`icon-wrapper ${className}`} style={{ width: size, height: size }}>
    {React.cloneElement(icon, { width: size, height: size })}
  </span>
));

IconWrapper.displayName = "IconWrapper";
IconWrapper.propTypes = {
  icon: PropTypes.element.isRequired,
  className: PropTypes.string,
  size: PropTypes.number,
};

const LoadingFallback = memo(() => (
  <div className="settings-loading-fallback">
    <LoadingSpinner size="medium" />
    <p>Loading settings...</p>
  </div>
));

LoadingFallback.displayName = "LoadingFallback";

const TabButton = memo(({ tab, isActive, onClick, disabled }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(tab.id);
    }
  };

  return (
    <motion.button
      className={`settings-nav-item ${isActive ? "active" : ""}`}
      onClick={() => onClick(tab.id)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      role="tab"
      aria-selected={isActive}
      aria-controls={`settings-panel-${tab.id}`}
      id={`settings-tab-${tab.id}`}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <IconWrapper icon={tab.icon} size={18} />
      <span className="nav-label">{tab.label}</span>
      {tab.badge && <span className="nav-badge">{tab.badge}</span>}
      <IconWrapper icon={Icons.chevronRight} size={14} className="nav-chevron" />
    </motion.button>
  );
});

TabButton.displayName = "TabButton";
TabButton.propTypes = {
  tab: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.element.isRequired,
    badge: PropTypes.number,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * UserSettings component – comprehensive settings management with tabs,
 * lazy loading, animations, and full accessibility.
 */
const UserSettings = memo(({ initialTab = "profile", onTabChange, className = "", disabled = false, customTabs = null }) => {
  // ===== State =====
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ===== Default Tabs Configuration =====
  const defaultTabs = useMemo(() => [
    {
      id: "profile",
      label: "Profile Settings",
      icon: Icons.profile,
      component: ProfileSettings,
      description: "Manage your personal information and profile settings",
    },
    {
      id: "password",
      label: "Change Password",
      icon: Icons.password,
      component: ChangePasswordForm,
      description: "Update your password and security settings",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Icons.notifications,
      component: NotificationPreferences,
      description: "Configure how and when you receive notifications",
    },
    {
      id: "security",
      label: "Security",
      icon: Icons.security,
      component: SecuritySettings,
      description: "Two-factor authentication and security preferences",
      badge: 2,
    },
    {
      id: "privacy",
      label: "Privacy",
      icon: Icons.privacy,
      component: PrivacySettings,
      description: "Control your privacy and data sharing settings",
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Icons.appearance,
      component: AppearanceSettings,
      description: "Customize the look and feel of your dashboard",
    },
    {
      id: "data",
      label: "Data Management",
      icon: Icons.data,
      component: DataManagement,
      description: "Export, backup, or delete your account data",
    },
  ], []);

  const tabs = customTabs || defaultTabs;
  const activeTabConfig = useMemo(() => tabs.find(tab => tab.id === activeTab), [tabs, activeTab]);
  const ActiveComponent = activeTabConfig?.component;

  // ===== Handlers =====
  const handleTabChange = useCallback((tabId) => {
    if (disabled) return;
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    if (onTabChange) {
      onTabChange(tabId);
    }
  }, [onTabChange, disabled]);

  const toggleMobileMenu = useCallback(() => {
    if (!disabled) {
      setIsMobileMenuOpen(prev => !prev);
    }
  }, [disabled]);

  // ===== Render =====
  return (
    <div className={`user-settings ${className} ${disabled ? "disabled" : ""}`}>
      {/* Mobile Header */}
      <div className="settings-mobile-header">
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-label="Settings menu"
          disabled={disabled}
        >
          <IconWrapper icon={activeTabConfig?.icon || Icons.settings} size={20} />
          <span>{activeTabConfig?.label || "Settings"}</span>
          <svg
            className={`mobile-chevron ${isMobileMenuOpen ? "open" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            width="16"
            height="16"
          >
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="settings-container">
        {/* Sidebar Navigation */}
        <motion.aside
          className={`settings-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="settings-sidebar-header">
            <h3 className="settings-title">Settings</h3>
            <p className="settings-subtitle">Manage your preferences</p>
          </div>

          <nav className="settings-nav" role="tablist" aria-label="Settings categories">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={handleTabChange}
                disabled={disabled}
              />
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="settings-sidebar-footer">
            <div className="settings-version">
              Version 2.0.0
            </div>
          </div>
        </motion.aside>

        {/* Content Area */}
        <motion.main
          className="settings-content"
          role="tabpanel"
          id={`settings-panel-${activeTab}`}
          aria-labelledby={`settings-tab-${activeTab}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {ActiveComponent ? (
            <Suspense fallback={<LoadingFallback />}>
              <div className="settings-content-wrapper">
                <div className="settings-content-header">
                  <h2 className="settings-content-title">
                    {activeTabConfig?.label}
                  </h2>
                  <p className="settings-content-description">
                    {activeTabConfig?.description}
                  </p>
                </div>
                <div className="settings-content-body">
                  <ActiveComponent />
                </div>
              </div>
            </Suspense>
          ) : (
            <div className="settings-placeholder">
              <IconWrapper icon={Icons.settings} size={48} />
              <h3>Coming Soon</h3>
              <p>This settings section is currently under development.</p>
            </div>
          )}
        </motion.main>
      </div>
    </div>
  );
});

// ============================================================================
// Display Name & PropTypes
// ============================================================================

UserSettings.displayName = "UserSettings";

UserSettings.propTypes = propTypes;
UserSettings.defaultProps = defaultProps;

export default UserSettings;