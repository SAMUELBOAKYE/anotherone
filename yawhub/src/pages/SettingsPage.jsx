// src/pages/SettingsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  validateSettings,
  sanitizeSettings,
  getDefaultSettings,
} from "../utils/settingsValidation";
import ErrorAlert from "../components/common/ErrorAlert";
import LoadingSpinner from "../components/common/LoadingSpinner";
import "../styles/components/SettingsPage.css";

// Constants
const THEMES = {
  light: "Light",
  dark: "Dark",
  system: "System Default",
};

const LANGUAGES = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  zh: "中文",
  ja: "日本語",
};

const DATE_FORMATS = {
  "MM/DD/YYYY": "MM/DD/YYYY",
  "DD/MM/YYYY": "DD/MM/YYYY",
  "YYYY-MM-DD": "YYYY-MM-DD",
};

const TIME_FORMATS = {
  "12h": "12-hour (12:00 PM)",
  "24h": "24-hour (14:00)",
};

const NOTIFICATION_SOUNDS = {
  none: "No Sound",
  default: "Default",
  subtle: "Subtle",
  prominent: "Prominent",
};

/**
 * SettingsPage Component
 */
const SettingsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("preferences");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [backupList, setBackupList] = useState([]);
  const [restoring, setRestoring] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location.pathname,
          message: "Please login to access settings",
        },
      });
    }
  }, [isAuthenticated, navigate, location]);

  // Fetch settings from localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSettings();
      loadBackupList();
    }
  }, [isAuthenticated, user]);

  /**
   * Load settings from localStorage
   */
  const loadSettings = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      const savedSettings = localStorage.getItem(`user_settings_${user?.id}`);

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        const validation = validateSettings(parsedSettings);

        if (validation.isValid) {
          setSettings(parsedSettings);
          applySettings(parsedSettings);
        } else {
          const defaultSettings = getDefaultSettings();
          setSettings(defaultSettings);
          applySettings(defaultSettings);
          console.warn(
            "Invalid settings detected, using defaults:",
            validation.errors,
          );
        }
      } else {
        const defaultSettings = getDefaultSettings();
        setSettings(defaultSettings);
        applySettings(defaultSettings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      setError("Failed to load settings. Please try again.");
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Save settings to localStorage
   */
  const saveSettings = useCallback(
    async (settingsToSave) => {
      try {
        localStorage.setItem(
          `user_settings_${user?.id}`,
          JSON.stringify(settingsToSave),
        );
        return true;
      } catch (error) {
        console.error("Failed to save settings:", error);
        throw new Error("Failed to save settings");
      }
    },
    [user],
  );

  /**
   * Load backup list from localStorage
   */
  const loadBackupList = useCallback(() => {
    try {
      const backups = localStorage.getItem(`user_backups_${user?.id}`);
      if (backups) {
        setBackupList(JSON.parse(backups));
      }
    } catch (error) {
      console.error("Failed to load backups:", error);
    }
  }, [user]);

  /**
   * Save backup list to localStorage
   */
  const saveBackupList = useCallback(
    (backups) => {
      try {
        localStorage.setItem(
          `user_backups_${user?.id}`,
          JSON.stringify(backups),
        );
        setBackupList(backups);
      } catch (error) {
        console.error("Failed to save backups:", error);
      }
    },
    [user],
  );

  /**
   * Handle setting update
   */
  const handleSettingUpdate = useCallback(
    async (category, setting, value) => {
      if (saving) return;

      setSaving(true);
      setError(null);

      try {
        const updatedSettings = {
          ...settings,
          [category]: {
            ...settings?.[category],
            [setting]: value,
          },
        };

        const validation = validateSettings(updatedSettings);
        if (!validation.isValid) {
          setError(validation.errors.join(", "));
          setSaving(false);
          return;
        }

        const sanitizedSettings = sanitizeSettings(updatedSettings);
        await saveSettings(sanitizedSettings);
        setSettings(sanitizedSettings);
        applySettings(sanitizedSettings);

        setSuccess("Settings updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        setError(
          error.message || "Failed to update settings. Please try again.",
        );
      } finally {
        setSaving(false);
      }
    },
    [settings, saving, user, saveSettings],
  );

  /**
   * Apply settings to application
   */
  const applySettings = useCallback((settingsData) => {
    if (!settingsData) return;

    // Apply theme
    if (settingsData.display?.theme) {
      const theme = settingsData.display.theme;
      if (theme === "dark") {
        document.documentElement.classList.add("dark-mode");
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark-mode");
      } else if (theme === "system") {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          document.documentElement.classList.add("dark-mode");
        } else {
          document.documentElement.classList.remove("dark-mode");
        }
      }
    }

    // Apply font size
    if (settingsData.display?.fontSize) {
      document.documentElement.style.fontSize = `${settingsData.display.fontSize}px`;
    }

    // Apply compact mode
    if (settingsData.display?.compactMode) {
      document.documentElement.classList.add("compact-mode");
    } else {
      document.documentElement.classList.remove("compact-mode");
    }
  }, []);

  /**
   * Handle export settings
   */
  const handleExport = useCallback(() => {
    try {
      const exportData = {
        settings,
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
        user: {
          id: user?.id,
          email: user?.email,
        },
      };
      setExportData(exportData);
      setShowExportConfirm(true);
    } catch (error) {
      setError("Failed to export settings. Please try again.");
    }
  }, [settings, user]);

  /**
   * Handle download export
   */
  const handleDownloadExport = useCallback(() => {
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `settings_export_${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    setShowExportConfirm(false);
    setSuccess("Settings exported successfully!");
    setTimeout(() => setSuccess(null), 3000);
  }, [exportData]);

  /**
   * Handle import settings
   */
  const handleImport = useCallback(async () => {
    if (!importFile) {
      setError("Please select a file to import");
      return;
    }

    setSaving(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          const importedSettings = importedData.settings || importedData;

          const validation = validateSettings(importedSettings);

          if (!validation.isValid) {
            setError("Invalid settings file: " + validation.errors.join(", "));
            setSaving(false);
            return;
          }

          const sanitizedSettings = sanitizeSettings(importedSettings);
          await saveSettings(sanitizedSettings);
          setSettings(sanitizedSettings);
          applySettings(sanitizedSettings);

          setShowImportConfirm(false);
          setImportFile(null);
          setSuccess("Settings imported successfully!");
          setTimeout(() => setSuccess(null), 3000);
        } catch (parseError) {
          setError("Invalid JSON file. Please check the file format.");
        } finally {
          setSaving(false);
        }
      };
      reader.readAsText(importFile);
    } catch (error) {
      setError("Failed to import settings. Please try again.");
      setSaving(false);
    }
  }, [importFile, saveSettings, applySettings]);

  /**
   * Handle reset settings
   */
  const handleReset = useCallback(async () => {
    setSaving(true);

    try {
      const defaultSettings = getDefaultSettings();
      await saveSettings(defaultSettings);
      setSettings(defaultSettings);
      applySettings(defaultSettings);

      setShowResetConfirm(false);
      setSuccess("Settings reset to default successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to reset settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [saveSettings, applySettings]);

  /**
   * Handle create backup
   */
  const handleCreateBackup = useCallback(async () => {
    setSaving(true);

    try {
      const backup = {
        id: Date.now(),
        settings: settings,
        createdAt: new Date().toISOString(),
        description: `Backup from ${new Date().toLocaleString()}`,
      };

      const backups = [...backupList, backup];
      await saveBackupList(backups);

      setSuccess("Backup created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to create backup. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [settings, backupList, saveBackupList]);

  /**
   * Handle restore backup
   */
  const handleRestoreBackup = useCallback(
    async (backupId) => {
      if (
        !window.confirm(
          "Are you sure you want to restore this backup? This will overwrite your current settings.",
        )
      ) {
        return;
      }

      setRestoring(true);

      try {
        const backup = backupList.find((b) => b.id === backupId);
        if (!backup) {
          throw new Error("Backup not found");
        }

        const validation = validateSettings(backup.settings);
        if (!validation.isValid) {
          setError("Invalid backup file: " + validation.errors.join(", "));
          setRestoring(false);
          return;
        }

        const sanitizedSettings = sanitizeSettings(backup.settings);
        await saveSettings(sanitizedSettings);
        setSettings(sanitizedSettings);
        applySettings(sanitizedSettings);

        setSuccess("Backup restored successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        setError("Failed to restore backup. Please try again.");
      } finally {
        setRestoring(false);
      }
    },
    [backupList, saveSettings, applySettings],
  );

  /**
   * Handle clear data
   */
  const handleClearData = useCallback(async () => {
    if (!window.confirm("This will clear all cached data. Are you sure?"))
      return;

    try {
      localStorage.removeItem(`user_settings_${user?.id}`);
      localStorage.removeItem(`user_backups_${user?.id}`);

      const defaultSettings = getDefaultSettings();
      setSettings(defaultSettings);
      applySettings(defaultSettings);

      setSuccess("Cache cleared successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to clear cache. Please try again.");
    }
  }, [user, applySettings]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-container">
          <LoadingSpinner size="large" text="Loading settings..." />
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="page-header-content">
            <div className="page-header-text">
              <h1>Settings</h1>
              <p>Manage your application preferences and configurations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Success Message */}
        {success && (
          <div className="success-message">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Reset Settings</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowResetConfirm(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>
                  This will reset all your preferences to their default values.
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  onClick={handleReset}
                  disabled={saving}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Confirmation Dialog */}
        {showExportConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Export Settings</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowExportConfirm(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Your settings are ready to export. This file contains all your
                  preferences and configurations.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowExportConfirm(false)}
                >
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleDownloadExport}>
                  Download JSON
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Confirmation Dialog */}
        {showImportConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Import Settings</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowImportConfirm(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to import settings from{" "}
                  <strong>{importFile?.name}</strong>?
                </p>
                <p className="warning-text">
                  This will overwrite your current settings. This action cannot
                  be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowImportConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleImport}
                  disabled={saving}
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Content */}
        <div className="settings-content">
          {/* Sidebar Tabs */}
          <div className="settings-sidebar">
            <div className="tabs-list">
              <button
                className={`tab-button ${activeTab === "preferences" ? "active" : ""}`}
                onClick={() => setActiveTab("preferences")}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Preferences
              </button>

              <button
                className={`tab-button ${activeTab === "notifications" ? "active" : ""}`}
                onClick={() => setActiveTab("notifications")}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                Notifications
              </button>

              <button
                className={`tab-button ${activeTab === "display" ? "active" : ""}`}
                onClick={() => setActiveTab("display")}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Display
              </button>

              <button
                className={`tab-button ${activeTab === "privacy" ? "active" : ""}`}
                onClick={() => setActiveTab("privacy")}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-10V5a2 2 0 00-2-2H8a2 2 0 00-2 2v2h10z"
                  />
                </svg>
                Privacy & Security
              </button>

              <button
                className={`tab-button ${activeTab === "data" ? "active" : ""}`}
                onClick={() => setActiveTab("data")}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2 1.5 4 4 4h8c2.5 0 4-2 4-4V7c0-2-1.5-4-4-4H8c-2.5 0-4 2-4 4z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 3v4h8V3"
                  />
                </svg>
                Data Management
              </button>
            </div>
          </div>

          {/* Settings Panels - Same as before but with confirm dialogs instead of modals */}
          <div className="settings-main">
            {/* Preferences Panel */}
            {activeTab === "preferences" && (
              <div className="settings-panel">
                <h2>Preferences</h2>

                <div className="settings-section">
                  <h3>Language</h3>
                  <div className="settings-options">
                    <select
                      value={settings?.language || "en"}
                      onChange={(e) =>
                        handleSettingUpdate(
                          "language",
                          "locale",
                          e.target.value,
                        )
                      }
                      disabled={saving}
                      className="settings-select"
                    >
                      {Object.entries(LANGUAGES).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <p className="settings-hint">
                      Choose your preferred language for the application
                    </p>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Date & Time</h3>
                  <div className="settings-options">
                    <label className="settings-label">Date Format</label>
                    <select
                      value={settings?.dateFormat || "MM/DD/YYYY"}
                      onChange={(e) =>
                        handleSettingUpdate(
                          "dateFormat",
                          "format",
                          e.target.value,
                        )
                      }
                      disabled={saving}
                      className="settings-select"
                    >
                      {Object.entries(DATE_FORMATS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>

                    <label className="settings-label">Time Format</label>
                    <select
                      value={settings?.timeFormat || "12h"}
                      onChange={(e) =>
                        handleSettingUpdate(
                          "timeFormat",
                          "format",
                          e.target.value,
                        )
                      }
                      disabled={saving}
                      className="settings-select"
                    >
                      {Object.entries(TIME_FORMATS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Time Zone</h3>
                  <div className="settings-options">
                    <select
                      value={
                        settings?.timezone ||
                        Intl.DateTimeFormat().resolvedOptions().timeZone
                      }
                      onChange={(e) =>
                        handleSettingUpdate("timezone", "zone", e.target.value)
                      }
                      disabled={saving}
                      className="settings-select"
                    >
                      {Intl.supportedValuesOf("timeZone").map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                    <p className="settings-hint">
                      Your current time zone:{" "}
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Panel */}
            {activeTab === "notifications" && (
              <div className="settings-panel">
                <h2>Notification Settings</h2>

                <div className="settings-section">
                  <h3>Email Notifications</h3>
                  <div className="settings-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={
                          settings?.notifications?.email?.eventReminders ||
                          false
                        }
                        onChange={(e) =>
                          handleSettingUpdate("notifications", "email", {
                            ...settings?.notifications?.email,
                            eventReminders: e.target.checked,
                          })
                        }
                        disabled={saving}
                      />
                      <span>Event Reminders</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={
                          settings?.notifications?.email?.newsletter || false
                        }
                        onChange={(e) =>
                          handleSettingUpdate("notifications", "email", {
                            ...settings?.notifications?.email,
                            newsletter: e.target.checked,
                          })
                        }
                        disabled={saving}
                      />
                      <span>Newsletter</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={
                          settings?.notifications?.email?.promotions || false
                        }
                        onChange={(e) =>
                          handleSettingUpdate("notifications", "email", {
                            ...settings?.notifications?.email,
                            promotions: e.target.checked,
                          })
                        }
                        disabled={saving}
                      />
                      <span>Promotions & Updates</span>
                    </label>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Push Notifications</h3>
                  <div className="settings-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings?.notifications?.push?.enabled || true}
                        onChange={(e) =>
                          handleSettingUpdate("notifications", "push", {
                            ...settings?.notifications?.push,
                            enabled: e.target.checked,
                          })
                        }
                        disabled={saving}
                      />
                      <span>Enable Push Notifications</span>
                    </label>

                    <label className="settings-label">Notification Sound</label>
                    <select
                      value={settings?.notifications?.sound || "default"}
                      onChange={(e) =>
                        handleSettingUpdate(
                          "notifications",
                          "sound",
                          e.target.value,
                        )
                      }
                      disabled={saving}
                      className="settings-select"
                    >
                      {Object.entries(NOTIFICATION_SOUNDS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Display Panel */}
            {activeTab === "display" && (
              <div className="settings-panel">
                <h2>Display Settings</h2>

                <div className="settings-section">
                  <h3>Theme</h3>
                  <div className="theme-options">
                    {Object.entries(THEMES).map(([value, label]) => (
                      <button
                        key={value}
                        className={`theme-option ${settings?.display?.theme === value ? "active" : ""}`}
                        onClick={() =>
                          handleSettingUpdate("display", "theme", value)
                        }
                        disabled={saving}
                      >
                        <div className={`theme-preview theme-${value}`}></div>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Font Size</h3>
                  <div className="settings-options">
                    <input
                      type="range"
                      min="12"
                      max="20"
                      step="1"
                      value={settings?.display?.fontSize || 16}
                      onChange={(e) =>
                        handleSettingUpdate(
                          "display",
                          "fontSize",
                          parseInt(e.target.value),
                        )
                      }
                      disabled={saving}
                      className="font-size-slider"
                    />
                    <div className="font-size-preview">
                      <span
                        style={{
                          fontSize: `${settings?.display?.fontSize || 16}px`,
                        }}
                      >
                        Preview Text
                      </span>
                    </div>
                    <p className="settings-hint">
                      Adjust the font size to your preference
                    </p>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Compact Mode</h3>
                  <div className="settings-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings?.display?.compactMode || false}
                        onChange={(e) =>
                          handleSettingUpdate(
                            "display",
                            "compactMode",
                            e.target.checked,
                          )
                        }
                        disabled={saving}
                      />
                      <span>Enable Compact Mode</span>
                    </label>
                    <p className="settings-hint">
                      Reduces spacing and makes elements more compact
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Panel */}
            {activeTab === "privacy" && (
              <div className="settings-panel">
                <h2>Privacy & Security</h2>

                <div className="settings-section">
                  <h3>Profile Visibility</h3>
                  <div className="settings-options">
                    <select
                      value={settings?.privacy?.profileVisibility || "public"}
                      onChange={(e) =>
                        handleSettingUpdate(
                          "privacy",
                          "profileVisibility",
                          e.target.value,
                        )
                      }
                      disabled={saving}
                      className="settings-select"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="contacts">Only Contacts</option>
                    </select>
                    <p className="settings-hint">
                      Control who can see your profile information
                    </p>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Data Sharing</h3>
                  <div className="settings-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings?.privacy?.shareAnalytics || true}
                        onChange={(e) =>
                          handleSettingUpdate(
                            "privacy",
                            "shareAnalytics",
                            e.target.checked,
                          )
                        }
                        disabled={saving}
                      />
                      <span>Share Anonymous Usage Data</span>
                    </label>
                    <p className="settings-hint">
                      Help us improve by sharing anonymous usage statistics
                    </p>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Session Management</h3>
                  <div className="settings-options">
                    <label className="settings-label">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      step="5"
                      value={settings?.security?.sessionTimeout || 30}
                      onChange={(e) =>
                        handleSettingUpdate(
                          "security",
                          "sessionTimeout",
                          parseInt(e.target.value),
                        )
                      }
                      disabled={saving}
                      className="settings-input"
                    />
                    <p className="settings-hint">
                      Automatically log out after inactivity
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Data Management Panel */}
            {activeTab === "data" && (
              <div className="settings-panel">
                <h2>Data Management</h2>

                <div className="settings-section">
                  <h3>Export Data</h3>
                  <div className="settings-options">
                    <button
                      onClick={handleExport}
                      className="settings-button"
                      disabled={saving}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Export Settings
                    </button>
                    <p className="settings-hint">
                      Export your settings as a JSON file for backup
                    </p>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Import Data</h3>
                  <div className="settings-options">
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => setImportFile(e.target.files[0])}
                      className="file-input"
                    />
                    <button
                      onClick={() => setShowImportConfirm(true)}
                      className="settings-button"
                      disabled={saving || !importFile}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      Import Settings
                    </button>
                    <p className="settings-hint">
                      Import settings from a previously exported JSON file
                    </p>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Backups</h3>
                  <div className="settings-options">
                    <button
                      onClick={handleCreateBackup}
                      className="settings-button"
                      disabled={saving}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        />
                      </svg>
                      Create Backup
                    </button>

                    {backupList.length > 0 && (
                      <div className="backup-list">
                        <h4>Recent Backups</h4>
                        {backupList.map((backup) => (
                          <div key={backup.id} className="backup-item">
                            <span>
                              {new Date(backup.createdAt).toLocaleString()}
                            </span>
                            <button
                              onClick={() => handleRestoreBackup(backup.id)}
                              disabled={restoring}
                              className="restore-button"
                            >
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Clear Data</h3>
                  <div className="settings-options">
                    <button
                      onClick={handleClearData}
                      className="settings-button danger"
                      disabled={saving}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Clear Cache
                    </button>
                    <p className="settings-hint">
                      Clear cached data to free up space
                    </p>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Reset Settings</h3>
                  <div className="settings-options">
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="settings-button warning"
                      disabled={saving}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Reset to Default
                    </button>
                    <p className="settings-hint">
                      Reset all settings to their default values
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
