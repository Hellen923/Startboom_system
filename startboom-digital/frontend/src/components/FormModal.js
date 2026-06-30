import React from 'react';
import { X } from 'lucide-react';

/**
 * Scrollable modal with a sticky header and footer so long forms remain submittable.
 */
const FormModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'max-w-4xl',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${size} max-h-[min(90vh,900px)] flex flex-col overflow-hidden`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex-shrink-0 flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">{children}</div>

        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50">{footer}</div>
        )}
      </div>
    </div>
  );
};

export default FormModal;
