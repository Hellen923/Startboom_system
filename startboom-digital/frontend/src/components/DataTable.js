// Standardized Data Table Component
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TABLE_STYLES, getStatusBadge, formatStatusText } from '../utils/designSystem';

/**
 * DataTable - Fully featured table with sorting, actions, and responsive design
 */
const DataTable = ({
  columns = [],
  data = [],
  onRowClick,
  actions,
  sortable = true,
  hoverable = true,
  className = '',
}) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [activeRowMenu, setActiveRowMenu] = useState(null);

  // Handle column sorting
  const handleSort = (key) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Render cell value
  const renderCell = (column, row) => {
    const value = row[column.key];

    // Custom render function
    if (column.render) {
      return column.render(value, row);
    }

    // Status badge
    if (column.type === 'status') {
      return (
        <span className={getStatusBadge(value)}>
          {formatStatusText(value)}
        </span>
      );
    }

    // Currency
    if (column.type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: column.currency || 'USD',
      }).format(value || 0);
    }

    // Number
    if (column.type === 'number') {
      return new Intl.NumberFormat('en-US').format(value || 0);
    }

    // Date
    if (column.type === 'date') {
      return value ? new Date(value).toLocaleDateString() : '-';
    }

    // Default
    return value || '-';
  };

  return (
    <div className={`overflow-hidden rounded-2xl bg-white dark:bg-[#1E293B] shadow-[0_8px_30px_rgba(15,23,42,0.06)] ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#F1F5F9] dark:border-[#1E293B]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] ${sortable && column.sortable !== false ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.label}</span>
                    {sortable && column.sortable !== false && (
                      <span className="text-[#94A3B8]">
                        {sortConfig.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4 opacity-40" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]" style={{ width: '60px' }}></th>}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1E293B]">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-12 text-center text-[#64748B] dark:text-[#94A3B8] text-sm"
                >
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`
                    transition-colors duration-150
                    ${hoverable ? 'hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={`${row.id || rowIndex}-${column.key}`}
                      className="px-4 py-4 text-sm text-[#0F172A] dark:text-[#F8FAFC]"
                      style={{ width: column.width }}
                    >
                      {renderCell(column, row)}
                    </td>
                  ))}
                  
                  {/* Row Actions */}
                  {actions && (
                    <td className="px-4 py-4 text-sm">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRowMenu(activeRowMenu === rowIndex ? null : rowIndex);
                          }}
                          className="p-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors duration-150"
                        >
                          <MoreVertical className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeRowMenu === rowIndex && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveRowMenu(null)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-[0_8px_30px_rgba(15,23,42,0.12)] z-20 py-1 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
                              {actions.map((action, actionIndex) => (
                                <button
                                  key={actionIndex}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(row);
                                    setActiveRowMenu(null);
                                  }}
                                  className={`
                                    w-full px-4 py-2.5 text-left text-sm flex items-center space-x-2 transition-colors duration-150
                                    ${isDark ? 'hover:bg-[#0F172A] text-[#CBD5E1]' : 'hover:bg-[#F8FAFC] text-[#475569]'}
                                    ${action.danger ? 'text-[#EF4444] dark:text-[#FCA5A5]' : ''}
                                  `}
                                >
                                  {action.icon && <action.icon className="w-4 h-4" />}
                                  <span>{action.label}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
