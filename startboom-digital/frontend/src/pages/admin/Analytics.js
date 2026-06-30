import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, Award } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
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
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
        <p className="text-gray-600 mt-1">Track performance and conversion metrics</p>
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Conversion Overview</h2>
          {conversionData && (
            <ConversionChart data={conversionData} />
          )}
        </div>

        {/* Client Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Client Activity</h2>
          {clientActivity && (
            <ClientActivityChart data={clientActivity} />
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <Award className="w-6 h-6 text-secondary-500 mr-2" />
          <h2 className="text-xl font-bold">Agent Leaderboard</h2>
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
      className="bg-white rounded-lg shadow p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
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
          <div className="text-sm text-gray-500">Current Conversion</div>
        </div>
      </div>

      <div className="bg-gray-100 rounded-md p-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Benchmark (40%)</span>
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
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Client Activity Chart Component
const ClientActivityChart = ({ data }) => {
  const chartData = [
    { name: 'Active', value: data.activeClients, color: '#10B981' },
    { name: 'Dormant', value: data.dormantClients, color: '#F59E0B' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{data.activeClients}</div>
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-xs text-gray-500">{data.activePercentage}%</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600">{data.dormantClients}</div>
          <div className="text-sm text-gray-600">Dormant</div>
          <div className="text-xs text-gray-500">{data.dormantPercentage}%</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#FFD700" />
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
      <div className="text-center py-8 text-gray-500">
        No performance data available yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sales</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conversion</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((entry) => (
            <tr key={entry.agent.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-2xl">
                {getMedalEmoji(entry.rank)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-semibold text-gray-900">{entry.agent.name}</div>
                <div className="text-xs text-gray-500">{entry.agent.email}</div>
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
