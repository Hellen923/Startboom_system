// pages/agent/Deals.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Filter, 
  Search, 
  Download,
  BarChart3,
  Kanban,
  Table,
  Upload,
  FileText,
  X,
  Eye,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip as ReTooltip
} from 'recharts';
import DonutChart from '../../components/charts/DonutChart';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { dealsAPI, clientsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Deals = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    stage: '',
    minValue: '',
    maxValue: ''
  });

  // Filter deals for pipeline view (exclude won/lost)
  const pipelineDeals = deals.filter(deal => deal.stage !== 'won' && deal.stage !== 'lost');

  // Determine which deals to display in table based on filters
  // Apply search, stage, and value range filters ONLY to table display
  const displayDeals = deals.filter(deal => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        deal.title?.toLowerCase().includes(searchLower) ||
        deal.description?.toLowerCase().includes(searchLower) ||
        deal.client?.name?.toLowerCase().includes(searchLower) ||
        deal.client?.companyName?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Stage filter
    if (filters.stage && deal.stage !== filters.stage) {
      return false;
    }

    // Value range filter
    if (filters.minValue && deal.value < Number(filters.minValue)) {
      return false;
    }
    if (filters.maxValue && deal.value > Number(filters.maxValue)) {
      return false;
    }

    return true;
  });


  // Load all deals on component mount (without filter params sent to API)
  useEffect(() => {
    loadDeals();
  }, [user]);

  // Reload stats when deals change
  useEffect(() => {
    if (deals.length > 0) {
      // Stats are calculated from deals locally, no need to call API
      // But refresh if needed for sync
    }
  }, [deals]);

  // Load clients when opening the create modal so dropdown has data
  useEffect(() => {
    if (showCreateModal) {
      loadClients();
    }
  }, [showCreateModal]);

  useEffect(() => {
    if (location?.state?.openCreate) {
      setShowCreateModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const loadDeals = async () => {
    try {
      setError(null);
      
      // Fetch ALL deals for stats calculation (no filter params to API)
      const params = {
        agentId: user.role === 'agent' ? (user?._id || user?.id) : undefined
        // Don't send filter params to API - filters are applied client-side only
      };

      const response = await dealsAPI.getAll(params);
      const fetchedDeals = response.data?.deals || response.data || [];
      setDeals(fetchedDeals);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError('Failed to load deals');
      toast.error('Failed to load deals');
    }
  };

  const loadClients = async (search = '') => {
    try {
      const response = await clientsAPI.getAll({ search, limit: 50 });
      setClients(response.data?.clients || response.data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setClients([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await dealsAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats(null);
    }
  };

  const handleCreateDeal = async (dealData) => {
    try {
      setError(null);
      await dealsAPI.create(dealData);
      setShowCreateModal(false);
      toast.success('Deal created successfully');
      loadDeals(); // Refresh deals after creating
    } catch (err) {
      console.error('Error creating deal:', err);
      const message = err.response?.data?.message || err.message || 'Failed to create deal';
      setError(message);
      toast.error(message);
    }
  };

  const handleUpdateDealStage = async (dealId, newStage) => {
    try {
      // Optimistically update local state for immediate UI feedback
      setDeals(prevDeals =>
        prevDeals.map(deal =>
          deal._id === dealId ? { ...deal, stage: newStage } : deal
        )
      );

      await dealsAPI.updateStatus(dealId, newStage);
      toast.success('Deal updated successfully');

      // Refresh data from server to ensure consistency
      loadDeals();
    } catch (err) {
      console.error('Error updating deal:', err);
      toast.error(err.response?.data?.message || 'Failed to update deal stage');
      // Revert optimistic update on error
      loadDeals();
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        await dealsAPI.delete(dealId);
        toast.success('Deal deleted successfully');
        loadDeals(); // Refresh deals after deleting
      } catch (err) {
        console.error('Error deleting deal:', err);
        toast.error('Failed to delete deal');
      }
    }
  };

  // Calculate stats from deals if API stats are not available
  const calculatedStats = React.useMemo(() => {
    // Use ALL deals for stats calculation - cards show overall stats, not filtered
    const dealsForStats = deals;

    // Use API stats if available and complete, otherwise calculate from deals
    if (stats && stats.totalStats) {
      return stats;
    }

    const stageStats = [
      { _id: 'lead', count: 0, totalValue: 0, avgProbability: 0 },
      { _id: 'qualification', count: 0, totalValue: 0, avgProbability: 0 },
      { _id: 'proposal', count: 0, totalValue: 0, avgProbability: 0 },
      { _id: 'negotiation', count: 0, totalValue: 0, avgProbability: 0 },
      { _id: 'won', count: 0, totalValue: 0, avgProbability: 0 },
      { _id: 'lost', count: 0, totalValue: 0, avgProbability: 0 }
    ];

    let totalValue = 0;
    let wonDealsCount = 0;
    let wonValue = 0;
    let lostDealsCount = 0;
    let lostValue = 0;
    let pipelineCount = 0;
    let totalDeals = 0;

    dealsForStats.forEach(deal => {
      totalDeals++;
      const dealValue = deal.value || 0;
      
      // Find and update stage stats
      const stageIndex = stageStats.findIndex(s => s._id === deal.stage);
      if (stageIndex !== -1) {
        stageStats[stageIndex].count++;
        stageStats[stageIndex].totalValue += dealValue;
      }

      // Track total value
      totalValue += dealValue;

      // Count won deals
      if (deal.stage === 'won') {
        wonDealsCount++;
        wonValue += dealValue;
      }

      // Count lost deals
      if (deal.stage === 'lost') {
        lostDealsCount++;
        lostValue += dealValue;
      }

      // Count pipeline deals (not won, not lost)
      if (deal.stage !== 'won' && deal.stage !== 'lost') {
        pipelineCount++;
      }
    });

    // Calculate average probabilities
    stageStats.forEach(stage => {
      if (stage.count > 0) {
        stage.avgProbability = Math.round(stage.totalValue / stage.count);
      }
    });

    const winRate = totalDeals > 0 ? parseFloat(((wonDealsCount / totalDeals) * 100).toFixed(1)) : 0;

    return {
      stageStats,
      totalStats: {
        totalDeals: totalDeals,
        totalValue: totalValue,
        wonDealsCount: wonDealsCount,
        wonValue: wonValue,
        lostDealsCount: lostDealsCount,
        lostValue: lostValue,
        pipelineCount: pipelineCount,
        winRate: winRate
      }
    };
  }, [stats, deals]);

  // Data loads in background, no blocking UI
  const formatUGX = (val) => `UGX ${Number(val || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Quick Add Button */}
      <div className="flex justify-end">
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Create New Deal
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
          <p className="text-2xl font-bold text-orange-500">
            {formatUGX(calculatedStats.totalStats?.totalValue || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">All deals</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900">Won Deals</h3>
          <p className="text-2xl font-bold text-green-500">
            {calculatedStats.totalStats?.wonDealsCount || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">{formatUGX(calculatedStats.totalStats?.wonValue || 0)}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900">Pipeline</h3>
          <p className="text-2xl font-bold text-blue-500">
            {calculatedStats.totalStats?.pipelineCount || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Active deals</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900">Lost Deals</h3>
          <p className="text-2xl font-bold text-red-500">
            {calculatedStats.totalStats?.lostDealsCount || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">{formatUGX(calculatedStats.totalStats?.lostValue || 0)}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900">Win Rate</h3>
          <p className="text-2xl font-bold text-purple-500">
            {calculatedStats?.totalStats?.winRate || 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Won / Total</p>
        </motion.div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex gap-4 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search deals..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Stage Filter */}
            <select
              value={filters.stage}
              onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Stages</option>
              <option value="lead">Lead</option>
              <option value="qualification">Qualification</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>

            {/* Value Range Filter */}
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min UGX"
                value={filters.minValue}
                onChange={(e) => setFilters(prev => ({ ...prev, minValue: e.target.value }))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max UGX"
                value={filters.maxValue}
                onChange={(e) => setFilters(prev => ({ ...prev, maxValue: e.target.value }))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {/* Clear Filters Button */}
            {(filters.search || filters.stage || filters.minValue || filters.maxValue) && (
              <button
                onClick={() => setFilters({ search: '', stage: '', minValue: '', maxValue: '' })}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}

            <button
              onClick={() => setView('table')}
              className={`p-2 rounded-lg ${view === 'table' ? 'bg-orange-100 text-orange-500' : 'text-gray-500'}`}
            >
              <Table size={20} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`p-2 rounded-lg ${view === 'kanban' ? 'bg-orange-100 text-orange-500' : 'text-gray-500'}`}
            >
              <Kanban size={20} />
            </button>
            <button
              onClick={() => setView('charts')}
              className={`p-2 rounded-lg ${view === 'charts' ? 'bg-orange-100 text-orange-500' : 'text-gray-500'}`}
            >
              <BarChart3 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content View */}
      {view === 'table' && (
        <>
          {displayDeals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">
                {deals.length === 0 
                  ? 'No deals found' 
                  : (filters.search || filters.stage || filters.minValue || filters.maxValue)
                    ? 'No deals match your filters'
                    : 'No active deals in pipeline'
                }
              </div>
              <p className="text-gray-400 text-sm">
                {deals.length === 0 
                  ? 'Create your first deal to get started'
                  : (filters.search || filters.stage || filters.minValue || filters.maxValue)
                    ? 'Try adjusting your filters'
                    : 'All deals are either won or lost'
                }
              </p>
              {(filters.search || filters.stage || filters.minValue || filters.maxValue) && (
                <button
                  onClick={() => setFilters({ search: '', stage: '', minValue: '', maxValue: '' })}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <DealsTableView deals={displayDeals} onUpdateStage={handleUpdateDealStage} onDeleteDeal={handleDeleteDeal} formatUGX={formatUGX} />
            </>
          )}
        </>
      )}
      {view === 'kanban' && (
        displayDeals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              {deals.length === 0 
                ? 'No deals found' 
                : (filters.search || filters.stage || filters.minValue || filters.maxValue)
                  ? 'No deals match your filters'
                  : 'No active deals in pipeline'
              }
            </div>
            <p className="text-gray-400 text-sm">
              {deals.length === 0 
                ? 'Create your first deal to get started'
                : (filters.search || filters.stage || filters.minValue || filters.maxValue)
                  ? 'Try adjusting your filters'
                  : 'All deals are either won or lost'
              }
            </p>
            {(filters.search || filters.stage || filters.minValue || filters.maxValue) && (
              <button
                onClick={() => setFilters({ search: '', stage: '', minValue: '', maxValue: '' })}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <DealsKanbanView deals={displayDeals} onUpdateStage={handleUpdateDealStage} formatUGX={formatUGX} />
        )
      )}
      {view === 'charts' && <DealsChartsView stats={calculatedStats} formatUGX={formatUGX} />}

      {/* Create Deal Modal */}
      {showCreateModal && (
        <CreateDealModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDeal}
          clients={clients}
          onClientSearch={loadClients}
          error={error}
        />
      )}
    </div>
  );
};

// Table View Component
const DealsTableView = ({ deals, onUpdateStage, onDeleteDeal, formatUGX }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deals.map((deal) => (
              <tr key={deal._id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{deal.title}</div>
                  <div className="text-sm text-gray-500">{deal.description?.substring(0, 50)}...</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{deal.client?.name || 'N/A'}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{formatUGX(deal.value)}</div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={deal.stage}
                    onChange={(e) => onUpdateStage(deal._id, e.target.value)}
                    className="text-xs font-medium px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="lead">Lead</option>
                    <option value="qualification">Qualification</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${STAGE_PROBABILITY[deal.stage] ?? deal.probability ?? 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{STAGE_PROBABILITY[deal.stage] ?? deal.probability ?? 0}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onDeleteDeal(deal._id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {deals.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No deals found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Kanban View Component
const DealsKanbanView = ({ deals, onUpdateStage, formatUGX }) => {
  const stages = ['lead', 'qualification', 'proposal', 'negotiation'];

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    onUpdateStage(draggableId, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage);
          return (
            <div key={stage} className="bg-gray-50 rounded-xl p-4 min-h-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 capitalize">{stage}</h3>
                <span className="text-xs font-medium bg-white px-2 py-1 rounded-full text-gray-600">{stageDeals.length}</span>
              </div>
              <Droppable droppableId={stage}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 min-h-[200px]">
                    {stageDeals.map((deal, index) => (
                      <Draggable key={deal._id} draggableId={String(deal._id)} index={index}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 ${snapshot.isDragging ? 'ring-2 ring-orange-300 shadow-lg' : ''}`}
                          >
                            <p className="font-medium text-sm text-gray-900">{deal.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{formatUGX(deal.value)}</p>
                            {deal.client?.name && (
                              <p className="text-xs text-gray-500 mt-1 truncate">{deal.client.name}</p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

// Charts View Component
const DealsChartsView = ({ stats, formatUGX }) => {
  if (!stats || !stats.stageStats) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
        <p>No deal data available</p>
      </div>
    );
  }

  // Filter out stages with no deals
  const activeStageStats = stats.stageStats.filter(s => s.count > 0);
  const pieData = activeStageStats.map(s => ({ name: s._id, value: s.count }));
  const barData = activeStageStats.map(s => ({ stage: s._id, value: s.totalValue || 0 }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Deal Statistics (All Deals)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Win Rate</h4>
          <div className="text-3xl font-bold text-purple-600">
            {stats?.totalStats?.winRate ?? 0}%
          </div>
          <div className="text-xs text-gray-600 mt-3 space-y-1">
            <div>Won: {stats?.totalStats?.wonDealsCount || 0} deals</div>
            <div>Total: {stats?.totalStats?.totalDeals || 0} deals</div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <DonutChart
            data={pieData}
            title="Deals by Stage"
            height={220}
            innerRadius={50}
            outerRadius={75}
            showLegend={false}
            emptyMessage="No stage data"
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Total Value by Stage</h4>
          {barData.length > 0 ? (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ReTooltip formatter={(value) => formatUGX(value)} />
                  <Bar dataKey="value" fill="#ff7a45" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">No value data</div>
          )}
        </div>
      </div>

      {/* Additional stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div>
          <div className="text-xs text-gray-600 mb-1">Pipeline Deals</div>
          <div className="text-2xl font-bold text-blue-600">{stats?.totalStats?.pipelineCount || 0}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Won Deals Value</div>
          <div className="text-lg font-bold text-green-600">{formatUGX(stats?.totalStats?.wonValue || 0)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Lost Deals Value</div>
          <div className="text-lg font-bold text-red-600">{formatUGX(stats?.totalStats?.lostValue || 0)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Total Pipeline Value</div>
          <div className="text-lg font-bold text-purple-600">
            {formatUGX(stats?.totalStats?.totalValue - (stats?.totalStats?.wonValue || 0) - (stats?.totalStats?.lostValue || 0) || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Deal Modal Component
// Auto-calculate probability from stage per spec
const STAGE_PROBABILITY = {
  lead: 10,
  qualification: 25,
  proposal: 50,
  negotiation: 75,
  won: 100,
  lost: 0,
};

const CreateDealModal = ({ onClose, onSubmit, clients, onClientSearch, error }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    client: '',
    agent: user?._id || user?.id || '',
    stage: 'lead',
    dealType: 'new',
    probability: STAGE_PROBABILITY['lead'],
    expectedCloseDate: '',
  });
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (clientSearch) {
      const delayDebounceFn = setTimeout(() => {
        onClientSearch(clientSearch);
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [clientSearch, onClientSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title || !formData.value || !formData.client || !formData.agent) {
      setFormError('Please fill in all required fields: Title, Value, Client, and Agent');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        value: parseFloat(formData.value),
        probability: STAGE_PROBABILITY[formData.stage] ?? 0,
        dealType: formData.dealType,
        expectedCloseDate: formData.expectedCloseDate || null
      });
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleClientSelect = (client) => {
    setFormData(prev => ({ ...prev, client: client._id }));
    setClientSearch(client.name || client.companyName);
    setShowClientDropdown(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Deal</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {(error || formError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{formError || error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deal Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter deal title"
              />
            </div>
            
            {/* Deal Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Value *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.value}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setFormData(prev => ({ ...prev, value: Number.isNaN(val) ? '' : Math.max(0, val) }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter amount in UGX"
              />
            </div>
            
            {/* Client Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Search for client..."
                />
                
                {showClientDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <div
                          key={client._id}
                          onClick={() => handleClientSelect(client)}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {client.companyName || client.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {client.email} • {client.phone}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        {clientSearch ? 'No clients found' : 'Start typing to search clients'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Stage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => {
                  const stage = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    stage,
                    probability: STAGE_PROBABILITY[stage] ?? prev.probability
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="lead">Lead</option>
                <option value="qualification">Qualification</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
              </select>
            </div>

            {/* Deal Type — Existing vs New (spec requirement) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Type
              </label>
              <select
                value={formData.dealType}
                onChange={(e) => setFormData(prev => ({ ...prev, dealType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="new">New Business</option>
                <option value="existing">Existing Client</option>
              </select>
            </div>

            {/* Probability — auto-calculated, read-only display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Probability (%) — auto-calculated
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-gray-700 font-semibold">
                  {formData.probability}%
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${formData.probability}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Set automatically based on stage</p>
            </div>
            
            {/* Expected Close Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Close Date
              </label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Describe the deal..."
            />
          </div>
          
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Create Deal
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Deals;
