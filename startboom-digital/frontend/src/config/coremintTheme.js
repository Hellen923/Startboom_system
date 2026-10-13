// CoreMint CRM - Design System
// Premium purple-led design with enterprise aesthetics

/**
 * COREMINT BRAND COLORS
 * Deep purple primary with lavender accents, professional neutrals
 */
export const COREMINT_COLORS = {
  // Primary Brand Colors
  corePurple: '#7C3AED',        // Bright vibrant purple - primary actions
  purpleHover: '#6D28D9',       // Darker purple for hover states
  lavender: '#F0E9FF',          // Soft lavender - sidebar, subtle backgrounds
  lightPurple: '#E5D9FF',       // Light purple - hover states
  
  // Neutral Base (Professional)
  canvas: '#F8F7FC',            // Off-white page background
  surface: '#FFFFFF',           // Pure white cards
  softGray: '#F5F3F8',          // Subtle hover states
  lightGray: '#E8E5F0',         // Borders, dividers
  
  // Text Colors
  midnight: '#17143D',          // Primary text - midnight navy
  slateGray: '#64748B',         // Secondary text
  mutedGray: '#94A3B8',         // Muted text, placeholders
  
  // Status Colors (Muted, Professional)
  success: '#10B981',           // Emerald green
  successLight: '#D1FAE5',      // Pale green background
  warning: '#F59E0B',           // Amber
  warningLight: '#FEF3C7',      // Pale amber background
  danger: '#EF4444',            // Red
  dangerLight: '#FEE2E2',       // Pale red background
  info: '#3B82F6',              // Blue
  infoLight: '#DBEAFE',         // Pale blue background
  
  // Chart Colors (Bright Purple-led with variety)
  charts: {
    primary: '#7C3AED',         // Bright vibrant purple
    secondary: '#818CF8',       // Light purple
    tertiary: '#10B981',        // Emerald
    quaternary: '#F59E0B',      // Amber
    quinary: '#06B6D4',         // Cyan
    senary: '#EC4899',          // Pink
  },
  
  // Chart Palette (for multi-series)
  chartPalette: [
    '#7C3AED', // Bright vibrant purple
    '#818CF8', // Light purple
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#06B6D4', // Cyan
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#64748B', // Slate
  ],
  
  // Dark Mode
  dark: {
    bg: '#0F172A',              // Deep slate
    card: '#1E293B',            // Card background
    elevated: '#334155',        // Elevated surfaces
    hover: '#475569',           // Hover states
    border: '#334155',          // Borders
    text: '#F8FAFC',            // Primary text
    textSecondary: '#CBD5E1',   // Secondary text
    textMuted: '#94A3B8',       // Muted text
  },
};

/**
 * THEME TOKENS
 * CSS variable mapping for light and dark modes
 */
export const COREMINT_THEME_TOKENS = {
  light: {
    // Backgrounds
    '--workspace-bg': COREMINT_COLORS.canvas,
    '--color-bg-page': COREMINT_COLORS.canvas,
    '--color-bg-card': COREMINT_COLORS.surface,
    '--color-bg-surface': COREMINT_COLORS.surface,
    '--color-bg-elevated': COREMINT_COLORS.softGray,
    '--color-bg-input': COREMINT_COLORS.surface,
    '--color-bg-input-subtle': COREMINT_COLORS.softGray,
    '--color-bg-row-hover': COREMINT_COLORS.softGray,
    '--color-bg-hover': COREMINT_COLORS.lightGray,
    '--color-bg-muted': COREMINT_COLORS.lightGray,
    '--color-bg-icon-btn': COREMINT_COLORS.lightGray,
    
    // Borders
    '--color-border': COREMINT_COLORS.lightGray,
    '--color-border-strong': COREMINT_COLORS.slateGray,
    '--color-border-subtle': COREMINT_COLORS.softGray,
    
    // Text
    '--color-text-primary': COREMINT_COLORS.midnight,
    '--color-text-secondary': COREMINT_COLORS.slateGray,
    '--color-text-muted': COREMINT_COLORS.mutedGray,
    '--color-text-placeholder': COREMINT_COLORS.mutedGray,
    
    // Charts
    '--color-chart-grid': 'rgba(232, 229, 240, 0.5)',
    '--color-chart-axis': COREMINT_COLORS.mutedGray,
    
    // Tooltips
    '--color-tooltip-bg': COREMINT_COLORS.surface,
    '--color-tooltip-border': COREMINT_COLORS.lightGray,
    '--color-tooltip-label': COREMINT_COLORS.slateGray,
    '--color-tooltip-value': COREMINT_COLORS.midnight,
    
    // Misc
    '--color-overlay': 'rgba(23, 20, 61, 0.6)',
    '--color-shadow': 'rgba(124, 58, 237, 0.08)',
    '--color-shadow-strong': 'rgba(124, 58, 237, 0.12)',
    '--color-accent-surface': 'rgba(124, 58, 237, 0.08)',
    '--color-scrollbar': COREMINT_COLORS.lightGray,
    
    // Tabs
    '--color-tab-inactive': COREMINT_COLORS.softGray,
    '--color-tab-active-bg': COREMINT_COLORS.surface,
    
    // Brand/Header
    '--brand-header-text': COREMINT_COLORS.surface,
    '--brand-header-solid': COREMINT_COLORS.purpleHover,
    
    // Sidebar (Soft Lavender)
    '--sidebar-bg': COREMINT_COLORS.lavender,
    '--sidebar-border': 'rgba(124, 58, 237, 0.1)',
    '--sidebar-nav-active': 'rgba(124, 58, 237, 0.15)',
    '--sidebar-nav-hover': 'rgba(124, 58, 237, 0.08)',
    '--sidebar-section-label': 'rgba(23, 20, 61, 0.5)',
  },
  
  dark: {
    // Backgrounds
    '--workspace-bg': COREMINT_COLORS.dark.bg,
    '--color-bg-page': COREMINT_COLORS.dark.bg,
    '--color-bg-card': COREMINT_COLORS.dark.card,
    '--color-bg-surface': COREMINT_COLORS.dark.card,
    '--color-bg-elevated': COREMINT_COLORS.dark.elevated,
    '--color-bg-input': COREMINT_COLORS.dark.card,
    '--color-bg-input-subtle': COREMINT_COLORS.dark.card,
    '--color-bg-row-hover': COREMINT_COLORS.dark.bg,
    '--color-bg-hover': COREMINT_COLORS.dark.elevated,
    '--color-bg-muted': COREMINT_COLORS.dark.elevated,
    '--color-bg-icon-btn': 'rgba(255, 255, 255, 0.05)',
    
    // Borders
    '--color-border': COREMINT_COLORS.dark.border,
    '--color-border-strong': COREMINT_COLORS.dark.hover,
    '--color-border-subtle': COREMINT_COLORS.dark.card,
    
    // Text
    '--color-text-primary': COREMINT_COLORS.dark.text,
    '--color-text-secondary': COREMINT_COLORS.dark.textSecondary,
    '--color-text-muted': COREMINT_COLORS.dark.textMuted,
    '--color-text-placeholder': COREMINT_COLORS.slateGray,
    
    // Charts
    '--color-chart-grid': 'rgba(51, 65, 85, 0.5)',
    '--color-chart-axis': COREMINT_COLORS.slateGray,
    
    // Tooltips
    '--color-tooltip-bg': COREMINT_COLORS.dark.card,
    '--color-tooltip-border': COREMINT_COLORS.dark.elevated,
    '--color-tooltip-label': COREMINT_COLORS.dark.textMuted,
    '--color-tooltip-value': COREMINT_COLORS.dark.text,
    
    // Misc
    '--color-overlay': 'rgba(0, 0, 0, 0.7)',
    '--color-shadow': 'rgba(0, 0, 0, 0.4)',
    '--color-shadow-strong': 'rgba(0, 0, 0, 0.6)',
    '--color-accent-surface': 'rgba(85, 33, 181, 0.1)',
    '--color-scrollbar': COREMINT_COLORS.dark.elevated,
    
    // Tabs
    '--color-tab-inactive': COREMINT_COLORS.dark.elevated,
    '--color-tab-active-bg': COREMINT_COLORS.dark.card,
    
    // Brand/Header
    '--brand-header-text': COREMINT_COLORS.surface,
    '--brand-header-solid': COREMINT_COLORS.purpleHover,
    
    // Sidebar (Dark Mode)
    '--sidebar-bg': COREMINT_COLORS.dark.card,
    '--sidebar-border': COREMINT_COLORS.dark.elevated,
    '--sidebar-nav-active': 'rgba(124, 58, 237, 0.2)',
    '--sidebar-nav-hover': 'rgba(124, 58, 237, 0.1)',
    '--sidebar-section-label': 'rgba(255, 255, 255, 0.5)',
  },
};

/**
 * BUTTON STYLES
 */
export const COREMINT_BUTTON_STYLES = {
  // Primary (Bright Vibrant Purple - main actions)
  primary: {
    bg: COREMINT_COLORS.corePurple,
    hover: COREMINT_COLORS.purpleHover,
    text: '#FFFFFF',
    classes: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium px-4 py-2 rounded-lg transition-colors duration-150',
  },
  
  // Secondary (Outlined)
  secondary: {
    bg: 'transparent',
    hover: COREMINT_COLORS.softGray,
    text: COREMINT_COLORS.midnight,
    border: COREMINT_COLORS.lightGray,
    classes: 'bg-transparent hover:bg-[#F5F3F8] text-[#17143D] border border-[#E8E5F0] font-medium px-4 py-2 rounded-lg transition-colors duration-150',
  },
  
  // Destructive (Red)
  destructive: {
    bg: COREMINT_COLORS.danger,
    hover: '#DC2626',
    text: '#FFFFFF',
    classes: 'bg-[#EF4444] hover:bg-[#DC2626] text-white font-medium px-4 py-2 rounded-lg transition-colors duration-150',
  },
  
  // Success (Green)
  success: {
    bg: COREMINT_COLORS.success,
    hover: '#059669',
    text: '#FFFFFF',
    classes: 'bg-[#10B981] hover:bg-[#059669] text-white font-medium px-4 py-2 rounded-lg transition-colors duration-150',
  },
};

/**
 * FORM STYLES
 */
export const COREMINT_FORM_STYLES = {
  label: 'block text-sm font-medium text-[#17143D] mb-1.5',
  input: 'w-full px-4 py-2.5 border border-[#E8E5F0] rounded-lg bg-white text-[#17143D] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-25 focus:border-[#7C3AED] transition-colors duration-150',
  inputError: 'border-[#EF4444] focus:ring-[#EF4444]',
  errorMessage: 'text-sm text-[#EF4444] mt-1',
  select: 'w-full px-4 py-2.5 border border-[#E8E5F0] rounded-lg bg-white text-[#17143D] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-25 focus:border-[#7C3AED] transition-colors duration-150',
};

/**
 * STATUS BADGE COLORS (Pale backgrounds, readable text)
 */
export const COREMINT_STATUS_COLORS = {
  active: {
    bg: COREMINT_COLORS.successLight,
    text: COREMINT_COLORS.success,
    darkBg: 'rgba(16, 185, 129, 0.2)',
    darkText: '#6EE7B7',
  },
  pending: {
    bg: COREMINT_COLORS.warningLight,
    text: COREMINT_COLORS.warning,
    darkBg: 'rgba(245, 158, 11, 0.2)',
    darkText: '#FCD34D',
  },
  completed: {
    bg: COREMINT_COLORS.successLight,
    text: COREMINT_COLORS.success,
    darkBg: 'rgba(16, 185, 129, 0.2)',
    darkText: '#6EE7B7',
  },
  failed: {
    bg: COREMINT_COLORS.dangerLight,
    text: COREMINT_COLORS.danger,
    darkBg: 'rgba(239, 68, 68, 0.2)',
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
 * SPACING SYSTEM (4px increments)
 */
export const COREMINT_SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
};

/**
 * TYPOGRAPHY
 */
export const COREMINT_TYPOGRAPHY = {
  hero: 'text-4xl font-bold',
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-bold',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-semibold',
  body: 'text-sm',
  small: 'text-xs',
  label: 'text-xs font-medium uppercase tracking-wide',
};

/**
 * Apply CoreMint theme to CSS variables
 */
export const applyCoremintTheme = (mode = 'light', primaryColor = COREMINT_COLORS.corePurple) => {
  const root = document.documentElement;
  const tokens = COREMINT_THEME_TOKENS[mode];
  
  // Apply all theme tokens
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  // Apply primary color (can be overridden by tenant)
  root.style.setProperty('--primary-color', primaryColor);
  root.style.setProperty('--primary-hover', shiftColor(primaryColor, -20));
  root.style.setProperty('--primary-ring', hexToRgba(primaryColor, 0.25));
  
  // Gradients
  const gradientTo = shiftColor(primaryColor, -25);
  root.style.setProperty('--gradient-from', primaryColor);
  root.style.setProperty('--gradient-to', gradientTo);
  root.style.setProperty('--brand-header-bg', `linear-gradient(to right, ${primaryColor}, ${gradientTo})`);
  root.style.setProperty('--btn-brand-bg', `linear-gradient(to right, ${primaryColor}, ${gradientTo})`);
  
  // Apply dark mode class
  if (mode === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
};

// Helper functions
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const shiftColor = (hex, amount) => {
  const num = parseInt(hex.slice(1), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0xff) + amount);
  const b = clamp((num & 0xff) + amount);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
};

export default COREMINT_COLORS;
