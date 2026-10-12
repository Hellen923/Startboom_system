/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // primary maps to CSS variable so admin branding color applies everywhere
        primary: {
          DEFAULT: 'var(--primary-color)',
          50:  'color-mix(in srgb, var(--primary-color) 10%, white)',
          100: 'color-mix(in srgb, var(--primary-color) 20%, white)',
          200: 'color-mix(in srgb, var(--primary-color) 35%, white)',
          300: 'color-mix(in srgb, var(--primary-color) 55%, white)',
          400: 'color-mix(in srgb, var(--primary-color) 75%, white)',
          500: 'var(--primary-color)',
          600: 'var(--primary-hover)',
          700: 'color-mix(in srgb, var(--primary-color) 70%, black)',
          800: 'color-mix(in srgb, var(--primary-color) 50%, black)',
          900: 'color-mix(in srgb, var(--primary-color) 30%, black)',
        },
        // CoreMint purple (static for utilities)
        purple: {
          DEFAULT: '#4F19C7',
          50:  '#F0E9FF',
          100: '#E5D9FF',
          200: '#D1B3FF',
          300: '#B589FF',
          400: '#8B5CF6',
          500: '#4F19C7',
          600: '#3D0FA0',
          700: '#310C7F',
          800: '#23095C',
          900: '#17063D',
        },
        blue: {
          DEFAULT: '#3B82F6',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        secondary: {
          DEFAULT: '#17143D',  // Midnight navy
          50:  '#F8F7FC',      // Off-white canvas
          100: '#F5F3F8',      // Soft gray
          200: '#E8E5F0',      // Light gray
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#17143D',      // Midnight navy
          950: '#0F0D1E',
        },
        // Dark mode design tokens
        dm: {
          bg:           '#0F172A',
          sidebar:      '#1E293B',
          card:         '#1E293B',
          surface:      '#334155',
          input:        '#334155',
          'row-hover':  '#334155',
          border:       '#3A3D52',
          'border-strong': '#4A4D66',
          'text-primary':  '#FFFFFF',
          'text-secondary':'#CBD5E1',
          'text-muted':    '#94A3B8',
          accent:       '#4F19C7',
          'accent-hover':'#3D0FA0',
          'accent-surface':'#F0E9FF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        xl: '10px', '2xl': '12px', '3xl': '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(79, 25, 199, 0.06), 0 1px 2px rgba(79, 25, 199, 0.04)',
        'card-hover': '0 4px 12px rgba(79, 25, 199, 0.08)',
        modal: '0 20px 60px rgba(79, 25, 199, 0.15)',
      },
    },
  },
  plugins: [],
};
