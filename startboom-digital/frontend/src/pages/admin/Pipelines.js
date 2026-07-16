// Pipeline Builder - Customize sales and business process stages
import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  CheckCircle,
  XCircle,
  Circle,
  Percent,
  Clock,
  Copy,
  Settings as SettingsIcon
} from 'lucide-react';
import { pipelineApi } from '../../services/enterpriseApi';
import PROFESSIONAL_COLORS from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Pipelines = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState(null);
  const [editingStage, setEditingStage] = useState(null);
  const [filterEntity, setFilterEntity] = useState('all');

  useEffect(() => {
    fetchPipelines();
  }, [filterEntity]);

  const fetchPipelines = async () => {
    try {
      setLoading(true);
      const params = filterEntity !== 'all' ? { entityType: filterEntity } : {};
      const response = await pipelineApi.getAll(params);
      const fresh = response.data.pipelines || [];
      setPipelines(fresh);
      // Always sync selectedPipeline with fresh data so stages update instantly
      if (fresh.length > 0) {
        const current = selectedPipeline
          ? fresh.find(p => p._id === selectedPipeline._id) || fresh[0]
          : fresh[0];
        setSelectedPipeline(current);
      }
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      toast.error('Failed to load pipelines');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePipeline = async (pipelineData) => {
    try {
      if (editingPipeline) {
        await pipelineApi.update(editingPipeline._id, pipelineData);
        toast.success('Pipeline updated successfully');
      } else {
        await pipelineApi.create(pipelineData);
        toast.success('Pipeline created successfully');
      }
      setShowModal(false);
      setEditingPipeline(null);
      fetchPipelines();
    } catch (error) {
      console.error('Error saving pipeline:', error);
      toast.error('Failed to save pipeline');
    }
  };

  const handleDeletePipeline = async (id) => {
    if (!window.confirm('Are you sure? This will affect all items using this pipeline.')) return;
    
    try {
      await pipelineApi.delete(id);
      toast.success('Pipeline deleted');
      if (selectedPipeline?._id === id) setSelectedPipeline(null);
      fetchPipelines();
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      toast.error('Failed to delete pipeline');
    }
  };

  const handleClonePipeline = async (pipeline) => {
    try {
      await pipelineApi.clone(pipeline._id, `${pipeline.name} (Copy)`);
      toast.success('Pipeline cloned successfully');
      fetchPipelines();
    } catch (error) {
      console.error('Error cloning pipeline:', error);
      toast.error('Failed to clone pipeline');
    }
  };

  const handleSaveStage = async (stageData) => {
    if (!selectedPipeline) return;
    try {
      if (editingStage) {
        // Update: send full stages array with the edited stage replaced
        const updatedStages = selectedPipeline.stages.map(s =>
          s.name === editingStage.name ? { ...s, ...stageData } : s
        );
        await pipelineApi.update(selectedPipeline._id, { stages: updatedStages });
        toast.success('Stage updated successfully');
      } else {
        await pipelineApi.addStage(selectedPipeline._id, stageData);
        toast.success('Stage added successfully');
      }
      setShowStageModal(false);
      setEditingStage(null);
      fetchPipelines();
    } catch (error) {
      console.error('Error saving stage:', error);
      toast.error('Failed to save stage');
    }
  };


  const handleDeleteStage = async (stageName) => {
    if (!selectedPipeline) return;
    if (!window.confirm('Delete this stage? Items will need to be moved.')) return;
    
    try {
      await pipelineApi.removeStage(selectedPipeline._id, stageName);
      toast.success('Stage deleted');
      fetchPipelines();
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast.error('Failed to delete stage');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Pipeline Builder
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Customize sales stages and business processes for your organization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#1E293B] text-white' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
          >
            <option value="all">All Types</option>
            <option value="deal">Deals</option>
            <option value="client">Clients</option>
            <option value="sale">Sales</option>
            <option value="project">Projects</option>
            <option value="ticket">Tickets</option>
          </select>
          <button
            onClick={() => {
              setEditingPipeline(null);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-6 py-3 btn-brand rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">New Pipeline</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline List */}
        <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Pipelines ({pipelines.length})
          </h2>
          <div className="space-y-2">
            {pipelines.length === 0 ? (
              <div className="text-center py-8">
                <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No pipelines yet
                </p>
              </div>
            ) : (
              pipelines.map(pipeline => (
                <div
                  key={pipeline._id}
                  onClick={() => setSelectedPipeline(pipeline)}
                  className={`
                    p-4 rounded-lg cursor-pointer transition-all
                    ${selectedPipeline?._id === pipeline._id
                      ? 'btn-brand'
                      : isDark ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-50 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{pipeline.name}</h3>
                    {pipeline.isDefault && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        selectedPipeline?._id === pipeline._id
                          ? 'bg-white/20' : 'bg-green-100 text-green-800'
                      }`}>
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{pipeline.entityType}</span>
                    <span>{pipeline.stages?.length || 0} stages</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pipeline Details */}
        <div className={`lg:col-span-2 rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
          {selectedPipeline ? (
            <>
              {/* Pipeline Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedPipeline.name}
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedPipeline.description || 'No description'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleClonePipeline(selectedPipeline)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
                    title="Clone Pipeline"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingPipeline(selectedPipeline);
                      setShowModal(true);
                    }}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
                    title="Edit Pipeline"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePipeline(selectedPipeline._id)}
                    className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
                    title="Delete Pipeline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add Stage Button */}
              <button
                onClick={() => {
                  setEditingStage(null);
                  setShowStageModal(true);
                }}
                className="w-full mb-4 flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-[var(--primary-color)] text-[var(--primary-color)] rounded-lg hover:bg-[#FEF3C7] transition"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Add Stage</span>
              </button>

              {/* Stages */}
              <div className="space-y-3">
                {selectedPipeline.stages?.sort((a, b) => a.order - b.order).map((stage, index) => (
                  <StageCard
                    key={index}
                    stage={stage}
                    isDark={isDark}
                    onEdit={(s) => { setEditingStage(s); setShowStageModal(true); }}
                    onDelete={handleDeleteStage}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <GitBranch className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Select a Pipeline
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Choose a pipeline from the list to view and edit stages
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Modal */}
      {showModal && (
        <PipelineModal
          pipeline={editingPipeline}
          isDark={isDark}
          onSave={handleSavePipeline}
          onClose={() => {
            setShowModal(false);
            setEditingPipeline(null);
          }}
        />
      )}

      {/* Stage Modal */}
      {showStageModal && (
        <StageModal
          stage={editingStage}
          isDark={isDark}
          onSave={handleSaveStage}
          onClose={() => {
            setShowStageModal(false);
            setEditingStage(null);
          }}
        />
      )}
    </div>
  );
};


// Stage Card Component
const StageCard = ({ stage, isDark, onEdit, onDelete }) => {
  const getStageIcon = () => {
    if (stage.isFinal) {
      return stage.finalType === 'won' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <Circle className="w-5 h-5" style={{ color: stage.color || PROFESSIONAL_COLORS.primary.main }} />;
  };

  return (
    <div className={`p-4 rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-gray-50'} border-l-4`} style={{ borderLeftColor: stage.color }}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="mt-1">
            {getStageIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stage.name}
              </h3>
              {stage.isFinal && (
                <span className={`text-xs px-2 py-0.5 rounded ${
                  stage.finalType === 'won' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {stage.finalType?.toUpperCase()}
                </span>
              )}
            </div>
            {stage.description && (
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                {stage.description}
              </p>
            )}
            <div className="flex items-center space-x-4 text-xs">
              <span className={`flex items-center space-x-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Percent className="w-3 h-3" />
                <span>{stage.probability}% probability</span>
              </span>
              {stage.slaMaxDays && (
                <span className={`flex items-center space-x-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Clock className="w-3 h-3" />
                  <span>{stage.slaMaxDays} days max</span>
                </span>
              )}
              <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
                Order: {stage.order}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(stage)}
            className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
            title="Edit stage"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(stage.name)}
            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
            title="Delete stage"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};


// Pipeline Modal
const PipelineModal = ({ pipeline, isDark, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: pipeline?.name || '',
    description: pipeline?.description || '',
    entityType: pipeline?.entityType || 'deal',
    isDefault: pipeline?.isDefault || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl p-6 max-w-md w-full ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {pipeline ? 'Edit Pipeline' : 'New Pipeline'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Pipeline Name *
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

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Entity Type *
            </label>
            <select
              value={formData.entityType}
              onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              required
            >
              <option value="deal">Deals</option>
              <option value="client">Clients</option>
              <option value="sale">Sales</option>
              <option value="project">Projects</option>
              <option value="ticket">Tickets</option>
              <option value="recruitment">Recruitment</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="mr-2"
            />
            <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Set as default pipeline for this entity type
            </label>
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
              Save Pipeline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// Stage Modal
const StageModal = ({ stage, isDark, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: stage?.name || '',
    description: stage?.description || '',
    color: stage?.color || '#3B82F6',
    order: stage?.order || 1,
    probability: stage?.probability || 50,
    isFinal: stage?.isFinal || false,
    finalType: stage?.finalType || 'none',
    slaMaxDays: stage?.slaMaxDays || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#EF4444', label: 'Red' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#14B8A6', label: 'Teal' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`rounded-xl p-6 max-w-lg w-full my-8 ${isDark ? 'bg-[#1E293B]' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {stage ? 'Edit Stage' : 'New Stage'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Stage Name *
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
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Color
              </label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              >
                {colorOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Order *
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                required
                min="1"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Win Probability (%)
              </label>
              <input
                type="number"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Max Days (SLA)
              </label>
              <input
                type="number"
                value={formData.slaMaxDays}
                onChange={(e) => setFormData({ ...formData, slaMaxDays: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                min="0"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={formData.isFinal}
                onChange={(e) => setFormData({ ...formData, isFinal: e.target.checked })}
                className="mr-2"
              />
              <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                This is a final stage (Won/Lost)
              </label>
            </div>

            {formData.isFinal && (
              <select
                value={formData.finalType}
                onChange={(e) => setFormData({ ...formData, finalType: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              >
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            )}
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
              Save Stage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Pipelines;
