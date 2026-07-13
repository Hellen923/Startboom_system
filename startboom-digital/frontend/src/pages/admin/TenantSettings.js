// Tenant Settings - Company branding, modules, and configuration
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Upload, 
  Palette, 
  Grid, 
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Clock,
  Sliders,
  CheckCircle,
  X
} from 'lucide-react';
import axios from 'axios';
import PROFESSIONAL_COLORS from '../../utils/professionalColors';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TenantSettings = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [tenant, setTenant] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    email: '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    branding: {
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981',
      logo: ''
    },
    settings: {
      currency: 'USD',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      fiscalYearStart: '01-01'
    }
  });

  // Available modules
  const availableModules = [
    { id: 'sales', label: 'Sales & CRM', description: 'Customer relationship and sales management', icon: '💼' },
    { id: 'deals', label: 'Deal Pipeline', description: 'Sales pipeline and opportunity tracking', icon: '🎯' },
    { id: 'products', label: 'Product Catalog', description: 'Product and service management', icon: '📦' },
    { id: 'finance', label: 'Finance', description: 'Invoicing, payments, and accounting', icon: '💰' },
    { id: 'hr', label: 'HR & Recruitment', description: 'Human resources management', icon: '👥' },
    { id: 'projects', label: 'Project Management', description: 'Project tracking and collaboration', icon: '📊' },
    { id: 'support', label: 'Customer Support', description: 'Ticketing and support management', icon: '🎧' },
    { id: 'inventory', label: 'Inventory', description: 'Stock and warehouse management', icon: '📦' },
    { id: 'marketing', label: 'Marketing', description: 'Campaigns and lead generation', icon: '📢' },
    { id: 'analytics', label: 'Analytics', description: 'Business intelligence and reporting', icon: '📈' }
  ];

  useEffect(() => {
    fetchTenantSettings();
  }, []);

  const fetchTenantSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tenant/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTenant(response.data.tenant);
      setFormData({
        ...formData,
        ...response.data.tenant,
        branding: response.data.tenant.branding || formData.branding,
        settings: response.data.tenant.settings || formData.settings
      });
    } catch (error) {
      console.error('Error fetching tenant settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_URL}/tenant/settings`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Apply branding immediately
      const color = formData.branding?.primaryColor;
      if (color) {
        const root = document.documentElement;
        const r = parseInt(color.slice(1,3),16);
        const g = parseInt(color.slice(3,5),16);
        const b = parseInt(color.slice(5,7),16);
        const darker = '#' + [r,g,b].map(v => Math.max(0,v-25).toString(16).padStart(2,'0')).join('');
        root.style.setProperty('--primary-color', color);
        root.style.setProperty('--primary-hover', darker);
        root.style.setProperty('--primary-ring', `rgba(${r},${g},${b},0.25)`);
        root.style.setProperty('--gradient-from', color);
        root.style.setProperty('--gradient-to', darker);
        root.style.setProperty('--brand-header-bg', `linear-gradient(to right, ${color}, ${darker})`);
        root.style.setProperty('--btn-brand-bg', `linear-gradient(to right, ${color}, ${darker})`);
        root.style.setProperty('--sidebar-nav-active', `rgba(${r},${g},${b},0.15)`);
        root.style.setProperty('--sidebar-nav-hover', `rgba(${r},${g},${b},0.08)`);
      }

      toast.success('Settings saved successfully');
      fetchTenantSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleModuleToggle = async (moduleId) => {
    try {
      const token = localStorage.getItem('token');
      const currentModules = tenant?.modules || {};
      const newStatus = !currentModules[moduleId];
      
      await axios.patch(`${API_URL}/tenant/modules/${moduleId}`, {
        enabled: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Module ${newStatus ? 'enabled' : 'disabled'}`);
      fetchTenantSettings();
    } catch (error) {
      console.error('Error toggling module:', error);
      toast.error('Failed to update module');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Tenant Settings
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure your company profile, branding, and modules
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span className="font-semibold">{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className={`rounded-xl mb-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
        <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4`}>
          <div className="flex space-x-4">
            {['general', 'branding', 'modules', 'advanced'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
          <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Company Information
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Building2 className="w-4 h-4 inline mr-2" />
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Sliders className="w-4 h-4 inline mr-2" />
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              >
                <option value="">Select Industry</option>
                <option value="agriculture">Agriculture & Farming</option>
                <option value="real_estate">Real Estate</option>
                <option value="insurance">Insurance</option>
                <option value="retail">Retail & E-commerce</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="healthcare">Healthcare</option>
                <option value="technology">Technology</option>
                <option value="finance">Financial Services</option>
                <option value="education">Education</option>
                <option value="hospitality">Hospitality</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Phone className="w-4 h-4 inline mr-2" />
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Globe className="w-4 h-4 inline mr-2" />
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              />
            </div>

            <div className="col-span-2">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <MapPin className="w-4 h-4 inline mr-2" />
                Address
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Street"
                  value={formData.address?.street || ''}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value }})}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
                <input
                  type="text"
                  placeholder="City"
                  value={formData.address?.city || ''}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value }})}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.address?.state || ''}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value }})}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={formData.address?.country || ''}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value }})}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
          <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Branding & Appearance
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Palette className="w-4 h-4 inline mr-2" />
                Primary Color
              </label>
              <div className="flex space-x-3">
                <input
                  type="color"
                  value={formData.branding?.primaryColor || '#4F46E5'}
                  onChange={(e) => setFormData({ ...formData, branding: { ...formData.branding, primaryColor: e.target.value }})}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.branding?.primaryColor || '#4F46E5'}
                  onChange={(e) => setFormData({ ...formData, branding: { ...formData.branding, primaryColor: e.target.value }})}
                  className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Palette className="w-4 h-4 inline mr-2" />
                Secondary Color
              </label>
              <div className="flex space-x-3">
                <input
                  type="color"
                  value={formData.branding?.secondaryColor || '#10B981'}
                  onChange={(e) => setFormData({ ...formData, branding: { ...formData.branding, secondaryColor: e.target.value }})}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.branding?.secondaryColor || '#10B981'}
                  onChange={(e) => setFormData({ ...formData, branding: { ...formData.branding, secondaryColor: e.target.value }})}
                  className={`flex-1 px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Upload className="w-4 h-4 inline mr-2" />
                Company Logo
              </label>
              <div className={`border-2 border-dashed rounded-lg p-8 text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Click to upload or drag and drop
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
          <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Enable/Disable Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableModules.map(module => {
              const isEnabled = tenant?.modules?.[module.id] !== false;
              return (
                <div
                  key={module.id}
                  className={`p-4 rounded-lg border-2 transition ${
                    isEnabled 
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                      : isDark ? 'border-gray-600 bg-[#334155]' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{module.icon}</span>
                      <div>
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {module.label}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleModuleToggle(module.id)}
                      className={`p-2 rounded-lg transition ${
                        isEnabled
                          ? 'bg-indigo-600 text-white'
                          : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {isEnabled ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
          <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Advanced Settings
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <DollarSign className="w-4 h-4 inline mr-2" />
                Currency
              </label>
              <select
                value={formData.settings?.currency || 'USD'}
                onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, currency: e.target.value }})}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="UGX">UGX - Ugandan Shilling</option>
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="TZS">TZS - Tanzanian Shilling</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Clock className="w-4 h-4 inline mr-2" />
                Timezone
              </label>
              <select
                value={formData.settings?.timezone || 'UTC'}
                onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, timezone: e.target.value }})}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              >
                <option value="UTC">UTC</option>
                <option value="Africa/Kampala">Africa/Kampala</option>
                <option value="Africa/Nairobi">Africa/Nairobi</option>
                <option value="America/New_York">America/New York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Date Format
              </label>
              <select
                value={formData.settings?.dateFormat || 'MM/DD/YYYY'}
                onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, dateFormat: e.target.value }})}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Fiscal Year Start
              </label>
              <input
                type="text"
                placeholder="MM-DD (e.g., 01-01)"
                value={formData.settings?.fiscalYearStart || '01-01'}
                onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, fiscalYearStart: e.target.value }})}
                className={`w-full px-4 py-2 rounded-lg ${isDark ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSettings;
