import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, TrendingUp, ShieldCheck, AlertCircle, CheckCircle, Clock, ArrowRight, Search } from 'lucide-react';
import { tenantsAPI, usersAPI } from '../../services/api';
import toast from 'react-hot-toast';
import DashboardQuickActions from '../../components/DashboardQuickActions';

const cardClass = 'chart-panel';

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    orange: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-[var(--primary-color)]',
  };
  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.inactive}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [platformUsers, setPlatformUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [tenantSearch, setTenantSearch] = useState('');

  const [stats, setStats] = useState({
    total: 0, active: 0, trial: 0, suspended: 0,
    totalUsers: 0, totalClients: 0, totalDeals: 0,
    cancelledSubscriptions: 0, subscriptionValue: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, usersRes] = await Promise.all([
        tenantsAPI.getAll(),
        usersAPI.getAll({ limit: 1000 }),
      ]);
      const allTenants = tenantsRes.data.tenants || [];

      // Count cancelled subscriptions across all tenants
      let cancelledCount = 0;
      let totalValue = 0;
      for (const tenant of allTenants) {
        const sub = tenant.subscription;
        if (sub) {
          if (sub.status === 'cancelled') {
            cancelledCount++;
          }
          if (sub.pricing) {
            const amt = sub.pricing.amount || 0;
            const interval = sub.pricing.interval;
            if (interval === 'monthly') {
              totalValue += amt;
            } else if (interval === 'yearly') {
              totalValue += amt / 12;
            }
          }
        }
      }

      // Retrieve platform users directly from the backend API
      const usersData = usersRes.data?.users || usersRes.data || [];

      const active = allTenants.filter(t => t.status === 'active').length;
      const trial = allTenants.filter(t => t.status === 'trial').length;
      const suspended = allTenants.filter(t => t.status === 'suspended').length;
      const totalUsers = usersData.length || allTenants.reduce((sum, t) => sum + (t.usage?.totalUsers || 0), 0);
      const totalClients = allTenants.reduce((sum, t) => sum + (t.usage?.totalClients || 0), 0);
      const totalDeals = allTenants.reduce((sum, t) => sum + (t.usage?.totalDeals || 0), 0);

      setStats({
        total: allTenants.length, active, trial, suspended,
        totalUsers, totalClients, totalDeals,
        cancelledSubscriptions: cancelledCount,
        subscriptionValue: totalValue,
      });
      setPlatformUsers(usersData);
      setTenants(allTenants);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlatformUsers = useMemo(() => {
    if (!userSearch.trim()) return platformUsers;
    const q = userSearch.toLowerCase();
    return platformUsers.filter(
      u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
    );
  }, [platformUsers, userSearch]);

  const filteredTenants = useMemo(() => {
    if (!tenantSearch.trim()) return tenants;
    const q = tenantSearch.toLowerCase();
    return tenants.filter(
      tenant =>
        (tenant.name || '').toLowerCase().includes(q) ||
        (tenant.email || '').toLowerCase().includes(q) ||
        (tenant.status || '').toLowerCase().includes(q)
    );
  }, [tenants, tenantSearch]);

  const statusSeries = [
    { label: 'Active', value: stats.active, color: 'bg-green-500' },
    { label: 'Trial', value: stats.trial, color: 'bg-yellow-500' },
    { label: 'Suspended', value: stats.suspended, color: 'bg-red-500' },
  ];
  const usageSeries = [
    { label: 'Users', value: stats.totalUsers, color: 'bg-blue-500' },
    { label: 'Clients', value: stats.totalClients, color: 'bg-green-500' },
    { label: 'Deals', value: stats.totalDeals, color: 'bg-primary-500' },
  ];
  const maxUsageValue = Math.max(...usageSeries.map(item => item.value), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Stats — 4 spec-required cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} title="Tenants" value={stats.total} subtitle="Organizations on the platform" color="primary" />
        <StatCard icon={Users} title="Users" value={stats.totalUsers} subtitle="All time across all tenants" color="blue" />
        <StatCard icon={AlertCircle} title="Cancelled Subscriptions" value={stats.cancelledSubscriptions} subtitle="Tenants with cancelled plan" color="red" />
        <StatCard icon={TrendingUp} title="Value of Subscriptions" value={`$${stats.subscriptionValue.toLocaleString()}`} subtitle="Monthly recurring revenue (USD)" color="green" />
      </div>

      <DashboardQuickActions role="superadmin" />

      {/* Tenant Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Active Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-50 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
            <div>
              <p className="text-sm text-gray-600">On Trial</p>
              <p className="text-2xl font-bold text-gray-900">{stats.trial}</p>
            </div>
          </div>
        </div>
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">{stats.suspended}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className={`${cardClass} p-5`}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Organization Status</h2>
            <p className="text-sm text-gray-500">Distribution of tenants across the platform.</p>
          </div>
          <div className="space-y-4">
            {statusSeries.map((item) => {
              const percentage = stats.total ? Math.round((item.value / stats.total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="text-gray-500">{item.value} ({percentage}%)</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${cardClass} p-5`}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Platform Activity Mix</h2>
            <p className="text-sm text-gray-500">Users, clients, and deals recorded across all organizations.</p>
          </div>
          <div className="space-y-4">
            {usageSeries.map((item) => {
              const percentage = Math.max(Math.round((item.value / maxUsageValue) * 100), item.value > 0 ? 8 : 0);
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="text-gray-500">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* All Users Table */}
      <div className={cardClass}>
        <div className="flex flex-col gap-4 p-5 border-b border-gray-100 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
            <p className="text-sm text-gray-500">Search platform users by name, email, or role.</p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPlatformUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                filteredPlatformUsers
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 font-semibold text-xs">
                              {user.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-[var(--primary-color)] capitalize">{user.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${user.isActive === false ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                          {user.isActive === false ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm">{user.tenantName || user.tenant?.name || '-'}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Tenants Table */}
      <div className={cardClass}>
        <div className="flex flex-col gap-4 p-5 border-b border-gray-100 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Organizations</h2>
            <p className="text-sm text-gray-500">Search tenants by organization, email, or status.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                placeholder="Search organizations..."
                className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <button
              onClick={() => navigate('/superadmin/tenants')}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-primary-200 px-4 py-2.5 text-sm font-semibold text-primary-600 hover:bg-primary-50"
            >
              <span>View Tenants</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Deals</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No organizations found
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {tenant.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tenant.name}</p>
                          <p className="text-xs text-gray-500">{tenant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={tenant.status} /></td>
                    <td className="px-6 py-4 text-gray-700">{tenant.usage?.totalUsers || 0}</td>
                    <td className="px-6 py-4 text-gray-700">{tenant.usage?.totalClients || 0}</td>
                    <td className="px-6 py-4 text-gray-700">{tenant.usage?.totalDeals || 0}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Super Admin Info Card */}
      <div className="brand-header rounded-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Super Admin Access</h3>
            <p className="text-primary-100 text-sm mt-1">
              You have full platform access. You can create organizations, manage subscriptions, and view all data across the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

