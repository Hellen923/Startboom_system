import { useTheme } from '../context/ThemeContext';

/** Recharts needs literal color values — read from CSS vars set by ThemeContext */
export const getChartColors = (isDark) => ({
  grid:       isDark ? '#3A3D52' : '#E5E7EB',
  axis:       isDark ? '#6B7280' : '#9CA3AF',
  tooltipBg:  isDark ? '#222536' : '#FFFFFF',
  tooltipBorder: isDark ? '#3A3D52' : '#E5E7EB',
  legend:     isDark ? '#A0AEC0' : '#374151',
  cursorFill: isDark ? '#2A2D3E' : '#fef3c7',
  labelColor: isDark ? '#A0AEC0' : '#6B7280',
  itemColor:  isDark ? '#FFFFFF' : '#111827',
});

export const getChartTooltipStyle = (isDark) => ({
  backgroundColor: isDark ? '#222536' : '#FFFFFF',
  border: `1px solid ${isDark ? '#3A3D52' : '#E5E7EB'}`,
  borderRadius: '8px',
});

export const useChartTheme = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const colors = getChartColors(isDark);
  return {
    isDark,
    ...colors,
    tooltipStyle: getChartTooltipStyle(isDark),
    labelStyle: { color: colors.labelColor },
    itemStyle:  { color: colors.itemColor },
  };
};
