// HoneyPot CRM - Analytics Palette (Data Visualization)
// Semantic colors chosen for READABILITY and MEANING, not branding
// Brand color (Honey Gold) reserved ONLY for revenue/money/success
import { useTheme } from '../context/ThemeContext';

/** 
 * HoneyPot Analytics Palette - Official Data Visualization Colors
 * 
 * PHILOSOPHY: Enterprise software fails when they use one brand color everywhere.
 * This palette uses SEMANTIC colors (data type = specific color) for clarity.
 * 
 * RULE: Only use Honey Gold (#D89A00) for:
 * - Revenue
 * - Money/Financial metrics
 * - Primary success indicators
 * - Goal achievements
 * 
 * Everything else uses colors chosen for readability and psychological meaning.
 */
export const ANALYTICS_PALETTE = {
  // Financial (Honey Gold - BRAND SIGNATURE)
  revenue: '#D89A00',        // Honey Amber - Your signature. Reserve for money.
  revenueHover: '#C18400',   // Darker honey for hover states
  
  // Sales & Commercial
  sales: '#4F6BED',          // Slate Blue - Professional, trustworthy
  customers: '#10B981',      // Emerald - Growth, healthy customer base
  
  // Forecasting & Predictions
  forecast: '#38BDF8',       // Sky Blue - Future-looking, optimistic
  target: '#94A3B8',         // Slate Grey - Baseline comparisons
  
  // Performance & Analytics
  performance: '#8B5CF6',    // Violet - High-level analytics
  activities: '#6366F1',     // Indigo - Neutral operational data
  
  // Costs & Resources
  expenses: '#B87333',       // Copper - Cost without looking alarming
  
  // Alerts & Attention
  alerts: '#E76F51',         // Coral - Attention without harsh red
  
  // Goals & Progress
  goals: '#5B8A72',          // Sage Green - Calm progress and targets
  
  // Deal Pipeline Stages (gentle progression)
  lead: '#38BDF8',           // Sky Blue - Early stage
  qualified: '#4F6BED',      // Slate Blue - Moving forward
  proposal: '#6366F1',       // Indigo - Deepening engagement
  negotiation: '#D89A00',    // Honey Amber - Close to money
  won: '#10B981',            // Emerald - Success
  lost: '#E76F51',           // Coral - Lost (softer than harsh red)
  
  // Status colors (semantic)
  success: '#10B981',        // Emerald
  warning: '#F59E0B',        // Amber
  error: '#EF4444',          // Red (only for real errors)
  info: '#38BDF8',           // Sky Blue
  neutral: '#94A3B8',        // Slate Grey
  
  // Multi-series palette (for agent comparisons, etc.)
  // Each agent/region gets a unique color - NEVER all gold
  series: [
    '#4F6BED',  // Slate Blue (primary series)
    '#10B981',  // Emerald (secondary series)
    '#8B5CF6',  // Violet
    '#38BDF8',  // Sky Blue
    '#E76F51',  // Coral
    '#5B8A72',  // Sage Green
    '#B87333',  // Copper
    '#D89A00',  // Honey Amber (use last - reserve for top performer)
  ],
};

/** 
 * Get Chart Theme Colors with Analytics Palette
 */
export const getChartColors = (isDark) => ({
  // Grid and axes (subtle, reduced opacity)
  grid:       isDark ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.5)',
  axis:       isDark ? '#64748B' : '#94A3B8',
  
  // Tooltips (enterprise styling)
  tooltipBg:  isDark ? '#1E293B' : '#FFFFFF',
  tooltipBorder: isDark ? '#334155' : '#E2E8F0',
  
  // Text
  legend:     isDark ? '#CBD5E1' : '#475569',
  cursorFill: isDark ? '#334155' : '#F8FAFC',
  labelColor: isDark ? '#94A3B8' : '#64748B',
  itemColor:  isDark ? '#F8FAFC' : '#0F172A',
  
  // Analytics Palette (semantic colors)
  ...ANALYTICS_PALETTE,
});

/**
 * Get tooltip styling with enterprise theme
 */
export const getChartTooltipStyle = (isDark) => ({
  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
  border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
  borderRadius: '12px',
  boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(15,23,42,0.1)',
  padding: '12px',
});

/**
 * Enterprise Chart Theme Hook
 * Use this in all dashboard charts for consistent styling
 */
export const useChartTheme = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const colors = getChartColors(isDark);
  
  return {
    isDark,
    
    // Colors
    ...colors,
    
    // Tooltip styling
    tooltipStyle: getChartTooltipStyle(isDark),
    labelStyle: { 
      color: colors.labelColor,
      fontSize: '12px',
      fontWeight: 500,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    itemStyle: { 
      color: colors.itemColor,
      fontSize: '13px',
      fontWeight: 600,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    
    // Grid styling (reduced opacity per spec)
    gridStyle: {
      strokeDasharray: '3 3',
      stroke: colors.grid,
      opacity: 1, // Opacity already in color
    },
    
    // Axis styling
    axisStyle: {
      stroke: colors.axis,
      fontSize: 12,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    
    // Legend styling
    legendStyle: {
      fontSize: '12px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: colors.legend,
    },
  };
};

/**
 * Multi-Series Chart Palette (for agent comparisons, regional data, etc.)
 * ORDERED BY PRIORITY: Primary series gets Slate Blue, top performer gets Honey Gold
 * 
 * USAGE RULE: Use this for leaderboards, agent comparisons, multi-region charts
 * The last color (Honey Gold) should be reserved for the top performer or primary highlight
 */
export const getChartPalette = () => ANALYTICS_PALETTE.series;

/**
 * Get specific chart color by metric name (semantic mapping)
 * 
 * RETURNS: The correct semantic color for any data type
 * DEFAULT: Returns revenue color (Honey Gold) if metric not found
 */
export const getMetricColor = (metric, isDark = false) => {
  const colors = getChartColors(isDark);
  
  // Normalize metric name
  const normalized = metric?.toLowerCase().trim();
  
  // Financial metrics → Honey Gold
  if (['revenue', 'money', 'income', 'earnings', 'payment'].includes(normalized)) {
    return colors.revenue;
  }
  
  // Sales metrics → Slate Blue
  if (['sales', 'deals', 'transactions'].includes(normalized)) {
    return colors.sales;
  }
  
  // Customer metrics → Emerald
  if (['customers', 'clients', 'users'].includes(normalized)) {
    return colors.customers;
  }
  
  // Forecast metrics → Sky Blue
  if (['forecast', 'projection', 'estimate', 'predicted'].includes(normalized)) {
    return colors.forecast;
  }
  
  // Performance metrics → Violet
  if (['performance', 'efficiency', 'productivity'].includes(normalized)) {
    return colors.performance;
  }
  
  // Activity metrics → Indigo
  if (['activities', 'actions', 'tasks', 'events'].includes(normalized)) {
    return colors.activities;
  }
  
  // Cost metrics → Copper
  if (['expenses', 'costs', 'spending'].includes(normalized)) {
    return colors.expenses;
  }
  
  // Goals → Sage Green
  if (['goals', 'targets', 'objectives'].includes(normalized)) {
    return colors.goals;
  }
  
  // Alerts → Coral
  if (['alerts', 'warnings', 'issues'].includes(normalized)) {
    return colors.alerts;
  }
  
  return colors[metric] || colors.revenue;
};

/**
 * Format currency for charts (UGX)
 */
export const formatChartCurrency = (value) => {
  return `UGX ${Number(value || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
};

/**
 * Format number with K/M suffix
 */
export const formatChartNumber = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

/**
 * Format percentage
 */
export const formatChartPercentage = (value) => {
  return `${Number(value || 0).toFixed(1)}%`;
};

export default useChartTheme;
