import React, { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp } from 'lucide-react';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import UnifiedCard from './UnifiedCard';
import dm from '../utils/darkModeClasses';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getLeaderboard();
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `UGX ${Number(amount || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-gradient-to-r from-yellow-100 to-yellow-200', label: '🏆 1st' };
    } else if (rank === 2) {
      return { icon: Medal, color: 'text-gray-400', bg: 'bg-gradient-to-r from-gray-100 to-gray-200', label: '🥈 2nd' };
    } else if (rank === 3) {
      return { icon: Medal, color: 'text-orange-500', bg: 'bg-gradient-to-r from-orange-100 to-orange-200', label: '🥉 3rd' };
    }
    return { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50', label: `${rank}th` };
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  if (loading) {
    return (
      <UnifiedCard title="Top Performers" headerAction={<Trophy className="w-5 h-5 text-yellow-300" />}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
        </div>
      </UnifiedCard>
    );
  }

  return (
    <UnifiedCard
      title="Top Performers"
      headerAction={<Trophy className="w-5 h-5 text-yellow-300" />}
    >
      {leaderboard.length === 0 ? (
        <p className={`text-center py-4 ${dm.textMuted}`}>No data available</p>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((agent, index) => {
            const rank = index + 1;
            const badge = getRankBadge(rank);
            const percentage = agent.target > 0 ? (agent.monthlySales / agent.target) * 100 : 0;
            const BadgeIcon = badge.icon;

            return (
              <div
                key={agent._id}
                className={`p-4 rounded-lg border transition-transform hover:scale-[1.01] ${dm.border} bg-[var(--color-bg-input-subtle)]`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      <BadgeIcon className={`w-6 h-6 ${badge.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{agent.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{formatCurrency(agent.monthlySales)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Target</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(agent.target)}</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>{percentage.toFixed(0)}% Complete</span>
                    <span className="font-medium text-green-600">{formatCurrency(agent.commission)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-[#2A2D3E] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </UnifiedCard>
  );
};

export default Leaderboard;
