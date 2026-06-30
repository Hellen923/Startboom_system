import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Users, Target, RefreshCw, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { usersAPI, clientsAPI, dealsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const BulkOperations = () => {
  const [activeTab, setActiveTab] = useState('transfer');
  const [agents, setAgents] = useState([]);
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Transfer state
  const [fromAgent, setFromAgent] = useState('');
  const [toAgent, setToAgent] = useState('');
  const [transferType, setTransferType] = useState('both');

  // Bulk status update state
  const [selectedClients, setSelectedClients] = useState([]);
  const [newClientStatus, setNewClientStatus] = useState('active');
  const [clientSearch, setClientSearch] = useState('');

  // Bulk deal stage update state
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [newDealStage, setNewDealStage] = useState('qualification');
  const [dealSearch, setDealSearch] = useState('');

  // Workload stats
  const [workloadStats, setWorkloadStats] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, clientsRes, dealsRes] = await Promise.all([
        usersAPI.getAll(),
        clientsAPI.getAll({ limit: 500 }),
        dealsAPI.getAll({ limit: 500 })
      ]);

      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
      const agentsList = allUsers.filter(u => u.role === 'agent');
      const clientsList = clientsRes.data?.clients || clientsRes.data || [];
      const dealsList = dealsRes.data?.deals || dealsRes.data || [];

      setAgents(agentsList);
      setClients(Array.isArray(clientsList) ? clientsList : []);
      setDeals(Array.isArray(dealsList) ? dealsList : []);

      // Calculate workload stats
      const stats = agentsList.map(agent => {
        const agentClients = clientsList.filter(c =>
          c.agent?._id === agent._id || c.agent === agent._id
        );
        const agentDeals = dealsList.filter(d =>
          d.agent?._id === agent._id || d.agent === agent._id
        );
        return {
          ...agent,
          clientCount: agentClients.length,
          dealCount: agentDeals.length,
          total: agentClients.length + agentDeals.length
        };
      }).sort((a, b) => b.total - a.total);

      setWorkloadStats(stats);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Transfer all records from one agent to another
  const handleTransfer = async () => {
    if (!fromAgent || !toAgent) return toast.error('Please select both agents');
    if (fromAgent === toAgent) return toast.error('Cannot transfer to the same agent');

    try {
      setProcessing(true);
      let clientsTransferred = 0;
      let dealsTransferred = 0;

      if (transferType === 'clients' || transferType === 'both') {
        const agentClients = clients.filter(c =>
          c.agent?._id === fromAgent || c.agent === fromAgent
        );
        await Promise.all(agentClients.map(c =>
          clientsAPI.update(c._id, { agent: toAgent })
        ));
        clientsTransferred = agentClients.length;
      }

      if (transferType === 'deals' || transferType === 'both') {
        const agentDeals = deals.filter(d =>
          d.agent?._id === fromAgent || d.agent === fromAgent
        );
        await Promise.all(agentDeals.map(d =>
          dealsAPI.update(d._id, { agent: toAgent })
        ));
        dealsTransferred = agentDeals.length;
      }

      toast.success(`Transferred ${clientsTransferred} clients and ${dealsTransferred} deals successfully!`);
      setFromAgent('');
      setToAgent('');
      loadData();
    } catch (error) {
      toast.error('Transfer failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Bulk update client status
  const handleBulkClientStatus = async () => {
    if (selectedClients.length === 0) return toast.error('Please select clients to update');
    try {
      setProcessing(true);
      await Promise.all(selectedClients.map(id =>
        clientsAPI.update(id, { status: newClientStatus })
      ));
      toast.success(`Updated ${selectedClients.length} clients to ${newClientStatus}`);
      setSelectedClients([]);
      loadData();
    } catch (error) {
      toast.error('Failed to update clients');
    } finally {
      setProcessing(false);
    }
  };

  // Bulk update deal stage
  const handleBulkDealStage = async () => {
    if (selectedDeals.length === 0) return toast.error('Please select deals to update');
    try {
      setProcessing(true);
      await Promise.all(selectedDeals.map(id =>
        dealsAPI.update(id, { stage: newDealStage })
      ));
      toast.success(`Updated ${selectedDeals.length} deals to ${newDealStage}`);
      setSelectedDeals([]);
      loadData();
    } catch (error) {
      toast.error('Failed to update deals');
    } finally {
      setProcessing(false);
    }
  };

  const tabs = [
    { id: 'transfer', label: 'Transfer Records', icon: ArrowLeftRight },
    { id: 'workload', label: 'Workload Balance', icon: Users },
    { id: 'clientStatus', label: 'Bulk Client Status', icon: CheckCircle },
    { id: 'dealStage', label: 'Bulk Deal Stage', icon: Target },
  ];

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredDeals = deals.filter(d =>
    d.title?.toLowerCase().includes(dealSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={loadData}
          className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-1 px-4 min-w-min">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">

          {/* Tab 1: Transfer Records */}
          {activeTab === 'transfer' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Transfer Records Between Agents</h3>
                <p className="text-sm text-gray-500">Move all clients and/or deals from one agent to another. Original history is preserved.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Agent</label>
                  <select
                    value={fromAgent}
                    onChange={e => setFromAgent(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select agent</option>
                    {agents.map(a => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({clients.filter(c => c.agent?._id === a._id || c.agent === a._id).length} clients, {deals.filter(d => d.agent?._id === a._id || d.agent === a._id).length} deals)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Agent</label>
                  <select
                    value={toAgent}
                    onChange={e => setToAgent(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select agent</option>
                    {agents.filter(a => a._id !== fromAgent).map(a => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Type</label>
                  <select
                    value={transferType}
                    onChange={e => setTransferType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="both">Clients & Deals</option>
                    <option value="clients">Clients Only</option>
                    <option value="deals">Deals Only</option>
                  </select>
                </div>
              </div>

              {fromAgent && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-sm text-orange-800 font-medium">Transfer Summary:</p>
                  <p className="text-sm text-orange-700 mt-1">
                    {transferType !== 'deals' && `${clients.filter(c => c.agent?._id === fromAgent || c.agent === fromAgent).length} clients`}
                    {transferType === 'both' && ' and '}
                    {transferType !== 'clients' && `${deals.filter(d => d.agent?._id === fromAgent || d.agent === fromAgent).length} deals`}
                    {' '}will be transferred to {agents.find(a => a._id === toAgent)?.name || 'selected agent'}
                  </p>
                </div>
              )}

              <button
                onClick={handleTransfer}
                disabled={processing || !fromAgent || !toAgent}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>{processing ? 'Transferring...' : 'Transfer Records'}</span>
              </button>
            </motion.div>
          )}

          {/* Tab 2: Workload Balance */}
          {activeTab === 'workload' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Agent Workload Overview</h3>
                <p className="text-sm text-gray-500">See how work is distributed across your team and rebalance if needed.</p>
              </div>

              <div className="space-y-3">
                {workloadStats.map((agent, index) => {
                  const maxTotal = Math.max(...workloadStats.map(a => a.total), 1);
                  const percentage = Math.round((agent.total / maxTotal) * 100);
                  return (
                    <div key={agent._id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-xs">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{agent.name}</p>
                            <p className="text-xs text-gray-500">{agent.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{agent.clientCount} clients · {agent.dealCount} deals</p>
                          <p className="text-xs text-gray-500">Total: {agent.total} records</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${percentage > 75 ? 'bg-red-500' : percentage > 50 ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      {percentage > 75 && (
                        <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>High workload - consider transferring some records</span>
                        </p>
                      )}
                    </div>
                  );
                })}
                {workloadStats.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No agents found</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Tab 3: Bulk Client Status */}
          {activeTab === 'clientStatus' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Bulk Update Client Status</h3>
                  <p className="text-sm text-gray-500">Select multiple clients and update their status at once.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={newClientStatus}
                    onChange={e => setNewClientStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="prospect">Prospect</option>
                    <option value="active">Active</option>
                    <option value="vip">VIP</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <button
                    onClick={handleBulkClientStatus}
                    disabled={processing || selectedClients.length === 0}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Updating...' : `Update ${selectedClients.length} Clients`}
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                  onChange={e => setSelectedClients(e.target.checked ? filteredClients.map(c => c._id) : [])}
                  className="rounded border-gray-300 text-orange-500"
                />
                <span className="text-sm text-gray-600">Select all ({filteredClients.length})</span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                {filteredClients.map(client => (
                  <div key={client._id} className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client._id)}
                      onChange={e => setSelectedClients(prev =>
                        e.target.checked ? [...prev, client._id] : prev.filter(id => id !== client._id)
                      )}
                      className="rounded border-gray-300 text-orange-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'vip' ? 'bg-purple-100 text-purple-700' :
                      client.status === 'active' ? 'bg-green-100 text-green-700' :
                      client.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {client.status}
                    </span>
                  </div>
                ))}
                {filteredClients.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No clients found</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Tab 4: Bulk Deal Stage */}
          {activeTab === 'dealStage' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Bulk Update Deal Stage</h3>
                  <p className="text-sm text-gray-500">Select multiple deals and move them to a new stage at once.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={newDealStage}
                    onChange={e => setNewDealStage(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="lead">Lead</option>
                    <option value="qualification">Qualification</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                  <button
                    onClick={handleBulkDealStage}
                    disabled={processing || selectedDeals.length === 0}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Updating...' : `Update ${selectedDeals.length} Deals`}
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={dealSearch}
                  onChange={e => setDealSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={selectedDeals.length === filteredDeals.length && filteredDeals.length > 0}
                  onChange={e => setSelectedDeals(e.target.checked ? filteredDeals.map(d => d._id) : [])}
                  className="rounded border-gray-300 text-orange-500"
                />
                <span className="text-sm text-gray-600">Select all ({filteredDeals.length})</span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                {filteredDeals.map(deal => (
                  <div key={deal._id} className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <input
                      type="checkbox"
                      checked={selectedDeals.includes(deal._id)}
                      onChange={e => setSelectedDeals(prev =>
                        e.target.checked ? [...prev, deal._id] : prev.filter(id => id !== deal._id)
                      )}
                      className="rounded border-gray-300 text-orange-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{deal.title}</p>
                      <p className="text-xs text-gray-500">UGX {Number(deal.value || 0).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      deal.stage === 'won' ? 'bg-green-100 text-green-700' :
                      deal.stage === 'lost' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {deal.stage}
                    </span>
                  </div>
                ))}
                {filteredDeals.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No deals found</p>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BulkOperations;
