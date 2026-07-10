// Standardized Page Layout Components
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { CONTAINERS, TYPOGRAPHY, COLORS } from '../utils/designSystem';

/**
 * Page Container - Main wrapper for all pages
 */
export const PageContainer = ({ children, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Page Header - Consistent header with title and actions
 */
export const PageHeader = ({ 
  title, 
  subtitle, 
  actions, 
  breadcrumbs,
  className = '' 
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  return (
    <div className={`mb-8 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <div className="flex items-center space-x-2 text-sm mb-3">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-gray-400">/</span>}
              <span className={index === breadcrumbs.length - 1 
                ? `font-medium ${isDark ? 'text-white' : 'text-gray-900'}`
                : 'text-gray-500 hover:text-gray-700 cursor-pointer'
              }>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      
      {/* Header Content */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-3xl`}>
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Actions */}
        {actions && (
          <div className="flex items-center space-x-3 ml-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Card Component - Standardized card layout
 */
export const Card = ({ 
  children, 
  className = '',
  padding = true,
  hover = false 
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  return (
    <div className={`
      rounded-xl shadow-sm overflow-hidden
      ${isDark ? 'bg-[#1E293B]' : 'bg-white'}
      ${padding ? 'p-6' : ''}
      ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

/**
 * Card Header - Standardized card header with title and actions
 */
export const CardHeader = ({ 
  title, 
  subtitle, 
  actions, 
  icon: Icon,
  className = '' 
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  return (
    <div className={`
      px-6 py-4 border-b flex items-center justify-between
      ${isDark ? 'border-gray-700' : 'border-gray-200'}
      ${className}
    `}>
      <div className="flex items-center space-x-3">
        {Icon && (
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-0.5`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
};

/**
 * Card Body - Standardized card body with padding
 */
export const CardBody = ({ children, className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Card Footer - Standardized card footer
 */
export const CardFooter = ({ children, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  return (
    <div className={`
      px-6 py-4 border-t flex items-center justify-end space-x-3
      ${isDark ? 'border-gray-700 bg-[#334155]/30' : 'border-gray-200 bg-gray-50'}
      ${className}
    `}>
      {children}
    </div>
  );
};

/**
 * Stats Grid - Consistent grid for stat cards
 */
export const StatsGrid = ({ children, columns = 4, className = '' }) => {
  return (
    <div className={`
      grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${columns} gap-6
      ${className}
    `}>
      {children}
    </div>
  );
};

/**
 * Stat Card - Consistent stat display
 */
export const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  changeType = 'neutral',
  iconBg = 'bg-blue-500',
  className = '' 
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };
  
  return (
    <Card hover className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {Icon && (
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${iconBg}`}>
              <Icon className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
          )}
          <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {label}
          </p>
          <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
          {change && (
            <p className={`text-sm font-medium ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * Section - Divides page into logical sections
 */
export const Section = ({ 
  title, 
  subtitle, 
  actions, 
  children, 
  className = '' 
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  return (
    <div className={`mb-8 ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * Grid Layout - Responsive grid
 */
export const GridLayout = ({ 
  children, 
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 6,
  className = '' 
}) => {
  return (
    <div className={`
      grid 
      grid-cols-${columns.sm} 
      md:grid-cols-${columns.md} 
      lg:grid-cols-${columns.lg} 
      xl:grid-cols-${columns.xl} 
      gap-${gap}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default {
  PageContainer,
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  StatsGrid,
  StatCard,
  Section,
  GridLayout,
};
