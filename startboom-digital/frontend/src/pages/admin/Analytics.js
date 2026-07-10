import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, Award } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useChartTheme, ANALYTICS_PALETTE } from '../../utils/chartTheme';
import dm from '../../utils/darkModeClasses';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [conversionData, setConversionData] = useState(null);
  const [clientActivity, setClientActivity] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [conversion, clients, agents] = await Promise.all([
        api.get('/analytics/conversion'),
        api.get('/analytics/clients/activity'),
        api.get('/analytics/agents/leaderboard')
      ]);

      setConversionData(conversion.data);
      setClientActivity(clients.data);
      setLeaderboard(agents.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className={`mt-4 ${dm.textSecondary}`}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${dm.textPrimary}`}>Sales Analytics</h1>
        <p className={`mt-1 ${dm.textSecondary}`}>Track performance and conversion metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Deals"
          value={conversionData?.totalDeals || 0}
          icon={Target}
          color="blue"
        />
        <StatsCard
          title="Conversion Rate"
          value={`${conversionData?.conversionRate || 0}%`}
          icon={TrendingUp}
          color={conversionData?.performsAboveBenchmark ? 'green' : 'red'}
          subtitle={`${conversionData?.benchmarkDifference >= 0 ? '+' : ''}${conversionData?.benchmarkDifference}% vs 40% target`}
        />
        <StatsCard
          title="Active Clients"
          value={clientActivity?.activeClients || 0}
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Dormant Clients"
          value={clientActivity?.dormantClients || 0}
          icon={Users}
          color="primary"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Conversion Pie Chart */}
        <div className={`rounded-lg shadow p-6 ${dm.card}`}>
          <h2 className={`text-xl font-bold mb-4 ${dm.textPrimary}`}>Conversion Overview</h2>
          {conversionData && (
            <ConversionChart data={conversionData} />
          )}
        </div>

        {/* Client Activity */}
        <div className={`rounded-lg shadow p-6 ${dm.card}`}>
          <h2 className={`text-xl font-bold mb-4 ${dm.textPrimary}`}>Client Activity</h2>
          {clientActivity && (
            <ClientActivityChart data={clientActivity} />
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className={`rounded-lg shadow p-6 ${dm.card}`}>
        <div className="flex items-center mb-6">
          <Award className="w-6 h-6 text-secondary-500 mr-2" />
          <h2 className={`text-xl font-bold ${dm.textPrimary}`}>Agent Leaderboard</h2>
        </div>
        <Leaderboard data={leaderboard} />
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    primary: 'bg-primary-100 text-primary-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg shadow p-6 ${dm.card}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm mb-1 ${dm.textSecondary}`}>{title}</p>
          <p className={`text-3xl font-bold ${dm.textPrimary}`}>{value}</p>
          {subtitle && (
            <p className={`text-xs mt-1 ${dm.textMuted}`}>{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

// Conversion Chart Component
const ConversionChart = ({ data }) => {
  const { grid, axis, tooltipStyle, labelStyle, itemStyle, legend } = useChartTheme();
  const chartData = [
    { name: 'Won Deals', value: data.convertedDeals, color: '#10B981' },
    { name: 'Lost Deals', value: data.lostDeals, color: '#EF4444' },
  ];

  return (
    <div>
      <div className="flex items-center justify-center mb-4">
        <div className="text-center">
          <div
            className="text-5xl font-bold"
            style={{ color: data.conversionRate >= 40 ? '#10B981' : '#EF4444' }}
          >
            {data.conversionRate}%
          </div>
          <div className={`text-sm ${dm.textMuted}`}>Current Conversion</div>
        </div>
      </div>

      <div className={`rounded-md p-3 mb-4 bg-[var(--color-bg-muted)]`}>
        <div className="flex justify-between items-center">
          <span className={`text-sm ${dm.textSecondary}`}>Benchmark (40%)</span>
          <span
            className={`font-semibold ${
              data.benchmarkDifference >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {data.benchmarkDifference >= 0 ? '+' : ''}
            {data.benchmarkDifference}%
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${entry.value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
          <Legend wrapperStyle={{ color: legend }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Client Activity Chart Component
const ClientActivityChart = ({ data }) => {
  const { grid, axis, tooltipStyle, labelStyle, itemStyle } = useChartTheme();
  const chartData = [
    { name: 'Active', value: data.activeClients, color: '#10B981' },
    { name: 'Dormant', value: data.dormantClients, color: '#F59E0B' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{data.activeClients}</div>
          <div className={`text-sm ${dm.textSecondary}`}>Active</div>
          <div className={`text-xs ${dm.textMuted}`}>{data.activePercentage}%</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600">{data.dormantClients}</div>
          <div className={`text-sm ${dm.textSecondary}`}>Dormant</div>
          <div className={`text-xs ${dm.textMuted}`}>{data.dormantPercentage}%</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="name" stroke={axis} />
          <YAxis stroke={axis} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
          <Bar dataKey="value" fill={ANALYTICS_PALETTE.revenue} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Leaderboard Component
const Leaderboard = ({ data }) => {
  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 ${dm.textMuted}`}>
        No performance data available yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="table-header">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase">Sales</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase">Revenue</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase">Conversion</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase">Score</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.agent.id} className="table-row">
              <td className="px-6 py-4 whitespace-nowrap text-2xl">
                {getMedalEmoji(entry.rank)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`font-semibold ${dm.textPrimary}`}>{entry.agent.name}</div>
                <div className={`text-xs ${dm.textMuted}`}>{entry.agent.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                {entry.stats.totalSales}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">
                UGX {entry.stats.totalRevenue.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <span
                  className={`font-semibold ${
                    entry.stats.conversionRate >= 40 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {entry.stats.conversionRate}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                {entry.performanceScore.toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Analytics;
