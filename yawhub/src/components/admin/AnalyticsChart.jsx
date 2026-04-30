import React, { useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush
} from 'recharts';
import { 
  FiDownload, FiZoomIn, FiZoomOut, FiRefreshCw, FiInfo,
  FiTrendingUp, FiBarChart2, FiPieChart, FiActivity,
  FiGrid, FiCircle, FiScatter, FiAward, FiDatabase
} from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/components/AnalyticsChart.css';

// Chart type configurations with professional icons
const CHART_TYPES = {
  line: {
    component: LineChart,
    name: 'Line Chart',
    icon: <FiTrendingUp size={18} />,
    defaultProps: { type: 'monotone', strokeWidth: 2 }
  },
  bar: {
    component: BarChart,
    name: 'Bar Chart',
    icon: <FiBarChart2 size={18} />,
    defaultProps: { radius: [4, 4, 0, 0] }
  },
  area: {
    component: AreaChart,
    name: 'Area Chart',
    icon: <FiActivity size={18} />,
    defaultProps: { type: 'monotone', fillOpacity: 0.3 }
  },
  pie: {
    component: PieChart,
    name: 'Pie Chart',
    icon: <FiPieChart size={18} />,
    defaultProps: { outerRadius: 80, innerRadius: 0 }
  },
  donut: {
    component: PieChart,
    name: 'Donut Chart',
    icon: <FiCircle size={18} />,
    defaultProps: { outerRadius: 80, innerRadius: 50 }
  },
  radar: {
    component: RadarChart,
    name: 'Radar Chart',
    icon: <FiGrid size={18} />,
    defaultProps: {}
  },
  scatter: {
    component: ScatterChart,
    name: 'Scatter Plot',
    icon: <FiScatter size={18} />,
    defaultProps: {}
  }
};

// Color palettes
const COLOR_PALETTES = {
  default: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a', '#06b6d4', '#84cc16'],
  pastel: ['#a5f3fc', '#b9f6ca', '#ffcc80', '#ffab91', '#e1bee7', '#f8bbd0'],
  vibrant: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'],
  monochrome: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7', '#ecf0f1']
};

const AnalyticsChart = ({
  type,
  data,
  title,
  colors = COLOR_PALETTES.default,
  height = 300,
  width = '100%',
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  showBrush = false,
  showDownload = false,
  loading = false,
  error = null,
  xAxisKey = 'name',
  yAxisKey = 'value',
  secondaryYAxisKey = null,
  tooltipFormatter,
  legendFormatter,
  onDataPointClick,
  onBrushChange,
  animations = true,
  stacked = false,
  layout = 'horizontal',
  margin = { top: 20, right: 30, left: 20, bottom: 20 },
  exportFilename = 'chart-export'
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);
  const [brushRange, setBrushRange] = useState(null);

  // Get chart configuration
  const chartConfig = CHART_TYPES[type] || CHART_TYPES.line;
  const ChartComponent = chartConfig.component;

  // Format data for different chart types
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Handle different data structures
    if (type === 'pie' || type === 'donut') {
      return data.map(item => ({
        ...item,
        value: item.value || item[yAxisKey] || 0,
        name: item.name || item[xAxisKey] || ''
      }));
    }

    if (type === 'radar') {
      return data;
    }

    return data;
  }, [data, type, xAxisKey, yAxisKey]);

  // Calculate total for percentage display
  const total = useMemo(() => {
    if (type === 'pie' || type === 'donut') {
      return formattedData.reduce((sum, item) => sum + (item.value || 0), 0);
    }
    return null;
  }, [formattedData, type]);

  // Custom tooltip component
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="chart-custom-tooltip">
        <div className="tooltip-header">
          <strong>{label}</strong>
          {tooltipFormatter && (
            <button 
              className="tooltip-info"
              onClick={() => setSelectedDataPoint(payload[0].payload)}
              aria-label="View details"
            >
              <FiInfo size={12} />
            </button>
          )}
        </div>
        {payload.map((entry, index) => (
          <div key={index} className="tooltip-item">
            <span 
              className="tooltip-color" 
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="tooltip-label">{entry.name}:</span>
            <span className="tooltip-value">
              {tooltipFormatter 
                ? tooltipFormatter(entry.value, entry.name, entry.payload)
                : entry.value?.toLocaleString()}
            </span>
            {total && (
              <span className="tooltip-percentage">
                ({((entry.value / total) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }, [tooltipFormatter, total]);

  // Custom legend component
  const CustomLegend = useCallback(({ payload }) => {
    if (!payload || !payload.length) return null;

    return (
      <div className="chart-custom-legend">
        {payload.map((entry, index) => (
          <div key={index} className="legend-item">
            <span 
              className="legend-color" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="legend-label">
              {legendFormatter 
                ? legendFormatter(entry.value, entry.payload)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }, [legendFormatter]);

  // Handle export as image
  const handleExport = useCallback(async () => {
    const chartElement = document.querySelector('.recharts-wrapper');
    if (!chartElement) return;

    try {
      const svgElement = chartElement.querySelector('svg');
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const png = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${exportFilename}.png`;
        link.href = png;
        link.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [exportFilename]);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setBrushRange(null);
  }, []);

  // Handle data point click
  const handleDataPointClick = useCallback((data, index) => {
    setSelectedDataPoint(data.payload);
    if (onDataPointClick) {
      onDataPointClick(data.payload, index);
    }
  }, [onDataPointClick]);

  // Handle brush change
  const handleBrushChange = useCallback((range) => {
    setBrushRange(range);
    if (onBrushChange) {
      onBrushChange(range);
    }
  }, [onBrushChange]);

  // Loading state
  if (loading) {
    return (
      <div className="analytics-chart loading">
        <div className="chart-container">
          <LoadingSpinner size="medium" text="Loading chart data..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="analytics-chart error">
        <div className="chart-container">
          <div className="error-message">
            <FiInfo size={24} />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!formattedData || formattedData.length === 0) {
    return (
      <div className="analytics-chart empty">
        <div className="chart-container">
          <div className="empty-message">
            <FiDatabase size={48} className="empty-icon" />
            <p>No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`analytics-chart chart-type-${type}`}>
      <div className="chart-header">
        <h3 className="chart-title">
          <span className="chart-icon">{chartConfig.icon}</span>
          {title}
        </h3>
        
        {(showDownload || showBrush) && (
          <div className="chart-controls">
            {showBrush && (
              <>
                <button 
                  onClick={handleZoomIn} 
                  className="control-btn"
                  title="Zoom In"
                  disabled={zoomLevel >= 2}
                  aria-label="Zoom in"
                >
                  <FiZoomIn size={16} />
                </button>
                <button 
                  onClick={handleZoomOut} 
                  className="control-btn"
                  title="Zoom Out"
                  disabled={zoomLevel <= 0.5}
                  aria-label="Zoom out"
                >
                  <FiZoomOut size={16} />
                </button>
                <button 
                  onClick={handleResetZoom} 
                  className="control-btn"
                  title="Reset View"
                  aria-label="Reset view"
                >
                  <FiRefreshCw size={16} />
                </button>
              </>
            )}
            {showDownload && (
              <button 
                onClick={handleExport} 
                className="control-btn"
                title="Export as PNG"
                aria-label="Export chart"
              >
                <FiDownload size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="chart-wrapper" style={{ height: `${height}px`, width }}>
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent
            data={formattedData}
            margin={margin}
            layout={layout}
            onClick={handleDataPointClick}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb"
                vertical={type !== 'bar'}
              />
            )}
            
            {(type !== 'pie' && type !== 'donut' && type !== 'radar') && (
              <>
                <XAxis 
                  dataKey={xAxisKey} 
                  tick={{ fontSize: 12 }}
                  angle={layout === 'horizontal' ? 0 : -45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                {secondaryYAxisKey && (
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                  />
                )}
              </>
            )}

            {type === 'radar' && (
              <>
                <PolarGrid />
                <PolarAngleAxis dataKey={xAxisKey} />
                <PolarRadiusAxis />
              </>
            )}

            {showTooltip && (
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
            )}
            
            {showLegend && (
              <Legend content={<CustomLegend />} verticalAlign="top" height={36} />
            )}

            {showBrush && type !== 'pie' && type !== 'donut' && (
              <Brush 
                dataKey={xAxisKey} 
                height={30}
                stroke="#3b82f6"
                onChange={handleBrushChange}
              />
            )}

            {renderChartContent(
              type,
              formattedData,
              colors,
              yAxisKey,
              secondaryYAxisKey,
              stacked,
              chartConfig.defaultProps,
              animations
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>

      {selectedDataPoint && (
        <div className="data-point-detail">
          <div className="detail-header">
            <FiAward size={18} />
            <strong>Data Point Details</strong>
            <button 
              onClick={() => setSelectedDataPoint(null)}
              aria-label="Close details"
            >
              ×
            </button>
          </div>
          <div className="detail-content">
            {Object.entries(selectedDataPoint).map(([key, value]) => (
              <div key={key} className="detail-field">
                <span className="field-label">{key}:</span>
                <span className="field-value">
                  {typeof value === 'object' ? JSON.stringify(value) : 
                   typeof value === 'number' ? value.toLocaleString() : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to render chart-specific content
const renderChartContent = (
  type,
  data,
  colors,
  yAxisKey,
  secondaryYAxisKey,
  stacked,
  defaultProps,
  animations
) => {
  const isAnimationActive = animations;
  const animationDuration = 500;

  switch (type) {
    case 'line':
      return (
        <Line 
          {...defaultProps}
          dataKey={yAxisKey}
          stroke={colors[0]}
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6 }}
          isAnimationActive={isAnimationActive}
          animationDuration={animationDuration}
        />
      );

    case 'bar':
      return (
        <Bar 
          {...defaultProps}
          dataKey={yAxisKey}
          fill={colors[0]}
          isAnimationActive={isAnimationActive}
          animationDuration={animationDuration}
          stackId={stacked ? 'stack' : undefined}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      );

    case 'area':
      return (
        <Area 
          {...defaultProps}
          dataKey={yAxisKey}
          stroke={colors[0]}
          fill={colors[0]}
          isAnimationActive={isAnimationActive}
          animationDuration={animationDuration}
          stackId={stacked ? 'stack' : undefined}
        />
      );

    case 'pie':
    case 'donut':
      return (
        <Pie
          {...defaultProps}
          data={data}
          dataKey="value"
          nameKey="name"
          label={entry => `${entry.name}: ${entry.value}`}
          labelLine={true}
          isAnimationActive={isAnimationActive}
          animationDuration={animationDuration}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      );

    case 'radar':
      return (
        <Radar
          dataKey={yAxisKey}
          stroke={colors[0]}
          fill={colors[0]}
          fillOpacity={0.6}
          isAnimationActive={isAnimationActive}
          animationDuration={animationDuration}
        />
      );

    case 'scatter':
      return (
        <Scatter
          data={data}
          fill={colors[0]}
          isAnimationActive={isAnimationActive}
          animationDuration={animationDuration}
        />
      );

    default:
      return null;
  }
};

// PropTypes for type checking
AnalyticsChart.propTypes = {
  type: PropTypes.oneOf(['line', 'bar', 'area', 'pie', 'donut', 'radar', 'scatter']).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  title: PropTypes.string.isRequired,
  colors: PropTypes.arrayOf(PropTypes.string),
  height: PropTypes.number,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  showLegend: PropTypes.bool,
  showTooltip: PropTypes.bool,
  showGrid: PropTypes.bool,
  showBrush: PropTypes.bool,
  showDownload: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
  xAxisKey: PropTypes.string,
  yAxisKey: PropTypes.string,
  secondaryYAxisKey: PropTypes.string,
  tooltipFormatter: PropTypes.func,
  legendFormatter: PropTypes.func,
  onDataPointClick: PropTypes.func,
  onBrushChange: PropTypes.func,
  animations: PropTypes.bool,
  stacked: PropTypes.bool,
  layout: PropTypes.oneOf(['horizontal', 'vertical']),
  margin: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    left: PropTypes.number,
    bottom: PropTypes.number
  }),
  exportFilename: PropTypes.string
};

AnalyticsChart.defaultProps = {
  colors: COLOR_PALETTES.default,
  height: 300,
  width: '100%',
  showLegend: true,
  showTooltip: true,
  showGrid: true,
  showBrush: false,
  showDownload: false,
  loading: false,
  error: null,
  xAxisKey: 'name',
  yAxisKey: 'value',
  secondaryYAxisKey: null,
  animations: true,
  stacked: false,
  layout: 'horizontal',
  margin: { top: 20, right: 30, left: 20, bottom: 20 },
  exportFilename: 'chart-export'
};

export default React.memo(AnalyticsChart);