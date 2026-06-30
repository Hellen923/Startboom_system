import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Search, Users } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Territories = () => {
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTerritories();
  }, []);

  const fetchTerritories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/territories');
      setTerritories(response.data.territories || []);
    } catch (error) {
      console.error('Error fetching territories:', error);
      toast.error('Failed to load territories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Territories</h1>
          <p className="text-gray-600 mt-1">Manage agent locations and assignments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Territory
        </button>
      </div>

      {/* Territories Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading territories...</p>
        </div>
      ) : territories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No territories yet</h3>
          <p className="text-gray-600 mb-6">Create your first territory to assign agents</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg"
          >
            Create Territory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {territories.map((territory) => (
            <TerritoryCard
              key={territory._id}
              territory={territory}
              onUpdate={fetchTerritories}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTerritoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTerritories();
          }}
        />
      )}
    </div>
  );
};

// Territory Card Component
const TerritoryCard = ({ territory, onUpdate }) => {
  const activeAgents = territory.assignedAgents?.filter(a => a.isActive) || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-primary-100 rounded-lg mr-3">
            <MapPin className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{territory.name}</h3>
            <p className="text-sm text-gray-600">{territory.region || 'Uganda'}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            territory.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {territory.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {territory.location && (
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-1">📍 {territory.location.displayName}</p>
          {territory.district && (
            <p className="text-xs text-gray-500">District: {territory.district}</p>
          )}
        </div>
      )}

      <div className="flex items-center text-sm text-gray-600 mb-4">
        <Users className="w-4 h-4 mr-1" />
        <span>{activeAgents.length} Agent{activeAgents.length !== 1 ? 's' : ''}</span>
      </div>

      {territory.stats && (
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
          <div>
            <div className="text-2xl font-bold text-primary-600">{territory.stats.totalClients || 0}</div>
            <div className="text-xs text-gray-600">Clients</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{territory.stats.totalDeals || 0}</div>
            <div className="text-xs text-gray-600">Deals</div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Create Territory Modal Component
const CreateTerritoryModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearchLocation = async () => {
    if (searchQuery.length < 2) {
      toast.error('Search query too short');
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/territories/search-location?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.locations || []);
      if (response.data.locations.length === 0) {
        toast.info('No locations found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      toast.error('Failed to search location');
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error('Please enter territory name');
      return;
    }

    if (!selectedLocation) {
      toast.error('Please select a location');
      return;
    }

    setCreating(true);
    try {
      await api.post('/territories', {
        ...formData,
        location: selectedLocation,
        region: selectedLocation.address?.region,
        district: selectedLocation.address?.district,
      });

      toast.success('Territory created!');
      onSuccess();
    } catch (error) {
      console.error('Error creating territory:', error);
      toast.error('Failed to create territory');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create Territory</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Territory Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Territory Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Kampala Central"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Location Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Location (Uganda) *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                placeholder="e.g., Kampala, Mukono, Entebbe"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSearchLocation}
                disabled={searching}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
              >
                {searching ? '⏳' : '🔍'} Search
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
              {searchResults.map((location, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedLocation(location);
                    setSearchResults([]);
                  }}
                  className="p-3 hover:bg-primary-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="font-semibold text-sm">{location.displayName}</div>
                  <div className="text-xs text-gray-500">
                    📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Location */}
          {selectedLocation && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-semibold text-green-900 mb-1">Selected Location:</div>
              <div className="text-sm text-green-800">{selectedLocation.displayName}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !formData.name || !selectedLocation}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Territory'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Territories;
