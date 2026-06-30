import React from 'react';
import { X, LogOut, AlertCircle } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header - Orange */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Confirm Logout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - White */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Are you sure you want to logout? You'll need to sign in again to access your account.
          </p>

          <div className="flex items-center space-x-3 mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <LogOut className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-orange-700">
              Your session will be ended and you'll be redirected to the login page.
            </span>
          </div>
        </div>

        {/* Footer - White with Orange buttons */}
        <div className="bg-gray-50 p-6 rounded-b-2xl border-t flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;






