import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Users, UserPlus, UserMinus, X, Search, PhoneCall, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Assign Agents Modal ───────────────────────────────────────────────────────
const AssignAgentsModal = ({ territory, onClose, onUpdated }) => {
  const [allAgents, setAllAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null); // userId being saved

  const assignedIds = new Set(
    (territory.assignedAgents || [])
      .filter(a => a.isActive)
      .map(a => String(a.user?._id || a.user))
  );

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users', { params: { role: 'agent', limit: 200 } });
        setAllAgents(res.data.users || res.data || []);
      } catch { toast.error('Failed to load agents'); }
      finally { setLoading(false); }
    };
    fetchAgents();
  }, []);

  const handleAssign = async (userId) => {
    setSaving(userId);
    try {
      await api.post(`/territories/${territory._id}/assign-agent`, { userId });
      toast.success('Agent assigned');
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign agent');
    } finally { setSaving(null); }
  };

  const handleRemove = async (userId) => {
    setSaving(userId);
    try {
      await api.post(`/territories/${territory._id}/remove-agent`, { userId });
      toast.success('Agent removed');
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove agent');
    } finally { setSaving(null); }
  };

  const filtered = allAgents.filter(a =>
    !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Manage Agents</h2>
            <p className="text-xs text-gray-500 mt-0.5">{territory.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search agents by name or email..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="py-8 text-center text-gray-500 text-sm">Loading agents...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No agents found</div>
          ) : (
            filtered.map(agent => {
              const isAssigned = assignedIds.has(String(agent._id));
              const isSaving = saving === String(agent._id);
              return (
                <div key={agent._id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isAssigned ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isAssigned ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {agent.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{agent.name}</p>
                      <p className="text-xs text-gray-500 truncate">{agent.email}</p>
                    </div>
                  </div>
                  <button
                    disabled={isSaving}
                    onClick={() => isAssigned ? handleRemove(String(agent._id)) : handleAssign(String(agent._id))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ml-2 ${
                      isAssigned
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    } disabled:opacity-50`}
                  >
                    {isSaving ? '...' : isAssigned
                      ? <><UserMinus className="w-3 h-3" /> Remove</>
                      : <><UserPlus className="w-3 h-3" /> Assign</>
                    }
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 shrink-0 text-xs text-gray-500 text-center">
          {assignedIds.size} agent{assignedIds.size !== 1 ? 's' : ''} assigned to this territory
        </div>
      </motion.div>
    </div>
  );
};

// ── Create Territory Modal ────────────────────────────────────────────────────
const CreateTerritoryModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const searchLocation = async () => {
    if (searchQuery.trim().length < 2) { toast.error('Enter at least 2 characters'); return; }
    setSearching(true);
    try {
      const res = await api.get(`/territories/search-location?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.locations || []);
      if (!res.data.locations?.length) toast.error('No locations found — try a different term');
    } catch { toast.error('Location search failed'); }
    finally { setSearching(false); }
  };

  const handleCreate = async () => {
    if (!form.name) { toast.error('Territory name is required'); return; }
    if (!selectedLocation) { toast.error('Please select a location'); return; }
    setCreating(true);
    try {
      await api.post('/territories', {
        ...form,
        location: selectedLocation,
        region: selectedLocation.address?.region,
        district: selectedLocation.address?.district,
      });
      toast.success('Territory created');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create territory');
    } finally { setCreating(false); }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Create Territory</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Territory Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Kampala Central" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Optional notes" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search Location (Uganda) *</label>
            <div className="flex gap-2">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchLocation()}
                placeholder="e.g. Kampala, Mukono, Entebbe" className={`${inputCls} flex-1`} />
              <button onClick={searchLocation} disabled={searching}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 shrink-0">
                {searching ? '...' : 'Search'}
              </button>
            </div>
          </div>
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-xl divide-y divide-gray-100">
              {searchResults.map((loc, i) => (
                <button key={i} onClick={() => { setSelectedLocation(loc); setSearchResults([]); }}
                  className="w-full text-left p-3 hover:bg-primary-50 transition-colors">
                  <p className="text-sm font-medium text-gray-800">{loc.displayName}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</p>
                </button>
              ))}
            </div>
          )}
          {selectedLocation && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-green-800 font-medium">{selectedLocation.displayName}</span>
            </div>
          )}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !form.name || !selectedLocation}
              className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Territory'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ── Territory Card ────────────────────────────────────────────────────────────
const TerritoryCard = ({ territory, onManageAgents, onUpdate }) => {
  const activeAgents = (territory.assignedAgents || []).filter(a => a.isActive);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{territory.name}</h3>
            <p className="text-xs text-gray-500">{territory.region || 'Uganda'}{territory.district ? ` · ${territory.district}` : ''}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${territory.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {territory.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Location */}
      {territory.location?.displayName && (
        <p className="text-xs text-gray-500 mb-3 truncate">📍 {territory.location.displayName}</p>
      )}

      {/* Stats */}
      {territory.stats && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-primary-600">{territory.stats.totalClients || 0}</p>
            <p className="text-xs text-gray-500">Clients</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-green-600">{territory.stats.totalDeals || 0}</p>
            <p className="text-xs text-gray-500">Deals</p>
          </div>
        </div>
      )}

      {/* Assigned agents */}
      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
            <Users className="w-3.5 h-3.5" />
            {activeAgents.length} Agent{activeAgents.length !== 1 ? 's' : ''}
          </div>
          <button onClick={() => onManageAgents(territory)}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-semibold">
            <UserPlus className="w-3.5 h-3.5" /> Manage
          </button>
        </div>
        {activeAgents.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeAgents.slice(0, 4).map(a => (
              <div key={String(a.user?._id || a.user)} className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {(a.user?.name || '?').charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-gray-700">{a.user?.name || 'Agent'}</span>
              </div>
            ))}
            {activeAgents.length > 4 && (
              <span className="text-xs text-gray-400 px-2 py-0.5">+{activeAgents.length - 4} more</span>
            )}
          </div>
        )}
        {activeAgents.length === 0 && (
          <p className="text-xs text-gray-400 italic">No agents assigned yet</p>
        )}
      </div>
    </motion.div>
  );
};

// ── Main Territories Page ─────────────────────────────────────────────────────
const Territories = () => {
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [manageTerritory, setManageTerritory] = useState(null);

  const fetchTerritories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/territories');
      setTerritories(res.data.territories || []);
    } catch { toast.error('Failed to load territories'); }
    finally { setLoading(false); }
  };

  // Refresh single territory after agent assignment so card updates without full reload
  const refreshTerritory = async (territoryId) => {
    try {
      const res = await api.get(`/territories/${territoryId}`);
      const updated = res.data.territory;
      setTerritories(prev => prev.map(t => t._id === territoryId ? updated : t));
      if (manageTerritory?._id === territoryId) setManageTerritory(updated);
    } catch { fetchTerritories(); }
  };

  useEffect(() => { fetchTerritories(); }, []);

  const stats = {
    total: territories.length,
    active: territories.filter(t => t.isActive).length,
    totalAgents: territories.reduce((sum, t) => sum + (t.assignedAgents?.filter(a => a.isActive).length || 0), 0),
    unassigned: territories.filter(t => !t.assignedAgents?.some(a => a.isActive)).length,
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Territories', value: stats.total, color: 'text-gray-900' },
          { label: 'Active', value: stats.active, color: 'text-green-600' },
          { label: 'Total Agents Placed', value: stats.totalAgents, color: 'text-primary-600' },
          { label: 'Unassigned', value: stats.unassigned, color: 'text-yellow-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{territories.length} territory areas defined</p>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Create Territory
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading territories...</p>
        </div>
      ) : territories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <MapPin className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No territories yet</h3>
          <p className="text-gray-400 text-sm mb-5">Create your first territory and assign agents to it.</p>
          <button onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium">
            Create Territory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {territories.map(t => (
            <TerritoryCard
              key={t._id}
              territory={t}
              onManageAgents={setManageTerritory}
              onUpdate={fetchTerritories}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTerritoryModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => { setShowCreateModal(false); fetchTerritories(); }}
          />
        )}
        {manageTerritory && (
          <AssignAgentsModal
            territory={manageTerritory}
            onClose={() => setManageTerritory(null)}
            onUpdated={() => refreshTerritory(manageTerritory._id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Territories;
