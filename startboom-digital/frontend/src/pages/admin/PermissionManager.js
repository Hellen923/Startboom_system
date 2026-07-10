// Permission Manager - Configure role-based permissions
import React, { useState, useEffect } from 'react';
import { Shield, Save, RefreshCw, Lock, Unlock, Eye, Edit, Trash2, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import PROFESSIONAL_COLORS from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PermissionManager = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState('manager');
  const [hasChanges, setHasChanges] = useState(false);

  // All available modules
  const modules = [
    { id: 'clients', label: 'Clients & Organizations', description: 'Customer relationship management' },
    { id: 'deals', label: 'Deals & Pipeline', description: 'Sales pipeline and deal tracking' },
    { id: 'sales', label: 'Sales Records', description: 'Completed sales and revenue' },
    { id: 'products', label: 'Products & Services', description: 'Product catalog management' },
    { id: 'territories', label: 'Territories', description: 'Geographic territory management' },
    { id: 'meetings', label: 'Meetings & Calendar', description: 'Meeting and event scheduling' },
    { id: 'analytics', label: 'Analytics & Reports', description: 'Business intelligence and reporting' },
    { id: 'users', label: 'User Management', description: 'Manage users and roles' },
    { id: 'settings', label: 'System Settings', description: 'Platform configuration' },
    { id: 'finance', label: 'Financial Data', description: 'Invoices, payments, accounting' },
    { id: 'departments', label: 'Departments & Teams', description: 'Organizational structure' },
    { id: 'branches', label: 'Branch Locations', description: 'Multi-location management' },
    { id: 'goals', label: 'Goals & Targets', description: 'Performance goals tracking' },
    { id: 'activities', label: 'Activities', description: 'Activity logging and tracking' },
    { id: 'workflows', label: 'Workflow Automation', description: 'Business process automation' },
    { id: 'forecasts', label: 'Revenue Forecasts', description: 'Pipeline forecasting' },
    { id: 'pipelines', label: 'Pipeline Builder', description: 'Custom pipeline configuration' },
    { id: 'custom_fields', label: 'Custom Fields', description: 'Field customization' },
    { id: 'reports', label: 'Custom Reports', description: 'Report builder and execution' }
  ];

  // Available roles
  const roles = [
    { id: 'manager', label: 'Manager', description: 'Department or team manager' },
    { id: 'agent', label: 'Sales Agent', description: 'Field sales representative' },
    { id: 'finance_staff', label: 'Finance', description: 'Finance department staff' },
    { id: 'hr_staff', label: 'HR', description: 'Human resources staff' },
    { id: 'support_staff', label: 'Support', description: 'Customer support staff' }
  ];

  // Scope levels
  const scopeLevels = [
    { id: 'viewOwn', label: 'Own', description: 'Only their own records' },
    { id: 'viewTeam', label: 'Team', description: 'Their team records' },
    { id: 'viewDepartment', label: 'Department', description: 'Their department records' },
    { id: 'viewBranch', label: 'Branch', description: 'Their branch records' },
    { id: 'viewAll', label: 'All', description: 'Company-wide records' }
  ];

  useEffect(() => {
    fetchPermissions();
  }, [selectedRole]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/permissions?role=${selectedRole}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPermissions(response.data.permissions || []);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const getPermissionForModule = (moduleId) => {
    return permissions.find(p => p.module === moduleId) || {
      module: moduleId,
      role: selectedRole,
      actions: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
        import: false,
        viewOwn: true,
        viewTeam: false,
        viewDepartment: false,
        viewBranch: false,
        viewAll: false,
        approve: false,
        assignOwnership: false
      }
    };
  };

  const updatePermission = (moduleId, actionKey, value) => {
    setHasChanges(true);
    const existingIndex = permissions.findIndex(p => p.module === moduleId);

    if (existingIndex >= 0) {
      const updated = [...permissions];
      updated[existingIndex] = {
        ...updated[existingIndex],
        actions: {
          ...updated[existingIndex].actions,
          [actionKey]: value
        }
      };
      setPermissions(updated);
    } else {
      const newPermission = getPermissionForModule(moduleId);
      newPermission.actions[actionKey] = value;
      setPermissions([...permissions, newPermission]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Save all permissions for this role
      await axios.post(`${API_URL}/permissions/bulk`, {
        role: selectedRole,
        permissions: permissions.map(p => ({
          module: p.module,
          role: selectedRole,
          actions: p.actions
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Permissions saved successfully');
      setHasChanges(false);
      fetchPermissions();
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Permission Manager
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure role-based access control and data visibility
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="flex items-center space-x-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Unsaved Changes</span>
            </span>
          )}
          <button
            onClick={fetchPermissions}
            disabled={saving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${isDark ? 'bg-[#1E293B]' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-300'} hover:shadow transition`}
          >
            <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
              hasChanges && !saving
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-5 h-5" />
            <span className="font-semibold">{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Role Selector */}
      <div className={`rounded-xl p-6 mb-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Select Role to Configure
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`p-4 rounded-lg text-left transition ${
                selectedRole === role.id
                  ? 'bg-indigo-600 text-white'
                  : isDark ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">{role.label}</span>
              </div>
              <p className={`text-sm ${selectedRole === role.id ? 'text-indigo-100' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {role.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Grid */}
      <div className={`rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-[#334155]' : 'bg-gray-50'}>
              <tr>
                <th className="px-6 py-4 text-left">
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Module</span>
                </th>
                <th className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <Eye className="w-4 h-4 mb-1" />
                    <span className="text-xs">View</span>
                  </div>
                </th>
                <th className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <Edit className="w-4 h-4 mb-1" />
                    <span className="text-xs">Create</span>
                  </div>
                </th>
                <th className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <Edit className="w-4 h-4 mb-1" />
                    <span className="text-xs">Edit</span>
                  </div>
                </th>
                <th className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <Trash2 className="w-4 h-4 mb-1" />
                    <span className="text-xs">Delete</span>
                  </div>
                </th>
                <th className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <Download className="w-4 h-4 mb-1" />
                    <span className="text-xs">Export</span>
                  </div>
                </th>
                <th className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold">Scope</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {modules.map((module, index) => {
                const perm = getPermissionForModule(module.id);
                const selectedScope = scopeLevels.find(s => perm.actions[s.id]);

                return (
                  <tr 
                    key={module.id}
                    className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} ${
                      index % 2 === 0 ? (isDark ? 'bg-[#1E293B]' : 'bg-white') : (isDark ? 'bg-[#0F172A]' : 'bg-gray-50')
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {module.label}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {module.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={perm.actions.view || false}
                        onChange={(e) => updatePermission(module.id, 'view', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={perm.actions.create || false}
                        onChange={(e) => updatePermission(module.id, 'create', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={perm.actions.edit || false}
                        onChange={(e) => updatePermission(module.id, 'edit', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={perm.actions.delete || false}
                        onChange={(e) => updatePermission(module.id, 'delete', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={perm.actions.export || false}
                        onChange={(e) => updatePermission(module.id, 'export', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={scopeLevels.findIndex(s => perm.actions[s.id])}
                        onChange={(e) => {
                          const level = scopeLevels[e.target.value];
                          scopeLevels.forEach(s => updatePermission(module.id, s.id, false));
                          updatePermission(module.id, level.id, true);
                        }}
                        className={`px-3 py-1 rounded text-sm ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                      >
                        {scopeLevels.map((level, idx) => (
                          <option key={level.id} value={idx}>{level.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className={`mt-6 p-6 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
        <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Scope Levels Explained
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {scopeLevels.map(level => (
            <div key={level.id} className={`p-3 rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-gray-50'}`}>
              <p className={`font-medium text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {level.label}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {level.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;
