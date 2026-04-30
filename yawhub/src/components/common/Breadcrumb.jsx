// src/components/common/Breadcrumb.jsx
import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/components/Breadcrumb.css";

const Breadcrumb = ({
  customLabels = {},
  homeLabel = "Home",
  separator = "chevron",
  showHomeIcon = true,
  showBackButton = false,
  maxItems = 5,
  className = "",
  onNavigate,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const breadcrumbs = useMemo(() => {
    const pathnames = location.pathname.split("/").filter((x) => x);
    const items = [];

    // Add home as first item
    items.push({
      name: homeLabel,
      path: "/",
      isLast: pathnames.length === 0,
      isHome: true,
    });

    // Build path items
    let currentPath = "";
    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      const isLast = index === pathnames.length - 1;

      items.push({
        name: customLabels[name] || getDisplayName(name),
        path: currentPath,
        isLast,
        isHome: false,
        originalName: name,
      });
    });

    return items;
  }, [location.pathname, customLabels, homeLabel]);

  const getDisplayName = (name) => {
    // Handle special cases
    const specialCases = {
      dashboard: "Dashboard",
      settings: "Settings",
      profile: "Profile",
      admin: "Admin Panel",
      users: "Users",
      products: "Products",
      orders: "Orders",
      analytics: "Analytics",
      notices: "Notices",
      events: "Events",
      registrations: "Registrations",
      help: "Help Center",
      faq: "FAQ",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    };

    if (specialCases[name.toLowerCase()]) {
      return specialCases[name.toLowerCase()];
    }

    // Convert kebab-case to Title Case
    const words = name.split(/[-_]/);
    const formatted = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    return formatted;
  };

  const handleBack = () => {
    navigate(-1);
    if (onNavigate) onNavigate(-1);
  };

  const handleNavigate = (path) => {
    if (onNavigate) onNavigate(path);
  };

  const renderSeparator = () => {
    switch (separator) {
      case "chevron":
        return (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        );
      case "slash":
        return <span className="breadcrumb-separator-text">/</span>;
      case "arrow":
        return (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        );
      case "dot":
        return <span className="breadcrumb-separator-dot">•</span>;
      default:
        return (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        );
    }
  };

  const renderHomeIcon = () => (
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
  );

  // Truncate breadcrumbs if needed
  const displayBreadcrumbs = useMemo(() => {
    if (breadcrumbs.length <= maxItems) return breadcrumbs;

    const first = breadcrumbs[0];
    const last = breadcrumbs[breadcrumbs.length - 1];
    const middle = breadcrumbs.slice(1, -1);
    const truncated = middle.slice(-(maxItems - 2));

    return [
      first,
      ...(middle.length > truncated.length ? [{ isEllipsis: true }] : []),
      ...truncated,
      last,
    ];
  }, [breadcrumbs, maxItems]);

  if (breadcrumbs.length <= 1 && !showBackButton) return null;

  return (
    <div className={`breadcrumb-container ${className}`}>
      {showBackButton && breadcrumbs.length > 1 && (
        <button
          className="breadcrumb-back"
          onClick={handleBack}
          aria-label="Go back"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back</span>
        </button>
      )}

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          {displayBreadcrumbs.map((item, index) => {
            if (item.isEllipsis) {
              return (
                <li
                  key="ellipsis"
                  className="breadcrumb-item breadcrumb-ellipsis"
                >
                  <span className="breadcrumb-ellipsis-text">...</span>
                  {index < displayBreadcrumbs.length - 1 && (
                    <span className="breadcrumb-separator">
                      {renderSeparator()}
                    </span>
                  )}
                </li>
              );
            }

            return (
              <li key={item.path} className="breadcrumb-item">
                {item.isLast ? (
                  <span className="breadcrumb-current" aria-current="page">
                    {item.isHome && showHomeIcon ? renderHomeIcon() : null}
                    {item.isHome && showHomeIcon ? (
                      <span className="breadcrumb-text">{item.name}</span>
                    ) : (
                      item.name
                    )}
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    className="breadcrumb-link"
                    onClick={() => handleNavigate(item.path)}
                  >
                    {item.isHome && showHomeIcon ? renderHomeIcon() : null}
                    {item.isHome && showHomeIcon ? (
                      <span className="breadcrumb-text">{item.name}</span>
                    ) : (
                      item.name
                    )}
                  </Link>
                )}
                {!item.isLast && (
                  <span className="breadcrumb-separator">
                    {renderSeparator()}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
