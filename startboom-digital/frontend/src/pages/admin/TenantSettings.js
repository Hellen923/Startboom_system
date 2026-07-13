// Tenant Settings - Company branding, modules, and configuration
import React, { useState, useEffect } from 'react';
import {
  Save, 
  Upload, 
  Palette, 
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
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { tenantsAPI } from '../../services/api';
import { applyBrandColor } from '../../utils/platformBranding';
import { TENANT_MODULES, isModuleEnabled } from '../../utils/moduleRegistry';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TenantSettings = () => {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
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

  useEffect(() => {
    fetchTenantSettings();
  }, []);

  const syncTenantContext = (tenantData) => {
    if (!tenantData || !user?.tenant) return;
    updateUser({ tenant: { ...user.tenant, ...tenantData } });
  };

  const fetchTenantSettings = async () => {
    try {
      setLoading(true);
      const response = await tenantsAPI.getSettings();
      
      setTenant(response.data.tenant);
      syncTenantContext(response.data.tenant);
      setFormData({
        ...formData,
        ...response.data.tenant,
        companyName: response.data.tenant.name || '',
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
      const response = await tenantsAPI.updateSettings(formData);
      const updatedTenant = response.data.tenant;
      setTenant(updatedTenant);
      syncTenantContext(updatedTenant);

      // Apply branding immediately and persist so theme toggle preserves it
      const color = formData.branding?.primaryColor;
      if (color) {
        localStorage.setItem('tenant_primary_color', color);
        applyBrandColor(color);
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleModuleToggle = async (moduleId) => {
    try {
      const currentModules = tenant?.modules || {};
      const newStatus = !isModuleEnabled(currentModules, moduleId);
      
      const response = await tenantsAPI.updateModule(moduleId, newStatus);
      const updatedTenant = {
        ...tenant,
        modules: response.data.modules || { ...currentModules, [moduleId]: newStatus }
      };

      toast.success(`Module ${newStatus ? 'enabled' : 'disabled'}`);
      setTenant(updatedTenant);
      syncTenantContext(updatedTenant);
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
          className="btn-brand px-6 py-3"
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
                    ? 'text-white'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
                style={activeTab === tab ? { background: 'var(--btn-brand-bg)' } : {}}
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
              <div className="flex space-x-3 mb-3">
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
              <div className="flex flex-wrap gap-2">
                {[
                  '#0066FF','#2563EB','#4F46E5','#6366F1',
                  '#0891B2','#0D9488','#059669','#16A34A',
                  '#7C3AED','#9333EA','#A855F7','#C026D3',
                  '#DC2626','#E11D48','#DB2777','#EC4899',
                  '#EA580C','#D97706','#CA8A04','#D89A00',
                  '#0F172A','#1E293B','#334155','#475569',
                ].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, branding: { ...formData.branding, primaryColor: c }})}
                    style={{ background: c }}
                    title={c}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      formData.branding?.primaryColor === c ? 'border-white scale-110 ring-2 ring-offset-1 ring-gray-400' : 'border-transparent'
                    }`}
                  />
                ))}
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
            {TENANT_MODULES.map(module => {
              const isEnabled = isModuleEnabled(tenant?.modules, module.id);
              return (
                <div
                  key={module.id}
                  className={`p-4 rounded-lg border-2 transition ${
                    isEnabled 
                      ? 'bg-[var(--color-accent-surface)]'
                      : isDark ? 'border-gray-600 bg-[#334155]' : 'border-gray-300 bg-gray-50'
                  }`}
                  style={isEnabled ? { borderColor: 'var(--primary-color)' } : {}}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-surface)] text-xs font-bold text-[var(--primary-color)]">
                        {module.label.slice(0, 2).toUpperCase()}
                      </span>
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
                      className={`p-2 rounded-lg transition text-white ${
                        isEnabled ? '' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                      style={isEnabled ? { background: 'var(--btn-brand-bg)' } : {}}
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
