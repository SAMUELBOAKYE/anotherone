// src/pages/NoticeDetailPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Clock,
  Tag,
  Heart,
  Share2,
  Bookmark,
  MessageCircle,
  Flag,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Download,
  Printer,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  FileText,
  Users,
  Award,
  TrendingUp,
  Zap,
  Bell,
  Mail,
  Twitter,
  Facebook,
  Linkedin,
  Link as LinkIcon,
  X,
  Send,
  ThumbsUp,
  MessageSquare,
  MoreVertical,
} from "lucide-react";
import { noticeService } from "../services/noticeService";
import LoadingSpinner from "../components/common/LoadingSpinner";
import "../styles/components/NoticeDetailPage.css";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};

const formatRelativeTime = (date) => {
  if (!date) return "N/A";
  try {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? "s" : ""} ago`;
    return formatDate(date);
  } catch {
    return "Invalid date";
  }
};

// ============================================================================
// CONSTANTS
// ============================================================================

const REACTION_TYPES = {
  LIKE: "like",
  LOVE: "love",
  CELEBRATE: "celebrate",
  INSIGHTFUL: "insightful",
  CURIOUS: "curious",
};

const REACTION_ICONS = {
  like: { icon: ThumbsUp, label: "Like", color: "blue" },
  love: { icon: Heart, label: "Love", color: "red" },
  celebrate: { icon: Award, label: "Celebrate", color: "yellow" },
  insightful: { icon: TrendingUp, label: "Insightful", color: "green" },
  curious: { icon: Zap, label: "Curious", color: "purple" },
};

// ============================================================================
// ALERT COMPONENT
// ============================================================================

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

// ============================================================================
// MODAL COMPONENT
// ============================================================================

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

// ============================================================================
// COMMENT COMPONENT
// ============================================================================

const Comment = ({
  comment,
  onReply,
  onLike,
  isAuthenticated,
  currentUser,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);

  const handleLike = () => {
    if (!isAuthenticated) return;
    setIsLiked(!isLiked);
    if (onLike) onLike(comment.id);
  };

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText("");
      setShowReplyForm(false);
    }
  };

  return (
    <div className="comment-item">
      <div className="comment-avatar">
        {comment.author?.avatar ? (
          <img src={comment.author.avatar} alt={comment.author.name} />
        ) : (
          <div className="avatar-placeholder">
            {comment.author?.name?.charAt(0) || "U"}
          </div>
        )}
      </div>
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-author">
            {comment.author?.name || "Anonymous"}
          </span>
          <span className="comment-date">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="comment-text">{comment.content}</p>
        <div className="comment-actions">
          <button
            className={`comment-action like-btn ${isLiked ? "liked" : ""}`}
            onClick={handleLike}
          >
            <ThumbsUp size={14} />
            <span>{comment.likes || 0}</span>
          </button>
          {isAuthenticated && (
            <button
              className="comment-action"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <MessageCircle size={14} />
              <span>Reply</span>
            </button>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onLike={onLike}
                isAuthenticated={isAuthenticated}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}

        {showReplyForm && (
          <div className="reply-form">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              className="reply-input"
            />
            <div className="reply-actions">
              <button
                onClick={() => setShowReplyForm(false)}
                className="btn-text"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReply}
                className="btn-primary btn-small"
              >
                Reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMMENT SECTION COMPONENT
// ============================================================================

const CommentSection = ({
  noticeId,
  comments,
  commentsCount,
  onCommentAdded,
  isAuthenticated,
}) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(true);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await noticeService.addComment(noticeId, newComment);
      setNewComment("");
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId, replyText) => {
    try {
      await noticeService.addReply(noticeId, parentId, replyText);
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const handleLike = async (commentId) => {
    try {
      await noticeService.likeComment(noticeId, commentId);
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  return (
    <div className="comment-section">
      <div
        className="comment-section-header"
        onClick={() => setShowComments(!showComments)}
      >
        <h3>
          <MessageCircle size={20} />
          Comments ({commentsCount})
        </h3>
        <button className="toggle-comments">
          <ChevronRight
            size={20}
            style={{
              transform: showComments ? "rotate(90deg)" : "rotate(0deg)",
            }}
          />
        </button>
      </div>

      {showComments && (
        <div className="comment-section-content">
          {isAuthenticated && (
            <div className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="comment-input"
              />
              <div className="comment-form-actions">
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="btn-primary btn-small"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="spinning" />
                  ) : (
                    <Send size={16} />
                  )}
                  Post Comment
                </button>
              </div>
            </div>
          )}

          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments">
                <MessageCircle size={48} />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onLike={handleLike}
                  isAuthenticated={isAuthenticated}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// RELATED NOTICES COMPONENT
// ============================================================================

const RelatedNotices = ({ notices }) => {
  if (!notices || notices.length === 0) return null;

  return (
    <div className="related-notices">
      <h3>Related Notices</h3>
      <div className="related-notices-list">
        {notices.slice(0, 5).map((notice) => (
          <Link
            to={`/notices/${notice.id}`}
            key={notice.id}
            className="related-notice-item"
          >
            <div className="related-notice-icon">
              <FileText size={20} />
            </div>
            <div className="related-notice-content">
              <h4>{notice.title}</h4>
              <div className="related-notice-meta">
                <span>{formatDate(notice.createdAt)}</span>
                <span>•</span>
                <span>{notice.viewCount || 0} views</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// SHARE MODAL COMPONENT
// ============================================================================

const ShareModal = ({ isOpen, onClose, onShare, title, url }) => {
  const [copied, setCopied] = useState(false);

  const shareOptions = [
    { platform: "twitter", icon: Twitter, label: "Twitter", color: "#1DA1F2" },
    {
      platform: "facebook",
      icon: Facebook,
      label: "Facebook",
      color: "#4267B2",
    },
    {
      platform: "linkedin",
      icon: Linkedin,
      label: "LinkedIn",
      color: "#0077B5",
    },
    { platform: "email", icon: Mail, label: "Email", color: "#EA4335" },
    { platform: "copy", icon: LinkIcon, label: "Copy Link", color: "#64748b" },
  ];

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform) => {
    if (platform === "copy") {
      handleCopyLink();
    } else {
      onShare(platform);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Notice" size="small">
      <div className="share-modal-content">
        <p className="share-title">{title}</p>
        <div className="share-options">
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.platform}
                onClick={() => handleShare(option.platform)}
                className="share-option"
                style={{ backgroundColor: option.color }}
              >
                <Icon size={20} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
        {copied && <Alert type="success" message="Link copied to clipboard!" />}
      </div>
    </Modal>
  );
};

// ============================================================================
// MAIN NOTICE DETAIL PAGE COMPONENT
// ============================================================================

const NoticeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // State management
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [relatedNotices, setRelatedNotices] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);

  // Check if ID is valid
  const isValidId =
    id && id !== "create" && id !== "undefined" && id !== "null";

  // Fetch notice data
  useEffect(() => {
    if (isValidId) {
      fetchNotice();
      fetchRelatedNotices();
      fetchComments();
      trackView();
    }
  }, [id, isValidId]);

  // Calculate reading time
  useEffect(() => {
    if (notice?.content) {
      const wordsPerMinute = 200;
      const words = notice.content
        .replace(/<[^>]*>/g, "")
        .trim()
        .split(/\s+/).length;
      const minutes = Math.ceil(words / wordsPerMinute);
      setReadingTime(minutes);
    }
  }, [notice]);

  const fetchNotice = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await noticeService.getNoticeById(id);
      const noticeData = response.data || response;
      setNotice(noticeData);
      setReactions(noticeData.reactions || {});
      setUserReaction(noticeData.userReaction || null);
      setIsBookmarked(noticeData.isBookmarked || false);
      setViewCount(noticeData.viewCount || 0);
      document.title = `${noticeData.title || "Notice"} - University Notices`;
    } catch (err) {
      setError(err.message || "Failed to load notice. Please try again.");
      console.error("Error fetching notice:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedNotices = async () => {
    try {
      const response = await noticeService.getRelatedNotices(id);
      const relatedData = response.data || response || [];
      setRelatedNotices(Array.isArray(relatedData) ? relatedData : []);
    } catch (err) {
      console.error("Error fetching related notices:", err);
      setRelatedNotices([]);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await noticeService.getComments(id);
      const commentsData = response.data?.comments || response.data || [];
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setCommentsCount(commentsData.length || 0);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setComments([]);
      setCommentsCount(0);
    }
  };

  const trackView = async () => {
    try {
      await noticeService.trackNoticeView(id);
    } catch (err) {
      console.error("Error tracking view:", err);
    }
  };

  const handleReaction = async (type) => {
    if (!isAuthenticated) {
      setError("Please log in to react to notices");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const response = await noticeService.addReaction(id, type);
      setReactions(response.data?.reactions || response.reactions || {});
      setUserReaction(
        response.data?.userReaction || response.userReaction || type,
      );
    } catch (err) {
      setError("Failed to add reaction. Please try again.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      setError("Please log in to bookmark notices");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      if (isBookmarked) {
        await noticeService.removeBookmark(id);
        setIsBookmarked(false);
        setSuccess("Notice removed from bookmarks");
      } else {
        await noticeService.addBookmark(id);
        setIsBookmarked(true);
        setSuccess("Notice added to bookmarks");
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update bookmark");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const title = notice?.title || "Check out this notice";

    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this notice: ${url}`)}`;
        break;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const handleDelete = async () => {
    try {
      await noticeService.deleteNotice(id);
      setSuccess("Notice deleted successfully");
      setTimeout(() => {
        navigate("/notices", {
          state: { message: "Notice deleted successfully" },
        });
      }, 1500);
    } catch (err) {
      setError("Failed to delete notice");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      setError("Please provide a reason for reporting");
      return;
    }

    try {
      await noticeService.reportNotice(id, reportReason);
      setSuccess("Notice reported successfully. Our team will review it.");
      setShowReportModal(false);
      setReportReason("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to report notice");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownload = async () => {
    try {
      const response = await noticeService.downloadNotice(id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSuccess("Notice downloaded successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to download notice");
      setTimeout(() => setError(""), 3000);
    }
  };

  const formatReactionCount = useCallback((count) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    return count;
  }, []);

  if (loading) {
    return (
      <div className="notice-detail-page">
        <div className="loading-container">
          <Loader2 size={48} className="spinning" />
          <p>Loading notice...</p>
        </div>
      </div>
    );
  }

  if ((error && !notice) || (!loading && !notice)) {
    return (
      <div className="notice-detail-page">
        <div className="error-container">
          <AlertCircle size={64} className="error-icon" />
          <h2>Notice Not Found</h2>
          <p>
            {error ||
              "The notice you're looking for doesn't exist or has been removed."}
          </p>
          <Link to="/notices" className="back-button">
            <ArrowLeft size={20} />
            Back to Notices
          </Link>
        </div>
      </div>
    );
  }

  if (!notice) return null;

  const totalReactions = Object.values(reactions).reduce(
    (sum, count) => sum + (count || 0),
    0,
  );

  return (
    <div className={`notice-detail-page ${isPrinting ? "printing" : ""}`}>
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb">
          <Link to="/" className="breadcrumb-link">
            Home
          </Link>
          <ChevronRight size={16} />
          <Link to="/notices" className="breadcrumb-link">
            Notices
          </Link>
          <ChevronRight size={16} />
          <span className="breadcrumb-current">{notice.title}</span>
        </nav>

        {/* Alerts */}
        {success && (
          <Alert
            type="success"
            message={success}
            dismissible
            onClose={() => setSuccess("")}
            icon={<CheckCircle size={18} />}
          />
        )}
        {error && (
          <Alert
            type="error"
            message={error}
            dismissible
            onClose={() => setError("")}
            icon={<AlertCircle size={18} />}
          />
        )}

        {/* Main Content */}
        <div className="notice-content-wrapper">
          <div className="notice-main">
            {/* Notice Header */}
            <div className="notice-header">
              <div className="notice-category">
                <Tag size={16} />
                <span
                  className={`category-badge ${notice.category || "general"}`}
                >
                  {notice.category
                    ? notice.category.charAt(0).toUpperCase() +
                      notice.category.slice(1)
                    : "General"}
                </span>
              </div>

              <h1 className="notice-title">{notice.title}</h1>

              <div className="notice-meta">
                <div className="meta-item">
                  <User size={16} />
                  <span>{notice.author?.name || "Administrator"}</span>
                </div>
                <div className="meta-item">
                  <Calendar size={16} />
                  <span>{formatDate(notice.createdAt)}</span>
                </div>
                <div className="meta-item">
                  <Clock size={16} />
                  <span>{readingTime} min read</span>
                </div>
                <div className="meta-item">
                  <Eye size={16} />
                  <span>{viewCount.toLocaleString()} views</span>
                </div>
                {notice.expiryDate && (
                  <div className="meta-item warning">
                    <AlertCircle size={16} />
                    <span>
                      Expires: {formatRelativeTime(notice.expiryDate)}
                    </span>
                  </div>
                )}
              </div>

              <div className="notice-actions">
                <button
                  className={`action-btn ${isBookmarked ? "active" : ""}`}
                  onClick={handleBookmark}
                >
                  <Bookmark size={18} />
                  <span>{isBookmarked ? "Saved" : "Save"}</span>
                </button>
                <button
                  className="action-btn"
                  onClick={() => setShowShareModal(true)}
                >
                  <Share2 size={18} />
                  <span>Share</span>
                </button>
                <button className="action-btn" onClick={handlePrint}>
                  <Printer size={18} />
                  <span>Print</span>
                </button>
                <button className="action-btn" onClick={handleDownload}>
                  <Download size={18} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Featured Image */}
            {notice.featuredImage && (
              <div className="notice-featured-image">
                <img src={notice.featuredImage} alt={notice.title} />
              </div>
            )}

            {/* Notice Content */}
            <div className="notice-content">
              {notice.summary && (
                <div className="notice-summary">
                  <FileText size={20} />
                  <p>{notice.summary}</p>
                </div>
              )}

              <div
                className="notice-body"
                dangerouslySetInnerHTML={{ __html: notice.content }}
              />

              {/* Attachments */}
              {notice.attachments && notice.attachments.length > 0 && (
                <div className="notice-attachments">
                  <h3>Attachments</h3>
                  <div className="attachments-list">
                    {notice.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        className="attachment-item"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText size={20} />
                        <span>{attachment.name}</span>
                        <span className="attachment-size">
                          {attachment.size}
                        </span>
                        <ExternalLink size={16} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {notice.tags && notice.tags.length > 0 && (
                <div className="notice-tags">
                  <h3>Tags</h3>
                  <div className="tags-list">
                    {notice.tags.map((tag, index) => (
                      <Link
                        key={index}
                        to={`/notices?tag=${tag}`}
                        className="tag"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reactions Section */}
            <div className="reactions-section">
              <div className="reactions-header">
                <h3>What do you think?</h3>
                {totalReactions > 0 && (
                  <span className="reactions-count">
                    {totalReactions} reactions
                  </span>
                )}
              </div>
              <div className="reactions-buttons">
                {Object.entries(REACTION_ICONS).map(([type, config]) => {
                  const Icon = config.icon;
                  const count = reactions[type] || 0;
                  const isActive = userReaction === type;
                  return (
                    <button
                      key={type}
                      className={`reaction-btn ${isActive ? "active" : ""}`}
                      onClick={() => handleReaction(type)}
                    >
                      <Icon size={20} />
                      <span>{config.label}</span>
                      {count > 0 && (
                        <span className="reaction-count">
                          {formatReactionCount(count)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Section */}
            <CommentSection
              noticeId={id}
              comments={comments}
              commentsCount={commentsCount}
              onCommentAdded={fetchComments}
              isAuthenticated={isAuthenticated}
            />
          </div>

          {/* Sidebar */}
          <div className="notice-sidebar">
            {/* Author Info */}
            <div className="sidebar-card author-card">
              <h3>About the Author</h3>
              <div className="author-info">
                <div className="author-avatar">
                  {notice.author?.avatar ? (
                    <img src={notice.author.avatar} alt={notice.author.name} />
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <div className="author-details">
                  <h4>{notice.author?.name || "Administrator"}</h4>
                  <p>{notice.author?.role || "University Admin"}</p>
                  {notice.author?.department && (
                    <p className="author-dept">{notice.author.department}</p>
                  )}
                </div>
              </div>
              {notice.author?.bio && (
                <p className="author-bio">{notice.author.bio}</p>
              )}
            </div>

            {/* Notice Stats */}
            <div className="sidebar-card stats-card">
              <h3>Notice Statistics</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <Eye size={16} />
                  <span>Views</span>
                  <strong>{viewCount.toLocaleString()}</strong>
                </div>
                <div className="stat-item">
                  <MessageCircle size={16} />
                  <span>Comments</span>
                  <strong>{commentsCount}</strong>
                </div>
                <div className="stat-item">
                  <Heart size={16} />
                  <span>Reactions</span>
                  <strong>{totalReactions}</strong>
                </div>
                <div className="stat-item">
                  <Bookmark size={16} />
                  <span>Saves</span>
                  <strong>{notice.saveCount || 0}</strong>
                </div>
              </div>
            </div>

            {/* Related Notices */}
            {relatedNotices.length > 0 && (
              <RelatedNotices notices={relatedNotices} />
            )}

            {/* Admin Actions */}
            {isAuthenticated && user?.role === "admin" && (
              <div className="sidebar-card admin-card">
                <h3>Admin Actions</h3>
                <div className="admin-actions">
                  <Link to={`/notices/edit/${id}`} className="admin-btn edit">
                    <Edit size={16} />
                    Edit Notice
                  </Link>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="admin-btn delete"
                  >
                    <Trash2 size={16} />
                    Delete Notice
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="admin-btn report"
                  >
                    <Flag size={16} />
                    Report Issue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleShare}
        title={notice.title}
        url={window.location.href}
      />

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
          <p className="warning-text">This action cannot be undone.</p>
          <div className="modal-actions">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleDelete} className="btn-danger">
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Notice"
        size="medium"
      >
        <div className="report-modal-content">
          <p>Please provide a reason for reporting this notice:</p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Describe the issue with this notice..."
            rows={5}
            className="report-textarea"
          />
          <div className="modal-actions">
            <button
              onClick={() => setShowReportModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleReport} className="btn-primary">
              Submit Report
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NoticeDetailPage;
