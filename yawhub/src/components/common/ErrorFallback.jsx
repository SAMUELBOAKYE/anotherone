// src/components/common/ErrorFallback.jsx
import React from "react";
import "../../styles/components/ErrorFallback.css";

const ErrorFallback = ({
  error,
  resetErrorBoundary,
  componentName = "component",
}) => {
  const handleCopyError = async () => {
    const errorText = `
Error: ${error?.message}
Stack: ${error?.stack}
Component: ${componentName}
Time: ${new Date().toISOString()}
    `;

    try {
      await navigator.clipboard.writeText(errorText);
      // Show temporary feedback
      const btn = document.activeElement;
      const originalText = btn?.textContent;
      if (btn) {
        btn.textContent = "✓ Copied!";
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to copy error:", err);
    }
  };

  const handleReload = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="error-fallback">
      <div className="error-fallback__container">
        {/* Icon */}
        <div className="error-fallback__icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 8V12M12 16H12.01M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Title and Message */}
        <h2 className="error-fallback__title">Component Error</h2>
        <p className="error-fallback__message">
          Something went wrong while loading this {componentName}. Please try
          refreshing the page or go back to the homepage.
        </p>

        {/* Actions */}
        <div className="error-fallback__actions">
          <button
            className="error-fallback__btn error-fallback__btn--primary"
            onClick={handleReload}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
            </svg>
            Try Again
          </button>

          <button
            className="error-fallback__btn error-fallback__btn--secondary"
            onClick={handleGoHome}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-7H9v7H5a2 2 0 0 1-2-2z" />
            </svg>
            Go Home
          </button>

          <button
            className="error-fallback__btn error-fallback__btn--danger"
            onClick={handleCopyError}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy Error
          </button>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === "development" && error && (
          <details className="error-fallback__details">
            <summary>Technical Details</summary>
            <div className="error-details">
              <div className="error-detail">
                <strong>Error Message:</strong>
                <code>{error.message}</code>
              </div>
              {error.stack && (
                <div className="error-detail">
                  <strong>Stack Trace:</strong>
                  <pre>{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;
