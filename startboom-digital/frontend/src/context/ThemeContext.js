import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ACCENT_PRESETS = [
  { id: 'gold', label: 'Gold', color: '#FFD700' },
  { id: 'amber', label: 'Amber', color: '#d97706' },
  { id: 'emerald', label: 'Emerald', color: '#059669' },
  { id: 'blue', label: 'Blue', color: '#2563eb' },
  { id: 'purple', label: 'Purple', color: '#7c3aed' },
  { id: 'rose', label: 'Rose', color: '#e11d48' },
  { id: 'slate', label: 'Slate', color: '#475569' },
  { id: 'brown', label: 'Brown', color: '#92400e' },
];

const DEFAULT_THEME = {
  primaryColor: '#FFD700',
  accentPreset: 'gold',
  sidebarStyle: 'expanded',
  mode: 'light',
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    const savedTheme = localStorage.getItem('crm_theme');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        const merged = { ...DEFAULT_THEME, ...parsedTheme };
        setTheme(merged);
        applyTheme(merged);
      } catch (error) {
        console.error('Failed to parse saved theme:', error);
      }
    } else {
      applyTheme(DEFAULT_THEME);
    }
  }, []);

  const applyTheme = (themeConfig) => {
    const root = document.documentElement;
    const body = document.body;
    const primary = themeConfig.primaryColor || DEFAULT_THEME.primaryColor;

    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--primary-hover', adjustColor(primary, -20));
    root.style.setProperty('--primary-light', adjustColor(primary, 40));
    root.style.setProperty('--primary-ring', `${primary}66`);
    root.style.setProperty('--workspace-bg', `color-mix(in srgb, ${primary} 7%, #f9fafb)`);
    root.style.setProperty('--workspace-sidebar', primary);
    root.style.setProperty('--workspace-sidebar-hover', adjustColor(primary, -20));

    if (themeConfig.mode === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.style.setProperty('--workspace-bg', `color-mix(in srgb, ${primary} 10%, #111827)`);
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  };

  const adjustColor = (color, amount) => {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00ff) + amount;
    let b = (num & 0x0000ff) + amount;
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  };

  const updateTheme = (newTheme) => {
    const updatedTheme = { ...theme, ...newTheme };
    if (newTheme.accentPreset) {
      const preset = ACCENT_PRESETS.find((p) => p.id === newTheme.accentPreset);
      if (preset) updatedTheme.primaryColor = preset.color;
    }
    if (newTheme.primaryColor && !newTheme.accentPreset) {
      const match = ACCENT_PRESETS.find((p) => p.color.toLowerCase() === newTheme.primaryColor.toLowerCase());
      updatedTheme.accentPreset = match?.id || 'custom';
    }
    setTheme(updatedTheme);
    localStorage.setItem('crm_theme', JSON.stringify(updatedTheme));
    applyTheme(updatedTheme);
  };

  const setAccentPreset = (presetId) => {
    const preset = ACCENT_PRESETS.find((p) => p.id === presetId);
    if (preset) updateTheme({ accentPreset: presetId, primaryColor: preset.color });
  };

  const resetTheme = () => updateTheme(DEFAULT_THEME);

  const value = {
    theme,
    updateTheme,
    setAccentPreset,
    resetTheme,
    applyTheme,
    accentPresets: ACCENT_PRESETS,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
