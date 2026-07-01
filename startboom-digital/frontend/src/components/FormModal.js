import React from 'react';
import { X } from 'lucide-react';
import dm from '../utils/darkModeClasses';

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
    <div className={dm.modalOverlay}>
      <div
        className={`modal-shell ${size} max-h-[min(90vh,900px)] flex flex-col`}
        role="dialog"
        aria-modal="true"
      >
        <div className={`${dm.modalHeader} flex-shrink-0`}>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && <p className="text-sm opacity-90 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-80 transition-opacity"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`${dm.modalBody} min-h-0`}>{children}</div>

        {footer && <div className={dm.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
};

export default FormModal;
