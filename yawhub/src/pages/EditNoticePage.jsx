import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Calendar,
  Tag,
  FileText,
  Image,
  Link2,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  X,
  Upload,
  Trash2,
  Move,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Code,
  Quote,
  HelpCircle,
  Clock,
  Users,
  Megaphone,
  Globe,
  Lock,
  Bell,
  Send,
  Sparkles,
  Zap,
  Award,
  History,
  Copy,
  RefreshCw,
  Eye as ViewIcon,
  MessageCircle,
  Heart,
  TrendingUp,
  Share2,
  Bookmark,
  Flag,
  Edit,
  Trash,
  Archive,
  User,
  Download,
  Printer,
  ExternalLink,
} from "lucide-react";
import EventList from "../components/event/EventList";
import EventFilters from "../components/event/EventFilters";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { noticeService } from "../services/noticeService";
import "../styles/components/EditNoticePage.css";

// Constants
const NOTICE_CATEGORIES = [
  {
    value: "academic",
    label: "Academic",
    icon: FileText,
    color: "primary",
    description: "Course updates, schedules, academic deadlines",
  },
  {
    value: "events",
    label: "Events",
    icon: Calendar,
    color: "success",
    description: "Workshops, seminars, cultural events",
  },
  {
    value: "announcements",
    label: "Announcements",
    icon: Megaphone,
    color: "warning",
    description: "General university announcements",
  },
  {
    value: "important",
    label: "Important",
    icon: AlertCircle,
    color: "danger",
    description: "Urgent or critical information",
  },
  {
    value: "achievements",
    label: "Achievements",
    icon: Award,
    color: "info",
    description: "Student and staff accomplishments",
  },
];

const NOTICE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  SCHEDULED: "scheduled",
  ARCHIVED: "archived",
};

const VALIDATION_RULES = {
  title: {
    required: true,
    minLength: 10,
    maxLength: 200,
    message: "Title must be between 10 and 200 characters",
  },
  content: {
    required: true,
    minLength: 50,
    maxLength: 50000,
    message: "Content must be between 50 and 50,000 characters",
  },
  category: {
    required: true,
    message: "Please select a category",
  },
  summary: {
    maxLength: 500,
    message: "Summary cannot exceed 500 characters",
  },
};

// ============================================
// Alert Component
// ============================================
const Alert = ({ type, message, dismissible, onClose, icon }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`alert alert-${type} ${dismissible ? "alert-dismissible" : ""}`}
    >
      <div className="alert-content">
        {icon && <span className="alert-icon">{icon}</span>}
        <span className="alert-message">{message}</span>
        {dismissible && (
          <button className="alert-close" onClick={handleClose}>
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// Modal Component
// ============================================
const Modal = ({ isOpen, onClose, title, children, size = "medium" }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className={`modal-container modal-${size}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

// ============================================
// RichTextEditor Component
// ============================================
const RichTextEditor = ({ value, onChange, placeholder, minHeight = 300 }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const execCommand = (command, valueParam = null) => {
    document.execCommand(command, false, valueParam);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = (e) => {
    onChange(e.target.innerHTML);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  return (
    <div className={`rich-text-editor ${isFocused ? "focused" : ""}`}>
      <div className="editor-toolbar">
        <button type="button" onClick={() => execCommand("bold")} title="Bold">
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          title="Underline"
        >
          <Underline size={16} />
        </button>
        <span className="toolbar-divider" />
        <button
          type="button"
          onClick={() => execCommand("justifyLeft")}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyCenter")}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyRight")}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
        <span className="toolbar-divider" />
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <span className="toolbar-divider" />
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<pre>")}
          title="Code Block"
        >
          <Code size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<blockquote>")}
          title="Quote"
        >
          <Quote size={16} />
        </button>
      </div>
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        style={{ minHeight: `${minHeight}px` }}
        dangerouslySetInnerHTML={{ __html: value || "" }}
      />
    </div>
  );
};

// ============================================
// ImageUploader Component
// ============================================
const ImageUploader = ({
  onUpload,
  existingImage,
  onRemove,
  isUploading,
  uploadProgress,
}) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      onUpload(file);
    }
  };

  return (
    <div className="image-uploader">
      {existingImage ? (
        <div className="uploaded-image">
          <img src={existingImage} alt="Featured" />
          <div className="image-overlay">
            <button
              type="button"
              className="change-image-btn"
              onClick={() => fileInputRef.current.click()}
            >
              <Image size={16} />
              Change
            </button>
            <button
              type="button"
              className="remove-image-btn"
              onClick={onRemove}
            >
              <Trash2 size={16} />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className="upload-area"
          onClick={() => fileInputRef.current.click()}
        >
          <Upload size={32} />
          <p>Click to upload featured image</p>
          <small>PNG, JPG, GIF up to 5MB</small>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      {isUploading && (
        <div className="upload-progress">
          <Loader2 size={20} className="spinning" />
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span>{uploadProgress}%</span>
        </div>
      )}
    </div>
  );
};

// ============================================
// TagInput Component
// ============================================
const TagInput = ({ value = [], onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = inputValue.trim().toLowerCase();
      if (tag && !value.includes(tag) && value.length < 10) {
        onChange([...value, tag]);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="tag-input">
      <div className="tags-container">
        {value.map((tag, index) => (
          <span key={index} className="tag">
            #{tag}
            <button type="button" onClick={() => removeTag(tag)}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="tag-input-field"
        />
      </div>
      {value.length >= 10 && (
        <small className="tag-limit-warning">Maximum 10 tags allowed</small>
      )}
    </div>
  );
};

// ============================================
// VersionHistory Component
// ============================================
const VersionHistory = ({ versions, onRestore, currentVersion }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="version-history">
      {versions.length === 0 ? (
        <div className="no-versions">
          <History size={48} />
          <p>No version history available</p>
        </div>
      ) : (
        <div className="versions-list">
          {versions.map((version, index) => (
            <div key={version.id} className="version-item">
              <div className="version-header">
                <div className="version-info">
                  <span className="version-number">
                    Version {versions.length - index}
                  </span>
                  {version.version === currentVersion && (
                    <span className="current-badge">Current</span>
                  )}
                </div>
                <div className="version-meta">
                  <span className="version-date">
                    <Clock size={12} />
                    {formatDate(version.createdAt)}
                  </span>
                  <span className="version-author">
                    <User size={12} />
                    {version.author?.name || "System"}
                  </span>
                </div>
              </div>
              <div className="version-changes">
                <strong>Changes:</strong> {version.changes || "Content updated"}
              </div>
              {version.version !== currentVersion && (
                <button
                  className="restore-btn"
                  onClick={() => onRestore(version.id)}
                >
                  <RefreshCw size={14} />
                  Restore this version
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// NoticeStats Component
// ============================================
const NoticeStats = ({ stats }) => {
  return (
    <div className="notice-stats">
      <div className="stats-header">
        <h3>Analytics Overview</h3>
        <span className="stats-period">Last 30 days</span>
      </div>

      <div className="stats-grid-large">
        <div className="stat-card-large">
          <Eye size={24} />
          <div>
            <div className="stat-value-large">
              {stats.totalViews?.toLocaleString() || 0}
            </div>
            <div className="stat-label-large">Total Views</div>
          </div>
        </div>

        <div className="stat-card-large">
          <Heart size={24} />
          <div>
            <div className="stat-value-large">
              {stats.totalReactions?.toLocaleString() || 0}
            </div>
            <div className="stat-label-large">Total Reactions</div>
          </div>
        </div>

        <div className="stat-card-large">
          <MessageCircle size={24} />
          <div>
            <div className="stat-value-large">
              {stats.commentsCount?.toLocaleString() || 0}
            </div>
            <div className="stat-label-large">Comments</div>
          </div>
        </div>

        <div className="stat-card-large">
          <Share2 size={24} />
          <div>
            <div className="stat-value-large">
              {stats.shareCount?.toLocaleString() || 0}
            </div>
            <div className="stat-label-large">Shares</div>
          </div>
        </div>
      </div>

      {stats.dailyViews && (
        <div className="stats-chart">
          <h4>Daily Views</h4>
          <div className="chart-bars">
            {stats.dailyViews.slice(-7).map((day, index) => (
              <div key={index} className="chart-bar-container">
                <div
                  className="chart-bar"
                  style={{
                    height: `${Math.min(100, (day.count / Math.max(...stats.dailyViews.map((d) => d.count))) * 100)}%`,
                  }}
                />
                <span className="chart-label">{day.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// useFormValidation Hook
// ============================================
const useFormValidation = (initialValues, rules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);

  const validateField = (name, value) => {
    const rule = rules[name];
    if (!rule) return null;

    if (rule.required && !value) {
      return rule.message || `${name} is required`;
    }

    if (rule.minLength && value?.length < rule.minLength) {
      return (
        rule.message || `${name} must be at least ${rule.minLength} characters`
      );
    }

    if (rule.maxLength && value?.length > rule.maxLength) {
      return (
        rule.message || `${name} cannot exceed ${rule.maxLength} characters`
      );
    }

    return null;
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(rules).forEach((field) => {
      const error = validateField(field, values[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
    setIsValid(
      Object.keys({ ...errors, [name]: error }).filter((e) => errors[e])
        .length === 0,
    );
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validateAll,
  };
};

// ============================================
// Main EditNoticePage Component
// ============================================
const EditNoticePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const formRef = useRef();

  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notice, setNotice] = useState(null);
  const [originalNotice, setOriginalNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    summary: "",
    tags: [],
    featuredImage: null,
    attachments: [],
    publishDate: null,
    expiryDate: null,
    status: NOTICE_STATUS.DRAFT,
    isPinned: false,
    isPublic: true,
    notifySubscribers: true,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
  });

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [versions, setVersions] = useState([]);
  const [stats, setStats] = useState(null);

  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validateAll,
  } = useFormValidation(
    {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      summary: formData.summary,
    },
    VALIDATION_RULES,
  );

  // Load notice data
  useEffect(() => {
    if (id) {
      loadNotice();
      loadVersions();
      loadStats();
    }
  }, [id]);

  // Check for unsaved changes
  useEffect(() => {
    const hasUnsavedChanges =
      JSON.stringify(formData) !== JSON.stringify(originalNotice);
    setHasChanges(hasUnsavedChanges);

    // Warn before leaving
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, originalNotice]);

  const loadNotice = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await noticeService.getNoticeById(id);
      const noticeData = response.data;
      setNotice(noticeData);

      const formDataObj = {
        title: noticeData.title,
        content: noticeData.content,
        category: noticeData.category,
        summary: noticeData.summary || "",
        tags: noticeData.tags || [],
        featuredImage: noticeData.featuredImage,
        attachments: noticeData.attachments || [],
        publishDate: noticeData.publishDate,
        expiryDate: noticeData.expiryDate,
        status: noticeData.status,
        isPinned: noticeData.isPinned || false,
        isPublic: noticeData.isPublic !== false,
        notifySubscribers: true,
        seoTitle: noticeData.seoTitle || "",
        seoDescription: noticeData.seoDescription || "",
        seoKeywords: noticeData.seoKeywords || [],
      };

      setFormData(formDataObj);
      setOriginalNotice(formDataObj);

      // Update browser title
      document.title = `Edit: ${noticeData.title} - University Notices`;
    } catch (err) {
      setError(err.message || "Failed to load notice. Please try again.");
      console.error("Error loading notice:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      const response = await noticeService.getNoticeVersions(id);
      setVersions(response.data);
    } catch (err) {
      console.error("Error loading versions:", err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await noticeService.getNoticeStats(id);
      setStats(response.data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handleFormChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (field === "title") handleChange("title", value);
      if (field === "content") handleChange("content", value);
      if (field === "category") handleChange("category", value);
      if (field === "summary") handleChange("summary", value);
    },
    [handleChange],
  );

  const handleImageUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const response = await noticeService.uploadImage(file);
      clearInterval(interval);
      setUploadProgress(100);
      handleFormChange("featuredImage", response.data.url);
      setSuccess("Image uploaded successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      clearInterval(interval);
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleAttachmentUpload = async (files) => {
    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const response = await noticeService.uploadAttachment(file);
        return response.data;
      });

      const attachments = await Promise.all(uploadPromises);
      handleFormChange("attachments", [
        ...formData.attachments,
        ...attachments,
      ]);
      setSuccess(`${attachments.length} file(s) uploaded successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to upload attachments. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index) => {
    const newAttachments = [...formData.attachments];
    newAttachments.splice(index, 1);
    handleFormChange("attachments", newAttachments);
  };

  const validateForm = () => {
    if (!validateAll()) {
      setError("Please fill in all required fields correctly");
      const firstError = document.querySelector(".form-group.has-error");
      if (firstError)
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    if (!formData.category) {
      setError("Please select a category");
      return false;
    }

    return true;
  };

  const handleSave = async (status = formData.status) => {
    if (!validateForm()) return;

    setSaving(true);
    setError("");

    try {
      const data = {
        ...formData,
        status,
        updatedBy: user?.id,
        updatedAt: new Date().toISOString(),
      };

      const response = await noticeService.updateNotice(id, data);

      setSuccess(
        status === NOTICE_STATUS.PUBLISHED
          ? "Notice updated and published successfully!"
          : "Notice updated successfully!",
      );

      // Update original notice to reflect saved state
      setOriginalNotice({ ...formData });
      setHasChanges(false);

      setTimeout(() => {
        if (status === NOTICE_STATUS.PUBLISHED) {
          navigate(`/notices/${id}`);
        } else {
          loadNotice();
        }
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to update notice. Please try again.");
      console.error("Error updating notice:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => {
    handleSave(NOTICE_STATUS.PUBLISHED);
  };

  const handleArchive = async () => {
    try {
      await noticeService.archiveNotice(id);
      setSuccess("Notice archived successfully");
      setTimeout(() => {
        navigate("/notices");
      }, 1500);
    } catch (err) {
      setError("Failed to archive notice");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async () => {
    try {
      await noticeService.deleteNotice(id);
      setSuccess("Notice deleted successfully");
      setTimeout(() => {
        navigate("/notices");
      }, 1500);
    } catch (err) {
      setError("Failed to delete notice");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    try {
      const response = await noticeService.restoreVersion(id, versionId);
      const restoredData = response.data;

      setFormData({
        title: restoredData.title,
        content: restoredData.content,
        category: restoredData.category,
        summary: restoredData.summary || "",
        tags: restoredData.tags || [],
        featuredImage: restoredData.featuredImage,
        attachments: restoredData.attachments || [],
        publishDate: restoredData.publishDate,
        expiryDate: restoredData.expiryDate,
        status: restoredData.status,
        isPinned: restoredData.isPinned || false,
        isPublic: restoredData.isPublic !== false,
        notifySubscribers: true,
        seoTitle: restoredData.seoTitle || "",
        seoDescription: restoredData.seoDescription || "",
        seoKeywords: restoredData.seoKeywords || [],
      });

      setSuccess("Version restored successfully");
      setShowHistoryModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to restore version");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await noticeService.duplicateNotice(id);
      setSuccess("Notice duplicated successfully");
      setTimeout(() => {
        navigate(`/notices/edit/${response.data.id}`);
      }, 1500);
    } catch (err) {
      setError("Failed to duplicate notice");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleViewNotice = () => {
    window.open(`/notices/${id}`, "_blank");
  };

  const getWordCount = () => {
    const text = formData.content.replace(/<[^>]*>/g, "");
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  const getReadTime = () => {
    const wordsPerMinute = 200;
    const words = getWordCount();
    return Math.ceil(words / wordsPerMinute);
  };

  if (loading) {
    return (
      <div className="edit-notice-page">
        <div className="loading-container">
          <Loader2 size={48} className="spinning" />
          <p>Loading notice...</p>
        </div>
      </div>
    );
  }

  if (error && !notice) {
    return (
      <div className="edit-notice-page">
        <div className="error-container">
          <AlertCircle size={64} className="error-icon" />
          <h2>Notice Not Found</h2>
          <p>{error}</p>
          <Link to="/notices" className="back-button">
            <ArrowLeft size={20} />
            Back to Notices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-notice-page">
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <button className="back-btn" onClick={() => navigate("/notices")}>
              <ArrowLeft size={20} />
              Back
            </button>
            <div className="header-text">
              <h1>Edit Notice</h1>
              <p>Update your notice information</p>
            </div>
            <div className="header-stats">
              <div className="stat">
                <FileText size={16} />
                <span>{getWordCount()} words</span>
              </div>
              <div className="stat">
                <Clock size={16} />
                <span>{getReadTime()} min read</span>
              </div>
              {notice?.status === NOTICE_STATUS.PUBLISHED && (
                <div className="stat published">
                  <CheckCircle size={16} />
                  <span>Published</span>
                </div>
              )}
              {hasChanges && (
                <div className="stat warning">
                  <AlertCircle size={16} />
                  <span>Unsaved changes</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Alerts */}
        {error && (
          <Alert
            type="error"
            message={error}
            dismissible
            onClose={() => setError("")}
            icon={<AlertCircle size={18} />}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            dismissible
            onClose={() => setSuccess("")}
            icon={<CheckCircle size={18} />}
          />
        )}

        <div className="edit-layout">
          {/* Main Form */}
          <div className="edit-main">
            <div className="notice-form-wrapper">
              <form
                ref={formRef}
                className="notice-form"
                onSubmit={(e) => e.preventDefault()}
              >
                {/* Title Input */}
                <div
                  className={`form-group ${errors.title && touched.title ? "has-error" : ""}`}
                >
                  <label htmlFor="title">
                    <FileText size={16} />
                    Notice Title
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    onBlur={() => handleBlur("title")}
                    placeholder="Enter a clear, descriptive title"
                    maxLength={200}
                  />
                  <div className="input-hint">
                    <span>{formData.title.length}/200 characters</span>
                  </div>
                  {errors.title && touched.title && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      {errors.title}
                    </div>
                  )}
                </div>

                {/* Category Selection */}
                <div
                  className={`form-group ${errors.category && touched.category ? "has-error" : ""}`}
                >
                  <label>
                    <Tag size={16} />
                    Category
                    <span className="required">*</span>
                  </label>
                  <div className="category-grid">
                    {NOTICE_CATEGORIES.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.value}
                          type="button"
                          className={`category-card ${formData.category === category.value ? "selected" : ""}`}
                          onClick={() =>
                            handleFormChange("category", category.value)
                          }
                        >
                          <div className={`category-icon ${category.color}`}>
                            <Icon size={24} />
                          </div>
                          <div className="category-info">
                            <strong>{category.label}</strong>
                            <span>{category.description}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && touched.category && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      {errors.category}
                    </div>
                  )}
                </div>

                {/* Summary Input */}
                <div
                  className={`form-group ${errors.summary && touched.summary ? "has-error" : ""}`}
                >
                  <label htmlFor="summary">
                    <Sparkles size={16} />
                    Summary (Optional)
                  </label>
                  <textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) =>
                      handleFormChange("summary", e.target.value)
                    }
                    onBlur={() => handleBlur("summary")}
                    placeholder="Write a brief summary of the notice (max 500 characters)"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="input-hint">
                    <span>{formData.summary.length}/500 characters</span>
                  </div>
                  {errors.summary && touched.summary && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      {errors.summary}
                    </div>
                  )}
                </div>

                {/* Content Editor */}
                <div
                  className={`form-group ${errors.content && touched.content ? "has-error" : ""}`}
                >
                  <label>
                    <FileText size={16} />
                    Notice Content
                    <span className="required">*</span>
                  </label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) => handleFormChange("content", value)}
                    placeholder="Write your notice content here..."
                    minHeight={400}
                  />
                  <div className="editor-toolbar">
                    <button
                      type="button"
                      className="preview-btn"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                      {showPreview ? "Hide Preview" : "Show Preview"}
                    </button>
                  </div>
                  {errors.content && touched.content && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      {errors.content}
                    </div>
                  )}
                </div>

                {/* Live Preview */}
                {showPreview && (
                  <div className="live-preview">
                    <div className="preview-header">
                      <h3>Live Preview</h3>
                      <button onClick={() => setShowPreview(false)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="preview-content">
                      <h2>{formData.title || "Notice Title"}</h2>
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            formData.content ||
                            "<p>Notice content will appear here...</p>",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Tags Input */}
                <div className="form-group">
                  <label htmlFor="tags">
                    <Tag size={16} />
                    Tags (Optional)
                  </label>
                  <TagInput
                    value={formData.tags}
                    onChange={(tags) => handleFormChange("tags", tags)}
                    placeholder="Add tags (press Enter after each tag)"
                  />
                  <div className="input-hint">
                    <HelpCircle size={12} />
                    Tags help users find relevant notices
                  </div>
                </div>

                {/* Featured Image */}
                <div className="form-group">
                  <label>
                    <Image size={16} />
                    Featured Image (Optional)
                  </label>
                  <ImageUploader
                    onUpload={handleImageUpload}
                    existingImage={formData.featuredImage}
                    onRemove={() => handleFormChange("featuredImage", null)}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                  />
                </div>

                {/* Attachments */}
                <div className="form-group">
                  <label>
                    <Link2 size={16} />
                    Attachments (Optional)
                  </label>
                  <div className="attachment-upload-area">
                    <input
                      type="file"
                      id="attachments"
                      multiple
                      onChange={(e) => handleAttachmentUpload(e.target.files)}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      className="upload-btn"
                      onClick={() =>
                        document.getElementById("attachments").click()
                      }
                      disabled={isUploading}
                    >
                      <Upload size={20} />
                      Add Files
                    </button>
                    <span className="upload-hint">
                      PDF, DOC, DOCX, ZIP (Max 10MB each)
                    </span>
                  </div>
                  {formData.attachments.length > 0 && (
                    <div className="attachments-list">
                      {formData.attachments.map((attachment, index) => (
                        <div key={index} className="attachment-item">
                          <FileText size={16} />
                          <span className="attachment-name">
                            {attachment.name}
                          </span>
                          <span className="attachment-size">
                            {attachment.size}
                          </span>
                          <button
                            type="button"
                            className="remove-attachment"
                            onClick={() => removeAttachment(index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Advanced Settings Button */}
                <button
                  type="button"
                  className="settings-toggle"
                  onClick={() => setShowSettingsModal(true)}
                >
                  <Settings size={16} />
                  Advanced Settings
                </button>
              </form>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <div className="action-group">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleSave()}
                  disabled={saving || !hasChanges}
                >
                  <Save size={18} />
                  Save Changes
                </button>

                {notice?.status !== NOTICE_STATUS.PUBLISHED && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handlePublish}
                    disabled={saving}
                  >
                    <Send size={18} />
                    Publish
                  </button>
                )}
              </div>

              <div className="action-group">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleViewNotice}
                >
                  <ViewIcon size={18} />
                  View Notice
                </button>

                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleDuplicate}
                >
                  <Copy size={18} />
                  Duplicate
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="edit-sidebar">
            {/* Notice Info Card */}
            <div className="sidebar-card info-card">
              <h3>Notice Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <Calendar size={16} />
                  <span>Created</span>
                  <strong>
                    {new Date(notice?.createdAt).toLocaleDateString()}
                  </strong>
                </div>
                <div className="info-item">
                  <Clock size={16} />
                  <span>Last Updated</span>
                  <strong>
                    {new Date(notice?.updatedAt).toLocaleDateString()}
                  </strong>
                </div>
                <div className="info-item">
                  <User size={16} />
                  <span>Author</span>
                  <strong>{notice?.author?.name || "Unknown"}</strong>
                </div>
                <div className="info-item">
                  <Eye size={16} />
                  <span>Total Views</span>
                  <strong>{stats?.totalViews?.toLocaleString() || 0}</strong>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            {stats && (
              <div className="sidebar-card stats-card">
                <h3>Engagement Stats</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <Heart size={16} />
                    <span>Reactions</span>
                    <strong>{stats.totalReactions || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <MessageCircle size={16} />
                    <span>Comments</span>
                    <strong>{stats.commentsCount || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <Bookmark size={16} />
                    <span>Saves</span>
                    <strong>{stats.saveCount || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <Share2 size={16} />
                    <span>Shares</span>
                    <strong>{stats.shareCount || 0}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            <div className="sidebar-card admin-card">
              <h3>Admin Actions</h3>
              <div className="admin-actions">
                <button
                  className="admin-btn version"
                  onClick={() => setShowHistoryModal(true)}
                >
                  <History size={16} />
                  Version History
                </button>

                <button
                  className="admin-btn stats"
                  onClick={() => setShowStats(!showStats)}
                >
                  <TrendingUp size={16} />
                  View Analytics
                </button>

                {notice?.status === NOTICE_STATUS.PUBLISHED && (
                  <button className="admin-btn archive" onClick={handleArchive}>
                    <Archive size={16} />
                    Archive Notice
                  </button>
                )}

                <button
                  className="admin-btn delete"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash size={16} />
                  Delete Notice
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && stats && (
          <div className="stats-panel">
            <NoticeStats stats={stats} />
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Advanced Settings"
        size="large"
      >
        <div className="settings-form">
          <div className="settings-group">
            <h4>SEO Settings</h4>
            <div className="form-group">
              <label htmlFor="seoTitle">SEO Title</label>
              <input
                type="text"
                id="seoTitle"
                value={formData.seoTitle}
                onChange={(e) => handleFormChange("seoTitle", e.target.value)}
                placeholder="Leave empty to use notice title"
                maxLength={60}
              />
              <small>Recommended: 50-60 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="seoDescription">Meta Description</label>
              <textarea
                id="seoDescription"
                value={formData.seoDescription}
                onChange={(e) =>
                  handleFormChange("seoDescription", e.target.value)
                }
                placeholder="Brief description for search engines"
                rows={3}
                maxLength={160}
              />
              <small>Recommended: 150-160 characters</small>
            </div>

            <div className="form-group">
              <label>SEO Keywords</label>
              <TagInput
                value={formData.seoKeywords}
                onChange={(keywords) =>
                  handleFormChange("seoKeywords", keywords)
                }
                placeholder="Add SEO keywords"
              />
            </div>
          </div>

          <div className="settings-group">
            <h4>Visibility & Access</h4>
            <div className="toggle-group">
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    handleFormChange("isPublic", e.target.checked)
                  }
                />
                <span className="toggle-slider"></span>
                <div className="toggle-label">
                  <Globe size={16} />
                  <span>Public Notice</span>
                  <small>Visible to all users</small>
                </div>
              </label>

              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) =>
                    handleFormChange("isPinned", e.target.checked)
                  }
                />
                <span className="toggle-slider"></span>
                <div className="toggle-label">
                  <Bell size={16} />
                  <span>Pin Notice</span>
                  <small>Appears at top of notice list</small>
                </div>
              </label>

              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={formData.notifySubscribers}
                  onChange={(e) =>
                    handleFormChange("notifySubscribers", e.target.checked)
                  }
                />
                <span className="toggle-slider"></span>
                <div className="toggle-label">
                  <Users size={16} />
                  <span>Notify Subscribers</span>
                  <small>
                    Send email notifications to category subscribers
                  </small>
                </div>
              </label>
            </div>
          </div>

          <div className="settings-group">
            <h4>Schedule & Expiry</h4>
            <div className="form-group">
              <label htmlFor="publishDate">Schedule Publish Date</label>
              <input
                type="datetime-local"
                id="publishDate"
                value={
                  formData.publishDate
                    ? new Date(formData.publishDate).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  handleFormChange("publishDate", e.target.value)
                }
              />
              <small>Leave empty to publish immediately</small>
            </div>

            <div className="form-group">
              <label htmlFor="expiryDate">Expiry Date (Optional)</label>
              <input
                type="datetime-local"
                id="expiryDate"
                value={
                  formData.expiryDate
                    ? new Date(formData.expiryDate).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) => handleFormChange("expiryDate", e.target.value)}
              />
              <small>
                Notice will be automatically archived after this date
              </small>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowSettingsModal(false)}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowSettingsModal(false)}
          >
            Save Settings
          </button>
        </div>
      </Modal>

      {/* Version History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Version History"
        size="large"
      >
        <VersionHistory
          versions={versions}
          onRestore={handleRestoreVersion}
          currentVersion={notice?.version}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Notice"
        size="small"
      >
        <div className="delete-modal-content">
          <AlertCircle size={48} className="warning-icon" />
          <p>Are you sure you want to delete this notice?</p>
          <p className="warning-text">
            This action cannot be undone. All data associated with this notice
            will be permanently removed.
          </p>
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button className="btn-danger" onClick={handleDelete}>
              Delete Notice
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditNoticePage;
