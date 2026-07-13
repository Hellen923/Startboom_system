// HoneyPot CRM - Professional Color Palette
// Primary colors use CSS variables so they respond to tenant branding

export const PROFESSIONAL_COLORS = {
  primary: {
    main: 'var(--primary-color)',
    light: '#F59E0B',
    dark: 'var(--primary-hover)',
    gradient: 'var(--btn-brand-bg)'
  },
  success: {
    main: '#4F8A5B',
    light: '#81C784',
    dark: '#3D6B47',
    bg: '#E8F5E9'
  },
  warning: {
    main: 'var(--primary-color)',
    light: '#FFE799',
    dark: 'var(--primary-hover)',
    bg: '#FFF9E6'
  },
  danger: {
    main: '#C0392B',
    light: '#E57373',
    dark: '#A52A2A',
    bg: '#FFEBEE'
  },
  info: {
    main: '#3B82F6',
    light: '#64B5F6',
    dark: '#2563EB',
    bg: '#E3F2FD'
  },
  charts: [
    'var(--primary-color)',
    '#F59E0B',
    '#3B82F6',
    '#4F8A5B',
    '#06B6D4',
    '#8B5CF6',
    '#EC4899',
    '#10B981',
    '#F97316',
    '#64748B',
  ],
  gradients: {
    gold: 'var(--btn-brand-bg)',
    warm: 'var(--btn-brand-bg)',
    sage: 'linear-gradient(135deg, #4F8A5B 0%, #3D6B47 100%)',
    blue: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    purple: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    teal: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    orange: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    pink: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
  },
  status: {
    active: '#4F8A5B',
    inactive: '#6B7280',
    pending: 'var(--primary-color)',
    completed: '#4F8A5B',
    cancelled: '#C0392B',
    on_track: '#4F8A5B',
    at_risk: 'var(--primary-color)',
    behind: '#C0392B',
    won: '#4F8A5B',
    lost: '#C0392B',
  },
  gray: {
    50: '#F5F3EF',
    100: '#E8E3D5',
    200: '#D1CCBE',
    300: '#B5AFA1',
    400: '#9CA3AF',
    500: '#6B6B6B',
    600: '#4B5563',
    700: '#374151',
    800: '#2D2A26',
    900: '#1F1D1A',
  }
};

export const DARK_MODE_COLORS = {
  bg: {
    primary: '#0F172A',
    secondary: '#1E293B',
    card: '#1E293B',
    hover: '#334155',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    muted: '#94A3B8',
  },
  border: '#334155',
  accent: 'var(--primary-color)',
};

export const getColor = (name, shade = 'main') => {
  const parts = name.split('.');
  let color = PROFESSIONAL_COLORS;
  for (const part of parts) {
    color = color[part];
    if (!color) return PROFESSIONAL_COLORS.primary.main;
  }
  return shade && typeof color === 'object' ? color[shade] : color;
};

export const getChartColorPalette = (count = 10) => {
  return PROFESSIONAL_COLORS.charts.slice(0, count);
};

export const getStatusColor = (status) => {
  const statusMap = {
    'active': PROFESSIONAL_COLORS.success.main,
    'inactive': PROFESSIONAL_COLORS.gray[500],
    'pending': PROFESSIONAL_COLORS.warning.main,
    'completed': PROFESSIONAL_COLORS.success.main,
    'cancelled': PROFESSIONAL_COLORS.danger.main,
    'open': PROFESSIONAL_COLORS.info.main,
    'won': PROFESSIONAL_COLORS.success.main,
    'lost': PROFESSIONAL_COLORS.danger.main,
    'on_track': PROFESSIONAL_COLORS.success.main,
    'at_risk': PROFESSIONAL_COLORS.warning.main,
    'behind': PROFESSIONAL_COLORS.danger.main,
  };
  return statusMap[status?.toLowerCase()] || PROFESSIONAL_COLORS.gray[500];
};

export const getIconBackgroundColor = (type) => {
  const iconColors = {
    revenue: 'var(--primary-color)',
    forecast: '#F59E0B',
    clients: '#06B6D4',
    deals: '#8B5CF6',
    activities: '#3B82F6',
    goals: '#4F8A5B',
    users: '#64748B',
    success: '#4F8A5B',
    warning: 'var(--primary-color)',
    danger: '#C0392B',
    info: '#3B82F6',
  };
  return iconColors[type] || PROFESSIONAL_COLORS.primary.main;
};

export default PROFESSIONAL_COLORS;
