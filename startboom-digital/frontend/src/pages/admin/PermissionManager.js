import React, { useState, useEffect } from 'react';
import { Shield, Save, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import dm from '../../utils/darkModeClasses';
import api from '../../services/api';
import { departmentApi } from '../../services/enterpriseApi';

const AVAILABLE_MODULES = [
  { id: 'clients', label: 'Clients', description: 'Manage client and organization records' },
  { id: 'deals', label: 'Deals', description: 'Manage sales pipeline and deals' },
  { id: 'sales', label: 'Sales', description: 'Record and manage sales transactions' },
  { id: 'products', label: 'Products', description: 'Manage product catalog' },
  { id: 'territories', label: 'Territories', description: 'Manage sales territories' },
  { id: 'meetings', label: 'Meetings', description: 'Schedule and manage meetings' },
  { id: 'analytics', label: 'Analytics', description: 'View analytics and metrics' },
  { id: 'reports', label: 'Reports', description: 'Generate and export reports' },
  { id: 'users', label: 'Users', description: 'Manage user accounts' },
  { id: 'settings', label: 'Settings', description: 'Configure system settings' }
];

const AVAILABLE_ROLES = [
  { value: 'agent', label: 'Agent (Sales Rep)' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' }
];

const DATA_SCOPES = [
  { value: 'own', label: 'Own Records Only', description: 'Can only see their own data' },
  { value: 'team', label: 'Team Records', description: 'Can see data from their team' },
  { value: 'department', label: 'Department Records', description: 'Can see data from their department' },
  { value: 'branch', label: 'Branch Records', description: 'Can see data from their branch' },
  { value: 'all', label: 'All Records', description: 'Can see all company data' }
];

const PermissionManager = () => {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedRole, setSelectedRole] = useState('agent');
  const [selectedDept, setSelectedDept] = useState('');
  const [editingModule, setEditingModule] = useState(null);
  const [modulePermissions, setModulePermissions] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadPermissionsForRole();
    }
  }, [selectedRole, selectedDept]);

  const loadData = async () => {
    try {
      setLoading(true);
      const deptRes = await departmentApi.getAll();
      setDepartments(deptRes.data.departments || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPermissionsForRole = async () => {
    try {
      const params = { role: selectedRole };
      if (selectedDept) params.department = selectedDept;
      
      const response = await api.get('/permissions', { params });
      const perms = response.data.permissions || [];
      
      // Convert array to map for easier access
      const permMap = {};
      perms.forEach(perm => {
        permMap[perm.module] = perm;
      });
      
      setModulePermissions(permMap);
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Don't show error - permissions might not exist yet
      setModulePermissions({});
    }
  };

  const handleSavePermission = async (moduleId, actions, scope) => {
    try {
      const permissionData = {
        role: selectedRole,
        department: selectedDept || null,
        module: moduleId,
        actions: {
          view: actions.view || false,
          create: actions.create || false,
          edit: actions.edit || false,
          delete: actions.delete || false,
          export: actions.export || false,
          viewAll: scope === 'all',
          viewBranch: scope === 'branch',
          viewDepartment: scope === 'department',
          viewTeam: scope === 'team',
          viewOwn: scope === 'own'
        }
      };

      await api.post('/permissions', permissionData);
      toast.success('Permission saved successfully');
      
      setEditingModule(null);
      loadPermissionsForRole();
    } catch (error) {
      console.error('Error saving permission:', error);
      toast.error(error.response?.data?.message || 'Failed to save permission');
    }
  };

  const handleDeletePermission = async (moduleId) => {
    if (!window.confirm(`Delete permission for ${moduleId}?`)) return;

    try {
      const perm = modulePermissions[moduleId];
      if (perm?._id) {
        await api.delete(`/permissions/${perm._id}`);
        toast.success('Permission deleted');
        loadPermissionsForRole();
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error('Failed to delete permission');
    }
  };

  const getDataScope = (actions) => {
    if (actions.viewAll) return 'all';
    if (actions.viewBranch) return 'branch';
    if (actions.viewDepartment) return 'department';
    if (actions.viewTeam) return 'team';
    if (actions.viewOwn) return 'own';
    return 'own';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${dm.textPrimary} flex items-center gap-2`}>
          <Shield className="w-7 h-7 text-primary-600" />
          Permission Manager
        </h1>
        <p className={`mt-1 ${dm.textSecondary}`}>
          Configure role-based access control and data visibility
        </p>
      </div>

      {/* Filters */}
      <div className={`${dm.card} rounded-xl p-6 mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${dm.textSecondary}`}>
              Select Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${dm.input}`}
            >
              {AVAILABLE_ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${dm.textSecondary}`}>
              Department (Optional)
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${dm.input}`}
            >
              <option value="">All Departments (Global)</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <p className={`text-xs mt-1 ${dm.textMuted}`}>
              Department-specific permissions override global permissions
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Table */}
      <div className={`${dm.card} rounded-xl shadow-sm overflow-hidden`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-xl font-semibold ${dm.textPrimary}`}>
            Module Permissions for {AVAILABLE_ROLES.find(r => r.value === selectedRole)?.label}
            {selectedDept && ` - ${departments.find(d => d._id === selectedDept)?.name}`}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Module
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  View
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Create
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Edit
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Delete
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Export
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data Scope
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {AVAILABLE_MODULES.map(module => {
                const perm = modulePermissions[module.id];
                const isEditing = editingModule === module.id;
                
                if (isEditing) {
                  return (
                    <PermissionEditRow
                      key={module.id}
                      module={module}
                      existingPermission={perm}
                      onSave={(actions, scope) => handleSavePermission(module.id, actions, scope)}
                      onCancel={() => setEditingModule(null)}
                    />
                  );
                }

                return (
                  <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className={`font-medium ${dm.textPrimary}`}>{module.label}</div>
                        <div className={`text-sm ${dm.textMuted}`}>{module.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {perm?.actions.view ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {perm?.actions.create ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {perm?.actions.edit ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {perm?.actions.delete ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {perm?.actions.export ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                    <td className="px-6 py-4">
                      {perm ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {DATA_SCOPES.find(s => s.value === getDataScope(perm.actions))?.label || 'Own'}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingModule(module.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg font-medium transition-colors"
                        >
                          {perm ? <Edit2 size={16} /> : <Plus size={16} />}
                          {perm ? 'Edit' : 'Add'}
                        </button>
                        {perm && (
                          <button
                            onClick={() => handleDeletePermission(module.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PermissionEditRow = ({ module, existingPermission, onSave, onCancel }) => {
  const [actions, setActions] = useState(existingPermission?.actions || {
    view: false,
    create: false,
    edit: false,
    delete: false,
    export: false
  });
  
  const [scope, setScope] = useState(() => {
    if (!existingPermission) return 'own';
    if (existingPermission.actions.viewAll) return 'all';
    if (existingPermission.actions.viewBranch) return 'branch';
    if (existingPermission.actions.viewDepartment) return 'department';
    if (existingPermission.actions.viewTeam) return 'team';
    return 'own';
  });

  const toggleAction = (action) => {
    setActions({ ...actions, [action]: !actions[action] });
  };

  return (
    <tr className="bg-blue-50 dark:bg-gray-700">
      <td className="px-6 py-4">
        <div>
          <div className={`font-medium ${dm.textPrimary}`}>{module.label}</div>
          <div className={`text-sm ${dm.textMuted}`}>{module.description}</div>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <input 
          type="checkbox" 
          checked={actions.view} 
          onChange={() => toggleAction('view')}
          className="w-5 h-5 text-primary-600 rounded cursor-pointer"
        />
      </td>
      <td className="px-6 py-4 text-center">
        <input 
          type="checkbox" 
          checked={actions.create} 
          onChange={() => toggleAction('create')}
          className="w-5 h-5 text-primary-600 rounded cursor-pointer"
        />
      </td>
      <td className="px-6 py-4 text-center">
        <input 
          type="checkbox" 
          checked={actions.edit} 
          onChange={() => toggleAction('edit')}
          className="w-5 h-5 text-primary-600 rounded cursor-pointer"
        />
      </td>
      <td className="px-6 py-4 text-center">
        <input 
          type="checkbox" 
          checked={actions.delete} 
          onChange={() => toggleAction('delete')}
          className="w-5 h-5 text-primary-600 rounded cursor-pointer"
        />
      </td>
      <td className="px-6 py-4 text-center">
        <input 
          type="checkbox" 
          checked={actions.export} 
          onChange={() => toggleAction('export')}
          className="w-5 h-5 text-primary-600 rounded cursor-pointer"
        />
      </td>
      <td className="px-6 py-4">
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
        >
          {DATA_SCOPES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(actions, scope)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <Save size={16} />
            Save
          </button>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default PermissionManager;
