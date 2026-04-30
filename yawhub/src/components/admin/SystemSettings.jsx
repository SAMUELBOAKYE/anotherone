import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Settings,
  Globe,
  FileText,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  Mail,
  AlertTriangle,
  Save,
  RefreshCw,
  Sliders,
  Gauge,
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  HelpCircle,
  RotateCcw,
  Zap,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Server,
  Activity,
  Bell,
  Clock,
  Database
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/components/SystemSettings.css';

// Custom hooks
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });
  
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue];
};

// Validation schema
const validationRules = {
  siteName: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_&.]+$/,
    message: 'Site name must be 3-100 characters and contain only letters, numbers, spaces, and basic punctuation'
  },
  siteDescription: {
    maxLength: 500,
    message: 'Description cannot exceed 500 characters'
  },
  maxNoticeLength: {
    min: 100,
    max: 50000,
    type: 'number',
    message: 'Notice length must be between 100 and 50,000 characters'
  },
  maxEventCapacity: {
    min: 10,
    max: 10000,
    type: 'number',
    message: 'Event capacity must be between 10 and 10,000 attendees'
  }
};

// Validation function
const validateField = (name, value) => {
  const rule = validationRules[name];
  if (!rule) return null;
  
  if (rule.required && !value) {
    return `${name} is required`;
  }
  
  if (rule.minLength && value.length < rule.minLength) {
    return `${name} must be at least ${rule.minLength} characters`;
  }
  
  if (rule.maxLength && value.length > rule.maxLength) {
    return `${name} cannot exceed ${rule.maxLength} characters`;
  }
  
  if (rule.pattern && !rule.pattern.test(value)) {
    return rule.message;
  }
  
  if (rule.type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) return `${name} must be a number`;
    if (rule.min && numValue < rule.min) return `${name} must be at least ${rule.min}`;
    if (rule.max && numValue > rule.max) return `${name} cannot exceed ${rule.max}`;
  }
  
  return null;
};

// Section component for better organization
const SettingsSection = ({ icon: Icon, title, description, children, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useLocalStorage(`settings-section-${title}`, defaultExpanded);
  
  return (
    <div className="settings-section">
      <div 
        className="section-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="section-header-left">
          <Icon size={20} className="section-icon" />
          <div className="section-title-wrapper">
            <h3>{title}</h3>
            {description && <p className="section-description">{description}</p>}
          </div>
        </div>
        <div className="section-header-right">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      {isExpanded && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
};

// Form field component with validation
const FormField = ({ 
  id, 
  label, 
  icon: Icon, 
  error, 
  hint, 
  children, 
  required,
  tooltip 
}) => {
  return (
    <div className={`form-group ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {Icon && <Icon size={16} />}
        <span>{label}</span>
        {required && <span className="required-asterisk">*</span>}
        {tooltip && (
          <span className="tooltip-icon" data-tooltip={tooltip}>
            <HelpCircle size={14} />
          </span>
        )}
      </label>
      {children}
      {error && <div className="error-message">{error}</div>}
      {hint && !error && <small className="form-hint">{hint}</small>}
    </div>
  );
};

// Toggle component
const ToggleSwitch = ({ id, checked, onChange, disabled, label, description, icon: Icon }) => {
  return (
    <label className="toggle-item" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="toggle-track">
        <span className="toggle-thumb">
          {checked ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
        </span>
      </span>
      <span className="toggle-label">
        {Icon && <Icon size={16} />}
        <span className="toggle-label-text">
          {label}
          {description && <small>{description}</small>}
        </span>
      </span>
    </label>
  );
};

// Main component
const SystemSettings = () => {
  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    maintenanceMode: false,
    allowRegistrations: true,
    maxNoticeLength: 5000,
    maxEventCapacity: 500,
    defaultUserRole: 'student',
    emailNotifications: true,
    auditLogging: true,
    sessionTimeout: 30,
    backupFrequency: 'daily'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [saveHistory, setSaveHistory] = useState([]);
  
  const formRef = useRef();
  const saveTimeoutRef = useRef();
  
  const debouncedSettings = useDebounce(settings, 500);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (dirty && !saving) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveToLocalDraft();
      }, 30000);
    }
  }, [debouncedSettings, dirty]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSystemSettings();
      setSettings(data);
      setDirty(false);
      setValidationErrors({});
      
      // Load saved draft if exists
      const savedDraft = localStorage.getItem('system-settings-draft');
      if (savedDraft && window.confirm('You have a saved draft. Load it?')) {
        setSettings(JSON.parse(savedDraft));
        setDirty(true);
      }
    } catch (err) {
      setError('Failed to load settings. Please try again.');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveToLocalDraft = () => {
    try {
      localStorage.setItem('system-settings-draft', JSON.stringify(settings));
      setSuccess('Draft saved locally');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const validateAllFields = useCallback(() => {
    const errors = {};
    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, settings[field]);
      if (error) errors[field] = error;
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [settings]);

  const handleChange = useCallback((name, value) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
    setDirty(true);
    
    // Validate field
    const error = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAllFields()) {
      setError('Please fix validation errors before saving');
      // Scroll to first error
      const firstError = document.querySelector('.has-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const result = await adminService.updateSystemSettings(settings);
      setSuccess('Settings saved successfully!');
      setDirty(false);
      
      // Save to history
      setSaveHistory(prev => [...prev, {
        timestamp: new Date().toISOString(),
        settings: { ...settings }
      }].slice(-10));
      
      // Clear draft
      localStorage.removeItem('system-settings-draft');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings. Please check your inputs and try again.');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all changes? Unsaved changes will be lost.')) {
      fetchSettings();
    }
  };

  const handleRevertToLastSave = () => {
    if (saveHistory.length === 0) {
      setError('No previous save history available');
      return;
    }
    
    if (window.confirm('Revert to the last saved configuration?')) {
      const lastSave = saveHistory[saveHistory.length - 1];
      setSettings(lastSave.settings);
      setDirty(true);
      setSuccess('Reverted to last saved configuration');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const getSettingsStats = useMemo(() => {
    const stats = {
      totalChanges: Object.keys(settings).length,
      pendingChanges: dirty ? 1 : 0,
      lastSaved: saveHistory.length > 0 ? saveHistory[saveHistory.length - 1].timestamp : null
    };
    return stats;
  }, [settings, dirty, saveHistory]);

  if (loading) {
    return (
      <div className="system-settings-loading">
        <Loader2 size={48} className="spinning" />
        <p>Loading system configuration...</p>
      </div>
    );
  }

  return (
    <div className="system-settings">
      <div className="settings-header">
        <div className="header-left">
          <div className="header-icon">
            <Settings size={32} />
          </div>
          <div className="header-content">
            <h1>System Configuration</h1>
            <p className="settings-description">
              Manage and configure global system parameters
            </p>
          </div>
        </div>
        <div className="header-right">
          <div className="settings-stats">
            <div className="stat-item">
              <Activity size={14} />
              <span>{getSettingsStats.totalChanges} settings</span>
            </div>
            {getSettingsStats.pendingChanges > 0 && (
              <div className="stat-item warning">
                <Clock size={14} />
                <span>Pending changes</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Alerts */}
      {success && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="alert-close">×</button>
        </div>
      )}
      
      {error && (
        <div className="alert alert-error">
          <XCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}
      
      <form ref={formRef} onSubmit={handleSubmit}>
        {/* General Settings */}
        <SettingsSection 
          icon={Globe} 
          title="General Settings" 
          description="Basic site configuration and branding"
        >
          <FormField
            id="siteName"
            label="Site Name"
            icon={Globe}
            error={validationErrors.siteName}
            hint="This name will appear in the browser title and header"
            required
            tooltip="Used for SEO and site identification"
          >
            <input
              type="text"
              id="siteName"
              value={settings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              placeholder="Enter your site name"
              required
              autoComplete="off"
              className={validationErrors.siteName ? 'error' : ''}
            />
          </FormField>
          
          <FormField
            id="siteDescription"
            label="Site Description"
            icon={FileText}
            error={validationErrors.siteDescription}
            hint="Used for SEO and meta descriptions"
            tooltip="Helps with search engine optimization"
          >
            <textarea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => handleChange('siteDescription', e.target.value)}
              rows="3"
              placeholder="Describe your site's purpose and mission"
              className={validationErrors.siteDescription ? 'error' : ''}
            />
          </FormField>
        </SettingsSection>
        
        {/* Feature Controls */}
        <SettingsSection 
          icon={Sliders} 
          title="Feature Controls" 
          description="Enable or disable system features"
        >
          <ToggleSwitch
            id="maintenanceMode"
            checked={settings.maintenanceMode}
            onChange={(checked) => handleChange('maintenanceMode', checked)}
            label="Maintenance Mode"
            description="Site will be inaccessible to non-admin users"
            icon={settings.maintenanceMode ? Lock : Unlock}
          />
          
          <ToggleSwitch
            id="allowRegistrations"
            checked={settings.allowRegistrations}
            onChange={(checked) => handleChange('allowRegistrations', checked)}
            label="Allow User Registrations"
            description="Enable or disable public registration"
            icon={UserPlus}
          />
          
          <ToggleSwitch
            id="emailNotifications"
            checked={settings.emailNotifications}
            onChange={(checked) => handleChange('emailNotifications', checked)}
            label="Email Notifications"
            description="Send system emails for important events"
            icon={Mail}
          />
          
          <ToggleSwitch
            id="auditLogging"
            checked={settings.auditLogging}
            onChange={(checked) => handleChange('auditLogging', checked)}
            label="Audit Logging"
            description="Track all administrative actions"
            icon={Database}
          />
        </SettingsSection>
        
        {/* Limits & Constraints */}
        <SettingsSection 
          icon={Gauge} 
          title="Limits & Constraints" 
          description="System-wide limitations and thresholds"
        >
          <FormField
            id="maxNoticeLength"
            label="Maximum Notice Length"
            icon={FileText}
            error={validationErrors.maxNoticeLength}
            hint="Range: 100 - 50,000 characters"
            tooltip="Maximum length of notice content"
          >
            <div className="input-with-suffix">
              <input
                type="number"
                id="maxNoticeLength"
                value={settings.maxNoticeLength}
                onChange={(e) => handleChange('maxNoticeLength', parseInt(e.target.value))}
                min="100"
                max="50000"
                step="100"
                className={validationErrors.maxNoticeLength ? 'error' : ''}
              />
              <span className="input-suffix">characters</span>
            </div>
          </FormField>
          
          <FormField
            id="maxEventCapacity"
            label="Maximum Event Capacity"
            icon={Users}
            error={validationErrors.maxEventCapacity}
            hint="Range: 10 - 10,000 attendees"
          >
            <div className="input-with-suffix">
              <input
                type="number"
                id="maxEventCapacity"
                value={settings.maxEventCapacity}
                onChange={(e) => handleChange('maxEventCapacity', parseInt(e.target.value))}
                min="10"
                max="10000"
                step="10"
                className={validationErrors.maxEventCapacity ? 'error' : ''}
              />
              <span className="input-suffix">attendees</span>
            </div>
          </FormField>
          
          <FormField
            id="sessionTimeout"
            label="Session Timeout"
            icon={Clock}
            hint="Minutes of inactivity before automatic logout"
          >
            <div className="input-with-suffix">
              <input
                type="number"
                id="sessionTimeout"
                value={settings.sessionTimeout}
                onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                min="5"
                max="120"
                step="5"
              />
              <span className="input-suffix">minutes</span>
            </div>
          </FormField>
          
          <FormField
            id="defaultUserRole"
            label="Default User Role"
            icon={Shield}
            hint="Role assigned to newly registered users"
          >
            <select
              id="defaultUserRole"
              value={settings.defaultUserRole}
              onChange={(e) => handleChange('defaultUserRole', e.target.value)}
            >
              <option value="student">Student</option>
              <option value="staff">Staff Member</option>
            </select>
          </FormField>
          
          <FormField
            id="backupFrequency"
            label="Backup Frequency"
            icon={Server}
            hint="How often to perform system backups"
          >
            <select
              id="backupFrequency"
              value={settings.backupFrequency}
              onChange={(e) => handleChange('backupFrequency', e.target.value)}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </FormField>
        </SettingsSection>
        
        {/* Form Actions */}
        <div className="form-actions">
          <div className="actions-left">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={saving || !dirty}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="spinning" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
            
            <button 
              type="button" 
              className="btn-secondary"
              onClick={handleReset}
              disabled={saving || !dirty}
            >
              <RotateCcw size={18} />
              Reset
            </button>
            
            {saveHistory.length > 0 && (
              <button 
                type="button" 
                className="btn-secondary"
                onClick={handleRevertToLastSave}
                disabled={saving}
              >
                <RefreshCw size={18} />
                Revert to Last Save
              </button>
            )}
          </div>
          
          <div className="actions-right">
            <button 
              type="button" 
              className="btn-text"
              onClick={saveToLocalDraft}
              disabled={saving}
            >
              <Zap size={18} />
              Save Draft
            </button>
          </div>
        </div>
        
        {/* Unsaved Changes Warning */}
        {dirty && (
          <div className="unsaved-changes-warning">
            <AlertTriangle size={16} />
            <span>You have unsaved changes</span>
            <button onClick={saveToLocalDraft} className="warning-action">
              Save as draft
            </button>
          </div>
        )}
      </form>
      
      {/* Save History Panel */}
      {saveHistory.length > 0 && (
        <div className="save-history">
          <details>
            <summary>
              <Bell size={14} />
              Recent Save History
            </summary>
            <ul>
              {saveHistory.slice().reverse().map((item, index) => (
                <li key={index}>
                  <Clock size={12} />
                  {new Date(item.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;