// HoneyPot CRM - Enterprise Chart Theme
// NEVER use all honey gold - use curated palette
import { useTheme } from '../context/ThemeContext';

/** 
 * Enterprise Chart Colors - Strategic Use of Honey Gold
 * Professional, varied palette - revenue gets gold, others get distinctive colors
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
  
  // Core Metrics (Enterprise Spec - NEVER all gold)
  revenue: '#D89A00',     // Honey Amber (primary metric only)
  forecast: '#64748B',    // Slate Blue
  users: '#0EA5E9',       // Sky Blue
  activities: '#10B981',  // Sage Green
  profit: '#059669',      // Emerald
  expenses: '#D97706',    // Copper
  alerts: '#F97316',      // Coral
  goals: '#8B5CF6',       // Purple
  clients: '#0EA5E9',     // Sky Blue
  deals: '#64748B',       // Slate Blue
  
  // Status colors
  won: '#10B981',         // Sage Green
  lost: '#EF4444',        // Red
  pending: '#F59E0B',     // Amber
  open: '#0EA5E9',        // Sky Blue
  active: '#10B981',      // Sage Green
  inactive: '#64748B',    // Slate
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
 * Enterprise Chart Color Palette (for multi-series charts)
 * NEVER use all honey gold - strategic variety
 */
export const getChartPalette = () => [
  '#D89A00',  // Honey Amber (use sparingly)
  '#64748B',  // Slate Blue
  '#0EA5E9',  // Sky Blue
  '#10B981',  // Sage Green
  '#8B5CF6',  // Purple
  '#F97316',  // Coral
  '#059669',  // Emerald
  '#D97706',  // Copper
];

/**
 * Get specific chart color by metric name
 */
export const getMetricColor = (metric, isDark = false) => {
  const colors = getChartColors(isDark);
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
