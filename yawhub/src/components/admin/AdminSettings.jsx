// src/components/admin/AdminSettings.jsx - With official react-icons
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import "../../styles/components/AdminSettings.css";

// ─── react-icons/fi  (Feather Icons — only real exports) ───────────────────
import {
  FiGlobe,
  FiFileText,
  FiImage,
  FiStar,
  FiCalendar,
  FiClock,
  FiSave,
  FiSettings,
  FiShield,
  FiBell,
  FiMail,
  FiMessageCircle,
  FiSun,
  FiMoon,
  FiMonitor,
  FiEye,
  FiEyeOff,
  FiLock,
  FiKey,
  FiCpu,
  FiDatabase,
  FiCloud,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiTerminal, // ← replaces the non-existent FiBug
  FiTool,
  FiRefreshCw,
  FiUsers,
  FiUserPlus,
  FiCalendar as FiEvent,
  FiHardDrive,
  FiServer,
  FiSliders,
  FiDisc, // ← replaces the non-existent FiPalette
  FiDroplet, // ← replaces the non-existent FiBrush
  FiBox,
  FiList,
  FiLogOut,
  FiHome,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiMinus,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiEdit2,
  FiCopy,
  FiExternalLink,
} from "react-icons/fi";

// ─── react-icons/md  (Material Design Icons) ───────────────────────────────
import {
  MdAdminPanelSettings,
  MdNotificationsActive,
  MdBackup,
  MdRestorePage,
  MdDataUsage,
  MdMemory,
  MdRouter,
  MdDns,
  MdBuild,
  MdDashboard,
  MdCode,
  MdPassword,
  MdFingerprint,
  MdAccessTime,
  MdLogin,
  MdDomainVerification,
  MdAutorenew,
  MdBackupTable,
  MdCloudUpload,
  MdSecurity,
  MdSecurityUpdateGood,
  MdStorage,
  MdLanguage,
  MdSpeed,
  MdApi,
  MdHistory,
  MdPerson,
  MdDeleteForever,
  MdRefresh,
  MdSettings as MdSettingsIcon,
  MdBrush,
  MdNotifications,
  MdCached,
  MdDarkMode,
  MdLightMode,
  MdDescription,
  MdImage,
  MdEvent,
  MdMessage,
  MdPublic,
  MdSchedule,
  MdComputer,
  MdError,
  MdInfo,
  MdBugReport,
  MdCheckCircle,
  MdWarning,
} from "react-icons/md";

// ─── react-icons/fa  (Font Awesome) ────────────────────────────────────────
import {
  FaShieldAlt,
  FaLock,
  FaUserShield,
  FaEnvelope,
  FaSms,
  FaCloudUploadAlt,
  FaDatabase,
  FaServer as FaServerIcon,
} from "react-icons/fa";

// ============================================
// SECTION COMPONENTS
// ============================================

const GeneralSettings = ({ settings, updateSetting, saving }) => {
  const [localSettings, setLocalSettings] = useState({
    siteName: settings.siteName || "KAEF Portal",
    siteDescription:
      settings.siteDescription || "Educational Management Platform",
    siteLogo: settings.siteLogo || "/logo.png",
    favicon: settings.favicon || "/favicon.ico",
    timezone: settings.timezone || "Asia/Dhaka",
    dateFormat: settings.dateFormat || "DD/MM/YYYY",
    timeFormat: settings.timeFormat || "24h",
    itemsPerPage: settings.itemsPerPage || 10,
  });

  const handleChange = (field) => (e) => {
    setLocalSettings((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = () => {
    Object.entries(localSettings).forEach(([key, value]) => {
      updateSetting(key, value);
    });
  };

  return (
    <motion.div className="settings-section" initial="hidden" animate="visible">
      <div className="section-header">
        <h2 className="section-title gradient-text">General Settings</h2>
        <p className="section-description">
          Configure basic platform information and preferences.
        </p>
        <div className="section-divider"></div>
      </div>

      <div className="settings-grid">
        <div className="form-group">
          <label className="form-label">
            <FiGlobe className="form-icon" /> Site Name
          </label>
          <input
            type="text"
            className="form-input"
            value={localSettings.siteName}
            onChange={handleChange("siteName")}
            placeholder="Site Name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiFileText className="form-icon" /> Site Description
          </label>
          <input
            type="text"
            className="form-input"
            value={localSettings.siteDescription}
            onChange={handleChange("siteDescription")}
            placeholder="Site Description"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiImage className="form-icon" /> Site Logo URL
          </label>
          <input
            type="text"
            className="form-input"
            value={localSettings.siteLogo}
            onChange={handleChange("siteLogo")}
            placeholder="/logo.png"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiStar className="form-icon" /> Favicon URL
          </label>
          <input
            type="text"
            className="form-input"
            value={localSettings.favicon}
            onChange={handleChange("favicon")}
            placeholder="/favicon.ico"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiGlobe className="form-icon" /> Timezone
          </label>
          <select
            className="form-select"
            value={localSettings.timezone}
            onChange={handleChange("timezone")}
          >
            <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
            <option value="America/New_York">America/New_York (GMT-5)</option>
            <option value="Europe/London">Europe/London (GMT+0)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiCalendar className="form-icon" /> Date Format
          </label>
          <select
            className="form-select"
            value={localSettings.dateFormat}
            onChange={handleChange("dateFormat")}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiClock className="form-icon" /> Time Format
          </label>
          <select
            className="form-select"
            value={localSettings.timeFormat}
            onChange={handleChange("timeFormat")}
          >
            <option value="12h">12 Hour (AM/PM)</option>
            <option value="24h">24 Hour</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn-primary gradient-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <span className="spinner"></span>
          ) : (
            <>
              <FiSave /> Save General Settings
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const AppearanceSettings = ({ settings, updateSetting, saving }) => {
  const [localSettings, setLocalSettings] = useState({
    theme: settings.theme || "light",
    primaryColor: settings.primaryColor || "#1976d2",
    secondaryColor: settings.secondaryColor || "#dc004e",
    borderRadius: settings.borderRadius || 8,
    animations: settings.animations !== false,
    compactMode: settings.compactMode || false,
    sidebarCollapsed: settings.sidebarCollapsed || false,
    fontSize: settings.fontSize || "medium",
  });

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSliderChange = (field) => (e) => {
    setLocalSettings((prev) => ({
      ...prev,
      [field]: parseInt(e.target.value),
    }));
  };

  const handleSave = () => {
    Object.entries(localSettings).forEach(([key, value]) => {
      updateSetting(key, value);
    });
  };

  const themeOptions = [
    { value: "light", icon: <FiSun size={40} />, label: "Light" },
    { value: "dark", icon: <FiMoon size={40} />, label: "Dark" },
    { value: "system", icon: <FiMonitor size={40} />, label: "System" },
  ];

  return (
    <motion.div className="settings-section" initial="hidden" animate="visible">
      <div className="section-header">
        <h2 className="section-title gradient-text">Appearance Settings</h2>
        <p className="section-description">
          Customize the look and feel of your platform.
        </p>
        <div className="section-divider"></div>
      </div>

      <div className="settings-grid">
        <div className="full-width">
          <label className="form-label">Theme Mode</label>
          <div className="theme-options">
            {themeOptions.map((option) => (
              <div
                key={option.value}
                className={`theme-card ${
                  localSettings.theme === option.value ? "active" : ""
                }`}
                onClick={() =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    theme: option.value,
                  }))
                }
              >
                <div className="theme-icon">{option.icon}</div>
                <div className="theme-label">{option.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiDisc className="form-icon" /> Primary Color
          </label>
          <div className="color-picker-wrapper">
            <div
              className="color-preview"
              style={{ backgroundColor: localSettings.primaryColor }}
            ></div>
            <input
              type="color"
              className="color-input"
              value={localSettings.primaryColor}
              onChange={handleChange("primaryColor")}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            {/* FiDroplet replaces the non-existent FiBrush */}
            <FiDroplet className="form-icon" /> Secondary Color
          </label>
          <div className="color-picker-wrapper">
            <div
              className="color-preview"
              style={{ backgroundColor: localSettings.secondaryColor }}
            ></div>
            <input
              type="color"
              className="color-input"
              value={localSettings.secondaryColor}
              onChange={handleChange("secondaryColor")}
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label className="form-label">
            Border Radius: {localSettings.borderRadius}px
          </label>
          <input
            type="range"
            className="slider"
            value={localSettings.borderRadius}
            onChange={handleSliderChange("borderRadius")}
            min="0"
            max="32"
            step="2"
          />
          <div className="slider-marks">
            <span>0px</span>
            <span>8px</span>
            <span>16px</span>
            <span>24px</span>
            <span>32px</span>
          </div>
        </div>

        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.animations}
              onChange={handleChange("animations")}
            />
            <span>Enable Animations</span>
          </label>
        </div>

        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.compactMode}
              onChange={handleChange("compactMode")}
            />
            <span>Compact Mode (Reduce Spacing)</span>
          </label>
        </div>

        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.sidebarCollapsed}
              onChange={handleChange("sidebarCollapsed")}
            />
            <span>Collapse Sidebar by Default</span>
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn-primary gradient-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <span className="spinner"></span>
          ) : (
            <>
              <FiSave /> Save Appearance Settings
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const SecuritySettings = ({ settings, updateSetting, saving }) => {
  const [localSettings, setLocalSettings] = useState({
    twoFactorAuth: settings.twoFactorAuth || false,
    sessionTimeout: settings.sessionTimeout || 60,
    maxLoginAttempts: settings.maxLoginAttempts || 5,
    passwordExpiryDays: settings.passwordExpiryDays || 90,
    requireStrongPassword: settings.requireStrongPassword !== false,
    ipWhitelist: settings.ipWhitelist || [],
    allowedDomains: settings.allowedDomains || ["kaaf.edu", "kaaf.org"],
    auditLogRetention: settings.auditLogRetention || 90,
  });

  const [newIp, setNewIp] = useState("");
  const [newDomain, setNewDomain] = useState("");

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSliderChange = (field) => (e) => {
    setLocalSettings((prev) => ({
      ...prev,
      [field]: parseInt(e.target.value),
    }));
  };

  const addIpAddress = () => {
    if (newIp && !localSettings.ipWhitelist.includes(newIp)) {
      setLocalSettings((prev) => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIp],
      }));
      setNewIp("");
    }
  };

  const removeIpAddress = (ip) => {
    setLocalSettings((prev) => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter((i) => i !== ip),
    }));
  };

  const addDomain = () => {
    if (newDomain && !localSettings.allowedDomains.includes(newDomain)) {
      setLocalSettings((prev) => ({
        ...prev,
        allowedDomains: [...prev.allowedDomains, newDomain],
      }));
      setNewDomain("");
    }
  };

  const removeDomain = (domain) => {
    setLocalSettings((prev) => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter((d) => d !== domain),
    }));
  };

  const handleSave = () => {
    Object.entries(localSettings).forEach(([key, value]) => {
      updateSetting(key, value);
    });
  };

  return (
    <motion.div className="settings-section" initial="hidden" animate="visible">
      <div className="section-header">
        <h2 className="section-title gradient-text">Security Settings</h2>
        <p className="section-description">
          Configure security policies and access controls.
        </p>
        <div className="section-divider"></div>
      </div>

      <div className="settings-grid">
        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.twoFactorAuth}
              onChange={handleChange("twoFactorAuth")}
            />
            <span>
              <strong>
                <MdFingerprint className="inline-icon" /> Two-Factor
                Authentication (2FA)
              </strong>
              <br />
              <small>Require 2FA for all admin accounts</small>
            </span>
          </label>
        </div>

        <div className="form-group full-width">
          <label className="form-label">
            <MdAccessTime className="inline-icon" /> Session Timeout:{" "}
            {localSettings.sessionTimeout} minutes
          </label>
          <input
            type="range"
            className="slider"
            value={localSettings.sessionTimeout}
            onChange={handleSliderChange("sessionTimeout")}
            min="5"
            max="480"
            step="5"
          />
        </div>

        <div className="form-group full-width">
          <label className="form-label">
            <MdLogin className="inline-icon" /> Max Login Attempts:{" "}
            {localSettings.maxLoginAttempts}
          </label>
          <input
            type="range"
            className="slider"
            value={localSettings.maxLoginAttempts}
            onChange={handleSliderChange("maxLoginAttempts")}
            min="3"
            max="10"
            step="1"
          />
        </div>

        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.requireStrongPassword}
              onChange={handleChange("requireStrongPassword")}
            />
            <span>
              <MdPassword className="inline-icon" /> Require Strong Passwords
              (uppercase, lowercase, number, special character)
            </span>
          </label>
        </div>

        <div className="form-group full-width">
          <label className="form-label">
            <MdRouter className="inline-icon" /> IP Whitelist
          </label>
          <div className="tag-input-group">
            <input
              type="text"
              className="form-input"
              placeholder="Enter IP address"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
            />
            <button className="btn-secondary" onClick={addIpAddress}>
              <FiPlus /> Add IP
            </button>
          </div>
          <div className="tags-container">
            {localSettings.ipWhitelist.map((ip) => (
              <span key={ip} className="tag">
                {ip}
                <button
                  className="tag-remove"
                  onClick={() => removeIpAddress(ip)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-group full-width">
          <label className="form-label">
            <MdDomainVerification className="inline-icon" /> Allowed Email
            Domains
          </label>
          <div className="tag-input-group">
            <input
              type="text"
              className="form-input"
              placeholder="Enter domain (e.g., example.com)"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
            />
            <button className="btn-secondary" onClick={addDomain}>
              <FiPlus /> Add Domain
            </button>
          </div>
          <div className="tags-container">
            {localSettings.allowedDomains.map((domain) => (
              <span key={domain} className="tag tag-secondary">
                {domain}
                <button
                  className="tag-remove"
                  onClick={() => removeDomain(domain)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn-primary gradient-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <span className="spinner"></span>
          ) : (
            <>
              <MdSecurity /> Save Security Settings
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const NotificationSettings = ({ settings, updateSetting, saving }) => {
  const [localSettings, setLocalSettings] = useState({
    emailNotifications: settings.emailNotifications !== false,
    pushNotifications: settings.pushNotifications || false,
    smsAlerts: settings.smsAlerts || false,
    adminEmail: settings.adminEmail || "admin@kaaf.edu",
    smtpHost: settings.smtpHost || "smtp.gmail.com",
    smtpPort: settings.smtpPort || 587,
    smtpUser: settings.smtpUser || "",
    smtpPass: settings.smtpPass || "",
    notificationEvents: settings.notificationEvents || {
      newUser: true,
      newNotice: true,
      newEvent: true,
      systemAlert: true,
      backupComplete: true,
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleEventToggle = (event) => (e) => {
    setLocalSettings((prev) => ({
      ...prev,
      notificationEvents: {
        ...prev.notificationEvents,
        [event]: e.target.checked,
      },
    }));
  };

  const handleSave = () => {
    Object.entries(localSettings).forEach(([key, value]) => {
      updateSetting(key, value);
    });
  };

  const eventItems = [
    {
      key: "newUser",
      label: "New user registers",
      icon: <FiUsers size={18} />,
    },
    {
      key: "newNotice",
      label: "New notice published",
      icon: <FiFileText size={18} />,
    },
    {
      key: "newEvent",
      label: "New event created",
      icon: <MdEvent size={18} />,
    },
    {
      key: "systemAlert",
      label: "System alert triggered",
      icon: <MdWarning size={18} />,
    },
    {
      key: "backupComplete",
      label: "Backup completed",
      icon: <MdBackup size={18} />,
    },
  ];

  return (
    <motion.div className="settings-section" initial="hidden" animate="visible">
      <div className="section-header">
        <h2 className="section-title gradient-text">Notification Settings</h2>
        <p className="section-description">
          Configure how and when to send notifications.
        </p>
        <div className="section-divider"></div>
      </div>

      <div className="settings-grid">
        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.emailNotifications}
              onChange={handleChange("emailNotifications")}
            />
            <span>
              <FiMail className="inline-icon" /> Email Notifications
            </span>
          </label>
        </div>

        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.pushNotifications}
              onChange={handleChange("pushNotifications")}
            />
            <span>
              <MdNotificationsActive className="inline-icon" /> Push
              Notifications
            </span>
          </label>
        </div>

        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.smsAlerts}
              onChange={handleChange("smsAlerts")}
            />
            <span>
              <FiMessageCircle className="inline-icon" /> SMS Alerts
            </span>
          </label>
        </div>

        <div className="form-group full-width">
          <label className="form-label">
            <FiMail className="inline-icon" /> Admin Email Address
          </label>
          <input
            type="email"
            className="form-input"
            value={localSettings.adminEmail}
            onChange={handleChange("adminEmail")}
            placeholder="admin@example.com"
          />
        </div>

        <div className="full-width">
          <h3 className="subsection-title">
            <MdDns className="inline-icon" /> SMTP Configuration
          </h3>
          <div className="settings-grid">
            <div className="form-group">
              <label className="form-label">SMTP Host</label>
              <input
                type="text"
                className="form-input"
                value={localSettings.smtpHost}
                onChange={handleChange("smtpHost")}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Port</label>
              <input
                type="number"
                className="form-input"
                value={localSettings.smtpPort}
                onChange={handleChange("smtpPort")}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Username</label>
              <input
                type="text"
                className="form-input"
                value={localSettings.smtpUser}
                onChange={handleChange("smtpUser")}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  value={localSettings.smtpPass}
                  onChange={handleChange("smtpPass")}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="full-width">
          <h3 className="subsection-title">
            <MdNotificationsActive className="inline-icon" /> Notify me when...
          </h3>
          <div className="checkbox-group">
            {eventItems.map((event) => (
              <label key={event.key} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localSettings.notificationEvents[event.key]}
                  onChange={handleEventToggle(event.key)}
                />
                <span>
                  {event.icon} {event.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn-primary gradient-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <span className="spinner"></span>
          ) : (
            <>
              <FiSave /> Save Notification Settings
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const SystemSettings = ({
  settings,
  updateSetting,
  saving,
  onBackup,
  onRestore,
}) => {
  const [localSettings, setLocalSettings] = useState({
    maintenanceMode: settings.maintenanceMode || false,
    debugMode: settings.debugMode || false,
    cacheEnabled: settings.cacheEnabled !== false,
    cacheDuration: settings.cacheDuration || 3600,
    rateLimit: settings.rateLimit || 100,
    backupSchedule: settings.backupSchedule || "daily",
    logLevel: settings.logLevel || "info",
  });

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSliderChange = (field) => (e) => {
    setLocalSettings((prev) => ({
      ...prev,
      [field]: parseInt(e.target.value),
    }));
  };

  const handleSave = () => {
    Object.entries(localSettings).forEach(([key, value]) => {
      updateSetting(key, value);
    });
  };

  return (
    <motion.div className="settings-section" initial="hidden" animate="visible">
      <div className="section-header">
        <h2 className="section-title gradient-text">System Settings</h2>
        <p className="section-description">
          Configure system-level parameters and maintenance options.
        </p>
        <div className="section-divider"></div>
      </div>

      {localSettings.maintenanceMode && (
        <div className="alert alert-warning">
          <MdBuild className="inline-icon" /> Maintenance mode is enabled. Only
          administrators can access the platform.
        </div>
      )}

      <div className="settings-grid">
        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.maintenanceMode}
              onChange={handleChange("maintenanceMode")}
            />
            <span>
              <MdBuild className="inline-icon" /> Maintenance Mode — Restrict
              access to administrators only
            </span>
          </label>
        </div>

        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.debugMode}
              onChange={handleChange("debugMode")}
            />
            <span>
              <FiTerminal className="inline-icon" /> Debug Mode — Log detailed
              error information for troubleshooting
            </span>
          </label>
        </div>

        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.cacheEnabled}
              onChange={handleChange("cacheEnabled")}
            />
            <span>
              <MdDataUsage className="inline-icon" /> Enable Caching — Improve
              performance by caching frequently accessed data
            </span>
          </label>
        </div>

        <div className="form-group full-width">
          <label className="form-label">
            <MdMemory className="inline-icon" /> Cache Duration:{" "}
            {localSettings.cacheDuration} seconds
          </label>
          <input
            type="range"
            className="slider"
            value={localSettings.cacheDuration}
            onChange={handleSliderChange("cacheDuration")}
            min="60"
            max="86400"
            step="60"
          />
        </div>

        <div className="form-group full-width">
          <label className="form-label">
            <MdSpeed className="inline-icon" /> Rate Limit:{" "}
            {localSettings.rateLimit} requests per minute
          </label>
          <input
            type="range"
            className="slider"
            value={localSettings.rateLimit}
            onChange={handleSliderChange("rateLimit")}
            min="10"
            max="1000"
            step="10"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <MdBackup className="inline-icon" /> Backup Schedule
          </label>
          <select
            className="form-select"
            value={localSettings.backupSchedule}
            onChange={handleChange("backupSchedule")}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            <FiList className="inline-icon" /> Log Level
          </label>
          <select
            className="form-select"
            value={localSettings.logLevel}
            onChange={handleChange("logLevel")}
          >
            <option value="error">Error Only</option>
            <option value="warn">Warning &amp; Error</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn-primary gradient-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <span className="spinner"></span>
          ) : (
            <>
              <FiSave /> Save System Settings
            </>
          )}
        </button>
        <button className="btn-secondary" onClick={onBackup}>
          <MdBackupTable /> Create Backup
        </button>
        <button className="btn-secondary" onClick={onRestore}>
          <MdRestorePage /> Restore Backup
        </button>
      </div>
    </motion.div>
  );
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const mockLogs = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        admin: "admin@kaaf.edu",
        action: "Updated system settings",
        ip: "192.168.1.1",
        details: "Changed theme to dark",
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        admin: "admin@kaaf.edu",
        action: "Created new user",
        ip: "192.168.1.1",
        details: "Added user john.doe@kaaf.edu",
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        admin: "sarah@kaaf.edu",
        action: "Modified security settings",
        ip: "192.168.1.2",
        details: "Enabled 2FA",
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        admin: "admin@kaaf.edu",
        action: "Generated backup",
        ip: "192.168.1.1",
        details: "Full system backup",
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        admin: "sarah@kaaf.edu",
        action: "Deleted user",
        ip: "192.168.1.2",
        details: "Removed inactive user",
      },
    ];
    setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
      </div>
    );
  }

  return (
    <motion.div className="settings-section" initial="hidden" animate="visible">
      <div className="section-header">
        <h2 className="section-title gradient-text">Audit Logs</h2>
        <p className="section-description">
          Track all administrative actions and system changes.
        </p>
        <div className="section-divider"></div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin</th>
              <th>Action</th>
              <th>IP Address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>
                    <span className="badge">
                      <MdPerson className="inline-icon-small" /> {log.admin}
                    </span>
                  </td>
                  <td>{log.action}</td>
                  <td>
                    <code>{log.ip}</code>
                  </td>
                  <td>{log.details}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(parseInt(e.target.value));
              setPage(0);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <span>
            {page * rowsPerPage + 1}–
            {Math.min((page + 1) * rowsPerPage, logs.length)} of {logs.length}
          </span>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            <FiChevronLeft />
          </button>
          <button
            onClick={() =>
              setPage(
                Math.min(Math.ceil(logs.length / rowsPerPage) - 1, page + 1),
              )
            }
            disabled={page >= Math.ceil(logs.length / rowsPerPage) - 1}
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const AdminSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [backupDialog, setBackupDialog] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = localStorage.getItem("adminSettings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        setSettings({
          siteName: "KAEF Portal",
          siteDescription: "Educational Management Platform",
          theme: "light",
          primaryColor: "#1976d2",
          twoFactorAuth: false,
          emailNotifications: true,
          maintenanceMode: false,
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = async (key, value) => {
    setSaving(true);
    try {
      setSettings((prev) => ({ ...prev, [key]: value }));
      localStorage.setItem(
        "adminSettings",
        JSON.stringify({ ...settings, [key]: value }),
      );
      showSnackbar("Settings saved successfully", "success");
    } catch (error) {
      showSnackbar("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 4000);
  };

  const handleBackup = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      settings,
      version: "1.0.0",
    };
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `kaef_backup_${new Date()
      .toISOString()
      .slice(0, 19)}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    showSnackbar("Backup created successfully", "success");
  };

  const handleRestore = () => {
    setBackupDialog(true);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          if (backup.settings) {
            setSettings(backup.settings);
            localStorage.setItem(
              "adminSettings",
              JSON.stringify(backup.settings),
            );
            showSnackbar("Backup restored successfully", "success");
          }
        } catch {
          showSnackbar("Invalid backup file", "error");
        }
        setBackupDialog(false);
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    {
      label: "General",
      icon: <FiSettings size={20} />,
      component: GeneralSettings,
    },
    {
      label: "Appearance",
      icon: <MdBrush size={20} />,
      component: AppearanceSettings,
    },
    {
      label: "Security",
      icon: <MdSecurity size={20} />,
      component: SecuritySettings,
    },
    {
      label: "Notifications",
      icon: <MdNotificationsActive size={20} />,
      component: NotificationSettings,
    },
    {
      label: "System",
      icon: <MdStorage size={20} />,
      component: SystemSettings,
    },
    {
      label: "Audit Logs",
      icon: <MdHistory size={20} />,
      component: AuditLogs,
    },
  ];

  const CurrentComponent = tabs[activeTab].component;

  return (
    <div className="admin-settings-container">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="settings-header gradient-bg">
        <div className="settings-header-content">
          <div className="settings-icon">
            <FiSettings size={56} />
          </div>
          <h1 className="settings-title neon-text">Admin Settings</h1>
          <p className="settings-subtitle">
            Configure and customize your platform with advanced controls and
            preferences.
          </p>
        </div>
        <div className="header-decoration decoration-1"></div>
        <div className="header-decoration decoration-2"></div>
        <div className="header-decoration decoration-3"></div>
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="settings-tabs-container">
        <div className="settings-tabs">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={`tab-button ${activeTab === index ? "active" : ""}`}
              onClick={() => setActiveTab(index)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentComponent
                settings={settings}
                updateSetting={updateSetting}
                saving={saving}
                onBackup={handleBackup}
                onRestore={handleRestore}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Snackbar ───────────────────────────────────── */}
      {snackbar.open && (
        <div className={`snackbar ${snackbar.severity}`}>
          {snackbar.severity === "success" ? (
            <MdCheckCircle size={20} />
          ) : (
            <MdError size={20} />
          )}{" "}
          {snackbar.message}
        </div>
      )}

      {/* ── Backup / Restore Dialog ────────────────────── */}
      {backupDialog && (
        <div className="modal-overlay" onClick={() => setBackupDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header gradient-bg">
              <h2>
                <MdRestorePage className="inline-icon" /> Restore Backup
              </h2>
            </div>
            <div className="modal-body">
              <p>
                Select a backup file (.json) to restore settings. This will
                overwrite current settings.
              </p>
              <div className="upload-area">
                <div className="upload-icon">
                  <MdCloudUpload size={56} />
                </div>
                <p>Drag &amp; drop a JSON file here, or click to select</p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  id="backup-file"
                  style={{ display: "none" }}
                />
                <button
                  className="btn-primary"
                  onClick={() => document.getElementById("backup-file").click()}
                >
                  <FiUpload /> Select File
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setBackupDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
