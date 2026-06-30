import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Target, TrendingUp, ShieldCheck, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { tenantsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'orange' }) => {
  const colors = {
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/superadmin/tenants')}
          className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Building2 className="w-4 h-4" />
          <span>Manage Tenants</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} title="Total Organizations" value={stats.total} subtitle="On the platform" color="orange" />
        <StatCard icon={Users} title="Total Users" value={stats.totalUsers} subtitle="Across all organizations" color="blue" />
        <StatCard icon={Target} title="Total Deals" value={stats.totalDeals} subtitle="Across all organizations" color="green" />
        <StatCard icon={TrendingUp} title="Total Clients" value={stats.totalClients} subtitle="Across all organizations" color="yellow" />
      </div>

      {/* Tenant Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Active Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-50 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
            <div>
              <p className="text-sm text-gray-600">On Trial</p>
              <p className="text-2xl font-bold text-gray-900">{stats.trial}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">{stats.suspended}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tenants Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">All Organizations</h2>
          <button
            onClick={() => navigate('/superadmin/tenants')}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
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
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No organizations found
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-semibold text-sm">
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
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Super Admin Access</h3>
            <p className="text-orange-100 text-sm mt-1">
              You have full platform access. You can create organizations, manage subscriptions, and view all data across the platform.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SuperAdminDashboard;
