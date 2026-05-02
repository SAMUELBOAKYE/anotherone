// src/components/layout/MainLayout.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import Sidebar from "../common/Sidebar";
import LoadingSpinner from "../common/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/components/MainLayout.css";

const MainLayout = ({
  requireAuth = false,
  showSidebar = false,
  showNavbar = true,
  showFooter = true,
  maxWidth = "1200px",
  padding = true,
  className = "",
  // Mobile-specific props
  enablePullToRefresh = false,
  enableSwipeBack = false,
  bottomNavHeight = 70,
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const mainContentRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isPullToRefreshing, setIsPullToRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullOffset, setPullOffset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // ========================================
  // DEVICE DETECTION & RESPONSIVE SETUP
  // ========================================
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
      setIsLandscape(width > height);
      setViewportHeight(height);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    window.addEventListener("orientationchange", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("orientationchange", checkDevice);
    };
  }, []);

  // ========================================
  // HANDLE SAFE AREA INSETS FOR NOTCH DEVICES
  // ========================================
  useEffect(() => {
    // Add safe area CSS variables
    const setSafeAreaVariables = () => {
      const isIphone = /iPhone/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      if (isIphone) {
        document.documentElement.style.setProperty(
          "--safe-area-top",
          "env(safe-area-inset-top)",
        );
        document.documentElement.style.setProperty(
          "--safe-area-bottom",
          "env(safe-area-inset-bottom)",
        );
      }

      if (isAndroid) {
        // Android devices with notches
        const hasNotch = window.screen.height > 800;
        if (hasNotch) {
          document.documentElement.style.setProperty("--safe-area-top", "32px");
          document.documentElement.style.setProperty(
            "--safe-area-bottom",
            "24px",
          );
        }
      }
    };

    setSafeAreaVariables();
  }, []);

  // ========================================
  // AUTHENTICATION HANDLING
  // ========================================
  useEffect(() => {
    if (requireAuth && !authLoading && !user) {
      navigate("/login", {
        state: { from: location.pathname },
        replace: true,
      });
    }
  }, [requireAuth, authLoading, user, navigate, location]);

  // ========================================
  // PAGE TRANSITIONS
  // ========================================
  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // ========================================
  // SCROLL TO TOP ON ROUTE CHANGE
  // ========================================
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // ========================================
  // PULL TO REFRESH HANDLER
  // ========================================
  const handleTouchStart = useCallback(
    (e) => {
      if (!enablePullToRefresh) return;
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      setPullStartY(e.touches[0].clientY);
    },
    [enablePullToRefresh],
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!enablePullToRefresh || isPullToRefreshing) return;

      const currentY = e.touches[0].clientY;
      const scrollTop = mainContentRef.current?.scrollTop || window.scrollY;

      // Only trigger pull to refresh when at the top
      if (scrollTop === 0 && currentY > touchStartRef.current.y) {
        const pullDistance = currentY - touchStartRef.current.y;
        if (pullDistance > 0 && pullDistance < 100) {
          setPullOffset(pullDistance);
          if (pullDistance > 60) {
            setIsPullToRefreshing(true);
          }
        }
      }
    },
    [enablePullToRefresh, isPullToRefreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!enablePullToRefresh) return;

    if (isPullToRefreshing) {
      // Trigger refresh
      window.dispatchEvent(new CustomEvent("pull-to-refresh"));
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsPullToRefreshing(false);
    }
    setPullOffset(0);
    setPullStartY(0);
  }, [enablePullToRefresh, isPullToRefreshing]);

  // ========================================
  // SWIPE TO GO BACK (iOS-style)
  // ========================================
  const handleSwipeBack = useCallback(
    (e) => {
      if (!enableSwipeBack || !isMobile) return;

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };

      const deltaX = touchEnd.x - touchStartRef.current.x;
      const deltaY = touchEnd.y - touchStartRef.current.y;

      // Swipe from left edge to right
      if (
        touchStartRef.current.x < 50 &&
        deltaX > 50 &&
        Math.abs(deltaY) < 100
      ) {
        navigate(-1);
      }
    },
    [enableSwipeBack, isMobile, navigate],
  );

  // ========================================
  // ADD TOUCH EVENT LISTENERS
  // ========================================
  useEffect(() => {
    if ((enablePullToRefresh || enableSwipeBack) && isMobile) {
      const element = mainContentRef.current || window;
      element.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      element.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      element.addEventListener("touchend", handleTouchEnd);
      element.addEventListener("touchend", handleSwipeBack);

      return () => {
        element.removeEventListener("touchstart", handleTouchStart);
        element.removeEventListener("touchmove", handleTouchMove);
        element.removeEventListener("touchend", handleTouchEnd);
        element.removeEventListener("touchend", handleSwipeBack);
      };
    }
  }, [
    enablePullToRefresh,
    enableSwipeBack,
    isMobile,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleSwipeBack,
  ]);

  // ========================================
  // SET BODY CLASSES FOR MOBILE
  // ========================================
  useEffect(() => {
    if (isMobile) {
      document.body.classList.add("mobile-view");
    } else {
      document.body.classList.remove("mobile-view");
    }

    if (isTablet) {
      document.body.classList.add("tablet-view");
    } else {
      document.body.classList.remove("tablet-view");
    }

    if (isLandscape) {
      document.body.classList.add("landscape-mode");
    } else {
      document.body.classList.remove("landscape-mode");
    }

    return () => {
      document.body.classList.remove(
        "mobile-view",
        "tablet-view",
        "landscape-mode",
      );
    };
  }, [isMobile, isTablet, isLandscape]);

  // Show loading spinner while checking auth
  if (requireAuth && authLoading) {
    return (
      <div className="main-layout-loading">
        <LoadingSpinner fullScreen text="Checking authentication..." />
      </div>
    );
  }

  // Redirect if authentication required but no user
  if (requireAuth && !user) {
    return null; // Will redirect in useEffect
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Calculate dynamic max width based on device
  const getDynamicMaxWidth = () => {
    if (maxWidth !== "1200px") return maxWidth;
    if (isMobile) return "100%";
    if (isTablet) return "90%";
    return maxWidth;
  };

  return (
    <div
      className={`main-layout ${className} ${isMobile ? "mobile-layout" : ""} ${isTablet ? "tablet-layout" : ""} ${isLandscape ? "landscape-layout" : ""}`}
    >
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Pull to Refresh Indicator */}
      {enablePullToRefresh && isPullToRefreshing && (
        <div
          className="pull-to-refresh-indicator"
          style={{ transform: `translateY(${pullOffset}px)` }}
        >
          <div className="pull-to-refresh-spinner"></div>
          <span className="pull-to-refresh-text">Refreshing...</span>
        </div>
      )}

      {/* Loading Overlay */}
      {isPageLoading && (
        <div className="page-loading-overlay">
          <LoadingSpinner size="medium" text="Loading..." />
        </div>
      )}

      {/* Layout Structure */}
      <div
        className={`layout-container ${showSidebar ? "has-sidebar" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        {/* Sidebar (Desktop & Tablet) */}
        {showSidebar && !isMobile && (
          <aside
            className={`layout-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
          >
            <Sidebar
              onToggle={toggleSidebar}
              isCollapsed={sidebarCollapsed}
              isMobile={isMobile}
            />
          </aside>
        )}

        {/* Mobile Sidebar Drawer */}
        {showSidebar && isMobile && (
          <>
            <div
              className={`mobile-sidebar-overlay ${sidebarCollapsed ? "open" : ""}`}
              onClick={toggleSidebar}
            />
            <aside
              className={`mobile-sidebar-drawer ${sidebarCollapsed ? "open" : ""}`}
            >
              <Sidebar onClose={toggleSidebar} isMobile={isMobile} />
            </aside>
          </>
        )}

        <div className="layout-main">
          {showNavbar && (
            <header
              className={`layout-header ${isMobile ? "mobile-header" : ""} ${isLandscape ? "landscape-header" : ""}`}
            >
              <Navbar />
            </header>
          )}

          <main
            id="main-content"
            ref={mainContentRef}
            className={`layout-content ${!padding ? "no-padding" : ""} ${isMobile ? "mobile-content" : ""} ${enablePullToRefresh ? "pull-to-refresh-enabled" : ""}`}
            style={{
              minHeight: `calc(100vh - ${showNavbar ? (isMobile ? 70 : 80) : 0}px - ${showFooter ? (isMobile ? 60 : 100) : 0}px - ${isMobile ? bottomNavHeight : 0}px)`,
            }}
          >
            <div
              className="content-container"
              style={{
                maxWidth: getDynamicMaxWidth(),
                paddingLeft: isMobile
                  ? "var(--space-md, 16px)"
                  : padding
                    ? "var(--space-xl, 32px)"
                    : 0,
                paddingRight: isMobile
                  ? "var(--space-md, 16px)"
                  : padding
                    ? "var(--space-xl, 32px)"
                    : 0,
              }}
            >
              <Outlet />
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          {isMobile && showFooter && (
            <nav
              className="mobile-bottom-nav"
              style={{ height: bottomNavHeight }}
            >
              <Footer isMobile={true} />
            </nav>
          )}

          {/* Desktop Footer */}
          {!isMobile && showFooter && (
            <footer
              className={`layout-footer ${isMobile ? "mobile-footer" : ""}`}
            >
              <Footer isMobile={false} />
            </footer>
          )}
        </div>
      </div>

      {/* Mobile Menu Button Overlay */}
      {sidebarCollapsed && isMobile && (
        <div className="mobile-menu-overlay" onClick={toggleSidebar} />
      )}
    </div>
  );
};

export default React.memo(MainLayout);
