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
    <div className={`${TABLE_STYLES.container} ${className}`}>
      <div className="overflow-x-auto">
        <table className={TABLE_STYLES.table}>
          {/* Table Header */}
          <thead className={TABLE_STYLES.thead}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${TABLE_STYLES.th} ${sortable && column.sortable !== false ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.label}</span>
                    {sortable && column.sortable !== false && (
                      <span className="text-gray-400">
                        {sortConfig.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className={TABLE_STYLES.th} style={{ width: '60px' }}></th>}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className={TABLE_STYLES.tbody}>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`
                    ${TABLE_STYLES.tr}
                    ${hoverable ? 'hover:bg-gray-50 dark:hover:bg-[#334155]' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={`${row.id || rowIndex}-${column.key}`}
                      className={TABLE_STYLES.td}
                      style={{ width: column.width }}
                    >
                      {renderCell(column, row)}
                    </td>
                  ))}
                  
                  {/* Row Actions */}
                  {actions && (
                    <td className={TABLE_STYLES.td}>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRowMenu(activeRowMenu === rowIndex ? null : rowIndex);
                          }}
                          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeRowMenu === rowIndex && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveRowMenu(null)}
                            ></div>
                            <div className={`
                              absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-20 py-1
                              ${isDark ? 'bg-[#1E293B] border border-gray-700' : 'bg-white border border-gray-200'}
                            `}>
                              {actions.map((action, actionIndex) => (
                                <button
                                  key={actionIndex}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(row);
                                    setActiveRowMenu(null);
                                  }}
                                  className={`
                                    w-full px-4 py-2 text-left text-sm flex items-center space-x-2
                                    ${isDark ? 'hover:bg-[#334155] text-gray-300' : 'hover:bg-gray-50 text-gray-700'}
                                    ${action.danger ? 'text-red-600 dark:text-red-400' : ''}
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
