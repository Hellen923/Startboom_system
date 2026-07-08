// Workflow Builder - Automate business processes
import React, { useState, useEffect } from 'react';
import { Zap, Plus, Edit2, Trash2, Play, Pause, Copy, TrendingUp } from 'lucide-react';
import { workflowApi } from '../../services/enterpriseApi';
import PROFESSIONAL_COLORS from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Workflows = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState([]);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await workflowApi.getAll();
      setWorkflows(response.data.workflows || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await workflowApi.toggle(id);
      toast.success('Workflow toggled');
      fetchWorkflows();
    } catch (error) {
      toast.error('Failed to toggle workflow');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Workflow Automation
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Automate repetitive tasks and business processes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Workflows" value={workflows.length} icon={Zap} gradient={PROFESSIONAL_COLORS.gradients.blue} isDark={isDark} />
        <StatCard title="Active" value={workflows.filter(w => w.isActive).length} icon={Play} gradient={PROFESSIONAL_COLORS.gradients.green} isDark={isDark} />
        <StatCard title="Executions" value={workflows.reduce((sum, w) => sum + (w.executionCount || 0), 0)} icon={TrendingUp} gradient={PROFESSIONAL_COLORS.gradients.purple} isDark={isDark} />
      </div>

      <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
        <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Workflows ({workflows.length})
        </h2>
        <div className="space-y-3">
          {workflows.map(workflow => (
            <div key={workflow._id} className={`p-4 rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-gray-50'} flex items-center justify-between`}>
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${PROFESSIONAL_COLORS.primary.main}20` }}>
                  <Zap className="w-5 h-5" style={{ color: PROFESSIONAL_COLORS.primary.main }} />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{workflow.name}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{workflow.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggle(workflow._id)}
                  className={`p-2 rounded-lg ${workflow.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-300 text-gray-600'}`}
                >
                  {workflow.isActive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, gradient, isDark }) => (
  <div className="rounded-xl p-6" style={{ background: isDark ? gradient : 'white', border: isDark ? 'none' : '1px solid #E5E7EB' }}>
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
        <Icon className="w-5 h-5" style={{ color: isDark ? 'white' : PROFESSIONAL_COLORS.primary.main }} />
      </div>
    </div>
    <p className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{title}</p>
    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
  </div>
);

export default Workflows;
