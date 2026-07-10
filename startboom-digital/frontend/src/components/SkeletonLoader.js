// Skeleton Loader Component - Shows loading placeholders
import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const SkeletonCard = ({ height = 'h-32' }) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  return (
    <div className={`${height} rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'} p-6 animate-pulse`}>
      <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4 mb-4`}></div>
      <div className={`h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2 mb-2`}></div>
      <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4`}></div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4 }) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  return (
    <div className={`rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'} overflow-hidden`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-[#334155]' : 'bg-gray-50'} px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className={`h-4 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} rounded w-24 animate-pulse`}></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} last:border-b-0`}
        >
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`}
                style={{ width: `${60 + Math.random() * 40}%` }}
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonList = ({ items = 5 }) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div 
          key={index}
          className={`rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'} p-4 animate-pulse`}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <div className="flex-1 space-y-2">
              <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4`}></div>
              <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2`}></div>
            </div>
            <div className={`w-20 h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonChart = ({ height = 'h-64' }) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  return (
    <div className={`${height} rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'} p-6 flex items-end justify-between animate-pulse`}>
      {Array.from({ length: 7 }).map((_, index) => (
        <div 
          key={index}
          className={`w-12 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-t`}
          style={{ height: `${30 + Math.random() * 70}%` }}
        ></div>
      ))}
    </div>
  );
};

export const SkeletonGrid = ({ items = 6, columns = 3 }) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export default SkeletonCard;
