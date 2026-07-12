// Intelligence Dashboard - Proactive Business Intelligence
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  BarChart3,
  Users,
  FileText,
  TrendingUp
} from 'lucide-react';
import { intelligenceApi } from '../../services/enterpriseApi';
import PROFESSIONAL_COLORS, { getStatusColor } from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const Intelligence = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchIntelligence();
  }, [timeRange]);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);
      const response = await intelligenceApi.getDashboard({ timeRange });
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error('Error fetching intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!dashboard) return <div>No data available</div>;

  const { summary, alerts, details } = dashboard;

  // Alert cards configuration
  const alertCards = [
    {
      title: 'Stale Clients',
      count: summary.staleClientsCount,
      icon: Users,
      color: PROFESSIONAL_COLORS.warning.main,
      gradient: PROFESSIONAL_COLORS.gradients.orange,
      description: 'Clients not contacted recently',
      tab: 'staleClients'
    },
    {
      title: 'Stuck Deals',
      count: summary.stuckDealsCount,
      icon: Clock,
      color: PROFESSIONAL_COLORS.danger.main,
      gradient: PROFESSIONAL_COLORS.gradients.pink,
      description: 'Deals stagnant in pipeline',
      tab: 'stuckDeals'
    },
    {
      title: 'Overdue Follow-ups',
      count: summary.overdueFollowUpsCount,
      icon: AlertTriangle,
      color: PROFESSIONAL_COLORS.danger.main,
      gradient: PROFESSIONAL_COLORS.gradients.orange,
      description: 'Tasks past due date',
      tab: 'overdueFollowups'
    },
    {
      title: 'Goals at Risk',
      count: summary.goalsAtRisk,
      icon: BarChart3,
      color: PROFESSIONAL_COLORS.warning.main,
      gradient: PROFESSIONAL_COLORS.gradients.teal,
      description: 'Goals unlikely to be met',
      tab: 'goalPredictions'
    },
    {
      title: 'Deals Closing Soon',
      count: summary.dealsClosingSoonCount,
      icon: TrendingUp,
      color: PROFESSIONAL_COLORS.success.main,
      gradient: PROFESSIONAL_COLORS.gradients.green,
      description: 'Deals closing in 7 days',
      tab: 'dealsClosingSoon'
    },
    {
      title: 'Inactive Users',
      count: summary.lowActivityUsersCount,
      icon: FileText,
      color: PROFESSIONAL_COLORS.info.main,
      gradient: PROFESSIONAL_COLORS.gradients.blue,
      description: 'Users with low activity',
      tab: 'lowActivityUsers'
    }
  ];

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Business Intelligence
        </h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Proactive insights and alerts to keep your business on track
        </p>
      </div>

      {/* Critical Alerts Banner */}
      {summary.criticalAlerts > 0 && (
        <div className="mb-6 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <AlertTriangle className="w-10 h-10" />
              <div>
                <h2 className="text-xl font-bold">
                  {summary.criticalAlerts} Critical Alert{summary.criticalAlerts !== 1 && 's'}
                </h2>
                <p className="text-red-100">Immediate attention required</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('alerts')}
              className="bg-white text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-red-50 transition"
            >
              View All
            </button>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {alertCards.map((card, index) => (
          <div
            key={index}
            onClick={() => setActiveTab(card.tab)}
            className={`
              rounded-xl p-6 cursor-pointer transform transition-all duration-200
              hover:scale-105 hover:shadow-2xl
              ${isDark ? 'bg-[#1E293B]' : 'bg-white'}
            `}
            style={{
              background: isDark ? card.gradient : 'white',
              border: isDark ? 'none' : '1px solid #E5E7EB'
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                <card.icon 
                  className="w-6 h-6" 
                  style={{ color: isDark ? 'white' : card.color }}
                />
              </div>
              <span className={`text-3xl font-bold ${isDark ? 'text-white' : ''}`} style={{ color: isDark ? 'white' : card.color }}>
                {card.count}
              </span>
            </div>
            <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {card.title}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
        {/* Tab Headers */}
        <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4`}>
          <div className="flex space-x-4 overflow-x-auto">
            {['overview', 'staleClients', 'stuckDeals', 'goalPredictions', 'overdueFollowups', 'dealsClosingSoon', 'lowActivityUsers'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all
                  ${activeTab === tab
                    ? 'bg-[#D89A00] text-white'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Alert Overview
              </h2>
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-lg border-l-4
                      ${isDark ? 'bg-[#334155]' : 'bg-gray-50'}
                    `}
                    style={{ borderLeftColor: alert.severity === 'critical' ? PROFESSIONAL_COLORS.danger.main : PROFESSIONAL_COLORS.warning.main }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-semibold
                          ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
                        `}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                          {alert.message}
                        </span>
                      </div>
                      <span className="text-2xl font-bold" style={{ color: PROFESSIONAL_COLORS.primary.main }}>
                        {alert.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'staleClients' && (
            <StaleClientsTable data={details.staleClients} isDark={isDark} />
          )}

          {activeTab === 'stuckDeals' && (
            <StuckDealsTable data={details.stuckDeals} isDark={isDark} />
          )}

          {activeTab === 'goalPredictions' && (
            <GoalPredictionsTable data={details.goalPredictions} isDark={isDark} />
          )}

          {activeTab === 'overdueFollowups' && (
            <OverdueFollowupsTable data={details.overdueFollowUps} isDark={isDark} />
          )}

          {activeTab === 'dealsClosingSoon' && (
            <DealsClosingSoonTable data={details.dealsClosingSoon} isDark={isDark} />
          )}

          {activeTab === 'lowActivityUsers' && (
            <LowActivityUsersTable data={details.lowActivityUsers} isDark={isDark} />
          )}
        </div>
      </div>
    </div>
  );
};

// Table Components
const StaleClientsTable = ({ data, isDark }) => (
  <div>
    <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      Stale Clients
    </h2>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={isDark ? 'bg-[#334155]' : 'bg-gray-100'}>
            <th className="px-4 py-3 text-left">Client</th>
            <th className="px-4 py-3 text-left">Last Contact</th>
            <th className="px-4 py-3 text-left">Days</th>
            <th className="px-4 py-3 text-left">Owner</th>
            <th className="px-4 py-3 text-left">Severity</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((client, index) => (
            <tr key={index} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <td className="px-4 py-3">{client.clientName}</td>
              <td className="px-4 py-3">{new Date(client.lastContactDate).toLocaleDateString()}</td>
              <td className="px-4 py-3 font-bold" style={{ color: PROFESSIONAL_COLORS.danger.main }}>
                {client.daysSinceContact}
              </td>
              <td className="px-4 py-3">{client.owner?.name}</td>
              <td className="px-4 py-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  client.severity === 'critical' ? 'bg-red-100 text-red-800' : 
                  client.severity === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {client.severity}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const StuckDealsTable = ({ data, isDark }) => (
  <div>
    <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      Stuck Deals
    </h2>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={isDark ? 'bg-[#334155]' : 'bg-gray-100'}>
            <th className="px-4 py-3 text-left">Deal</th>
            <th className="px-4 py-3 text-left">Value</th>
            <th className="px-4 py-3 text-left">Stage</th>
            <th className="px-4 py-3 text-left">Days in Stage</th>
            <th className="px-4 py-3 text-left">Client</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((deal, index) => (
            <tr key={index} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <td className="px-4 py-3">{deal.dealTitle}</td>
              <td className="px-4 py-3 font-semibold">${deal.dealValue?.toLocaleString()}</td>
              <td className="px-4 py-3">{deal.stageName}</td>
              <td className="px-4 py-3 font-bold" style={{ color: PROFESSIONAL_COLORS.warning.main }}>
                {deal.daysInStage} days
              </td>
              <td className="px-4 py-3">{deal.client}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const GoalPredictionsTable = ({ data, isDark }) => (
  <div>
    <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      Goal Predictions
    </h2>
    <div className="space-y-4">
      {data?.map((goal, index) => (
        <div key={index} className={`p-4 rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{goal.goalName}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              goal.prediction === 'will_exceed' ? 'bg-green-100 text-green-800' :
              goal.prediction === 'on_track' ? 'bg-[#FEF3C7] text-[#D89A00]' :
              goal.prediction === 'at_risk' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
            }`}>
              {goal.prediction.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Target:</span>
              <p className="font-semibold">{goal.target}</p>
            </div>
            <div>
              <span className="text-gray-500">Actual:</span>
              <p className="font-semibold">{goal.actual}</p>
            </div>
            <div>
              <span className="text-gray-500">Progress:</span>
              <p className="font-semibold">{goal.progressPercentage}%</p>
            </div>
            <div>
              <span className="text-gray-500">Confidence:</span>
              <p className="font-semibold">{goal.confidence}%</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{goal.recommendation}</p>
        </div>
      ))}
    </div>
  </div>
);

const OverdueFollowupsTable = ({ data, isDark }) => (
  <div>
    <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      Overdue Follow-ups
    </h2>
    <div className="space-y-3">
      {data?.map((item, index) => (
        <div key={index} className={`p-4 rounded-lg border-l-4 ${isDark ? 'bg-[#334155]' : 'bg-gray-50'}`} style={{ borderLeftColor: PROFESSIONAL_COLORS.danger.main }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.entityName}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: PROFESSIONAL_COLORS.danger.main }}>
                {item.daysOverdue} days
              </p>
              <p className="text-xs text-gray-500">overdue</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DealsClosingSoonTable = ({ data, isDark }) => (
  <div>
    <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      Deals Closing Soon
    </h2>
    <div className="space-y-3">
      {data?.map((deal, index) => (
        <div key={index} className={`p-4 rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{deal.dealTitle}</h3>
            <span className="text-xl font-bold" style={{ color: PROFESSIONAL_COLORS.success.main }}>
              ${deal.dealValue?.toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Stage:</span>
              <p className="font-semibold">{deal.stageName}</p>
            </div>
            <div>
              <span className="text-gray-500">Probability:</span>
              <p className="font-semibold">{deal.probability}%</p>
            </div>
            <div>
              <span className="text-gray-500">Closes in:</span>
              <p className="font-semibold text-[#D89A00]">{deal.daysUntilClose} days</p>
            </div>
            <div>
              <span className="text-gray-500">Client:</span>
              <p className="font-semibold">{deal.client?.name}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LowActivityUsersTable = ({ data, isDark }) => (
  <div>
    <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      Low Activity Users
    </h2>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={isDark ? 'bg-[#334155]' : 'bg-gray-100'}>
            <th className="px-4 py-3 text-left">User</th>
            <th className="px-4 py-3 text-left">Activities</th>
            <th className="px-4 py-3 text-left">Score</th>
            <th className="px-4 py-3 text-left">Average</th>
            <th className="px-4 py-3 text-left">Variance</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((user, index) => (
            <tr key={index} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <td className="px-4 py-3">{user.userName}</td>
              <td className="px-4 py-3">{user.activityCount}</td>
              <td className="px-4 py-3">{user.activityScore}</td>
              <td className="px-4 py-3">{user.avgActivityCount}</td>
              <td className="px-4 py-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {user.variance}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Intelligence;
