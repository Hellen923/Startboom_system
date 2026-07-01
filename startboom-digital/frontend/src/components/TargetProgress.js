import React, { useState, useEffect } from 'react';
import { Target, DollarSign } from 'lucide-react';
import { performanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UnifiedCard from './UnifiedCard';
import dm from '../utils/darkModeClasses';

const TargetProgress = ({ salesValue }) => {
  const { user } = useAuth();
  const [target, setTarget] = useState(0);
  const [commission, setCommission] = useState({ rate: 0, earned: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTargetData();
  }, [user]);

  const loadTargetData = async () => {
    try {
      setLoading(true);
      const userId = user?._id || user?.id;
      if (!userId) return;

      const response = await performanceAPI.getAgentStats(userId);
      const data = response.data;

      setTarget(data.monthlyTarget || 0);
      setCommission({
        rate: data.commissionRate || 0,
        earned: data.commissionEarned || 0,
      });
    } catch (error) {
      console.error('Error loading target data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    `UGX ${Number(amount || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;

  const achieved = salesValue || 0;
  const percentage = target > 0 ? (achieved / target) * 100 : 0;
  const remaining = Math.max(0, target - achieved);

  const getStatusMessage = () => {
    if (percentage >= 100) return { text: '🎉 Congratulations! You\'ve met your monthly target!', color: 'text-green-600' };
    if (percentage >= 50) return { text: '👍 You\'re on track to meet your target!', color: 'text-blue-600' };
    return { text: '💪 Keep pushing to reach your target!', color: 'text-orange-600' };
  };

  const status = getStatusMessage();
  const headerIcon = <Target className="w-5 h-5" />;

  if (loading) {
    return (
      <UnifiedCard title="Target Progress" headerAction={headerIcon}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]" />
        </div>
      </UnifiedCard>
    );
  }

  if (target === 0) {
    return (
      <UnifiedCard title="Target Progress" headerAction={headerIcon}>
        <div className="text-center py-8">
          <Target className={`w-12 h-12 mx-auto mb-3 ${dm.textMuted}`} />
          <p className={dm.textMuted}>No target set for this month</p>
          <p className={`text-sm mt-1 ${dm.textMuted}`}>Contact your admin to set up targets</p>
        </div>
      </UnifiedCard>
    );
  }

  return (
    <UnifiedCard title="Your Monthly Target" headerAction={headerIcon}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`rounded-lg p-3 ${dm.accentSurface}`}>
          <p className="text-xs font-medium mb-1 text-[var(--primary-color)]">Target</p>
          <p className={`text-lg font-bold ${dm.textPrimary}`}>{formatCurrency(target)}</p>
        </div>
        <div className="rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
          <p className="text-xs text-green-600 font-medium mb-1">Achieved</p>
          <p className="text-lg font-bold text-green-900 dark:text-green-300">{formatCurrency(achieved)}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className={`flex items-center justify-between text-sm mb-2 ${dm.textSecondary}`}>
          <span className="font-medium">{percentage.toFixed(1)}% Complete</span>
          <span>{formatCurrency(remaining)} remaining</span>
        </div>
        <div className="w-full bg-[var(--color-bg-muted)] rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all bg-[var(--primary-color)]"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      <p className={`text-sm font-medium ${status.color} mb-4`}>{status.text}</p>

      {commission.rate > 0 && (
        <div className={`border-t pt-4 mt-4 ${dm.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${dm.textMuted}`}>Commission Rate</p>
              <p className={`text-lg font-bold ${dm.textPrimary}`}>{commission.rate}%</p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${dm.textMuted}`}>Earned This Month</p>
              <p className="text-lg font-bold text-green-600 flex items-center gap-1 justify-end">
                <DollarSign className="w-4 h-4" />
                {formatCurrency(commission.earned)}
              </p>
            </div>
          </div>
        </div>
      )}
    </UnifiedCard>
  );
};

export default TargetProgress;
