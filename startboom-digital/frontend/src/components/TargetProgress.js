import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, DollarSign } from 'lucide-react';
import { performanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

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
        earned: data.commissionEarned || 0
      });
    } catch (error) {
      console.error('Error loading target data:', error);
      // Don't show error toast for missing data
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `UGX ${Number(amount || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
  };

  const achieved = salesValue || 0;
  const percentage = target > 0 ? (achieved / target) * 100 : 0;
  const remaining = Math.max(0, target - achieved);

  const getStatusMessage = () => {
    if (percentage >= 100) {
      return { text: '🎉 Congratulations! You\'ve met your monthly target!', color: 'text-green-600' };
    } else if (percentage >= 50) {
      return { text: '👍 You\'re on track to meet your target!', color: 'text-blue-600' };
    } else {
      return { text: '💪 Keep pushing to reach your target!', color: 'text-orange-600' };
    }
  };

  const status = getStatusMessage();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Progress</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (target === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-600" />
          Target Progress
        </h3>
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No target set for this month</p>
          <p className="text-sm text-gray-400 mt-1">Contact your admin to set up targets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-primary-600" />
        Your Monthly Target
      </h3>

      {/* Target Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium mb-1">Target</p>
          <p className="text-lg font-bold text-blue-900">{formatCurrency(target)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600 font-medium mb-1">Achieved</p>
          <p className="text-lg font-bold text-green-900">{formatCurrency(achieved)}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">{percentage.toFixed(1)}% Complete</span>
          <span className="text-gray-600">{formatCurrency(remaining)} remaining</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              percentage >= 100
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : percentage >= 50
                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                : 'bg-gradient-to-r from-orange-400 to-orange-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <p className={`text-sm font-medium ${status.color} mb-4`}>{status.text}</p>

      {/* Commission Info */}
      {commission.rate > 0 && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Commission Rate</p>
              <p className="text-lg font-bold text-gray-900">{commission.rate}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Earned This Month</p>
              <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {formatCurrency(commission.earned)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetProgress;
