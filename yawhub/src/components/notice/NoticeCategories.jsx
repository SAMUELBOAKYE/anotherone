// src/components/notice/NoticeCategories.jsx
import React from 'react';
import '../../styles/components/NoticeCategories.css';

const NoticeCategories = ({ selectedCategory, onCategorySelect, showCounts = false, categoryCounts = {} }) => {
  const categories = [
    { id: 'all', name: 'All', icon: 'all' },
    { id: 'Academic', name: 'Academic', icon: 'academic' },
    { id: 'Administrative', name: 'Administrative', icon: 'administrative' },
    { id: 'Event', name: 'Events', icon: 'event' },
    { id: 'Announcement', name: 'Announcements', icon: 'announcement' },
    { id: 'Urgent', name: 'Urgent', icon: 'urgent' },
    { id: 'Exam', name: 'Exam', icon: 'exam' }
  ];

  const renderIcon = (iconName) => {
    const icons = {
      all: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
        </svg>
      ),
      academic: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      ),
      administrative: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      event: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
      urgent: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4"/>
          <path d="M12 17h.01"/>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
        </svg>
      ),
      exam: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      )
    };
    return icons[iconName] || icons.all;
  };

  return (
    <div className="notice-categories-wrapper">
      <div className="categories-header">
        <h3 className="categories-title">
          {renderIcon('all')}
          Categories
        </h3>
        <div className="categories-divider"></div>
      </div>
      
      <div className="notice-categories">
        {categories.map((category) => {
          const count = categoryCounts[category.id] || 0;
          const isActive = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              className={`category-btn ${isActive ? 'active' : ''}`}
              onClick={() => onCategorySelect(category.id)}
              aria-label={`Filter by ${category.name}`}
            >
              <span className="category-icon-wrapper">
                <span className="category-icon">{renderIcon(category.icon)}</span>
                {isActive && <span className="category-active-indicator"></span>}
              </span>
              <span className="category-info">
                <span className="category-name">{category.name}</span>
                {showCounts && count > 0 && (
                  <span className="category-count">{count}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NoticeCategories;