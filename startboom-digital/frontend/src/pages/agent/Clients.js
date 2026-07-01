import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Search, Filter, Download, Mail, MapPin, Building, User, Star,
  Calendar, Edit, Trash2, Eye, Users, FileText, Tag, MessageCircle,
  ChevronDown, ChevronUp, X, Globe, Briefcase, AlertCircle, CheckCircle,
  Clock, Award, MessageSquare, Send
} from 'lucide-react';
import { clientsAPI, emailTemplatesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext'; 
import toast from 'react-hot-toast';
import ClientRegistrationForm from './ClientRegistrationForm';

const Clients = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailClient, setEmailClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    tags: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedClients, setSelectedClients] = useState([]);
  

  const loadClients = async () => {
    if (!user) return;
    try {
      const params = {
        agentId: user.role === 'agent' ? user.id : undefined,
        search: searchTerm,
        status: filters.status,
        priority: filters.priority,
        tags: filters.tags,
        page: pagination.page,
        limit: 12,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      };

      const response = await clientsAPI.getAll(params);
      setClients(response.data?.clients || response.data || []);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data?.pagination?.totalPages || response.data?.totalPages || 1,
        total: response.data?.pagination?.total || response.data?.total || 0
      }));
    } catch (error) {
      console.error('Failed to load clients:', error);
      toast.error('Failed to load clients');
      setClients([]);
    }
  };

  useEffect(() => {
    if (location?.state?.search) {
      setSearchTerm(location.state.search);
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (location?.state?.openCreate) {
      setShowAddModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!user) return;
    loadClients();
  }, [user, filters, pagination.page, sortConfig, searchTerm]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectClient = (clientId) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    setSelectedClients(
      selectedClients.length === clients.length
        ? []
        : clients.map(client => client._id)
    );
  };

  const handleViewProfile = async (clientId) => {
    try {
      const response = await clientsAPI.getById(clientId);
      setSelectedClient(response.data);
      setShowProfileModal(true);
    } catch (error) {
      toast.error('Failed to load client profile');
    }
  };

  const handleEditClient = async (client) => {
    try {
      // Fetch full client details to ensure we have all fields
      const res = await clientsAPI.getById(client._id || client.id || client);
      setSelectedClient(res.data);
      setShowEditModal(true);
    } catch (err) {
      // Fallback to provided client object
      setSelectedClient(client);
      setShowEditModal(true);
    } finally {
    }
  };

  const handleDeleteClient = async (clientId, clientName) => {
    if (window.confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      try {
        await clientsAPI.delete(clientId);
        toast.success(`Client ${clientName} deleted successfully`);
        if (selectedClient && selectedClient._id === clientId) {
          setShowProfileModal(false);
          setSelectedClient(null);
        }
        loadClients();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete client');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedClients.length === 0) return;
    
    const clientNames = clients
      .filter(client => selectedClients.includes(client._id))
      .map(client => client.name)
      .join(', ');

    if (window.confirm(`Are you sure you want to delete ${selectedClients.length} client(s)? This action cannot be undone.\n\nClients: ${clientNames}`)) {
      try {
        await Promise.all(selectedClients.map(id => clientsAPI.delete(id)));
        toast.success(`${selectedClients.length} client(s) deleted successfully`);
        setSelectedClients([]);
        loadClients();
      } catch (error) {
        toast.error('Failed to delete some clients');
      }
    }
  };

  const handleExportClients = async () => {
    try {
      const response = await clientsAPI.exportCSV();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'clients.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Clients exported successfully');
    } catch (error) {
      toast.error('Failed to export clients');
    }
  };

  const handleExportClientsPDF = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' });

      const params = {
        search: searchTerm || undefined,
        status: filters.status || undefined,
      };

      const response = await clientsAPI.exportPDF(params);

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `clients-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF exported successfully', { id: 'pdf-export' });
    } catch (error) {
      toast.error('Failed to export PDF', { id: 'pdf-export' });
      console.error('PDF export error:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      prospect: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      vip: 'bg-purple-100 text-purple-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      prospect: Clock,
      active: CheckCircle,
      vip: Award,
      inactive: AlertCircle
    };
    const IconComponent = icons[status] || User;
    return <IconComponent className="w-4 h-4" />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-primary-100 text-primary-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown className="w-4 h-4 opacity-30" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  const ClientProfileModal = ({ client, onClose }) => {
    if (!client) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
                <p className="text-gray-600 capitalize">{client.position}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Personal Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(client.status)}
                      <span className="text-sm font-medium text-gray-700">Status</span>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status)}`}>
                      {client.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Priority</span>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(client.priority)}`}>
                      {client.priority}
                    </span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <span>Contact Information</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{client.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-900">{client.phone}</span>
                    </div>
                    {client.address && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Information */}
                {client.company && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Building className="w-5 h-5 text-gray-600" />
                      <span>Company Information</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{client.company}</span>
                      </div>
                      {client.position && (
                        <div className="flex items-center space-x-3">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 capitalize">{client.position}</span>
                        </div>
                      )}
                      {client.industry && (
                        <div className="flex items-center space-x-3">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{client.industry}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Additional Info */}
              <div className="space-y-6">
                {/* Engagement Score */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Star className="w-5 h-5 text-primary-500" />
                    <span>Engagement Score</span>
                  </h3>
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 rounded-full border-4 border-gray-200 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">{client.engagementScore}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                      <div 
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${client.engagementScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
                  <div className="space-y-3">
                    {client.dateOfBirth && (
                      <div>
                        <span className="text-sm text-gray-600">Date of Birth</span>
                        <p className="text-gray-900 font-medium">
                          {new Date(client.dateOfBirth).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {client.gender && (
                      <div>
                        <span className="text-sm text-gray-600">Gender</span>
                        <p className="text-gray-900 font-medium capitalize">{client.gender}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-600">Member Since</span>
                      <p className="text-gray-900 font-medium">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contacts List */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <span>Contacts ({client.contacts ? client.contacts.length : 0})</span>
                  </h3>
                  <div className="space-y-3">
                    {(client.contacts || []).map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{c.name || '—'}</div>
                          <div className="text-sm text-gray-500">{c.position} • {c.phone} • {c.email}</div>
                        </div>
                        <div className="text-sm text-gray-500">{c.isPrimary ? 'Primary' : ''}</div>
                      </div>
                    ))}
                    {(!client.contacts || client.contacts.length === 0) && (
                      <p className="text-sm text-gray-500">No contact persons added yet.</p>
                    )}
                  </div>
                </div>

                {/* Interaction History */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span>Interaction History</span>
                  </h3>
                  <div className="space-y-4">
                    {(client.interactions || []).slice().reverse().map((it, i) => (
                      <div key={i} className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-800">{it.type}</div>
                          <div className="text-xs text-gray-500">{new Date(it.date).toLocaleString()}</div>
                        </div>
                        <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{it.notes}</div>
                      </div>
                    ))}
                    {(!client.interactions || client.interactions.length === 0) && (
                      <p className="text-sm text-gray-500">No interactions logged yet.</p>
                    )}

                    {/* Interactions are read-only in profile view. Use Edit to add or modify interactions. */}
                  </div>
                </div>

                {/* Attachments */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span>Attachments ({(client.attachments || []).length})</span>
                  </h3>
                  <div className="space-y-3">
                    {(client.attachments || []).map((att, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="text-sm text-gray-900">{att.filename}</div>
                        <div className="flex items-center space-x-2">
                          <a href={att.url} target="_blank" rel="noreferrer" className="text-sm text-primary-600">Download</a>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 text-sm text-gray-500">Attachments are read-only here. Use Edit to upload or remove files.</div>
                  </div>
                </div>

                {/* Tags */}
                {client.tags && client.tags.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Tag className="w-5 h-5 text-gray-600" />
                      <span>Tags</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {client.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            {client.emergencyContact && client.emergencyContact.name && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span>Emergency Contact</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Name</span>
                    <p className="text-gray-900 font-medium">{client.emergencyContact.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Relationship</span>
                    <p className="text-gray-900 font-medium">{client.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Phone</span>
                    <p className="text-gray-900 font-medium">{client.emergencyContact.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {client.notes && (
              <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  const EditClientModal = ({ client, onClose }) => {
    const [form, setForm] = useState({
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      company: client?.company || '',
      position: client?.position || '',
      status: client?.status || 'prospect',
      priority: client?.priority || 'medium',
      engagementScore: client?.engagementScore || 0,
      tags: client?.tags || [],
      notes: client?.notes || '',
      address: client?.address || ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      setForm({
        name: client?.name || '',
        email: client?.email || '',
        phone: client?.phone || '',
        company: client?.company || '',
        position: client?.position || '',
        status: client?.status || 'prospect',
        priority: client?.priority || 'medium',
        engagementScore: client?.engagementScore || 0,
        tags: client?.tags || [],
        notes: client?.notes || '',
        address: client?.address || ''
      });
    }, [client]);

    const handleChange = (field, value) => {
      setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e) => {
      e.preventDefault();
      if (!client) return;
      // Basic validation
      if (!form.name.trim()) {
        toast.error('Name is required');
        return;
      }
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
        toast.error('Valid email is required');
        return;
      }

      setSaving(true);
      try {
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          position: form.position,
          address: form.address || '',
          status: form.status,
          priority: form.priority,
          engagementScore: form.engagementScore,
          tags: form.tags,
          notes: form.notes
        };
        await clientsAPI.update(client._id, payload);
        toast.success('Client updated successfully');
        onClose();
        // Refresh list and profile
        await loadClients();
        const updated = await clientsAPI.getById(client._id);
        setSelectedClient(updated.data);
        setShowProfileModal(true);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to update client');
      } finally {
        setSaving(false);
      }
    };

    if (!client) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Edit Client</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input value={form.company} onChange={(e) => handleChange('company', e.target.value)} className="w-full p-2 border rounded" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input value={form.position} onChange={(e) => handleChange('position', e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full p-2 border rounded">
                  <option value="prospect">Prospect</option>
                  <option value="active">Active</option>
                  <option value="vip">VIP</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} className="w-full p-2 border rounded" rows={4} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input value={form.address || ''} onChange={(e) => handleChange('address', e.target.value)} className="w-full p-2 border rounded" />
            </div>

            {/* Contact persons editor */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Contact Persons</div>
                <button type="button" onClick={() => handleChange('contacts', [...(form.contacts || []), { name: '', position: '', email: '', phone: '', isPrimary: false }])}                   className="text-sm text-primary-600">Add contact</button>
              </div>
              <div className="space-y-2">
                {(form.contacts || []).map((c, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input className="col-span-3 p-2 border rounded" placeholder="Name" value={c.name} onChange={(e) => {
                      const updated = [...form.contacts]; updated[idx].name = e.target.value; handleChange('contacts', updated);
                    }} />
                    <input className="col-span-3 p-2 border rounded" placeholder="Position" value={c.position} onChange={(e) => {
                      const updated = [...form.contacts]; updated[idx].position = e.target.value; handleChange('contacts', updated);
                    }} />
                    <input className="col-span-3 p-2 border rounded" placeholder="Email" value={c.email} onChange={(e) => {
                      const updated = [...form.contacts]; updated[idx].email = e.target.value; handleChange('contacts', updated);
                    }} />
                    <div className="col-span-2 flex items-center space-x-2">
                      <input className="p-2 border rounded flex-1" placeholder="Phone" value={c.phone} onChange={(e) => {
                        const updated = [...form.contacts]; updated[idx].phone = e.target.value; handleChange('contacts', updated);
                      }} />
                      <button type="button" onClick={() => {
                        const updated = form.contacts.filter((_, i) => i !== idx); handleChange('contacts', updated);
                      }} className="text-red-600">Remove</button>
                    </div>
                  </div>
                ))}
                {(form.contacts || []).length === 0 && (<div className="text-sm text-gray-500">No contact persons added.</div>)}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={saving}               className="px-4 py-2 bg-primary-600 text-white rounded">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end flex-wrap gap-3">
          {selectedClients.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedClients.length})</span>
            </button>
          )}
           <button
             onClick={handleExportClients}
             className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
           >
             <Download className="w-4 h-4" />
             <span>Export CSV</span>
           </button>
           <button
             onClick={handleExportClientsPDF}
             className="flex items-center space-x-2 px-4 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors"
           >
             <FileText className="w-4 h-4" />
             <span>Export PDF</span>
           </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Client</span>
        </button>
    </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">VIP Clients</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter(c => c.status === 'vip').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Engagement</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.length > 0 
                  ? Math.round(clients.reduce((acc, client) => acc + client.engagementScore, 0) / clients.length)
                  : 0
                }%
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search clients by name, email, company, or phone..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadClients()}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Status</option>
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="vip">VIP</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <button
              onClick={loadClients}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedClients.length === clients.length && clients.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>Client</span>
                    <SortIcon columnKey="name" />
                  </div>
                </th>

                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>Company</span>
                    <SortIcon columnKey="company" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>Contact</span>
                    <SortIcon columnKey="email" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Status</span>
                    <SortIcon columnKey="status" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Priority</span>
                    <SortIcon columnKey="priority" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('engagementScore')}
                >
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>Engagement</span>
                    <SortIcon columnKey="engagementScore" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Created</span>
                    <SortIcon columnKey="createdAt" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.length > 0 ? (
                clients.map((client) => (
                  <motion.tr
                    key={client._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client._id)}
                        onChange={() => handleSelectClient(client._id)}
                        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{client.position}</div>
                        </div>
                      </div>
                    </td>
                      <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{client.company || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{client.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{client.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(client.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                          {client.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(client.priority)}`}>
                        {client.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${client.engagementScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{client.engagementScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(client.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
<div className="flex items-center space-x-2">
                          {(client.phone || client.email) && (
                            <button
                              onClick={() => {
                                if (client.phone) {
                                  let number = client.phone.trim();
                                  // Remove all non-digit characters except leading +
                                  number = number.replace(/[^\d+]/g, '');
                                  
                                  // Ensure number starts with + or country code
                                  if (!number.startsWith('+')) {
                                    if (number.startsWith('256')) {
                                      number = '+' + number;
                                    } else if (number.startsWith('0')) {
                                      number = '+256' + number.substring(1);
                                    } else if (/^[7-9]\d{8}$/.test(number)) {
                                      number = '+256' + number;
                                    } else {
                                      toast.error('Invalid phone number format');
                                      return;
                                    }
                                  }
                                  
                                  // Remove + for WhatsApp URL
                                  const cleanNumber = number.replace('+', '');
                                  window.open(`https://wa.me/${cleanNumber}?text=Hello ${client.name}, this is regarding our recent conversation.`, '_blank');
                                } else if (client.email) {
                                  window.open(`mailto:${client.email}?subject=Follow-up&body=Hello ${client.name},`, '_blank');
                                }
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              aria-label={`WhatsApp ${client.name}`}
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleViewProfile(client._id)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" 
                            aria-label={`View ${client.name}`}
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              // Pre-fill schedule with client info
                              const params = new URLSearchParams({
                                clientId: client._id,
                                clientName: client.name,
                                clientPhone: client.phone,
                                clientEmail: client.email
                              });
                              window.location.href = `/agent/schedules?${params.toString()}`;
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            aria-label={`Schedule with ${client.name}`}
                            title="Create Schedule"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEmailClient(client); setShowEmailModal(true); }}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditClient(client)} 
                            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg" 
                            aria-label={`Edit ${client.name}`}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClient(client._id, client.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" aria-label={`Delete ${client.name}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-24 text-center">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchTerm || filters.status || filters.priority ? 'No clients found' : 'No clients yet'}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {searchTerm || filters.status || filters.priority 
                        ? 'Try adjusting your search terms or filters'
                        : 'Get started by adding your first client to the system'
                      }
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                       className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Add First Client
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * 12) + 1} to {Math.min(pagination.page * 12, pagination.total)} of {pagination.total} clients
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && emailClient && (
        <SendEmailModal
          client={emailClient}
          onClose={() => { setShowEmailModal(false); setEmailClient(null); }}
          onSent={() => { setShowEmailModal(false); setEmailClient(null); loadClients(); }}
        />
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <ClientRegistrationForm
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadClients();
            toast.success('Client added successfully!');
          }}
        />
      )}

      {/* Client Profile Modal */}
      {showProfileModal && selectedClient && (
        <ClientProfileModal 
          client={selectedClient}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedClient(null);
          }}
        />
      )}
      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <EditClientModal
          client={selectedClient}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClient(null);
          }}
        />
      )}
    </div>
  );
};

const SendEmailModal = ({ client, onClose, onSent }) => {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await emailTemplatesAPI.getAll();
        setTemplates((res.data.templates || []).filter(t => t.isActive !== false && t.category === 'client'));
      } catch {
        setTemplates([]);
      }
    };
    loadTemplates();
  }, []);

  const renderTemplateText = (text = '') => {
    const replacements = {
      clientName: client.name || '',
      clientEmail: client.email || '',
      clientCompany: client.company || '',
      agentName: 'your CRM team',
      companyName: 'our company'
    };
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => replacements[key] || '');
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(item => String(item._id) === String(templateId));
    if (!template) return;
    setForm({
      subject: renderTemplateText(template.subject),
      message: renderTemplateText(template.body)
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    try {
      setSending(true);
      await clientsAPI.sendEmail(client._id, form);
      toast.success(`Email sent to ${client.name} successfully!`);
      onSent();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Send Email</h2>
            <p className="text-sm text-gray-500 mt-0.5">To: {client.name} ({client.email})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
              <select
                value={selectedTemplate}
                onChange={e => handleTemplateChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Write manually</option>
                {templates.map(template => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Follow-up on our meeting"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              rows={6}
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder={`Dear ${client.name},\n\nWrite your message here...`}
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending...' : 'Send Email'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Clients;
