import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Users, UserCheck,
  Filter, Eye, Mail, MessageSquare,
  ChevronDown, ChevronUp, Star, Clock, CheckCircle, AlertCircle, Award,
  Download, FileText, Plus
} from 'lucide-react';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
  AreaChart, Area, ComposedChart
} from 'recharts';
import DonutChart, { DealStatusChart, PaymentMethodChart, TaskStatusChart } from '../../components/charts/DonutChart';
import { performanceAPI, dealsAPI, clientsAPI, salesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import DashboardQuickActions from '../../components/DashboardQuickActions';
import Leaderboard from '../../components/Leaderboard';
import TargetProgress from '../../components/TargetProgress';
import { useChartTheme } from '../../utils/chartTheme';
import dm from '../../utils/darkModeClasses';
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
    className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition-shadow duration-200"
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] mb-2">{title}</p>
        <p className="text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">{value}</p>
        {subtitle && <p className="text-sm mt-2 text-[#64748B] dark:text-[#94A3B8]">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={2} />
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

      // Pipeline value by stage bar
      const stages = ['lead','qualification','proposal','negotiation'];
      setPipelineValueData(stages.map(stage => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        value: allDeals.filter(d => d.stage === stage).reduce((sum, d) => sum + (Number(d.value) || 0), 0),
        count: allDeals.filter(d => d.stage === stage).length,
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
    <div className="dashboard-page pt-4">
      {/* ── 4 KPI Cards (spec: Sales Value, Pipeline, Total Clients, Leads) ── */}
      <div className="stat-grid cols-4">
        <KPICard
          icon={DollarSign}
          title="Sales Value"
          value={formatUGX(salesValue)}
          subtitle="This month's revenue"
          iconBg="bg-primary-50"
          iconColor="text-primary-500"
        />
        <KPICard
          icon={TrendingUp}
          title="Pipeline"
          value={pipelineCount}
          subtitle="Active deals in progress"
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <KPICard
          icon={Users}
          title="Total Clients"
          value={totalClients}
          subtitle="All time"
          iconBg="bg-green-50"
          iconColor="text-green-500"
        />
        <KPICard
          icon={UserCheck}
          title="Leads"
          value={leadsCount}
          subtitle="Prospects to follow up"
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />
      </div>

      <DashboardQuickActions role={user?.role || 'agent'} />

      {/* ── Target Progress & Leaderboard ── */}
      <div className="chart-grid">
        <TargetProgress salesValue={salesValue} />
        <Leaderboard />
      </div>

      {/* ── Customer Table with Search & Filter ── */}
      {/*
        WHY THIS IS HERE: The spec says the landing page must have a customer table
        with search & filter so agents can immediately find and act on clients
        without navigating to a separate page. This is the agent's primary workspace.
      */}
      {/* ── Charts Row 1: Monthly Sales + Deal Status ── */}
      <div className="chart-grid">
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#F1F5F9] dark:border-[#334155]">
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">Monthly Sales Revenue</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="month" stroke={axis} style={{ fontSize: '12px' }} />
                <YAxis stroke={axis} style={{ fontSize: '12px' }} />
                <Tooltip formatter={v => formatUGX(v)} contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                <Bar dataKey="sales" fill="#D89A00" radius={[4,4,0,0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <DealStatusChart data={dealStatusData} height={260} />
      </div>

      {/* ── Charts Row 2: Revenue Over Time + Pipeline Value ── */}
      <div className="chart-grid">
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#F1F5F9] dark:border-[#334155]">
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">Revenue Over Time</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="month" stroke={axis} style={{ fontSize: '12px' }} />
                <YAxis stroke={axis} style={{ fontSize: '12px' }} />
                <Tooltip formatter={v => formatUGX(v)} contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                <Area type="monotone" dataKey="revenue" stroke="#D89A00" fill="rgba(216,154,0,0.1)" strokeWidth={2} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#F1F5F9] dark:border-[#334155]">
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">Pipeline Value by Stage</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pipelineValueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="stage" stroke={axis} style={{ fontSize: '12px' }} />
                <YAxis stroke={axis} style={{ fontSize: '12px' }} />
                <Tooltip formatter={v => formatUGX(v)} contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                <Bar dataKey="value" fill="#64748B" radius={[4,4,0,0]} name="Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Charts Row 3: Cash vs Credit + Follow-up Status ── */}
      <div className="chart-grid">
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
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#F1F5F9] dark:border-[#334155]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-lg font-bold flex-1 text-[#0F172A] dark:text-[#F8FAFC]">My Clients</h2>
            {/* Status filter */}
            <select
              value={tableStatus}
              onChange={e => { setTableStatus(e.target.value); setTablePage(1); }}
              className="h-12 px-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] text-sm focus:outline-none focus:border-[#D89A00] focus:ring-[3px] focus:ring-[rgba(216,154,0,0.1)]"
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
            <thead className="bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#F1F5F9] dark:border-[#1E293B]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase text-xs tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                  Client <SortIcon col="name" />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase text-xs tracking-wider cursor-pointer" onClick={() => handleSort('company')}>
                  Company <SortIcon col="company" />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase text-xs tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase text-xs tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                  Status <SortIcon col="status" />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase text-xs tracking-wider cursor-pointer" onClick={() => handleSort('priority')}>
                  Priority <SortIcon col="priority" />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase text-xs tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1E293B]">
              {tableLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D89A00] mx-auto" />
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-[#64748B] dark:text-[#94A3B8]">
                    {tableSearch || tableStatus ? 'No clients match your search' : 'No clients yet'}
                  </td>
                </tr>
              ) : (
                clients.map(client => {
                  const statusStyle = STATUS_STYLES[client.status] || STATUS_STYLES.inactive;
                  const StatusIcon  = statusStyle.icon;
                  return (
                    <tr key={client._id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors duration-150">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[rgba(216,154,0,0.1)] dark:bg-[rgba(216,154,0,0.2)] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[#D89A00] font-semibold text-sm">
                              {client.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#0F172A] dark:text-[#F8FAFC]">{client.name}</p>
                            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{client.position || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#475569] dark:text-[#CBD5E1]">{client.company || '—'}</td>
                      <td className="px-4 py-4">
                        <p className="text-[#0F172A] dark:text-[#F8FAFC]">{client.phone}</p>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{client.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg}`}>
                          <StatusIcon className="w-3 h-3" />
                          {client.status === 'prospect' ? 'Lead' : client.status?.charAt(0).toUpperCase() + client.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_STYLES[client.priority] || 'bg-[#F1F5F9] dark:bg-[#334155] text-[#475569] dark:text-[#CBD5E1]'}`}>
                          {client.priority?.charAt(0).toUpperCase() + client.priority?.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
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
