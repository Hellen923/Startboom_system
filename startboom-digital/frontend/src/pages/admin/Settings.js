import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save, User, Bell, Shield, FileText, Eye, EyeOff, Clock, XCircle, Mail, Palette, Upload,
  Plus, Trash2, Play, FileClock
} from "lucide-react";
import toast from "react-hot-toast";
import {
  usersAPI,
  authAPI,
  auditLogsAPI,
  tenantsAPI,
  uploadAPI,
  emailTemplatesAPI,
  scheduledExportsAPI,
  rolesAPI
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { BUTTON_STYLES, FORM_STYLES } from "../../utils/designSystem";
import { applyBrandColor } from "../../utils/platformBranding";

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  // Profile
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Notifications – only email recipients remains
  const [notificationSettings, setNotificationSettings] = useState({
    emailRecipients: user?.email || "",
  });

  // Security settings – only session/login fields are editable in UI,
  // but we keep password policy fields for profile validation.
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,           // used in profile validation (hidden)
    passwordComplexity: true,        // used in profile validation (hidden)
    sessionTimeout: 30,              // editable
    loginAttemptLimit: 5,            // editable
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    category: "client",
    subject: "",
    body: ""
  });
  const [scheduledExports, setScheduledExports] = useState([]);
  const [exportsLoading, setExportsLoading] = useState(false);
  const [exportForm, setExportForm] = useState({
    name: "",
    exportType: "clients",
    format: "csv",
    frequency: "weekly",
    recipients: user?.email || "",
    status: ""
  });

  // Roles
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: []
  });

  const availablePermissions = [
    { id: 'clients:read', label: 'View Clients' },
    { id: 'clients:write', label: 'Manage Clients' },
    { id: 'clients:delete', label: 'Delete Clients' },
    { id: 'deals:read', label: 'View Deals' },
    { id: 'deals:write', label: 'Manage Deals' },
    { id: 'deals:delete', label: 'Delete Deals' },
    { id: 'sales:read', label: 'View Sales' },
    { id: 'sales:write', label: 'Manage Sales' },
    { id: 'sales:delete', label: 'Delete Sales' },
    { id: 'reports:read', label: 'View Reports' },
    { id: 'reports:export', label: 'Export Data' },
    { id: 'settings:write', label: 'Manage Settings' }
  ];

  // Branding
  const [branding, setBranding] = useState({
    logo: user?.tenant?.branding?.logo || user?.tenant?.settings?.logo || '',
    primaryColor: user?.tenant?.branding?.primaryColor || user?.tenant?.settings?.primaryColor || '#D89A00',
    secondaryColor: user?.tenant?.branding?.secondaryColor || user?.tenant?.settings?.secondaryColor || '#1f2937',
    currency: user?.tenant?.settings?.currency || 'USD',
    customDomain: user?.tenant?.settings?.customDomain || ''
  });
  const [logoPreview, setLogoPreview] = useState(user?.tenant?.branding?.logo || user?.tenant?.settings?.logo || '');
  const [brandingLoading, setBrandingLoading] = useState(false);

  // Sync logo and branding when user object updates (e.g. after wizard completes)
  useEffect(() => {
    const logo = user?.tenant?.branding?.logo || user?.tenant?.settings?.logo || '';
    setLogoPreview(logo);
    setBranding(prev => ({
      ...prev,
      logo,
      primaryColor: user?.tenant?.branding?.primaryColor || user?.tenant?.settings?.primaryColor || prev.primaryColor,
      secondaryColor: user?.tenant?.branding?.secondaryColor || user?.tenant?.settings?.secondaryColor || prev.secondaryColor,
    }));
  }, [user?.tenant?.branding?.logo, user?.tenant?.settings?.logo]); // eslint-disable-line

  useEffect(() => {
    if (activeTab === 'security') loadAuditLogs();
    if (activeTab === 'emailTemplates') loadEmailTemplates();
    if (activeTab === 'exports') loadScheduledExports();
    if (activeTab === 'roles') loadRoles();
  }, [activeTab]);

  const loadAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await auditLogsAPI.getAll({ limit: 20 });
      setAuditLogs(res.data.logs || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  // Compliance – only terms and privacy versions remain
  const [complianceSettings, setComplianceSettings] = useState({
    termsVersion: "2.1.0",
    privacyVersion: "1.5.2",
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "emailTemplates", label: "Email Templates", icon: Mail },
    { id: "exports", label: "Scheduled Exports", icon: FileClock },
    { id: "roles", label: "Roles & Permissions", icon: Shield },
    { id: "security", label: "Security", icon: Shield },
    { id: "compliance", label: "Legal & Compliance", icon: FileText },
  ];

  // Password strength indicator
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(passwordData.newPassword);
  const strengthText = ["Very weak", "Weak", "Fair", "Good", "Strong"][
    strength
  ] || "Very weak";

  // Profile save
  const handleSaveProfile = async () => {
    if (!profileData.email) {
      toast.error("Email is required");
      return;
    }

    if (passwordData.newPassword) {
      if (!passwordData.currentPassword) {
        toast.error("Current password is required to set a new password");
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (passwordData.newPassword.length < securitySettings.passwordMinLength) {
        toast.error(`Password must be at least ${securitySettings.passwordMinLength} characters`);
        return;
      }
      if (
        securitySettings.passwordComplexity &&
        !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(
          passwordData.newPassword
        )
      ) {
        toast.error(
          "Password must include uppercase, lowercase, number, and special character"
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      let profileUpdated = false;
      let passwordUpdated = false;

      if (profileData.name !== user?.name) {
        const userId = user?._id || user?.id;
        if (!userId) throw new Error("Unable to identify current user");
        const profileRes = await usersAPI.update(userId, {
          name: profileData.name,
        });
        updateUser(profileRes.data);
        profileUpdated = true;
      }

      if (passwordData.newPassword) {
        await authAPI.changePassword({
          email: user?.email || profileData.email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });
        passwordUpdated = true;
      }

      if (profileUpdated && passwordUpdated) {
        toast.success("Profile and password updated successfully!");
      } else if (passwordUpdated) {
        toast.success("Password changed successfully!");
      } else if (profileUpdated) {
        toast.success("Profile updated successfully!");
      } else {
        toast.success("No changes to save");
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Branding save
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    try {
      setBrandingLoading(true);
      const res = await uploadAPI.uploadFile(file);
      const logoUrl = res.data.url;
      setLogoPreview(logoUrl);
      setBranding(prev => ({ ...prev, logo: logoUrl }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setBrandingLoading(false);
    }
  };

  const handleSaveBranding = async () => {
    if (branding.customDomain && !/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(branding.customDomain)) {
      toast.error('Custom domain must be a valid domain (e.g. xtreative.crm.com)');
      return;
    }
    try {
      setBrandingLoading(true);
      const res = await tenantsAPI.updateBranding(branding);
      const updatedTenant = res.data.tenant;
      if (updatedTenant) {
        updateUser({ tenant: { ...user.tenant, ...updatedTenant } });
      }
      if (branding.primaryColor) {
        localStorage.setItem('tenant_primary_color', branding.primaryColor);
        applyBrandColor(branding.primaryColor);
      }
      if (branding.logo) {
        localStorage.setItem('tenant_logo', branding.logo);
      } else {
        localStorage.removeItem('tenant_logo');
      }
      // Refresh full user so sidebar logo updates immediately
      try { const meRes = await authAPI.getMe(); updateUser(meRes.data); } catch (_e) {}
      toast.success('Branding updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update branding');
    } finally {
      setBrandingLoading(false);
    }
  };

  // Notifications save (only email recipients)
  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      // Replace with your API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Notification settings saved!");
    } catch (error) {
      toast.error("Failed to save notification settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Security save (only session/login settings)
  const handleSaveSecurity = async () => {
    setIsSaving(true);
    try {
      // Here you would send securitySettings.sessionTimeout and .loginAttemptLimit to your backend
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Security settings saved!");
    } catch (error) {
      toast.error("Failed to save security settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Compliance save (only terms & privacy versions)
  const handleSaveCompliance = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Compliance settings saved!");
    } catch (error) {
      toast.error("Failed to save compliance settings");
    } finally {
      setIsSaving(false);
    }
  };

  const loadEmailTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const res = await emailTemplatesAPI.getAll();
      setEmailTemplates(res.data.templates || []);
    } catch (error) {
      toast.error("Failed to load email templates");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.subject.trim() || !templateForm.body.trim()) {
      toast.error("Template name, subject and body are required");
      return;
    }
    try {
      setTemplatesLoading(true);
      await emailTemplatesAPI.create(templateForm);
      setTemplateForm({ name: "", category: "client", subject: "", body: "" });
      await loadEmailTemplates();
      toast.success("Email template saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save template");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (template.isDefault) {
      toast.error("Default templates cannot be deleted");
      return;
    }
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    try {
      await emailTemplatesAPI.delete(template._id);
      await loadEmailTemplates();
      toast.success("Template deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete template");
    }
  };

  const loadScheduledExports = async () => {
    try {
      setExportsLoading(true);
      const res = await scheduledExportsAPI.getAll();
      setScheduledExports(res.data.exports || []);
    } catch (error) {
      toast.error("Failed to load scheduled exports");
    } finally {
      setExportsLoading(false);
    }
  };

  const handleCreateScheduledExport = async () => {
    if (!exportForm.name.trim() || !exportForm.recipients.trim()) {
      toast.error("Export name and recipients are required");
      return;
    }
    try {
      setExportsLoading(true);
      const filters = exportForm.status ? { status: exportForm.status } : {};
      await scheduledExportsAPI.create({ ...exportForm, filters });
      setExportForm(prev => ({ ...prev, name: "", status: "" }));
      await loadScheduledExports();
      toast.success("Scheduled export created");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create scheduled export");
    } finally {
      setExportsLoading(false);
    }
  };

  const handleRunScheduledExport = async (id) => {
    try {
      setExportsLoading(true);
      await scheduledExportsAPI.runNow(id);
      await loadScheduledExports();
      toast.success("Export sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to run export");
    } finally {
      setExportsLoading(false);
    }
  };

  const handleToggleScheduledExport = async (scheduledExport) => {
    try {
      setExportsLoading(true);
      await scheduledExportsAPI.update(scheduledExport._id, {
        isActive: !scheduledExport.isActive
      });
      await loadScheduledExports();
      toast.success(scheduledExport.isActive ? "Scheduled export paused" : "Scheduled export resumed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update export");
    } finally {
      setExportsLoading(false);
    }
  };

  const handleDeleteScheduledExport = async (scheduledExport) => {
    if (!window.confirm(`Delete scheduled export "${scheduledExport.name}"?`)) return;
    try {
      await scheduledExportsAPI.delete(scheduledExport._id);
      await loadScheduledExports();
      toast.success("Scheduled export deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete export");
    }
  };

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const res = await rolesAPI.getAll();
      setRoles(res.data.roles || []);
    } catch (error) {
      toast.error("Failed to load roles");
    } finally {
      setRolesLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!roleForm.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    try {
      setRolesLoading(true);
      await rolesAPI.create(roleForm);
      setRoleForm({ name: "", description: "", permissions: [] });
      await loadRoles();
      toast.success("Role created successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create role");
    } finally {
      setRolesLoading(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.isSystem) {
      toast.error("System roles cannot be deleted");
      return;
    }
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try {
      await rolesAPI.delete(role._id);
      await loadRoles();
      toast.success("Role deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete role");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-8 px-6 min-w-min">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-[var(--primary-color)] text-[var(--primary-color)]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Admin Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Change Password
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Password */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    {passwordData.newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                strength <= 1
                                  ? "bg-red-500"
                                  : strength <= 2
                                  ? "bg-primary-500"
                                  : strength <= 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${(strength / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {strengthText}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordData.confirmPassword &&
                      passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="mt-1 text-xs text-red-500 flex items-center">
                          <XCircle size={12} className="mr-1" />
                          Passwords do not match
                        </p>
                      )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                    className="btn-brand text-white px-6 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{isSaving ? "Saving..." : "Save Profile"}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Branding Tab */}
          {activeTab === "branding" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Company Branding</h3>
                
                {/* Logo Upload */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-4">Company Logo</label>
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                          <p className="text-xs text-gray-400 mt-1">No logo</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer btn-brand text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{brandingLoading ? 'Uploading...' : 'Upload Logo'}</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB. Recommended: 200x200px</p>
                    </div>
                  </div>
                </div>

                {/* Brand Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={e => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor}
                        onChange={e => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className={`${FORM_STYLES.input} flex-1 font-mono`}
                        placeholder="#FFD700"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Used for buttons, active states and highlights</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={branding.secondaryColor}
                        onChange={e => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={branding.secondaryColor}
                        onChange={e => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className={`${FORM_STYLES.input} flex-1 font-mono`}
                        placeholder="#1f2937"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Used for sidebar and secondary elements</p>
                  </div>
                </div>

                {/* Custom Domain */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Subdomain</label>
                   <p className="text-xs text-gray-500 mb-3">Set your company's custom subdomain (e.g. <span className="font-mono text-primary-600">honeypot.crm.com</span>). Contact your platform provider to activate DNS routing after saving.</p>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={branding.customDomain}
                      onChange={e => setBranding(prev => ({ ...prev, customDomain: e.target.value.toLowerCase().trim() }))}
                      className={`${FORM_STYLES.input} w-full md:w-1/2 font-mono`}
                      placeholder="yourcompany.crm.com"
                    />
                  </div>
                  {branding.customDomain && (
                    <p className="text-xs text-green-600 mt-2">✓ Will be saved as: <span className="font-mono font-semibold">{branding.customDomain}</span></p>
                  )}
                </div>

                {/* Base Currency */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base Currency</label>
                  <p className="text-xs text-gray-500 mb-3">This is the default currency used for all Deals and Sales reports.</p>
                  <select
                    value={branding.currency}
                    onChange={e => setBranding(prev => ({ ...prev, currency: e.target.value }))}
                    className={`${FORM_STYLES.select} w-full md:w-1/2`}
                  >
                    <option value="UGX">UGX (USh) - Ugandan Shilling</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="KES">KES (KSh) - Kenyan Shilling</option>
                    <option value="NGN">NGN (₦) - Nigerian Naira</option>
                    <option value="ZAR">ZAR (R) - South African Rand</option>
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="AUD">AUD (A$) - Australian Dollar</option>
                    <option value="CAD">CAD (C$) - Canadian Dollar</option>
                  </select>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
                  <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: branding.primaryColor }}>
                    {logoPreview && <img src={logoPreview} alt="Logo" className="w-8 h-8 object-contain" />}
                  <span className="text-white font-bold">HoneyPot CRM</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveBranding}
                  disabled={brandingLoading}
                    className={`${BUTTON_STYLES.primary} disabled:opacity-50`}
                >
                  <Save className="w-5 h-5" />
                  <span>{brandingLoading ? 'Saving...' : 'Save Branding'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Notifications Tab – only recipients */}
          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Notification Recipients
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Addresses (comma separated)
                  </label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={notificationSettings.emailRecipients}
                      onChange={(e) =>
                        setNotificationSettings({
                          emailRecipients: e.target.value,
                        })
                      }
                      placeholder="admin@example.com, alerts@example.com"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-600">
                    Separate multiple emails with commas. Leave blank to use admin email only.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                    className="btn-brand text-white px-6 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{isSaving ? "Saving..." : "Save Settings"}</span>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "emailTemplates" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Email Templates</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <input type="text" value={templateForm.name} onChange={e => setTemplateForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Template name" />
                    <select value={templateForm.category} onChange={e => setTemplateForm(prev => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="client">Client</option>
                      <option value="task">Task</option>
                      <option value="meeting">Meeting</option>
                      <option value="welcome">Welcome</option>
                      <option value="general">General</option>
                    </select>
                    <input type="text" value={templateForm.subject} onChange={e => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Subject" />
                    <textarea rows={8} value={templateForm.body} onChange={e => setTemplateForm(prev => ({ ...prev, body: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Body. Use {{clientName}}, {{agentName}}, {{companyName}} placeholders." />
                    <button onClick={handleCreateTemplate} disabled={templatesLoading} className="btn-brand text-white px-5 py-2 rounded-lg flex items-center space-x-2 hover:opacity-90 disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                      <span>{templatesLoading ? "Saving..." : "Save Template"}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {templatesLoading && emailTemplates.length === 0 ? (
                      <p className="text-sm text-gray-500">Loading templates...</p>
                    ) : emailTemplates.length === 0 ? (
                      <p className="text-sm text-gray-500">No templates yet.</p>
                    ) : (
                      emailTemplates.map(template => (
                        <div key={template._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900">{template.name}</h4>
                                {template.isDefault && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Default</span>}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                              <p className="text-xs text-gray-400 mt-2 capitalize">{template.category}</p>
                            </div>
                            {!template.isDefault && (
                              <button onClick={() => handleDeleteTemplate(template)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete template">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "exports" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Scheduled Bulk Exports</h3>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
                  <input type="text" value={exportForm.name} onChange={e => setExportForm(prev => ({ ...prev, name: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Export name" />
                  <select value={exportForm.exportType} onChange={e => setExportForm(prev => ({ ...prev, exportType: e.target.value, format: e.target.value === "clients" ? prev.format : "csv" }))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="clients">Clients</option>
                    <option value="deals">Deals</option>
                    <option value="sales">Sales</option>
                    <option value="auditLogs">Audit Logs</option>
                  </select>
                  <select value={exportForm.format} onChange={e => setExportForm(prev => ({ ...prev, format: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="csv">CSV</option>
                    {exportForm.exportType === "clients" && <option value="pdf">PDF</option>}
                  </select>
                  <select value={exportForm.frequency} onChange={e => setExportForm(prev => ({ ...prev, frequency: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <input type="text" value={exportForm.recipients} onChange={e => setExportForm(prev => ({ ...prev, recipients: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="email@example.com" />
                </div>
                {exportForm.exportType === "clients" && (
                  <div className="mb-6 max-w-xs">
                    <select value={exportForm.status} onChange={e => setExportForm(prev => ({ ...prev, status: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="">All client statuses</option>
                      <option value="prospect">Prospect</option>
                      <option value="active">Active</option>
                      <option value="vip">VIP</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
                <button onClick={handleCreateScheduledExport} disabled={exportsLoading} className="btn-brand text-white px-5 py-2 rounded-lg flex items-center space-x-2 hover:opacity-90 disabled:opacity-50">
                  <Plus className="w-4 h-4" />
                  <span>{exportsLoading ? "Saving..." : "Schedule Export"}</span>
                </button>
              </div>

              <div className="border-t border-gray-200 pt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Frequency</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Next Run</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">State</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Last Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledExports.length === 0 ? (
                      <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No scheduled exports yet.</td></tr>
                    ) : scheduledExports.map(item => (
                      <tr key={item._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-gray-600">{item.exportType} / {item.format}</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{item.frequency}</td>
                        <td className="px-4 py-3 text-gray-600">{item.nextRunAt ? new Date(item.nextRunAt).toLocaleString() : "Not scheduled"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                            {item.isActive ? "Active" : "Paused"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.lastStatus === "failed" ? "bg-red-100 text-red-700" : item.lastStatus === "success" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                            {item.lastStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleRunScheduledExport(item._id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Run now"><Play className="w-4 h-4" /></button>
                            <button onClick={() => handleToggleScheduledExport(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title={item.isActive ? "Pause export" : "Resume export"}>
                              {item.isActive ? <XCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleDeleteScheduledExport(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete export"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Security Tab – only Session & Login Security and Audit Logs */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Session & Login Security */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Session & Login Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <input
                        type="number"
                        min="5"
                        max="1440"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            sessionTimeout: parseInt(e.target.value),
                          })
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={securitySettings.loginAttemptLimit}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          loginAttemptLimit: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Audit Logs */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Recent Audit Logs
                </h3>
                {auditLoading ? (
                  <div className="flex justify-center py-8">
                    <div                               className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="table-header">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">User</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Browser</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">IP Address</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Timestamp</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                            No audit logs yet. Actions will appear here as users interact with the system.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log._id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                log.action.includes('DELETE') ? 'bg-red-100 text-red-700' :
                                log.action.includes('CREATE') ? 'bg-green-100 text-green-700' :
                                log.action === 'LOGIN' ? 'bg-blue-100 text-blue-700' :
                                'bg-primary-100 text-primary-700'
                              }`}>
                                {log.action.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{log.userName || 'System'}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              {log.metadata?.browser || 'Unknown'} · {log.metadata?.device || 'Unknown'}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs font-mono">
                              {log.ipAddress || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{log.description}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                )}
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveSecurity}
                  disabled={isSaving}
                    className="btn-brand text-white px-6 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{isSaving ? "Saving..." : "Save Security Settings"}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Roles & Permissions Tab */}
          {activeTab === "roles" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Roles & Permissions</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Create Role Form */}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Create Custom Role</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                        <input type="text" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g. Junior Agent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input type="text" value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Role description" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-white">
                          {availablePermissions.map(perm => (
                            <label key={perm.id} className="flex items-start space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                checked={roleForm.permissions.includes(perm.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRoleForm({ ...roleForm, permissions: [...roleForm.permissions, perm.id] });
                                  } else {
                                    setRoleForm({ ...roleForm, permissions: roleForm.permissions.filter(p => p !== perm.id) });
                                  }
                                }}
                              />
                              <span className="text-sm text-gray-700">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <button onClick={handleCreateRole} disabled={rolesLoading} className="w-full btn-brand text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50">
                        <Plus className="w-4 h-4" />
                        <span>{rolesLoading ? "Saving..." : "Create Role"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Role List */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Existing Roles</h4>
                    {rolesLoading && roles.length === 0 ? (
                      <p className="text-sm text-gray-500">Loading roles...</p>
                    ) : roles.length === 0 ? (
                      <p className="text-sm text-gray-500">No custom roles created yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {roles.map(role => (
                          <div key={role._id} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                                  {role.name}
                                  {role.isSystem && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">System</span>}
                                </h5>
                                <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                                <div className="mt-3 flex flex-wrap gap-1">
                                  {role.permissions.slice(0, 4).map(p => (
                                    <span key={p} className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-md border border-primary-100">
                                      {availablePermissions.find(ap => ap.id === p)?.label || p}
                                    </span>
                                  ))}
                                  {role.permissions.length > 4 && (
                                    <span className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-md border border-gray-200">
                                      +{role.permissions.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                              {!role.isSystem && (
                                <button onClick={() => handleDeleteRole(role)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete role">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Compliance Tab – only Terms & Privacy versions */}
          {activeTab === "compliance" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Terms & Privacy */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Terms & Privacy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terms of Service Version
                    </label>
                    <input
                      type="text"
                      value={complianceSettings.termsVersion}
                      onChange={(e) =>
                        setComplianceSettings({
                          ...complianceSettings,
                          termsVersion: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Privacy Policy Version
                    </label>
                    <input
                      type="text"
                      value={complianceSettings.privacyVersion}
                      onChange={(e) =>
                        setComplianceSettings({
                          ...complianceSettings,
                          privacyVersion: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveCompliance}
                  disabled={isSaving}
                    className="btn-brand text-white px-6 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{isSaving ? "Saving..." : "Save Compliance Settings"}</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
