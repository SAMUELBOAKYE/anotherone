// src/components/notice/NoticeCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import '../../styles/components/NoticeCard.css';

const NoticeCard = ({ notice, variant = 'default', onPin, onArchive, onDelete, isAdmin = false }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

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

  const getPriorityIcon = (priority) => {
    const priorities = {
      'high': (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      'medium': (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
        </svg>
      ),
      'low': (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      )
    };
    return priorities[priority] || null;
  };

  const renderIcon = (iconName) => {
    const icons = {
      academic: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      ),
      administrative: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      event: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
      urgent: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4"/>
          <path d="M12 17h.01"/>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
        </svg>
      ),
      exam: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L6 9v10h12V2z"/>
          <path d="M13 2v7h7"/>
        </svg>
      ),
      pin: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 17v5M5 17h14v-1c0-2-1-4-4-4h-6c-3 0-4 2-4 4v1z"/>
          <path d="M8 12h8"/>
          <circle cx="12" cy="8" r="4"/>
        </svg>
      ),
      archive: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16v2H4z"/>
          <rect x="6" y="8" width="12" height="12" rx="1"/>
          <line x1="10" y1="11" x2="14" y2="11"/>
        </svg>
      ),
      delete: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
          <path d="M8 6V4h8v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      ),
      edit: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 3l4 4-7 7H10v-4l7-7z"/>
          <path d="M4 20h16"/>
        </svg>
      )
    };
    return icons[iconName] || icons.announcement;
  };

  const categoryConfig = getCategoryConfig(notice.category);
  const isPinned = notice.isPinned || false;
  const priorityIcon = getPriorityIcon(notice.priority);

  const handleCardClick = (e) => {
    // Don't navigate if clicking on action buttons
    if (e.target.closest('.notice-actions')) {
      return;
    }
    navigate(`/notices/${notice._id}`);
  };

  const handlePinClick = (e) => {
    e.stopPropagation();
    if (onPin) onPin(notice._id);
  };

  const handleArchiveClick = (e) => {
    e.stopPropagation();
    if (onArchive) onArchive(notice._id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete && window.confirm('Are you sure you want to delete this notice?')) {
      onDelete(notice._id);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    navigate(`/notices/edit/${notice._id}`);
  };

  return (
    <div 
      className={`notice-card ${categoryConfig.class} ${variant === 'compact' ? 'notice-card-compact' : ''} ${isPinned ? 'pinned' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isPinned && (
        <div className="notice-pin-badge">
          {renderIcon('pin')}
          <span>Pinned</span>
        </div>
      )}
      
      <div className="notice-header">
        <div className="notice-category-wrapper">
          <span className={`notice-category ${categoryConfig.class}`}>
            {renderIcon(categoryConfig.icon)}
            {categoryConfig.label}
          </span>
          {priorityIcon && (
            <span className={`notice-priority priority-${notice.priority}`}>
              {priorityIcon}
              {notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)}
            </span>
          )}
        </div>
        
        {isAdmin && (
          <div className="notice-actions" onClick={(e) => e.stopPropagation()}>
            <button 
              className="notice-action-btn" 
              onClick={handleEditClick}
              aria-label="Edit notice"
            >
              {renderIcon('edit')}
            </button>
            {onPin && (
              <button 
                className={`notice-action-btn ${isPinned ? 'active' : ''}`}
                onClick={handlePinClick}
                aria-label={isPinned ? 'Unpin notice' : 'Pin notice'}
              >
                {renderIcon('pin')}
              </button>
            )}
            {onArchive && (
              <button 
                className="notice-action-btn"
                onClick={handleArchiveClick}
                aria-label="Archive notice"
              >
                {renderIcon('archive')}
              </button>
            )}
            {onDelete && (
              <button 
                className="notice-action-btn delete-btn"
                onClick={handleDeleteClick}
                aria-label="Delete notice"
              >
                {renderIcon('delete')}
              </button>
            )}
          </div>
        )}
      </div>
      
      <h3 className="notice-title">
        {notice.title}
        {notice.isNew && <span className="new-badge">New</span>}
      </h3>
      
      <div className="notice-meta">
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
      
      <p className="notice-excerpt">
        {notice.content?.length > (variant === 'compact' ? 100 : 150)
          ? `${notice.content.substring(0, variant === 'compact' ? 100 : 150)}...`
          : notice.content}
      </p>
      
      {(notice.attachments?.length > 0 || notice.expiryDate) && (
        <div className="notice-footer">
          {notice.attachments?.length > 0 && (
            <div className="notice-attachments-badge">
              {renderIcon('attachment')}
              {notice.attachments.length} attachment(s)
            </div>
          )}
          {notice.expiryDate && new Date(notice.expiryDate) < new Date() && (
            <div className="notice-expired-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Expired
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NoticeCard;