import React from 'react';
import { X, LogOut, AlertCircle } from 'lucide-react';
import dm from '../utils/darkModeClasses';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className={dm.modalOverlay}>
      <div className={`${dm.modalShell} max-w-md`}>
        <div className={`${dm.modalHeader} rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Confirm Logout</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-80 rounded-lg transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={dm.modalBody}>
          <p className={`${dm.textSecondary} mb-6`}>
            Are you sure you want to logout? You'll need to sign in again to access your account.
          </p>
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${dm.border} ${dm.accentSurface}`}>
            <LogOut className="w-5 h-5 text-[var(--primary-color)]" />
            <span className={`text-sm text-[var(--primary-color)]`}>
              Your session will be ended and you'll be redirected to the login page.
            </span>
          </div>
        </div>

        <div className={dm.modalFooter}>
          <button type="button" onClick={onClose} className={dm.btnSecondary}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={`${dm.btnBrand} flex items-center gap-2`}>
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
