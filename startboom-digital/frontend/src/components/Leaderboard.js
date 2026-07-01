import React, { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp } from 'lucide-react';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

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
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        Top Performers
      </h3>
      
      {leaderboard.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No data available</p>
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
                className={`p-4 rounded-lg border ${badge.bg} transition-transform hover:scale-102`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      <BadgeIcon className={`w-6 h-6 ${badge.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-600">{formatCurrency(agent.monthlySales)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Target</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(agent.target)}</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>{percentage.toFixed(0)}% Complete</span>
                    <span className="font-medium text-green-600">{formatCurrency(agent.commission)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
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
    </div>
  );
};

export default Leaderboard;
