import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  Users,
  DollarSign,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertCircle,
  Plus,
  Download,
  Settings
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import DonutChart, { DealStatusChart, PaymentMethodChart, TaskStatusChart, TopAgentsChart } from '../components/charts/DonutChart';
import { useAuth } from '../context/AuthContext';
import { useChartTheme, ANALYTICS_PALETTE } from '../utils/chartTheme';
import dm from '../utils/darkModeClasses';
import DashboardQuickActions from '../components/DashboardQuickActions';
import { performanceAPI, dealsAPI, clientsAPI, salesAPI, usersAPI } from '../services/api';

// ─── thin wrapper so both roles share the same KPI card style ────────────────
const KPICard = ({ icon: Icon, title, value, subtitle, trend, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-50 dark:bg-[#193A52] text-primary-600 dark:text-[#1795CC]',
    blue:    'bg-blue-50   dark:bg-[#193A52] text-blue-600   dark:text-[#1795CC]',
    green:   'bg-green-50  dark:bg-[#1a3a2a] text-green-600  dark:text-green-400',
    purple:  'bg-purple-50 dark:bg-[#2a1a3a] text-[var(--primary-color)] dark:text-purple-400',
    red:     'bg-red-50    dark:bg-[#3a1a1a] text-red-600    dark:text-red-400',
    teal:    'bg-teal-50   dark:bg-[#1a3a38] text-teal-600   dark:text-teal-400',
  };
  return (
    <div className={`rounded-xl shadow-sm p-5 hover:shadow-md transition-all duration-150 ${dm.card} ${dm.cardHover}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${dm.textMuted}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${dm.textPrimary}`}>{value}</p>
          {subtitle && <p className={`text-xs mt-1 ${dm.textMuted}`}>{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(trend)}% vs last period
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// ─── Quick Actions Component ───────────────────────────────────────────────────
const QuickActions = ({ role }) => {
  const actions = role === 'agent' 
    ? [
        { label: 'Create Lead', icon: Plus, color: 'primary', action: () => window.location.href = '/agent/leads' },
        { label: 'New Sale', icon: DollarSign, color: 'green', action: () => window.location.href = '/agent/sales' },
        { label: 'Schedule', icon: Calendar, color: 'blue', action: () => window.location.href = '/agent/schedules' },
      ]
    : [
        { label: 'View Reports', icon: BarChart3, color: 'primary', action: () => window.location.href = '/admin/reports' },
        { label: 'Manage Users', icon: Users, color: 'blue', action: () => window.location.href = '/admin/users' },
        { label: 'Settings', icon: Settings, color: 'gray', action: () => window.location.href = '/admin/settings' },
      ];

  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 hover:bg-primary-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    gray: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
  };

  return (
    <div className="flex items-center gap-2">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <button
            key={idx}
            onClick={action.action}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${colorClasses[action.color]}`}
            title={action.label}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─── main component ─────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role;
  const { isDark, grid, axis, tooltipStyle, labelStyle, itemStyle, legend } = useChartTheme();
  const axisProps     = { tick: { fill: axis, fontSize: 12 }, axisLine: { stroke: grid }, tickLine: { stroke: grid } };

  const [loading, setLoading] = useState(true);
  const [kpi, setKpi]               = useState({});
  const [monthlySalesData, setMonthlySalesData]     = useState([]);
  const [dealStatusData, setDealStatusData]         = useState([]);
  const [pipelineValueData, setPipelineValueData]   = useState([]);
  const [revenueOverTimeData, setRevenueOverTimeData] = useState([]);
  const [cashVsCreditData, setCashVsCreditData]     = useState([]);
  const [followUpData, setFollowUpData]             = useState([]);
  const [topAgentsData, setTopAgentsData]           = useState([]);

  const formatUGX = (v) => `UGX ${Number(v||0).toLocaleString('en-UG',{maximumFractionDigits:0})}`;
  const formatUSD = (v) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v||0);

  useEffect(() => {
    if (role === 'agent') {
      loadAgentData();
    } else {
      loadAdminData();
    }
  }, [role]);

  // ── agent KPIs ──
  const loadAgentData = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const [perfRes, clientsRes, dealsRes, salesRes] = await Promise.allSettled([
        performanceAPI.getAgentStats(user._id),
        clientsAPI.getAll({ limit: 1000 }),
        dealsAPI.getAll(),
        salesAPI.getAll({ limit: 1000 }),
      ]);

      const allSales = salesRes.status === 'fulfilled' ? (salesRes.value?.data?.sales || []) : [];
      const allDeals = dealsRes.status === 'fulfilled' ? (dealsRes.value?.data?.deals      || dealsRes.value?.data || []) : [];
      const allClients = clientsRes.status === 'fulfilled' ? (clientsRes.value?.data?.clients  || []) : [];

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthlySales = allSales.filter(s => {
        const d = new Date(s.saleDate || s.createdAt);
        return d >= monthStart && d <= monthEnd;
      });
      const salesValue = monthlySales.reduce((sum, s) => sum + (Number(s.finalAmount) || 0), 0);
      const pipeline = allDeals.filter(d => !['won','lost'].includes((d.stage || '').toLowerCase()));
      const leads = allClients.filter(c => (c.status || '') === 'prospect');

      setKpi({
        salesValue, pipeline: pipeline.length,
        totalClients: allClients.length, leads: leads.length,
        dealsWon:   (allDeals.filter(d => (d.stage || '') === 'won')).length,
        dealCount:  allDeals.length,
      });

      // monthly sales bar
      const monthMap = new Map();
      const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      allSales.forEach(s => {
        const idx = new Date(s.saleDate || s.createdAt).getMonth();
        monthMap.set(idx, (monthMap.get(idx) || 0) + (Number(s.finalAmount) || 0));
      });
      setMonthlySalesData(mNames.map((m, i) => ({ month: m, sales: monthMap.get(i) || 0 })));

      // deal status pie
      const won    = allDeals.filter(d => (d.stage || '') === 'won').length;
      const lost   = allDeals.filter(d => (d.stage || '') === 'lost').length;
      const active = allDeals.length - won - lost;
      setDealStatusData([{ name: 'Won', value: won }, { name: 'Lost', value: lost }, { name: 'Active', value: active }]);

      // pipeline value by stage
      const stages = ['lead','qualification','proposal','negotiation'];
      setPipelineValueData(stages.map(st => ({
        stage: st.charAt(0).toUpperCase() + st.slice(1),
        value: allDeals.filter(d => (d.stage || '') === st).reduce((s,d) => s + (Number(d.value)||0), 0),
      })));

      // revenue over time area
      const revMap = new Map();
      allSales.forEach(s => {
        const idx = new Date(s.saleDate || s.createdAt).getMonth();
        revMap.set(idx, (revMap.get(idx) || 0) + (Number(s.finalAmount) || 0));
      });
      setRevenueOverTimeData(mNames.map((m,i) => ({ month: m, revenue: revMap.get(i) || 0 })));

      // cash vs credit
      const cash   = monthlySales.filter(s => (s.paymentMethod || '') === 'cash').reduce((s,x) => s + (Number(x.finalAmount)||0), 0);
      const credit = monthlySales.filter(s => (s.paymentMethod || '') === 'credit').reduce((s,x) => s + (Number(x.finalAmount)||0), 0);
      setCashVsCreditData([{ name: 'Cash', value: cash }, { name: 'Credit', value: credit }]);

      // follow up task status
      const today = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
      const allTasks = allClients.flatMap(c => (c.tasks||[]).map(t => ({ ...t, dueDate: new Date(t.dueDate) })));
      setFollowUpData([
        { name: 'Overdue',   value: allTasks.filter(t => t.dueDate < today    && !t.completed).length, color: '#ef4444' },
        { name: 'Due Today', value: allTasks.filter(t => t.dueDate >= today && t.dueDate < tomorrow && !t.completed).length, color: '#f59e0b' },
        { name: 'Upcoming',  value: allTasks.filter(t => t.dueDate >= tomorrow && !t.completed).length, color: '#10b981' },
      ]);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ── admin / superadmin / manager KPIs ──
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [perfRes, clientsRes, dealsRes, salesRes, usersRes] = await Promise.allSettled([
        performanceAPI.getOverall(),
        clientsAPI.getAll({ limit: 1 }),
        dealsAPI.getAll(),
        salesAPI.getAll({ limit: 1000 }),
        usersAPI.getAll({ limit: 1 }),
      ]);

      const allSales  = salesRes.status === 'fulfilled' ? (salesRes.value?.data?.sales || []) : [];
      const allDeals  = dealsRes.status === 'fulfilled' ? (dealsRes.value?.data?.deals      || dealsRes.value?.data || []) : [];
      const totalUsers = usersRes.status === 'fulfilled' ? (usersRes.value?.data?.users?.length || usersRes.value?.data?.length || 0) : 0;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthlySales = allSales.filter(s => {
        const d = new Date(s.saleDate || s.createdAt);
        return d >= monthStart && d <= monthEnd;
      });
      const monthlyRevenue = monthlySales.reduce((s,x) => s + (Number(x.finalAmount)||0), 0);

      setKpi({
        monthlyRevenue,
        totalUsers,
        deals: allDeals.length,
        pendingDeals: allDeals.filter(d => !['won','lost'].includes((d.stage||'').toLowerCase())).length,
        wonDeals: allDeals.filter(d => (d.stage||'')==='won').length,
        totalClients: clientsRes.status === 'fulfilled' ? (clientsRes.value?.data?.total || clientsRes.value?.data?.clients?.length || 0) : 0,
        cash: monthlySales.filter(s=>(s.paymentMethod||'')==='cash').reduce((s,x)=>s+(Number(x.finalAmount)||0),0),
        credit: monthlySales.filter(s=>(s.paymentMethod||'')==='credit').reduce((s,x)=>s+(Number(x.finalAmount)||0),0),
      });

      // monthly revenue bar
      const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const mRevMap = new Map();
      allSales.forEach(s => {
        const idx = new Date(s.saleDate || s.createdAt).getMonth();
        mRevMap.set(idx, (mRevMap.get(idx)||0) + (Number(s.finalAmount)||0));
      });
      setMonthlySalesData(mNames.map((m,i)=>({ month:m, revenue:mRevMap.get(i)||0 })));

      // deal status
      const won  = allDeals.filter(d=>(d.stage||'')==='won').length;
      const lost = allDeals.filter(d=>(d.stage||'')==='lost').length;
      const act  = allDeals.length - won - lost;
      setDealStatusData([{name:'Won',value:won},{name:'Lost',value:lost},{name:'Active',value:act}]);

      // deal stages by value
      const stages = ['lead','qualification','proposal','negotiation'];
      setPipelineValueData(stages.map(st => ({
        stage: st.charAt(0).toUpperCase()+st.slice(1),
        value: allDeals.filter(d=>(d.stage||'')===st).reduce((s,d)=>s+(Number(d.value)||0),0),
      })));

      // cash vs credit
      setCashVsCreditData([
        {name:'Cash',   value: monthlySales.filter(s=>(s.paymentMethod||'')==='cash').reduce((s,x)=>s+(Number(x.finalAmount)||0),0)},
        {name:'Credit', value: monthlySales.filter(s=>(s.paymentMethod||'')==='credit').reduce((s,x)=>s+(Number(x.finalAmount)||0),0)},
      ]);

      // top agents
      const byAgent = new Map();
      allDeals.filter(d=>(d.stage||'')==='won').forEach(d => {
        const a = d.agentName || '—';
        byAgent.set(a, (byAgent.get(a)||0) + (Number(d.value)||0));
      });
      const topArr = [...byAgent.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6);
      setTopAgentsData(topArr.map(([name,value])=>({name, value})));
    } catch (err) {
      toast.error('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ─── guard ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const isAgent = role === 'agent';

  return (
    <div className="w-full space-y-6">

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ADMIN / SUPER-ADMIN DASHBOARD                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {!isAgent && (
        <>
          {/* Spec cards: Sales (Monthly), Users (All time), Deals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={DollarSign}  title="Sales This Month" value={formatUGX(kpi.monthlyRevenue)} color="primary" />
            <KPICard icon={Users}       title="Users (All time)"  value={kpi.totalUsers}          color="blue"   />
            <KPICard icon={Target}      title="Deals"             value={kpi.deals}               color="green"  />
            <KPICard icon={Activity}    title="Clients"           value={kpi.totalClients || 0}   color="purple" />
          </div>

          <DashboardQuickActions role={role === 'superadmin' ? 'superadmin' : 'admin'} />

          {/* Second-row quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={CheckCircle} title="Won Deals"          value={kpi.wonDeals || 0}        color="green"  />
            <KPICard icon={AlertCircle} title="Pending Deals"       value={kpi.pendingDeals || 0}   color="primary" />
            <KPICard icon={DollarSign}  title="Cash Sales"          value={formatUGX(kpi.cash)}     color="teal"   />
            <KPICard icon={DollarSign}  title="Credit Sales"        value={formatUGX(kpi.credit)}   color="red"    />
          </div>

          {/* Charts — 2 × 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-[#3A3D52] rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip formatter={v => formatUSD(v)} contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} cursor={{ fill: isDark ? '#2A2D3E' : '#fef3c7' }} />
                  <Bar dataKey="revenue" fill={ANALYTICS_PALETTE.revenue} radius={[4,4,0,0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <DealStatusChart data={dealStatusData} height={280} />

            <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-[#3A3D52] rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deal Stages by Value</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pipelineValueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="stage" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip formatter={v => formatUGX(v)} contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} cursor={{ fill: isDark ? '#2A2D3E' : '#fef3c7' }} />
                  <Bar dataKey="value" fill={ANALYTICS_PALETTE.revenue} radius={[4,4,0,0]} name="Pipeline Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <TopAgentsChart 
              data={topAgentsData} 
              formatCurrency={formatUSD}
              height={280}
            />
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* AGENT DASHBOARD                                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isAgent && (
        <>
          {/* Spec cards: Sales Value, Pipeline, Total Clients, Leads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={DollarSign}  title="Sales Value"      value={formatUGX(kpi.salesValue)}          color="primary" />
            <KPICard icon={TrendingUp}  title="Pipeline"          value={kpi.pipeline || 0}                  color="blue"   />
            <KPICard icon={Users}       title="Total Clients"     value={kpi.totalClients || 0}              color="green"  />
            <KPICard icon={Target}      title="Leads"             value={kpi.leads || 0}                     color="purple" />
          </div>

          <DashboardQuickActions role="agent" />

          {/* Second-row agent stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={CheckCircle} title="Deals Won"         value={kpi.dealsWon || 0}                  color="green"  />
            <KPICard icon={Target}      title="Total Deals"        value={kpi.dealCount || 0}                 color="blue"   />
            <KPICard icon={DollarSign}  title="Monthly Revenue"   value={formatUGX(kpi.salesValue)}          color="primary" />
            <KPICard icon={TrendingUp}  title="Cash vs Credit"    value={`${formatUGX(kpi.salesValue)}`}     color="teal"   subtitle={kpi.salesValue ? `Cash: ${formatUGX(kpi.cash)} · Credit: ${formatUGX(kpi.credit)}` : '—'} />
          </div>

          {/* Charts — same 3-row layout from original dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-[#3A3D52] rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Sales Revenue</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip formatter={v => formatUGX(v)} contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} cursor={{ fill: isDark ? '#2A2D3E' : '#fef3c7' }} />
                  <Bar dataKey="sales" fill={ANALYTICS_PALETTE.revenue} radius={[4,4,0,0]} name="Sales" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <DealStatusChart data={dealStatusData} height={260} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-[#3A3D52] rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Over Time</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip formatter={v => formatUGX(v)} contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                  <Area type="monotone" dataKey="revenue" stroke={ANALYTICS_PALETTE.revenue} fill={isDark ? '#2A2D3E' : `${ANALYTICS_PALETTE.revenue}1A`} strokeWidth={2} name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-[#3A3D52] rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pipeline Value by Stage</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pipelineValueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="stage" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip formatter={v => formatUGX(v)} contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} cursor={{ fill: isDark ? '#2A2D3E' : '#fef3c7' }} />
                  <Bar dataKey="value" fill={ANALYTICS_PALETTE.revenue} radius={[4,4,0,0]} name="Pipeline Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentMethodChart 
              data={cashVsCreditData} 
              formatCurrency={formatUGX}
              height={260}
              title="Cash vs Credit (This Month)"
            />

            <TaskStatusChart 
              data={followUpData} 
              height={260}
              title="Follow-up Task Status"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
