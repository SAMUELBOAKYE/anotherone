// src/context/AuthContext.jsx - FINAL FIXED VERSION WITH SUPER_ADMIN BYPASS
// Uses authService.login() correctly — matches its actual return shape

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);
AuthContext.displayName = "AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setTokenState] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);

  const refreshTimerRef = useRef(null);
  const doRefreshTokenRef = useRef(null);

  // ── JWT helpers ────────────────────────────────────────────────────────
  const parseJwt = useCallback((tkn) => {
    if (!tkn || typeof tkn !== "string") return null;
    try {
      const parts = tkn.split(".");
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        ),
      );
    } catch {
      return null;
    }
  }, []);

  const isTokenExpired = useCallback(
    (tkn) => {
      if (!tkn) return true;
      const payload = parseJwt(tkn);
      if (!payload?.exp) return true;
      return Date.now() >= payload.exp * 1000;
    },
    [parseJwt],
  );

  const getTimeUntilExpiry = useCallback(
    (tkn) => {
      const payload = parseJwt(tkn);
      if (!payload?.exp) return -1;
      return payload.exp * 1000 - Date.now();
    },
    [parseJwt],
  );

  const scheduleTokenRefresh = useCallback(
    (tkn) => {
      if (!tkn) return;
      const timeUntilExpiry = getTimeUntilExpiry(tkn);
      if (timeUntilExpiry <= 0) return;
      const refreshIn = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(
        () => doRefreshTokenRef.current?.(),
        refreshIn,
      );
    },
    [getTimeUntilExpiry],
  );

  // ── Internal state setter — called ONLY after verified auth ───────────
  const _applyAuthState = useCallback(
    (userData, authToken) => {
      if (!userData || !authToken) return;

      const normalizedUser = {
        id: userData.id || userData._id,
        _id: userData._id || userData.id,
        email: userData.email || "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        name:
          userData.name ||
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
        role: userData.role || "user",
        avatar: userData.avatar || null,
        username: userData.username || "",
        department: userData.department || null,
        isVerified: userData.isVerified || false,
        // ✅ Ensure super_admin is properly flagged
        isSuperAdmin:
          userData.role === "super_admin" ||
          userData.user_type === "super_admin",
      };

      setUser(normalizedUser);
      setTokenState(authToken);
      setIsAuthenticated(true);
      setError(null);

      if (normalizedUser.role) setRoles([normalizedUser.role]);
      if (normalizedUser.permissions)
        setPermissions(normalizedUser.permissions);

      scheduleTokenRefresh(authToken);

      window.dispatchEvent(
        new CustomEvent("auth:login", {
          detail: { user: normalizedUser, token: authToken },
        }),
      );
    },
    [scheduleTokenRefresh],
  );

  // ── Token refresh ──────────────────────────────────────────────────────
  const doRefreshToken = useCallback(async () => {
    try {
      const result = await authService.refreshToken();
      if (result?.token) {
        setTokenState(result.token);
        scheduleTokenRefresh(result.token);
        return true;
      }
      return false;
    } catch (err) {
      console.error("[AuthContext] Token refresh failed:", err);
      setUser(null);
      setTokenState(null);
      setIsAuthenticated(false);
      setPermissions([]);
      setRoles([]);
      authService.clearAllAuthData();
      return false;
    }
  }, [scheduleTokenRefresh]);

  useEffect(() => {
    doRefreshTokenRef.current = doRefreshToken;
  }, [doRefreshToken]);

  // ── PUBLIC login ───────────────────────────────────────────────────────
  const login = useCallback(
    async (identifier, password, rememberMe = false) => {
      if (!identifier || !password) {
        const err = new Error("Email/username and password are required");
        err.status = 400;
        throw err;
      }

      const result = await authService.login(identifier, password, rememberMe);

      if (!result?.token || !result?.user) {
        throw new Error("Incomplete response from server. Please try again.");
      }

      _applyAuthState(result.user, result.token);

      if (rememberMe) {
        localStorage.setItem("remember_me", "true");
      } else {
        localStorage.removeItem("remember_me");
      }

      return result;
    },
    [_applyAuthState],
  );

  // ── Logout ─────────────────────────────────────────────────────────────
  const doLogout = useCallback(async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    try {
      await authService.logout();
    } catch {
      authService.clearAllAuthData();
    }
    setUser(null);
    setTokenState(null);
    setIsAuthenticated(false);
    setPermissions([]);
    setRoles([]);
    setError(null);
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }, []);

  const logout = doLogout;

  // ── Update user ────────────────────────────────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
    const newRole = updatedUser.role || updatedUser.userRole;
    if (newRole) setRoles([newRole]);
    if (updatedUser.permissions) setPermissions(updatedUser.permissions);
  }, []);

  const setErrorMsg = useCallback((msg) => setError(msg), []);

  // ── Restore session on app load ────────────────────────────────────────
  const initializeAuth = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = authService.getToken();
      const storedUser = authService.getCurrentUser();

      if (storedToken && storedUser && !isTokenExpired(storedToken)) {
        _applyAuthState(storedUser, storedToken);
      } else if (storedToken && isTokenExpired(storedToken)) {
        await doRefreshToken();
      }
    } catch (err) {
      console.error("[AuthContext] Init error:", err);
      authService.clearAllAuthData();
    } finally {
      setLoading(false);
    }
  }, [isTokenExpired, _applyAuthState, doRefreshToken]);

  useEffect(() => {
    initializeAuth();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [initializeAuth]);

  // ── ✅ UPDATED: Permission / role helpers with SUPER_ADMIN bypass ─────

  const isSuperAdmin = useMemo(() => {
    return user?.role === "super_admin" || user?.isSuperAdmin === true;
  }, [user]);

  // ✅ UPDATED: hasPermission - SUPER_ADMIN always returns true
  const hasPermission = useCallback(
    (permission) => {
      if (!isAuthenticated) return false;
      // SUPER_ADMIN bypass - has all permissions
      if (isSuperAdmin) return true;
      if (permissions.includes("*")) return true;
      return permissions.includes(permission);
    },
    [isAuthenticated, permissions, isSuperAdmin],
  );

  // ✅ UPDATED: hasRole - SUPER_ADMIN bypass
  const hasRole = useCallback(
    (role) => {
      if (!isAuthenticated) return false;
      // SUPER_ADMIN bypass - has all roles
      if (isSuperAdmin) return true;
      return roles.includes(role) || user?.role === role;
    },
    [isAuthenticated, roles, user, isSuperAdmin],
  );

  // ✅ UPDATED: hasAnyRole - SUPER_ADMIN bypass
  const hasAnyRole = useCallback(
    (roleList) => {
      if (!isAuthenticated || !Array.isArray(roleList)) return false;
      // SUPER_ADMIN bypass
      if (isSuperAdmin) return true;
      return roleList.some((r) => hasRole(r));
    },
    [isAuthenticated, hasRole, isSuperAdmin],
  );

  // ✅ UPDATED: hasAllRoles - SUPER_ADMIN bypass
  const hasAllRoles = useCallback(
    (roleList) => {
      if (!isAuthenticated || !Array.isArray(roleList)) return false;
      // SUPER_ADMIN bypass
      if (isSuperAdmin) return true;
      return roleList.every((r) => hasRole(r));
    },
    [isAuthenticated, hasRole, isSuperAdmin],
  );

  const getAuthHeaders = useCallback(() => {
    const authToken = token || authService.getToken();
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    // ✅ Add super_admin header for backend to recognize
    if (isSuperAdmin) {
      headers["X-User-Role"] = "super_admin";
      headers["X-Bypass-Permissions"] = "true";
    }

    return headers;
  }, [token, isSuperAdmin]);

  const isAdmin = useMemo(
    () => user?.role === "admin" || isSuperAdmin,
    [user, isSuperAdmin],
  );

  // ── Context value ──────────────────────────────────────────────────────
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated,
      token,
      permissions,
      roles,
      login,
      logout,
      updateUser,
      refreshToken: doRefreshToken,
      setError: setErrorMsg,
      hasPermission,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      getAuthHeaders,
      isAdmin,
      isSuperAdmin, // ✅ Now available and used in all checks
      isFaculty: user?.role === "faculty",
      isStudent: user?.role === "student",
      userName: user?.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : user?.name || user?.username || user?.email?.split("@")[0] || "User",
      userEmail: user?.email,
      userId: user?.id || user?._id,
      userAvatar: user?.avatar,
    }),
    [
      user,
      loading,
      error,
      isAuthenticated,
      token,
      permissions,
      roles,
      login,
      logout,
      updateUser,
      doRefreshToken,
      setErrorMsg,
      hasPermission,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      getAuthHeaders,
      isAdmin,
      isSuperAdmin,
    ],
  );

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children,
  );
};

export default AuthProvider;
