// HoneyPot CRM - Enterprise Design System
// Consistent spacing, typography, and layout utilities across all user roles

/**
 * SPACING SCALE (8px Grid System)
 * Use these consistent spacing values throughout the app
 */
export const SPACING = {
  xs: '4px',         // 4px
  sm: '8px',         // 8px
  md: '16px',        // 16px
  lg: '24px',        // 24px
  xl: '32px',        // 32px
  '2xl': '48px',     // 48px
  '3xl': '64px',     // 64px
};

/**
 * TYPOGRAPHY SCALE - Enterprise Specification
 * Consistent text sizes with proper line heights
 */
export const TYPOGRAPHY = {
  // Page Headers
  pageTitle: 'text-3xl font-bold leading-tight text-[#0F172A] dark:text-[#F8FAFC]',
  pageSubtitle: 'text-sm text-[#64748B] dark:text-[#94A3B8] mt-1',
  
  // Section Headers
  sectionTitle: 'text-xl font-bold leading-tight text-[#0F172A] dark:text-[#F8FAFC]',
  sectionSubtitle: 'text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5',
  
  // Content Text
  body: 'text-sm leading-relaxed text-[#475569] dark:text-[#CBD5E1]',
  bodyLarge: 'text-base leading-relaxed text-[#475569] dark:text-[#CBD5E1]',
  bodySmall: 'text-xs leading-relaxed text-[#64748B] dark:text-[#94A3B8]',
  
  // Labels & Metadata
  label: 'text-xs font-medium uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]',
  metadata: 'text-xs text-[#94A3B8] dark:text-[#64748B]',
  
  // Table Headers
  tableHeader: 'text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]',
  
  // Stats & Numbers
  statValue: 'text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC]',
  statLabel: 'text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]',
  
  // Buttons
  buttonText: 'text-sm font-semibold',
  buttonTextLarge: 'text-base font-semibold',
};

/**
 * LAYOUT CONTAINERS - Enterprise Specification
 */
export const CONTAINERS = {
  // Page Container
  page: 'min-h-screen p-6 bg-[#F8FAFC] dark:bg-[#0F172A]',
  
  // Page Header
  pageHeader: 'mb-8',
  pageHeaderWithActions: 'flex items-start justify-between mb-8',
  
  // Cards (16px radius, enterprise shadow)
  card: 'rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden',
  cardPadding: 'p-6',
  cardHeader: 'px-6 py-5 border-b border-[#F1F5F9] dark:border-[#334155]',
  cardBody: 'p-6',
  cardFooter: 'px-6 py-4 border-t border-[#F1F5F9] dark:border-[#334155]',
  
  // Stats Grid
  statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  statsCard: 'rounded-2xl p-6',
  
  // Table Container
  tableContainer: 'rounded-2xl overflow-hidden',
  
  // Modal
  modal: 'bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full',
  modalHeader: 'px-6 py-5 border-b border-[#F1F5F9] dark:border-[#334155]',
  modalBody: 'p-6',
  modalFooter: 'px-6 py-4 border-t border-[#F1F5F9] dark:border-[#334155] flex justify-end space-x-3',
};

/**
 * CARD LAYOUTS - Enterprise Specification
 * All cards use 16px radius and consistent shadow
 */
export const CARD_LAYOUTS = {
  // Standard Card with Header
  withHeader: {
    container: 'bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden',
    header: 'px-6 py-5 border-b border-[#F1F5F9] dark:border-[#334155] bg-[#FAFBFC] dark:bg-[#0F172A] flex items-center justify-between',
    headerTitle: 'text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]',
    headerSubtitle: 'text-sm text-[#475569] dark:text-[#94A3B8]',
    body: 'p-6',
    footer: 'px-6 py-4 border-t border-[#F1F5F9] dark:border-[#334155] bg-[#FAFBFC] dark:bg-[#0F172A]',
  },
  
  // Stat Card
  stat: {
    container: 'bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition-shadow duration-200',
    iconWrapper: 'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
    label: 'text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] mb-2',
    value: 'text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1',
    change: 'text-sm font-medium flex items-center',
  },
  
  // List Card
  listItem: {
    container: 'bg-white dark:bg-[#1E293B] rounded-2xl p-4 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-shadow duration-200',
    content: 'flex items-center justify-between',
    leftSection: 'flex items-center space-x-4',
    avatar: 'w-12 h-12 rounded-full bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center',
    info: 'flex flex-col',
    title: 'text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]',
    subtitle: 'text-xs text-[#64748B] dark:text-[#94A3B8]',
  },
};

/**
 * TABLE STYLES - Enterprise Specification
 * Consistent header style, row spacing, and hover effects
 */
export const TABLE_STYLES = {
  container: 'overflow-hidden rounded-2xl bg-white dark:bg-[#1E293B] shadow-[0_8px_30px_rgba(15,23,42,0.06)]',
  table: 'w-full',
  thead: 'bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#F1F5F9] dark:border-[#1E293B]',
  th: 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]',
  tbody: 'divide-y divide-[#F1F5F9] dark:divide-[#1E293B]',
  tr: 'hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors duration-150',
  td: 'px-4 py-4 text-sm text-[#0F172A] dark:text-[#F8FAFC]',
};

/**
 * FORM STYLES - Enterprise Specification
 * All inputs follow consistent height (48px), radius (12px), and Honey Gold focus ring
 */
export const FORM_STYLES = {
  group: 'mb-6',
  label: 'block text-[13px] font-medium text-[#475569] dark:text-[#CBD5E1] mb-2',
  input: 'w-full h-12 px-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] text-sm focus:outline-none focus:border-[#D89A00] focus:ring-[3px] focus:ring-[rgba(216,154,0,0.1)] transition-all duration-150',
  select: 'w-full h-12 px-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] text-sm focus:outline-none focus:border-[#D89A00] focus:ring-[3px] focus:ring-[rgba(216,154,0,0.1)] transition-all duration-150',
  textarea: 'w-full px-4 py-3 min-h-[120px] rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] text-sm focus:outline-none focus:border-[#D89A00] focus:ring-[3px] focus:ring-[rgba(216,154,0,0.1)] transition-all duration-150 resize-none',
  error: 'text-xs text-[#EF4444] dark:text-[#FCA5A5] mt-1',
  helper: 'text-xs text-[#64748B] dark:text-[#94A3B8] mt-1',
};

/**
 * BUTTON STYLES - Enterprise Specification
 * All buttons follow consistent height (48px), radius (12px), and spacing
 */
export const BUTTON_STYLES = {
  // Primary Button (Honey Gold Accent)
  primary: 'inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#D89A00] hover:bg-[#B87900] text-white rounded-xl text-sm font-semibold shadow-[0_2px_8px_rgba(216,154,0,0.2)] hover:shadow-[0_4px_12px_rgba(216,154,0,0.3)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Secondary Button (White with Border)
  secondary: 'inline-flex items-center justify-center gap-2 h-12 px-6 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#475569] dark:text-[#CBD5E1] rounded-xl text-sm font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Success Button
  success: 'inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Danger Button
  danger: 'inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Ghost Button (Transparent)
  ghost: 'inline-flex items-center justify-center gap-2 h-12 px-6 bg-transparent hover:bg-[#F1F5F9] dark:hover:bg-[#334155] text-[#475569] dark:text-[#CBD5E1] rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Icon Button
  icon: 'inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#334155] text-[#475569] dark:text-[#CBD5E1] transition-colors duration-150',
  
  // Small Button (Compact variant)
  small: 'inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold',
};

/**
 * BADGE STYLES - Enterprise Specification
 */
export const BADGE_STYLES = {
  success: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#D1FAE5] dark:bg-[rgba(16,185,129,0.2)] text-[#059669] dark:text-[#86EFAC]',
  warning: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] dark:bg-[rgba(245,158,11,0.2)] text-[#D97706] dark:text-[#FDE047]',
  danger: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] dark:bg-[rgba(239,68,68,0.2)] text-[#DC2626] dark:text-[#FCA5A5]',
  info: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#DBEAFE] dark:bg-[rgba(59,130,246,0.2)] text-[#2563EB] dark:text-[#93C5FD]',
  neutral: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F1F5F9] dark:bg-[#334155] text-[#475569] dark:text-[#CBD5E1]',
  honey: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] dark:bg-[rgba(216,154,0,0.2)] text-[#D89A00] dark:text-[#FDE047]',
};

/**
 * COLOR UTILITIES - Enterprise Specification
 */
export const COLORS = {
  // Backgrounds
  page: 'bg-[#F8FAFC] dark:bg-[#0F172A]',
  card: 'bg-white dark:bg-[#1E293B]',
  elevated: 'bg-[#FAFBFC] dark:bg-[#334155]',
  
  // Borders
  border: 'border-[#E2E8F0] dark:border-[#334155]',
  borderStrong: 'border-[#CBD5E1] dark:border-[#475569]',
  
  // Text
  textPrimary: 'text-[#0F172A] dark:text-[#F8FAFC]',
  textSecondary: 'text-[#475569] dark:text-[#CBD5E1]',
  textMuted: 'text-[#64748B] dark:text-[#94A3B8]',
  textPlaceholder: 'text-[#94A3B8] dark:text-[#64748B]',
  
  // Brand
  primary: 'text-[#D89A00]',
  primaryBg: 'bg-[#D89A00]',
  primaryHover: 'hover:bg-[#B87900]',
};

/**
 * ANIMATION CONSTANTS - Enterprise Specification
 */
export const ANIMATIONS = {
  transition: 'transition-all duration-150 ease-out',
  transitionSlow: 'transition-all duration-250 ease-out',
  hover: 'hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]',
  hoverScale: 'hover:scale-[1.02]',
  fadeIn: 'animate-[fadeIn_0.3s_ease-in]',
  scaleIn: 'animate-[scaleIn_0.2s_ease-out]',
  slideIn: 'animate-[slideIn_0.3s_ease-out]',
};

/**
 * HONEYPOT ANALYTICS PALETTE - Professional Enterprise Data Visualization
 * 
 * DESIGN PHILOSOPHY:
 * "HoneyPot = premium business platform" NOT "HoneyPot = yellow everywhere"
 * 
 * Gold is the SIGNATURE ACCENT for buttons, highlights, active navigation, branding.
 * Charts should feel INTELLIGENT and REFINED, not colorful.
 * 
 * CORE PRINCIPLE: Remove bright yellow from charts.
 * Different metrics = Different semantic colors (like Stripe, Linear, Notion, Attio, HubSpot)
 * 
 * USAGE: Import from chartTheme.js (ANALYTICS_PALETTE)
 * This is documented here for reference only.
 */
export const CHART_COLORS = {
  // === PRIMARY DATA METRICS (Professional Blues & Greens - NO YELLOW) ===
  revenue: '#4F6BED',        // Slate Blue - Professional (NOT gold)
  profit: '#10B981',         // Emerald - Success, growth
  sales: '#4F6BED',          // Slate Blue - Matches revenue
  
  // Sales & Commercial
  customers: '#38BDF8',      // Sky Blue - User-focused metrics
  users: '#38BDF8',          // Sky Blue - Customer data
  
  // Forecasting & Predictions
  forecast: '#6366F1',       // Indigo - Future intelligence
  target: '#94A3B8',         // Slate Grey - Baselines
  
  // Performance & Analytics
  performance: '#8B5CF6',    // Violet - High-level analytics
  activities: '#6366F1',     // Indigo - Operational data
  goals: '#8B5CF6',          // Violet - Productivity
  
  // Costs & Resources
  expenses: '#B87333',       // Copper - Cost without alarm
  
  // Alerts & Attention
  alerts: '#E76F51',         // Coral Red - Softer attention
  
  // Deal Pipeline Stages (gentle color progression - NO bright yellow)
  pipeline: {
    lead: '#38BDF8',         // Sky Blue - Early exploration
    qualified: '#4F6BED',    // Slate Blue - Moving forward
    proposal: '#6366F1',     // Indigo - Deepening engagement
    negotiation: '#F59E0B',  // Amber - Critical stage (NOT honey gold)
    won: '#10B981',          // Emerald - Success
    lost: '#E76F51',         // Coral - Lost (softer red)
  },
  
  // Multi-series palette (agent comparisons, regions - NO BRIGHT YELLOW)
  // Ordered for visual harmony and enterprise feel
  palette: [
    '#4F6BED',  // Slate Blue (primary)
    '#10B981',  // Emerald (secondary)
    '#38BDF8',  // Sky Blue
    '#8B5CF6',  // Violet
    '#6366F1',  // Indigo
    '#5B8A72',  // Sage Green
    '#B87333',  // Copper
    '#E76F51',  // Coral
  ],
  
  // === BRAND ACCENT (Use SPARINGLY - only KPI highlights, NOT charts) ===
  brandAccent: '#D89A00',    // Honey Gold - ONLY for brand moments
  brandHover: '#B87900',     // Darker honey for interactions
  
  // Chart UI elements
  grid: 'rgba(226,232,240,0.5)',
  gridDark: 'rgba(51,65,85,0.5)',
  axis: '#94A3B8',
  axisDark: '#64748B',
};

/**
 * HELPER FUNCTIONS
 */

/**
 * Combines design system classes
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Get status badge style
 */
export const getStatusBadge = (status) => {
  const statusMap = {
    active: BADGE_STYLES.success,
    completed: BADGE_STYLES.success,
    success: BADGE_STYLES.success,
    pending: BADGE_STYLES.warning,
    warning: BADGE_STYLES.warning,
    at_risk: BADGE_STYLES.warning,
    failed: BADGE_STYLES.danger,
    error: BADGE_STYLES.danger,
    cancelled: BADGE_STYLES.danger,
    inactive: BADGE_STYLES.neutral,
    draft: BADGE_STYLES.neutral,
  };
  
  return statusMap[status] || BADGE_STYLES.neutral;
};

/**
 * Format status text
 */
export const formatStatusText = (status) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default {
  SPACING,
  TYPOGRAPHY,
  CONTAINERS,
  CARD_LAYOUTS,
  TABLE_STYLES,
  FORM_STYLES,
  BUTTON_STYLES,
  BADGE_STYLES,
  COLORS,
  ANIMATIONS,
  CHART_COLORS,
  cn,
  getStatusBadge,
  formatStatusText,
};
