/**
 * Theme Context Module
 * @module ThemeContext
 * @description Enterprise-grade theme management with system preference detection,
 *              persistent storage, accessibility support, and performance optimizations
 * @version 3.0.0
 * @author KAAF University
 */

import React from "react";

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

export const THEME_STORAGE_KEY = "app_theme_preference";
export const THEME_TRANSITION_DURATION = 300; // ms

/**
 * Complete color palette for both themes
 * Follows WCAG 2.1 AA accessibility standards
 */
// eslint-disable-next-line react-refresh/only-export-components
export const COLOR_PALETTE = {
  light: {
    primary: "#4F46E5",
    primaryHover: "#4338CA",
    primaryActive: "#3730A3",
    secondary: "#10B981",
    secondaryHover: "#059669",
    background: "#FFFFFF",
    backgroundSecondary: "#F9FAFB",
    surface: "#FFFFFF",
    surfaceElevated: "#F3F4F6",
    text: "#111827",
    textSecondary: "#6B7280",
    textDisabled: "#9CA3AF",
    border: "#E5E7EB",
    borderFocus: "#4F46E5",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    divider: "#E5E7EB",
    overlay: "rgba(0, 0, 0, 0.5)",
    shadow: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    primary: "#818CF8",
    primaryHover: "#6366F1",
    primaryActive: "#4F46E5",
    secondary: "#34D399",
    secondaryHover: "#10B981",
    background: "#111827",
    backgroundSecondary: "#1F2937",
    surface: "#1F2937",
    surfaceElevated: "#374151",
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    textDisabled: "#6B7280",
    border: "#374151",
    borderFocus: "#818CF8",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
    info: "#60A5FA",
    divider: "#374151",
    overlay: "rgba(0, 0, 0, 0.7)",
    shadow: "rgba(0, 0, 0, 0.3)",
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Detect system color scheme preference
 * @returns {string} System theme preference ('light' or 'dark')
 */
const getSystemTheme = () => {
  if (typeof window === "undefined") return THEMES.LIGHT;

  try {
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const lightModeQuery = window.matchMedia("(prefers-color-scheme: light)");

    if (darkModeQuery.matches) return THEMES.DARK;
    if (lightModeQuery.matches) return THEMES.LIGHT;

    // Default to light if neither matches
    return THEMES.LIGHT;
  } catch (error) {
    console.error("[Theme] Failed to detect system theme:", error);
    return THEMES.LIGHT;
  }
};

/**
 * Apply theme to DOM with smooth transition
 * @param {string} theme - Theme to apply
 * @param {boolean} withTransition - Whether to apply transition effect
 */
const applyThemeToDOM = (theme, withTransition = true) => {
  const root = document.documentElement;
  const effectiveTheme = theme === THEMES.SYSTEM ? getSystemTheme() : theme;

  if (withTransition) {
    root.style.transition = `background-color ${THEME_TRANSITION_DURATION}ms ease, color ${THEME_TRANSITION_DURATION}ms ease`;
    setTimeout(() => {
      root.style.transition = "";
    }, THEME_TRANSITION_DURATION);
  }

  // Apply theme attributes
  root.setAttribute("data-theme", effectiveTheme);
  root.style.colorScheme = effectiveTheme;

  // Apply theme classes
  root.classList.remove("theme-light", "theme-dark");
  root.classList.add(`theme-${effectiveTheme}`);

  // Apply CSS custom properties
  const colors = COLOR_PALETTE[effectiveTheme];
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  // Dispatch theme change event for components
  window.dispatchEvent(
    new CustomEvent("theme-change", {
      detail: { theme: effectiveTheme, originalTheme: theme },
    }),
  );
};

/**
 * Validate theme preference value
 * @param {string} theme - Theme to validate
 * @returns {boolean} Whether theme is valid
 */
const isValidTheme = (theme) => {
  return Object.values(THEMES).includes(theme);
};

/**
 * Get stored theme preference
 * @returns {string} Stored theme preference
 */
const getStoredTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isValidTheme(stored)) return stored;
  } catch (error) {
    console.error("[Theme] Failed to read stored theme:", error);
  }
  return THEMES.SYSTEM;
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = React.createContext(null);
ThemeContext.displayName = "ThemeContext";

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Theme Provider Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} [props.defaultTheme='system'] - Default theme preference
 * @param {boolean} [props.enableTransition=true] - Enable theme transition animations
 * @param {Function} [props.onThemeChange] - Theme change callback
 */
export const ThemeProvider = ({
  children,
  defaultTheme = THEMES.SYSTEM,
  enableTransition = true,
  onThemeChange,
}) => {
  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------
  const [preference, setPreference] = React.useState(() => {
    const stored = getStoredTheme();
    return isValidTheme(stored) ? stored : defaultTheme;
  });

  const [currentTheme, setCurrentTheme] = React.useState(() => {
    const initial =
      preference === THEMES.SYSTEM ? getSystemTheme() : preference;
    return initial;
  });

  const [isDarkMode, setIsDarkMode] = React.useState(
    () => currentTheme === THEMES.DARK,
  );
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [transitionEnabled] = React.useState(enableTransition);

  // Refs for media query listeners
  const mediaQueryRef = React.useRef(null);
  const handleChangeRef = React.useRef(null);

  // --------------------------------------------------------------------------
  // Core Functions
  // --------------------------------------------------------------------------

  /**
   * Update current theme based on preference
   */
  const updateCurrentTheme = React.useCallback(() => {
    const newTheme =
      preference === THEMES.SYSTEM ? getSystemTheme() : preference;

    if (newTheme !== currentTheme) {
      setCurrentTheme(newTheme);
      setIsDarkMode(newTheme === THEMES.DARK);
      applyThemeToDOM(preference, transitionEnabled);
      onThemeChange?.(newTheme);
    }
  }, [preference, currentTheme, transitionEnabled, onThemeChange]);

  /**
   * Toggle between light and dark themes
   * @returns {string} New theme preference
   */
  const toggleTheme = React.useCallback(() => {
    let newPreference;

    if (preference === THEMES.SYSTEM) {
      // Switch from system to explicit theme opposite to current
      newPreference = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    } else {
      // Toggle between light and dark
      newPreference = preference === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    }

    setPreference(newPreference);

    // Persist to storage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newPreference);
    } catch (error) {
      console.error("[Theme] Failed to persist theme preference:", error);
    }

    return newPreference;
  }, [preference, currentTheme]);

  /**
   * Set specific theme preference
   * @param {string} theme - Theme to set
   */
  const setTheme = React.useCallback((theme) => {
    if (!isValidTheme(theme)) {
      console.warn(`[Theme] Invalid theme: ${theme}, falling back to system`);
      theme = THEMES.SYSTEM;
    }

    setPreference(theme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error("[Theme] Failed to persist theme:", error);
    }
  }, []);

  /**
   * Reset to system preference
   */
  const resetToSystem = React.useCallback(() => {
    setPreference(THEMES.SYSTEM);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, THEMES.SYSTEM);
    } catch (error) {
      console.error("[Theme] Failed to reset theme:", error);
    }
  }, []);

  /**
   * Get color for current theme
   * @param {string} colorKey - Color key
   * @returns {string} Color value
   */
  const getColor = React.useCallback(
    (colorKey) => {
      return COLOR_PALETTE[currentTheme][colorKey];
    },
    [currentTheme],
  );

  /**
   * Get CSS variable name
   * @param {string} variable - Variable name
   * @returns {string} CSS variable string
   */
  const getCssVariable = React.useCallback((variable) => {
    return `var(--color-${variable})`;
  }, []);

  /**
   * Check if theme is currently dark
   * @returns {boolean} True if dark mode active
   */
  const isDark = React.useCallback(() => {
    return isDarkMode;
  }, [isDarkMode]);

  /**
   * Check if theme is currently light
   * @returns {boolean} True if light mode active
   */
  const isLight = React.useCallback(() => {
    return !isDarkMode;
  }, [isDarkMode]);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  // Update theme when preference changes
  React.useEffect(() => {
    updateCurrentTheme();
  }, [updateCurrentTheme]);

  // Set up system theme change listener
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQueryRef.current = darkModeQuery;

    const handleSystemThemeChange = (e) => {
      if (preference === THEMES.SYSTEM) {
        const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
        setCurrentTheme(newTheme);
        setIsDarkMode(newTheme === THEMES.DARK);
        applyThemeToDOM(THEMES.SYSTEM, transitionEnabled);
        onThemeChange?.(newTheme);
      }
    };

    handleChangeRef.current = handleSystemThemeChange;

    // Use addEventListener for modern browsers
    if (darkModeQuery.addEventListener) {
      darkModeQuery.addEventListener("change", handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      darkModeQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (darkModeQuery.removeEventListener && handleChangeRef.current) {
        darkModeQuery.removeEventListener("change", handleChangeRef.current);
      } else if (darkModeQuery.removeListener && handleChangeRef.current) {
        darkModeQuery.removeListener(handleChangeRef.current);
      }
    };
  }, [preference, transitionEnabled, onThemeChange]);

  // Apply initial theme with transition
  React.useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      applyThemeToDOM(preference, false);
    }
  }, [preference, isInitialized]);

  // Add theme transition class for smooth changes
  React.useEffect(() => {
    if (!transitionEnabled) return;

    const root = document.documentElement;
    root.classList.add("theme-transitioning");

    const timeout = setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, THEME_TRANSITION_DURATION);

    return () => clearTimeout(timeout);
  }, [currentTheme, transitionEnabled]);

  // --------------------------------------------------------------------------
  // Context Value
  // --------------------------------------------------------------------------
  const contextValue = React.useMemo(
    () => ({
      // State
      theme: currentTheme,
      preference,
      isDarkMode,
      isSystemTheme: preference === THEMES.SYSTEM,
      isInitialized,

      // Theme colors
      colors: COLOR_PALETTE[currentTheme],

      // Actions
      toggleTheme,
      setTheme,
      resetToSystem,

      // Utility functions
      getColor,
      getCssVariable,
      isDark,
      isLight,

      // Helpers
      getClassName: (className) => `${className} theme-${currentTheme}`,
      getCurrentTheme: () => currentTheme,
      getPreference: () => preference,

      // Color shortcuts
      primary: COLOR_PALETTE[currentTheme].primary,
      secondary: COLOR_PALETTE[currentTheme].secondary,
      background: COLOR_PALETTE[currentTheme].background,
      text: COLOR_PALETTE[currentTheme].text,
      textSecondary: COLOR_PALETTE[currentTheme].textSecondary,
      border: COLOR_PALETTE[currentTheme].border,
      success: COLOR_PALETTE[currentTheme].success,
      warning: COLOR_PALETTE[currentTheme].warning,
      error: COLOR_PALETTE[currentTheme].error,
      info: COLOR_PALETTE[currentTheme].info,
    }),
    [
      currentTheme,
      preference,
      isDarkMode,
      isInitialized,
      toggleTheme,
      setTheme,
      resetToSystem,
      getColor,
      getCssVariable,
      isDark,
      isLight,
    ],
  );

  return React.createElement(
    ThemeContext.Provider,
    { value: contextValue },
    children,
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * useTheme Hook
 * @returns {Object} Theme context value
 * @throws {Error} If used outside of ThemeProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

/**
 * useThemeColor Hook - Get specific theme color
 * @param {string} colorKey - Color key
 * @returns {string} Color value
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useThemeColor = (colorKey) => {
  const { getColor } = useTheme();
  return getColor(colorKey);
};

/**
 * useDarkMode Hook - Check if dark mode is active
 * @returns {boolean} True if dark mode active
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useDarkMode = () => {
  const { isDarkMode } = useTheme();
  return isDarkMode;
};

export default ThemeProvider;
