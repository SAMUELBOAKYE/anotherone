// src/components/profile/UserProfile.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "../common/UserAvatar";
import LoadingSpinner from "../common/LoadingSpinner";
import "../../styles/components/UserProfile.css";

// ============================================================================
// SVG Icons
// ============================================================================

const Icons = {
  user: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M20 21C20 17.5 16.5 15 12 15C7.5 15 4 17.5 4 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M22 6L12 13L2 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22 16.92V19C22.0001 19.5305 21.7892 20.0391 21.414 20.4141C21.0389 20.7892 20.5302 21 20 21H19C10.5 21 3 13.5 3 5V4C3 3.46957 3.21071 2.96086 3.58579 2.58579C3.96086 2.21071 4.46957 2 5 2H7C7.53043 2 8.03914 2.21071 8.41421 2.58579C8.78929 2.96086 9 3.46957 9 4V7C9 7.53043 8.78929 8.03914 8.41421 8.41421C8.03914 8.78929 7.53043 9 7 9H6C6 15 9 18 15 18V17C15 16.4696 15.2107 15.9609 15.5858 15.5858C15.9609 15.2107 16.4696 15 17 15H20C20.5304 15 21.0391 15.2107 21.4142 15.5858C21.7893 15.9609 22 16.4696 22 17V16.92Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 22C12 22 20 16.5 20 10C20 5.5 16.5 2 12 2C7.5 2 4 5.5 4 10C4 16.5 12 22 12 22Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle
        cx="12"
        cy="10"
        r="4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        ry="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17 3L21 7L7 21H3V17L17 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M15 5L19 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  save: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16L21 8V19C21 20.1 20.1 21 19 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 21V15H8V21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M16 3V8H8V3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  cancel: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line
        x1="18"
        y1="6"
        x2="6"
        y2="18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="6"
        y1="6"
        x2="18"
        y2="18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  role: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M2 17L12 22L22 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  website: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="2"
        y1="12"
        x2="22"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 2C14.5 4.5 15 9 15 12C15 15 14.5 19.5 12 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 2C9.5 4.5 9 9 9 12C9 15 9.5 19.5 12 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
  company: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="9"
        y1="4"
        x2="9"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="15"
        y1="4"
        x2="15"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="9"
        x2="20"
        y2="9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="15"
        x2="20"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  verified: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline
        points="22 4 12 14.01 9 11.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
};

// ============================================================================
// PropTypes
// ============================================================================

const propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    email: PropTypes.string,
    avatar: PropTypes.string,
    role: PropTypes.string,
    phone: PropTypes.string,
    location: PropTypes.string,
    website: PropTypes.string,
    company: PropTypes.string,
    bio: PropTypes.string,
    joinDate: PropTypes.string,
    isVerified: PropTypes.bool,
  }).isRequired,
  onUpdate: PropTypes.func,
  onAvatarUpload: PropTypes.func,
  readOnly: PropTypes.bool,
  className: PropTypes.string,
  enableAnimations: PropTypes.bool,
};

const defaultProps = {
  onUpdate: null,
  onAvatarUpload: null,
  readOnly: false,
  className: "",
  enableAnimations: true,
};

// ============================================================================
// Helper Components
// ============================================================================

const IconWrapper = memo(({ icon, className = "", size = 20 }) => (
  <span
    className={`icon-wrapper ${className}`}
    style={{ width: size, height: size }}
  >
    {React.cloneElement(icon, { width: size, height: size })}
  </span>
));

IconWrapper.displayName = "IconWrapper";
IconWrapper.propTypes = {
  icon: PropTypes.element.isRequired,
  className: PropTypes.string,
  size: PropTypes.number,
};

const InfoField = memo(
  ({
    icon,
    label,
    value,
    onEdit,
    isEditing,
    editValue,
    onChange,
    type = "text",
  }) => (
    <div className="info-field">
      <div className="info-label">
        <IconWrapper icon={icon} size={18} />
        <span>{label}</span>
      </div>
      <div className="info-value">
        {isEditing ? (
          type === "textarea" ? (
            <textarea
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              className="info-input"
              rows={3}
            />
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              className="info-input"
            />
          )
        ) : (
          <span className="info-text">{value || "Not specified"}</span>
        )}
      </div>
      {onEdit && !isEditing && (
        <button className="info-edit-btn" onClick={onEdit}>
          <IconWrapper icon={Icons.edit} size={16} />
        </button>
      )}
    </div>
  ),
);

InfoField.displayName = "InfoField";
InfoField.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onEdit: PropTypes.func,
  isEditing: PropTypes.bool,
  editValue: PropTypes.string,
  onChange: PropTypes.func,
  type: PropTypes.string,
};

// ============================================================================
// Main Component
// ============================================================================

const UserProfile = memo(
  ({
    user,
    onUpdate,
    onAvatarUpload,
    readOnly = false,
    className = "",
    enableAnimations = true,
  }) => {
    // ===== State =====
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState("profile");
    const [editingField, setEditingField] = useState(null);
    const [fieldValues, setFieldValues] = useState({});

    // ===== Refs =====
    const fileInputRef = useRef(null);

    // ===== Initialize Form Data =====
    useEffect(() => {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        website: user.website || "",
        company: user.company || "",
        bio: user.bio || "",
        role: user.role || "",
      });
      setFieldValues({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        website: user.website || "",
        company: user.company || "",
        bio: user.bio || "",
        role: user.role || "",
      });
    }, [user]);

    // ===== Handlers =====
    const handleEditField = useCallback(
      (field) => {
        setEditingField(field);
        setFieldValues((prev) => ({ ...prev, [field]: formData[field] || "" }));
      },
      [formData],
    );

    const handleFieldChange = useCallback((field, value) => {
      setFieldValues((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSaveField = useCallback(
      async (field) => {
        const newValue = fieldValues[field];
        if (newValue === formData[field]) {
          setEditingField(null);
          return;
        }

        setIsSaving(true);
        try {
          const updatedData = { ...formData, [field]: newValue };
          if (onUpdate) {
            await onUpdate(updatedData);
          }
          setFormData(updatedData);
          setEditingField(null);
          showToast(
            `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`,
            "success",
          );
        } catch (error) {
          console.error("Failed to update field:", error);
          showToast(`Failed to update ${field}. Please try again.`, "error");
        } finally {
          setIsSaving(false);
        }
      },
      [fieldValues, formData, onUpdate],
    );

    const handleCancelField = useCallback(() => {
      setEditingField(null);
      setFieldValues((prev) => ({
        ...prev,
        [editingField]: formData[editingField] || "",
      }));
    }, [editingField, formData]);

    const handleAvatarUpload = useCallback(
      async (file) => {
        if (onAvatarUpload) {
          setIsSaving(true);
          try {
            await onAvatarUpload(file);
            showToast("Profile picture updated successfully!", "success");
          } catch (error) {
            console.error("Failed to upload avatar:", error);
            showToast(
              "Failed to update profile picture. Please try again.",
              "error",
            );
          } finally {
            setIsSaving(false);
          }
        }
      },
      [onAvatarUpload],
    );

    const showToast = useCallback((message, type) => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 5000);
    }, []);

    // ===== Memoized Values =====
    const stats = useMemo(
      () => [
        {
          label: "Member Since",
          value: user.joinDate
            ? new Date(user.joinDate).toLocaleDateString()
            : "N/A",
          icon: Icons.calendar,
        },
        {
          label: "Status",
          value: user.isVerified ? "Verified" : "Unverified",
          icon: Icons.verified,
          highlight: user.isVerified,
        },
      ],
      [user.joinDate, user.isVerified],
    );

    const personalInfo = useMemo(
      () => [
        {
          field: "name",
          label: "Full Name",
          icon: Icons.user,
          type: "text",
          value: formData.name,
        },
        {
          field: "email",
          label: "Email Address",
          icon: Icons.email,
          type: "email",
          value: formData.email,
        },
        {
          field: "phone",
          label: "Phone Number",
          icon: Icons.phone,
          type: "tel",
          value: formData.phone,
        },
        {
          field: "location",
          label: "Location",
          icon: Icons.location,
          type: "text",
          value: formData.location,
        },
      ],
      [formData],
    );

    const professionalInfo = useMemo(
      () => [
        {
          field: "role",
          label: "Role",
          icon: Icons.role,
          type: "text",
          value: formData.role,
        },
        {
          field: "company",
          label: "Company",
          icon: Icons.company,
          type: "text",
          value: formData.company,
        },
        {
          field: "website",
          label: "Website",
          icon: Icons.website,
          type: "url",
          value: formData.website,
        },
        {
          field: "bio",
          label: "Bio",
          icon: Icons.user,
          type: "textarea",
          value: formData.bio,
        },
      ],
      [formData],
    );

    // ===== Animation Variants =====
    const pageVariants = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    };

    const tabVariants = {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    };

    const Component = enableAnimations ? motion.div : "div";

    // ==========================================================================
    // Render
    // ==========================================================================
    return (
      <div className={`user-profile ${className}`}>
        <AnimatePresence>
          {toast && (
            <motion.div
              className={`toast toast--${toast.type}`}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              role="alert"
            >
              <span className="toast-message">{toast.message}</span>
              <button className="toast-close" onClick={() => setToast(null)}>
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Component
          className="profile-container"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-avatar-section">
              <UserAvatar
                user={user}
                size="xlarge"
                showUploadButton={!readOnly && !!onAvatarUpload}
                onUpload={handleAvatarUpload}
                interactive={!readOnly}
              />
              {user.isVerified && (
                <div className="verified-badge">
                  <IconWrapper icon={Icons.verified} size={20} />
                </div>
              )}
            </div>

            <div className="profile-header-info">
              <h1 className="profile-name">{user.name || "User"}</h1>
              <p className="profile-role">{user.role || "Member"}</p>
              <div className="profile-stats">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`stat-item ${stat.highlight ? "highlight" : ""}`}
                  >
                    <IconWrapper icon={stat.icon} size={16} />
                    <div className="stat-details">
                      <span className="stat-label">{stat.label}</span>
                      <span className="stat-value">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              Personal Info
            </button>
            <button
              className={`tab-btn ${activeTab === "professional" ? "active" : ""}`}
              onClick={() => setActiveTab("professional")}
            >
              Professional Info
            </button>
          </div>

          {/* Profile Content */}
          <div className="profile-content">
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  className="profile-info-section"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  {personalInfo.map((info) => (
                    <InfoField
                      key={info.field}
                      icon={info.icon}
                      label={info.label}
                      value={info.value}
                      type={info.type}
                      onEdit={
                        !readOnly ? () => handleEditField(info.field) : null
                      }
                      isEditing={editingField === info.field}
                      editValue={fieldValues[info.field]}
                      onChange={(value) => handleFieldChange(info.field, value)}
                    />
                  ))}
                </motion.div>
              )}

              {activeTab === "professional" && (
                <motion.div
                  key="professional"
                  className="profile-info-section"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  {professionalInfo.map((info) => (
                    <InfoField
                      key={info.field}
                      icon={info.icon}
                      label={info.label}
                      value={info.value}
                      type={info.type}
                      onEdit={
                        !readOnly ? () => handleEditField(info.field) : null
                      }
                      isEditing={editingField === info.field}
                      editValue={fieldValues[info.field]}
                      onChange={(value) => handleFieldChange(info.field, value)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Edit/Save Controls */}
            {editingField && (
              <div className="edit-controls">
                <button
                  className="edit-control-btn save"
                  onClick={() => handleSaveField(editingField)}
                  disabled={isSaving}
                >
                  <IconWrapper icon={Icons.save} size={16} />
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  className="edit-control-btn cancel"
                  onClick={handleCancelField}
                  disabled={isSaving}
                >
                  <IconWrapper icon={Icons.cancel} size={16} />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </Component>

        {/* Hidden file input for avatar upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleAvatarUpload(e.target.files[0]);
            }
            e.target.value = "";
          }}
        />
      </div>
    );
  },
);

UserProfile.displayName = "UserProfile";
UserProfile.propTypes = propTypes;
UserProfile.defaultProps = defaultProps;

export default UserProfile;
