import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const ACCENT_PRESETS = [
  { id: 'swavelink', label: 'Swavelink Blue', color: '#1795CC' },
  { id: 'gold',      label: 'Gold',           color: '#F59E0B' },
  { id: 'emerald',   label: 'Emerald',        color: '#059669' },
  { id: 'violet',    label: 'Violet',         color: '#7C3AED' },
  { id: 'rose',      label: 'Rose',           color: '#E11D48' },
  { id: 'slate',     label: 'Slate',          color: '#475569' },
];

const DEFAULT_THEME = {
  mode: 'light',
  primaryColor: '#1795CC',
  accentPreset: 'swavelink',
};

/** Full light/dark token sets — applied to :root via applyTheme() */
const THEME_TOKENS = {
  light: {
    '--workspace-bg':          '#F8FAFC',
    '--color-bg-page':         '#F8FAFC',
    '--color-bg-card':         '#FFFFFF',
    '--color-bg-surface':      '#FFFFFF',
    '--color-bg-elevated':     '#F9FAFB',
    '--color-bg-input':        '#FFFFFF',
    '--color-bg-input-subtle': '#F9FAFB',
    '--color-bg-row-hover':    '#EFF6FF',
    '--color-bg-hover':        '#F3F4F6',
    '--color-bg-muted':        '#F3F4F6',
    '--color-bg-icon-btn':     '#F3F4F6',
    '--color-border':          '#E5E7EB',
    '--color-border-strong':   '#D1D5DB',
    '--color-border-subtle':   '#F3F4F6',
    '--color-text-primary':    '#111827',
    '--color-text-secondary':  '#374151',
    '--color-text-muted':      '#6B7280',
    '--color-text-placeholder':'#9CA3AF',
    '--color-chart-grid':      '#E5E7EB',
    '--color-chart-axis':      '#9CA3AF',
    '--color-tooltip-bg':      '#FFFFFF',
    '--color-tooltip-border':  '#E5E7EB',
    '--color-tooltip-label':   '#6B7280',
    '--color-tooltip-value':   '#111827',
    '--color-overlay':         'rgba(0,0,0,0.5)',
    '--color-shadow':          'rgba(0,0,0,0.06)',
    '--color-shadow-strong':   'rgba(0,0,0,0.12)',
    '--color-accent-surface':  '#EFF6FF',
    '--color-scrollbar':       '#CBD5E1',
    '--color-tab-inactive':    '#F3F4F6',
    '--color-tab-active-bg':   '#FFFFFF',
    '--brand-header-text':     '#FFFFFF',
    '--brand-header-solid':    '#0D5B80',
    '--sidebar-bg':            'linear-gradient(180deg, #1795CC 0%, #1178A6 55%, #0D5B80 100%)',
    '--sidebar-border':        'rgba(255,255,255,0.15)',
    '--sidebar-nav-active':    'rgba(255,255,255,0.22)',
    '--sidebar-nav-hover':     'rgba(255,255,255,0.12)',
    '--sidebar-section-label': 'rgba(255,255,255,0.65)',
  },
  dark: {
    '--workspace-bg':          '#0F1117',
    '--color-bg-page':         '#0F1117',
    '--color-bg-card':         '#1A1D27',
    '--color-bg-surface':      '#222536',
    '--color-bg-elevated':     '#222536',
    '--color-bg-input':        '#2A2D3E',
    '--color-bg-input-subtle': '#2A2D3E',
    '--color-bg-row-hover':    '#222536',
    '--color-bg-hover':        '#3A3D52',
    '--color-bg-muted':        '#2A2D3E',
    '--color-bg-icon-btn':     'rgba(255,255,255,0.05)',
    '--color-border':          '#3A3D52',
    '--color-border-strong':   '#4A4D66',
    '--color-border-subtle':   '#3A3D52',
    '--color-text-primary':    '#FFFFFF',
    '--color-text-secondary':  '#A0AEC0',
    '--color-text-muted':      '#6B7280',
    '--color-text-placeholder':'#6B7280',
    '--color-chart-grid':      '#3A3D52',
    '--color-chart-axis':      '#6B7280',
    '--color-tooltip-bg':      '#222536',
    '--color-tooltip-border':  '#3A3D52',
    '--color-tooltip-label':   '#A0AEC0',
    '--color-tooltip-value':   '#FFFFFF',
    '--color-overlay':         'rgba(0,0,0,0.65)',
    '--color-shadow':          'rgba(0,0,0,0.4)',
    '--color-shadow-strong':   'rgba(0,0,0,0.6)',
    '--color-accent-surface':  '#193A52',
    '--color-scrollbar':       '#3A3D52',
    '--color-tab-inactive':    '#2A2D3E',
    '--color-tab-active-bg':   '#1A1D27',
    '--brand-header-text':     '#FFFFFF',
    '--brand-header-solid':    '#0D5B80',
    '--sidebar-bg':            'linear-gradient(180deg, #0F1117 0%, #1A1D27 60%, #0F1117 100%)',
    '--sidebar-border':        '#3A3D52',
    '--sidebar-nav-active':    '#193A52',
    '--sidebar-nav-hover':     '#222536',
    '--sidebar-section-label': '#6B7280',
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

  const applyTheme = useCallback((t) => {
    const root = document.documentElement;
    const primary = t.primaryColor || DEFAULT_THEME.primaryColor;
    const mode = t.mode === 'dark' ? 'dark' : 'light';
    const tokens = THEME_TOKENS[mode];

    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--primary-hover', shiftColor(primary, -20));
    root.style.setProperty('--primary-ring', hexToRgba(primary, 0.25));

    const gradientTo = shiftColor(primary, -25);
    root.style.setProperty('--gradient-from', primary);
    root.style.setProperty('--gradient-to', gradientTo);

    if (mode === 'light') {
      const gradient = `linear-gradient(to right, ${primary}, ${gradientTo})`;
      const sidebarGradient = `linear-gradient(180deg, ${primary} 0%, ${gradientTo} 55%, ${shiftColor(primary, -35)} 100%)`;
      root.style.setProperty('--brand-header-bg', gradient);
      root.style.setProperty('--btn-brand-bg', gradient);
      root.style.setProperty('--sidebar-bg', sidebarGradient);
    } else {
      root.style.setProperty('--brand-header-bg', tokens['--brand-header-solid']);
      root.style.setProperty('--btn-brand-bg', tokens['--brand-header-solid']);
      root.style.setProperty('--sidebar-bg', tokens['--sidebar-bg']);
    }
    root.style.setProperty('--brand-header-text', tokens['--brand-header-text']);

    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

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
      const saved = localStorage.getItem('swavelink_theme');
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
    localStorage.setItem('swavelink_theme', JSON.stringify(next));
    applyTheme(next);
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
