import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Target, Mail, Phone, User } from 'lucide-react';
import { territoriesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MyTerritory = () => {
  const [territory, setTerritory] = useState(null);
  const [teammates, setTeamates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyTerritory();
  }, []);

  const loadMyTerritory = async () => {
    try {
      setLoading(true);
      const response = await territoriesAPI.getMyTerritory();
      setTerritory(response.data.territory || null);
      setTeamates(response.data.teammates || []);
    } catch (error) {
      console.error('Error loading territory:', error);
      // Only show error if it's not a 404 (no territory assigned)
      if (error.response?.status !== 404) {
        toast.error('Failed to load territory information');
      }
      // If 404, just set territory to null (handled by the UI below)
      setTerritory(null);
      setTeamates([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `UGX ${Number(amount || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading territory information...</p>
        </div>
      </div>
    );
  }

  if (!territory) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Territory Assigned</h2>
          <p className="text-gray-600">You haven't been assigned to a territory yet.</p>
          <p className="text-sm text-gray-500 mt-2">Contact your administrator for territory assignment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-7 h-7 text-primary-600" />
          My Territory
        </h1>
        <p className="text-gray-600 mt-1">View your assigned territory and team members</p>
      </div>

      {/* Territory Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl shadow-sm border border-primary-100 p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-600 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{territory.name}</h2>
                <p className="text-gray-600">{territory.region}</p>
              </div>
            </div>
            
            {territory.description && (
              <p className="text-gray-700 mb-4">{territory.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {territory.target && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-gray-600">Revenue Target</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(territory.target)}</p>
                </div>
              )}

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{teammates.length}</p>
              </div>

              {territory.coordinates && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <p className="text-sm font-medium text-gray-600">Coordinates</p>
                  </div>
                  <p className="text-sm text-gray-700">
                    {territory.coordinates.lat?.toFixed(4)}, {territory.coordinates.lng?.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Teammates Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-600" />
          Team Members ({teammates.length})
        </h2>

        {teammates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No team members in this territory yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teammates.map((teammate) => (
              <motion.div
                key={teammate._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{teammate.name}</h3>
                    <p className="text-xs text-gray-500 mb-3 capitalize">{teammate.role}</p>
                    
                    <div className="space-y-2">
                      {teammate.email && (
                        <a
                          href={`mailto:${teammate.email}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                        >
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{teammate.email}</span>
                        </a>
                      )}
                      {teammate.phone && (
                        <a
                          href={`tel:${teammate.phone}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                        >
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{teammate.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTerritory;
