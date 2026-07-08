// Activities & Leaderboard - Track team performance and gamification
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Trophy, 
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  Users,
  Award,
  Target,
  Star,
  Zap,
  Clock,
  Filter,
  Plus,
  Medal
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
  const [activeTab, setActiveTab] = useState('overview');
  const [activities, setActivities] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [battleCard, setBattleCard] = useState(null);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { timeRange };

      const [activitiesRes, myStatsRes, battleCardRes] = await Promise.all([
        activityApi.getAll(params),
        activityApi.getMyStats(params),
        activityApi.getBattleCard(params)
      ]);
      
      setActivities(activitiesRes.data.activities || []);
      setMyStats(myStatsRes.data.stats || {});
      setBattleCard(battleCardRes.data.battleCard || {});
      setLeaderboard(battleCardRes.data.battleCard?.leaderboard || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'meeting':
      case 'demo':
        return <Calendar className="w-4 h-4" />;
      case 'deal_created':
      case 'deal_moved':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return <Medal className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
  };

  if (loading) return <LoadingSpinner />;


  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Activities & Leaderboard
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Track team performance and celebrate top performers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#1E293B] text-white' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* My Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Activities"
          value={myStats?.totalActivities || 0}
          icon={Activity}
          gradient={PROFESSIONAL_COLORS.gradients.blue}
          isDark={isDark}
        />
        <StatCard
          title="Activity Score"
          value={myStats?.totalScore || 0}
          icon={Star}
          gradient={PROFESSIONAL_COLORS.gradients.purple}
          isDark={isDark}
        />
        <StatCard
          title="High Value"
          value={myStats?.highValueCount || 0}
          icon={Zap}
          gradient={PROFESSIONAL_COLORS.gradients.orange}
          isDark={isDark}
        />
        <StatCard
          title="My Rank"
          value={`#${myStats?.rank || '-'}`}
          icon={Trophy}
          gradient={PROFESSIONAL_COLORS.gradients.green}
          isDark={isDark}
        />
      </div>

      {/* Tabs */}
      <div className={`rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
        <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4`}>
          <div className="flex space-x-4 overflow-x-auto">
            {['overview', 'leaderboard', 'activities', 'breakdown'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all
                  ${activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab myStats={myStats} isDark={isDark} />}
          {activeTab === 'leaderboard' && <LeaderboardTab leaderboard={leaderboard} getRankMedal={getRankMedal} isDark={isDark} />}
          {activeTab === 'activities' && <ActivitiesTab activities={activities} getActivityIcon={getActivityIcon} isDark={isDark} />}
          {activeTab === 'breakdown' && <BreakdownTab myStats={myStats} isDark={isDark} />}
        </div>
      </div>
    </div>
  );
};


// Stat Card Component
const StatCard = ({ title, value, icon: Icon, gradient, isDark }) => (
  <div
    className="rounded-xl p-6"
    style={{
      background: isDark ? gradient : 'white',
      border: isDark ? 'none' : '1px solid #E5E7EB'
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
        <Icon className="w-5 h-5" style={{ color: isDark ? 'white' : PROFESSIONAL_COLORS.primary.main }} />
      </div>
    </div>
    <p className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{title}</p>
    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
  </div>
);

// Overview Tab
const OverviewTab = ({ myStats, isDark }) => (
  <div className="space-y-6">
    <div>
      <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        My Performance Overview
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox label="Calls" value={myStats?.breakdown?.call || 0} isDark={isDark} icon={Phone} />
        <MetricBox label="Emails" value={myStats?.breakdown?.email || 0} isDark={isDark} icon={Mail} />
        <MetricBox label="Meetings" value={myStats?.breakdown?.meeting || 0} isDark={isDark} icon={Calendar} />
        <MetricBox label="Demos" value={myStats?.breakdown?.demo || 0} isDark={isDark} icon={Target} />
        <MetricBox label="Follow-ups" value={myStats?.breakdown?.follow_up || 0} isDark={isDark} icon={Clock} />
        <MetricBox label="Proposals" value={myStats?.breakdown?.proposal_sent || 0} isDark={isDark} icon={TrendingUp} />
        <MetricBox label="Total Hours" value={((myStats?.totalDuration || 0) / 60).toFixed(1)} isDark={isDark} icon={Clock} />
        <MetricBox label="Avg Score" value={myStats?.avgScore?.toFixed(1) || 0} isDark={isDark} icon={Star} />
      </div>
    </div>
  </div>
);


// Leaderboard Tab
const LeaderboardTab = ({ leaderboard, getRankMedal, isDark }) => (
  <div>
    <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      Top Performers
    </h2>
    <div className="space-y-3">
      {leaderboard.map((user, index) => (
        <div
          key={user._id}
          className={`
            p-4 rounded-lg flex items-center justify-between
            ${isDark ? 'bg-[#334155]' : 'bg-gray-50'}
            ${index < 3 ? 'border-2' : ''}
            ${index === 0 ? 'border-yellow-500' : ''}
            ${index === 1 ? 'border-gray-400' : ''}
            ${index === 2 ? 'border-amber-600' : ''}
          `}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 flex items-center justify-center">
              {getRankMedal(index + 1)}
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white`}
                style={{ background: PROFESSIONAL_COLORS.gradients.blue }}>
                {user.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user.name}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Activities</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user.activityCount}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Score</p>
              <p className={`text-2xl font-bold`} style={{ color: PROFESSIONAL_COLORS.warning.main }}>
                {user.totalScore}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);


// Activities Tab
const ActivitiesTab = ({ activities, getActivityIcon, isDark }) => (
  <div>
    <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      Recent Activities
    </h2>
    <div className="space-y-3">
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No activities yet</p>
        </div>
      ) : (
        activities.map(activity => (
          <div
            key={activity._id}
            className={`p-4 rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-gray-50'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${PROFESSIONAL_COLORS.primary.main}20` }}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {activity.title}
                    </h3>
                    {activity.isHighValue && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-semibold flex items-center space-x-1">
                        <Zap className="w-3 h-3" />
                        <span>High Value</span>
                      </span>
                    )}
                  </div>
                  {activity.description && (
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 text-xs">
                    <span className={`px-2 py-1 rounded ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
                      {activity.type?.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      {activity.user?.name}
                    </span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      {new Date(activity.completedAt).toLocaleString()}
                    </span>
                    {activity.duration > 0 && (
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        {activity.duration} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Score</p>
                <p className={`text-xl font-bold`} style={{ color: PROFESSIONAL_COLORS.success.main }}>
                  {activity.score}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);


// Breakdown Tab
const BreakdownTab = ({ myStats, isDark }) => {
  const breakdown = myStats?.breakdown || {};
  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return (
    <div>
      <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Activity Breakdown
      </h2>
      <div className="space-y-4">
        {Object.entries(breakdown).map(([type, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={type}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {type.replace('_', ' ')}
                </span>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className={`w-full h-3 rounded-full ${isDark ? 'bg-[#334155]' : 'bg-gray-200'} overflow-hidden`}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    background: PROFESSIONAL_COLORS.gradients.blue
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Metric Box Component
const MetricBox = ({ label, value, isDark, icon: Icon }) => (
  <div className={`p-4 rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-white border border-gray-200'}`}>
    <div className="flex items-center justify-between mb-2">
      <Icon className="w-5 h-5 text-indigo-600" />
    </div>
    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
  </div>
);

export default Activities;
