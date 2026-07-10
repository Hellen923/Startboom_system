// Search Bar Component - Reusable search with filter
import React, { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SearchBar = ({ 
  placeholder = 'Search...', 
  onSearch, 
  onFilterClick,
  hasFilters = false,
  debounceMs = 300,
  initialValue = ''
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedTerm, setDebouncedTerm] = useState(initialValue);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Call onSearch when debounced term changes
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedTerm);
    }
  }, [debouncedTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 rounded-lg border transition-all ${
            isDark 
              ? 'bg-[#1E293B] border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
          } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Button */}
      {hasFilters && (
        <button
          onClick={onFilterClick}
          className={`px-4 py-3 rounded-lg border font-medium transition-all flex items-center space-x-2 ${
            isDark 
              ? 'bg-[#1E293B] border-gray-700 text-white hover:bg-[#334155]' 
              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span>Filters</span>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
