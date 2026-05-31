/**
 * Alert.jsx — World-class alert component
 * Features: mount/exit animations, shimmer sweep, icon pop, progress bar, auto-dismiss
 */
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

/* ─── Inline keyframes injected once ──────────────────────────────────────── */
const KEYFRAMES = `
  @keyframes ax-in {
    from { opacity: 0; transform: translateY(-10px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)     scale(1);    }
  }
  @keyframes ax-out {
    from { opacity: 1; max-height: 200px; transform: scale(1);    padding-block: 14px; }
    to   { opacity: 0; max-height: 0;     transform: scale(0.97); padding-block: 0;    }
  }
  @keyframes ax-shimmer {
    from { background-position: -200% 0; opacity: 1; }
    to   { background-position:  200% 0; opacity: 0; }
  }
  @keyframes ax-bar {
    from { transform: scaleY(0) translateY(-50%); }
    to   { transform: scaleY(1) translateY(0);    }
  }
  @keyframes ax-icon-pop {
    0%   { opacity: 0; transform: scale(0.3) rotate(-15deg); }
    70%  { transform: scale(1.12) rotate(3deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes ax-ring {
    from { opacity: 0.6; transform: scale(0.8); }
    to   { opacity: 0;   transform: scale(1.3); }
  }
  @keyframes ax-body-in {
    from { opacity: 0; transform: translateX(8px); }
    to   { opacity: 1; transform: translateX(0);   }
  }
  @keyframes ax-close-in {
    from { opacity: 0; transform: rotate(45deg) scale(0.4); }
    to   { opacity: 0.45; transform: rotate(0) scale(1); }
  }
  @keyframes ax-progress {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
  }
`;

let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected) return;
  keyframesInjected = true;
  const style = document.createElement("style");
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

/* ─── Variant config ───────────────────────────────────────────────────────── */
const VARIANTS = {
  error: {
    container: "background:#fff8f7; border-color:#ffd5d0; color:#7a1f17;",
    iconWrapper: "background:#fee2df; color:#e84040;",
    bar: "#e84040",
    defaultIcon: "✕",
    defaultTitle: "Error",
  },
  success: {
    container: "background:#f3fdf6; border-color:#bbf0cc; color:#155a28;",
    iconWrapper: "background:#d1fadf; color:#16a34a;",
    bar: "#22c55e",
    defaultIcon: "✓",
    defaultTitle: "Success",
  },
  warning: {
    container: "background:#fffcf3; border-color:#fde89a; color:#7a5000;",
    iconWrapper: "background:#fef3c7; color:#d97706;",
    bar: "#f59e0b",
    defaultIcon: "⚠",
    defaultTitle: "Warning",
  },
  info: {
    container: "background:#f4f9ff; border-color:#bdd7fb; color:#0d3a6e;",
    iconWrapper: "background:#dbeafe; color:#2563eb;",
    bar: "#3b82f6",
    defaultIcon: "i",
    defaultTitle: "Info",
  },
};

/* ─── Alert Component ──────────────────────────────────────────────────────── */
const Alert = ({
  type = "info",
  message,
  title,
  onClose,
  duration,
  dismissible = true,
  className = "",
  icon,
  style: styleProp = {},
}) => {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    injectKeyframes();
  }, []);

  useEffect(() => {
    if (duration && onClose) {
      timerRef.current = setTimeout(handleClose, duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [duration, onClose]);

  if (!message) return null;

  const v = VARIANTS[type] || VARIANTS.info;

  function handleClose() {
    if (exiting) return;
    setExiting(true);
    clearTimeout(timerRef.current);
    setTimeout(() => onClose?.(), 320);
  }

  /* Inline styles — self-contained, no Tailwind required */
  const containerStyle = {
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid transparent",
    overflow: "hidden",
    fontFamily: "'Sora', 'Inter', system-ui, sans-serif",
    animation: exiting
      ? "ax-out 0.32s cubic-bezier(0.55,0,1,0.45) both"
      : "ax-in 0.38s cubic-bezier(0.22,1,0.36,1) both",
    maxHeight: exiting ? "0" : "200px",
    transition: "max-height 0.32s cubic-bezier(0.22,1,0.36,1)",
    marginBottom: exiting ? "0" : undefined,
    ...styleProp,
  };

  const shimmerStyle = {
    content: '""',
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
    backgroundSize: "200% 100%",
    animation: "ax-shimmer 0.9s ease-out 0.1s both",
    pointerEvents: "none",
    zIndex: 2,
  };

  const accentBarStyle = {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "3px",
    borderRadius: "14px 0 0 14px",
    background: v.bar,
    animation: "ax-bar 0.45s cubic-bezier(0.22,1,0.36,1) 0.05s both",
  };

  const iconWrapperStyle = {
    flexShrink: 0,
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    fontWeight: "700",
    animation: "ax-icon-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
    position: "relative",
    zIndex: 1,
    ...parseStyle(v.iconWrapper),
  };

  const ringStyle = {
    position: "absolute",
    inset: "-3px",
    borderRadius: "12px",
    border: `2px solid ${v.bar}`,
    animation: "ax-ring 0.7s ease-out 0.25s both",
    pointerEvents: "none",
  };

  const bodyStyle = {
    flex: 1,
    minWidth: 0,
    animation: "ax-body-in 0.4s ease-out 0.12s both",
    position: "relative",
    zIndex: 1,
  };

  const titleStyle = {
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.01em",
    marginBottom: "2px",
    lineHeight: "1.3",
  };

  const msgStyle = {
    fontSize: "13px",
    fontWeight: "400",
    lineHeight: "1.55",
    opacity: 0.85,
  };

  const closeStyle = {
    flexShrink: 0,
    width: "26px",
    height: "26px",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    opacity: 0.45,
    animation: "ax-close-in 0.35s ease-out 0.2s both",
    position: "relative",
    zIndex: 1,
    color: "inherit",
    transition: "opacity 0.15s, background 0.15s, transform 0.15s",
  };

  const progressStyle = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "2.5px",
    background: "rgba(0,0,0,0.07)",
    borderRadius: "0 0 14px 14px",
    overflow: "hidden",
  };

  const progressBarStyle = {
    height: "100%",
    background: v.bar,
    transformOrigin: "left",
    animation: duration
      ? `ax-progress ${duration}ms linear forwards`
      : undefined,
  };

  return (
    <div
      className={className}
      style={{ ...containerStyle, ...parseStyle(v.container) }}
      role="alert"
      aria-live="polite"
    >
      {/* Shimmer overlay */}
      <div style={shimmerStyle} aria-hidden="true" />

      {/* Left accent bar */}
      <div style={accentBarStyle} aria-hidden="true" />

      {/* Icon */}
      <div style={iconWrapperStyle} aria-hidden="true">
        <div style={ringStyle} />
        {icon ?? v.defaultIcon}
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        {title && <div style={titleStyle}>{title}</div>}
        <div style={msgStyle}>{message}</div>
      </div>

      {/* Close button */}
      {dismissible && onClose && (
        <button
          style={closeStyle}
          onClick={handleClose}
          aria-label="Dismiss alert"
          onMouseEnter={(e) =>
            Object.assign(e.target.style, {
              opacity: "1",
              transform: "scale(1.12)",
              background: "rgba(0,0,0,0.06)",
            })
          }
          onMouseLeave={(e) =>
            Object.assign(e.target.style, {
              opacity: "0.45",
              transform: "scale(1)",
              background: "transparent",
            })
          }
          onMouseDown={(e) => (e.target.style.transform = "scale(0.9)")}
          onMouseUp={(e) => (e.target.style.transform = "scale(1.12)")}
        >
          ✕
        </button>
      )}

      {/* Progress bar */}
      {duration && (
        <div style={progressStyle} aria-hidden="true">
          <div style={progressBarStyle} />
        </div>
      )}
    </div>
  );
};

/** Parse simple "key:value; key:value" style strings into objects */
function parseStyle(str) {
  return Object.fromEntries(
    str
      .split(";")
      .filter(Boolean)
      .map((rule) => {
        const [k, ...v] = rule.split(":");
        const key = k.trim().replace(/-([a-z])/g, (_, l) => l.toUpperCase());
        return [key, v.join(":").trim()];
      }),
  );
}

Alert.propTypes = {
  type: PropTypes.oneOf(["error", "success", "warning", "info"]),
  message: PropTypes.string,
  title: PropTypes.string,
  onClose: PropTypes.func,
  duration: PropTypes.number,
  dismissible: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node,
  style: PropTypes.object,
};

export default Alert;
