import React, { useMemo, memo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import "../../styles/components/UserProfile.css";



const Icons = {
  defaultAvatar: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M20 21C20 17.5 16.5 15 12 15C7.5 15 4 17.5 4 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  camera: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  loading: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="60" strokeDashoffset="20">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
      </circle>
    </svg>
  ),
};



const propTypes = {
  /** User object containing name, email, avatar URL */
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    avatar: PropTypes.string,
    role: PropTypes.string,
  }).isRequired,
  /** Size of the avatar */
  size: PropTypes.oneOf(["small", "medium", "large", "xlarge"]),
  /** Click handler for the avatar */
  onClick: PropTypes.func,
  /** Whether the avatar is interactive */
  interactive: PropTypes.bool,
  /** Show upload button overlay */
  showUploadButton: PropTypes.bool,
  /** Callback when upload is triggered */
  onUpload: PropTypes.func,
  /** Custom CSS class name */
  className: PropTypes.string,
  /** Disable avatar interactions */
  disabled: PropTypes.bool,
  /** Show status indicator */
  showStatus: PropTypes.bool,
  /** User status (online, offline, away, busy) */
  status: PropTypes.oneOf(["online", "offline", "away", "busy"]),
  /** Enable animations */
  enableAnimations: PropTypes.bool,
};

const defaultProps = {
  size: "medium",
  onClick: null,
  interactive: false,
  showUploadButton: false,
  onUpload: null,
  className: "",
  disabled: false,
  showStatus: false,
  status: "offline",
  enableAnimations: true,
};



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

const StatusIndicator = memo(({ status, size }) => {
  const statusConfig = {
    online: { color: "#10b981", label: "Online" },
    offline: { color: "#9ca3af", label: "Offline" },
    away: { color: "#f59e0b", label: "Away" },
    busy: { color: "#ef4444", label: "Busy" },
  };

  const config = statusConfig[status];
  const indicatorSize = size === "small" ? 8 : size === "large" ? 14 : 12;

  return (
    <span
      className={`status-indicator status--${status}`}
      style={{
        backgroundColor: config.color,
        width: indicatorSize,
        height: indicatorSize,
      }}
      aria-label={`Status: ${config.label}`}
    />
  );
});

StatusIndicator.displayName = "StatusIndicator";
StatusIndicator.propTypes = {
  status: PropTypes.oneOf(["online", "offline", "away", "busy"]).isRequired,
  size: PropTypes.string.isRequired,
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * UserAvatar component – displays user avatar with initials fallback,
 * status indicators, upload functionality, and accessibility features.
 */
const UserAvatar = memo(
  ({
    user,
    size = "medium",
    onClick,
    interactive = false,
    showUploadButton = false,
    onUpload,
    className = "",
    disabled = false,
    showStatus = false,
    status = "offline",
    enableAnimations = true,
  }) => {
    // ===== State =====
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [uploading, setUploading] = useState(false);

    // ===== Memoized Values =====
    const initials = useMemo(() => {
      if (user.name) {
        const nameParts = user.name.trim().split(/\s+/);
        if (nameParts.length === 1) {
          return nameParts[0].charAt(0).toUpperCase();
        }
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
      }
      if (user.email) {
        return user.email.charAt(0).toUpperCase();
      }
      return "U";
    }, [user.name, user.email]);

    const backgroundColor = useMemo(() => {
    
      const colors = [
        "#3498db", 
        "#e74c3c", 
        "#2ecc71", 
        "#f39c12", 
        "#9b59b6", 
        "#1abc9c", 
        "#e67e22", 
        "#34495e",
        "#16a085", 
        "#c0392b", 
        "#27ae60",
        "#8e44ad", 
      ];

      const identifier = user.name || user.email || user.role || "default";
      let hash = 0;
      for (let i = 0; i < identifier.length; i++) {
        hash = ((hash << 5) - hash) + identifier.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % colors.length;
      return colors[index];
    }, [user.name, user.email, user.role]);

    const sizeClass = useMemo(() => {
      const sizeMap = {
        small: "avatar-small",
        medium: "avatar-medium",
        large: "avatar-large",
        xlarge: "avatar-xlarge",
      };
      return sizeMap[size] || "avatar-medium";
    }, [size]);

    const avatarContent = useMemo(() => {
      if (user.avatar && !imageError) {
        return (
          <img
            src={user.avatar}
            alt={user.name || "User avatar"}
            className="avatar-image"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        );
      }
      return (
        <span className="avatar-initials" aria-hidden="true">
          {initials}
        </span>
      );
    }, [user.avatar, user.name, imageError, initials]);

    
    const handleClick = useCallback(() => {
      if (disabled) return;
      if (onClick) {
        onClick();
      }
    }, [onClick, disabled]);

    const handleKeyDown = useCallback(
      (event) => {
        if (disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      },
      [handleClick, disabled]
    );

    const handleFileUpload = useCallback(
      async (event) => {
        const file = event.target.files?.[0];
        if (!file || !onUpload) return;

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
          console.error("Invalid file type. Please upload JPEG, PNG, or WebP images.");
          return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          console.error("File too large. Maximum size is 5MB.");
          return;
        }

        setUploading(true);
        try {
          await onUpload(file);
        } catch (error) {
          console.error("Failed to upload avatar:", error);
        } finally {
          setUploading(false);
        }
      },
      [onUpload]
    );

    const handleUploadClick = useCallback((event) => {
      event.stopPropagation();
      const fileInput = document.getElementById("avatar-upload-input");
      if (fileInput) {
        fileInput.click();
      }
    }, []);

    const animationProps = enableAnimations
      ? {
          whileHover: interactive && !disabled ? { scale: 1.05 } : {},
          whileTap: interactive && !disabled ? { scale: 0.95 } : {},
          transition: { duration: 0.2 },
        }
      : {};


    const Component = enableAnimations ? motion.div : "div";

    return (
      <div className={`user-avatar-wrapper ${className}`}>
        <Component
          className={`user-avatar ${sizeClass} ${interactive ? "interactive" : ""} ${
            disabled ? "disabled" : ""
          }`}
          style={{ backgroundColor }}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role={interactive ? "button" : undefined}
          tabIndex={interactive && !disabled ? 0 : -1}
          aria-label={user.name ? `${user.name}'s avatar` : "User avatar"}
          aria-disabled={disabled}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          {...animationProps}
        >
          {uploading ? (
            <div className="avatar-uploading">
              <IconWrapper icon={Icons.loading} size={size === "small" ? 16 : size === "large" ? 32 : 24} />
            </div>
          ) : (
            avatarContent
          )}

          {/* Upload Overlay */}
          {showUploadButton && onUpload && !disabled && (isHovered || uploading) && (
            <div className="avatar-upload-overlay" onClick={handleUploadClick}>
              <IconWrapper icon={Icons.camera} size={size === "small" ? 16 : size === "large" ? 24 : 20} />
              <span className="upload-text">Change</span>
            </div>
          )}

          {/* Status Indicator */}
          {showStatus && !showUploadButton && (
            <StatusIndicator status={status} size={size} />
          )}
        </Component>

        {/* Hidden file input for upload */}
        {showUploadButton && (
          <input
            id="avatar-upload-input"
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleFileUpload}
            style={{ display: "none" }}
            aria-label="Upload avatar image"
          />
        )}
      </div>
    );
  }
);



UserAvatar.displayName = "UserAvatar";

UserAvatar.propTypes = propTypes;
UserAvatar.defaultProps = defaultProps;

export default UserAvatar;