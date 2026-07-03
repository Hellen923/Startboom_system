import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange, pageSizeOptions = [10, 20, 50, 100] }) => {
  if (totalPages <= 1 && totalItems <= pageSizeOptions[0]) return null;

  const pages = [];
  const delta = 2;
  const left = currentPage - delta;
  const right = currentPage + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i);
    }
  }

  const withEllipsis = [];
  let prev = null;
  for (const page of pages) {
    if (prev && page - prev > 1) withEllipsis.push('...');
    withEllipsis.push(page);
    prev = page;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3 border-t border-gray-100 dark:border-[#3A3D52]">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#A0AEC0]">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
          className="rounded-lg border border-gray-200 dark:border-[#3A3D52] bg-white dark:bg-[#2A2D3E] text-gray-700 dark:text-gray-200 text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#1795CC]"
        >
          {pageSizeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <span className="hidden sm:inline">
          {totalItems > 0 ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalItems)} of ${totalItems}` : '0 results'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-[#3A3D52] bg-white dark:bg-[#1A1D27] text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#222536] transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {withEllipsis.map((item, idx) =>
          item === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 dark:text-gray-600 text-sm">…</span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg border text-sm font-medium transition px-2 ${
                item === currentPage
                  ? 'border-[#1795CC] bg-[#1795CC] text-white'
                  : 'border-gray-200 dark:border-[#3A3D52] bg-white dark:bg-[#1A1D27] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222536]'
              }`}
            >
              {item}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-[#3A3D52] bg-white dark:bg-[#1A1D27] text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#222536] transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
