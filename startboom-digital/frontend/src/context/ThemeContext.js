import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const ACCENT_PRESETS = [
  { id: 'honeypot', label: 'HoneyPot Gold', color: 'var(--primary-color)' },
  { id: 'sage',     label: 'Sage Green',    color: '#10B981' },
  { id: 'slate',    label: 'Slate Blue',    color: '#64748B' },
  { id: 'sky',      label: 'Sky Blue',      color: '#0EA5E9' },
  { id: 'purple',   label: 'Deep Purple',   color: '#8B5CF6' },
  { id: 'teal',     label: 'Teal',          color: '#06B6D4' },
];

const DEFAULT_THEME = {
  mode: 'light',
  primaryColor: 'var(--primary-color)',  // HoneyPot Gold (Enterprise Spec)
  accentPreset: 'honeypot',
};

/** Full light/dark token sets — applied to :root via applyTheme() */
const THEME_TOKENS = {
  light: {
    // Enterprise Specification: Soft off-white backgrounds, slate text, strategic honey gold
    '--workspace-bg':          '#F8FAFC',  // Soft Off-white
    '--color-bg-page':         '#F8FAFC',  // Soft Off-white
    '--color-bg-card':         '#FFFFFF',  // Pure white cards
    '--color-bg-surface':      '#FFFFFF',
    '--color-bg-elevated':     '#FAFBFC',  // Subtle elevated surface
    '--color-bg-input':        '#FFFFFF',
    '--color-bg-input-subtle': '#FAFBFC',
    '--color-bg-row-hover':    '#F8FAFC',  // Subtle hover
    '--color-bg-hover':        '#F1F5F9',
    '--color-bg-muted':        '#F1F5F9',
    '--color-bg-icon-btn':     '#F1F5F9',
    '--color-border':          '#E2E8F0',  // Enterprise border
    '--color-border-strong':   '#CBD5E1',
    '--color-border-subtle':   '#F1F5F9',
    '--color-text-primary':    '#0F172A',  // Deep slate
    '--color-text-secondary':  '#475569',  // Slate gray
    '--color-text-muted':      '#64748B',
    '--color-text-placeholder':'#94A3B8',
    '--color-chart-grid':      'rgba(226,232,240,0.5)',
    '--color-chart-axis':      '#94A3B8',
    '--color-tooltip-bg':      '#FFFFFF',
    '--color-tooltip-border':  '#E2E8F0',
    '--color-tooltip-label':   '#64748B',
    '--color-tooltip-value':   '#0F172A',
    '--color-overlay':         'rgba(15, 23, 42, 0.6)',
    '--color-shadow':          'rgba(15, 23, 42, 0.06)',
    '--color-shadow-strong':   'rgba(15, 23, 42, 0.12)',
    '--color-accent-surface':  'rgba(216, 154, 0, 0.08)',  // Subtle honey tint
    '--color-scrollbar':       '#CBD5E1',
    '--color-tab-inactive':    '#F1F5F9',
    '--color-tab-active-bg':   '#FFFFFF',
    '--brand-header-text':     '#FFFFFF',
    '--brand-header-solid':    'var(--primary-hover)',  // Honey hover state
    '--sidebar-bg':            'linear-gradient(180deg, #182233 0%, #0F172A 100%)',  // Deep Slate (Enterprise Spec)
    '--sidebar-border':        'rgba(255, 255, 255, 0.08)',
    '--sidebar-nav-active':    'rgba(216, 154, 0, 0.15)',  // Honey gold tint
    '--sidebar-nav-hover':     'rgba(216, 154, 0, 0.08)',
    '--sidebar-section-label': 'rgba(255, 255, 255, 0.5)',
  },
  dark: {
    // Dark mode: Enterprise slate backgrounds, strategic honey gold accent
    '--workspace-bg':          '#0F172A',  // Deep slate
    '--color-bg-page':         '#0F172A',
    '--color-bg-card':         '#1E293B',
    '--color-bg-surface':      '#1E293B',
    '--color-bg-elevated':     '#334155',
    '--color-bg-input':        '#1E293B',
    '--color-bg-input-subtle': '#1E293B',
    '--color-bg-row-hover':    '#0F172A',
    '--color-bg-hover':        '#334155',
    '--color-bg-muted':        '#334155',
    '--color-bg-icon-btn':     'rgba(255,255,255,0.05)',
    '--color-border':          '#334155',
    '--color-border-strong':   '#475569',
    '--color-border-subtle':   '#1E293B',
    '--color-text-primary':    '#F8FAFC',
    '--color-text-secondary':  '#CBD5E1',
    '--color-text-muted':      '#94A3B8',
    '--color-text-placeholder':'#64748B',
    '--color-chart-grid':      'rgba(51,65,85,0.5)',
    '--color-chart-axis':      '#64748B',
    '--color-tooltip-bg':      '#1E293B',
    '--color-tooltip-border':  '#334155',
    '--color-tooltip-label':   '#94A3B8',
    '--color-tooltip-value':   '#F8FAFC',
    '--color-overlay':         'rgba(0,0,0,0.7)',
    '--color-shadow':          'rgba(0,0,0,0.4)',
    '--color-shadow-strong':   'rgba(0,0,0,0.6)',
    '--color-accent-surface':  'rgba(216, 154, 0, 0.1)',  // Subtle honey
    '--color-scrollbar':       '#334155',
    '--color-tab-inactive':    '#334155',
    '--color-tab-active-bg':   '#1E293B',
    '--brand-header-text':     '#FFFFFF',
    '--brand-header-solid':    'var(--primary-hover)',  // Honey hover
    '--sidebar-bg':            'linear-gradient(180deg, #182233 0%, #0F172A 100%)',  // Deep Slate (Enterprise Spec)
    '--sidebar-border':        '#334155',
    '--sidebar-nav-active':    'rgba(216, 154, 0, 0.2)',  // Honey gold tint
    '--sidebar-nav-hover':     'rgba(216, 154, 0, 0.1)',
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

  const applyTheme = useCallback((t, tenantColor) => {
    const root = document.documentElement;
    // Tenant color takes priority over theme preset color
    const savedTenantColor = localStorage.getItem('tenant_primary_color');
    const primary = tenantColor || savedTenantColor || t.primaryColor || DEFAULT_THEME.primaryColor;
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
      const saved = localStorage.getItem('honeypot_theme');
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
    localStorage.setItem('honeypot_theme', JSON.stringify(next));
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
