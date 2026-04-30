// src/components/notice/NoticeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { noticeService } from '../../services/noticeService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import ConfirmDialog from '../common/ConfirmDialog';
import SuccessAlert from '../common/SuccessAlert';
import { formatDate } from '../../utils/formatters';
import '../../styles/components/NoticeDetail.css';

const NoticeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [relatedNotices, setRelatedNotices] = useState([]);
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    fetchNotice();
    fetchRelatedNotices();
    
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    return () => {
      // Cleanup if needed
    };
  }, [id]);

  const fetchNotice = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await noticeService.getNoticeById(id);
      setNotice(response.data);
      
      // Update document title
      document.title = `${response.data.title} - KAAF University Noticeboard`;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedNotices = async () => {
    try {
      const response = await noticeService.getRelatedNotices(id, { limit: 3 });
      setRelatedNotices(response.data);
    } catch (err) {
      console.error('Failed to fetch related notices:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await noticeService.deleteNotice(id);
      setSuccess('Notice deleted successfully!');
      setTimeout(() => {
        navigate('/notices');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete notice');
    }
  };

  const handleShare = async (platform) => {
    const shareUrl = window.location.href;
    const shareTitle = notice.title;
    const shareText = `Check out this notice: ${notice.title}`;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`,
      email: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
    };
    
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setSuccess('Link copied to clipboard!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to copy link');
      }
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getCategoryConfig = (category) => {
    const categories = {
      'Academic': {
        class: 'category-academic',
        icon: 'academic',
        label: 'Academic'
      },
      'Administrative': {
        class: 'category-administrative',
        icon: 'administrative',
        label: 'Administrative'
      },
      'Event': {
        class: 'category-event',
        icon: 'event',
        label: 'Event'
      },
      'Announcement': {
        class: 'category-announcement',
        icon: 'announcement',
        label: 'Announcement'
      },
      'Urgent': {
        class: 'category-urgent',
        icon: 'urgent',
        label: 'Urgent'
      },
      'Exam': {
        class: 'category-exam',
        icon: 'exam',
        label: 'Exam'
      }
    };
    return categories[category] || categories['Announcement'];
  };

  const getPriorityConfig = (priority) => {
    const priorities = {
      'high': { class: 'priority-high', label: 'High Priority' },
      'medium': { class: 'priority-medium', label: 'Medium Priority' },
      'low': { class: 'priority-low', label: 'Low Priority' }
    };
    return priorities[priority] || null;
  };

  const renderIcon = (iconName) => {
    const icons = {
      academic: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      ),
      administrative: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      event: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <circle cx="12" cy="15" r="1"/>
          <circle cx="16" cy="15" r="1"/>
          <circle cx="8" cy="15" r="1"/>
        </svg>
      ),
      announcement: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
      urgent: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4"/>
          <path d="M12 17h.01"/>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
        </svg>
      ),
      exam: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      ),
      calendar: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      user: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      views: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      ),
      attachment: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L6 9v10h12V2z"/>
          <path d="M13 2v7h7"/>
        </svg>
      ),
      download: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      ),
      share: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      ),
      print: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9V2h12v7"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <path d="M6 14h12v8H6z"/>
        </svg>
      ),
      back: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      ),
      edit: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 3l4 4-7 7H10v-4l7-7z"/>
          <path d="M4 20h16"/>
        </svg>
      ),
      delete: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
          <path d="M8 6V4h8v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      )
    };
    return icons[iconName] || icons.announcement;
  };

  const canEdit = user && (user.role === 'admin' || notice?.author?._id === user.id);
  const canDelete = user && user.role === 'admin';
  const categoryConfig = notice ? getCategoryConfig(notice.category) : null;
  const priorityConfig = notice ? getPriorityConfig(notice.priority) : null;

  if (loading) {
    return (
      <div className="notice-detail-loading">
        <LoadingSpinner size="large" text="Loading notice..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="notice-detail-error">
        <ErrorAlert message={error} onClose={() => setError('')} />
        <button className="back-btn" onClick={() => navigate('/notices')}>
          {renderIcon('back')}
          Back to Notices
        </button>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="notice-detail-error">
        <ErrorAlert message="Notice not found" />
        <button className="back-btn" onClick={() => navigate('/notices')}>
          {renderIcon('back')}
          Back to Notices
        </button>
      </div>
    );
  }

  return (
    <div className="notice-detail-wrapper">
      <div className="notice-detail-container">
        {/* Success Alert */}
        {success && (
          <SuccessAlert 
            message={success} 
            onClose={() => setSuccess('')} 
            autoDismiss={true}
            autoDismissTime={3000}
          />
        )}

        {/* Navigation Bar */}
        <div className="notice-detail-nav">
          <button className="nav-back-btn" onClick={() => navigate('/notices')}>
            {renderIcon('back')}
            Back to Notices
          </button>
          <div className="nav-actions">
            <button className="nav-print-btn" onClick={handlePrint}>
              {renderIcon('print')}
              Print
            </button>
            <div className="share-dropdown">
              <button 
                className="nav-share-btn"
                onClick={() => setShowShareOptions(!showShareOptions)}
              >
                {renderIcon('share')}
                Share
              </button>
              {showShareOptions && (
                <div className="share-options">
                  <button onClick={() => handleShare('facebook')}>Facebook</button>
                  <button onClick={() => handleShare('twitter')}>Twitter</button>
                  <button onClick={() => handleShare('linkedin')}>LinkedIn</button>
                  <button onClick={() => handleShare('email')}>Email</button>
                  <button onClick={() => handleShare('copy')}>Copy Link</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <article className="notice-detail">
          {/* Header */}
          <header className="notice-detail-header">
            <div className="notice-badges">
              {categoryConfig && (
                <span className={`notice-category ${categoryConfig.class}`}>
                  {renderIcon(categoryConfig.icon)}
                  {categoryConfig.label}
                </span>
              )}
              {priorityConfig && (
                <span className={`notice-priority ${priorityConfig.class}`}>
                  {priorityConfig.label}
                </span>
              )}
              {notice.isPinned && (
                <span className="notice-pinned-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 17v5M5 17h14v-1c0-2-1-4-4-4h-6c-3 0-4 2-4 4v1z"/>
                    <path d="M8 12h8"/>
                    <circle cx="12" cy="8" r="4"/>
                  </svg>
                  Pinned
                </span>
              )}
            </div>
            
            <h1 className="notice-detail-title">{notice.title}</h1>
            
            <div className="notice-detail-meta">
              <div className="meta-left">
                <span className="meta-item">
                  {renderIcon('calendar')}
                  {formatDate(notice.createdAt)}
                </span>
                <span className="meta-item">
                  {renderIcon('user')}
                  {notice.author?.name || 'Administrator'}
                </span>
                <span className="meta-item">
                  {renderIcon('views')}
                  {notice.views || 0} views
                </span>
              </div>
              {notice.updatedAt !== notice.createdAt && (
                <div className="meta-updated">
                  Last updated: {formatDate(notice.updatedAt)}
                </div>
              )}
            </div>
          </header>

          {/* Featured Image (if any) */}
          {notice.featuredImage && (
            <div className="notice-featured-image">
              <img src={notice.featuredImage} alt={notice.title} />
            </div>
          )}

          {/* Content */}
          <div className="notice-content" dangerouslySetInnerHTML={{ __html: notice.content }} />

          {/* Attachments */}
          {notice.attachments?.length > 0 && (
            <div className="notice-attachments">
              <h3>
                {renderIcon('attachment')}
                Attachments ({notice.attachments.length})
              </h3>
              <ul className="attachments-list">
                {notice.attachments.map((attachment, index) => (
                  <li key={index}>
                    <a href={attachment.url} download className="attachment-link">
                      {renderIcon('download')}
                      <span>{attachment.name}</span>
                      {attachment.size && (
                        <small>({(attachment.size / 1024).toFixed(2)} KB)</small>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
      {(canEdit || canDelete) && (
        <div className="notice-action-buttons">
              {canEdit && (
                <button 
                  className="action-btn edit-btn"
                  onClick={() => navigate(`/notices/edit/${id}`)}
                >
                  {renderIcon('edit')}
                  Edit Notice
                </button>
              )}
              {canDelete && (
                <button 
                  className="action-btn delete-btn"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  {renderIcon('delete')}
                  Delete Notice
                </button>
              )}
            </div>
          )}
        </article>

        {/* Related Notices */}
        {relatedNotices.length > 0 && (
          <div className="related-notices">
            <h3>Related Notices</h3>
            <div className="related-notices-grid">
              {relatedNotices.map(related => (
                <Link 
                  key={related._id} 
                  to={`/notices/${related._id}`}
                  className="related-notice-card"
                >
                  <h4>{related.title}</h4>
                  <span className="related-date">{formatDate(related.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete Notice"
          message="Are you sure you want to delete this notice? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </div>
  );
};

export default NoticeDetail;