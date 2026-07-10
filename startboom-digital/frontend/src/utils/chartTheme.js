// HoneyPot Chart Theme - Premium Color Palette
import { useTheme } from '../context/ThemeContext';

/** 
 * HoneyPot Chart Colors
 * Professional, muted palette - NO bright greens or neon colors
 */
export const getChartColors = (isDark) => ({
  // Grid and axes (subtle)
  grid:       isDark ? 'rgba(232, 227, 213, 0.1)' : '#E8E3D5',
  axis:       isDark ? '#6B6B6B' : '#9CA3AF',
  
  // Tooltips (elegant)
  tooltipBg:  isDark ? '#1E293B' : '#FFFFFF',
  tooltipBorder: isDark ? '#334155' : '#E8E3D5',
  
  // Text
  legend:     isDark ? '#CBD5E1' : '#6B6B6B',
  cursorFill: isDark ? '#334155' : '#FFF9E6',
  labelColor: isDark ? '#CBD5E1' : '#6B6B6B',
  itemColor:  isDark ? '#F8FAFC' : '#2D2A26',
  
  // HoneyPot Premium Chart Palette
  revenue: '#D99A00',     // Honey Gold
  forecast: '#F59E0B',    // Burnt Orange  
  profit: '#4F8A5B',      // Sage Green
  expenses: '#C0392B',    // Warm Red
  activities: '#3B82F6',  // Slate Blue
  goals: '#4F8A5B',       // Sage Green
  clients: '#06B6D4',     // Teal
  deals: '#8B5CF6',       // Deep Plum
  won: '#4F8A5B',         // Sage Green
  lost: '#C0392B',        // Warm Red
  pending: '#D99A00',     // Honey Gold
  active: '#4F8A5B',      // Sage Green
});

/**
 * Get tooltip styling with HoneyPot theme
 */
export const getChartTooltipStyle = (isDark) => ({
  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
  border: `1px solid ${isDark ? '#334155' : '#E8E3D5'}`,
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(45, 42, 38, 0.15)',
  padding: '12px',
});

/**
 * HoneyPot Chart Theme Hook
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
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    itemStyle: { 
      color: colors.itemColor,
      fontSize: '14px',
      fontWeight: 600,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    
    // Grid styling
    gridStyle: {
      strokeDasharray: '3 3',
      stroke: colors.grid,
      opacity: isDark ? 0.3 : 0.5,
    },
    
    // Axis styling
    axisStyle: {
      stroke: colors.axis,
      fontSize: 12,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    
    // Legend styling
    legendStyle: {
      fontSize: '12px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: colors.legend,
    },
  };
};

/**
 * Premium Chart Color Palette (for multi-series charts)
 * Returns array of HoneyPot colors
 */
export const getChartPalette = () => [
  '#D99A00',  // Honey Gold
  '#F59E0B',  // Burnt Orange
  '#3B82F6',  // Slate Blue
  '#4F8A5B',  // Sage Green
  '#06B6D4',  // Teal
  '#8B5CF6',  // Deep Plum
  '#EC4899',  // Pink
  '#10B981',  // Emerald
];

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

export default useChartTheme;
