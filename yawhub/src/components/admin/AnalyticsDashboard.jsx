// src/components/analytics/AnalyticsDashboard.jsx - FULLY UPDATED
import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import {
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiPercent,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiGlobe,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/components/AnalyticsDashboard.css";

// ============================================
// CONSTANTS
// ============================================

const DATE_RANGES = {
  week: { label: "Last 7 Days", days: 7 },
  month: { label: "Last 30 Days", days: 30 },
  quarter: { label: "Last 90 Days", days: 90 },
  year: { label: "Last 12 Months", days: 365 },
};

const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981",
  tertiary: "#f59e0b",
  quaternary: "#ef4444",
  quinary: "#8b5cf6",
  senary: "#ec489a",
};

const DEVICE_ICONS = {
  desktop: <FiMonitor size={16} />,
  mobile: <FiSmartphone size={16} />,
  tablet: <FiTablet size={16} />,
  other: <FiGlobe size={16} />,
};

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

// ============================================
// SUB-COMPONENTS
// ============================================

// Loading Spinner Component
const LoadingSpinner = ({ size = "medium", text = "Loading..." }) => {
  return (
    <div className="loading-container">
      <div className={`loading-spinner loading-spinner-${size}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

// Error Alert Component
const ErrorAlert = ({ type = "error", message, onClose }) => {
  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-content">
        <span className="alert-icon">⚠️</span>
        <span className="alert-message">{message}</span>
      </div>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

// Date Range Picker Component
const DateRangePicker = ({ onRangeChange, className = "" }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = () => {
    if (startDate && endDate) {
      onRangeChange(startDate, endDate);
      setIsOpen(false);
    }
  };

  return (
    <div className={`date-range-picker ${className}`}>
      <button
        className="date-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiCalendar size={14} />
        Custom Range
      </button>
      {isOpen && (
        <div className="date-picker-dropdown">
          <div className="date-picker-fields">
            <div className="date-field">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="date-field">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <button className="apply-btn" onClick={handleApply}>
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

// Export Button Component
const ExportButton = ({
  onExport,
  formats = ["json", "csv"],
  children,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format) => {
    onExport(format);
    setIsOpen(false);
  };

  return (
    <div className={`export-dropdown ${className}`}>
      <button className="export-trigger" onClick={() => setIsOpen(!isOpen)}>
        {children || (
          <>
            <FiDownload /> Export
          </>
        )}
      </button>
      {isOpen && (
        <div className="export-dropdown-menu">
          {formats.map((format) => (
            <button key={format} onClick={() => handleExport(format)}>
              Export as {format.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="tooltip-title">{label}</div>
        {payload.map((entry, index) => (
          <div key={index} className="tooltip-item">
            <span
              className="tooltip-color"
              style={{ backgroundColor: entry.color }}
            />
            <span className="tooltip-name">{entry.name}:</span>
            <span className="tooltip-value">
              {entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================
// MAIN COMPONENT
// ============================================

const AnalyticsDashboard = ({
  onExport,
  autoRefresh = false,
  refreshInterval = 30000,
}) => {
  // State management
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("month");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(["views", "visitors"]);
  const [chartType, setChartType] = useState("line");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Mock data for demo (replace with actual API call)
  const getMockAnalyticsData = () => {
    return {
      summary: {
        totalViews: 45678,
        viewsChange: 12.5,
        uniqueVisitors: 12345,
        visitorsChange: 8.3,
        avgSessionDuration: 4.2,
        sessionDurationChange: -2.1,
        bounceRate: 35.8,
        bounceRateChange: -5.4,
      },
      charts: {
        pageViews: Array.from({ length: 30 }, (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          views: Math.floor(Math.random() * 2000) + 1000,
          visitors: Math.floor(Math.random() * 1000) + 500,
          sessions: Math.floor(Math.random() * 1500) + 800,
        })),
        popularContent: [
          { title: "Home Page", views: 12500 },
          { title: "Events Calendar", views: 8900 },
          { title: "Notices", views: 7600 },
          { title: "Student Portal", views: 6500 },
          { title: "Contact Us", views: 4300 },
          { title: "About Us", views: 3200 },
        ],
        deviceStats: [
          { name: "Desktop", value: 45 },
          { name: "Mobile", value: 40 },
          { name: "Tablet", value: 15 },
        ],
        acquisitionSources: [
          { name: "Direct", value: 35 },
          { name: "Organic Search", value: 30 },
          { name: "Social Media", value: 20 },
          { name: "Referral", value: 10 },
          { name: "Email", value: 5 },
        ],
      },
      realtime: {
        activeUsers: 234,
        viewsPerMinute: 45,
        avgResponseTime: 120,
      },
    };
  };

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      const response = getMockAnalyticsData();
      setData(response);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch analytics data");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    fetchAnalytics();

    let interval;
    if (autoRefresh) {
      interval = setInterval(() => fetchAnalytics(true), refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchAnalytics, autoRefresh, refreshInterval]);

  // Handle date range change
  const handleDateRangeChange = useCallback((range) => {
    setDateRange(range);
    setCustomDateRange(null);
  }, []);

  // Handle custom date range
  const handleCustomDateRange = useCallback((startDate, endDate) => {
    setCustomDateRange({ start: startDate, end: endDate });
    setDateRange("custom");
  }, []);

  // Handle export data
  const handleExport = useCallback(
    async (format) => {
      try {
        const exportData = {
          summary: data?.summary,
          charts: data?.charts,
          dateRange: dateRange,
          exportedAt: new Date().toISOString(),
        };

        if (onExport) {
          await onExport(exportData, format);
        } else {
          // Default export as JSON
          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `analytics-${new Date().toISOString()}.${format}`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        setError("Failed to export data");
        console.error("Export error:", err);
      }
    },
    [data, dateRange, onExport],
  );

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data?.summary) return null;

    return [
      {
        title: "Total Views",
        value: data.summary.totalViews,
        change: data.summary.viewsChange,
        icon: <FiTrendingUp size={24} />,
        color: "primary",
        format: "number",
      },
      {
        title: "Unique Visitors",
        value: data.summary.uniqueVisitors,
        change: data.summary.visitorsChange,
        icon: <FiUsers size={24} />,
        color: "secondary",
        format: "number",
      },
      {
        title: "Avg. Session Duration",
        value: data.summary.avgSessionDuration,
        change: data.summary.sessionDurationChange,
        icon: <FiClock size={24} />,
        color: "tertiary",
        format: "time",
        suffix: " min",
      },
      {
        title: "Bounce Rate",
        value: data.summary.bounceRate,
        change: data.summary.bounceRateChange,
        icon: <FiPercent size={24} />,
        color: "quaternary",
        format: "percentage",
        suffix: "%",
      },
    ];
  }, [data]);

  // Format value based on type
  const formatValue = useCallback((value, format, suffix = "") => {
    if (format === "number") {
      return value?.toLocaleString() || "0";
    }
    if (format === "percentage") {
      return `${value?.toFixed(1) || 0}${suffix}`;
    }
    if (format === "time") {
      return `${value?.toFixed(1) || 0}${suffix}`;
    }
    return value;
  }, []);

  // Loading state
  if (loading && !data) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-loading">
          <LoadingSpinner size="large" text="Loading analytics data..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-error">
          <ErrorAlert type="error" message={error} />
          <button onClick={() => fetchAnalytics()} className="retry-btn">
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="analytics-dashboard"
    >
      {/* Header Section */}
      <motion.div variants={fadeInUp}>
        <div className="analytics-header">
          <div className="header-left">
            <h1>Analytics Dashboard</h1>
            {lastUpdated && (
              <span className="last-updated">
                <FiClock size={14} />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="header-controls">
            <div className="date-controls">
              <div className="date-range-buttons">
                {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => handleDateRangeChange(key)}
                    className={`date-btn ${dateRange === key ? "active" : ""}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <DateRangePicker
                onRangeChange={handleCustomDateRange}
                className="custom-date-picker"
              />
            </div>

            <div className="action-buttons">
              <button
                onClick={() => fetchAnalytics(true)}
                className="refresh-btn"
                disabled={refreshing}
              >
                <FiRefreshCw className={refreshing ? "spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <ExportButton
                onExport={handleExport}
                formats={["json", "csv"]}
                className="export-btn"
              >
                <FiDownload /> Export
              </ExportButton>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {summaryStats && (
        <motion.div variants={staggerContainer} className="analytics-summary">
          {summaryStats.map((stat, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              whileHover={{ y: -4 }}
              className={`summary-card card-${stat.color}`}
            >
              <div className="card-header">
                <div className="card-icon">{stat.icon}</div>
                <div className="card-title">{stat.title}</div>
              </div>
              <div className="card-value">
                {formatValue(stat.value, stat.format, stat.suffix)}
              </div>
              {stat.change !== undefined && (
                <div
                  className={`card-change ${stat.change >= 0 ? "positive" : "negative"}`}
                >
                  {stat.change >= 0 ? <FiArrowUp /> : <FiArrowDown />}
                  {Math.abs(stat.change).toFixed(1)}% from previous period
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Charts Section */}
      {data?.charts && (
        <div className="analytics-charts">
          {/* Main Chart - Page Views */}
          <motion.div
            variants={fadeInUp}
            className="chart-container main-chart"
          >
            <div className="chart-header">
              <h3>Traffic Overview</h3>
              <div className="chart-controls">
                <div className="metric-selector">
                  {["views", "visitors", "sessions"].map((metric) => (
                    <label key={metric} className="metric-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMetrics([...selectedMetrics, metric]);
                          } else {
                            setSelectedMetrics(
                              selectedMetrics.filter((m) => m !== metric),
                            );
                          }
                        }}
                      />
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}
                    </label>
                  ))}
                </div>
                <div className="chart-type-selector">
                  {["line", "area", "bar"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setChartType(type)}
                      className={`chart-type-btn ${chartType === type ? "active" : ""}`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              {chartType === "line" && (
                <LineChart data={data.charts.pageViews}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {selectedMetrics.includes("views") && (
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Page Views"
                    />
                  )}
                  {selectedMetrics.includes("visitors") && (
                    <Line
                      type="monotone"
                      dataKey="visitors"
                      stroke={CHART_COLORS.secondary}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Unique Visitors"
                    />
                  )}
                  {selectedMetrics.includes("sessions") && (
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke={CHART_COLORS.tertiary}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Sessions"
                    />
                  )}
                  <Brush
                    dataKey="date"
                    height={30}
                    stroke={CHART_COLORS.primary}
                  />
                </LineChart>
              )}

              {chartType === "area" && (
                <AreaChart data={data.charts.pageViews}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {selectedMetrics.includes("views") && (
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke={CHART_COLORS.primary}
                      fill={CHART_COLORS.primary}
                      fillOpacity={0.3}
                      name="Page Views"
                    />
                  )}
                  {selectedMetrics.includes("visitors") && (
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke={CHART_COLORS.secondary}
                      fill={CHART_COLORS.secondary}
                      fillOpacity={0.3}
                      name="Unique Visitors"
                    />
                  )}
                </AreaChart>
              )}

              {chartType === "bar" && (
                <BarChart data={data.charts.pageViews}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {selectedMetrics.includes("views") && (
                    <Bar
                      dataKey="views"
                      fill={CHART_COLORS.primary}
                      name="Page Views"
                    />
                  )}
                  {selectedMetrics.includes("visitors") && (
                    <Bar
                      dataKey="visitors"
                      fill={CHART_COLORS.secondary}
                      name="Unique Visitors"
                    />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </motion.div>

          {/* Popular Content Chart */}
          <motion.div variants={fadeInUp} className="chart-container">
            <h3>Popular Content</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={data.charts.popularContent}
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="title"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="views"
                  fill={CHART_COLORS.secondary}
                  radius={[0, 4, 4, 0]}
                >
                  {data.charts.popularContent.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`${CHART_COLORS.secondary}${Math.min(100, 50 + index * 10)}`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Two Column Layout for Pie Charts */}
          <div className="charts-grid">
            <motion.div variants={fadeInUp} className="chart-container">
              <h3>Device Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.charts.deviceStats}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.charts.deviceStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          Object.values(CHART_COLORS)[
                            index % Object.values(CHART_COLORS).length
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span className="legend-item">
                        {DEVICE_ICONS[value.toLowerCase()] ||
                          DEVICE_ICONS.other}
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div variants={fadeInUp} className="chart-container">
              <h3>Acquisition Sources</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.charts.acquisitionSources}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.charts.acquisitionSources.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          Object.values(CHART_COLORS)[
                            index % Object.values(CHART_COLORS).length
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Real-time Stats */}
          {data.realtime && (
            <motion.div variants={fadeInUp} className="realtime-stats">
              <h3>Real-time Activity</h3>
              <div className="realtime-metrics">
                <div className="realtime-card">
                  <FiUsers />
                  <span className="realtime-value">
                    {data.realtime.activeUsers}
                  </span>
                  <span className="realtime-label">Active Users</span>
                </div>
                <div className="realtime-card">
                  <FiTrendingUp />
                  <span className="realtime-value">
                    {data.realtime.viewsPerMinute}
                  </span>
                  <span className="realtime-label">Views/Min</span>
                </div>
                <div className="realtime-card">
                  <FiClock />
                  <span className="realtime-value">
                    {data.realtime.avgResponseTime}ms
                  </span>
                  <span className="realtime-label">Response Time</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

AnalyticsDashboard.propTypes = {
  onExport: PropTypes.func,
  autoRefresh: PropTypes.bool,
  refreshInterval: PropTypes.number,
};

AnalyticsDashboard.defaultProps = {
  autoRefresh: false,
  refreshInterval: 30000,
};

export default React.memo(AnalyticsDashboard);
