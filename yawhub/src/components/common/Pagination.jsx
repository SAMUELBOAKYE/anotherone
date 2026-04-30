// src/components/common/Pagination.jsx
import React, { useMemo } from 'react';
import '../../styles/components/Pagination.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  siblingCount = 1,
  boundaryCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  disabled = false,
  size = 'medium',
  variant = 'primary',
  showTotal = true,
  totalItems = 0,
  pageSize = 10,
  itemsPerPageLabel = 'items per page',
  className = ''
}) => {
  
  const range = (start, end) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const getPageNumbers = useMemo(() => {
    const totalPageNumbers = siblingCount * 2 + boundaryCount * 2 + 3;
    
    if (totalPages <= totalPageNumbers) {
      return range(1, totalPages);
    }
    
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    
    const shouldShowLeftDots = leftSiblingIndex > boundaryCount + 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - (boundaryCount + 1);
    
    const leftBoundary = range(1, boundaryCount);
    const rightBoundary = range(totalPages - boundaryCount + 1, totalPages);
    
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftRange = range(1, rightSiblingIndex + 1);
      return [...leftRange, '...', ...rightBoundary];
    }
    
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightRange = range(leftSiblingIndex, totalPages);
      return [...leftBoundary, '...', ...rightRange];
    }
    
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [...leftBoundary, '...', ...middleRange, '...', ...rightBoundary];
    }
    
    return range(1, totalPages);
  }, [currentPage, totalPages, siblingCount, boundaryCount]);

  const handlePageChange = (page) => {
    if (!disabled && page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handleFirstPage = () => handlePageChange(1);
  const handleLastPage = () => handlePageChange(totalPages);
  const handlePrevPage = () => handlePageChange(currentPage - 1);
  const handleNextPage = () => handlePageChange(currentPage + 1);

  const getSizeClass = () => {
    switch(size) {
      case 'small': return 'pagination-small';
      case 'large': return 'pagination-large';
      default: return '';
    }
  };

  const getVariantClass = () => {
    switch(variant) {
      case 'outline': return 'pagination-outline';
      case 'ghost': return 'pagination-ghost';
      default: return '';
    }
  };

  const renderIcon = (type) => {
    const icons = {
      first: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="11 17 6 12 11 7"/>
          <polyline points="18 17 13 12 18 7"/>
        </svg>
      ),
      prev: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      ),
      next: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      ),
      last: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="13 17 18 12 13 7"/>
          <polyline points="6 17 11 12 6 7"/>
        </svg>
      )
    };
    return icons[type];
  };

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`pagination-wrapper ${className}`}>
      {showTotal && totalItems > 0 && (
        <div className="pagination-info">
          Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
          <strong>{totalItems}</strong> {itemsPerPageLabel}
        </div>
      )}
      
      <div className={`pagination ${getSizeClass()} ${getVariantClass()}`}>
        {showFirstLast && (
          <button
            className="pagination-btn pagination-first"
            onClick={handleFirstPage}
            disabled={disabled || currentPage === 1}
            aria-label="First page"
          >
            {renderIcon('first')}
            <span className="pagination-btn-text">First</span>
          </button>
        )}
        
        {showPrevNext && (
          <button
            className="pagination-btn pagination-prev"
            onClick={handlePrevPage}
            disabled={disabled || currentPage === 1}
            aria-label="Previous page"
          >
            {renderIcon('prev')}
            <span className="pagination-btn-text">Prev</span>
          </button>
        )}
        
        <div className="pagination-pages">
          {getPageNumbers.map((pageNumber, index) => (
            <button
              key={`${pageNumber}-${index}`}
              className={`pagination-btn pagination-page ${pageNumber === currentPage ? 'active' : ''}`}
              onClick={() => typeof pageNumber === 'number' && handlePageChange(pageNumber)}
              disabled={disabled || pageNumber === '...'}
              aria-current={pageNumber === currentPage ? 'page' : undefined}
              aria-label={typeof pageNumber === 'number' ? `Page ${pageNumber}` : 'More pages'}
            >
              {pageNumber}
            </button>
          ))}
        </div>
        
        {showPrevNext && (
          <button
            className="pagination-btn pagination-next"
            onClick={handleNextPage}
            disabled={disabled || currentPage === totalPages}
            aria-label="Next page"
          >
            <span className="pagination-btn-text">Next</span>
            {renderIcon('next')}
          </button>
        )}
        
        {showFirstLast && (
          <button
            className="pagination-btn pagination-last"
            onClick={handleLastPage}
            disabled={disabled || currentPage === totalPages}
            aria-label="Last page"
          >
            <span className="pagination-btn-text">Last</span>
            {renderIcon('last')}
          </button>
        )}
      </div>
      
      {totalPages > 0 && (
        <div className="pagination-stats">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
        </div>
      )}
    </div>
  );
};

export default Pagination;