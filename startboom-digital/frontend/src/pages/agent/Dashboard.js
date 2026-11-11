import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Users, UserCheck, Target,
  Filter, Eye, Mail, MessageSquare,
  ChevronDown, ChevronUp, Star, Clock, CheckCircle, AlertCircle, Award,
  Download, FileText, Plus
} from 'lucide-react';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
  AreaChart, Area, ComposedChart, Cell
} from 'recharts';
import DonutChart, { DealStatusChart, PaymentMethodChart, TaskStatusChart } from '../../components/charts/DonutChart';
import { performanceAPI, dealsAPI, clientsAPI, salesAPI } from '../../services/api';
import { metricsAPI } from '../../services/enterpriseApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import DashboardQuickActions from '../../components/DashboardQuickActions';
import Leaderboard from '../../components/Leaderboard';
import TargetProgress from '../../components/TargetProgress';
import { useChartTheme, ANALYTICS_PALETTE } from '../../utils/chartTheme';
import dm from '../../utils/darkModeClasses';
import { StatCard, WidgetContainer } from '../../components/dashboard/DashboardWidgets';
const exportToCSV = (data, headers, filename) => {
  const csv = [headers, ...data].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const exportToPDF = (title, headers, data, filename) => {
  const rows = data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
  const html = `
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; }
      h2 { color: #FFD700; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #1f2937; color: white; padding: 8px; text-align: left; font-size: 11px; }
      td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; }
      tr:nth-child(even) td { background: #f9fafb; }
    </style></head>
    <body>
      <h2>${title}</h2>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
    </body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KPICard = ({ icon: Icon, title, value, subtitle, iconBg, iconColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconBg || 'bg-purple-50'}`}>
        <Icon className={`w-7 h-7 ${iconColor || 'text-purple-600'}`} strokeWidth={2} />
      </div>
    </div>
  </motion.div>
);

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_STYLES = {
  prospect: { bg: 'bg-blue-100 text-blue-800', icon: Clock },
  active:   { bg: 'bg-green-100 text-green-800', icon: CheckCircle },
  vip:      { bg: 'bg-purple-100 text-purple-800', icon: Award },
  inactive: { bg: 'bg-gray-100 text-gray-700', icon: AlertCircle },
};
const PRIORITY_STYLES = {
  high:   'bg-primary-100 text-primary-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low:    'bg-green-100 text-green-800',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AgentDashboard = () => {
  const { user } = useAuth();
  const { grid, axis, tooltipStyle, labelStyle, itemStyle } = useChartTheme();

  // ── KPI state ──
  const [salesValue, setSalesValue]     = useState(0);
  const [pipelineCount, setPipelineCount] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [leadsCount, setLeadsCount]     = useState(0);

  // ── Chart state ──
  const [monthlySalesData, setMonthlySalesData]           = useState([]);
  const [dealStatusData, setDealStatusData]               = useState([]);
  const [creditVsCashData, setCreditVsCashData]           = useState([]);
  const [revenueOverTimeData, setRevenueOverTimeData]     = useState([]);
  const [pipelineValueData, setPipelineValueData]         = useState([]);
  const [followUpData, setFollowUpData]                   = useState([]);

  // ── Client table state ──
  const [clients, setClients]           = useState([]);
  const [tableSearch, setTableSearch]   = useState('');
  const [tableStatus, setTableStatus]   = useState('');
  const [tablePage, setTablePage]       = useState(1);
  const [tableTotal, setTableTotal]     = useState(0);
  const [tableTotalPages, setTableTotalPages] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);
  const [sortKey, setSortKey]           = useState('createdAt');
  const [sortDir, setSortDir]           = useState('desc');

  // ── Cascading Metrics state ──
  const [myMetrics, setMyMetrics]             = useState(null);
  const [teamMetrics, setTeamMetrics]         = useState(null);
  const [departmentMetrics, setDepartmentMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading]   = useState(true);
  const [showCascade, setShowCascade]         = useState(false);

  const handleExport = (type) => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Priority'];
    const data = clients.map(c => [c.name || '', c.email || '', c.phone || '', c.company || '', c.status || '', c.priority || '']);
    if (type === 'csv') {
      exportToCSV(data, headers, `clients-${new Date().toISOString().slice(0,10)}.csv`);
      toast.success(`Exported ${clients.length} clients`);
    } else if (type === 'pdf') {
      exportToPDF('Clients Report', headers, data, `clients-${new Date().toISOString().slice(0,10)}.pdf`);
    } else {
      toast.error('Export type not supported');
    }
  };

  const PAGE_SIZE = 8;
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formatUGX = (v) => `UGX ${Number(v || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;

  // ── Load Cascading Metrics ─────────────────────────────────────────────────
  const loadCascadingMetrics = useCallback(async () => {
    if (!user) return;
    setMetricsLoading(true);
    try {
      // Get current month date range
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Fetch my metrics
      const myMetricsRes = await metricsAPI.getMyMetrics({
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString()
      });
      setMyMetrics(myMetricsRes.data?.metrics || null);

      // Fetch team metrics if user has a team
      if (user.team) {
        try {
          const teamId = typeof user.team === 'object' ? user.team._id : user.team;
          const teamMetricsRes = await metricsAPI.getTeamMetrics(teamId, {
            startDate: monthStart.toISOString(),
            endDate: monthEnd.toISOString()
          });
          setTeamMetrics(teamMetricsRes.data?.metrics || null);
        } catch (err) {
          console.log('No team metrics available');
        }
      }

      // Fetch department metrics if user has a department
      if (user.department) {
        try {
          const deptId = typeof user.department === 'object' ? user.department._id : user.department;
          const deptMetricsRes = await metricsAPI.getDepartmentMetrics(deptId, {
            startDate: monthStart.toISOString(),
            endDate: monthEnd.toISOString()
          });
          setDepartmentMetrics(deptMetricsRes.data?.metrics || null);
        } catch (err) {
          console.log('No department metrics available');
        }
      }
    } catch (error) {
      console.error('Error loading cascading metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, [user]);

  // ── Load KPI + chart data ──────────────────────────────────────────────────
  const loadKPIData = useCallback(async () => {
    try {
      const userId = user?._id || user?.id;
      if (!userId) return;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const [perfRes, clientsRes, dealsRes, salesRes] = await Promise.allSettled([
        performanceAPI.getAgentStats(userId),
        clientsAPI.getAll({ limit: 1000 }),
        dealsAPI.getAll(),
        salesAPI.getAll({ limit: 1000 }),
      ]);

      const allClients  = clientsRes.status  === 'fulfilled' ? (clientsRes.value?.data?.clients  || []) : [];
      const allDeals    = dealsRes.status    === 'fulfilled' ? (dealsRes.value?.data?.deals      || dealsRes.value?.data || []) : [];
      const allSales    = salesRes.status    === 'fulfilled' ? (salesRes.value?.data?.sales      || []) : [];

      // ── 4 KPI cards ──
      const monthlySales = allSales.filter(s => {
        const d = new Date(s.saleDate || s.createdAt);
        return d >= monthStart && d < monthEnd;
      });
      setSalesValue(monthlySales.reduce((sum, s) => sum + (Number(s.finalAmount) || 0), 0));

      const pipeline = allDeals.filter(d => !['won','lost'].includes(d.stage?.toLowerCase()));
      setPipelineCount(pipeline.length);

      setTotalClients(allClients.length);

      const leads = allClients.filter(c => c.status === 'prospect');
      setLeadsCount(leads.length);

      // ── Charts ──
      // Monthly sales bar
      const monthMap = new Map();
      allSales.forEach(s => {
        const idx = new Date(s.saleDate || s.createdAt).getMonth();
        monthMap.set(idx, (monthMap.get(idx) || 0) + (Number(s.finalAmount) || 0));
      });
      setMonthlySalesData(monthNames.map((m, i) => ({ month: m, sales: monthMap.get(i) || 0 })));

      // Deal status pie
      const won     = allDeals.filter(d => d.stage === 'won').length;
      const lost    = allDeals.filter(d => d.stage === 'lost').length;
      const pending = allDeals.filter(d => !['won','lost'].includes(d.stage)).length;
      setDealStatusData([
        { name: 'Won Deals', value: won },
        { name: 'Lost Deals', value: lost },
        { name: 'Open Pipeline', value: pending },
      ]);

      // Credit vs Cash pie
      const cash   = monthlySales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + (Number(s.finalAmount) || 0), 0);
      const credit = monthlySales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + (Number(s.finalAmount) || 0), 0);
      setCreditVsCashData([
        { name: 'Cash', value: cash },
        { name: 'Credit', value: credit },
      ]);

      // Revenue over time area
      const revMap = new Map();
      allSales.forEach(s => {
        const idx = new Date(s.saleDate || s.createdAt).getMonth();
        revMap.set(idx, (revMap.get(idx) || 0) + (Number(s.finalAmount) || 0));
      });
      setRevenueOverTimeData(monthNames.map((m, i) => ({ month: m, revenue: revMap.get(i) || 0 })));

      // Pipeline value by stage bar (semantic colors - progression toward money)
      const stageConfig = [
        { key: 'lead', label: 'Lead', color: ANALYTICS_PALETTE.lead },
        { key: 'qualification', label: 'Qualification', color: ANALYTICS_PALETTE.qualified },
        { key: 'proposal', label: 'Proposal', color: ANALYTICS_PALETTE.proposal },
        { key: 'negotiation', label: 'Negotiation', color: ANALYTICS_PALETTE.negotiation },
      ];
      setPipelineValueData(stageConfig.map(({ key, label, color }) => ({
        stage: label,
        value: allDeals.filter(d => d.stage === key).reduce((sum, d) => sum + (Number(d.value) || 0), 0),
        count: allDeals.filter(d => d.stage === key).length,
        fill: color, // Semantic color for this stage
      })));

      // Follow-up status
      const today    = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const allTasks = allClients.flatMap(c => (c.tasks || []).map(t => ({ ...t, dueDate: new Date(t.dueDate) })));
      setFollowUpData([
        { name: 'Overdue',   value: allTasks.filter(t => t.dueDate < today    && !t.completed).length, color: '#ef4444' },
        { name: 'Due Today', value: allTasks.filter(t => t.dueDate >= today && t.dueDate < tomorrow && !t.completed).length, color: '#f59e0b' },
        { name: 'Upcoming',  value: allTasks.filter(t => t.dueDate >= tomorrow && !t.completed).length, color: '#10b981' },
      ]);

    } catch (err) {
      console.error('Dashboard KPI error:', err);
    }
  }, [user]);

  // ── Load client table ──────────────────────────────────────────────────────
  const loadClientTable = useCallback(async () => {
    if (!user) return;
    setTableLoading(true);
    try {
      const res = await clientsAPI.getAll({
        search:   tableSearch || undefined,
        status:   tableStatus || undefined,
        page:     tablePage,
        limit:    PAGE_SIZE,
        sortBy:   sortKey,
        sortOrder: sortDir,
      });
      setClients(res.data?.clients || []);
      setTableTotal(res.data?.pagination?.total || res.data?.total || 0);
      setTableTotalPages(res.data?.pagination?.totalPages || res.data?.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load clients');
    } finally {
      setTableLoading(false);
    }
  }, [user, tableSearch, tableStatus, tablePage, sortKey, sortDir]);

  useEffect(() => { loadKPIData(); }, [loadKPIData]);
  useEffect(() => { loadClientTable(); }, [loadClientTable]);
  useEffect(() => { loadCascadingMetrics(); }, [loadCascadingMetrics]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => sortKey !== col
    ? <ChevronDown className="w-3 h-3 opacity-30 inline ml-1" />
    : sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />;

return (
    <div className="space-y-6 pt-4 px-6 min-h-screen bg-[#F8F7FC]">
      {/* ── 4 KPI Cards (spec: Sales Value, Pipeline, Total Clients, Leads) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={DollarSign}
          title="Sales Value"
          value={formatUGX(salesValue)}
          subtitle="This month's revenue"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <KPICard
          icon={TrendingUp}
          title="Pipeline"
          value={pipelineCount}
          subtitle="Active deals in progress"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KPICard
          icon={Users}
          title="Total Clients"
          value={totalClients}
          subtitle="All time"
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <KPICard
          icon={UserCheck}
          title="Leads"
          value={leadsCount}
          subtitle="Prospects to follow up"
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      {/* ── Cascading Metrics Section (Employee → Team → Department) ── */}
      {!metricsLoading && (myMetrics || teamMetrics || departmentMetrics) && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
              <p className="text-sm text-gray-500 mt-1">Your contributions cascade up through your team and department</p>
            </div>
            <button
              onClick={() => setShowCascade(!showCascade)}
              className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            >
              {showCascade ? 'Hide Details' : 'Show Details'}
            </button>
            onClick: () => setShowCascade(!showCascade)
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* My Metrics */}
            {myMetrics && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">My Performance</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Revenue:</span>
                    <span className="font-bold text-blue-900">{formatUGX(myMetrics.metrics?.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Won Deals:</span>
                    <span className="font-bold text-blue-900">{myMetrics.metrics?.wonDeals || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Conversion:</span>
                    <span className="font-bold text-blue-900">{(myMetrics.metrics?.conversionRate || 0).toFixed(1)}%</span>
                  </div>
                  {showCascade && (
                    <>
                      <div className="flex justify-between pt-2 border-t border-blue-300">
                        <span className="text-blue-700">Clients:</span>
                        <span className="font-bold text-blue-900">{myMetrics.metrics?.totalClients || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Active Deals:</span>
                        <span className="font-bold text-blue-900">{myMetrics.metrics?.activeDeals || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Team Metrics */}
            {teamMetrics && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Team: {teamMetrics.teamName}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Total Revenue:</span>
                    <span className="font-bold text-green-900">{formatUGX(teamMetrics.metrics?.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Won Deals:</span>
                    <span className="font-bold text-green-900">{teamMetrics.metrics?.wonDeals || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Team Members:</span>
                    <span className="font-bold text-green-900">{teamMetrics.memberCount || 0}</span>
                  </div>
                  {showCascade && (
                    <>
                      <div className="flex justify-between pt-2 border-t border-green-300">
                        <span className="text-green-700">Avg per Member:</span>
                        <span className="font-bold text-green-900">{formatUGX(teamMetrics.metrics?.averageRevenuePerMember || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Conversion:</span>
                        <span className="font-bold text-green-900">{(teamMetrics.metrics?.conversionRate || 0).toFixed(1)}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Department Metrics */}
            {departmentMetrics && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Dept: {departmentMetrics.departmentName}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Total Revenue:</span>
                    <span className="font-bold text-purple-900">{formatUGX(departmentMetrics.metrics?.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Won Deals:</span>
                    <span className="font-bold text-purple-900">{departmentMetrics.metrics?.wonDeals || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Teams:</span>
                    <span className="font-bold text-purple-900">{departmentMetrics.teamCount || 0}</span>
                  </div>
                  {showCascade && (
                    <>
                      <div className="flex justify-between pt-2 border-t border-purple-300">
                        <span className="text-purple-700">Avg per Team:</span>
                        <span className="font-bold text-purple-900">{formatUGX(departmentMetrics.metrics?.averageRevenuePerTeam || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Total Members:</span>
                        <span className="font-bold text-purple-900">{departmentMetrics.metrics?.totalMembers || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      <DashboardQuickActions role={user?.role || 'agent'} />

      {/* ── Target Progress & Leaderboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TargetProgress salesValue={salesValue} />
        <Leaderboard />
      </div>

      {/* ── Charts Row 1: Monthly Sales + Deal Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Sales Revenue</h3>
            <p className="text-sm text-gray-500 mt-1">Track your sales performance</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  formatter={v => formatUGX(v)} 
                  contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#374151', fontWeight: 600 }}
                />
                <Bar dataKey="sales" fill="#7C3AED" radius={[4,4,0,0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <DealStatusChart data={dealStatusData} height={260} />
      </div>

      {/* ── Charts Row 2: Revenue Over Time + Pipeline Value ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Over Time</h3>
            <p className="text-sm text-gray-500 mt-1">Monthly revenue trend</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  formatter={v => formatUGX(v)} 
                  contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#374151', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#7C3AED" fill="#7C3AED1A" strokeWidth={2} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Pipeline Value by Stage</h3>
            <p className="text-sm text-gray-500 mt-1">Deal value across stages</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pipelineValueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="stage" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  formatter={v => formatUGX(v)} 
                  contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#374151', fontWeight: 600 }}
                />
                <Bar dataKey="value" radius={[4,4,0,0]} name="Value">
                  {pipelineValueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Charts Row 3: Cash vs Credit + Follow-up Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentMethodChart 
          data={creditVsCashData} 
          formatCurrency={formatUGX}
          height={260}
          title="Cash vs Credit Sales (This Month)"
        />

        <TaskStatusChart 
          data={followUpData} 
          height={260}
          title="Follow-up Task Status"
        />
      </div>

      {/* My Clients Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-lg font-semibold flex-1 text-gray-900">My Clients</h2>
            {/* Status filter */}
            <select
              value={tableStatus}
              onChange={e => { setTableStatus(e.target.value); setTablePage(1); }}
              className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            >
              <option value="">All Status</option>
              <option value="prospect">Prospect (Lead)</option>
              <option value="active">Active</option>
              <option value="vip">VIP</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                  Client <SortIcon col="name" />
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider cursor-pointer" onClick={() => handleSort('company')}>
                  Company <SortIcon col="company" />
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                  Status <SortIcon col="status" />
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider cursor-pointer" onClick={() => handleSort('priority')}>
                  Priority <SortIcon col="priority" />
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto" />
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">{tableSearch || tableStatus ? 'No clients match your search' : 'No clients yet'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map(client => {
                  const statusStyle = STATUS_STYLES[client.status] || STATUS_STYLES.inactive;
                  const StatusIcon  = statusStyle.icon;
                  return (
                    <tr key={client._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-600 font-semibold text-sm">
                              {client.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{client.position || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{client.company || '—'}</td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">{client.phone}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{client.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyle.bg}`}>
                          <StatusIcon className="w-3 h-3" />
                          {client.status === 'prospect' ? 'Lead' : client.status?.charAt(0).toUpperCase() + client.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${PRIORITY_STYLES[client.priority] || 'bg-gray-100 text-gray-700'}`}>
                          {client.priority?.charAt(0).toUpperCase() + client.priority?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {client.phone && (
                            <button
                              onClick={() => {
                                let number = client.phone.trim();
                                // Remove all non-digit characters except leading +
                                number = number.replace(/[^\d+]/g, '');
                                
                                // Ensure number starts with + or country code
                                if (!number.startsWith('+')) {
                                  if (number.startsWith('256')) {
                                    number = '+' + number;
                                  } else if (number.startsWith('0')) {
                                    number = '+256' + number.substring(1);
                                  } else if (/^[7-9]\d{8}$/.test(number)) {
                                    number = '+256' + number;
                                  } else {
                                    toast.error('Invalid phone number format');
                                    return;
                                  }
                                }
                                
                                // Remove + for WhatsApp URL
                                const cleanNumber = number.replace('+', '');
                                window.open(`https://wa.me/${cleanNumber}?text=Hello ${client.name}`, '_blank');
                              }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                          {client.email && (
                            <button
                              onClick={() => window.open(`mailto:${client.email}?subject=Follow-up`, '_blank')}
                              className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"
                              title="Email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                const response = await clientsAPI.getById(client._id);
                                // Create a temporary modal to view client details
                                const event = new CustomEvent('openClientDetails', { detail: response.data });
                                window.dispatchEvent(event);
                              } catch (error) {
                                toast.error('Failed to load client details');
                              }
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Client Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {tableTotalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {((tablePage - 1) * PAGE_SIZE) + 1}–{Math.min(tablePage * PAGE_SIZE, tableTotal)} of {tableTotal}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setTablePage(p => Math.max(1, p - 1))}
                disabled={tablePage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                onClick={() => setTablePage(p => Math.min(tableTotalPages, p + 1))}
                disabled={tablePage === tableTotalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;
