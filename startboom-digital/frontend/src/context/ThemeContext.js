import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const ACCENT_PRESETS = [
  { id: 'honeypot', label: 'HoneyPot Gold', color: '#D99A00' },
  { id: 'sage',     label: 'Sage Green',    color: '#4F8A5B' },
  { id: 'amber',    label: 'Burnt Amber',   color: '#F59E0B' },
  { id: 'slate',    label: 'Slate Blue',    color: '#3B82F6' },
  { id: 'plum',     label: 'Deep Plum',     color: '#8B5CF6' },
  { id: 'teal',     label: 'Teal',          color: '#06B6D4' },
];

const DEFAULT_THEME = {
  mode: 'light',
  primaryColor: '#D99A00',  // HoneyPot Gold
  accentPreset: 'honeypot',
};

/** Full light/dark token sets — applied to :root via applyTheme() */
const THEME_TOKENS = {
  light: {
    // HoneyPot Premium: Cream backgrounds, charcoal text, restrained honey gold
    '--workspace-bg':          '#FFFDF7',  // Soft cream
    '--color-bg-page':         '#FFFDF7',  // Soft cream
    '--color-bg-card':         '#FFFFFF',  // Pure white cards
    '--color-bg-surface':      '#FFFFFF',
    '--color-bg-elevated':     '#F5F3EF',  // Subtle gray-cream
    '--color-bg-input':        '#FFFFFF',
    '--color-bg-input-subtle': '#F5F3EF',
    '--color-bg-row-hover':    '#FFF9E6',  // Light honey tint
    '--color-bg-hover':        '#F5F3EF',
    '--color-bg-muted':        '#F5F3EF',
    '--color-bg-icon-btn':     '#F5F3EF',
    '--color-border':          '#E8E3D5',  // Warm border
    '--color-border-strong':   '#D1D5DB',
    '--color-border-subtle':   '#F5F3EF',
    '--color-text-primary':    '#2D2A26',  // Dark charcoal (never pure black)
    '--color-text-secondary':  '#6B6B6B',  // Slate gray
    '--color-text-muted':      '#9CA3AF',
    '--color-text-placeholder':'#9CA3AF',
    '--color-chart-grid':      '#E8E3D5',
    '--color-chart-axis':      '#9CA3AF',
    '--color-tooltip-bg':      '#FFFFFF',
    '--color-tooltip-border':  '#E8E3D5',
    '--color-tooltip-label':   '#6B6B6B',
    '--color-tooltip-value':   '#2D2A26',
    '--color-overlay':         'rgba(45, 42, 38, 0.6)',
    '--color-shadow':          'rgba(45, 42, 38, 0.08)',
    '--color-shadow-strong':   'rgba(45, 42, 38, 0.15)',
    '--color-accent-surface':  '#FFF9E6',  // Light honey
    '--color-scrollbar':       '#E8E3D5',
    '--color-tab-inactive':    '#F5F3EF',
    '--color-tab-active-bg':   '#FFFFFF',
    '--brand-header-text':     '#FFFFFF',
    '--brand-header-solid':    '#B7791F',  // Deep Amber
    '--sidebar-bg':            'linear-gradient(180deg, #2D2A26 0%, #2D2A26 70%, rgba(217, 154, 0, 0.12) 100%)',  // Very subtle gold hint
    '--sidebar-border':        'rgba(232, 227, 213, 0.1)',
    '--sidebar-nav-active':    'rgba(217, 154, 0, 0.2)',
    '--sidebar-nav-hover':     'rgba(217, 154, 0, 0.1)',
    '--sidebar-section-label': 'rgba(232, 227, 213, 0.5)',  // More transparent
  },
  dark: {
    // Dark mode: Keep honey gold accent, dark slate backgrounds
    '--workspace-bg':          '#0F172A',
    '--color-bg-page':         '#0F172A',
    '--color-bg-card':         '#1E293B',
    '--color-bg-surface':      '#334155',
    '--color-bg-elevated':     '#334155',
    '--color-bg-input':        '#2A2D3E',
    '--color-bg-input-subtle': '#2A2D3E',
    '--color-bg-row-hover':    '#334155',
    '--color-bg-hover':        '#475569',
    '--color-bg-muted':        '#2A2D3E',
    '--color-bg-icon-btn':     'rgba(255,255,255,0.05)',
    '--color-border':          '#334155',
    '--color-border-strong':   '#475569',
    '--color-border-subtle':   '#334155',
    '--color-text-primary':    '#F8FAFC',
    '--color-text-secondary':  '#CBD5E1',
    '--color-text-muted':      '#94A3B8',
    '--color-text-placeholder':'#94A3B8',
    '--color-chart-grid':      '#334155',
    '--color-chart-axis':      '#94A3B8',
    '--color-tooltip-bg':      '#1E293B',
    '--color-tooltip-border':  '#334155',
    '--color-tooltip-label':   '#CBD5E1',
    '--color-tooltip-value':   '#F8FAFC',
    '--color-overlay':         'rgba(0,0,0,0.65)',
    '--color-shadow':          'rgba(0,0,0,0.4)',
    '--color-shadow-strong':   'rgba(0,0,0,0.6)',
    '--color-accent-surface':  'rgba(217, 154, 0, 0.1)',  // Subtle honey
    '--color-scrollbar':       '#334155',
    '--color-tab-inactive':    '#2A2D3E',
    '--color-tab-active-bg':   '#1E293B',
    '--brand-header-text':     '#FFFFFF',
    '--brand-header-solid':    '#B7791F',  // Deep Amber
    '--sidebar-bg':            'linear-gradient(180deg, #1E293B 0%, rgba(217, 154, 0, 0.3) 100%)',  // Dark slate to gold tint
    '--sidebar-border':        '#334155',
    '--sidebar-nav-active':    'rgba(217, 154, 0, 0.25)',  // Honey gold tint
    '--sidebar-nav-hover':     'rgba(217, 154, 0, 0.15)',
    '--sidebar-section-label': '#94A3B8',
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
      // HoneyPot: Restrained honey gold gradient for buttons/headers only
      const gradient = `linear-gradient(to right, ${primary}, ${gradientTo})`;
      root.style.setProperty('--brand-header-bg', gradient);
      root.style.setProperty('--btn-brand-bg', gradient);
      // Sidebar is solid charcoal (already set in tokens)
      root.style.setProperty('--sidebar-bg', tokens['--sidebar-bg']);
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
