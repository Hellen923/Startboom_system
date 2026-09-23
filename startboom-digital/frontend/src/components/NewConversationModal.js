import React, { useState, useEffect } from 'react';
import { X, User, Users, Building } from 'lucide-react';
import { usersAPI } from '../services/api';
import { teamApi, departmentApi } from '../services/enterpriseApi';
import dm from '../utils/darkModeClasses';
import toast from 'react-hot-toast';

const NewConversationModal = ({ isOpen, onClose, onConversationCreated }) => {
  const [conversationType, setConversationType] = useState('direct'); // direct, team, department
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, conversationType]);

  const loadData = async () => {
    try {
      if (conversationType === 'direct') {
        const res = await usersAPI.getAll();
        const usersData = res.data?.users || res.data || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else if (conversationType === 'team') {
        const res = await teamApi.getAll();
        setTeams(res.data?.teams || []);
      } else if (conversationType === 'department') {
        const res = await departmentApi.getAll();
        setDepartments(res.data?.departments || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load options');
    }
  };

  const handleCreate = async () => {
    if (conversationType === 'direct' && !selectedUser) {
      toast.error('Please select a user');
      return;
    }
    if (conversationType === 'team' && !selectedTeam) {
      toast.error('Please select a team');
      return;
    }
    if (conversationType === 'department' && !selectedDepartment) {
      toast.error('Please select a department');
      return;
    }

    setLoading(true);
    try {
      if (conversationType === 'direct') {
        await onConversationCreated({ type: 'direct', userId: selectedUser });
      } else if (conversationType === 'team') {
        await onConversationCreated({ type: 'team', teamId: selectedTeam });
      } else if (conversationType === 'department') {
        await onConversationCreated({ type: 'department', departmentId: selectedDepartment });
      }
      onClose();
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${dm.card} rounded-xl max-w-md w-full p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${dm.textPrimary}`}>New Conversation</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${dm.textMuted}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selection */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${dm.textPrimary}`}>
            Conversation Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setConversationType('direct')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                conversationType === 'direct'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : `border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600`
              }`}
            >
              <User className={`w-6 h-6 mx-auto mb-1 ${conversationType === 'direct' ? 'text-primary-600 dark:text-primary-400' : dm.textMuted}`} />
              <span className={`text-xs font-medium ${conversationType === 'direct' ? 'text-primary-600 dark:text-primary-400' : dm.textMuted}`}>
                Direct
              </span>
            </button>

            <button
              onClick={() => setConversationType('team')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                conversationType === 'team'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : `border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600`
              }`}
            >
              <Users className={`w-6 h-6 mx-auto mb-1 ${conversationType === 'team' ? 'text-primary-600 dark:text-primary-400' : dm.textMuted}`} />
              <span className={`text-xs font-medium ${conversationType === 'team' ? 'text-primary-600 dark:text-primary-400' : dm.textMuted}`}>
                Team
              </span>
            </button>

            <button
              onClick={() => setConversationType('department')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                conversationType === 'department'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : `border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600`
              }`}
            >
              <Building className={`w-6 h-6 mx-auto mb-1 ${conversationType === 'department' ? 'text-primary-600 dark:text-primary-400' : dm.textMuted}`} />
              <span className={`text-xs font-medium ${conversationType === 'department' ? 'text-primary-600 dark:text-primary-400' : dm.textMuted}`}>
                Department
              </span>
            </button>
          </div>
        </div>

        {/* Selection */}
        <div className="mb-6">
          {conversationType === 'direct' && (
            <>
              <label className={`block text-sm font-medium mb-2 ${dm.textPrimary}`}>
                Select User
              </label>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${dm.border} ${dm.inputBg} ${dm.textPrimary} mb-2`}
              />
              <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-2">
                {filteredUsers.length === 0 ? (
                  <p className={`text-sm text-center py-4 ${dm.textMuted}`}>No users found</p>
                ) : (
                  filteredUsers.map(user => (
                    <button
                      key={user._id}
                      onClick={() => setSelectedUser(user._id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedUser === user._id
                          ? 'bg-primary-100 dark:bg-primary-900/30'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <p className={`font-medium text-sm ${dm.textPrimary}`}>{user.name}</p>
                      <p className={`text-xs ${dm.textMuted}`}>{user.email}</p>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {conversationType === 'team' && (
            <>
              <label className={`block text-sm font-medium mb-2 ${dm.textPrimary}`}>
                Select Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${dm.border} ${dm.inputBg} ${dm.textPrimary}`}
              >
                <option value="">Choose a team...</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            </>
          )}

          {conversationType === 'department' && (
            <>
              <label className={`block text-sm font-medium mb-2 ${dm.textPrimary}`}>
                Select Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${dm.border} ${dm.inputBg} ${dm.textPrimary}`}
              >
                <option value="">Choose a department...</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Chat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
