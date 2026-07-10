import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Target, TrendingUp, ShieldCheck, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { tenantsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import potLogo from '../../assets/pot logo.png';

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'honey' }) => {
  const colors = {
    honey: 'bg-[#D89A00]',
    blue: 'bg-[#0EA5E9]',
    green: 'bg-[#10B981]',
    purple: 'bg-[#8B5CF6]',
  };
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-6 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] mb-2">{title}</p>
          <p className="text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">{value}</p>
          {subtitle && <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-2">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-[#D1FAE5] dark:bg-[rgba(16,185,129,0.2)] text-[#059669] dark:text-[#86EFAC]',
    trial: 'bg-[#FEF3C7] dark:bg-[rgba(245,158,11,0.2)] text-[#D97706] dark:text-[#FDE047]',
    suspended: 'bg-[#FEE2E2] dark:bg-[rgba(239,68,68,0.2)] text-[#DC2626] dark:text-[#FCA5A5]',
    inactive: 'bg-[#F1F5F9] dark:bg-[#334155] text-[#475569] dark:text-[#CBD5E1]',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.inactive}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0, active: 0, trial: 0, suspended: 0,
    totalUsers: 0, totalClients: 0, totalDeals: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await tenantsAPI.getAll();
      const allTenants = res.data.tenants || [];
      setTenants(allTenants);

      // Calculate stats
      const active = allTenants.filter(t => t.status === 'active').length;
      const trial = allTenants.filter(t => t.status === 'trial').length;
      const suspended = allTenants.filter(t => t.status === 'suspended').length;
      const totalUsers = allTenants.reduce((sum, t) => sum + (t.usage?.totalUsers || 0), 0);
      const totalClients = allTenants.reduce((sum, t) => sum + (t.usage?.totalClients || 0), 0);
      const totalDeals = allTenants.reduce((sum, t) => sum + (t.usage?.totalDeals || 0), 0);

      setStats({ total: allTenants.length, active, trial, suspended, totalUsers, totalClients, totalDeals });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D89A00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/superadmin/tenants')}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#D89A00] hover:bg-[#B87900] text-white rounded-xl text-sm font-semibold shadow-[0_2px_8px_rgba(216,154,0,0.2)] hover:shadow-[0_4px_12px_rgba(216,154,0,0.3)] transition-all duration-150"
        >
          <Building2 className="w-4 h-4" />
          <span>Manage Tenants</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Building2} title="Total Organizations" value={stats.total} subtitle="On the platform" color="honey" />
        <StatCard icon={Users} title="Total Users" value={stats.totalUsers} subtitle="Across all organizations" color="blue" />
        <StatCard icon={Target} title="Total Deals" value={stats.totalDeals} subtitle="Across all organizations" color="green" />
        <StatCard icon={TrendingUp} title="Total Clients" value={stats.totalClients} subtitle="Across all organizations" color="purple" />
      </div>

      {/* Tenant Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#10B981] rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Active Organizations</p>
              <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#F59E0B] rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">On Trial</p>
              <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1">{stats.trial}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#EF4444] rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Suspended</p>
              <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1">{stats.suspended}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tenants Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9] dark:border-[#334155]">
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">All Organizations</h2>
          <button
            onClick={() => navigate('/superadmin/tenants')}
            className="text-[#D89A00] hover:text-[#B87900] text-sm font-semibold flex items-center space-x-1 transition-colors duration-150"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#F1F5F9] dark:border-[#1E293B]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Organization</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Users</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Clients</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Deals</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1E293B]">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-[#64748B] dark:text-[#94A3B8]">
                    No organizations found
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant._id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors duration-150">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[rgba(216,154,0,0.1)] dark:bg-[rgba(216,154,0,0.2)] rounded-full flex items-center justify-center">
                          <span className="text-[#D89A00] font-semibold text-sm">
                            {tenant.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#0F172A] dark:text-[#F8FAFC]">{tenant.name}</p>
                          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{tenant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={tenant.status} /></td>
                    <td className="px-4 py-4 text-[#475569] dark:text-[#CBD5E1]">{tenant.usage?.totalUsers || 0}</td>
                    <td className="px-4 py-4 text-[#475569] dark:text-[#CBD5E1]">{tenant.usage?.totalClients || 0}</td>
                    <td className="px-4 py-4 text-[#475569] dark:text-[#CBD5E1]">{tenant.usage?.totalDeals || 0}</td>
                    <td className="px-4 py-4 text-[#64748B] dark:text-[#94A3B8] text-sm">
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
      <div className="bg-gradient-to-r from-[#D89A00] to-[#B87900] rounded-2xl p-6 text-white shadow-[0_8px_30px_rgba(216,154,0,0.2)]">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Super Admin Access</h3>
            <p className="text-white/90 text-sm mt-1 leading-relaxed">
              You have full platform access. You can create organizations, manage subscriptions, and view all data across the platform.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SuperAdminDashboard;
