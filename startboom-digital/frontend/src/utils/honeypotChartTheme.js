// HoneyPot Chart Theme - Premium Color Palette
// Curated colors for professional charts

import HONEYPOT_COLORS from './honeypotColors';

/**
 * Get HoneyPot chart theme based on current theme mode
 */
export const useHoneypotChartTheme = (isDark = false) => {
  return {
    // Grid styling
    grid: {
      strokeDasharray: '3 3',
      stroke: isDark ? 'rgba(232, 227, 213, 0.1)' : HONEYPOT_COLORS.lightGray,
      opacity: isDark ? 0.3 : 0.5,
    },
    
    // Axis styling
    axis: {
      stroke: isDark ? '#6B6B6B' : HONEYPOT_COLORS.slateGray,
      fontSize: 12,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    
    // Tooltip styling
    tooltipStyle: {
      backgroundColor: isDark ? '#1E293B' : HONEYPOT_COLORS.whiteCard,
      border: `1px solid ${isDark ? '#334155' : HONEYPOT_COLORS.lightGray}`,
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(45, 42, 38, 0.15)',
      padding: '12px',
    },
    
    // Tooltip label styling
    labelStyle: {
      color: isDark ? '#CBD5E1' : HONEYPOT_COLORS.slateGray,
      fontSize: '12px',
      fontWeight: 500,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    
    // Tooltip item styling
    itemStyle: {
      color: isDark ? '#F8FAFC' : HONEYPOT_COLORS.charcoal,
      fontSize: '14px',
      fontWeight: 600,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    
    // Legend styling
    legendStyle: {
      fontSize: '12px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: isDark ? '#CBD5E1' : HONEYPOT_COLORS.slateGray,
    },
  };
};

/**
 * HoneyPot Premium Chart Colors
 * Curated palette - no bright greens or neon colors
 */
export const CHART_COLORS = {
  // Revenue & Financial
  revenue: HONEYPOT_COLORS.honeyGold,      // #D99A00
  profit: HONEYPOT_COLORS.success,         // #4F8A5B
  expenses: HONEYPOT_COLORS.danger,        // #C0392B
  forecast: HONEYPOT_COLORS.burntOrange,   // #F59E0B
  
  // Sales & Deals
  deals: HONEYPOT_COLORS.charts.deals,     // #8B5CF6 (Deep Plum)
  pipeline: HONEYPOT_COLORS.charts.clients,// #06B6D4 (Teal)
  won: HONEYPOT_COLORS.success,            // #4F8A5B
  lost: HONEYPOT_COLORS.danger,            // #C0392B
  
  // Activities & Engagement
  activities: HONEYPOT_COLORS.charts.activities, // #3B82F6 (Slate Blue)
  calls: HONEYPOT_COLORS.info,             // #3B82F6
  emails: HONEYPOT_COLORS.charts.clients,  // #06B6D4
  meetings: HONEYPOT_COLORS.charts.deals,  // #8B5CF6
  
  // Goals & Performance
  goals: HONEYPOT_COLORS.success,          // #4F8A5B
  onTrack: HONEYPOT_COLORS.success,        // #4F8A5B
  atRisk: HONEYPOT_COLORS.warning,         // #D99A00
  behind: HONEYPOT_COLORS.danger,          // #C0392B
  
  // Clients & Leads
  clients: HONEYPOT_COLORS.charts.clients,  // #06B6D4
  leads: HONEYPOT_COLORS.charts.activities, // #3B82F6
  prospects: HONEYPOT_COLORS.burntOrange,   // #F59E0B
  active: HONEYPOT_COLORS.success,          // #4F8A5B
};

/**
 * Multi-series chart palette
 * For charts with multiple data series
 */
export const SERIES_COLORS = [
  HONEYPOT_COLORS.honeyGold,    // #D99A00 - Honey Gold
  HONEYPOT_COLORS.burntOrange,  // #F59E0B - Burnt Orange
  HONEYPOT_COLORS.charts.activities, // #3B82F6 - Slate Blue
  HONEYPOT_COLORS.success,      // #4F8A5B - Sage Green
  HONEYPOT_COLORS.charts.clients,    // #06B6D4 - Teal
  HONEYPOT_COLORS.charts.deals,      // #8B5CF6 - Deep Plum
  '#EC4899',                    // Pink
  '#10B981',                    // Emerald
];

/**
 * Pie/Donut chart colors
 * Professional muted palette
 */
export const PIE_COLORS = [
  HONEYPOT_COLORS.honeyGold,    // Primary
  HONEYPOT_COLORS.burntOrange,  // Secondary
  HONEYPOT_COLORS.success,      // Success
  HONEYPOT_COLORS.charts.activities, // Info
  HONEYPOT_COLORS.charts.clients,    // Accent 1
  HONEYPOT_COLORS.charts.deals,      // Accent 2
  HONEYPOT_COLORS.slateGray,    // Neutral
  HONEYPOT_COLORS.danger,       // Danger
];

/**
 * Status-based colors for charts
 */
export const STATUS_CHART_COLORS = {
  completed: HONEYPOT_COLORS.success,   // #4F8A5B
  active: HONEYPOT_COLORS.info,         // #3B82F6
  pending: HONEYPOT_COLORS.warning,     // #D99A00
  overdue: HONEYPOT_COLORS.danger,      // #C0392B
  cancelled: HONEYPOT_COLORS.slateGray, // #6B6B6B
};

/**
 * Format currency for charts (UGX)
 */
export const formatChartCurrency = (value) => {
  return `UGX ${Number(value || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
};

/**
 * Format percentage for charts
 */
export const formatChartPercentage = (value) => {
  return `${Number(value || 0).toFixed(1)}%`;
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
 * Custom tooltip formatter
 */
export const customTooltipFormatter = (value, name, props, isDark = false) => {
  const colors = STATUS_CHART_COLORS;
  const color = colors[name?.toLowerCase()] || HONEYPOT_COLORS.honeyGold;
  
  return [
    `<span style="color: ${color}; font-weight: 600;">${formatChartCurrency(value)}</span>`,
    name
  ];
};

/**
 * Get gradient definition for area charts
 */
export const getChartGradient = (color = HONEYPOT_COLORS.honeyGold) => {
  return {
    id: 'colorGradient',
    x1: '0',
    y1: '0',
    x2: '0',
    y2: '1',
    stops: [
      { offset: '0%', stopColor: color, stopOpacity: 0.3 },
      { offset: '95%', stopColor: color, stopOpacity: 0 },
    ],
  };
};

export default {
  useHoneypotChartTheme,
  CHART_COLORS,
  SERIES_COLORS,
  PIE_COLORS,
  STATUS_CHART_COLORS,
  formatChartCurrency,
  formatChartPercentage,
  formatChartNumber,
  customTooltipFormatter,
  getChartGradient,
};
