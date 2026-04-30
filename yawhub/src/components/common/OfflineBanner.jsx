// src/components/common/OfflineBanner.jsx
import React, { useState, useEffect } from "react";

const OfflineBanner = ({ queueSize = 0 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [offlineDuration, setOfflineDuration] = useState(0);

  useEffect(() => {
    let interval;
    let startTime = Date.now();

    if (!navigator.onLine) {
      interval = setInterval(() => {
        setOfflineDuration(Date.now() - startTime);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "#f59e0b",
        color: "white",
        textAlign: "center",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: "500",
        zIndex: 9999,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <svg
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
        <span>
          <strong>You're offline</strong> {durationText}
        </span>
        {queueSize > 0 && (
          <span
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              padding: "4px 8px",
              borderRadius: "20px",
              fontSize: "12px",
            }}
          >
            {queueSize} pending {queueSize === 1 ? "request" : "requests"}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "12px" }}>
          Changes will sync when you reconnect
        </span>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
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
  );
};

export default OfflineBanner;
