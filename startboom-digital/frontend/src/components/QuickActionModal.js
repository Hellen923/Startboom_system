import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAddNewActions, getIconColors } from '../utils/roleConfig';
import dm from '../utils/darkModeClasses';

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

  const roleLabel = { superadmin: 'Platform', admin: 'Organization', manager: 'Organization', agent: 'Sales' }[role] || 'Quick';

  return (
    <div className={dm.modalOverlay}>
      <div className={`${dm.modalShell} max-w-md relative`}>
        <div className={dm.modalHeader}>
          <div>
            <h2 className="text-lg font-semibold">Add New</h2>
            <p className="text-sm opacity-90 mt-0.5">{roleLabel} actions for your role</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:opacity-80 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={`${dm.modalBody} grid grid-cols-1 gap-2 max-h-[60vh]`}>
          {actions.map((action) => {
            const Icon = action.icon;
            const colors = getIconColors('primary');
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => handleAction(action)}
                className={`flex items-center gap-4 w-full rounded-xl border p-4 text-left transition hover:bg-[var(--color-bg-row-hover)] ${dm.border}`}
              >
                <div className={`rounded-xl p-2.5 ${colors.bg} ${colors.text}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`font-medium ${dm.textPrimary}`}>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActionModal;
