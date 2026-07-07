// Activities & Gamification - Battle Card and Leaderboard
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Zap, 
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  Target,
  Award,
  Medal,
  Crown,
  Star,
  Filter,
  Users
} from 'lucide-react';
import { activityApi } from '../../services/enterpriseApi';
import PROFESSIONAL_COLORS from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Activities = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [battleCard, setBattleCard] = useState([]);
  const [timeframe, setTimeframe] = useState('week'); // week, month, quarter, year
  const [filterType, setFilterType] = useState('all'); // all, calls, emails, meetings, etc.

  useEffect(() => {
    fetchBattleCard();
  }, [timeframe, filterType]);

  const fetchBattleCard = async () => {
    try {
      setLoading(true);
      const params = { timeframe };
      if (filterType !== 'all') params.activityType = filterType;
      
      const response = await activityApi.getBattleCard(params);
      setBattleCard(response.data.battleCard || []);
    } catch (error) {
      console.error('Error fetching battle card:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return Crown;
      case 2: return Trophy;
      case 3: return Medal;
      default: return Award;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return PROFESSIONAL_COLORS.gray[400];
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Performance Battle Card
        </h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Real-time leaderboard showing top performers and activity scores
        </p>
      </div>

      {/* Filters */}
      <div className={`rounded-xl p-6 mb-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex-1 flex flex-wrap gap-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
            >
              <option value="all">All Activities</option>
              <option value="call">Calls Only</option>
              <option value="email">Emails Only</option>
              <option value="meeting">Meetings Only</option>
              <option value="demo">Demos Only</option>
              <option value="deal_created">Deals Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {battleCard.length >= 3 && (
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* 2nd Place */}
          <PodiumCard
            user={battleCard[1]}
            rank={2}
            isDark={isDark}
          />
          {/* 1st Place */}
          <PodiumCard
            user={battleCard[0]}
            rank={1}
            isDark={isDark}
          />
          {/* 3rd Place */}
          <PodiumCard
            user={battleCard[2]}
            rank={3}
            isDark={isDark}
          />
        </div>
      )}
      {/* Full Leaderboard */}
      <div className={`rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg overflow-hidden`}>
        <div className="p-6 border-b" style={{ borderColor: isDark ? '#334155' : '#E5E7EB' }}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Full Leaderboard
          </h2>
        </div>
        
        {battleCard.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              No Activity Data
            </h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No activities recorded for the selected period
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-[#334155]' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Activities</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Calls</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Emails</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Meetings</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Deals</th>
                </tr>
              </thead>
              <tbody>
                {battleCard.map((user, index) => (
                  <LeaderboardRow
                    key={user.userId || index}
                    user={user}
                    rank={index + 1}
                    isDark={isDark}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Podium Card Component
const PodiumCard = ({ user, rank, isDark }) => {
  const RankIcon = getRankIcon(rank);
  const rankColor = getRankColor(rank);
  const heightClass = rank === 1 ? 'h-64' : rank === 2 ? 'h-56' : 'h-48';
  const orderClass = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3';

  return (
    <div className={`${orderClass} flex flex-col items-center`}>
      {/* Rank Icon */}
      <div 
        className="p-4 rounded-full mb-4 shadow-lg"
        style={{ backgroundColor: `${rankColor}20` }}
      >
        <RankIcon className="w-8 h-8" style={{ color: rankColor }} />
      </div>

      {/* User Card */}
      <div 
        className={`w-full rounded-xl p-6 text-center ${heightClass} flex flex-col justify-between ${
          isDark ? 'bg-[#1E293B]' : 'bg-white'
        } shadow-lg border-2`}
        style={{ borderColor: rankColor }}
      >
        <div>
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: rankColor }}
          >
            {(user.userName || 'U').charAt(0).toUpperCase()}
          </div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
            {user.userName || 'Unknown'}
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {user.teamName || 'No Team'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="w-5 h-5" style={{ color: rankColor }} />
            <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user.totalScore || 0}
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Activity Score</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user.activityCount || 0}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Activities</p>
          </div>
          <div>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user.breakdown?.deal_created || 0}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Deals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Leaderboard Row Component
const LeaderboardRow = ({ user, rank, isDark }) => {
  const RankIcon = getRankIcon(rank);
  const rankColor = getRankColor(rank);
  const isTopThree = rank <= 3;

  return (
    <tr 
      className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} ${
        isDark ? 'hover:bg-[#334155]' : 'hover:bg-gray-50'
      } transition`}
      style={isTopThree ? { backgroundColor: isDark ? `${rankColor}15` : `${rankColor}10` } : {}}
    >
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${rankColor}20` }}
          >
            <RankIcon className="w-4 h-4" style={{ color: rankColor }} />
          </div>
          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            #{rank}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: rankColor }}
          >
            {(user.userName || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user.userName || 'Unknown'}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {user.teamName || 'No Team'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center space-x-1">
          <Star className="w-4 h-4" style={{ color: PROFESSIONAL_COLORS.warning.main }} />
          <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {user.totalScore || 0}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {user.activityCount || 0}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {user.breakdown?.call || 0}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {user.breakdown?.email || 0}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {user.breakdown?.meeting || 0}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {user.breakdown?.deal_created || 0}
        </span>
      </td>
    </tr>
  );
};

// Helper functions (defined outside component)
const getRankIcon = (rank) => {
  switch (rank) {
    case 1: return Crown;
    case 2: return Trophy;
    case 3: return Medal;
    default: return Award;
  }
};

const getRankColor = (rank) => {
  switch (rank) {
    case 1: return '#FFD700'; // Gold
    case 2: return '#C0C0C0'; // Silver
    case 3: return '#CD7F32'; // Bronze
    default: return PROFESSIONAL_COLORS.gray[400];
  }
};

export default Activities;
