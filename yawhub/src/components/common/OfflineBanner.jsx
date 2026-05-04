// src/components/common/OfflineBanner.jsx
import React, { useState, useEffect } from "react";
import "../../styles/components/OfflineBanner.css";

const OfflineBanner = ({ queueSize = 0 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [offlineDuration, setOfflineDuration] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    let interval;
    let startTime = Date.now();

    // Update online status when connection changes
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-dismiss banner after 2 seconds when coming back online
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
      setOfflineDuration(0);
      startTime = Date.now();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      interval = setInterval(() => {
        setOfflineDuration(Date.now() - startTime);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0)
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const durationText =
    offlineDuration > 5000 ? `for ${formatDuration(offlineDuration)}` : "";

  if (!isVisible) return null;

  return (
    <div className={`offline-banner ${isOnline ? "back-online" : ""}`}>
      <div className="offline-banner-content">
        <div className="offline-banner-left">
          <svg
            className="offline-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18.36 6.64A9 9 0 0 1 20.77 15" />
            <path d="M6.16 6.16a9 9 0 1 0 12.68 12.68" />
            <line x1="2" y1="2" x2="22" y2="22" />
            <path d="M15.5 15.5a5 5 0 0 1-7-7" />
          </svg>
          <span className="offline-message">
            <strong>You're offline</strong> {durationText}
          </span>
          {queueSize > 0 && (
            <span className="offline-queue-badge">
              {queueSize} pending {queueSize === 1 ? "request" : "requests"}
            </span>
          )}
        </div>
        <div className="offline-banner-right">
          <span className="offline-sync-message">
            Changes will sync when you reconnect
          </span>
          <button
            onClick={() => setIsVisible(false)}
            className="offline-dismiss-btn"
            aria-label="Dismiss"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;
