import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  FileSearch,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import toast from 'react-hot-toast';
import { tenantsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useChartTheme, ANALYTICS_PALETTE } from '../../utils/chartTheme';
import dm from '../../utils/darkModeClasses';
import sidebarLogo from '../../assets/sidebar.png';
import Pagination from '../../components/Pagination';

const formatNumber = (value) => new Intl.NumberFormat().format(Math.round(value || 0));
const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
}).format(value || 0);

const statusClasses = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trial: 'bg-amber-50 text-amber-700 border-amber-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200'
};

const cardClass = 'chart-panel';

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[status] || statusClasses.inactive}`}>
    {status || 'inactive'}
  </span>
);

const MetricCard = ({ icon: Icon, label, value, detail, tone = 'primary' }) => {
  const tones = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm font-medium ${dm.textMuted}`}>{label}</p>
          <p className={`mt-2 text-3xl font-bold ${dm.textPrimary}`}>{value}</p>
          {detail && <p className={`mt-2 text-sm ${dm.textMuted}`}>{detail}</p>}
        </div>
        <div className={`rounded-lg p-3 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ title, text }) => (
  <div className={`rounded-lg border border-dashed p-8 text-center ${dm.border} bg-[var(--color-bg-card)]`}>
    <Search className={`mx-auto h-8 w-8 ${dm.textMuted}`} />
    <p className={`mt-3 font-semibold ${dm.textPrimary}`}>{title}</p>
    {text && <p className={`mt-1 text-sm ${dm.textMuted}`}>{text}</p>}
  </div>
);

const GlobalCommandCenter = () => {
  const { user } = useAuth();
  const { grid, axis, tooltipStyle, labelStyle, itemStyle } = useChartTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({ totals: {}, companies: [], alerts: [], system: {} });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tenantPage, setTenantPage] = useState(1);
  const [tenantPageSize, setTenantPageSize] = useState(20);

  const loadDashboard = async ({ silent = false } = {}) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const response = await tenantsAPI.getCommandCenter();
      setData(response.data || { totals: {}, companies: [], alerts: [], system: {} });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load super admin overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const companies = data.companies || [];
  const totals = data.totals || {};
  const system = data.system || {};

  const filteredCompanies = useMemo(() => {
    const value = query.trim().toLowerCase();
    return companies.filter((company) => (
      (!value || company.name?.toLowerCase().includes(value) ||
        company.email?.toLowerCase().includes(value) ||
        company.slug?.toLowerCase().includes(value)) &&
      (!statusFilter || company.status === statusFilter)
    ));
  }, [companies, query, statusFilter]);

  const revenueChart = [...companies]
    .sort((a, b) => (b.sales?.revenue || 0) - (a.sales?.revenue || 0))
    .slice(0, 6)
    .map((company) => ({ name: company.name, revenue: company.sales?.revenue || 0 }));

  const tenantHealthChart = [
    { name: 'Active', value: totals.activeTenants || 0, color: '#059669' },
    { name: 'Trial', value: totals.trialTenants || 0, color: '#d97706' },
    { name: 'Suspended', value: totals.suspendedTenants || 0, color: '#dc2626' }
  ];

  const exportOverview = () => {
    const headers = ['Company', 'Email', 'Status', 'Users', 'Clients', 'Deals', 'Revenue', 'MRR', 'Security Score'];
    const rows = filteredCompanies.map((company) => [
      company.name,
      company.email,
      company.status,
      company.usage?.users,
      company.usage?.clients,
      company.usage?.deals,
      company.sales?.revenue,
      company.mrr,
      company.security?.score
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'super-admin-overview.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#FFD700]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${cardClass} p-5`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary-500 p-3">
              <img src={sidebarLogo} alt="HoneyPot" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">Super Admin Overview</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {user?.name || 'Super Admin'}. Monitor platform health, tenant performance, revenue, and risk signals here.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => loadDashboard({ silent: true })}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportOverview}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => navigate('/superadmin/tenants')}
              className="btn-primary"
            >
              Tenant Management
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Building2}
          label="Total Tenants"
          value={formatNumber(totals.tenants)}
          detail={`${formatNumber(totals.activeTenants)} active, ${formatNumber(totals.suspendedTenants)} suspended`}
          tone="primary"
        />
        <MetricCard
          icon={Users}
          label="Platform Users"
          value={formatNumber(totals.users)}
          detail="Summed from tenant usage"
          tone="blue"
        />
        <MetricCard
          icon={TrendingUp}
          label="Tracked Revenue"
          value={formatCurrency(totals.revenue)}
          detail={`${formatNumber(totals.sales)} non-cancelled sales`}
          tone="green"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Open Risk Signals"
          value={formatNumber(data.alerts?.length)}
          detail={`${formatNumber(system.blockedPolicies)} active security blocks`}
          tone={(data.alerts?.length || 0) > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={`${cardClass} p-5 xl:col-span-2`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-950">Revenue Leaders</h2>
              <p className="mt-1 text-sm text-gray-500">Top tenants by real sales revenue.</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary-500" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChart} layout="vertical" margin={{ left: 18, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={grid} />
                <XAxis type="number" tickFormatter={(value) => `$${Math.round(value / 1000)}k`} stroke={axis} />
                <YAxis dataKey="name" type="category" width={130} tickLine={false} axisLine={false} stroke={axis} />
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                <Bar dataKey="revenue" fill={ANALYTICS_PALETTE.revenue} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${cardClass} p-5`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-950">Runtime Health</h2>
              <p className="mt-1 text-sm text-gray-500">Real backend process metrics.</p>
            </div>
            <Server className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-gray-500">API query latency</span>
              <span className="font-semibold text-gray-900">{formatNumber(system.apiLatencyMs)} ms</span>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-gray-500">Process uptime</span>
              <span className="font-semibold text-gray-900">{formatNumber((system.uptimeSeconds || 0) / 60)} min</span>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-gray-500">Heap used</span>
              <span className="font-semibold text-gray-900">{formatNumber(system.memory?.heapUsedMb)} MB</span>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-gray-500">Heap usage</span>
              <span className="font-semibold text-gray-900">{formatNumber(system.memory?.heapUsagePercent)}%</span>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-gray-500">Database</span>
              <span className="font-semibold capitalize text-gray-900">{system.dbState || 'connected'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={`${cardClass} p-5`}>
          <h2 className="mb-4 font-bold text-gray-950">Tenant Status</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenantHealthChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke={axis} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke={axis} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {tenantHealthChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${cardClass} p-5 xl:col-span-2`}>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-gray-950">Tenant Snapshot</h2>
              <p className="mt-1 text-sm text-gray-500">Quick read-only monitoring. Use Tenant Management for actions.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setTenantPage(1); }}
                  placeholder="Search tenants..."
                  className="w-full sm:w-64 form-input pl-10 pr-3"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setTenantPage(1); }}
                className="form-input px-3"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="table-header">
                <tr>
                  {['Tenant', 'Status', 'Users', 'Revenue', 'MRR', 'Security'].map((head) => (
                    <th key={head} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCompanies.slice((tenantPage - 1) * tenantPageSize, tenantPage * tenantPageSize).map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-950">{company.name}</p>
                      <p className="text-xs text-gray-500">{company.email}</p>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={company.status} /></td>
                    <td className="px-4 py-4 text-sm text-gray-700">{formatNumber(company.usage?.users)} / {formatNumber(company.limits?.users)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">{formatCurrency(company.sales?.revenue)}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{formatCurrency(company.mrr)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">{formatNumber(company.security?.score)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredCompanies.length && <EmptyState title="No tenants found" text="Try another search term or filter." />}
            <Pagination
              currentPage={tenantPage}
              totalPages={Math.ceil(filteredCompanies.length / tenantPageSize)}
              totalItems={filteredCompanies.length}
              pageSize={tenantPageSize}
              onPageChange={setTenantPage}
              onPageSizeChange={(s) => { setTenantPageSize(s); setTenantPage(1); }}
            />
          </div>
        </div>
      </div>

      <div className={`${cardClass} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-950">Risk Signals</h2>
            <p className="mt-1 text-sm text-gray-500">Operational alerts generated from tenant status, usage pressure, security blocks, and pending credit sales.</p>
          </div>
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {(data.alerts || []).map((alert, index) => (
            <div key={`${alert.companyId}-${index}`} className="rounded-lg border border-gray-200 p-4">
              <p className="font-semibold text-gray-950">{alert.title}</p>
              <p className="mt-1 text-sm text-gray-500">{alert.companyName}</p>
              <p className="mt-2 text-sm text-gray-600">{alert.detail}</p>
            </div>
          ))}
          {!(data.alerts || []).length && (
            <div className="rounded-lg bg-emerald-50 p-5 text-center lg:col-span-3">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
              <p className="mt-2 font-semibold text-emerald-800">No current risk signals</p>
              <p className="text-sm text-emerald-700">Tenant status, usage, and security indicators are within current thresholds.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <button onClick={() => navigate('/admin/reports')} className={`${cardClass} p-5 text-left hover:border-primary-300`}>
          <FileSearch className="mb-3 h-5 w-5 text-primary-500" />
          <p className="font-semibold text-gray-950">Reports & Audit</p>
          <p className="mt-1 text-sm text-gray-500">Open reporting, analytics, and audit history.</p>
        </button>
        <button onClick={() => navigate('/admin/users')} className={`${cardClass} p-5 text-left hover:border-primary-300`}>
          <Users className="mb-3 h-5 w-5 text-primary-500" />
          <p className="font-semibold text-gray-950">Platform Users</p>
          <p className="mt-1 text-sm text-gray-500">Register platform admins and managers.</p>
        </button>
        <button onClick={() => navigate('/admin/settings')} className={`${cardClass} p-5 text-left hover:border-primary-300`}>
          <Activity className="mb-3 h-5 w-5 text-primary-500" />
          <p className="font-semibold text-gray-950">System Settings</p>
          <p className="mt-1 text-sm text-gray-500">Security, communication, and compliance controls.</p>
        </button>
      </div>
    </div>
  );
};

export default GlobalCommandCenter;
