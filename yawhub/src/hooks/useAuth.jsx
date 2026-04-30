// src/hooks/useAuth.jsx
import { useCallback } from "react";
import { useAuth as useAuthContext } from "../context/AuthContext";
import authService from "../services/authService";
import toast from "react-hot-toast";

const STATIC_ADMIN_EMAIL = "boakyesamuel189@gmail.com";

export const useAuth = () => {
  const context = useAuthContext();

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const {
    user,
    isAuthenticated,
    loading,
    error,
    login: contextLogin,
    logout: contextLogout,
    updateUser: contextUpdateUser,
    refreshToken: contextRefreshToken,
    setError,
    hasPermission: contextHasPermission,
    hasRole: contextHasRole,
    hasAnyRole: contextHasAnyRole,
    hasAllRoles: contextHasAllRoles,
    getAuthHeaders,
    isAdmin: contextIsAdmin,
    isSuperAdmin,
    isFaculty,
    isStudent,
    userName: contextUserName,
    userEmail,
    userId,
    userAvatar,
  } = context;

  // FIXED: Login function
  const login = useCallback(
    async (identifier, password, rememberMe = false) => {
      console.log("[useAuth] Login attempt for:", identifier);

      if (rememberMe) {
        localStorage.setItem("remember_me", "true");
      } else {
        localStorage.removeItem("remember_me");
      }

      try {
        const response = await authService.login(
          identifier,
          password,
          rememberMe,
        );
        console.log("[useAuth] Login response:", response);

        const loggedUser = response.user;
        const authToken = response.token;

        if (!loggedUser || !authToken) {
          throw new Error("Invalid login response from server");
        }

        // Ensure user has correct role
        const normalizedUser = {
          ...loggedUser,
          role:
            loggedUser.role === "admin"
              ? "admin"
              : loggedUser.email === STATIC_ADMIN_EMAIL
                ? "admin"
                : "user",
        };

        console.log("[useAuth] Normalized user:", normalizedUser);

        if (typeof contextLogin === "function") {
          contextLogin(normalizedUser, authToken);
        }

        toast.success(
          `Welcome back, ${normalizedUser.firstName || normalizedUser.name || "User"}!`,
        );
        return { success: true, user: normalizedUser, token: authToken };
      } catch (error) {
        const errorMsg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Login failed";
        console.error("[useAuth] Login error:", errorMsg);
        toast.error(errorMsg);
        if (setError) setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [contextLogin, setError],
  );

  const register = useCallback(
    async (userData) => {
      console.log("[useAuth] Registration attempt for:", userData.email);

      try {
        if (!userData.firstName || !userData.lastName)
          throw new Error("First name and last name are required");
        if (!userData.email) throw new Error("Email is required");
        if (!userData.password) throw new Error("Password is required");

        if (userData.email.toLowerCase() === STATIC_ADMIN_EMAIL) {
          throw new Error("This email is reserved for system administrator");
        }

        if (!userData.username) {
          userData.username = userData.email.split("@")[0].toLowerCase();
        }

        const result = await authService.register(userData);
        toast.success(
          result.message || "Registration successful! Please login.",
        );
        return { success: true, data: result };
      } catch (error) {
        const backendErrors = error.response?.data?.errors;
        const backendMessage = error.response?.data?.message;
        let errorMsg = "Registration failed";
        if (backendErrors && Array.isArray(backendErrors)) {
          errorMsg = backendErrors.map((e) => e.msg || e).join(", ");
        } else if (backendMessage) {
          errorMsg = backendMessage;
        } else if (error.message) {
          errorMsg = error.message;
        }
        console.error("[useAuth] Registration error:", errorMsg);
        toast.error(errorMsg);
        if (setError) setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [setError],
  );

  const logout = useCallback(
    async (allDevices = false) => {
      try {
        await authService.logout(allDevices);
        if (typeof contextLogout === "function") contextLogout();
        toast.success(
          allDevices
            ? "Logged out from all devices"
            : "Logged out successfully",
        );
        return { success: true };
      } catch (error) {
        console.error("[useAuth] Logout error:", error);
        if (typeof contextLogout === "function") contextLogout();
        return { success: false, error: error.message };
      }
    },
    [contextLogout],
  );

  const refreshToken = useCallback(async () => {
    try {
      const response = await authService.refreshToken();
      const token = response.token || response.accessToken;
      if (typeof contextRefreshToken === "function" && token)
        contextRefreshToken(token);
      return { success: true, token };
    } catch (error) {
      console.error("[useAuth] Token refresh failed:", error);
      logout(false);
      return { success: false, error: error.message };
    }
  }, [contextRefreshToken, logout]);

  const updateProfile = useCallback(
    async (userData) => {
      const userId = user?.id || user?._id;
      if (!userId) {
        toast.error("User ID not found");
        return { success: false, error: "User ID not found" };
      }
      try {
        const updatedUser = await authService.updateProfile(userId, userData);
        if (typeof contextUpdateUser === "function")
          contextUpdateUser(updatedUser);
        toast.success("Profile updated successfully");
        return { success: true, user: updatedUser };
      } catch (error) {
        const errorMsg =
          error.response?.data?.message || error.message || "Update failed";
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [user, contextUpdateUser],
  );

  const changePassword = useCallback(
    async (currentPassword, newPassword, confirmPassword) => {
      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match");
        return { success: false, error: "Passwords do not match" };
      }
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return { success: false, error: "Password too short" };
      }
      try {
        await authService.changePassword(currentPassword, newPassword);
        toast.success("Password changed successfully");
        return { success: true };
      } catch (error) {
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "Failed to change password";
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [],
  );

  const forgotPassword = useCallback(async (identifier) => {
    try {
      await authService.forgotPassword(identifier);
      toast.success("Password reset email sent if account exists");
      return { success: true };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to send reset email";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const resetPassword = useCallback(
    async (token, password, confirmPassword) => {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return { success: false, error: "Passwords do not match" };
      }
      try {
        await authService.resetPassword(token, password);
        toast.success("Password reset successful. Please login.");
        return { success: true };
      } catch (error) {
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "Failed to reset password";
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [],
  );

  const verifyEmail = useCallback(async (token) => {
    try {
      const result = await authService.verifyEmail(token);
      toast.success(result.message || "Email verified successfully");
      return { success: true };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to verify email";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const resendVerification = useCallback(async (email) => {
    try {
      await authService.resendVerification(email);
      toast.success("Verification email sent");
      return { success: true };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to send verification";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const uploadAvatar = useCallback(
    async (file) => {
      try {
        const result = await authService.uploadAvatar(file);
        if (result.user && typeof contextUpdateUser === "function")
          contextUpdateUser(result.user);
        toast.success("Avatar uploaded successfully");
        return { success: true, avatar: result.avatar || result.data?.avatar };
      } catch (error) {
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "Failed to upload avatar";
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [contextUpdateUser],
  );

  const deleteAvatar = useCallback(async () => {
    try {
      const result = await authService.deleteAvatar();
      if (result.user && typeof contextUpdateUser === "function")
        contextUpdateUser(result.user);
      toast.success("Avatar deleted successfully");
      return { success: true };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete avatar";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [contextUpdateUser]);

  const deleteAccount = useCallback(async () => {
    try {
      await authService.deleteAccount();
      if (typeof contextLogout === "function") contextLogout();
      toast.success("Account deleted successfully");
      return { success: true };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete account";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [contextLogout]);

  const hasRole = useCallback(
    (role) => {
      if (typeof contextHasRole === "function") return contextHasRole(role);
      if (role === "admin" && user?.email === STATIC_ADMIN_EMAIL) return true;
      return user?.role === role;
    },
    [user, contextHasRole],
  );

  const isAdmin = useCallback(() => {
    return (
      user?.role === "admin" ||
      user?.email === STATIC_ADMIN_EMAIL ||
      contextIsAdmin
    );
  }, [user, contextIsAdmin]);

  const hasAnyRole = useCallback(
    (roles) => {
      if (typeof contextHasAnyRole === "function")
        return contextHasAnyRole(roles);
      return Array.isArray(roles) && roles.includes(user?.role);
    },
    [user, contextHasAnyRole],
  );

  const hasAllRoles = useCallback(
    (roles) => {
      if (typeof contextHasAllRoles === "function")
        return contextHasAllRoles(roles);
      return Array.isArray(roles) && roles.every((r) => user?.role === r);
    },
    [user, contextHasAllRoles],
  );

  const hasPermission = useCallback(
    (permission) => {
      if (typeof contextHasPermission === "function")
        return contextHasPermission(permission);
      return user?.permissions?.includes(permission);
    },
    [user, contextHasPermission],
  );

  const getUserName = useCallback(() => {
    if (!user) return "Guest";
    if (contextUserName) return contextUserName;
    if (user.firstName && user.lastName)
      return `${user.firstName} ${user.lastName}`;
    return user.name || user.username || user.email?.split("@")[0] || "User";
  }, [user, contextUserName]);

  const getUserInitials = useCallback(() => {
    if (!user) return "?";
    if (user.firstName && user.lastName)
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.charAt(0).toUpperCase() || "?";
  }, [user]);

  const getFullName = useCallback(() => {
    if (!user) return "";
    if (user.firstName && user.lastName)
      return `${user.firstName} ${user.lastName}`;
    return user.name || "";
  }, [user]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    uploadAvatar,
    deleteAvatar,
    deleteAccount,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin: isAdmin(),
    getUserName,
    getUserInitials,
    getFullName,
    isSuperAdmin,
    isFaculty,
    isStudent,
    userName: contextUserName || getUserName(),
    userEmail,
    userId,
    userAvatar,
    getAuthHeaders,
  };
};

export default useAuth;
