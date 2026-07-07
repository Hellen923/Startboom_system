// Goals Dashboard - Track and manage team and individual goals
import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp,
  Users,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  ArrowUpRight
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
  const [filterType, setFilterType] = useState('all'); // all, individual, team, company
  const [filterStatus, setFilterStatus] = useState('all'); // all, on_track, at_risk, behind
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, [filterType, filterStatus]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== 'all') params.goalType = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      
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
    if (!window.confirm('Are you sure? This will delete the goal and all cascaded child goals.')) return;
    
    try {
      await goalApi.delete(id);
      toast.success('Goal deleted');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const getGoalStats = () => {
    const onTrack = goals.filter(g => g.status === 'on_track').length;
    const atRisk = goals.filter(g => g.status === 'at_risk').length;
    const behind = goals.filter(g => g.status === 'behind').length;
    const avgProgress = goals.length > 0 
      ? (goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length).toFixed(1)
      : 0;
    
    return { onTrack, atRisk, behind, avgProgress };
  };

  const stats = getGoalStats();

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Goals & Targets
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Track progress on individual, team, and company-wide goals
          </p>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">New Goal</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="On Track"
          value={stats.onTrack}
          icon={CheckCircle2}
          color={PROFESSIONAL_COLORS.success.main}
          gradient={PROFESSIONAL_COLORS.gradients.green}
          isDark={isDark}
        />
        <StatCard
          title="At Risk"
          value={stats.atRisk}
          icon={AlertCircle}
          color={PROFESSIONAL_COLORS.warning.main}
          gradient={PROFESSIONAL_COLORS.gradients.orange}
          isDark={isDark}
        />
        <StatCard
          title="Behind"
          value={stats.behind}
          icon={Clock}
          color={PROFESSIONAL_COLORS.danger.main}
          gradient={PROFESSIONAL_COLORS.gradients.pink}
          isDark={isDark}
        />
        <StatCard
          title="Avg Progress"
          value={`${stats.avgProgress}%`}
          icon={TrendingUp}
          color={PROFESSIONAL_COLORS.info.main}
          gradient={PROFESSIONAL_COLORS.gradients.teal}
          isDark={isDark}
        />
      </div>
      {/* Filters */}
      <div className={`rounded-xl p-6 mb-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex-1 flex flex-wrap gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
            >
              <option value="all">All Types</option>
              <option value="individual">Individual Goals</option>
              <option value="team">Team Goals</option>
              <option value="company">Company Goals</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
            >
              <option value="all">All Status</option>
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="behind">Behind</option>
            </select>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className={`text-center py-12 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No Goals Yet
          </h3>
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Create your first goal to start tracking progress
          </p>
          <button
            onClick={() => {
              setEditingGoal(null);
              setShowModal(true);
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map(goal => (
            <GoalCard
              key={goal._id}
              goal={goal}
              isDark={isDark}
              onEdit={() => {
                setEditingGoal(goal);
                setShowModal(true);
              }}
              onDelete={() => handleDeleteGoal(goal._id)}
            />
          ))}
        </div>
      )}
      {/* Goal Modal */}
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

// Goal Card Component
const GoalCard = ({ goal, isDark, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'on_track': return PROFESSIONAL_COLORS.success.main;
      case 'at_risk': return PROFESSIONAL_COLORS.warning.main;
      case 'behind': return PROFESSIONAL_COLORS.danger.main;
      default: return PROFESSIONAL_COLORS.gray[400];
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'individual': return User;
      case 'team': return Users;
      case 'company': return Target;
      default: return Target;
    }
  };

  const TypeIcon = getTypeIcon(goal.goalType);
  const statusColor = getStatusColor(goal.status);
  const progress = goal.progress || 0;

  return (
    <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${PROFESSIONAL_COLORS.primary.main}20` }}
          >
            <TypeIcon className="w-6 h-6" style={{ color: PROFESSIONAL_COLORS.primary.main }} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
              {goal.title}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {goal.description || 'No description'}
            </p>
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

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Progress
          </span>
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {progress.toFixed(1)}%
          </span>
        </div>
        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: statusColor
            }}
          />
        </div>
      </div>
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 pb-4 mb-4 border-b" style={{ borderColor: isDark ? '#334155' : '#E5E7EB' }}>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Target</p>
          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {goal.targetValue?.toLocaleString() || 'N/A'}
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Current</p>
          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {goal.currentValue?.toLocaleString() || 0}
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Status</p>
          <span 
            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor
            }}
          >
            {goal.status?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-sm">
          <ArrowUpRight className="w-4 h-4" style={{ color: statusColor }} />
          <span className="font-semibold" style={{ color: statusColor }}>
            {goal.metricType === 'percentage' ? `${(goal.targetValue || 0)}%` : goal.metricType}
          </span>
        </div>
      </div>
    </div>
  );
};

// Goal Modal Component
const GoalModal = ({ goal, isDark, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    goalType: goal?.goalType || 'individual',
    metricType: goal?.metricType || 'revenue',
    targetValue: goal?.targetValue || '',
    startDate: goal?.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : '',
    endDate: goal?.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {goal ? 'Edit Goal' : 'New Goal'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Goal Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Goal Type *
              </label>
              <select
                value={formData.goalType}
                onChange={(e) => setFormData({ ...formData, goalType: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                required
              >
                <option value="individual">Individual</option>
                <option value="team">Team</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Metric Type *
              </label>
              <select
                value={formData.metricType}
                onChange={(e) => setFormData({ ...formData, metricType: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                required
              >
                <option value="revenue">Revenue</option>
                <option value="deals">Deals Closed</option>
                <option value="leads">Leads Generated</option>
                <option value="activities">Activities Completed</option>
                <option value="meetings">Meetings Held</option>
                <option value="calls">Calls Made</option>
                <option value="emails">Emails Sent</option>
                <option value="conversion_rate">Conversion Rate</option>
                <option value="customer_satisfaction">Customer Satisfaction</option>
                <option value="custom">Custom Metric</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Target Value *
            </label>
            <input
              type="number"
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
              className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
