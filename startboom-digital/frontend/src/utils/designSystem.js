// Design System - Consistent spacing, typography, and layout utilities

/**
 * SPACING SCALE
 * Use these consistent spacing values throughout the app
 */
export const SPACING = {
  xs: '0.5rem',      // 8px
  sm: '0.75rem',     // 12px
  md: '1rem',        // 16px
  lg: '1.5rem',      // 24px
  xl: '2rem',        // 32px
  '2xl': '3rem',     // 48px
  '3xl': '4rem',     // 64px
};

/**
 * TYPOGRAPHY SCALE
 * Consistent text sizes with proper line heights
 */
export const TYPOGRAPHY = {
  // Page Headers
  pageTitle: 'text-3xl font-bold leading-tight',      // Main page title
  pageSubtitle: 'text-sm text-gray-600 dark:text-gray-400 mt-1',
  
  // Section Headers
  sectionTitle: 'text-xl font-bold leading-tight',    // Card/section title
  sectionSubtitle: 'text-xs text-gray-600 dark:text-gray-400 mt-0.5',
  
  // Content Text
  body: 'text-sm leading-relaxed',                    // Normal body text
  bodyLarge: 'text-base leading-relaxed',             // Larger body text
  bodySmall: 'text-xs leading-relaxed',               // Smaller body text
  
  // Labels & Metadata
  label: 'text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400',
  metadata: 'text-xs text-gray-500 dark:text-gray-500',
  
  // Table Headers
  tableHeader: 'text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400',
  
  // Stats & Numbers
  statValue: 'text-3xl font-bold',
  statLabel: 'text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400',
  
  // Buttons
  buttonText: 'text-sm font-semibold',
  buttonTextLarge: 'text-base font-semibold',
};

/**
 * LAYOUT CONTAINERS
 * Consistent container styles for different layouts
 */
export const CONTAINERS = {
  // Page Container
  page: 'min-h-screen p-6',
  
  // Page Header
  pageHeader: 'mb-8',
  pageHeaderWithActions: 'flex items-start justify-between mb-8',
  
  // Cards
  card: 'rounded-xl shadow-sm overflow-hidden',
  cardPadding: 'p-6',
  cardHeader: 'px-6 py-4 border-b',
  cardBody: 'p-6',
  cardFooter: 'px-6 py-4 border-t',
  
  // Stats Grid
  statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  statsCard: 'rounded-xl p-6',
  
  // Table Container
  tableContainer: 'rounded-xl overflow-hidden',
  
  // Modal
  modal: 'bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full',
  modalHeader: 'px-6 py-5 border-b',
  modalBody: 'p-6',
  modalFooter: 'px-6 py-4 border-t flex justify-end space-x-3',
};

/**
 * STANDARD CARD LAYOUTS
 */
export const CARD_LAYOUTS = {
  // Standard Card with Header
  withHeader: {
    container: 'bg-white dark:bg-[#1E293B] rounded-xl shadow-sm overflow-hidden',
    header: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between',
    headerTitle: 'text-lg font-bold text-gray-900 dark:text-white',
    headerSubtitle: 'text-sm text-gray-600 dark:text-gray-400',
    body: 'p-6',
  },
  
  // Stat Card
  stat: {
    container: 'bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow',
    iconWrapper: 'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
    label: 'text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2',
    value: 'text-3xl font-bold text-gray-900 dark:text-white mb-1',
    change: 'text-sm font-medium flex items-center',
  },
  
  // List Card
  listItem: {
    container: 'bg-white dark:bg-[#1E293B] rounded-xl p-4 hover:shadow-md transition-shadow',
    content: 'flex items-center justify-between',
    leftSection: 'flex items-center space-x-4',
    avatar: 'w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center',
    info: 'flex flex-col',
    title: 'text-sm font-semibold text-gray-900 dark:text-white',
    subtitle: 'text-xs text-gray-600 dark:text-gray-400',
  },
};

/**
 * TABLE STYLES
 */
export const TABLE_STYLES = {
  container: 'overflow-hidden rounded-xl bg-white dark:bg-[#1E293B] shadow-sm',
  table: 'w-full',
  thead: 'bg-gray-50 dark:bg-[#334155] border-b border-gray-200 dark:border-gray-700',
  th: 'px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400',
  tbody: 'divide-y divide-gray-200 dark:divide-gray-700',
  tr: 'hover:bg-gray-50 dark:hover:bg-[#334155] transition-colors',
  td: 'px-6 py-4 text-sm text-gray-900 dark:text-white',
};

/**
 * FORM STYLES
 */
export const FORM_STYLES = {
  group: 'mb-6',
  label: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2',
  input: 'w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition',
  select: 'w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition',
  textarea: 'w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none',
  error: 'text-xs text-red-600 dark:text-red-400 mt-1',
  helper: 'text-xs text-gray-500 dark:text-gray-400 mt-1',
};

/**
 * BUTTON STYLES
 */
export const BUTTON_STYLES = {
  // Primary Button
  primary: 'px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
  
  // Secondary Button
  secondary: 'px-6 py-3 bg-white dark:bg-[#1E293B] border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-[#334155] transition-all disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Danger Button
  danger: 'px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Icon Button
  icon: 'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
  
  // Small Button
  small: 'px-4 py-2 text-sm rounded-lg font-medium',
};

/**
 * BADGE STYLES
 */
export const BADGE_STYLES = {
  success: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  warning: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400',
  danger: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
  info: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
  neutral: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
};

/**
 * COLOR UTILITIES
 */
export const COLORS = {
  // Backgrounds
  page: 'bg-gray-50 dark:bg-[#0F172A]',
  card: 'bg-white dark:bg-[#1E293B]',
  elevated: 'bg-gray-50 dark:bg-[#334155]',
  
  // Borders
  border: 'border-gray-200 dark:border-gray-700',
  borderStrong: 'border-gray-300 dark:border-gray-600',
  
  // Text
  textPrimary: 'text-gray-900 dark:text-white',
  textSecondary: 'text-gray-700 dark:text-gray-300',
  textMuted: 'text-gray-600 dark:text-gray-400',
  textPlaceholder: 'text-gray-400 dark:text-gray-500',
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
  cn,
  getStatusBadge,
  formatStatusText,
};
