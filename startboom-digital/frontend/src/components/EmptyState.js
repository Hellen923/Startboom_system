// Empty State Component - Friendly messages when no data exists
import React from 'react';
import { useTheme } from '../context/ThemeContext';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  illustration 
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
      {/* Icon or Illustration */}
      {illustration ? (
        <div className="mb-6">
          {illustration}
        </div>
      ) : Icon && (
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
          <Icon className={`w-10 h-10 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} strokeWidth={1.5} />
        </div>
      )}

      {/* Title */}
      <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>

      {/* Description */}
      <p className={`text-center max-w-md mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
