// Goals Dashboard - Company, Department, Team & Individual Goals
import React, { useState, useEffect } from 'react';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  Building2,
  User,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  Filter
} from 'lucide-react';
import { goalApi } from '../../services/enterpriseApi';
import PROFESSIONAL_COLORS from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Goals = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filters, setFilters] = useState({
    assignmentType: 'all',
    type: 'all',
    period: 'all',
    status: 'all'
  });

  useEffect(() => {
    fetchGoals();
  }, [filters]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.assignmentType !== 'all') params.assignmentType = filters.assignmentType;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.period !== 'all') params.period = filters.period;
      if (filters.status !== 'all') params.status = filters.status;
      
      const response = await goalApi.getAll(params);
      setGoals(response.data.goals || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async (goalData) => {
    try {
      if (editingGoal) {
        await goalApi.update(editingGoal._id, goalData);
        toast.success('Goal updated successfully');
      } else {
        await goalApi.create(goalData);
        toast.success('Goal created successfully');
      }
      setShowModal(false);
      setEditingGoal(null);
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Failed to save goal');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure? This will affect progress tracking.')) return;
    
    try {
      await goalApi.delete(id);
      toast.success('Goal deleted');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const calculateStats = () => {
    const active = goals.filter(g => g.status === 'active');
    const onTrack = goals.filter(g => g.status === 'on_track').length;
    const atRisk = goals.filter(g => g.status === 'at_risk').length;
    const achieved = goals.filter(g => g.status === 'completed' && g.progress >= 100).length;
    const avgProgress = goals.length > 0 
      ? goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length 
      : 0;

    return { active: active.length, onTrack, atRisk, achieved, avgProgress };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'on_track':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'at_risk':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'behind':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getAssignmentIcon = (type) => {
    switch (type) {
      case 'company':
        return <Building2 className="w-4 h-4" />;
      case 'team':
        return <Users className="w-4 h-4" />;
      case 'individual':
        return <User className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const stats = calculateStats();

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Goals Dashboard
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Track targets and performance across your organization
          </p>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setShowModal(true);
          }}
          className="btn-brand flex items-center space-x-2 px-6 py-3 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">New Goal</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Active Goals"
          value={stats.active}
          icon={Target}
          gradient={PROFESSIONAL_COLORS.gradients.blue}
          isDark={isDark}
        />
        <StatCard
          title="On Track"
          value={stats.onTrack}
          icon={CheckCircle}
          gradient={PROFESSIONAL_COLORS.gradients.green}
          isDark={isDark}
        />
        <StatCard
          title="At Risk"
          value={stats.atRisk}
          icon={AlertCircle}
          gradient={PROFESSIONAL_COLORS.gradients.orange}
          isDark={isDark}
        />
        <StatCard
          title="Achieved"
          value={stats.achieved}
          icon={Award}
          gradient={PROFESSIONAL_COLORS.gradients.purple}
          isDark={isDark}
        />
        <StatCard
          title="Avg Progress"
          value={`${stats.avgProgress.toFixed(0)}%`}
          icon={TrendingUp}
          gradient={PROFESSIONAL_COLORS.gradients.teal}
          isDark={isDark}
        />
      </div>

      {/* Filters */}
      <div className={`rounded-xl p-6 mb-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5" style={{ color: 'var(--primary-color)' }} />
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Filters
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.assignmentType}
            onChange={(e) => setFilters({ ...filters, assignmentType: e.target.value })}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
          >
            <option value="all">All Levels</option>
            <option value="company">Company</option>
            <option value="branch">Branch</option>
            <option value="department">Department</option>
            <option value="team">Team</option>
            <option value="individual">Individual</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
          >
            <option value="all">All Types</option>
            <option value="revenue">Revenue</option>
            <option value="deals">Deals</option>
            <option value="clients">Clients</option>
            <option value="sales_volume">Sales Volume</option>
            <option value="calls">Calls</option>
            <option value="meetings">Meetings</option>
            <option value="activities">Activities</option>
          </select>

          <select
            value={filters.period}
            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
          >
            <option value="all">All Periods</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on_track">On Track</option>
            <option value="at_risk">At Risk</option>
            <option value="behind">Behind</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className={`text-center py-12 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              No Goals Yet
            </h3>
            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Create your first goal to start tracking performance
            </p>
            <button
              onClick={() => {
                setEditingGoal(null);
                setShowModal(true);
              }}
              className="btn-brand px-6 py-3 rounded-lg"
            >
              Create Goal
            </button>
          </div>
        ) : (
          goals.map(goal => (
            <GoalCard
              key={goal._id}
              goal={goal}
              isDark={isDark}
              getStatusIcon={getStatusIcon}
              getAssignmentIcon={getAssignmentIcon}
              onEdit={() => {
                setEditingGoal(goal);
                setShowModal(true);
              }}
              onDelete={() => handleDeleteGoal(goal._id)}
            />
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <GoalModal
          goal={editingGoal}
          isDark={isDark}
          onSave={handleSaveGoal}
          onClose={() => {
            setShowModal(false);
            setEditingGoal(null);
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

// Goal Card Component
const GoalCard = ({ goal, isDark, getStatusIcon, getAssignmentIcon, onEdit, onDelete }) => {
  const progress = goal.progress || 0;
  const progressColor = 
    progress >= 100 ? PROFESSIONAL_COLORS.success.main :
    progress >= 70 ? PROFESSIONAL_COLORS.info.main :
    progress >= 40 ? PROFESSIONAL_COLORS.warning.main :
    PROFESSIONAL_COLORS.danger.main;

  return (
    <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${PROFESSIONAL_COLORS.primary.main}20` }}
          >
            <Target className="w-6 h-6" style={{ color: PROFESSIONAL_COLORS.primary.main }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {goal.name}
              </h3>
              {getStatusIcon(goal.status)}
            </div>
            {goal.description && (
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {goal.description}
              </p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <span className={`flex items-center space-x-1 text-xs px-3 py-1 rounded-full ${isDark ? 'bg-[#334155]' : 'bg-gray-100'}`}>
                {getAssignmentIcon(goal.assignmentType)}
                <span className="capitalize">{goal.assignmentType}</span>
              </span>
              <span className={`flex items-center space-x-1 text-xs px-3 py-1 rounded-full ${isDark ? 'bg-[#334155]' : 'bg-gray-100'}`}>
                <Calendar className="w-3 h-3" />
                <span className="capitalize">{goal.period}</span>
              </span>
              <span className={`text-xs px-3 py-1 rounded-full ${
                goal.status === 'on_track' || goal.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                goal.status === 'at_risk' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
              }`}>
                {goal.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-3">
        {/* Numbers */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Target</p>
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {goal.type === 'revenue' ? `$${goal.target?.toLocaleString()}` : goal.target?.toLocaleString()}
            </p>
          </div>
          <div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actual</p>
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {goal.type === 'revenue' ? `$${goal.actual?.toLocaleString()}` : goal.actual?.toLocaleString()}
            </p>
          </div>
          <div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Progress</p>
            <p className={`text-lg font-bold`} style={{ color: progressColor }}>
              {progress.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Type</p>
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} capitalize`}>
              {goal.type?.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`w-full h-3 rounded-full ${isDark ? 'bg-[#334155]' : 'bg-gray-200'} overflow-hidden`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: `linear-gradient(90deg, ${progressColor} 0%, ${progressColor}dd 100%)`
            }}
          />
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-xs">
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
          </span>
          {goal.user && (
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Owner: {goal.user.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Goal Modal Component
const GoalModal = ({ goal, isDark, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    description: goal?.description || '',
    type: goal?.type || 'revenue',
    assignmentType: goal?.assignmentType || 'individual',
    period: goal?.period || 'monthly',
    target: goal?.target || 0,
    actual: goal?.actual || 0,
    startDate: goal?.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : '',
    endDate: goal?.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`rounded-xl p-6 max-w-2xl w-full my-8 ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {goal ? 'Edit Goal' : 'New Goal'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Goal Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                required
              />
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

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Goal Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                required
              >
                <option value="revenue">Revenue</option>
                <option value="deals">Deals</option>
                <option value="clients">Clients</option>
                <option value="sales_volume">Sales Volume</option>
                <option value="calls">Calls</option>
                <option value="meetings">Meetings</option>
                <option value="emails">Emails</option>
                <option value="activities">Activities</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Assignment Level *
              </label>
              <select
                value={formData.assignmentType}
                onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                required
              >
                <option value="company">Company</option>
                <option value="branch">Branch</option>
                <option value="department">Department</option>
                <option value="team">Team</option>
                <option value="individual">Individual</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Period *
              </label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Target *
              </label>
              <input
                type="number"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: Number(e.target.value) })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                required
                min="0"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                required
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
              className="btn-brand flex-1 px-4 py-2 rounded-lg"
            >
              Save Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Goals;
