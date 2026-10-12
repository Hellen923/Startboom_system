import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredTenantBrandColor, PLATFORM_BRAND } from '../utils/platformBranding';
import { COREMINT_COLORS } from '../config/coremintTheme';

const ThemeContext = createContext();

export const ACCENT_PRESETS = [
  { id: 'coremint', label: 'CoreMint Purple', color: PLATFORM_BRAND.primaryColor },
  { id: 'sage',     label: 'Sage Green',      color: '#10B981' },
  { id: 'slate',    label: 'Slate Blue',      color: '#64748B' },
  { id: 'sky',      label: 'Sky Blue',        color: '#0EA5E9' },
  { id: 'purple',   label: 'Deep Purple',     color: '#8B5CF6' },
  { id: 'teal',     label: 'Teal',            color: '#06B6D4' },
];

const DEFAULT_THEME = {
  mode: 'light',
  primaryColor: PLATFORM_BRAND.primaryColor,  // CoreMint Purple
  accentPreset: 'coremint',
};

/** Full light/dark token sets — applied to :root via applyTheme() */
const THEME_TOKENS = {
  light: {
    // CoreMint Specification: Soft off-white backgrounds, midnight navy text, strategic purple
    '--workspace-bg':          COREMINT_COLORS.canvas,     // #F8F7FC - Soft off-white
    '--color-bg-page':         COREMINT_COLORS.canvas,
    '--color-bg-card':         COREMINT_COLORS.surface,    // #FFFFFF - Pure white cards
    '--color-bg-surface':      COREMINT_COLORS.surface,
    '--color-bg-elevated':     COREMINT_COLORS.softGray,   // #F5F3F8 - Subtle elevated surface
    '--color-bg-input':        COREMINT_COLORS.surface,
    '--color-bg-input-subtle': COREMINT_COLORS.softGray,
    '--color-bg-row-hover':    COREMINT_COLORS.softGray,
    '--color-bg-hover':        COREMINT_COLORS.lightGray,  // #E8E5F0
    '--color-bg-muted':        COREMINT_COLORS.lightGray,
    '--color-bg-icon-btn':     COREMINT_COLORS.lightGray,
    '--color-border':          COREMINT_COLORS.lightGray,  // #E8E5F0 - Professional border
    '--color-border-strong':   COREMINT_COLORS.slateGray,
    '--color-border-subtle':   COREMINT_COLORS.softGray,
    '--color-text-primary':    COREMINT_COLORS.midnight,   // #17143D - Midnight navy
    '--color-text-secondary':  COREMINT_COLORS.slateGray,  // #64748B - Slate gray
    '--color-text-muted':      COREMINT_COLORS.mutedGray,
    '--color-text-placeholder':COREMINT_COLORS.mutedGray,
    '--color-chart-grid':      'rgba(232, 229, 240, 0.5)',
    '--color-chart-axis':      COREMINT_COLORS.mutedGray,
    '--color-tooltip-bg':      COREMINT_COLORS.surface,
    '--color-tooltip-border':  COREMINT_COLORS.lightGray,
    '--color-tooltip-label':   COREMINT_COLORS.slateGray,
    '--color-tooltip-value':   COREMINT_COLORS.midnight,
    '--color-overlay':         'rgba(23, 20, 61, 0.6)',
    '--color-shadow':          'rgba(79, 25, 199, 0.08)',
    '--color-shadow-strong':   'rgba(79, 25, 199, 0.12)',
    '--color-accent-surface':  'rgba(79, 25, 199, 0.08)',  // Subtle purple tint
    '--color-scrollbar':       COREMINT_COLORS.lightGray,
    '--color-tab-inactive':    COREMINT_COLORS.softGray,
    '--color-tab-active-bg':   COREMINT_COLORS.surface,
    '--brand-header-text':     COREMINT_COLORS.surface,
    '--brand-header-solid':    'var(--primary-hover)',     // Purple hover state
    '--sidebar-bg':            COREMINT_COLORS.lavender,   // #F0E9FF - Soft lavender
    '--sidebar-border':        'rgba(79, 25, 199, 0.1)',
    '--sidebar-nav-active':    'rgba(79, 25, 199, 0.15)',  // Purple tint
    '--sidebar-nav-hover':     'rgba(79, 25, 199, 0.08)',
    '--sidebar-section-label': 'rgba(23, 20, 61, 0.5)',
  },
  dark: {
    // Dark mode: Deep slate backgrounds, strategic purple accent
    '--workspace-bg':          COREMINT_COLORS.dark.bg,
    '--color-bg-page':         COREMINT_COLORS.dark.bg,
    '--color-bg-card':         COREMINT_COLORS.dark.card,
    '--color-bg-surface':      COREMINT_COLORS.dark.card,
    '--color-bg-elevated':     COREMINT_COLORS.dark.elevated,
    '--color-bg-input':        COREMINT_COLORS.dark.card,
    '--color-bg-input-subtle': COREMINT_COLORS.dark.card,
    '--color-bg-row-hover':    COREMINT_COLORS.dark.bg,
    '--color-bg-hover':        COREMINT_COLORS.dark.elevated,
    '--color-bg-muted':        COREMINT_COLORS.dark.elevated,
    '--color-bg-icon-btn':     'rgba(255, 255, 255, 0.05)',
    '--color-border':          COREMINT_COLORS.dark.border,
    '--color-border-strong':   COREMINT_COLORS.dark.hover,
    '--color-border-subtle':   COREMINT_COLORS.dark.card,
    '--color-text-primary':    COREMINT_COLORS.dark.text,
    '--color-text-secondary':  COREMINT_COLORS.dark.textSecondary,
    '--color-text-muted':      COREMINT_COLORS.dark.textMuted,
    '--color-text-placeholder':COREMINT_COLORS.slateGray,
    '--color-chart-grid':      'rgba(51, 65, 85, 0.5)',
    '--color-chart-axis':      COREMINT_COLORS.slateGray,
    '--color-tooltip-bg':      COREMINT_COLORS.dark.card,
    '--color-tooltip-border':  COREMINT_COLORS.dark.elevated,
    '--color-tooltip-label':   COREMINT_COLORS.dark.textMuted,
    '--color-tooltip-value':   COREMINT_COLORS.dark.text,
    '--color-overlay':         'rgba(0, 0, 0, 0.7)',
    '--color-shadow':          'rgba(0, 0, 0, 0.4)',
    '--color-shadow-strong':   'rgba(0, 0, 0, 0.6)',
    '--color-accent-surface':  'rgba(79, 25, 199, 0.1)',   // Subtle purple
    '--color-scrollbar':       COREMINT_COLORS.dark.elevated,
    '--color-tab-inactive':    COREMINT_COLORS.dark.elevated,
    '--color-tab-active-bg':   COREMINT_COLORS.dark.card,
    '--brand-header-text':     COREMINT_COLORS.surface,
    '--brand-header-solid':    'var(--primary-hover)',     // Purple hover
    '--sidebar-bg':            COREMINT_COLORS.dark.card,  // #1E293B
    '--sidebar-border':        COREMINT_COLORS.dark.elevated,
    '--sidebar-nav-active':    'rgba(79, 25, 199, 0.2)',   // Purple tint
    '--sidebar-nav-hover':     'rgba(79, 25, 199, 0.1)',
    '--sidebar-section-label': 'rgba(255, 255, 255, 0.5)',
  },
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  const normalizeHexColor = (value) => (
    typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)
      ? value
      : DEFAULT_THEME.primaryColor
  );

  const hexToRgba = (hex, alpha) => {
    const safeHex = normalizeHexColor(hex);
    const r = parseInt(safeHex.slice(1, 3), 16);
    const g = parseInt(safeHex.slice(3, 5), 16);
    const b = parseInt(safeHex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const shiftColor = (hex, amount) => {
    const safeHex = normalizeHexColor(hex);
    const num = parseInt(safeHex.slice(1), 16);
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0xff) + amount);
    const b = clamp((num & 0xff) + amount);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  };

  const applyTheme = useCallback((t, tenantColor) => {
    const root = document.documentElement;
    // Tenant color is only restored for signed-in tenant users.
    const savedTenantColor = getStoredTenantBrandColor();
    const primary = normalizeHexColor(tenantColor || savedTenantColor || t.primaryColor || DEFAULT_THEME.primaryColor);
    const mode = t.mode === 'dark' ? 'dark' : 'light';
    const tokens = THEME_TOKENS[mode];

    // Apply all layout/color tokens first
    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Then apply brand color (always wins over token defaults)
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--primary-hover', shiftColor(primary, -20));
    root.style.setProperty('--primary-ring', hexToRgba(primary, 0.25));
    root.style.setProperty('--color-accent-surface', hexToRgba(primary, 0.08));

    const gradientTo = shiftColor(primary, -25);
    root.style.setProperty('--gradient-from', primary);
    root.style.setProperty('--gradient-to', gradientTo);
    const gradient = `linear-gradient(to right, ${primary}, ${gradientTo})`;
    root.style.setProperty('--brand-header-bg', gradient);
    root.style.setProperty('--btn-brand-bg', gradient);
    root.style.setProperty('--sidebar-nav-active', hexToRgba(primary, 0.15));
    root.style.setProperty('--sidebar-nav-hover', hexToRgba(primary, 0.08));

    if (mode === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('coremint_theme');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_THEME;
      const merged = { ...DEFAULT_THEME, ...parsed };
      setTheme(merged);
      applyTheme(merged);
    } catch {
      applyTheme(DEFAULT_THEME);
    }
  }, [applyTheme]);

  const updateTheme = (partial) => {
    const next = { ...theme, ...partial };
    setTheme(next);
    localStorage.setItem('coremint_theme', JSON.stringify(next));
    applyTheme(next); // tenant color is read from localStorage inside applyTheme
  };

  const setAccentPreset = (presetId) => {
    const preset = ACCENT_PRESETS.find((p) => p.id === presetId);
    if (preset) updateTheme({ accentPreset: presetId, primaryColor: preset.color });
  };

  const resetTheme = () => updateTheme(DEFAULT_THEME);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, setAccentPreset, resetTheme, applyTheme, accentPresets: ACCENT_PRESETS }}>
      {children}
    </ThemeContext.Provider>
  );
};
