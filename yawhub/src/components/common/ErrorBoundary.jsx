// src/components/common/ErrorBoundary.jsx
import React from "react";
import "../../styles/components/ErrorBoundary.css";

/**
 * Professional Error Boundary Component
 * @version 3.0.0
 * @description Catches JavaScript errors anywhere in child component tree and displays fallback UI
 */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null,
      isRecovering: false,
    };

    // Bind methods
    this.handleReset = this.handleReset.bind(this);
    this.handleReload = this.handleReload.bind(this);
    this.handleGoHome = this.handleGoHome.bind(this);
    this.handleReportIssue = this.handleReportIssue.bind(this);
    this.handleCopyError = this.handleCopyError.bind(this);
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error,
      errorCount: (prevState) => (prevState?.errorCount || 0) + 1,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error("🚨 Error Boundary Caught an Error:", error, errorInfo);

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to logging service
    this.logErrorToService(error, errorInfo);

    // Track error in analytics
    this.trackErrorInAnalytics(error);

    // Prevent infinite loops
    if (this.state.errorCount >= 5) {
      console.warn("⚠️ Multiple errors detected within short time frame");
      this.setState({ isRecovering: true });
    }
  }

  /**
   * Log error to external monitoring service
   */
  logErrorToService(error, errorInfo) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      },
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      referrer: document.referrer,
    };

    // Send to logging service (Sentry, LogRocket, etc.)
    if (window.Sentry && typeof window.Sentry.captureException === "function") {
      window.Sentry.captureException(error, {
        extra: { componentStack: errorInfo?.componentStack },
      });
    }

    // Store in localStorage for debugging
    try {
      const errorHistory = JSON.parse(
        localStorage.getItem("error_history") || "[]",
      );
      errorHistory.push(errorLog);
      // Keep last 10 errors
      while (errorHistory.length > 10) errorHistory.shift();
      localStorage.setItem("error_history", JSON.stringify(errorHistory));
    } catch (e) {
      console.warn("Failed to store error in localStorage:", e);
    }

    // Call custom logger if provided
    if (this.props.logger) {
      this.props.logger(errorLog);
    }
  }

  /**
   * Track error in analytics
   */
  trackErrorInAnalytics(error) {
    if (window.gtag && typeof window.gtag === "function") {
      window.gtag("event", "exception", {
        description: error?.message,
        fatal: false,
      });
    }

    if (window.fbq && typeof window.fbq === "function") {
      window.fbq("track", "Error", { error_message: error?.message });
    }
  }

  /**
   * Reset error boundary state
   */
  handleReset() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
    });

    // Call reset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  /**
   * Reload the page
   */
  handleReload() {
    if (this.props.onBeforeReload) {
      this.props.onBeforeReload();
    }
    window.location.reload();
  }

  /**
   * Navigate to home page
   */
  handleGoHome() {
    if (this.props.onBeforeGoHome) {
      this.props.onBeforeGoHome();
    }
    window.location.href = "/";
  }

  /**
   * Report issue to support
   */
  handleReportIssue() {
    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Open email client with error details
    const subject = encodeURIComponent(
      `Error Report: ${this.state.error?.message || "Application Error"}`,
    );
    const body = encodeURIComponent(
      `Error Details:\n${JSON.stringify(errorDetails, null, 2)}\n\n` +
        `User Steps:\n${this.props.userSteps || "Not provided"}\n\n` +
        `Browser: ${navigator.userAgent}\n` +
        `URL: ${window.location.href}`,
    );

    window.location.href = `mailto:support@kaaf.edu.gh?subject=${subject}&body=${body}`;
  }

  /**
   * Copy error details to clipboard
   */
  async handleCopyError() {
    const errorText = `
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
URL: ${window.location.href}
Time: ${new Date().toISOString()}
    `;

    try {
      await navigator.clipboard.writeText(errorText);

      // Show success feedback
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
  }

  /**
   * Get error severity level
   */
  getErrorSeverity() {
    const { error } = this.state;
    if (!error) return "low";

    const criticalErrors = ["ChunkLoadError", "TypeError", "ReferenceError"];
    const warningErrors = ["Warning", "DeprecationWarning"];

    if (criticalErrors.some((type) => error.name?.includes(type))) {
      return "critical";
    }
    if (warningErrors.some((type) => error.name?.includes(type))) {
      return "warning";
    }
    return "medium";
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage() {
    const { error } = this.state;
    const severity = this.getErrorSeverity();

    const messages = {
      critical: {
        title: "Critical Error Detected",
        message:
          "The application encountered a critical error and cannot continue. Please refresh the page or contact support.",
      },
      warning: {
        title: "Application Warning",
        message:
          "Something unexpected happened, but you can try to continue or refresh the page.",
      },
      medium: {
        title: "Something Went Wrong",
        message:
          "An error occurred while rendering this section. Please try refreshing the page.",
      },
      low: {
        title: "Temporary Issue",
        message:
          "A minor error occurred. You may be able to continue using the application.",
      },
    };

    // Check for specific error types
    if (error?.message?.includes("Failed to fetch")) {
      return {
        title: "Network Error",
        message:
          "Unable to connect to the server. Please check your internet connection and try again.",
      };
    }

    if (error?.name === "ChunkLoadError") {
      return {
        title: "Update Required",
        message:
          "A new version of the application is available. Please refresh your browser to get the latest updates.",
      };
    }

    if (error?.message?.includes("Permission denied")) {
      return {
        title: "Permission Error",
        message:
          "You don't have permission to perform this action. Please contact your administrator.",
      };
    }

    return messages[severity];
  }

  renderFallbackUI() {
    const { error, errorInfo, isRecovering } = this.state;
    const { title, message } = this.getUserFriendlyMessage();
    const severity = this.getErrorSeverity();
    const {
      showDetails = process.env.NODE_ENV === "development",
      showReportButton = true,
      customFallback = null,
      fallbackProps = {},
    } = this.props;

    // Custom fallback UI if provided
    if (customFallback) {
      return React.cloneElement(customFallback, {
        error,
        errorInfo,
        onReset: this.handleReset,
        onReload: this.handleReload,
        onGoHome: this.handleGoHome,
        ...fallbackProps,
      });
    }

    return (
      <div className={`error-boundary error-boundary--${severity}`}>
        <div className="error-boundary__container">
          {/* Animated Icon */}
          <div className="error-boundary__icon">
            {severity === "critical" ? (
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
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V12M12 16H12.01M3 12C3 13.1819 3.23279 14.3522 3.68508 15.4442C4.13738 16.5361 4.80031 17.5282 5.63604 18.364C6.47177 19.1997 7.46392 19.8626 8.55585 20.3149C9.64778 20.7672 10.8181 21 12 21C13.1819 21 14.3522 20.7672 15.4442 20.3149C16.5361 19.8626 17.5282 19.1997 18.364 18.364C19.1997 17.5282 19.8626 16.5361 20.3149 15.4442C20.7672 14.3522 21 13.1819 21 12C21 9.61305 20.0518 7.32387 18.364 5.63604C16.6761 3.94821 14.3869 3 12 3C9.61305 3 7.32387 3.94821 5.63604 5.63604C3.94821 7.32387 3 9.61305 3 12Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          {/* Title and Message */}
          <h2 className="error-boundary__title">{title}</h2>
          <p className="error-boundary__message">{message}</p>

          {/* Recovery Message */}
          {isRecovering && (
            <div className="error-boundary__recovery">
              <span className="recovery-spinner"></span>
              Attempting to recover...
            </div>
          )}

          {/* Action Buttons */}
          <div className="error-boundary__actions">
            <button
              className="error-boundary__btn error-boundary__btn--primary"
              onClick={this.handleReload}
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
              Refresh Page
            </button>

            <button
              className="error-boundary__btn error-boundary__btn--secondary"
              onClick={this.handleGoHome}
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
              className="error-boundary__btn error-boundary__btn--danger"
              onClick={this.handleReset}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Try to Recover
            </button>
          </div>

          {/* Additional Actions */}
          <div className="error-boundary__additional">
            {showReportButton && (
              <button
                className="error-boundary__link"
                onClick={this.handleReportIssue}
              >
                Report Issue
              </button>
            )}

            <button
              className="error-boundary__link"
              onClick={this.handleCopyError}
            >
              Copy Error Details
            </button>
          </div>

          {/* Error Details (Development Only) */}
          {showDetails && error && (
            <details className="error-boundary__details">
              <summary>Technical Details</summary>
              <div className="error-details-content">
                <div className="error-detail-section">
                  <strong>Error Name:</strong>
                  <code>{error.name}</code>
                </div>
                <div className="error-detail-section">
                  <strong>Error Message:</strong>
                  <code>{error.message}</code>
                </div>
                {error.stack && (
                  <div className="error-detail-section">
                    <strong>Stack Trace:</strong>
                    <pre>{error.stack}</pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div className="error-detail-section">
                    <strong>Component Stack:</strong>
                    <pre>{errorInfo.componentStack}</pre>
                  </div>
                )}
                <div className="error-detail-section">
                  <strong>Environment:</strong>
                  <code>
                    React {React.version} | {process.env.NODE_ENV} |
                    {navigator.userAgent.split(" ").slice(-2).join(" ")}
                  </code>
                </div>
              </div>
            </details>
          )}

          {/* Support Contact */}
          <div className="error-boundary__support">
            <p>
              Need help? Contact our support team at{" "}
              <a href="mailto:support@kaaf.edu.gh">support@kaaf.edu.gh</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

// PropTypes for better documentation
ErrorBoundary.propTypes = {
  children: React.PropTypes.node,
  onError: React.PropTypes.func,
  onReset: React.PropTypes.func,
  onBeforeReload: React.PropTypes.func,
  onBeforeGoHome: React.PropTypes.func,
  logger: React.PropTypes.func,
  showDetails: React.PropTypes.bool,
  showReportButton: React.PropTypes.bool,
  customFallback: React.PropTypes.element,
  fallbackProps: React.PropTypes.object,
  userSteps: React.PropTypes.string,
};

ErrorBoundary.defaultProps = {
  showDetails: process.env.NODE_ENV === "development",
  showReportButton: true,
};

export default ErrorBoundary;
