// Departments & Teams Management - Organization Structure
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  DollarSign,
  UserPlus,
  ArrowRight,
  Shield,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  Lock
} from 'lucide-react';
import { departmentApi, teamApi } from '../../services/enterpriseApi';
import { usersAPI, rolesAPI } from '../../services/api';
import PROFESSIONAL_COLORS from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

// ── Permission definitions — grouped by module, fits any industry ────────────
const PERMISSION_GROUPS = [
  {
    group: 'Clients & Leads',
    module: 'clients',
    permissions: [
      { key: 'clients:view',   label: 'View' },
      { key: 'clients:create', label: 'Create' },
      { key: 'clients:edit',   label: 'Edit' },
      { key: 'clients:delete', label: 'Delete' },
    ],
  },
  {
    group: 'Deals & Pipeline',
    module: 'deals',
    permissions: [
      { key: 'deals:view',         label: 'View' },
      { key: 'deals:create',       label: 'Create' },
      { key: 'deals:edit',         label: 'Edit' },
      { key: 'deals:delete',       label: 'Delete' },
      { key: 'deals:change_stage', label: 'Change Stage' },
    ],
  },
  {
    group: 'Sales',
    module: 'sales',
    permissions: [
      { key: 'sales:view',   label: 'View' },
      { key: 'sales:create', label: 'Create' },
      { key: 'sales:edit',   label: 'Edit' },
      { key: 'sales:export', label: 'Export' },
    ],
  },
  {
    group: 'Products',
    module: 'products',
    permissions: [
      { key: 'products:view',   label: 'View' },
      { key: 'products:manage', label: 'Manage (add/edit/delete)' },
    ],
  },
  {
    group: 'Schedules & Tasks',
    module: 'schedules',
    permissions: [
      { key: 'schedules:view',   label: 'View Schedules' },
      { key: 'schedules:create', label: 'Create Schedules' },
      { key: 'schedules:edit',   label: 'Edit Schedules' },
      { key: 'tasks:view',       label: 'View Tasks' },
      { key: 'tasks:create',     label: 'Create Tasks' },
      { key: 'tasks:edit',       label: 'Edit Tasks' },
      { key: 'tasks:assign',     label: 'Assign Tasks to Others' },
    ],
  },
  {
    group: 'Issues & Support',
    module: 'issues',
    permissions: [
      { key: 'issues:view',    label: 'View' },
      { key: 'issues:create',  label: 'Create' },
      { key: 'issues:resolve', label: 'Resolve / Close' },
    ],
  },
  {
    group: 'Reports & Analytics',
    module: 'reports',
    permissions: [
      { key: 'reports:view',   label: 'View Reports' },
      { key: 'reports:export', label: 'Export Reports' },
      { key: 'analytics:view', label: 'View Analytics Dashboard' },
    ],
  },
  {
    group: 'Team Visibility',
    module: 'users',
    permissions: [
      { key: 'users:view_team', label: 'View Team Members\' Data' },
    ],
  },
];

const Departments = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('departments'); // 'departments' | 'roles'
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [newTeamDepartment, setNewTeamDepartment] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, teamRes, usersRes, rolesRes] = await Promise.all([
        departmentApi.getAll(),
        teamApi.getAll(),
        usersAPI.getAll(),
        rolesAPI.getAll().catch(() => ({ data: { roles: [] } })),
      ]);
      setDepartments(deptRes.data.departments || []);
      setTeams(teamRes.data.teams || []);
      setAllUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.users || []);
      setRoles(rolesRes.data.roles || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async (roleData) => {
    try {
      if (editingRole?._id) {
        await rolesAPI.update(editingRole._id, roleData);
        toast.success('Role updated');
      } else {
        await rolesAPI.create(roleData);
        toast.success('Role created');
      }
      setShowRoleModal(false);
      setEditingRole(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    }
  };

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Delete "${role.name}"? Users assigned this role will revert to default permissions.`)) return;
    try {
      await rolesAPI.delete(role._id);
      toast.success('Role deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleSaveDepartment = async (deptData) => {
    try {
      if (editingDept) {
        await departmentApi.update(editingDept._id, deptData);
        toast.success('Department updated successfully');
      } else {
        await departmentApi.create(deptData);
        toast.success('Department created successfully');
      }
      setShowDeptModal(false);
      setEditingDept(null);
      fetchData();
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error('Failed to save department');
    }
  };

  const handleSaveTeam = async (teamData) => {
    try {
      if (editingTeam?._id) {
        await teamApi.update(editingTeam._id, teamData);
        toast.success('Team updated successfully');
      } else {
        await teamApi.create(teamData);
        toast.success('Team created successfully');
      }
      setShowTeamModal(false);
      setEditingTeam(null);
      setNewTeamDepartment('');
      fetchData();
    } catch (error) {
      console.error('Error saving team:', error);
      toast.error('Failed to save team');
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Are you sure? This will affect all teams in this department.')) return;
    
    try {
      await departmentApi.delete(id);
      toast.success('Department deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Are you sure? Team members will need to be reassigned.')) return;
    
    try {
      await teamApi.delete(id);
      toast.success('Team deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  const getDepartmentTeams = (deptId) => {
    return teams.filter(t => t.department?._id === deptId || t.department === deptId);
  };

  const getDepartmentStats = (dept) => {
    const deptTeams = getDepartmentTeams(dept._id);
    
    // Count users directly assigned to this department (including those in teams)
    const usersInDept = allUsers.filter(u => {
      const userDeptId = u.department?._id || u.department;
      return userDeptId === dept._id;
    });
    
    const totalRevenue = deptTeams.reduce((sum, t) => sum + (t.stats?.totalRevenue || 0), 0);
    
    return {
      teamCount: deptTeams.length,
      memberCount: usersInDept.length,
      revenue: totalRevenue
    };
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Organization Structure
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage departments, teams, and custom permission roles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEditingDept(null); setShowDeptModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 btn-brand rounded-lg text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>New Department</span>
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>View All Users</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl mb-6 w-fit ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        {[
          { id: 'departments', label: 'Departments & Teams', icon: Building2 },
          { id: 'roles',       label: 'Custom Roles',        icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white text-gray-900 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── DEPARTMENTS TAB ─────────────────────────────────────────── */}
      {activeTab === 'departments' && (<>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Departments"
          value={departments.length}
          icon={Building2}
          color={PROFESSIONAL_COLORS.primary.main}
          gradient={PROFESSIONAL_COLORS.gradients.blue}
          isDark={isDark}
        />
        <StatCard
          title="Total Teams"
          value={teams.length}
          icon={Users}
          color={PROFESSIONAL_COLORS.success.main}
          gradient={PROFESSIONAL_COLORS.gradients.green}
          isDark={isDark}
        />
        <StatCard
          title="Total Members"
          value={allUsers.length}
          icon={UserPlus}
          color={PROFESSIONAL_COLORS.info.main}
          gradient={PROFESSIONAL_COLORS.gradients.teal}
          isDark={isDark}
        />
        <StatCard
          title="Combined Revenue"
          value={`$${teams.reduce((sum, t) => sum + (t.stats?.totalRevenue || 0), 0).toLocaleString()}`}
          icon={DollarSign}
          color={PROFESSIONAL_COLORS.warning.main}
          gradient={PROFESSIONAL_COLORS.gradients.orange}
          isDark={isDark}
        />
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departments.map(dept => {
          const stats = getDepartmentStats(dept);
          const deptTeams = getDepartmentTeams(dept._id);
          
          return (
            <div
              key={dept._id}
              className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}
            >
              {/* Department Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${PROFESSIONAL_COLORS.primary.main}20` }}
                  >
                    <Building2 className="w-6 h-6" style={{ color: PROFESSIONAL_COLORS.primary.main }} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {dept.name}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {dept.description || 'No description'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingDept(dept);
                      setShowDeptModal(true);
                    }}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDepartment(dept._id)}
                    className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Department Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b" style={{ borderColor: isDark ? '#334155' : '#E5E7EB' }}>
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Teams</p>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stats.teamCount}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Members</p>
                    {stats.memberCount > 0 && (
                      <button
                        onClick={() => navigate('/admin/users', { state: { filterDepartment: dept._id } })}
                        className="text-xs text-[var(--primary-color)] hover:text-[var(--primary-hover)] flex items-center gap-1"
                        title="View all users in this department"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stats.memberCount}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Revenue</p>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ${stats.revenue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Teams in Department */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Teams ({deptTeams.length})
                  </h4>
                  <button
                    onClick={() => {
                      setEditingTeam(null);
                      setNewTeamDepartment(dept._id);
                      setShowTeamModal(true);
                    }}
                    className="flex items-center space-x-1 text-sm text-[var(--primary-color)] hover:text-[var(--primary-hover)]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Team</span>
                  </button>
                </div>

                {deptTeams.length === 0 ? (
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} italic`}>
                    No teams yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {deptTeams.map(team => (
                      <TeamCard
                        key={team._id}
                        team={team}
                        isDark={isDark}
                        onEdit={() => {
                          setEditingTeam(team);
                          setShowTeamModal(true);
                        }}
                        onDelete={() => handleDeleteTeam(team._id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {departments.length === 0 && (
        <div className={`text-center py-12 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Departments Yet</h3>
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Create your first department to start organizing your company</p>
          <button onClick={() => { setEditingDept(null); setShowDeptModal(true); }} className="px-6 py-3 btn-brand rounded-lg transition">
            Create Department
          </button>
        </div>
      )}

      </>)}

      {/* ── ROLES TAB ───────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <RolesTab
          roles={roles}
          isDark={isDark}
          onNew={() => { setEditingRole(null); setShowRoleModal(true); }}
          onEdit={(role) => { setEditingRole(role); setShowRoleModal(true); }}
          onDelete={handleDeleteRole}
        />
      )}

      {/* Modals */}
      {showRoleModal && (
        <RoleModal
          role={editingRole}
          isDark={isDark}
          onSave={handleSaveRole}
          onClose={() => { setShowRoleModal(false); setEditingRole(null); }}
        />
      )}

      {showDeptModal && (
        <DepartmentModal
          department={editingDept}
          isDark={isDark}
          onSave={handleSaveDepartment}
          onClose={() => {
            setShowDeptModal(false);
            setEditingDept(null);
          }}
        />
      )}

      {showTeamModal && (
        <TeamModal
          team={editingTeam}
          initialDepartment={newTeamDepartment}
          departments={departments}
          isDark={isDark}
          onSave={handleSaveTeam}
          onClose={() => {
            setShowTeamModal(false);
            setEditingTeam(null);
            setNewTeamDepartment('');
          }}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, gradient, isDark }) => (
  <div
    className="rounded-xl p-6"
    style={{
      background: isDark ? gradient : 'white',
      border: isDark ? 'none' : '1px solid #E5E7EB'
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
        <Icon className="w-5 h-5" style={{ color: isDark ? 'white' : color }} />
      </div>
    </div>
    <p className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{title}</p>
    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
  </div>
);

// Team Card Component
const TeamCard = ({ team, isDark, onEdit, onDelete }) => (
  <div 
    className={`p-3 rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-gray-50'} flex items-center justify-between`}
  >
    <div className="flex items-center space-x-3">
      <Users className="w-4 h-4 text-[var(--primary-color)]" />
      <div>
        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {team.name}
        </p>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {team.members?.length || 0} members • Target: ${team.targets?.revenue?.toLocaleString() || 0}
        </p>
      </div>
    </div>
    <div className="flex space-x-1">
      <button
        onClick={onEdit}
        className={`p-1 rounded ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
      >
        <Edit2 className="w-3 h-3" />
      </button>
      <button
        onClick={onDelete}
        className="p-1 rounded hover:bg-red-100 text-red-600"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  </div>
);

// Department Modal Component
const DepartmentModal = ({ department, isDark, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    description: department?.description || '',
    headOfDepartment: department?.headOfDepartment || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl p-6 max-w-md w-full ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {department ? 'Edit Department' : 'New Department'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Department Name *
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
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              rows="3"
            />
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
              className="flex-1 px-4 py-2 btn-brand rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Team Modal Component
const TeamModal = ({ team, initialDepartment = '', departments, isDark, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || '',
    department: team?.department?._id || team?.department || initialDepartment,
    targets: {
      revenue: team?.targets?.revenue || 0,
      deals: team?.targets?.deals || 0
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl p-6 max-w-md w-full ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {team ? 'Edit Team' : 'New Team'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Team Name *
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
              Department *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              required
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Revenue Target
              </label>
              <input
                type="number"
                value={formData.targets.revenue}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  targets: { ...formData.targets, revenue: Number(e.target.value) }
                })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Deals Target
              </label>
              <input
                type="number"
                value={formData.targets.deals}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  targets: { ...formData.targets, deals: Number(e.target.value) }
                })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              />
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
              className="flex-1 px-4 py-2 btn-brand rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Roles Tab Component ──────────────────────────────────────────────────────
const RolesTab = ({ roles, isDark, onNew, onEdit, onDelete }) => {
  const systemRoles = roles.filter(r => r.isSystem);
  const customRoles = roles.filter(r => !r.isSystem);

  const RoleCard = ({ role }) => (
    <div className={`rounded-xl p-5 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-sm border ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-primary-50'}`}>
            <Shield className="w-4 h-4 text-[var(--primary-color)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{role.name}</h3>
              {role.isSystem && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                  <Lock className="w-2.5 h-2.5" /> Default
                </span>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{role.description}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(role)}
            className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Edit role"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {!role.isSystem && (
            <button
              onClick={() => onDelete(role)}
              className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition"
              title="Delete role"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {/* Permission pills */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {role.permissions.slice(0, 8).map(p => (
          <span key={p} className={`px-2 py-0.5 rounded-full text-xs font-mono ${
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>{p}</span>
        ))}
        {role.permissions.length > 8 && (
          <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            +{role.permissions.length - 8} more
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Custom roles define what actions a user can perform. Assign them when adding or editing a user.
          </p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-5 py-2.5 btn-brand rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> New Role
        </button>
      </div>

      {systemRoles.length > 0 && (
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>Default Roles (system-seeded)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {systemRoles.map(role => <RoleCard key={role._id} role={role} />)}
          </div>
        </div>
      )}

      {customRoles.length > 0 && (
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>Your Custom Roles</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {customRoles.map(role => <RoleCard key={role._id} role={role} />)}
          </div>
        </div>
      )}

      {roles.length === 0 && (
        <div className={`text-center py-16 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
          <Shield className="w-14 h-14 mx-auto mb-4 text-gray-300" />
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No roles yet</h3>
          <p className={`text-sm mb-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Create your first custom role or run the seed script to get the 6 default presets.
          </p>
          <button onClick={onNew} className="px-6 py-2.5 btn-brand rounded-lg text-sm font-semibold">
            Create First Role
          </button>
        </div>
      )}
    </div>
  );
};

// ── Role Modal (create / edit) ────────────────────────────────────────────────
const RoleModal = ({ role, isDark, onSave, onClose }) => {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selected, setSelected] = useState(new Set(role?.permissions || []));
  const [expanded, setExpanded] = useState({});
  const [saving, setSaving] = useState(false);

  const toggle = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleGroup = (group) => {
    const keys = group.permissions.map(p => p.key);
    const allOn = keys.every(k => selected.has(k));
    setSelected(prev => {
      const next = new Set(prev);
      keys.forEach(k => allOn ? next.delete(k) : next.add(k));
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), description: description.trim(), permissions: [...selected] });
    setSaving(false);
  };

  const inputCls = `w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] ${
    isDark ? 'bg-[#334155] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ${
        isDark ? 'bg-[#1E293B]' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: isDark ? '#334155' : '#E5E7EB' }}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {role ? 'Edit Role' : 'New Custom Role'}
          </h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Name & description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Role Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Senior Agent" required />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className={inputCls} placeholder="What this role is for" />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Permissions <span className={`font-normal text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>({selected.size} selected)</span>
                </label>
                <button type="button" onClick={() => setSelected(new Set())} className="text-xs text-red-500 hover:text-red-600">Clear all</button>
              </div>
              <div className="space-y-2">
                {PERMISSION_GROUPS.map(group => {
                  const keys = group.permissions.map(p => p.key);
                  const allOn = keys.every(k => selected.has(k));
                  const someOn = keys.some(k => selected.has(k));
                  const isOpen = expanded[group.module] !== false; // open by default
                  return (
                    <div key={group.module} className={`rounded-xl border overflow-hidden ${
                      isDark ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      {/* Group header */}
                      <div
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
                          isDark ? 'bg-[#0F172A]' : 'bg-gray-50'
                        }`}
                        onClick={() => setExpanded(prev => ({ ...prev, [group.module]: !isOpen }))}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={allOn}
                            ref={el => { if (el) el.indeterminate = someOn && !allOn; }}
                            onChange={() => toggleGroup(group)}
                            onClick={e => e.stopPropagation()}
                            className="w-4 h-4 rounded accent-[var(--primary-color)]"
                          />
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{group.group}</span>
                          {someOn && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700">
                              {keys.filter(k => selected.has(k)).length}/{keys.length}
                            </span>
                          )}
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                      {/* Permission checkboxes */}
                      {isOpen && (
                        <div className={`px-4 py-3 grid grid-cols-2 gap-2 ${
                          isDark ? 'bg-[#1E293B]' : 'bg-white'
                        }`}>
                          {group.permissions.map(perm => (
                            <label key={perm.key} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={selected.has(perm.key)}
                                onChange={() => toggle(perm.key)}
                                className="w-4 h-4 rounded accent-[var(--primary-color)]"
                              />
                              <span className={`text-sm ${
                                selected.has(perm.key)
                                  ? isDark ? 'text-white' : 'text-gray-900'
                                  : isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex gap-3 px-6 py-4 border-t ${
            isDark ? 'border-gray-700 bg-[#0F172A]' : 'border-gray-100 bg-gray-50'
          }`}>
            <button type="button" onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${
              isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}>Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="flex-1 py-2.5 btn-brand rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving...' : role ? 'Save Changes' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Departments;
