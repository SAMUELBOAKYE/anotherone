// src/App.jsx
import React, { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "react-error-boundary";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NotificationProvider from "./context/NotificationContext";
import SocketProvider from "./context/SocketContext";
import LoadingSpinner from "./components/common/LoadingSpinner";
import MainLayout from "./components/layout/MainLayout";
import AuthLayout from "./components/layout/AuthLayout";
import AdminLayout from "./components/layout/AdminLayout";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import OfflineBanner from "./components/common/OfflineBanner";
import TestLogin from "./components/auth/TestLogin";
import StandaloneAdminRegistration from "./components/admin/StandaloneAdminRegistration";
import "./styles/components/App.css";
import "./styles/components/responsive.css";

// ============================================================
// NETWORK STATUS CONTEXT (FALLBACK)
// ============================================================
let NetworkStatusProvider, useNetworkStatus;
try {
  const mod = require("./context/NetworkStatusContext");
  NetworkStatusProvider = mod.NetworkStatusProvider || mod.default;
  useNetworkStatus = mod.useNetworkStatus;
  if (!NetworkStatusProvider || !useNetworkStatus)
    throw new Error("Invalid exports");
} catch {
  console.warn("⚠️ Using fallback NetworkStatusContext");
  const Ctx = React.createContext({ isOnline: true, wasOffline: false });
  NetworkStatusProvider = ({ children }) => {
    const [state, setState] = useState({
      isOnline: navigator.onLine,
      wasOffline: false,
    });
    useEffect(() => {
      const onOnline = () =>
        setState((p) => ({ ...p, isOnline: true, wasOffline: true }));
      const onOffline = () => setState((p) => ({ ...p, isOnline: false }));
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }, []);
    return React.createElement(Ctx.Provider, { value: state }, children);
  };
  useNetworkStatus = () => React.useContext(Ctx);
}

// ============================================================
// LAZY LOADING WITH RETRY
// ============================================================
const lazyWithRetry = (importFn, importPath, maxRetries = 3) =>
  lazy(() => {
    let retries = 0;
    const attempt = () =>
      importFn()
        .then((mod) => {
          if (!mod || typeof mod.default === "undefined")
            throw new Error(`No default export: ${importPath}`);
          return mod;
        })
        .catch((err) => {
          if (retries >= maxRetries - 1) throw err;
          retries++;
          return new Promise((res) =>
            setTimeout(res, 1000 * Math.pow(2, retries)),
          ).then(attempt);
        });
    return attempt();
  });

// ── Public Pages ──────────────────────────────────────────────
const HomePage = lazyWithRetry(() => import("./pages/HomePage"), "HomePage");
const NoticesPage = lazyWithRetry(
  () => import("./pages/NoticesPage"),
  "NoticesPage",
);
const NoticeDetailPage = lazyWithRetry(
  () => import("./pages/NoticeDetailPage"),
  "NoticeDetailPage",
);
const EventsPage = lazyWithRetry(
  () => import("./pages/EventsPage"),
  "EventsPage",
);
const EventDetailPage = lazyWithRetry(
  () => import("./pages/EventDetailPage"),
  "EventDetailPage",
);

// ── Auth Pages ────────────────────────────────────────────────
const ForgotPasswordPage = lazyWithRetry(
  () => import("./pages/ForgotPasswordPage"),
  "ForgotPasswordPage",
);
const ResetPasswordPage = lazyWithRetry(
  () => import("./pages/ResetPasswordPage"),
  "ResetPasswordPage",
);

// ── Info Pages ────────────────────────────────────────────────
const HelpCenterPage = lazyWithRetry(
  () => import("./pages/HelpCenterPage"),
  "HelpCenterPage",
);
const FAQPage = lazyWithRetry(() => import("./pages/FAQPage"), "FAQPage");
const PrivacyPolicyPage = lazyWithRetry(
  () => import("./pages/PrivacyPolicyPage"),
  "PrivacyPolicyPage",
);
const TermsOfServicePage = lazyWithRetry(
  () => import("./pages/TermsOfServicePage"),
  "TermsOfServicePage",
);
const ContactPage = lazyWithRetry(
  () => import("./pages/ContactPage"),
  "ContactPage",
);
const AboutPage = lazyWithRetry(() => import("./pages/AboutPage"), "AboutPage");

// ── Help Article Pages ────────────────────────────────────────
const GettingStartedGuide = lazyWithRetry(
  () => import("./pages/GettingStartedGuide"),
  "GettingStartedGuide",
);
const SecurityTipsPage = lazyWithRetry(
  () => import("./pages/SecurityTipsPage"),
  "SecurityTipsPage",
);
const EventGuidePage = lazyWithRetry(
  () => import("./pages/EventGuidePage"),
  "EventGuidePage",
);
const NotificationsSetupPage = lazyWithRetry(
  () => import("./pages/NotificationsSetupPage"),
  "NotificationsSetupPage",
);
const AccountGuidePage = lazyWithRetry(
  () => import("./pages/AccountGuidePage"),
  "AccountGuidePage",
);
const TroubleshootingPage = lazyWithRetry(
  () => import("./pages/TroubleshootingPage"),
  "TroubleshootingPage",
);

// ── User Pages ─────────────────────────────────────────────────
const DashboardPage = lazyWithRetry(
  () => import("./pages/DashboardPage"),
  "DashboardPage",
);
const ProfilePage = lazyWithRetry(
  () => import("./pages/ProfilePage"),
  "ProfilePage",
);
const SettingsPage = lazyWithRetry(
  () => import("./pages/SettingsPage"),
  "SettingsPage",
);
const NotificationsPage = lazyWithRetry(
  () => import("./pages/NotificationsPage"),
  "NotificationsPage",
);
const MyRegistrationsPage = lazyWithRetry(
  () => import("./pages/MyRegistrationsPage"),
  "MyRegistrationsPage",
);
const RegisterForEventPage = lazyWithRetry(
  () => import("./pages/RegisterForEventPage"),
  "RegisterForEventPage",
);

// ── Admin Pages ────────────────────────────────────────────────
const AdminDashboardPage = lazyWithRetry(
  () => import("./pages/AdminDashboardPage"),
  "AdminDashboardPage",
);
const AdminSettingsPage = lazyWithRetry(
  () => import("./components/admin/AdminSettings"),
  "AdminSettings",
);
const AdminRegistrationPage = lazyWithRetry(
  () => import("./pages/AdminRegistrationPage"),
  "AdminRegistrationPage",
);
const AdminNoticesPage = lazyWithRetry(
  () => import("./pages/AdminNoticesPage"),
  "AdminNoticesPage",
);
const CreateNoticePage = lazyWithRetry(
  () => import("./pages/CreateNoticePage"),
  "CreateNoticePage",
);
const EditNoticePage = lazyWithRetry(
  () => import("./pages/EditNoticePage"),
  "EditNoticePage",
);
const UserManagementPage = lazyWithRetry(
  () => import("./pages/UserManagementPage"),
  "UserManagementPage",
);
const AnalyticsPage = lazyWithRetry(
  () => import("./pages/AnalyticsPage"),
  "AnalyticsPage",
);
const CreateEventPage = lazyWithRetry(
  () => import("./pages/CreateEventPage"),
  "CreateEventPage",
);
const ManageEventsPage = lazyWithRetry(
  () => import("./pages/ManageEventsPage"),
  "ManageEventsPage",
);
const EditEventPage = lazyWithRetry(
  () => import("./pages/EditEventPage"),
  "EditEventPage",
);

// ── NEW: Admin Notifications Page ─────────────────────────────
const AdminNotificationsPage = lazyWithRetry(
  () => import("./pages/AdminNotificationsPage"),
  "AdminNotificationsPage",
);

const NotFoundPage = lazyWithRetry(
  () => import("./pages/NotFoundPage"),
  "NotFoundPage",
);

// ============================================================
// SCROLL TO TOP
// ============================================================
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
};

// ============================================================
// ROUTE GUARDS
// ============================================================
const STATIC_ADMIN_EMAIL = "boakyesamuel189@gmail.com";

const isUserAdmin = (user) => {
  if (!user) return false;
  return (
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.email === STATIC_ADMIN_EMAIL
  );
};

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

const RequireAdmin = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isUserAdmin(user)) return <Navigate to="/dashboard" replace />;
  return children;
};

const RequireGuest = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (isAuthenticated) {
    return isUserAdmin(user) ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }
  return children;
};

// ============================================================
// ERROR FALLBACK
// ============================================================
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="error-fallback">
    <div className="error-fallback-content">
      <h2 className="error-fallback-title">Something went wrong</h2>
      <pre className="error-fallback-message">{error.message}</pre>
      <button onClick={resetErrorBoundary} className="error-fallback-button">
        Try again
      </button>
    </div>
  </div>
);

// ============================================================
// MAIN APP CONTENT
// ============================================================
const AppContent = () => {
  const { isOnline } = useNetworkStatus();
  const location = useLocation();

  // Get page name for responsive classes
  const getPageClass = () => {
    const path = location.pathname.replace("/", "") || "home";
    return `page-${path.replace(/\//g, "-")}`;
  };

  return (
    <div className={`app-container ${getPageClass()}`}>
      {!isOnline && <OfflineBanner className="offline-banner" />}
      <ScrollToTop />

      <Routes>
        {/* ── Public Routes (with MainLayout) ─────────────── */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/notices/:id" element={<NoticeDetailPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
        </Route>

        {/* ── Info Pages (with MainLayout) ─────────────────── */}
        <Route element={<MainLayout />}>
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/help/getting-started"
            element={<GettingStartedGuide />}
          />
          <Route path="/help/security-tips" element={<SecurityTipsPage />} />
          <Route path="/help/event-guide" element={<EventGuidePage />} />
          <Route
            path="/help/notifications"
            element={<NotificationsSetupPage />}
          />
          <Route path="/help/account-guide" element={<AccountGuidePage />} />
          <Route
            path="/help/troubleshooting"
            element={<TroubleshootingPage />}
          />
        </Route>

        {/* ── Auth Routes (with AuthLayout) ────────────────── */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <RequireGuest>
                <LoginForm />
              </RequireGuest>
            }
          />
          <Route
            path="/register"
            element={
              <RequireGuest>
                <RegisterForm />
              </RequireGuest>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <RequireGuest>
                <ForgotPasswordPage />
              </RequireGuest>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <RequireGuest>
                <ResetPasswordPage />
              </RequireGuest>
            }
          />
        </Route>

        {/* ── Test Route ───────────────────────────────────── */}
        <Route path="/test-login" element={<TestLogin />} />

        {/* ── ADMIN STANDALONE PORTAL ──────────────────────────
            This route is intentionally outside ALL layouts.
            It renders StandaloneAdminRegistration directly.
            The component itself handles the secret key check.
            URL: /admin/register-standalone?key=kaaf-super-admin-2024
        ─────────────────────────────────────────────────────── */}
        <Route
          path="/admin/register-standalone"
          element={<StandaloneAdminRegistration />}
        />

        {/* ── Protected User Routes (with MainLayout) ──────── */}
        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <NotificationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/my-registrations"
            element={
              <RequireAuth>
                <MyRegistrationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/events/:id/register"
            element={
              <RequireAuth>
                <RegisterForEventPage />
              </RequireAuth>
            }
          />
        </Route>

        {/* ── Admin Routes (with AdminLayout) ──────────────── */}
        <Route element={<AdminLayout />}>
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/register"
            element={
              <RequireAdmin>
                <AdminRegistrationPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAdmin>
                <AdminDashboardPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireAdmin>
                <UserManagementPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <RequireAdmin>
                <AnalyticsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireAdmin>
                <AdminSettingsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/notices"
            element={
              <RequireAdmin>
                <AdminNoticesPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/notices/create"
            element={
              <RequireAdmin>
                <CreateNoticePage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/notices/edit/:id"
            element={
              <RequireAdmin>
                <EditNoticePage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/events"
            element={
              <RequireAdmin>
                <ManageEventsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/events/create"
            element={
              <RequireAdmin>
                <CreateEventPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/events/edit/:id"
            element={
              <RequireAdmin>
                <EditEventPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/events/:id/edit"
            element={
              <RequireAdmin>
                <EditEventPage />
              </RequireAdmin>
            }
          />
          {/* NEW: Admin Notifications Route */}
          <Route
            path="/admin/notifications"
            element={
              <RequireAdmin>
                <AdminNotificationsPage />
              </RequireAdmin>
            }
          />
        </Route>

        {/* ── 404 ──────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

// ============================================================
// ROOT APP
// ============================================================
function App() {
  useEffect(() => {
    console.log(
      "%c🚀 KAAF University Noticeboard",
      "color:#D4AF37;font-size:16px;font-weight:bold;",
    );
    console.log(
      `%c📡 API: ${import.meta.env.VITE_API_URL || "/api"}`,
      "color:#2196F3",
    );
    console.log(`%c🔧 Mode: ${import.meta.env.MODE}`, "color:#FF9800");
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <NetworkStatusProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "12px 16px",
                  },
                  success: {
                    duration: 3000,
                    iconTheme: { primary: "#D4AF37", secondary: "#fff" },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: { primary: "#f44336", secondary: "#fff" },
                  },
                }}
              />
              <Suspense
                fallback={
                  <LoadingSpinner fullScreen message="Loading application..." />
                }
              >
                <AppContent />
              </Suspense>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </NetworkStatusProvider>
    </ErrorBoundary>
  );
}

export default App;
