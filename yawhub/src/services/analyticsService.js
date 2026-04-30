// src/services/analyticsService.js

/**
 * Analytics Service Module
 * Handles all analytics data fetching, processing, and export functionality
 *
 * @version 2.0.0
 * @author KAAF University
 */

import api from "./api";
import toast from "react-hot-toast";

// ============================================================================
// CONFIGURATION
// ============================================================================

const ENABLE_LOGGING =
  import.meta.env.VITE_ENABLE_LOGGING === "true" || import.meta.env.DEV;

// ============================================================================
// MOCK DATA (for development when API is not available)
// ============================================================================

const getMockDashboardAnalytics = (timeRange = "week") => {
  // Generate dates based on time range
  const getDates = () => {
    const dates = [];
    const now = new Date();
    let count =
      timeRange === "day"
        ? 24
        : timeRange === "week"
          ? 7
          : timeRange === "month"
            ? 30
            : 12;

    for (let i = count - 1; i >= 0; i--) {
      if (timeRange === "day") {
        const date = new Date(now - i * 3600000);
        dates.push(date.toLocaleTimeString([], { hour: "2-digit" }));
      } else if (timeRange === "week" || timeRange === "month") {
        const date = new Date(now - i * 86400000);
        dates.push(
          date.toLocaleDateString([], { month: "short", day: "numeric" }),
        );
      } else {
        const date = new Date(now.getFullYear() - i, now.getMonth(), 1);
        dates.push(
          date.toLocaleDateString([], { month: "short", year: "numeric" }),
        );
      }
    }
    return dates;
  };

  const dates = getDates();

  // Generate random data
  const viewsOverTime = dates.map((date) => ({
    date,
    views: Math.floor(Math.random() * 1000) + 500,
    uniqueVisitors: Math.floor(Math.random() * 500) + 200,
  }));

  const userGrowth = dates.map((date) => ({
    date,
    newUsers: Math.floor(Math.random() * 100) + 20,
    activeUsers: Math.floor(Math.random() * 500) + 100,
  }));

  return {
    totalViews: viewsOverTime.reduce((sum, d) => sum + d.views, 0),
    viewsGrowth: Math.floor(Math.random() * 30) - 10,
    activeUsers: Math.floor(Math.random() * 1000) + 500,
    usersGrowth: Math.floor(Math.random() * 25) - 5,
    engagementRate: Math.floor(Math.random() * 40) + 50,
    engagementGrowth: Math.floor(Math.random() * 20) - 5,
    totalEvents: Math.floor(Math.random() * 50) + 20,
    eventsGrowth: Math.floor(Math.random() * 30) - 10,
    totalPosts: Math.floor(Math.random() * 200) + 100,
    viewsOverTime,
    userGrowth,
    categoryDistribution: [
      { name: "Academic", value: Math.floor(Math.random() * 40) + 20 },
      { name: "Administrative", value: Math.floor(Math.random() * 30) + 15 },
      { name: "Events", value: Math.floor(Math.random() * 25) + 10 },
      { name: "General", value: Math.floor(Math.random() * 20) + 5 },
    ],
    topPosts: [
      { title: "Exam Schedule Update", views: 1234, likes: 456, comments: 78 },
      { title: "New Library Hours", views: 987, likes: 345, comments: 56 },
      { title: "Career Fair 2024", views: 876, likes: 234, comments: 45 },
      {
        title: "Scholarship Announcement",
        views: 765,
        likes: 198,
        comments: 34,
      },
    ],
    userRoles: [
      { name: "Students", value: Math.floor(Math.random() * 800) + 500 },
      { name: "Faculty", value: Math.floor(Math.random() * 100) + 50 },
      { name: "Staff", value: Math.floor(Math.random() * 80) + 30 },
      { name: "Admin", value: Math.floor(Math.random() * 20) + 5 },
    ],
    departmentDistribution: [
      {
        department: "Engineering",
        count: Math.floor(Math.random() * 300) + 100,
      },
      { department: "Business", count: Math.floor(Math.random() * 250) + 80 },
      { department: "Arts", count: Math.floor(Math.random() * 200) + 60 },
      { department: "Science", count: Math.floor(Math.random() * 180) + 50 },
      { department: "Medicine", count: Math.floor(Math.random() * 150) + 40 },
    ],
  };
};

// ============================================================================
// API CALLS
// ============================================================================

/**
 * Get dashboard analytics data
 * @param {Object} params - Query parameters (timeRange, startDate, endDate, etc.)
 * @returns {Promise<Object>} Analytics data
 */
export const getDashboardAnalytics = async (params = {}) => {
  const { timeRange = "week", startDate, endDate } = params;

  try {
    if (ENABLE_LOGGING) {
      console.log("[AnalyticsService] Fetching dashboard analytics:", {
        timeRange,
        startDate,
        endDate,
      });
    }

    // Try to fetch from API
    const response = await api.get("/analytics/dashboard", {
      params: { timeRange, startDate, endDate },
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }

    // Fallback to mock data if API returns unexpected format
    console.warn(
      "[AnalyticsService] API returned unexpected format, using mock data",
    );
    return getMockDashboardAnalytics(timeRange);
  } catch (error) {
    console.error(
      "[AnalyticsService] Failed to fetch dashboard analytics:",
      error.message,
    );

    // Return mock data for development
    if (ENABLE_LOGGING) {
      console.log("[AnalyticsService] Using mock data due to API error");
    }
    return getMockDashboardAnalytics(timeRange);
  }
};

/**
 * Get user analytics data
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} User analytics data
 */
export const getUserAnalytics = async (params = {}) => {
  const { timeRange = "week" } = params;

  try {
    const response = await api.get("/analytics/users", {
      params: { timeRange },
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }

    return {
      totalUsers: 1247,
      newUsers: 156,
      activeUsers: 892,
      userGrowth: [
        { date: "Week 1", users: 850 },
        { date: "Week 2", users: 920 },
        { date: "Week 3", users: 1010 },
        { date: "Week 4", users: 1080 },
      ],
    };
  } catch (error) {
    console.error(
      "[AnalyticsService] Failed to fetch user analytics:",
      error.message,
    );
    return {
      totalUsers: 1247,
      newUsers: 156,
      activeUsers: 892,
      userGrowth: [],
    };
  }
};

/**
 * Get event analytics data
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Event analytics data
 */
export const getEventAnalytics = async (params = {}) => {
  const { timeRange = "week" } = params;

  try {
    const response = await api.get("/analytics/events", {
      params: { timeRange },
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }

    return {
      totalEvents: 89,
      upcomingEvents: 12,
      completedEvents: 77,
      registrations: 5678,
      popularEvents: [
        { name: "Tech Conference", registrations: 234 },
        { name: "Career Fair", registrations: 189 },
      ],
    };
  } catch (error) {
    console.error(
      "[AnalyticsService] Failed to fetch event analytics:",
      error.message,
    );
    return {
      totalEvents: 89,
      upcomingEvents: 12,
      completedEvents: 77,
      registrations: 5678,
      popularEvents: [],
    };
  }
};

/**
 * Get content analytics data
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Content analytics data
 */
export const getContentAnalytics = async (params = {}) => {
  const { timeRange = "week" } = params;

  try {
    const response = await api.get("/analytics/content", {
      params: { timeRange },
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }

    return {
      totalNotices: 342,
      totalViews: 45678,
      topCategories: [
        { name: "Academic", count: 145 },
        { name: "Administrative", count: 98 },
      ],
      topPosts: [],
    };
  } catch (error) {
    console.error(
      "[AnalyticsService] Failed to fetch content analytics:",
      error.message,
    );
    return {
      totalNotices: 342,
      totalViews: 45678,
      topCategories: [],
      topPosts: [],
    };
  }
};

/**
 * Get insights from analytics data
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} Insights array
 */
export const getInsights = async (params = {}) => {
  try {
    const response = await api.get("/analytics/insights", { params });

    if (response.data && response.data.success) {
      return response.data.insights;
    }

    return [
      {
        title: "User Growth Increasing",
        description: "User registration has increased by 23% this month.",
        impact: "high",
        recommendation: "Continue current marketing strategies.",
        confidence: 85,
        dataPoints: 1247,
      },
      {
        title: "Event Participation Up",
        description: "Event registrations are 15% higher than last month.",
        impact: "medium",
        recommendation: "Consider adding more events.",
        confidence: 78,
        dataPoints: 89,
      },
    ];
  } catch (error) {
    console.error(
      "[AnalyticsService] Failed to fetch insights:",
      error.message,
    );
    return [];
  }
};

/**
 * Get forecasts for analytics
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Forecast data
 */
export const getForecasts = async (params = {}) => {
  try {
    const response = await api.get("/analytics/forecasts", { params });

    if (response.data && response.data.success) {
      return response.data.forecasts;
    }

    return {
      userGrowth: {
        nextMonth: 1350,
        growthRate: 8.5,
      },
      revenue: {
        nextMonth: 12500,
        growthRate: 12.3,
      },
      attendance: {
        nextMonth: 890,
        growthRate: 7.2,
      },
    };
  } catch (error) {
    console.error(
      "[AnalyticsService] Failed to fetch forecasts:",
      error.message,
    );
    return null;
  }
};

/**
 * Get anomalies in analytics data
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} Anomalies array
 */
export const getAnomalies = async (params = {}) => {
  try {
    const response = await api.get("/analytics/anomalies", { params });

    if (response.data && response.data.success) {
      return response.data.anomalies;
    }

    return [];
  } catch (error) {
    console.error(
      "[AnalyticsService] Failed to fetch anomalies:",
      error.message,
    );
    return [];
  }
};

/**
 * Export analytics data to file
 * @param {string} timeRange - Time range for export
 * @param {string} format - Export format (csv, excel, pdf, json)
 * @returns {Promise<void>}
 */
export const exportAnalytics = async (timeRange = "week", format = "csv") => {
  try {
    if (ENABLE_LOGGING) {
      console.log(`[AnalyticsService] Exporting analytics as ${format}`);
    }

    const data = await getDashboardAnalytics({ timeRange });

    let content = "";
    let filename = `analytics_${timeRange}_${new Date().toISOString().split("T")[0]}`;
    let type = "";

    switch (format) {
      case "csv":
        content = convertToCSV(data);
        filename += ".csv";
        type = "text/csv";
        break;
      case "json":
        content = JSON.stringify(data, null, 2);
        filename += ".json";
        type = "application/json";
        break;
      case "excel":
        // For Excel, you'd need a library like xlsx
        content = convertToCSV(data);
        filename += ".xlsx";
        type =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      default:
        content = JSON.stringify(data, null, 2);
        filename += ".json";
        type = "application/json";
    }

    // Create and trigger download
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Analytics exported as ${format.toUpperCase()}`);
  } catch (error) {
    console.error(
      "[AnalyticsService] Failed to export analytics:",
      error.message,
    );
    toast.error("Failed to export analytics");
    throw error;
  }
};

/**
 * Convert data to CSV format
 * @param {Object} data - Data to convert
 * @returns {string} CSV string
 */
const convertToCSV = (data) => {
  const flattenObject = (obj, prefix = "") => {
    const result = {};

    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(result, flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        result[newKey] = JSON.stringify(value);
      } else {
        result[newKey] = value;
      }
    }

    return result;
  };

  const flatData = flattenObject(data);
  const headers = Object.keys(flatData);
  const values = headers.map((header) => flatData[header]);

  const csvRows = [];
  csvRows.push(headers.join(","));
  csvRows.push(values.map((v) => `"${v}"`).join(","));

  return csvRows.join("\n");
};

/**
 * Generate a report
 * @param {Object} options - Report options
 * @returns {Promise<Blob>} PDF blob
 */
export const generateReport = async (options = {}) => {
  const { type = "summary", timeRange = "week" } = options;

  try {
    const data = await getDashboardAnalytics({ timeRange });

    // For PDF generation, you'd need a library like jspdf or react-pdf
    // This is a placeholder that returns HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1976d2; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1976d2; color: white; }
        </style>
      </head>
      <body>
        <h1>Analytics Report - ${type.toUpperCase()}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Time Range: ${timeRange}</p>
        
        <h2>Key Metrics</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Views</td><td>${data.totalViews}</td></tr>
          <tr><td>Active Users</td><td>${data.activeUsers}</td></tr>
          <tr><td>Engagement Rate</td><td>${data.engagementRate}%</td></tr>
          <tr><td>Total Events</td><td>${data.totalEvents}</td></tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    return blob;
  } catch (error) {
    console.error(
      "[AnalyticsService] Failed to generate report:",
      error.message,
    );
    throw error;
  }
};

// ============================================================================
// SERVICE EXPORT
// ============================================================================

const analyticsService = {
  getDashboardAnalytics,
  getUserAnalytics,
  getEventAnalytics,
  getContentAnalytics,
  getInsights,
  getForecasts,
  getAnomalies,
  exportAnalytics,
  generateReport,
};

export default analyticsService;
export { analyticsService };
