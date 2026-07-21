import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, DollarSign, Users, TrendingUp, Save, X, Edit2, CheckCircle } from 'lucide-react';
import { usersAPI, performanceAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Targets = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState(null);
  const [targetValues, setTargetValues] = useState({
    monthlyTargetDeals: '',
    monthlyTargetAmount: '',
    monthlyTargetClients: ''
  });
  const [commissionValue, setCommissionValue] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll({ role: 'agent', limit: 1000 });
      const agentList = response.data.users || response.data || [];
      
      // Load performance stats for each agent
      const agentsWithStats = await Promise.all(
        agentList.map(async (agent) => {
          try {
            const perfResponse = await performanceAPI.getAgentStats(agent._id);
            return {
              ...agent,
              monthlyTarget: perfResponse.data.monthlyTarget || agent.monthlyTargetAmount || 0,
              commissionRate: perfResponse.data.commissionRate || agent.commissionRate || 0,
              monthlySales: perfResponse.data.monthlySales || 0,
              commissionEarned: perfResponse.data.commissionEarned || 0,
              monthlyTargetDeals: agent.monthlyTargetDeals || perfResponse.data.monthlyTargetDeals || 0,
              monthlyTargetAmount: agent.monthlyTargetAmount || perfResponse.data.monthlyTargetAmount || 0,
              monthlyTargetClients: agent.monthlyTargetClients || perfResponse.data.monthlyTargetClients || 0,
            };
          } catch (error) {
            return {
              ...agent,
              monthlyTarget: agent.monthlyTargetAmount || 0,
              commissionRate: agent.commissionRate || 0,
              monthlySales: 0,
              commissionEarned: 0,
              monthlyTargetDeals: agent.monthlyTargetDeals || 0,
              monthlyTargetAmount: agent.monthlyTargetAmount || 0,
              monthlyTargetClients: agent.monthlyTargetClients || 0,
            };
          }
        })
      );

      setAgents(agentsWithStats);
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTarget = (agent) => {
    setEditingAgent(agent._id);
    setTargetValues({
      monthlyTargetDeals: agent.monthlyTargetDeals || '',
      monthlyTargetAmount: agent.monthlyTarget || agent.monthlyTargetAmount || '',
      monthlyTargetClients: agent.monthlyTargetClients || ''
    });
    setCommissionValue(agent.commissionRate || '');
  };

  const handleSaveTarget = async (agentId) => {
    try {
      const dealsNum = targetValues.monthlyTargetDeals ? Number(targetValues.monthlyTargetDeals) : undefined;
      const amountNum = targetValues.monthlyTargetAmount ? Number(targetValues.monthlyTargetAmount) : undefined;
      const clientsNum = targetValues.monthlyTargetClients ? Number(targetValues.monthlyTargetClients) : undefined;
      const commissionNum = Number(commissionValue);

      // Validate numeric inputs
      if (dealsNum !== undefined && (isNaN(dealsNum) || dealsNum < 0)) {
        toast.error('Please enter a valid deals target');
        return;
      }

      if (amountNum !== undefined && (isNaN(amountNum) || amountNum < 0)) {
        toast.error('Please enter a valid amount target');
        return;
      }

      if (clientsNum !== undefined && (isNaN(clientsNum) || clientsNum < 0)) {
        toast.error('Please enter a valid clients target');
        return;
      }

      if (isNaN(commissionNum) || commissionNum < 0 || commissionNum > 100) {
        toast.error('Commission rate must be between 0 and 100');
        return;
      }

      // Save all 3 target fields
      const targetData = {};
      if (dealsNum !== undefined) targetData.monthlyTargetDeals = dealsNum;
      if (amountNum !== undefined) {
        targetData.monthlyTargetAmount = amountNum;
        targetData.monthlyTarget = amountNum; // Keep both for backwards compatibility
      }
      if (clientsNum !== undefined) targetData.monthlyTargetClients = clientsNum;

      if (Object.keys(targetData).length > 0) {
        await usersAPI.setTargets(agentId, targetData);
      }

      // Save commission
      if (commissionValue !== '') {
        await usersAPI.setCommission(agentId, { commissionRate: commissionNum });
      }

      toast.success('Updated successfully!');
      setEditingAgent(null);
      setTargetValues({
        monthlyTargetDeals: '',
        monthlyTargetAmount: '',
        monthlyTargetClients: ''
      });
      setCommissionValue('');
      
      // Reload data
      loadAgents();
    } catch (error) {
      console.error('Error saving target/commission:', error);
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  };

  const handleCancelEdit = () => {
    setEditingAgent(null);
    setTargetValues({
      monthlyTargetDeals: '',
      monthlyTargetAmount: '',
      monthlyTargetClients: ''
    });
    setCommissionValue('');
  };

  const formatCurrency = (amount) => {
    return `UGX ${Number(amount || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
  };

  const calculateProgress = (achieved, target) => {
    if (target === 0) return 0;
    return Math.min((achieved / target) * 100, 100);
  };

  // Calculate summary stats
  const summary = {
    totalAgents: agents.length,
    agentsWithTargets: agents.filter(a => a.monthlyTarget > 0).length,
    totalCommissionPaid: agents.reduce((sum, a) => sum + (a.commissionEarned || 0), 0),
    avgTargetAchievement: agents.length > 0
      ? agents.reduce((sum, a) => {
          if (a.monthlyTarget === 0) return sum;
          return sum + calculateProgress(a.monthlySales, a.monthlyTarget);
        }, 0) / agents.filter(a => a.monthlyTarget > 0).length || 0
      : 0,
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="w-7 h-7 text-primary-600" />
          Targets & Commission
        </h1>
        <p className="text-gray-600 mt-1">Set monthly sales targets and commission rates for your agents</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{summary.totalAgents}</p>
            </div>
            <div className="p-3 bg-[#FEF3C7] rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With Targets</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{summary.agentsWithTargets}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Achievement</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{summary.avgTargetAchievement.toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-[#FEF3C7] rounded-full">
              <TrendingUp className="w-6 h-6 text-[var(--primary-hover)]" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commission</p>
              <p className="text-lg font-bold text-gray-900 mt-2">{formatCurrency(summary.totalCommissionPaid)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Agents Table - Grouped by Department */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Agent Targets & Performance</h2>
        </div>

        {agents.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No agents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent & Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deals Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clients Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales This Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission Earned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  // Group agents by department
                  const grouped = agents.reduce((acc, agent) => {
                    const deptName = agent.department?.name || 'Unassigned';
                    if (!acc[deptName]) acc[deptName] = [];
                    acc[deptName].push(agent);
                    return acc;
                  }, {});

                  return Object.entries(grouped).map(([deptName, deptAgents]) => (
                    <React.Fragment key={deptName}>
                      {/* Department Header */}
                      <tr className="bg-gray-50">
                        <td colSpan="9" className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-600" />
                            <span className="font-semibold text-gray-900">{deptName}</span>
                            <span className="text-sm text-gray-500">({deptAgents.length} agents)</span>
                          </div>
                        </td>
                      </tr>
                      {/* Agent Rows */}
                      {deptAgents.map((agent) => {
                        const progress = calculateProgress(agent.monthlySales, agent.monthlyTarget);
                        const isEditing = editingAgent === agent._id;

                        return (
                          <tr key={agent._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                                <div className="text-sm text-gray-500">{agent.email}</div>
                                {agent.team?.name && (
                                  <div className="text-xs text-gray-400 mt-1">Team: {agent.team.name}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={targetValues.monthlyTargetDeals}
                                  onChange={(e) => setTargetValues({...targetValues, monthlyTargetDeals: e.target.value})}
                                  placeholder="Deals"
                                  className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                              ) : (
                                <div className="text-sm font-medium text-gray-900">
                                  {agent.monthlyTargetDeals > 0 ? agent.monthlyTargetDeals : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={targetValues.monthlyTargetAmount}
                                  onChange={(e) => setTargetValues({...targetValues, monthlyTargetAmount: e.target.value})}
                                  placeholder="Amount"
                                  className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                              ) : (
                                <div className="text-sm font-medium text-gray-900">
                                  {agent.monthlyTarget > 0 ? formatCurrency(agent.monthlyTarget) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={targetValues.monthlyTargetClients}
                                  onChange={(e) => setTargetValues({...targetValues, monthlyTargetClients: e.target.value})}
                                  placeholder="Clients"
                                  className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                              ) : (
                                <div className="text-sm font-medium text-gray-900">
                                  {agent.monthlyTargetClients > 0 ? agent.monthlyTargetClients : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(agent.monthlySales)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {agent.monthlyTarget > 0 ? (
                                <div className="w-full">
                                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                    <span>{progress.toFixed(0)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        progress >= 100 ? 'bg-green-500' :
                                        progress >= 50 ? 'bg-blue-500' : 'bg-orange-400'
                                      }`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={commissionValue}
                                  onChange={(e) => setCommissionValue(e.target.value)}
                                  placeholder="Enter %"
                                  min="0"
                                  max="100"
                                  className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                              ) : (
                                <div className="text-sm font-medium text-gray-900">
                                  {agent.commissionRate > 0 ? `${agent.commissionRate}%` : (
                                    <span className="text-gray-400">Not set</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              {formatCurrency(agent.commissionEarned)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleSaveTarget(agent._id)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                  >
                                    <CheckCircle size={16} />
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                                  >
                                    <X size={16} />
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditTarget(agent)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg font-medium transition-colors"
                                >
                                  <Edit2 size={16} />
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Targets;
