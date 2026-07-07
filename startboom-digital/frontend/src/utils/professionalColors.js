// Professional color palette for enterprise dashboard
// Modern, sophisticated colors that look professional

export const PROFESSIONAL_COLORS = {
  // Primary brand colors
  primary: {
    main: '#4F46E5',      // Indigo - Professional and trustworthy
    light: '#818CF8',     // Light indigo
    dark: '#3730A3',      // Dark indigo
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  
  // Success (revenue, wins, positive metrics)
  success: {
    main: '#10B981',      // Emerald green - Growth and success
    light: '#34D399',     
    dark: '#059669',
    bg: '#D1FAE5'
  },
  
  // Warning (at-risk, needs attention)
  warning: {
    main: '#F59E0B',      // Amber - Attention needed
    light: '#FBBF24',
    dark: '#D97706',
    bg: '#FEF3C7'
  },
  
  // Danger (critical, losses, failures)
  danger: {
    main: '#EF4444',      // Red - Critical issues
    light: '#F87171',
    dark: '#DC2626',
    bg: '#FEE2E2'
  },
  
  // Info (neutral information)
  info: {
    main: '#3B82F6',      // Blue - Information
    light: '#60A5FA',
    dark: '#2563EB',
    bg: '#DBEAFE'
  },
  
  // Chart colors (diverse, professional palette)
  charts: [
    '#4F46E5',  // Indigo
    '#10B981',  // Emerald
    '#F59E0B',  // Amber
    '#EF4444',  // Red
    '#8B5CF6',  // Purple
    '#EC4899',  // Pink
    '#14B8A6',  // Teal
    '#F97316',  // Orange
    '#06B6D4',  // Cyan
    '#84CC16',  // Lime
  ],
  
  // Gradient backgrounds
  gradients: {
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    blue: 'linear-gradient(135deg, #667eea 0%, #4F46E5 100%)',
    green: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    orange: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    pink: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
    teal: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
  },
  
  // Status colors
  status: {
    active: '#10B981',
    inactive: '#6B7280',
    pending: '#F59E0B',
    completed: '#8B5CF6',
    cancelled: '#EF4444',
  },
  
  // Neutral grays
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  }
};

// Dark mode variations
export const DARK_MODE_COLORS = {
  bg: {
    primary: '#0F172A',      // Dark blue-gray
    secondary: '#1E293B',    // Lighter dark
    card: '#1E293B',
    hover: '#334155',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#CBD5E1',
    muted: '#94A3B8',
  },
  border: '#334155',
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

// Get chart colors for different data series
export const getChartColorPalette = (count = 10) => {
  return PROFESSIONAL_COLORS.charts.slice(0, count);
};

// Get status color
export const getStatusColor = (status) => {
  const statusMap = {
    'active': PROFESSIONAL_COLORS.success.main,
    'inactive': PROFESSIONAL_COLORS.gray[400],
    'pending': PROFESSIONAL_COLORS.warning.main,
    'completed': PROFESSIONAL_COLORS.info.main,
    'cancelled': PROFESSIONAL_COLORS.danger.main,
    'open': PROFESSIONAL_COLORS.info.main,
    'won': PROFESSIONAL_COLORS.success.main,
    'lost': PROFESSIONAL_COLORS.danger.main,
    'on_track': PROFESSIONAL_COLORS.success.main,
    'at_risk': PROFESSIONAL_COLORS.warning.main,
    'behind': PROFESSIONAL_COLORS.danger.main,
  };
  
  return statusMap[status?.toLowerCase()] || PROFESSIONAL_COLORS.gray[400];
};

export default PROFESSIONAL_COLORS;
