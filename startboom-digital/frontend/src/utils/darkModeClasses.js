/**
 * HoneyPot — unified theme tokens (CSS variable + design system classes)
 *
 * Light mode: blue gradient headers/buttons (from-primary-500 → primary-600)
 * Dark mode:  solid darker blue (#0D5B80)
 *
 * Usage:  import dm from '../utils/darkModeClasses';
 *         <div className={dm.unifiedCard}>...</div>
 */

export const dm = {
  // Brand — gradient (light) / solid blue (dark)
  brandHeader: 'brand-header',
  btnBrand:    'btn-brand',

  // Page layout
  pageBg:       'bg-[var(--color-bg-page)]',
  dashboardPage:'dashboard-page',
  statGrid:     'stat-grid',
  statGrid4:    'stat-grid cols-4',
  chartGrid:    'chart-grid',

  // Unified card (modal-style with gradient header)
  unifiedCard:       'unified-card',
  unifiedCardHeader: 'unified-card-header',
  unifiedCardBody:   'unified-card-body',
  unifiedCardFooter: 'unified-card-footer',

  // Cards & panels
  card:      'unified-card',
  cardHover: 'hover:shadow-md transition-shadow duration-150',
  chartPanel:'chart-panel',
  chartBody: 'chart-panel-body',
  statCard:  'stat-card',
  surface:   'bg-[var(--color-bg-surface)] border border-[var(--color-border)]',

  // Text
  textPrimary:   'text-[var(--color-text-primary)]',
  textSecondary: 'text-[var(--color-text-secondary)]',
  textMuted:     'text-[var(--color-text-muted)]',
  textHeading:   'text-[var(--color-text-primary)] font-bold',
  textOnBrand:   'text-[var(--brand-header-text)]',

  // Borders
  border:       'border-[var(--color-border)]',
  borderStrong: 'border-[var(--color-border-strong)]',
  divider:      'border-t border-[var(--color-border)]',

  // Inputs
  input: 'bg-[var(--color-bg-input)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] placeholder-[var(--color-text-placeholder)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] hover:border-[var(--color-border-strong)] transition-colors w-full',

  // Buttons
  btnPrimary:   'btn-brand',
  btnSecondary: 'btn-secondary bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg px-4 py-2 text-sm font-medium transition-colors',
  btnDanger:    'bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors',
  btnGhost:     'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg px-3 py-2 transition-colors',

  // Tables
  tableWrapper: 'unified-card overflow-hidden',
  table:        'unified-table w-full',
  tableHeader:  'table-header',
  tableRow:     'table-row border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-row-hover)] transition-colors',
  tableCell:    'text-[var(--color-text-primary)] text-sm px-5 py-3',
  tableCellSub: 'text-[var(--color-text-secondary)] text-sm',
  tableCellMuted: 'text-[var(--color-text-muted)] text-xs',

  // Badges
  badgeGreen:   'bg-green-100 text-green-700 dark:bg-[#14532D] dark:text-[#22C55E] px-2 py-0.5 rounded-full text-xs font-semibold',
  badgeRed:     'bg-red-100 text-red-700 dark:bg-[#450A0A] dark:text-[#EF4444] px-2 py-0.5 rounded-full text-xs font-semibold',
  badgeYellow:  'bg-yellow-100 text-yellow-700 dark:bg-[#451A03] dark:text-[#F59E0B] px-2 py-0.5 rounded-full text-xs font-semibold',
  badgeBlue:    'bg-blue-100 text-blue-700 dark:bg-[#193A52] dark:text-[#1795CC] px-2 py-0.5 rounded-full text-xs font-semibold',
  badgeGray:    'bg-gray-100 text-gray-600 dark:bg-[#3A3D52] dark:text-[#A0AEC0] px-2 py-0.5 rounded-full text-xs font-semibold',
  badgePrimary: 'bg-primary-100 text-primary-700 dark:bg-[#193A52] dark:text-[#1795CC] px-2 py-0.5 rounded-full text-xs font-semibold',

  // Modals
  modalOverlay: 'modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4',
  modalShell:   'modal-shell max-w-md w-full',
  modalPanel:   'modal-shell max-w-lg w-full max-h-[90vh] flex flex-col',
  modalHeader:  'brand-header flex items-center justify-between px-6 py-4 flex-shrink-0',
  modalBody:    'modal-shell-body flex-1 overflow-y-auto',
  modalFooter:  'modal-shell-footer flex-shrink-0',

  // Dropdowns
  dropdown:     'dropdown-menu',
  dropdownItem: 'dropdown-item',
  dropdownSelected: 'bg-[var(--color-accent-surface)] text-[var(--primary-color)]',

  // Section labels
  sectionLabel: 'text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]',
  accentSurface: 'bg-[var(--color-accent-surface)]',

  // Tab bar
  tabBar:      'tab-bar',
  tabInactive: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]',
  tabActive:   'active bg-[var(--color-tab-active-bg)] text-[var(--color-text-primary)] shadow-sm',

  // Taskbar
  taskbarShell: 'bg-[var(--color-bg-page)]',
  taskbarPanel: 'bg-[var(--color-bg-card)] border border-[var(--color-border)]',
  iconBtn:      'icon-btn',
};

export default dm;
