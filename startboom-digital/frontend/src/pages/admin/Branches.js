// Branches Management - Multi-location organizational structure
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Users,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Globe,
  Clock,
  Phone,
  Mail,
  DollarSign,
  Briefcase,
  Map
} from 'lucide-react';
import { branchApi } from '../../services/enterpriseApi';
import PROFESSIONAL_COLORS from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Branches = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [treeView, setTreeView] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await branchApi.getAll();
      setBranches(response.data.branches || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranch = async (branchData) => {
    try {
      if (editingBranch) {
        await branchApi.update(editingBranch._id, branchData);
        toast.success('Branch updated successfully');
      } else {
        await branchApi.create(branchData);
        toast.success('Branch created successfully');
      }
      setShowModal(false);
      setEditingBranch(null);
      fetchBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      toast.error('Failed to save branch');
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Are you sure? This will affect all users and data in this branch.')) return;
    
    try {
      await branchApi.delete(id);
      toast.success('Branch deleted');
      fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error('Failed to delete branch');
    }
  };

  const toggleNode = (branchId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(branchId)) {
      newExpanded.delete(branchId);
    } else {
      newExpanded.add(branchId);
    }
    setExpandedNodes(newExpanded);
  };

  const calculateTotalStats = () => {
    return {
      totalBranches: branches.length,
      totalUsers: branches.reduce((sum, b) => sum + (b.stats?.totalUsers || 0), 0),
      totalClients: branches.reduce((sum, b) => sum + (b.stats?.totalClients || 0), 0),
      totalRevenue: branches.reduce((sum, b) => sum + (b.stats?.totalRevenue || 0), 0)
    };
  };


  const buildTree = (parentId = null) => {
    return branches
      .filter(b => (b.parentBranch?._id || b.parentBranch) === parentId)
      .map(branch => ({
        ...branch,
        children: buildTree(branch._id)
      }));
  };

  const stats = calculateTotalStats();

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Branch Management
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage locations and organizational structure across your business
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setTreeView(!treeView)}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#1E293B]' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
          >
            {treeView ? 'Grid View' : 'Tree View'}
          </button>
          <button
            onClick={() => {
              setEditingBranch(null);
              setShowModal(true);
            }}
            className="btn-brand flex items-center space-x-2 px-6 py-3 rounded-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">New Branch</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Branches"
          value={stats.totalBranches}
          icon={Building2}
          gradient={PROFESSIONAL_COLORS.gradients.blue}
          isDark={isDark}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          gradient={PROFESSIONAL_COLORS.gradients.green}
          isDark={isDark}
        />
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={Briefcase}
          gradient={PROFESSIONAL_COLORS.gradients.teal}
          isDark={isDark}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          gradient={PROFESSIONAL_COLORS.gradients.orange}
          isDark={isDark}
        />
      </div>

      {/* Branch Content */}
      {treeView ? (
        <TreeView
          branches={buildTree()}
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
          isDark={isDark}
          onEdit={(branch) => {
            setEditingBranch(branch);
            setShowModal(true);
          }}
          onDelete={handleDeleteBranch}
          onSelect={setSelectedBranch}
        />
      ) : (
        <GridView
          branches={branches}
          isDark={isDark}
          onEdit={(branch) => {
            setEditingBranch(branch);
            setShowModal(true);
          }}
          onDelete={handleDeleteBranch}
        />
      )}

      {/* Modal */}
      {showModal && (
        <BranchModal
          branch={editingBranch}
          branches={branches}
          isDark={isDark}
          onSave={handleSaveBranch}
          onClose={() => {
            setShowModal(false);
            setEditingBranch(null);
          }}
        />
      )}
    </div>
  );
};


// Stat Card Component
const StatCard = ({ title, value, icon: Icon, gradient, isDark }) => (
  <div
    className="rounded-xl p-6"
    style={{
      background: isDark ? gradient : 'white',
      border: isDark ? 'none' : '1px solid #E5E7EB'
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
        <Icon className="w-5 h-5" style={{ color: isDark ? 'white' : PROFESSIONAL_COLORS.primary.main }} />
      </div>
    </div>
    <p className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{title}</p>
    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
  </div>
);

// Tree View Component
const TreeView = ({ branches, expandedNodes, toggleNode, isDark, onEdit, onDelete, onSelect }) => (
  <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
    <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      Branch Hierarchy
    </h2>
    <div className="space-y-2">
      {branches.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No branches yet</p>
        </div>
      ) : (
        branches.map(branch => (
          <TreeNode
            key={branch._id}
            branch={branch}
            level={0}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
            isDark={isDark}
            onEdit={onEdit}
            onDelete={onDelete}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  </div>
);


// Tree Node Component
const TreeNode = ({ branch, level, expandedNodes, toggleNode, isDark, onEdit, onDelete, onSelect }) => {
  const hasChildren = branch.children && branch.children.length > 0;
  const isExpanded = expandedNodes.has(branch._id);

  return (
    <div>
      <div
        className={`
          p-4 rounded-lg flex items-center justify-between
          ${isDark ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-50 hover:bg-gray-100'}
          transition-colors cursor-pointer
        `}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={() => onSelect(branch)}
      >
        <div className="flex items-center space-x-3 flex-1">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(branch._id);
              }}
              className="focus:outline-none"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
          
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${PROFESSIONAL_COLORS.primary.main}20` }}
          >
            <Building2 className="w-5 h-5" style={{ color: PROFESSIONAL_COLORS.primary.main }} />
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {branch.name}
              </h3>
              {branch.code && (
                <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
                  {branch.code}
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded capitalize ${
                branch.type === 'headquarters' ? 'bg-amber-100 text-amber-800' :
                branch.type === 'regional_office' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-800'
              }`}>
                {branch.type?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs mt-1">
              {branch.address?.city && (
                <span className={`flex items-center space-x-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <MapPin className="w-3 h-3" />
                  <span>{branch.address.city}</span>
                </span>
              )}
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {branch.stats?.totalUsers || 0} users
              </span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                ${(branch.stats?.totalRevenue || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(branch);
            }}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(branch._id);
            }}
            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-2">
          {branch.children.map(child => (
            <TreeNode
              key={child._id}
              branch={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              isDark={isDark}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};


// Grid View Component
const GridView = ({ branches, isDark, onEdit, onDelete }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    {branches.length === 0 ? (
      <div className={`col-span-full text-center py-12 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          No Branches Yet
        </h3>
        <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Create your first branch to start organizing locations
        </p>
      </div>
    ) : (
      branches.map(branch => (
        <div
          key={branch._id}
          className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${PROFESSIONAL_COLORS.primary.main}20` }}
              >
                <Building2 className="w-6 h-6" style={{ color: PROFESSIONAL_COLORS.primary.main }} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {branch.name}
                </h3>
                {branch.code && (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Code: {branch.code}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(branch)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(branch._id)}
                className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Type Badge */}
          <div className="mb-4">
            <span className={`text-xs px-3 py-1 rounded-full capitalize ${
              branch.type === 'headquarters' ? 'bg-amber-100 text-amber-800' :
              branch.type === 'regional_office' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-800'
            }`}>
              {branch.type?.replace('_', ' ')}
            </span>
          </div>

          {/* Location */}
          {branch.address?.city && (
            <div className={`flex items-center space-x-2 mb-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <MapPin className="w-4 h-4" />
              <span>
                {[branch.address.city, branch.address.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Contact */}
          <div className="space-y-2 mb-4 text-sm">
            {branch.contact?.phone && (
              <div className={`flex items-center space-x-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Phone className="w-4 h-4" />
                <span>{branch.contact.phone}</span>
              </div>
            )}
            {branch.contact?.email && (
              <div className={`flex items-center space-x-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Mail className="w-4 h-4" />
                <span>{branch.contact.email}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t" style={{ borderColor: isDark ? '#334155' : '#E5E7EB' }}>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Users</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {branch.stats?.totalUsers || 0}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Clients</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {branch.stats?.totalClients || 0}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Revenue</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ${(branch.stats?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))
    )}
  </div>
);


// Branch Modal Component
const BranchModal = ({ branch, branches, isDark, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: branch?.name || '',
    code: branch?.code || '',
    description: branch?.description || '',
    type: branch?.type || 'branch',
    parentBranch: branch?.parentBranch?._id || branch?.parentBranch || '',
    address: {
      street: branch?.address?.street || '',
      city: branch?.address?.city || '',
      state: branch?.address?.state || '',
      country: branch?.address?.country || '',
      postalCode: branch?.address?.postalCode || ''
    },
    contact: {
      phone: branch?.contact?.phone || '',
      email: branch?.contact?.email || ''
    },
    timezone: branch?.timezone || 'Africa/Kampala',
    currency: branch?.currency || 'UGX'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`rounded-xl p-6 max-w-3xl w-full my-8 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} max-h-[90vh] overflow-y-auto`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {branch ? 'Edit Branch' : 'New Branch'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Branch Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                  placeholder="e.g., NYC, LON"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Branch Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                  required
                >
                  <option value="headquarters">Headquarters</option>
                  <option value="regional_office">Regional Office</option>
                  <option value="branch">Branch</option>
                  <option value="sales_office">Sales Office</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Parent Branch
                </label>
                <select
                  value={formData.parentBranch}
                  onChange={(e) => setFormData({ ...formData, parentBranch: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                >
                  <option value="">None (Top Level)</option>
                  {branches
                    .filter(b => b._id !== branch?._id)
                    .map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                  rows="2"
                />
              </div>
            </div>
          </div>


          {/* Address */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Address
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, street: e.target.value }
                  })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  City
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, city: e.target.value }
                  })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  State/Province
                </label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, state: e.target.value }
                  })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Country
                </label>
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, country: e.target.value }
                  })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.address.postalCode}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, postalCode: e.target.value }
                  })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
              </div>
            </div>
          </div>


          {/* Contact & Settings */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Contact & Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact.phone}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    contact: { ...formData.contact, phone: e.target.value }
                  })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    contact: { ...formData.contact, email: e.target.value }
                  })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Timezone
                </label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                  placeholder="e.g., America/New_York"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Currency
                </label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                  placeholder="e.g., USD, EUR"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-brand flex-1 px-4 py-2 rounded-lg"
            >
              Save Branch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Branches;
