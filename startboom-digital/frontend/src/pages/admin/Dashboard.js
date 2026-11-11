import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, DollarSign, Target, Download, FileText, Building } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import DonutChart, { StageValueChart } from '../../components/charts/DonutChart';
import { useAuth } from '../../context/AuthContext';
import { useChartTheme, getChartPalette, ANALYTICS_PALETTE } from '../../utils/chartTheme';
import dm from '../../utils/darkModeClasses';
import { dealsAPI, salesAPI, clientsAPI, usersAPI, tenantsAPI } from '../../services/api';
import { departmentApi, metricsAPI } from '../../services/enterpriseApi';
import OnboardingWizard from '../../components/OnboardingWizard';
import { WidgetContainer } from '../../components/dashboard/DashboardWidgets';
import toast from 'react-hot-toast';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

// Enterprise Chart Colors - Unified Purple Palette
const ENTERPRISE_COLORS = ['#7C3AED', '#9333EA', '#A855F7', '#C084FC', '#E9D5FF', '#F3E8FF'];

const StatCard = ({ icon: Icon, title, value }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold mt-2 text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
      <div className="p-4 rounded-xl bg-purple-50">
        <Icon className="w-6 h-6 text-purple-600" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isDark, grid, axis, tooltipStyle, labelStyle, itemStyle, legend } = useChartTheme();
  const [period, setPeriod] = useState('monthly');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const res = await tenantsAPI.getOnboarding();
        if (!res.data.completed) {
          setShowOnboarding(true);
        }
      } catch {
        // Non-critical — don't block dashboard
      }
    };
    if (user?.role === 'admin') checkOnboarding();
  }, [user]);

  // stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [agentsCount, setAgentsCount] = useState(0);
  const [agentsList, setAgentsList] = useState([]);
  const [dealsCount, setDealsCount] = useState(0);
  const [pendingDeals, setPendingDeals] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);
  const [totalDealsClosed, setTotalDealsClosed] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [totalUsersAllTime, setTotalUsersAllTime] = useState(0);

  // charts data
  const [dealsWonLostData, setDealsWonLostData] = useState([]);
  const [dealsWonLostTotals, setDealsWonLostTotals] = useState({ won: 0, lost: 0 });
  const [dealStagesByValueData, setDealStagesByValueData] = useState([]);
  const [closedDealsByRegionData, setClosedDealsByRegionData] = useState([]);
  const [monthlyRevenueByRegionData, setMonthlyRevenueByRegionData] = useState([]);
  const [companyDealsData, setCompanyDealsData] = useState([]);
  const [conversionRatesData, setConversionRatesData] = useState([]);
  const [salesCountData, setSalesCountData] = useState([]);

  // ── Cascading Metrics state ──
  const [companyMetrics, setCompanyMetrics] = useState(null);
  const [departmentMetricsData, setDepartmentMetricsData] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [showDeptDetails, setShowDeptDetails] = useState(false);

  const formatUGX = (v) => `UGX ${Number(v || 0).toLocaleString('en-UG')}`;

  const computeRange = (p) => {
    const now = new Date();
    if (p === 'daily') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    if (p === 'weekly') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    if (p === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  // ── Load Cascading Metrics ─────────────────────────────────────────────────
  const loadCascadingMetrics = async () => {
    setMetricsLoading(true);
    try {
      const range = computeRange(period);
      const startDate = range.start;
      const endDate = range.end;

      // Fetch company-wide metrics
      const companyRes = await metricsAPI.getCompanyMetrics({
        startDate,
        endDate
      });
      setCompanyMetrics(companyRes.data?.metrics || null);

      // Fetch metrics for each department (for drill-down)
      if (companyRes.data?.metrics?.departments) {
        const deptMetrics = companyRes.data.metrics.departments.map(dept => ({
          id: dept.departmentId,
          name: dept.departmentName,
          revenue: dept.metrics?.totalRevenue || 0,
          wonDeals: dept.metrics?.wonDeals || 0,
          teamCount: dept.teamCount || 0,
          memberCount: dept.memberCount || 0,
          conversionRate: dept.metrics?.conversionRate || 0,
          avgPerMember: dept.metrics?.averageRevenuePerMember || 0
        }));
        setDepartmentMetricsData(deptMetrics);
      }
    } catch (error) {
      console.error('Error loading cascading metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const range = computeRange(period);
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const normalize = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
      const isWon = (d) => normalize(d?.stage) === 'won' || normalize(d?.status) === 'won';
      const isLost = (d) => normalize(d?.stage) === 'lost' || normalize(d?.status) === 'lost';
      const getOutcomeDate = (d) => new Date(d?.closedAt || d?.updatedAt || d?.createdAt);
      const getRecordDate = (record, primary = 'createdAt') => new Date(record?.[primary] || record?.updatedAt || record?.createdAt);
      const isInRange = (dateInput) => {
        const date = new Date(dateInput);
        if (Number.isNaN(date.getTime())) return false;
        return date >= startDate && date <= endDate;
      };
      const getId = (v) => {
        if (!v) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'object' && v._id) return String(v._id);
        return String(v);
      };

      const fetchAllDeals = async () => {
        const limit = 500;
        let page = 1;
        let pages = 1;
        const all = [];

        do {
          const res = await dealsAPI.getAll({ page, limit });
          const batch = res?.data?.deals || [];
          const pagination = res?.data?.pagination;
          pages = pagination?.pages || 1;
          all.push(...batch);
          page += 1;
        } while (page <= pages);

        return all;
      };

      const fetchAllSales = async () => {
        const limit = 500;
        let page = 1;
        let pages = 1;
        const all = [];

        do {
          const res = await salesAPI.getAll({ page, limit });
          const batch = res?.data?.sales || [];
          const pagination = res?.data?.pagination;
          pages = pagination?.pages || 1;
          all.push(...batch);
          page += 1;
        } while (page <= pages);

        return all;
      };

      const fetchAllClients = async () => {
        const limit = 500;
        let page = 1;
        let pages = 1;
        const all = [];

        do {
          const res = await clientsAPI.getAll({ page, limit });
          const batch = res?.data?.clients || [];
          const pagination = res?.data?.pagination;
          pages = pagination?.totalPages || 1;
          all.push(...batch);
          page += 1;
        } while (page <= pages);

        return all;
      };

      const [allSales, allDeals, allClients, usersRes] = await Promise.all([
        fetchAllSales().catch(() => []),
        fetchAllDeals().catch(() => []),
        fetchAllClients().catch(() => []),
        usersAPI.getAll().catch(() => ({ data: [] }))
      ]);

      const deals = Array.isArray(allDeals) ? allDeals : [];
      const sales = Array.isArray(allSales) ? allSales : [];
      const clients = Array.isArray(allClients) ? allClients : [];
      const dealsInRange = deals.filter(d => isInRange(d?.createdAt || d?.updatedAt));
      const closedOutcomeDealsInRange = deals.filter(d => (isWon(d) || isLost(d)) && isInRange(getOutcomeDate(d)));
      const salesInRange = sales.filter(s => isInRange(s?.saleDate || s?.createdAt));
      const clientsInRange = clients.filter(c => isInRange(c?.createdAt || c?.updatedAt));

      // Sales
      const totalRevenueAmount = salesInRange.reduce((sum, sale) => sum + Number(sale?.finalAmount ?? sale?.totalAmount ?? 0), 0);
      setTotalRevenue(totalRevenueAmount);
      const salesChart = monthNames.map((m, idx) => {
        const count = salesInRange.filter(sale => {
          const date = getRecordDate(sale, 'saleDate');
          return !Number.isNaN(date.getTime()) && date.getMonth() === idx;
        }).length;
        return { month: m, sales: count };
      });
      setSalesCountData(salesChart);

      // Deals
      setDealsCount(dealsInRange.length);
      const pending = dealsInRange.filter(d => !d.stage || (d.stage && d.stage.toLowerCase() !== 'won' && d.stage.toLowerCase() !== 'lost')).length;
      setPendingDeals(pending);

      // Deals Won vs Lost chart (by month)
      const outcomeDeals = deals.filter(d => (isWon(d) || isLost(d)) && isInRange(getOutcomeDate(d)));
      const totals = outcomeDeals.reduce((acc, d) => {
        const date = getOutcomeDate(d);
        if (Number.isNaN(date.getTime())) return acc;
        if (isWon(d)) acc.won += 1;
        if (isLost(d)) acc.lost += 1;
        return acc;
      }, { won: 0, lost: 0 });
      setDealsWonLostTotals(totals);

      const wonLostChart = monthNames.map((month, idx) => {
        const monthDeals = outcomeDeals.filter(d => {
          const date = getOutcomeDate(d);
          if (Number.isNaN(date.getTime())) return false;
          return date.getMonth() === idx;
        });

        return {
          month,
          won: monthDeals.filter(isWon).length,
          lost: monthDeals.filter(isLost).length
        };
      });
      setDealsWonLostData(wonLostChart);

      const dealsClosed = closedOutcomeDealsInRange.filter(d => isWon(d)).length;
      setTotalDealsClosed(dealsClosed);

      // Clients
      setClientsCount(clientsInRange.length);

      // Agents + all users
      const users = usersRes?.data || [];
      const usersArr = Array.isArray(users) ? users : (users.users || []);
      const agents = usersArr.filter(u => u.role === 'agent');
      
      // Apply department filter if selected
      const filteredAgents = selectedDept
        ? agents.filter(a => {
            const deptId = a.department?._id || a.department;
            return deptId === selectedDept;
          })
        : agents;
      
      const agentsForCharts = filteredAgents.map(agent => ({ _id: String(agent._id), name: agent.name || 'Unnamed Agent' }));
      setAgentsList(agentsForCharts);
      setAgentsCount(agentsForCharts.length || 0);
      setAllUsers(usersArr);
      setTotalUsersAllTime(usersArr.length);

      // Deal Stages by Value (for selected period)
      const stageOrder = ['lead', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];
      const stageLabels = {
        lead: 'Lead',
        qualification: 'Qualification',
        proposal: 'Proposal',
        negotiation: 'Negotiation',
        won: 'Won',
        lost: 'Lost'
      };
      const stageValueMap = dealsInRange.reduce((acc, d) => {
        const stageKey = normalize(d?.stage);
        if (!stageOrder.includes(stageKey)) return acc;
        acc[stageKey] = (acc[stageKey] || 0) + (Number(d?.value) || 0);
        return acc;
      }, {});
      const stageValueData = stageOrder.map(stageKey => ({
        name: stageLabels[stageKey],
        value: stageValueMap[stageKey] || 0
      }));
      const hasStageValueData = stageValueData.some(item => Number(item.value) > 0);
      setDealStagesByValueData(hasStageValueData ? stageValueData : []);

      // Closed Won Deals by Agent
      const closedWonByMonthAgent = Array.from({ length: 12 }, () => ({}));
      closedOutcomeDealsInRange.forEach(d => {
        if (!isWon(d)) return;
        const date = getOutcomeDate(d);
        if (Number.isNaN(date.getTime())) return;
        const monthIdx = date.getMonth();
        const agentId = getId(d.agent);
        if (!agentId) return;
        closedWonByMonthAgent[monthIdx][agentId] = (closedWonByMonthAgent[monthIdx][agentId] || 0) + 1;
      });

      const closedByMonth = monthNames.map((month, idx) => {
        const dataPoint = { month };
        agentsForCharts.forEach(agent => {
          dataPoint[agent._id] = closedWonByMonthAgent[idx][agent._id] || 0;
        });
        return dataPoint;
      });
      setClosedDealsByRegionData(closedByMonth);

      // Monthly Revenue by Agent
      const revenueByAgentMonth = Array.from({ length: 12 }, () => ({}));

      salesInRange.forEach(sale => {
        const date = new Date(sale?.saleDate || sale?.createdAt);
        if (Number.isNaN(date.getTime())) return;

        const agentId = getId(sale?.agent);
        if (!agentId) return;

        const monthIndex = date.getMonth();
        const amount = Number(sale?.finalAmount ?? sale?.totalAmount ?? 0);
        revenueByAgentMonth[monthIndex][agentId] = (revenueByAgentMonth[monthIndex][agentId] || 0) + amount;
      });

      const revenueByMonth = monthNames.map((month, idx) => {
        const dataPoint = { month };
        agentsForCharts.forEach(agent => {
          dataPoint[agent._id] = revenueByAgentMonth[idx][agent._id] || 0;
        });
        return dataPoint;
      });
      setMonthlyRevenueByRegionData(revenueByMonth);

      // Company Total Deals (Open, Closed-Won, Closed-Lost)
      const companyDeals = monthNames.map((month, idx) => {
        const monthDeals = dealsInRange.filter(d => {
          const date = new Date(d.createdAt);
          return date.getMonth() === idx;
        });
        
        const open = monthDeals.filter(d => !d.stage || (d.stage.toLowerCase() !== 'won' && d.stage.toLowerCase() !== 'lost')).length;
        const won = monthDeals.filter(d => d.stage && d.stage.toLowerCase() === 'won').length;
        const lost = monthDeals.filter(d => d.stage && d.stage.toLowerCase() === 'lost').length;
        
        return { month, Open: open, 'Closed-Won': won, 'Closed-Lost': lost };
      });
      setCompanyDealsData(companyDeals);

      // Conversion Rates by Agent
      const totalDealsByMonthAgent = Array.from({ length: 12 }, () => ({}));
      const wonDealsByMonthAgent = Array.from({ length: 12 }, () => ({}));
      dealsInRange.forEach(d => {
        const date = new Date(d.createdAt);
        if (Number.isNaN(date.getTime())) return;
        const monthIdx = date.getMonth();
        const agentId = getId(d.agent);
        if (!agentId) return;
        totalDealsByMonthAgent[monthIdx][agentId] = (totalDealsByMonthAgent[monthIdx][agentId] || 0) + 1;
        if (isWon(d)) {
          wonDealsByMonthAgent[monthIdx][agentId] = (wonDealsByMonthAgent[monthIdx][agentId] || 0) + 1;
        }
      });

      const conversionRates = monthNames.map((month, idx) => {
        const dataPoint = { month };
        agentsForCharts.forEach(agent => {
          const total = totalDealsByMonthAgent[idx][agent._id] || 0;
          const won = wonDealsByMonthAgent[idx][agent._id] || 0;
          dataPoint[agent._id] = total > 0 ? Math.round((won / total) * 100) : 0;
        });
        return dataPoint;
      });
      setConversionRatesData(conversionRates);

    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
      toast.error('Failed to load dashboard data');
    }
  };

  useEffect(() => {
    loadData();
    loadDepartments();
    loadCascadingMetrics();
  }, [period, selectedDept]);

  const loadDepartments = async () => {
    try {
      const res = await departmentApi.getAll();
      setDepartments(res.data.departments || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  return (
    <>
      {/* Onboarding wizard — shown automatically for new tenants */}
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}

      <div className="space-y-6 pt-4 px-6 min-h-screen bg-[#F8F7FC]">
        {/* Period & Department Filters */}
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-gray-500" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-12 px-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          
          <div className="inline-flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  p === period 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

      {/* Stats Cards - Revenue, Users, and Departments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={DollarSign} title="Sales (This Month)" value={`UGX ${Number(totalRevenue || 0).toLocaleString('en-UG')}`} />
        <StatCard icon={Users} title="Users (All Time)" value={totalUsersAllTime} />
        <StatCard icon={Building} title="Departments" value={departments.length} />
      </div>

      {/* Note: Quick Actions only on main dashboards, not subpages */}

      {/* ── Company-Wide Cascading Metrics ── */}
      {!metricsLoading && companyMetrics && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Company-Wide Performance</h3>
              <p className="text-sm text-gray-500 mt-1">Aggregated metrics across all departments and teams</p>
            </div>
            <button
              onClick={() => setShowDeptDetails(!showDeptDetails)}
              className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            >
              {showDeptDetails ? 'Hide Departments' : 'Show Departments'}
            </button>
          </div>

          {/* Company Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-900">{formatUGX(companyMetrics.metrics?.totalRevenue || 0)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <p className="text-xs text-green-600 font-medium mb-1">Won Deals</p>
              <p className="text-2xl font-bold text-green-900">{companyMetrics.metrics?.wonDeals || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <p className="text-xs text-purple-600 font-medium mb-1">Departments</p>
              <p className="text-2xl font-bold text-purple-900">{companyMetrics.departmentCount || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <p className="text-xs text-orange-600 font-medium mb-1">Employees</p>
              <p className="text-2xl font-bold text-orange-900">{companyMetrics.metrics?.totalMembers || 0}</p>
            </div>
          </div>

          {/* Department Breakdown */}
          {showDeptDetails && departmentMetricsData.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Department Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Department</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Revenue</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Won Deals</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Teams</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Members</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Conv. Rate</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Avg/Member</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {departmentMetricsData.map(dept => (
                      <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{dept.name}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatUGX(dept.revenue)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{dept.wonDeals}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{dept.teamCount}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{dept.memberCount}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{dept.conversionRate.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatUGX(dept.avgPerMember)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deals Won vs Lost */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Deals Won vs Deals Lost</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600">Won</span>
              <span className="font-bold text-gray-900 tabular-nums">{dealsWonLostTotals.won.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-600">Lost</span>
              <span className="font-bold text-gray-900 tabular-nums">{dealsWonLostTotals.lost.toLocaleString()}</span>
            </div>
          </div>
        </div>
        {dealsWonLostTotals.won === 0 && dealsWonLostTotals.lost === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No deal outcome data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dealsWonLostData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" allowDecimals={false} style={{ fontSize: '12px' }} />
              <Tooltip
                formatter={(value, name) => [Number(value || 0).toLocaleString(), name]}
                contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
              <Line type="monotone" dataKey="won" name="Won" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
              <Line type="monotone" dataKey="lost" name="Lost" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

{/* Row 1: Sales by Agent & Closed Won Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StageValueChart 
          data={dealStagesByValueData}
          formatCurrency={formatUGX}
          height={300}
          emptyMessage="No deal stage data available"
        />

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Closed Won Deals by Agent</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={closedDealsByRegionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
              {agentsList.map((agent, idx) => (
                <Bar key={agent._id} dataKey={agent._id} name={agent.name} fill={ENTERPRISE_COLORS[idx % ENTERPRISE_COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Monthly Revenue & Company Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Revenue by Agent</h3>
          <p className="text-xs text-gray-500 mb-4">Computed from each sale's final amount for the selected period</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenueByRegionData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="category" dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis type="number" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
              {agentsList.map((agent, idx) => (
                <Bar key={agent._id} dataKey={agent._id} name={agent.name} fill={ENTERPRISE_COLORS[idx % ENTERPRISE_COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Total Deals</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={companyDealsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
              <Line type="monotone" dataKey="Open" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Closed-Won" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Closed-Lost" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Monthly Sales & Conversion Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Sales</h3>
          <span className="text-sm text-gray-500">Transactions</span>
          {salesCountData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No sales data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesCountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" allowDecimals={false} style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#374151', fontWeight: 600 }}
                />
                <Bar dataKey="sales" fill={ANALYTICS_PALETTE.revenue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Rates by Agent</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversionRatesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                formatter={(value) => `${value}%`}
                contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
              {agentsList.map((agent, idx) => (
                <Line key={agent._id} type="monotone" dataKey={agent._id} name={agent.name} stroke={ENTERPRISE_COLORS[idx % ENTERPRISE_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Table with Export */}
      <UserTable users={allUsers} />
    </div>
    </>
  );
};

// ── User Table with PDF + Excel export ──────────────────────────────────────
const UserTable = ({ users }) => {
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const styles = {
      admin:   'bg-purple-100 text-[var(--primary-color)]',
      manager: 'bg-blue-100 text-blue-700',
      agent:   'bg-primary-100 text-primary-700',
    };
    return styles[role] || 'bg-gray-100 text-gray-700';
  };

  // Export to Excel (CSV)
  const exportExcel = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Total Deals', 'Total Sales Amount', 'Joined'];
    const rows = filtered.map(u => [
      u.name || '',
      u.email || '',
      u.role || '',
      u.isActive === false ? 'Inactive' : u.isFirstLogin ? 'Pending' : 'Active',
      u.totalDeals || 0,
      u.totalSalesAmount || 0,
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `users-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} users to Excel`);
  };

  // Export to PDF — uses browser print with a styled table
  const exportPDF = () => {
    const rows = filtered.map(u => `
      <tr>
        <td>${u.name || ''}</td>
        <td>${u.email || ''}</td>
        <td>${u.role || ''}</td>
        <td>${u.isActive === false ? 'Inactive' : u.isFirstLogin ? 'Pending' : 'Active'}</td>
        <td>${u.totalDeals || 0}</td>
        <td>UGX ${Number(u.totalSalesAmount || 0).toLocaleString()}</td>
        <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}</td>
      </tr>`).join('');

    const html = `
      <html><head><title>Users Report</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        h2 { color: #1795CC; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #1f2937; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #f9fafb; }
      </style></head>
      <body>
        <h2>Users Report</h2>
        <p>Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total: ${filtered.length} users</p>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Deals</th><th>Sales Amount</th><th>Joined</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Users</h3>
          <p className="text-sm text-gray-500 mt-1">Manage and export user data</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 px-4 rounded-xl text-sm w-48 border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          />
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Deals</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Sales Amount</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No users found</p>
                </div>
              </td></tr>
            ) : (
              filtered.map(u => {
                const status = u.isActive === false ? 'Inactive' : u.isFirstLogin ? 'Pending' : 'Active';
                const statusStyle = status === 'Active' ? 'bg-green-100 text-green-700' : status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
                return (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-semibold text-sm">{(u.name || '?').charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getRoleBadge(u.role)}`}>
                        {u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyle}`}>{status}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{u.totalDeals || 0}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium">UGX {Number(u.totalSalesAmount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-600 bg-gray-50">
          Showing <span className="font-semibold text-gray-900">{filtered.length}</span> of <span className="font-semibold text-gray-900">{users.length}</span> users
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
