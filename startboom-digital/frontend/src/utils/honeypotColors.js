// HoneyPot CRM - Premium Color System
// "Sweeten Every Sale" - Where every opportunity finds its value

/**
 * HONEYPOT BRAND COLORS
 * Premium honey-inspired palette with restrained use of gold
 */
export const HONEYPOT_COLORS = {
  // Primary Brand Colors (use sparingly for accent only)
  honeyGold: '#D99A00',
  deepAmber: '#B7791F',
  burntOrange: '#F59E0B',
  
  // Neutral Base (Premium Feel)
  creamBg: '#FFFDF7',        // Page background - soft cream
  whiteCard: '#FFFFFF',      // Cards - pure white
  charcoal: '#2D2A26',       // Primary text - never pure black
  slateGray: '#6B6B6B',      // Secondary text
  lightGray: '#E8E3D5',      // Borders, dividers
  softGray: '#F5F3EF',       // Hover states
  
  // Sidebar (Professional Dark)
  sidebarDark: '#2D2A26',
  sidebarText: '#E8E3D5',
  sidebarActive: '#D99A00',
  sidebarHover: 'rgba(217, 154, 0, 0.1)',
  
  // Status Colors (Muted, Professional)
  success: '#4F8A5B',        // Muted sage green
  successLight: '#E8F5E9',
  danger: '#C0392B',         // Warm red
  dangerLight: '#FFEBEE',
  warning: '#D99A00',        // Honey gold
  warningLight: '#FFF9E6',
  info: '#3B82F6',           // Blue
  infoLight: '#E3F2FD',
  
  // Chart Colors (Premium Curated Palette)
  charts: {
    revenue: '#D99A00',      // Honey Gold
    forecast: '#F59E0B',     // Burnt Orange
    activities: '#3B82F6',   // Slate Blue
    goals: '#4F8A5B',        // Sage Green
    clients: '#06B6D4',      // Teal
    deals: '#8B5CF6',        // Deep Plum
    expenses: '#C0392B',     // Warm Red
    profit: '#4F8A5B',       // Sage Green
  },
  
  // Chart Array (for multi-series charts)
  chartPalette: [
    '#D99A00', // Honey Gold
    '#F59E0B', // Burnt Orange
    '#3B82F6', // Slate Blue
    '#4F8A5B', // Sage Green
    '#06B6D4', // Teal
    '#8B5CF6', // Deep Plum
    '#EC4899', // Pink
    '#10B981', // Emerald
  ],
  
  // Gradients (Subtle, Premium)
  gradients: {
    primary: 'linear-gradient(135deg, #D99A00 0%, #B7791F 100%)',
    warm: 'linear-gradient(135deg, #F59E0B 0%, #D99A00 100%)',
    success: 'linear-gradient(135deg, #4F8A5B 0%, #3D6B47 100%)',
    blue: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    purple: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    teal: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
  },
};

/**
 * THEME CONFIGURATION
 * CSS variable mapping for light and dark modes
 */
export const HONEYPOT_THEME = {
  light: {
    // Backgrounds
    'bg-page': HONEYPOT_COLORS.creamBg,
    'bg-card': HONEYPOT_COLORS.whiteCard,
    'bg-elevated': HONEYPOT_COLORS.softGray,
    'bg-hover': HONEYPOT_COLORS.lightGray,
    
    // Text
    'text-primary': HONEYPOT_COLORS.charcoal,
    'text-secondary': HONEYPOT_COLORS.slateGray,
    'text-muted': '#9CA3AF',
    
    // Borders
    'border-color': HONEYPOT_COLORS.lightGray,
    'border-strong': '#D1D5DB',
    
    // Brand
    'brand-primary': HONEYPOT_COLORS.honeyGold,
    'brand-secondary': HONEYPOT_COLORS.deepAmber,
    
    // Sidebar
    'sidebar-bg': HONEYPOT_COLORS.sidebarDark,
    'sidebar-text': HONEYPOT_COLORS.sidebarText,
    'sidebar-active': HONEYPOT_COLORS.sidebarActive,
    'sidebar-hover': HONEYPOT_COLORS.sidebarHover,
  },
  
  dark: {
    // Backgrounds
    'bg-page': '#0F172A',
    'bg-card': '#1E293B',
    'bg-elevated': '#334155',
    'bg-hover': '#475569',
    
    // Text
    'text-primary': '#F8FAFC',
    'text-secondary': '#CBD5E1',
    'text-muted': '#94A3B8',
    
    // Borders
    'border-color': '#334155',
    'border-strong': '#475569',
    
    // Brand
    'brand-primary': HONEYPOT_COLORS.honeyGold,
    'brand-secondary': HONEYPOT_COLORS.deepAmber,
    
    // Sidebar
    'sidebar-bg': '#1E293B',
    'sidebar-text': '#CBD5E1',
    'sidebar-active': HONEYPOT_COLORS.honeyGold,
    'sidebar-hover': 'rgba(217, 154, 0, 0.15)',
  },
};

/**
 * BUTTON STYLES
 */
export const BUTTON_COLORS = {
  // Primary (Honey Gold - use sparingly)
  primary: {
    bg: HONEYPOT_COLORS.honeyGold,
    hover: HONEYPOT_COLORS.deepAmber,
    text: '#FFFFFF',
  },
  
  // Secondary (Subtle)
  secondary: {
    bg: HONEYPOT_COLORS.whiteCard,
    hover: HONEYPOT_COLORS.softGray,
    text: HONEYPOT_COLORS.charcoal,
    border: HONEYPOT_COLORS.lightGray,
  },
  
  // Danger
  danger: {
    bg: HONEYPOT_COLORS.danger,
    hover: '#A52A2A',
    text: '#FFFFFF',
  },
  
  // Success
  success: {
    bg: HONEYPOT_COLORS.success,
    hover: '#3D6B47',
    text: '#FFFFFF',
  },
};

/**
 * ICON BACKGROUND COLORS
 */
export const ICON_BACKGROUNDS = {
  gold: 'bg-[#D99A00]',
  amber: 'bg-[#F59E0B]',
  blue: 'bg-[#3B82F6]',
  green: 'bg-[#4F8A5B]',
  teal: 'bg-[#06B6D4]',
  purple: 'bg-[#8B5CF6]',
  red: 'bg-[#C0392B]',
  pink: 'bg-[#EC4899]',
};

/**
 * STATUS BADGE COLORS
 */
export const STATUS_COLORS = {
  active: {
    bg: HONEYPOT_COLORS.successLight,
    text: HONEYPOT_COLORS.success,
    darkBg: 'rgba(79, 138, 91, 0.2)',
    darkText: '#86EFAC',
  },
  pending: {
    bg: HONEYPOT_COLORS.warningLight,
    text: HONEYPOT_COLORS.warning,
    darkBg: 'rgba(217, 154, 0, 0.2)',
    darkText: '#FDE047',
  },
  completed: {
    bg: HONEYPOT_COLORS.successLight,
    text: HONEYPOT_COLORS.success,
    darkBg: 'rgba(79, 138, 91, 0.2)',
    darkText: '#86EFAC',
  },
  failed: {
    bg: HONEYPOT_COLORS.dangerLight,
    text: HONEYPOT_COLORS.danger,
    darkBg: 'rgba(192, 57, 43, 0.2)',
    darkText: '#FCA5A5',
  },
  inactive: {
    bg: '#F3F4F6',
    text: '#6B7280',
    darkBg: 'rgba(107, 114, 128, 0.2)',
    darkText: '#9CA3AF',
  },
};

/**
 * Apply HoneyPot theme to CSS variables
 */
export const applyHoneypotTheme = (mode = 'light') => {
  const theme = HONEYPOT_THEME[mode];
  const root = document.documentElement;
  
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  
  // Apply status colors
  root.style.setProperty('--color-success', HONEYPOT_COLORS.success);
  root.style.setProperty('--color-danger', HONEYPOT_COLORS.danger);
  root.style.setProperty('--color-warning', HONEYPOT_COLORS.warning);
  root.style.setProperty('--color-info', HONEYPOT_COLORS.info);
};

/**
 * Get chart color by name
 */
export const getChartColor = (name) => {
  return HONEYPOT_COLORS.charts[name] || HONEYPOT_COLORS.charts.revenue;
};

/**
 * Get status color
 */
export const getStatusColor = (status, isDark = false) => {
  const statusKey = status?.toLowerCase() || 'inactive';
  const colors = STATUS_COLORS[statusKey] || STATUS_COLORS.inactive;
  
  return {
    bg: isDark ? colors.darkBg : colors.bg,
    text: isDark ? colors.darkText : colors.text,
  };
};

export default HONEYPOT_COLORS;
