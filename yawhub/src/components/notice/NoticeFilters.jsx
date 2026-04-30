// src/components/notice/NoticeFilters.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/components/NoticeFilters.css';

const NoticeFilters = ({ onFilterChange, initialFilters = {}, showAdvanced = false }) => {
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    category: initialFilters.category || 'all',
    sortBy: initialFilters.sortBy || 'newest',
    dateRange: initialFilters.dateRange || 'all',
    priority: initialFilters.priority || 'all',
    hasAttachments: initialFilters.hasAttachments || false
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(showAdvanced);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    // Debounce search input
    const debounceTimer = setTimeout(() => {
      onFilterChange(filters);
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [filters.search]);

  const handleChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    if (name !== 'search') {
      onFilterChange(newFilters);
    }
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      category: 'all',
      sortBy: 'newest',
      dateRange: 'all',
      priority: 'all',
      hasAttachments: false
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const handleClearSearch = () => {
    setFilters(prev => ({ ...prev, search: '' }));
    onFilterChange({ ...filters, search: '' });
  };

  const renderIcon = (iconName) => {
    const icons = {
      search: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
      sort: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      ),
      calendar: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      reset: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 4v6h-6"/>
          <path d="M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
          <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
        </svg>
      ),
      filter: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"/>
        </svg>
      ),
      priority: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      attachment: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L6 9v10h12V2z"/>
          <path d="M13 2v7h7"/>
        </svg>
      ),
      close: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      ),
      chevronDown: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      ),
      chevronUp: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      )
    };
    return icons[iconName];
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  const hasActiveFilters = () => {
    return filters.search !== '' ||
           filters.category !== 'all' ||
           filters.sortBy !== 'newest' ||
           filters.dateRange !== 'all' ||
           filters.priority !== 'all' ||
           filters.hasAttachments !== false;
  };

  return (
    <div className="notice-filters-wrapper">
      <div className="filters-header">
        <h3 className="filters-title">
          {renderIcon('filter')}
          Filters
        </h3>
        {hasActiveFilters() && (
          <button className="reset-all-btn" onClick={handleReset}>
            {renderIcon('reset')}
            Reset All
          </button>
        )}
      </div>

      <div className="filters-grid">
        {/* Search Filter */}
        <div className="filter-group search-group">
          <div className={`search-input-wrapper ${isSearchFocused ? 'focused' : ''}`}>
            <span className="search-icon">{renderIcon('search')}</span>
            <input
              type="text"
              placeholder="Search by title or content..."
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="filter-search"
            />
            {filters.search && (
              <button className="clear-search" onClick={handleClearSearch}>
                {renderIcon('close')}
              </button>
            )}
          </div>
        </div>

        {/* Sort By Filter */}
        <div className="filter-group">
          <label className="filter-label">
            {renderIcon('sort')}
            Sort By
          </label>
          <div className="select-wrapper">
            <select
              value={filters.sortBy}
              onChange={(e) => handleChange('sortBy', e.target.value)}
              className="filter-select"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {renderIcon('chevronDown')}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="filter-group">
          <label className="filter-label">
            {renderIcon('calendar')}
            Date Range
          </label>
          <div className="select-wrapper">
            <select
              value={filters.dateRange}
              onChange={(e) => handleChange('dateRange', e.target.value)}
              className="filter-select"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {renderIcon('chevronDown')}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="filter-group">
          <button 
            className="advanced-toggle"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {renderIcon('filter')}
            Advanced Filters
            {showAdvancedFilters ? renderIcon('chevronUp') : renderIcon('chevronDown')}
          </button>
        </div>
      </div>

      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <div className="advanced-filters">
          <div className="advanced-filters-grid">
            {/* Priority Filter */}
            <div className="filter-group">
              <label className="filter-label">
                {renderIcon('priority')}
                Priority
              </label>
              <div className="select-wrapper">
                <select
                  value={filters.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="filter-select"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {renderIcon('chevronDown')}
              </div>
            </div>

            {/* Attachments Filter */}
            <div className="filter-group">
              <label className="filter-label checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.hasAttachments}
                  onChange={(e) => handleChange('hasAttachments', e.target.checked)}
                />
                {renderIcon('attachment')}
                <span>Has Attachments</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="active-filters">
          <span className="active-filters-label">Active Filters:</span>
          <div className="active-filters-list">
            {filters.search && (
              <span className="active-filter-tag">
                Search: {filters.search}
                <button onClick={() => handleChange('search', '')}>
                  {renderIcon('close')}
                </button>
              </span>
            )}
            {filters.sortBy !== 'newest' && (
              <span className="active-filter-tag">
                Sort: {sortOptions.find(o => o.value === filters.sortBy)?.label}
                <button onClick={() => handleChange('sortBy', 'newest')}>
                  {renderIcon('close')}
                </button>
              </span>
            )}
            {filters.dateRange !== 'all' && (
              <span className="active-filter-tag">
                Date: {dateRangeOptions.find(o => o.value === filters.dateRange)?.label}
                <button onClick={() => handleChange('dateRange', 'all')}>
                  {renderIcon('close')}
                </button>
              </span>
            )}
            {filters.priority !== 'all' && (
              <span className="active-filter-tag">
                Priority: {priorityOptions.find(o => o.value === filters.priority)?.label}
                <button onClick={() => handleChange('priority', 'all')}>
                  {renderIcon('close')}
                </button>
              </span>
            )}
            {filters.hasAttachments && (
              <span className="active-filter-tag">
                Has Attachments
                <button onClick={() => handleChange('hasAttachments', false)}>
                  {renderIcon('close')}
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeFilters;