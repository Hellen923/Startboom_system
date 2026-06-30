import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuickActions, getQuickActionsMeta, getIconColors } from '../utils/roleConfig';

/** Borderless action row — place after dashboard KPI cards */
const DashboardQuickActions = ({ role }) => {
  const navigate = useNavigate();
  const actions = getQuickActions(role);
  const meta = getQuickActionsMeta(role);

  if (!actions.length) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{meta.title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{meta.subtitle}</p>
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
              className={`group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:shadow-md ${colors.hover}`}
            >
              <div className={`rounded-xl p-2.5 shrink-0 ${colors.bg} ${colors.text}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{action.label}</p>
                {action.description && (
                  <p className="text-xs text-gray-500 truncate hidden sm:block">{action.description}</p>
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
