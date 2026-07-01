import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuickActions, getQuickActionsMeta, getIconColors } from '../utils/roleConfig';
import dm from '../utils/darkModeClasses';

const DashboardQuickActions = ({ role }) => {
  const navigate = useNavigate();
  const actions = getQuickActions(role);
  const meta = getQuickActionsMeta(role);

  if (!actions.length) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className={`text-base font-semibold ${dm.textPrimary}`}>{meta.title}</h2>
        <p className={`text-sm mt-0.5 ${dm.textMuted}`}>{meta.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const colors = getIconColors(action.color);
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate(action.path, { state: action.state || (action.openForm ? { openCreate: true } : undefined) })}
              className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-left shadow-sm transition hover:shadow-md ${dm.border} bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-row-hover)] ${colors.hover}`}
            >
              <div className={`rounded-xl p-2.5 shrink-0 ${colors.bg} ${colors.text}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className={`font-medium text-sm truncate ${dm.textPrimary}`}>{action.label}</p>
                {action.description && (
                  <p className={`text-xs truncate hidden sm:block ${dm.textMuted}`}>{action.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default DashboardQuickActions;
