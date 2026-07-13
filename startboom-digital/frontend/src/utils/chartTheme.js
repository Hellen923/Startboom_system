// HoneyPot CRM - Analytics Palette (Data Visualization)
// Semantic colors chosen for READABILITY and MEANING, not branding
// Brand color (Honey Gold) reserved ONLY for revenue/money/success
import { useTheme } from '../context/ThemeContext';

/** 
 * HoneyPot Analytics Palette - Professional Enterprise Data Visualization
 * 
 * DESIGN PHILOSOPHY:
 * "HoneyPot = premium business platform" NOT "HoneyPot = yellow everywhere"
 * 
 * Gold is the SIGNATURE ACCENT for:
 * ✓ Buttons, highlights, active navigation, branding
 * ✗ NOT for dominating charts and analytics
 * 
 * CORE PRINCIPLE: Different metrics = Different semantic colors
 * This makes charts instantly readable and feels like Stripe, Linear, Notion, Attio, HubSpot.
 * 
 * THE RULE: Honey Gold is REMOVED from most charts.
 * Charts should feel intelligent and refined, not colorful.
 */
export const ANALYTICS_PALETTE = {
  // === PRIMARY DATA METRICS (Professional Blues & Greens) ===
  
  // Revenue & Financial Performance
  revenue: '#4F6BED',        // Slate Blue - Professional, trustworthy (NOT gold)
  profit: '#10B981',         // Emerald - Growth, success
  
  // Sales & Commercial Activity  
  sales: '#4F6BED',          // Slate Blue - Matches revenue for consistency
  deals: '#4F6BED',          // Slate Blue - Professional data
  
  // Customers & Users
  customers: '#38BDF8',      // Sky Blue - User-focused, optimistic
  users: '#38BDF8',          // Sky Blue - Customer metrics
  
  // Performance & Analytics
  performance: '#8B5CF6',    // Violet - High-level analytics
  activities: '#6366F1',     // Indigo - Operational data
  
  // === FORECASTING & PREDICTIONS ===
  forecast: '#6366F1',       // Indigo - Future-looking intelligence
  target: '#94A3B8',         // Slate Grey - Baseline comparisons
  
  // === GOALS & PROGRESS ===
  goals: '#8B5CF6',          // Violet - Productivity & achievements
  productivity: '#8B5CF6',   // Violet - Performance tracking
  
  // === COSTS & RESOURCES ===
  expenses: '#B87333',       // Copper - Cost without alarm
  
  // === ALERTS & CRITICAL STATUS ===
  alerts: '#E76F51',         // Coral Red - Attention (softer than harsh red)
  warnings: '#E76F51',       // Coral Red - Issues
  
  // === DEAL PIPELINE STAGES (Gentle color progression) ===
  lead: '#38BDF8',           // Sky Blue - Early stage, exploration
  qualified: '#4F6BED',      // Slate Blue - Moving forward
  proposal: '#6366F1',       // Indigo - Deepening engagement
  negotiation: '#F59E0B',    // Amber - Critical stage (NOT honey gold)
  won: '#10B981',            // Emerald - Success, completed
  lost: '#E76F51',           // Coral - Lost (softer than harsh red)
  
  // === STATUS INDICATORS (Semantic colors) ===
  success: '#10B981',        // Emerald - Completed, won, active
  active: '#4F6BED',         // Slate Blue - In progress (NOT yellow)
  pending: '#F59E0B',        // Amber - Awaiting action
  error: '#EF4444',          // Red - Real errors only
  info: '#38BDF8',           // Sky Blue - Informational
  neutral: '#94A3B8',        // Slate Grey - Inactive, baseline
  inactive: '#94A3B8',       // Slate Grey - Disabled state
  
  // === MULTI-SERIES PALETTE (Agent comparisons, regional data) ===
  // Ordered by visual harmony - NO bright yellow
  series: [
    '#4F6BED',  // Slate Blue (primary)
    '#10B981',  // Emerald (secondary) 
    '#38BDF8',  // Sky Blue
    '#8B5CF6',  // Violet
    '#6366F1',  // Indigo
    '#5B8A72',  // Sage Green
    '#B87333',  // Copper
    '#E76F51',  // Coral
  ],
  
  // === BRAND ACCENT (Use SPARINGLY - only for KPI highlights, not charts) ===
  brandAccent: 'var(--primary-color)',    // Honey Gold - ONLY for brand moments
  brandHover: 'var(--primary-hover)',     // Darker honey for interactions
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
 * DEFAULT: Returns Slate Blue (professional data color) if metric not found
 */
export const getMetricColor = (metric, isDark = false) => {
  const colors = getChartColors(isDark);
  
  // Normalize metric name
  const normalized = metric?.toLowerCase().trim();
  
  // Revenue & Financial → Slate Blue (NOT gold - data should feel professional)
  if (['revenue', 'money', 'income', 'earnings', 'payment'].includes(normalized)) {
    return colors.revenue;
  }
  
  // Sales & Deals → Slate Blue (professional data)
  if (['sales', 'deals', 'transactions'].includes(normalized)) {
    return colors.sales;
  }
  
  // Customer & User metrics → Sky Blue
  if (['customers', 'clients', 'users'].includes(normalized)) {
    return colors.customers;
  }
  
  // Forecast & Predictions → Indigo
  if (['forecast', 'projection', 'estimate', 'predicted'].includes(normalized)) {
    return colors.forecast;
  }
  
  // Performance & Analytics → Violet
  if (['performance', 'efficiency', 'productivity'].includes(normalized)) {
    return colors.performance;
  }
  
  // Activity & Operations → Indigo
  if (['activities', 'actions', 'tasks', 'events'].includes(normalized)) {
    return colors.activities;
  }
  
  // Costs & Expenses → Copper
  if (['expenses', 'costs', 'spending'].includes(normalized)) {
    return colors.expenses;
  }
  
  // Goals & Targets → Violet
  if (['goals', 'targets', 'objectives'].includes(normalized)) {
    return colors.goals;
  }
  
  // Alerts & Warnings → Coral Red
  if (['alerts', 'warnings', 'issues'].includes(normalized)) {
    return colors.alerts;
  }
  
  // Default: Slate Blue (professional, never yellow)
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
