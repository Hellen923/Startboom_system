import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Edit, Trash2, User, UserPlus, Shield, RefreshCw, 
  UserX, X, Mail, Phone, Calendar, Award, TrendingUp,
  Filter, Download, CheckCircle, XCircle,
  Clock, AlertCircle, ChevronDown, Users
} from 'lucide-react';
import { usersAPI, rolesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location?.state?.search) {
      setSearchTerm(location.state.search);
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (location?.state?.openCreate) {
      setShowAddModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  const [users, setUsers] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsUser, setDetailsUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'agent',
    customRole: '',
    department: '',
    customDepartment: '',
    region: ''
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState({});

   const [showEditModal, setShowEditModal] = useState(false);
   const [editUser, setEditUser] = useState(null);
   const [showDeactivateModal, setShowDeactivateModal] = useState(false);
   const [deactivateTarget, setDeactivateTarget] = useState(null);

   const [formErrors, setFormErrors] = useState({});
   const [targetForm, setTargetForm] = useState({
     monthlyTargetDeals: 0,
     monthlyTargetAmount: 0,
     monthlyTargetClients: 0
   });
   const [targetErrors, setTargetErrors] = useState({});
   const [showTargetModal, setShowTargetModal] = useState(false);
   const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    loadUsers();
    if (!isSuperAdmin) loadCustomRoles();
  }, []);

  const loadCustomRoles = async () => {
    try {
      const res = await rolesAPI.getAll();
      setCustomRoles(res.data.roles || []);
    } catch (error) {
      console.error('Failed to load custom roles');
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Performance Score', 'Total Deals', 'Successful Deals', 'Total Sales Amount', 'Joined Date'];
      const rows = filteredUsers.map(u => [
        u.name || '',
        u.email || '',
        u.phone || '',
        u.role || '',
        u.isActive === false ? 'Inactive' : u.isFirstLogin ? 'Pending' : 'Active',
        u.performanceScore || 0,
        u.totalDeals || 0,
        u.successfulDeals || 0,
        u.totalSalesAmount || 0,
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''
      ]);

      const csvContent = [
        `CRM User Management Report`,
        `Generated: ${new Date().toLocaleString()}`,
        `Total Users: ${filteredUsers.length}`,
        '',
        headers.join(','),
        ...rows.map(r => r.map(v => `"${v}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-report-${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filteredUsers.length} users to CSV`);
    } catch (error) {
      toast.error('Failed to export users');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      
      // Handle different response structures
      let usersData = [];
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data?.users && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        usersData = response.data.data;
      }
      
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users. Please check your connection.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

   const validateForm = () => {
     const errors = {};

     if (!newUser.name.trim()) {
       errors.name = 'Name is required';
     }

     if (!newUser.email.trim()) {
       errors.email = 'Email is required';
     } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
       errors.email = 'Email is invalid';
     }

     if (newUser.phone && !/^\+?[\d\s-()]+$/.test(newUser.phone)) {
       errors.phone = 'Phone number is invalid';
     }

     if (!newUser.role) {
       errors.role = 'Role is required';
     }

     setFormErrors(errors);
     return Object.keys(errors).length === 0;
   };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setFormLoading(true);
    try {
      const resolvedDepartment = newUser.department === 'Others' ? newUser.customDepartment : newUser.department;
      const response = await usersAPI.registerAgent({ ...newUser, department: resolvedDepartment, customDepartment: undefined });

      setSuccessInfo({
        emailSent: response.data.emailSent,
        otp: response.data.otp || null,
        email: newUser.email,
        name: newUser.name
      });
      setShowSuccessModal(true);

      setShowAddModal(false);
      setNewUser({ name: '', email: '', phone: '', role: isSuperAdmin ? 'manager' : 'agent', customRole: '', department: '', customDepartment: '', region: '' });
      setFormErrors({});
      loadUsers();
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to register agent';
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleResendOTP = async (userId, userName) => {
    try {
      const response = await usersAPI.resendOTP(userId);
      toast.success(
        <div>
          <p className="font-medium">OTP resent to {userName}!</p>
          {response.data.otp && (
            <p className="text-sm mt-1 bg-gray-100 p-2 rounded font-mono">
              OTP: {response.data.otp}
            </p>
          )}
        </div>,
        { duration: 8000 }
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      try {
        await usersAPI.delete(userId);
        toast.success(`User ${userName} deleted successfully`);
        loadUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleEditClick = (user) => {
    const known = ['HR', 'Finance', 'IT'];
    const dept = known.includes(user.department) ? user.department : (user.department ? 'Others' : '');
    setEditUser({ 
      ...user, 
      department: dept, 
      customDepartment: dept === 'Others' ? (user.department || '') : '' 
    });
    setShowEditModal(true);
  };

  const openDeactivateModal = (user) => {
    setDeactivateTarget(user);
    setShowDeactivateModal(true);
  };

   const handleToggleActive = async () => {
     if (!deactivateTarget) return;
     const id = deactivateTarget._id;
     const newActive = deactivateTarget.isActive === false ? true : false;
     try {
       await usersAPI.update(id, { isActive: newActive });
       toast.success(newActive ? 'User activated successfully' : 'User deactivated successfully');
       setShowDeactivateModal(false);
       setDeactivateTarget(null);
       loadUsers();
     } catch (error) {
       console.error('Toggle active error:', error);
       toast.error(error.response?.data?.message || 'Failed to update user status');
     }
   };

   const openTargetModal = (user) => {
     setTargetUser(user);
     setTargetForm({
       monthlyTargetDeals: user.monthlyTargetDeals || 0,
       monthlyTargetAmount: user.monthlyTargetAmount || 0,
       monthlyTargetClients: user.monthlyTargetClients || 0
     });
     setShowTargetModal(true);
   };

   const handleSetTarget = async (e) => {
     e.preventDefault();
     
     // Validate form
     const errors = {};
     if (targetForm.monthlyTargetDeals < 0) errors.monthlyTargetDeals = 'Target must be positive';
     if (targetForm.monthlyTargetAmount < 0) errors.monthlyTargetAmount = 'Target must be positive';
     if (targetForm.monthlyTargetClients < 0) errors.monthlyTargetClients = 'Target must be positive';
     
     if (Object.keys(errors).length > 0) {
       setTargetErrors(errors);
       return;
     }
     
     setFormLoading(true);
     try {
       await usersAPI.setTargets(targetUser._id, targetForm);
       toast.success('Targets set successfully');
       setShowTargetModal(false);
       setTargetErrors({});
       setTargetForm({ monthlyTargetDeals: 0, monthlyTargetAmount: 0, monthlyTargetClients: 0 });
       loadUsers();
     } catch (error) {
       console.error('Set target error:', error);
       toast.error(error.response?.data?.message || 'Failed to set targets');
     } finally {
       setFormLoading(false);
     }
   };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      const payload = {
        name: editUser.name,
        phone: editUser.phone,
        isActive: editUser.isActive,
        status: editUser.status,
        customRole: editUser.customRole || null,
        department: editUser.department === 'Others' ? (editUser.customDepartment || editUser.department) : editUser.department,
        region: editUser.region || ''
      };
      await usersAPI.update(editUser._id, payload);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setEditUser(null);
      loadUsers();
    } catch (error) {
      console.error('Update user error:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      // Search filter
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm));
      
      // Role filter
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      
      // Status filter
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'active' && user.isActive !== false) ||
        (selectedStatus === 'inactive' && user.isActive === false) ||
        (selectedStatus === 'pending' && user.isFirstLogin);

      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '');
      } else if (sortBy === 'role') {
        comparison = (a.role || '').localeCompare(b.role || '');
      } else if (sortBy === 'date') {
        comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getAccountStatus = (targetUser) => {
    if (targetUser?.isActive === false) {
      return { 
        label: 'Inactive', 
        className: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle,
        color: 'text-red-500'
      };
    }
    if (targetUser?.role === 'agent' && targetUser?.isFirstLogin) {
      return { 
        label: 'Pending', 
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Clock,
        color: 'text-yellow-500'
      };
    }
    return { 
      label: 'Active', 
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
      color: 'text-emerald-500'
    };
  };

  const openDetails = (targetUser) => {
    setDetailsUser(targetUser);
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setShowDetailsModal(false);
    setDetailsUser(null);
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const getRoleMeta = (role) => {
    const roles = {
      superadmin: { label: 'Super Admin', badge: 'bg-red-100 text-red-700', iconBg: 'bg-red-100', icon: Shield, iconColor: 'text-red-600' },
      manager: { label: 'Manager', badge: 'bg-blue-100 text-blue-700', iconBg: 'bg-blue-100', icon: Shield, iconColor: 'text-blue-600' },
      admin: { label: 'Administrator', badge: 'bg-purple-100 text-purple-700', iconBg: 'bg-purple-100', icon: Shield, iconColor: 'text-purple-600' },
      agent: { label: 'Sales Agent', badge: 'bg-primary-100 text-primary-700', iconBg: 'bg-primary-100', icon: User, iconColor: 'text-primary-600' }
    };
    return roles[role] || roles.agent;
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'manager').length,
    agents: users.filter(u => u.role === 'agent').length,
    pending: users.filter(u => u.isFirstLogin).length,
    active: users.filter(u => u.isActive !== false).length,
    inactive: users.filter(u => u.isActive === false).length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-lg text-gray-800 dark:text-gray-200 font-medium">Loading users...</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadUsers}
                disabled={loading}
                className="modern-card glass-effect text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-primary-500/10 transition-all shadow-sm border border-gray-200/50 dark:border-white/10 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </motion.button>

              {(user?.role === 'admin' || isSuperAdmin) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setNewUser({ name: '', email: '', phone: '', role: isSuperAdmin ? 'manager' : 'agent' });
                    setShowAddModal(true);
                  }}
                  className="btn-brand text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 hover:opacity-90 transition-all shadow-lg shadow-primary-500/25 font-semibold"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>{isSuperAdmin ? 'Register Platform Role' : 'Add New Agent'}</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="modern-card glass-effect rounded-xl shadow-md p-6 border border-white/10 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
<div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                         <Users className="w-6 h-6 text-primary-600" />
                       </div>
            </div>
          </motion.div>

          {isSuperAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Managers</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.managers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="modern-card glass-effect rounded-xl shadow-md p-6 border border-white/10 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="modern-card glass-effect rounded-xl shadow-md p-6 border border-white/10 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="modern-card glass-effect rounded-xl shadow-md p-6 border border-white/10 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="modern-card glass-effect rounded-xl shadow-md p-6 border border-white/10 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="modern-card glass-effect rounded-xl shadow-md border border-white/10 p-6 mb-6"
>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
className={`px-4 py-3 rounded-xl flex items-center space-x-2 transition-all ${
                           showFilters 
                             ? 'bg-primary-50 text-primary-600 border-primary-200' 
                             : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                         } border`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <button className="px-4 py-3 bg-gray-50 text-gray-600 rounded-xl flex items-center space-x-2 hover:bg-gray-100 transition-all border border-gray-200" onClick={handleExportCSV}>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 mt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="superadmin">Super Admin</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="agent">Agent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="role">Role</option>
                      <option value="date">Join Date</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Users Grid/Table */}
        <div className="modern-card glass-effect rounded-xl shadow-md border border-white/10 overflow-hidden">
          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role & Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((userItem, index) => {
                    const StatusIcon = getAccountStatus(userItem).icon;
                    const statusColor = getAccountStatus(userItem).color;
                    const roleMeta = getRoleMeta(userItem.role);
                    const RoleIcon = roleMeta.icon;
                    
                    return (
                      <motion.tr
                        key={userItem._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => openDetails(userItem)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${roleMeta.iconBg}`}>
                              <RoleIcon className={`w-5 h-5 ${roleMeta.iconColor}`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{userItem.name}</p>
                              <p className="text-sm text-gray-500">ID: {userItem._id.slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              {userItem.email}
                            </p>
                            {userItem.phone && (
                              <p className="text-sm text-gray-600 flex items-center">
                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                {userItem.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleMeta.badge}`}>
                              {roleMeta.label}
                            </span>
                            <div className="flex items-center space-x-1">
                              <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                              <span className={`text-xs font-medium ${statusColor}`}>
                                {getAccountStatus(userItem).label}
                              </span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Sales</span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(userItem.totalSalesAmount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Deals</span>
                              <span className="text-sm font-medium text-gray-900">
                                {userItem.totalDeals || 0}
                              </span>
                            </div>
                            {userItem.performanceScore && (
                              <div className="flex items-center space-x-1">
                                <Award className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs font-medium text-gray-700">
                                  Score: {userItem.performanceScore}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            <p>{formatDateTime(userItem.createdAt)}</p>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
{userItem.role === 'agent' && userItem.isFirstLogin && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResendOTP(userItem._id, userItem.name);
                                    }}
                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Resend OTP"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </motion.button>
                                )}
                                
                                {userItem.role === 'agent' && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTargetModal(userItem);
                                    }}
                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Set Targets"
                                  >
                                    <TrendingUp className="w-4 h-4" />
                                  </motion.button>
                                )}
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(userItem);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeactivateModal(userItem);
                              }}
                              className={`p-2 rounded-lg transition-all ${
                                userItem.isActive === false
                                  ? 'text-emerald-400 hover:text-emerald-500 hover:bg-emerald-50'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                              title={userItem.isActive === false ? 'Activate User' : 'Deactivate User'}
                            >
                              <UserX className="w-4 h-4" />
                            </motion.button>
                            
                            {/* Superadmin can delete anyone except other superadmins. Admins can only delete agents. */}
                            {(
                              user.role === 'superadmin'
                                ? userItem.role !== 'superadmin'
                                : userItem.role === 'agent'
                            ) && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(userItem._id, userItem.name);
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No users found' : 'No users yet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Get started by registering your first agent to manage your team.'
                }
              </p>
              {!searchTerm && (user?.role === 'admin' || isSuperAdmin) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setNewUser({ name: '', email: '', phone: '', role: isSuperAdmin ? 'manager' : 'agent' });
                    setShowAddModal(true);
                  }}
                  className="btn-brand text-white px-6 py-3 rounded-xl inline-flex items-center space-x-2 hover:opacity-90 shadow-lg shadow-primary-500/25"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>{isSuperAdmin ? 'Register First Platform Role' : 'Register First Agent'}</span>
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredUsers.length}</span> of{' '}
              <span className="font-medium">{users.length}</span> users
            </p>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all">
                Previous
              </button>
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-all">
                1
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal - Enhanced */}
      <AnimatePresence>
        {showDetailsModal && detailsUser && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={closeDetails}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
<div className="px-6 py-5 brand-header flex items-start justify-between">
                 <div className="flex items-center space-x-4">
                   <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                     {React.createElement(getRoleMeta(detailsUser.role).icon, { className: 'w-8 h-8 text-white' })}
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-white">{detailsUser.name}</h3>
                     <p className="text-primary-100">{detailsUser.email}</p>
                   </div>
                 </div>
                <button
                  onClick={closeDetails}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Basic Info */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-50 rounded-xl p-5">
<h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                         <User className="w-4 h-4 mr-2 text-primary-500" />
                         Personal Information
                       </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Phone</p>
                          <p className="text-sm text-gray-900">{detailsUser.phone || 'Not provided'}</p>
                        </div>
                        <div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Role</p>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleMeta(detailsUser.role).badge}`}>
                            {getRoleMeta(detailsUser.role).label}
                          </span>
                        </div>
                        {detailsUser.department && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Department</p>
                            <p className="text-sm text-gray-900">{detailsUser.department}</p>
                          </div>
                        )}
                        {detailsUser.region && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Region</p>
                            <p className="text-sm text-gray-900">{detailsUser.region}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5">
<h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                         <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                         Account Timeline
                       </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Joined</p>
                          <p className="text-sm text-gray-900">{formatDateTime(detailsUser.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                          <p className="text-sm text-gray-900">{formatDateTime(detailsUser.updatedAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">First Login</p>
                          <p className="text-sm text-gray-900">{detailsUser.isFirstLogin ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Performance Metrics */}
                  <div className="lg:col-span-2 space-y-6">
<div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-5">
                       <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                         <TrendingUp className="w-4 h-4 mr-2 text-primary-500" />
                         Performance Overview
                       </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
<div className="bg-white rounded-lg p-4 text-center">
                           <p className="text-2xl font-bold text-primary-600">{detailsUser.performanceScore || 0}</p>
                           <p className="text-xs text-gray-500 mt-1">Performance Score</p>
                         </div>
                         <div className="bg-white rounded-lg p-4 text-center">
                           <p className="text-2xl font-bold text-primary-600">{detailsUser.agentRank || 0}</p>
                           <p className="text-xs text-gray-500 mt-1">Agent Rank</p>
                         </div>
                         <div className="bg-white rounded-lg p-4 text-center">
                           <p className="text-2xl font-bold text-primary-600">{detailsUser.totalDeals || 0}</p>
                           <p className="text-xs text-gray-500 mt-1">Total Deals</p>
                         </div>
                         <div className="bg-white rounded-lg p-4 text-center">
                           <p className="text-2xl font-bold text-primary-600">{detailsUser.successfulDeals || 0}</p>
                           <p className="text-xs text-gray-500 mt-1">Successful</p>
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-900 mb-4">Sales Statistics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Total Sales Amount</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(detailsUser.totalSalesAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Monthly Sales</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {detailsUser.monthlySales || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Monthly Sales Amount</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(detailsUser.monthlySalesAmount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-5">
                        <h4 className="font-semibold text-gray-900 mb-4">Deal Statistics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Successful Deals</span>
                            <span className="text-sm font-semibold text-emerald-600">
                              {detailsUser.successfulDeals || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Failed Deals</span>
                            <span className="text-sm font-semibold text-red-600">
                              {detailsUser.failedDeals || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-600">Success Rate</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {detailsUser.totalDeals 
                                ? Math.round((detailsUser.successfulDeals || 0) / detailsUser.totalDeals * 100)
                                : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User Modal - Enhanced */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-4 brand-header">
                <h3 className="text-lg font-semibold text-white">
                  {isSuperAdmin ? 'Register Platform Role' : 'Register New Agent'}
                </h3>
                <p className="text-primary-100 text-sm mt-1">
                  {isSuperAdmin
                    ? 'Create a platform admin or manager account. This does not onboard a company.'
                    : 'Add a new team member to the system'}
                </p>
              </div>
              
              <form onSubmit={handleAddUser} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                       formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                     }`}
                    placeholder="Enter agent's full name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.name}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                      formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="agent@company.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {isSuperAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    >
                      <option value="manager">Manager</option>
                      <option value="admin">Platform Admin</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Use Tenant Management to create company admins during company onboarding.
                    </p>
                  </div>
                )}
                
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Base Role
                   </label>
                   <select
                     value={newUser.role}
                     onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                     className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all border-gray-200"
                   >
                     <option value="admin">Administrator</option>
                     <option value="manager">Manager</option>
                     <option value="agent">Sales Agent</option>
                   </select>
                   {formErrors.role && (
                     <p className="text-red-500 text-sm mt-1 flex items-center">
                       <AlertCircle className="w-4 h-4 mr-1" />
                       {formErrors.role}
                     </p>
                   )}
                 </div>

                 {!isSuperAdmin && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Custom Role (Permissions)
                     </label>
                     <select
                       value={newUser.customRole || ''}
                       onChange={(e) => setNewUser({ ...newUser, customRole: e.target.value })}
                       className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all border-gray-200"
                     >
                       <option value="">Default Permissions</option>
                       {customRoles.map(role => (
                         <option key={role._id} value={role._id}>{role.name}</option>
                       ))}
                     </select>
                   </div>
                 )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value, customDepartment: e.target.value === 'Others' ? newUser.customDepartment : '' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="">Select Department</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="IT">IT</option>
                    <option value="Others">Others</option>
                  </select>
                  {newUser.department === 'Others' && (
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all mt-2"
                      placeholder="Enter department name"
                      value={newUser.customDepartment}
                      onChange={(e) => setNewUser({ ...newUser, customDepartment: e.target.value })}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <select
                    value={newUser.region}
                    onChange={(e) => setNewUser({ ...newUser, region: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="">Select Region</option>
                    <option value="Central">Central</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="North East">North East</option>
                    <option value="North West">North West</option>
                    <option value="South East">South East</option>
                    <option value="South West">South West</option>
                    <option value="International">International</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormErrors({});
                    }}
                    className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 btn-brand text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Registering...</span>
                      </div>
                    ) : (
                      isSuperAdmin ? 'Register Role' : 'Register Agent'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center">Agent Registered Successfully</h3>
              <p className="mt-2 text-sm text-gray-600 text-center">
                {successInfo.name} ({successInfo.email}) has been added to the system.
              </p>
              
              {successInfo.emailSent ? (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-emerald-700 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    A welcome email with OTP has been sent to the agent.
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-yellow-50 rounded-xl">
                  <p className="text-sm text-yellow-700 mb-2">Email delivery failed. Please share this OTP manually:</p>
                  {successInfo.otp && (
                    <div className="bg-white p-3 rounded-lg text-center">
                      <code className="text-lg font-mono font-bold text-gray-900">{successInfo.otp}</code>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-6">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-3 btn-brand text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary-500/25"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal - Enhanced */}
      <AnimatePresence>
        {showEditModal && editUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-4 brand-header">
                <h3 className="text-lg font-semibold text-white">Edit User</h3>
                <p className="text-blue-100 text-sm mt-1">Update user information</p>
              </div>
              
              <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    value={editUser.name}
                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    value={editUser.phone || ''}
                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      value={editUser.department}
                      onChange={(e) => setEditUser({ ...editUser, department: e.target.value, customDepartment: e.target.value === 'Others' ? editUser.customDepartment : '' })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select Department</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="IT">IT</option>
                      <option value="Others">Others</option>
                    </select>
                    {editUser.department === 'Others' && (
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all mt-2"
                        placeholder="Enter department name"
                        value={editUser.customDepartment || ''}
                        onChange={(e) => setEditUser({ ...editUser, customDepartment: e.target.value })}
                      />
                    )}
                  </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                   <select
                     value={editUser.region || ''}
                     onChange={(e) => setEditUser({ ...editUser, region: e.target.value })}
                     className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                   >
                     <option value="">Select Region</option>
                     <option value="Central">Central</option>
                     <option value="East">East</option>
                     <option value="West">West</option>
                     <option value="North">North</option>
                     <option value="South">South</option>
                     <option value="North East">North East</option>
                     <option value="North West">North West</option>
                     <option value="South East">South East</option>
                     <option value="South West">South West</option>
                     <option value="International">International</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Base Role
                   </label>
                   <select
                     value={editUser.role}
                     onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                     className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                   >
                     <option value="admin">Administrator</option>
                     <option value="manager">Manager</option>
                     <option value="agent">Sales Agent</option>
                   </select>
                 </div>

                 {!isSuperAdmin && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Custom Role (Permissions)
                     </label>
                     <select
                       value={editUser.customRole || ''}
                       onChange={(e) => setEditUser({ ...editUser, customRole: e.target.value })}
                       className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                     >
                       <option value="">Default Permissions</option>
                       {customRoles.map(role => (
                         <option key={role._id} value={role._id}>{role.name}</option>
                       ))}
                     </select>
                   </div>
                 )}
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editUser.isActive !== false}
                      onChange={(e) => setEditUser({ ...editUser, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  
                  <div>
                    <select
                      value={editUser.status || 'offline'}
                      onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="offline">Offline</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setEditUser(null); }}
                    className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 btn-brand text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/25"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deactivate/Activate Confirmation Modal */}
      <AnimatePresence>
        {showDeactivateModal && deactivateTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className={`w-16 h-16 ${deactivateTarget.isActive === false ? 'bg-emerald-100' : 'bg-red-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                {deactivateTarget.isActive === false ? (
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                ) : (
                  <UserX className="w-8 h-8 text-red-600" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                {deactivateTarget.isActive === false ? 'Activate User' : 'Deactivate User'}
              </h3>
              
              <p className="mt-2 text-sm text-gray-600 text-center">
                Are you sure you want to {deactivateTarget.isActive === false ? 'activate' : 'deactivate'} <strong>{deactivateTarget.name}</strong>?
              </p>
              
              <p className="mt-3 text-sm text-gray-500 text-center">
                {deactivateTarget.isActive === false 
                  ? 'Activating will allow this agent to access the system again.'
                  : 'Deactivating will immediately prevent this agent from logging in.'}
              </p>
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => { setShowDeactivateModal(false); setDeactivateTarget(null); }}
                  className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleActive}
                  className={`flex-1 py-3 px-4 rounded-xl text-white transition-all shadow-lg ${
                    deactivateTarget.isActive === false 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25' 
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25'
                  }`}
                >
                  {deactivateTarget.isActive === false ? 'Activate' : 'Deactivate'}
                </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Target Setting Modal */}
       <AnimatePresence>
         {showTargetModal && targetUser && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
             <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
             >
<div className="px-6 py-4 brand-header">
                  <h3 className="text-lg font-semibold text-white">Set Targets for {targetUser.name}</h3>
                  <p className="text-primary-100 text-sm mt-1">Define monthly performance goals</p>
                </div>
               
               <form onSubmit={handleSetTarget} className="p-6 space-y-5">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Monthly Target Deals
                   </label>
                   <input
                     type="number"
                     value={targetForm.monthlyTargetDeals}
                     onChange={(e) => setTargetForm({ ...targetForm, monthlyTargetDeals: parseInt(e.target.value) || 0 })}
                     className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                       targetErrors.monthlyTargetDeals ? 'border-red-300 bg-red-50' : 'border-gray-200'
                     }`}
                     placeholder="Enter target number of deals"
                   />
                   {targetErrors.monthlyTargetDeals && (
                     <p className="text-red-500 text-sm mt-1 flex items-center">
                       <AlertCircle className="w-4 h-4 mr-1" />
                       {targetErrors.monthlyTargetDeals}
                     </p>
                   )}
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Monthly Target Amount (UGX)
                   </label>
                   <input
                     type="number"
                     value={targetForm.monthlyTargetAmount}
                     onChange={(e) => setTargetForm({ ...targetForm, monthlyTargetAmount: parseInt(e.target.value) || 0 })}
                     className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                       targetErrors.monthlyTargetAmount ? 'border-red-300 bg-red-50' : 'border-gray-200'
                     }`}
                     placeholder="Enter target sales amount"
                   />
                   {targetErrors.monthlyTargetAmount && (
                     <p className="text-red-500 text-sm mt-1 flex items-center">
                       <AlertCircle className="w-4 h-4 mr-1" />
                       {targetErrors.monthlyTargetAmount}
                     </p>
                   )}
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Monthly Target Clients
                   </label>
                   <input
                     type="number"
                     value={targetForm.monthlyTargetClients}
                     onChange={(e) => setTargetForm({ ...targetForm, monthlyTargetClients: parseInt(e.target.value) || 0 })}
                     className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                       targetErrors.monthlyTargetClients ? 'border-red-300 bg-red-50' : 'border-gray-200'
                     }`}
                     placeholder="Enter target number of clients"
                   />
                   {targetErrors.monthlyTargetClients && (
                     <p className="text-red-500 text-sm mt-1 flex items-center">
                       <AlertCircle className="w-4 h-4 mr-1" />
                       {targetErrors.monthlyTargetClients}
                     </p>
                   )}
                 </div>
                 
                 <div className="flex space-x-3 pt-4">
                   <button
                     type="button"
                     onClick={() => {
                       setShowTargetModal(false);
                       setTargetErrors({});
                       setTargetForm({ monthlyTargetDeals: 0, monthlyTargetAmount: 0, monthlyTargetClients: 0 });
                     }}
                     className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     className="flex-1 py-3 px-4 btn-brand text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25"
                   >
                     {formLoading ? (
                       <div className="flex items-center justify-center space-x-2">
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         <span>Setting Targets...</span>
                       </div>
                     ) : (
                       'Set Targets'
                     )}
                   </button>
                 </div>
               </form>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
     </div>
   );
 };

export default UserManagement;
