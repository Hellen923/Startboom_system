// HoneyPot CRM - Professional Color Palette
// Premium honey-inspired colors with muted, professional tones
// "Sweeten Every Sale"

export const PROFESSIONAL_COLORS = {
  // Primary brand colors (Honey Gold - use sparingly for accents)
  primary: {
    main: '#D99A00',      // Honey Gold - Main brand color
    light: '#F59E0B',     // Burnt Orange
    dark: '#B7791F',      // Deep Amber
    gradient: 'linear-gradient(135deg, #D99A00 0%, #B7791F 100%)'
  },
  
  // Success (Muted Sage Green - revenue, wins, positive metrics)
  success: {
    main: '#4F8A5B',      // Sage Green - Growth and success
    light: '#81C784',     
    dark: '#3D6B47',
    bg: '#E8F5E9'
  },
  
  // Warning (Honey Gold - at-risk, needs attention)
  warning: {
    main: '#D99A00',      // Honey Gold - Attention needed
    light: '#FFE799',
    dark: '#B7791F',
    bg: '#FFF9E6'
  },
  
  // Danger (Warm Red - critical, losses, failures)
  danger: {
    main: '#C0392B',      // Warm Red - Critical issues
    light: '#E57373',
    dark: '#A52A2A',
    bg: '#FFEBEE'
  },
  
  // Info (Slate Blue - neutral information)
  info: {
    main: '#3B82F6',      // Slate Blue - Information
    light: '#64B5F6',
    dark: '#2563EB',
    bg: '#E3F2FD'
  },
  
  // Chart colors (Premium Curated Palette - NO bright greens/yellows)
  charts: [
    '#D99A00',  // Honey Gold (Revenue)
    '#F59E0B',  // Burnt Orange (Forecast)
    '#3B82F6',  // Slate Blue (Activities)
    '#4F8A5B',  // Sage Green (Goals)
    '#06B6D4',  // Teal (Clients)
    '#8B5CF6',  // Deep Plum (Deals)
    '#EC4899',  // Pink (Marketing)
    '#10B981',  // Emerald (Growth)
    '#F97316',  // Orange (Expenses)
    '#64748B',  // Slate Gray (Other)
  ],
  
  // Gradient backgrounds (Premium, Subtle)
  gradients: {
    gold: 'linear-gradient(135deg, #D99A00 0%, #B7791F 100%)',
    warm: 'linear-gradient(135deg, #F59E0B 0%, #D99A00 100%)',
    sage: 'linear-gradient(135deg, #4F8A5B 0%, #3D6B47 100%)',
    blue: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    purple: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    teal: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    orange: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    pink: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
  },
  
  // Status colors (Muted, Professional)
  status: {
    active: '#4F8A5B',      // Sage Green
    inactive: '#6B7280',    // Gray
    pending: '#D99A00',     // Honey Gold
    completed: '#4F8A5B',   // Sage Green
    cancelled: '#C0392B',   // Warm Red
    on_track: '#4F8A5B',    // Sage Green
    at_risk: '#D99A00',     // Honey Gold
    behind: '#C0392B',      // Warm Red
    won: '#4F8A5B',         // Sage Green
    lost: '#C0392B',        // Warm Red
  },
  
  // Neutral grays (Charcoal base)
  gray: {
    50: '#F5F3EF',
    100: '#E8E3D5',
    200: '#D1CCBE',
    300: '#B5AFA1',
    400: '#9CA3AF',
    500: '#6B6B6B',
    600: '#4B5563',
    700: '#374151',
    800: '#2D2A26',  // Charcoal
    900: '#1F1D1A',
  }
};

// Dark mode variations (HoneyPot Dark Theme)
export const DARK_MODE_COLORS = {
  bg: {
    primary: '#0F172A',      // Dark slate
    secondary: '#1E293B',    // Lighter dark
    card: '#1E293B',
    hover: '#334155',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    muted: '#94A3B8',
  },
  border: '#334155',
  accent: '#D99A00',         // Honey Gold accent
};

// Get color by name
export const getColor = (name, shade = 'main') => {
  const parts = name.split('.');
  let color = PROFESSIONAL_COLORS;
  
  for (const part of parts) {
    color = color[part];
    if (!color) return PROFESSIONAL_COLORS.primary.main;
  }
  
  return shade && typeof color === 'object' ? color[shade] : color;
};

// Get chart colors for different data series (HoneyPot Premium Palette)
export const getChartColorPalette = (count = 10) => {
  return PROFESSIONAL_COLORS.charts.slice(0, count);
};

// Get status color (HoneyPot Status System)
export const getStatusColor = (status) => {
  const statusMap = {
    'active': PROFESSIONAL_COLORS.success.main,        // #4F8A5B
    'inactive': PROFESSIONAL_COLORS.gray[500],         // #6B6B6B
    'pending': PROFESSIONAL_COLORS.warning.main,       // #D99A00
    'completed': PROFESSIONAL_COLORS.success.main,     // #4F8A5B
    'cancelled': PROFESSIONAL_COLORS.danger.main,      // #C0392B
    'open': PROFESSIONAL_COLORS.info.main,             // #3B82F6
    'won': PROFESSIONAL_COLORS.success.main,           // #4F8A5B
    'lost': PROFESSIONAL_COLORS.danger.main,           // #C0392B
    'on_track': PROFESSIONAL_COLORS.success.main,      // #4F8A5B
    'at_risk': PROFESSIONAL_COLORS.warning.main,       // #D99A00
    'behind': PROFESSIONAL_COLORS.danger.main,         // #C0392B
  };
  
  return statusMap[status?.toLowerCase()] || PROFESSIONAL_COLORS.gray[500];
};

// Icon background colors (for stat cards)
export const getIconBackgroundColor = (type) => {
  const iconColors = {
    revenue: '#D99A00',     // Honey Gold
    forecast: '#F59E0B',    // Burnt Orange
    clients: '#06B6D4',     // Teal
    deals: '#8B5CF6',       // Deep Plum
    activities: '#3B82F6',  // Slate Blue
    goals: '#4F8A5B',       // Sage Green
    users: '#64748B',       // Slate Gray
    success: '#4F8A5B',     // Sage Green
    warning: '#D99A00',     // Honey Gold
    danger: '#C0392B',      // Warm Red
    info: '#3B82F6',        // Slate Blue
  };
  
  return iconColors[type] || PROFESSIONAL_COLORS.primary.main;
};

export default PROFESSIONAL_COLORS;
