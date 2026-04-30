// src/components/common/LoadingSpinner.jsx
import React from 'react';
import '../../styles/components/loadingSpinner.css';

const LoadingSpinner = ({ 
  fullScreen = false, 
  size = 'medium',
  text = 'Loading...',
  variant = 'primary',
  overlay = false
}) => {
  const spinnerSize = {
    small: {
      width: '24px',
      height: '24px',
      borderWidth: '2px'
    },
    medium: {
      width: '48px',
      height: '48px',
      borderWidth: '3px'
    },
    large: {
      width: '72px',
      height: '72px',
      borderWidth: '4px'
    }
  };

  const spinnerVariants = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    light: '#f1f5f9',
    dark: '#1e293b'
  };

  const spinner = (
    <div className="spinner-container">
      <div 
        className="spinner" 
        style={{ 
          width: spinnerSize[size].width,
          height: spinnerSize[size].height,
          borderWidth: spinnerSize[size].borderWidth,
          borderTopColor: spinnerVariants[variant]
        }}
      >
        {/* Optional inner dots for enhanced spinner */}
        <div className="spinner-inner-dot"></div>
        <div className="spinner-inner-dot-delayed"></div>
      </div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fullscreen-spinner ${overlay ? 'with-overlay' : ''}`}>
        {spinner}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="overlay-spinner">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;