import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAddNewActions, getIconColors } from '../utils/roleConfig';

const QuickActionModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'agent';
  const actions = getAddNewActions(role);

  if (!isOpen) return null;

  const handleAction = (action) => {
    navigate(action.path, { state: action.state });
    onClose();
  };

  const roleLabel = {
    superadmin: 'Platform',
    admin: 'Organization',
    manager: 'Organization',
    agent: 'Sales',
  }[role] || 'Quick';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add New</h2>
            <p className="text-sm text-gray-500 mt-0.5">{roleLabel} actions for your role</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
          {actions.map((action) => {
            const Icon = action.icon;
            const colors = getIconColors('orange');
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => handleAction(action)}
                className="flex items-center gap-4 w-full rounded-xl border border-gray-200 p-4 text-left hover:border-orange-300 hover:bg-orange-50/30 transition"
              >
                <div className={`rounded-xl p-2.5 ${colors.bg} ${colors.text}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActionModal;
