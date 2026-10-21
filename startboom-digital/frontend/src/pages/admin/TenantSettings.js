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
import { applyBrandColor, canUseTenantBranding, clearTenantBranding } from '../../utils/platformBranding';
import { TENANT_MODULES, isModuleEnabled } from '../../utils/moduleRegistry';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TenantSettings = () => {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const isDark = theme.mode === 'dark';
  const canManageTenantBranding = canUseTenantBranding(user);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    if (!canManageTenantBranding) {
      clearTenantBranding();
      setLoading(false);
      return;
    }

    fetchTenantSettings();
  }, [canManageTenantBranding]);

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
    if (!canManageTenantBranding) {
      clearTenantBranding();
      toast.error('Tenant settings are only available inside a tenant workspace');
      return;
    }

    try {
      setSaving(true);
      const response = await tenantsAPI.updateSettings(formData);
      const updatedTenant = response.data.tenant;
      setTenant(updatedTenant);
      syncTenantContext(updatedTenant);

      // Apply branding immediately and persist so theme toggle preserves it
      const color = formData.branding?.primaryColor;
      if (canManageTenantBranding && color) {
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      
      // Create form data
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      // Upload file
      const uploadResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const logoUrl = uploadData.url || uploadData.path;

      // Update form data with logo URL
      setFormData({
        ...formData,
        branding: {
          ...formData.branding,
          logo: logoUrl
        }
      });

      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!canManageTenantBranding) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tenant Settings</h1>
          <p className="text-gray-600">Tenant branding and company settings are only available inside a tenant workspace.</p>
        </div>
      </div>
    );
  }

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
              
              {formData.branding?.logo ? (
                <div className="space-y-4">
                  <div className={`border-2 rounded-lg p-4 ${isDark ? 'border-gray-600 bg-[#334155]' : 'border-gray-300 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={formData.branding.logo} 
                          alt="Company Logo" 
                          className="h-16 w-auto object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            toast.error('Failed to load logo');
                          }}
                        />
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Current Logo</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formData.branding.logo.substring(formData.branding.logo.lastIndexOf('/') + 1)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, branding: { ...formData.branding, logo: '' }})}
                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="logo-upload"
                      className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {uploading ? 'Uploading...' : 'Upload new logo'}
                      </p>
                    </label>
                  </div>
                </div>
              ) : (
                <div className={`border-2 border-dashed rounded-lg p-8 text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="logo-upload"
                    className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    ) : (
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    )}
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                      PNG, JPG up to 5MB
                    </p>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modules Tab - Hierarchical Structure */}
      {activeTab === 'modules' && (
        <div className={`rounded-xl p-6 ${isDark ? 'bg-[#1E293B]' : 'bg-white'} shadow-lg`}>
          <div className="mb-6">
            <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Module Configuration
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Enable or disable modules to customize your CRM workspace. Main modules can have sub-modules that depend on them.
            </p>
          </div>

          {/* Always Visible Modules */}
          <div className="mb-8">
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Core Modules (Always Visible)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dashboard */}
              <div className={`p-4 rounded-lg border-2 bg-[var(--color-accent-surface)]`} style={{ borderColor: 'var(--primary-color)' }}>
                <div className="flex items-start space-x-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-surface)] text-xs font-bold text-[var(--primary-color)]">
                    DA
                  </span>
                  <div>
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Overview and key metrics</p>
                  </div>
                </div>
              </div>

              {/* User Management with optional sub-modules */}
              <div className={`p-4 rounded-lg border-2 bg-[var(--color-accent-surface)]`} style={{ borderColor: 'var(--primary-color)' }}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-surface)] text-xs font-bold text-[var(--primary-color)]">
                      UM
                    </span>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>User Management</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Users, departments (always enabled)</p>
                    </div>
                  </div>
                  
                  {/* Optional sub-modules */}
                  <div className="ml-12 space-y-2">
                    <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Branches</span>
                      <input
                        type="checkbox"
                        checked={isModuleEnabled(tenant?.modules, 'branches')}
                        onChange={() => handleModuleToggle('branches')}
                        className="h-4 w-4 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Territories</span>
                      <input
                        type="checkbox"
                        checked={isModuleEnabled(tenant?.modules, 'territories')}
                        onChange={() => handleModuleToggle('territories')}
                        className="h-4 w-4 rounded"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Clients */}
              <div className={`p-4 rounded-lg border-2 bg-[var(--color-accent-surface)]`} style={{ borderColor: 'var(--primary-color)' }}>
                <div className="flex items-start space-x-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-surface)] text-xs font-bold text-[var(--primary-color)]">
                    CL
                  </span>
                  <div>
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Clients</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Clients, contacts, and leads</p>
                  </div>
                </div>
              </div>

              {/* Settings & Messages */}
              <div className={`p-4 rounded-lg border-2 bg-[var(--color-accent-surface)]`} style={{ borderColor: 'var(--primary-color)' }}>
                <div className="flex items-start space-x-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-surface)] text-xs font-bold text-[var(--primary-color)]">
                    SM
                  </span>
                  <div>
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings & Messages</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>System settings and communication</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Modules */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Optional Modules
            </h3>
            <div className="space-y-4">
              {/* Sales & Pipeline */}
              <div className={`p-4 rounded-lg border-2 transition ${
                isModuleEnabled(tenant?.modules, 'sales_pipeline')
                  ? 'bg-[var(--color-accent-surface)]'
                  : isDark ? 'border-gray-600 bg-[#334155]' : 'border-gray-300 bg-gray-50'
              }`} style={isModuleEnabled(tenant?.modules, 'sales_pipeline') ? { borderColor: 'var(--primary-color)' } : {}}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-surface)] text-xs font-bold text-[var(--primary-color)]">
                        SP
                      </span>
                      <div>
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sales & Pipeline</h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Deal management and sales tracking</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleModuleToggle('sales_pipeline')}
                      className={`p-2 rounded-lg transition text-white ${
                        isModuleEnabled(tenant?.modules, 'sales_pipeline') ? '' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                      style={isModuleEnabled(tenant?.modules, 'sales_pipeline') ? { background: 'var(--btn-brand-bg)' } : {}}
                    >
                      {isModuleEnabled(tenant?.modules, 'sales_pipeline') ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {isModuleEnabled(tenant?.modules, 'sales_pipeline') && (
                    <div className="ml-12 space-y-2 pt-2 border-t border-white/10">
                      <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Deals (required)</span>
                        <input type="checkbox" checked disabled className="h-4 w-4 rounded opacity-50" />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Sales</span>
                        <input
                          type="checkbox"
                          checked={isModuleEnabled(tenant?.modules, 'sales')}
                          onChange={() => handleModuleToggle('sales')}
                          className="h-4 w-4 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Forecasts</span>
                        <input
                          type="checkbox"
                          checked={isModuleEnabled(tenant?.modules, 'forecasts')}
                          onChange={() => handleModuleToggle('forecasts')}
                          className="h-4 w-4 rounded"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Products & Inventory */}
              <div className={`p-4 rounded-lg border-2 transition ${
                isModuleEnabled(tenant?.modules, 'products_inventory')
                  ? 'bg-[var(--color-accent-surface)]'
                  : isDark ? 'border-gray-600 bg-[#334155]' : 'border-gray-300 bg-gray-50'
              }`} style={isModuleEnabled(tenant?.modules, 'products_inventory') ? { borderColor: 'var(--primary-color)' } : {}}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-surface)] text-xs font-bold text-[var(--primary-color)]">
                      PI
                    </span>
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Products & Inventory</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Product catalog and stock management</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleModuleToggle('products_inventory')}
                    className={`p-2 rounded-lg transition text-white ${
                      isModuleEnabled(tenant?.modules, 'products_inventory') ? '' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                    style={isModuleEnabled(tenant?.modules, 'products_inventory') ? { background: 'var(--btn-brand-bg)' } : {}}
                  >
                    {isModuleEnabled(tenant?.modules, 'products_inventory') ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Performance & Analytics */}
              <div className={`p-4 rounded-lg border-2 transition ${
                isModuleEnabled(tenant?.modules, 'performance_analytics')
                  ? 'bg-[var(--color-accent-surface)]'
                  : isDark ? 'border-gray-600 bg-[#334155]' : 'border-gray-300 bg-gray-50'
              }`} style={isModuleEnabled(tenant?.modules, 'performance_analytics') ? { borderColor: 'var(--primary-color)' } : {}}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-surface)] text-xs font-bold text-[var(--primary-color)]">
                        PA
                      </span>
                      <div>
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Performance & Analytics</h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Reports and business intelligence</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleModuleToggle('performance_analytics')}
                      className={`p-2 rounded-lg transition text-white ${
                        isModuleEnabled(tenant?.modules, 'performance_analytics') ? '' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                      style={isModuleEnabled(tenant?.modules, 'performance_analytics') ? { background: 'var(--btn-brand-bg)' } : {}}
                    >
                      {isModuleEnabled(tenant?.modules, 'performance_analytics') ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {isModuleEnabled(tenant?.modules, 'performance_analytics') && (
                    <div className="ml-12 space-y-2 pt-2 border-t border-white/10">
                      <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Reports</span>
                        <input
                          type="checkbox"
                          checked={isModuleEnabled(tenant?.modules, 'reports')}
                          onChange={() => handleModuleToggle('reports')}
                          className="h-4 w-4 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Analytics</span>
                        <input
                          type="checkbox"
                          checked={isModuleEnabled(tenant?.modules, 'analytics')}
                          onChange={() => handleModuleToggle('analytics')}
                          className="h-4 w-4 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Goals & Targets</span>
                        <input
                          type="checkbox"
                          checked={isModuleEnabled(tenant?.modules, 'goals')}
                          onChange={() => handleModuleToggle('goals')}
                          className="h-4 w-4 rounded"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Automation */}
              <div className={`p-4 rounded-lg border-2 transition ${
                isModuleEnabled(tenant?.modules, 'automation')
                  ? 'bg-[var(--color-accent-surface)]'
                  : isDark ? 'border-gray-600 bg-[#334155]' : 'border-gray-300 bg-gray-50'
              }`} style={isModuleEnabled(tenant?.modules, 'automation') ? { borderColor: 'var(--primary-color)' } : {}}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-surface)] text-xs font-bold text-[var(--primary-color)]">
                        AU
                      </span>
                      <div>
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Automation</h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Workflow automation and custom fields</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleModuleToggle('automation')}
                      className={`p-2 rounded-lg transition text-white ${
                        isModuleEnabled(tenant?.modules, 'automation') ? '' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                      style={isModuleEnabled(tenant?.modules, 'automation') ? { background: 'var(--btn-brand-bg)' } : {}}
                    >
                      {isModuleEnabled(tenant?.modules, 'automation') ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {isModuleEnabled(tenant?.modules, 'automation') && (
                    <div className="ml-12 space-y-2 pt-2 border-t border-white/10">
                      <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Workflows</span>
                        <input
                          type="checkbox"
                          checked={isModuleEnabled(tenant?.modules, 'workflows')}
                          onChange={() => handleModuleToggle('workflows')}
                          className="h-4 w-4 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Custom Fields</span>
                        <input
                          type="checkbox"
                          checked={isModuleEnabled(tenant?.modules, 'customFields') || isModuleEnabled(tenant?.modules, 'custom_fields')}
                          onChange={() => handleModuleToggle('customFields')}
                          className="h-4 w-4 rounded"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Activities & Scheduling */}
              <div className={`p-4 rounded-lg border-2 transition ${
                isModuleEnabled(tenant?.modules, 'activities_scheduling')
                  ? 'bg-[var(--color-accent-surface)]'
                  : isDark ? 'border-gray-600 bg-[#334155]' : 'border-gray-300 bg-gray-50'
              }`} style={isModuleEnabled(tenant?.modules, 'activities_scheduling') ? { borderColor: 'var(--primary-color)' } : {}}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-surface)] text-xs font-bold text-[var(--primary-color)]">
                        AS
                      </span>
                      <div>
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Activities & Scheduling</h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Meetings, tasks, and calendar</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleModuleToggle('activities_scheduling')}
                      className={`p-2 rounded-lg transition text-white ${
                        isModuleEnabled(tenant?.modules, 'activities_scheduling') ? '' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                      style={isModuleEnabled(tenant?.modules, 'activities_scheduling') ? { background: 'var(--btn-brand-bg)' } : {}}
                    >
                      {isModuleEnabled(tenant?.modules, 'activities_scheduling') ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {isModuleEnabled(tenant?.modules, 'activities_scheduling') && (
                    <div className="ml-12 space-y-2 pt-2 border-t border-white/10">
                      <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Schedules</span>
                        <input
                          type="checkbox"
                          checked={isModuleEnabled(tenant?.modules, 'schedules')}
                          onChange={() => handleModuleToggle('schedules')}
                          className="h-4 w-4 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tasks</span>
                        <input
                          type="checkbox"
                          checked={isModuleEnabled(tenant?.modules, 'tasks')}
                          onChange={() => handleModuleToggle('tasks')}
                          className="h-4 w-4 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Meetings</span>
                        <input
                          type="checkbox"
                          checked={isModuleEnabled(tenant?.modules, 'meetings')}
                          onChange={() => handleModuleToggle('meetings')}
                          className="h-4 w-4 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded hover:bg-black/5">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Issues</span>
                        <input
                          type="checkbox"
                          checked={isModuleEnabled(tenant?.modules, 'issues')}
                          onChange={() => handleModuleToggle('issues')}
                          className="h-4 w-4 rounded"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
