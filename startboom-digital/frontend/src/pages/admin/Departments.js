// Departments & Teams Management - Organization Structure
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp,
  Target,
  DollarSign,
  UserPlus
} from 'lucide-react';
import { departmentApi, teamApi } from '../../services/enterpriseApi';
import PROFESSIONAL_COLORS from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Departments = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, teamRes] = await Promise.all([
        departmentApi.getAll(),
        teamApi.getAll()
      ]);
      setDepartments(deptRes.data.departments || []);
      setTeams(teamRes.data.teams || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load departments and teams');
    } finally {
      setLoading(false);
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
      if (editingTeam) {
        await teamApi.update(editingTeam._id, teamData);
        toast.success('Team updated successfully');
      } else {
        await teamApi.create(teamData);
        toast.success('Team created successfully');
      }
      setShowTeamModal(false);
      setEditingTeam(null);
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
    const totalMembers = deptTeams.reduce((sum, t) => sum + (t.members?.length || 0), 0);
    const totalRevenue = deptTeams.reduce((sum, t) => sum + (t.stats?.totalRevenue || 0), 0);
    
    return {
      teamCount: deptTeams.length,
      memberCount: totalMembers,
      revenue: totalRevenue
    };
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Organization Structure
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage departments, teams, and organizational hierarchy
          </p>
        </div>
        <button
          onClick={() => {
            setEditingDept(null);
            setShowDeptModal(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 btn-brand rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">New Department</span>
        </button>
      </div>

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
          value={teams.reduce((sum, t) => sum + (t.members?.length || 0), 0)}
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
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Members</p>
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
                      setEditingTeam({ department: dept._id });
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
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No Departments Yet
          </h3>
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Create your first department to start organizing your company
          </p>
          <button
            onClick={() => {
              setEditingDept(null);
              setShowDeptModal(true);
            }}
            className="px-6 py-3 btn-brand rounded-lg transition"
          >
            Create Department
          </button>
        </div>
      )}

      {/* Modals */}
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
          departments={departments}
          isDark={isDark}
          onSave={handleSaveTeam}
          onClose={() => {
            setShowTeamModal(false);
            setEditingTeam(null);
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
const TeamModal = ({ team, departments, isDark, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || '',
    department: team?.department?._id || team?.department || '',
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

export default Departments;
