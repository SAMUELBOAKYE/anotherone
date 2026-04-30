// src/components/common/ConfirmDialog.jsx
import React, { useEffect, useCallback } from 'react';
import '../../styles/components/ConfirmDialog.css';

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'primary',
  confirmButtonVariant = 'primary',
  cancelButtonVariant = 'secondary',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  loading = false,
  destructive = false
}) => {
  
  const handleOverlayClick = useCallback((e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onCancel();
    }
  }, [closeOnOverlayClick, onCancel]);

  const handleEscapeKey = useCallback((e) => {
    if (closeOnEscape && e.key === 'Escape' && isOpen) {
      onCancel();
    }
  }, [closeOnEscape, isOpen, onCancel]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  const getConfirmButtonClass = () => {
    if (destructive) return 'dialog-btn confirm-btn destructive';
    if (confirmButtonVariant === 'primary') return 'dialog-btn confirm-btn primary';
    if (confirmButtonVariant === 'success') return 'dialog-btn confirm-btn success';
    if (confirmButtonVariant === 'danger') return 'dialog-btn confirm-btn danger';
    return 'dialog-btn confirm-btn primary';
  };

  const getCancelButtonClass = () => {
    if (cancelButtonVariant === 'secondary') return 'dialog-btn cancel-btn secondary';
    if (cancelButtonVariant === 'outline') return 'dialog-btn cancel-btn outline';
    return 'dialog-btn cancel-btn secondary';
  };

  const renderIcon = () => {
    if (type === 'danger') {
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      );
    }
    if (type === 'warning') {
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 9v4"/>
          <path d="M12 17h.01"/>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
        </svg>
      );
    }
    if (type === 'success') {
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12l3 3 6-6"/>
        </svg>
      );
    }
    if (type === 'info') {
      return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-container" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        {showCloseButton && (
          <button className="dialog-close" onClick={onCancel} aria-label="Close dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        
        {type !== 'none' && (
          <div className={`dialog-icon ${type}`}>
            {renderIcon()}
          </div>
        )}
        
        <div className="dialog-header">
          <h3 id="dialog-title">{title}</h3>
        </div>
        
        <div className="dialog-body">
          <p>{message}</p>
        </div>
        
        <div className="dialog-footer">
          <button 
            className={getCancelButtonClass()} 
            onClick={onCancel}
            disabled={loading}
            autoFocus={false}
          >
            {cancelText}
          </button>
          <button 
            className={getConfirmButtonClass()} 
            onClick={onConfirm}
            disabled={loading}
            autoFocus={true}
          >
            {loading ? (
              <>
                <svg className="button-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a10 10 0 1 0 10 10"/>
                </svg>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;