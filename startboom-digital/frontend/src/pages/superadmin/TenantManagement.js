import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, CheckCircle, XCircle, Clock, Edit, Eye, X, Trash2, Users, MapPin } from 'lucide-react';
import { tenantsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.inactive}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

const CreateTenantModal = ({ onClose, onCreated }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', sector: '',
    addressStreet: '', addressCity: '', addressState: '', addressCountry: '',
    adminName: '', adminPhone: '', subscriptionPlan: 'starter',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const steps = ['Organization', 'Admin & Plan'];

  const handleNext = () => {
    if (!form.name || !form.email) {
      toast.error('Organization name and email are required to continue');
      return;
    }
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep === 0) {
      handleNext();
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || '',
      address: {
        street: form.addressStreet || '',
        city: form.addressCity || '',
        state: form.addressState || '',
        country: form.addressCountry || '',
      },
      adminName: form.adminName || `${form.name} Admin`,
      subscriptionPlan: form.subscriptionPlan,
      metadata: { industry: form.sector || '' },
    };

    try {
      setLoading(true);
      const res = await tenantsAPI.create(payload);
      setSuccess(res.data);
      onCreated();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Organization Created!</h2>
          <p className="text-gray-600 mb-4">
            <span className="font-semibold text-primary-600">{success.tenant?.name}</span> has been registered on the platform.
          </p>

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-left mb-4">
            <p className="text-sm font-semibold text-primary-800 mb-2">Admin Account Created:</p>
            <p className="text-sm text-gray-700">👤 Name: <span className="font-medium">{success.admin?.name}</span></p>
            <p className="text-sm text-gray-700">📧 Email: <span className="font-medium">{success.admin?.email}</span></p>
            <p className="text-sm text-gray-700">🔑 Role: <span className="font-medium">Admin</span></p>
          </div>

          {success.emailSent ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-semibold text-green-700">Email Sent Successfully!</p>
              </div>
              <p className="text-sm text-green-600">Welcome email with login credentials was sent to <strong>{success.admin?.email}</strong></p>
              <p className="text-xs text-green-500 mt-1">They can log in immediately and will be prompted to set a new password.</p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2 mb-1">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-semibold text-red-700">Email Failed to Send</p>
              </div>
              <p className="text-sm text-red-600">Please share this OTP manually with <strong>{success.admin?.email}</strong>:</p>
              <div className="bg-white border-2 border-red-300 rounded-xl p-3 mt-2">
                <p className="text-2xl font-mono font-bold text-center text-gray-900 tracking-widest">{success.otp}</p>
              </div>
              <p className="text-xs text-red-500 mt-2">Login URL: https://crm-dbs.vercel.app/login</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="brand-header p-2 rounded-xl">
              <img src={logo} alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Create New Organization</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`rounded-full px-3 py-2 text-sm font-semibold text-center ${currentStep === index ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {step}
              </div>
            ))}
          </div>

          {currentStep === 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. Xtreative Ltd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="admin@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sector / Industry</label>
                <select
                  value={form.sector}
                  onChange={e => setForm({ ...form, sector: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select sector…</option>
                  <option value="IT">IT / Technology</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Finance">Finance / Banking</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Education">Education</option>
                  <option value="Retail">Retail</option>
                  <option value="Logistics">Logistics / Transport</option>
                  <option value="Construction">Construction</option>
                  <option value="Media">Media / Entertainment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="+256 200 000 000"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Organization Address
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.addressStreet}
                    onChange={e => setForm({ ...form, addressStreet: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Street address"
                  />
                  <input
                    type="text"
                    value={form.addressCity}
                    onChange={e => setForm({ ...form, addressCity: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={form.addressState}
                    onChange={e => setForm({ ...form, addressState: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="State / Region"
                  />
                  <input
                    type="text"
                    value={form.addressCountry}
                    onChange={e => setForm({ ...form, addressCountry: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Country"
                  />
                </div>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                <input
                  type="text"
                  value={form.adminName}
                  onChange={e => setForm({ ...form, adminName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Phone</label>
                <input
                  type="text"
                  value={form.adminPhone}
                  onChange={e => setForm({ ...form, adminPhone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="+256 700 000 000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                <select
                  value={form.subscriptionPlan}
                  onChange={e => setForm({ ...form, subscriptionPlan: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="starter">Starter - Free</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Previous
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : currentStep === 0 ? 'Next' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewDetailsModal = ({ tenant, onClose }) => {
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await tenantsAPI.getProfile(tenant._id);
        setProfile(res.data);
        setUsers(res.data?.users || []);
      } catch (error) {
        toast.error('Failed to load organization profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [tenant._id]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="brand-header p-2 rounded-xl">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Organization Details</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Organization Name</label>
                <p className="text-lg font-semibold text-gray-900">{tenant.name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Email</label>
                <p className="text-gray-700">{tenant.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Sector / Industry</label>
                <p className="text-gray-700">{tenant.metadata?.industry || <span className="text-gray-400 italic">Not set</span>}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Organization Phone</label>
                <p className="text-gray-700">{tenant.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Admin Contact</label>
                <p className="text-gray-700">{profile?.impact?.adminName || tenant.ownerName || 'N/A'}</p>
                <p className="text-sm text-gray-500">{profile?.impact?.adminEmail || ''}</p>
                <p className="text-sm text-gray-500">{profile?.impact?.adminPhone || ''}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Address</label>
                <p className="text-gray-700">
                  {tenant.address?.street
                    ? [tenant.address.street, tenant.address.city, tenant.address.state, tenant.address.country].filter(Boolean).join(', ')
                    : <span className="text-gray-400 italic">Not set</span>}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Custom Domain</label>
                <p className="text-gray-700 font-mono text-sm">
                  {tenant.settings?.customDomain
                    ? <a href={`https://${tenant.settings.customDomain}`} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">{tenant.settings.customDomain}</a>
                    : <span className="text-gray-400 italic">Not configured</span>}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Status</label>
                <StatusBadge status={tenant.status} />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Created Date</label>
                <p className="text-gray-700">{new Date(tenant.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Subscription Plan</label>
                <p className="text-gray-900 font-medium capitalize">{tenant.subscriptionPlan || 'Starter'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">User Count</label>
                <p className="text-2xl font-bold text-primary-600">{profile?.impact?.users ?? tenant.userCount ?? 0}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Security Score</label>
                <p className="text-2xl font-bold text-blue-600">{profile?.securityScore ?? '...'}%</p>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">Usage Statistics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{tenant.usage?.totalUsers || 0}</p>
                <p className="text-xs text-blue-600">Users</p>
                <p className="text-xs text-gray-500 mt-1">/{tenant.settings?.features?.maxUsers || 100} max</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{tenant.usage?.totalClients || 0}</p>
                <p className="text-xs text-green-600">Clients</p>
                <p className="text-xs text-gray-500 mt-1">/{tenant.settings?.features?.maxClients || 1000} max</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{tenant.usage?.totalDeals || 0}</p>
                <p className="text-xs text-purple-600">Deals</p>
                <p className="text-xs text-gray-500 mt-1">/{tenant.settings?.features?.maxDeals || 500} max</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-700">{tenant.usage?.storageUsed || 0} MB</p>
                <p className="text-xs text-gray-600">Storage</p>
                <p className="text-xs text-gray-500 mt-1">Recorded usage</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">Activity Timeline</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(profile?.timeline || []).length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">No activity recorded for this organization yet</div>
              ) : (
                profile.timeline.slice(0, 10).map((item) => (
                  <div key={item._id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.action} · {item.status}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Users List */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">Organization Users</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <p className="text-gray-500">No users found in this organization</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user._id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600 font-bold text-sm">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-primary-600 capitalize">{user.role}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EditModal = ({ tenant, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    name: tenant.name || '',
    email: tenant.email || '',
    phone: tenant.phone || '',
    maxUsers: tenant.settings?.features?.maxUsers || 100,
    maxClients: tenant.settings?.features?.maxClients || 1000,
    maxDeals: tenant.settings?.features?.maxDeals || 500,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await tenantsAPI.update(tenant._id, form);
      toast.success('Organization updated successfully');
      onUpdated();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="brand-header p-2 rounded-xl">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Edit Organization</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Organization name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Phone number"
            />
          </div>
          <div className="border-t border-gray-100 pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Users Limit</label>
            <input
              type="number"
              value={form.maxUsers}
              onChange={e => setForm({ ...form, maxUsers: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Clients Limit</label>
            <input
              type="number"
              value={form.maxClients}
              onChange={e => setForm({ ...form, maxClients: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Deals Limit</label>
            <input
              type="number"
              value={form.maxDeals}
              onChange={e => setForm({ ...form, maxDeals: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min="1"
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteModal = ({ tenant, onClose, onDeleted }) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== tenant.name) return;
    try {
      setLoading(true);
      await tenantsAPI.delete(tenant._id);
      toast.success('Organization deleted successfully');
      onDeleted();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-xl">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Delete Organization</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <p className="text-gray-600 mb-4">This action cannot be undone. This will permanently delete the</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-sm font-semibold text-red-800">{tenant.name}</p>
          <p className="text-xs text-red-600 mt-1">and all associated data.</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type the organization name <span className="font-bold text-primary-600">{tenant.name}</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Type organization name here"
          />
        </div>
        <button
          onClick={handleDelete}
          disabled={loading || confirmText !== tenant.name}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Deleting...' : 'Delete Organization'}
        </button>
      </div>
    </div>
  );
};

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location?.state?.search) {
      setSearch(location.state.search);
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (location?.state?.openCreate) {
      setShowCreateModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await tenantsAPI.getAll();
      const tenantsData = res.data.tenants || [];
      // Fetch user count for each tenant
      const tenantsWithCounts = await Promise.all(
        tenantsData.map(async (tenant) => {
          try {
            const stats = await tenantsAPI.getStats(tenant._id);
            return { ...tenant, userCount: stats.data?.userCount || 0 };
          } catch (error) {
            return { ...tenant, userCount: 0 };
          }
        })
      );
      setTenants(tenantsWithCounts);
    } catch (error) {
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (tenantId, currentStatus, tenantName) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await tenantsAPI.control(tenantId, { action: newStatus === 'active' ? 'reactivate' : 'suspend' });
      toast.success(`${tenantName} has been ${newStatus}`);
      loadTenants();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleLockdown = async (tenantId, tenantName) => {
    const confirmed = window.confirm(`Emergency lockdown will immediately suspend ${tenantName}. Continue?`);
    if (!confirmed) return;
    try {
      await tenantsAPI.control(tenantId, { action: 'lockdown', reason: 'Emergency lockdown from Tenant Management' });
      toast.success(`${tenantName} is now in emergency lockdown`);
      loadTenants();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply lockdown');
    }
  };

  const handleScheduleDeactivation = async (tenantId, tenantName) => {
    const scheduledAt = window.prompt(`Enter deactivation date/time for ${tenantName} (YYYY-MM-DDTHH:mm)`);
    if (!scheduledAt) return;
    try {
      await tenantsAPI.control(tenantId, {
        action: 'schedule_deactivation',
        scheduledAt,
        reason: 'Scheduled from Tenant Management'
      });
      toast.success(`Deactivation scheduled for ${tenantName}`);
      loadTenants();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule deactivation');
    }
  };

  const handleDelete = async (tenantId) => {
    try {
      await tenantsAPI.delete(tenantId);
      toast.success('Organization deleted successfully');
      loadTenants();
    } catch (error) {
      toast.error('Failed to delete organization');
    }
  };

  const filtered = tenants.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Organization</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'trial', 'suspended'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      statusFilter === s
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filtered.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{tenants.length}</span> organizations
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Deals</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Limits</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No organizations found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((tenant) => (
                  <tr key={tenant._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-600 font-bold text-sm">
                            {tenant.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{tenant.name}</p>
                          <p className="text-xs text-gray-500">{tenant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={tenant.status} /></td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-medium">{tenant.userCount || tenant.usage?.totalUsers || 0}</span>
                      <span className="text-gray-400 text-xs">/{tenant.settings?.features?.maxUsers || 100}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-medium">{tenant.usage?.totalClients || 0}</span>
                      <span className="text-gray-400 text-xs">/{tenant.settings?.features?.maxClients || 1000}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-medium">{tenant.usage?.totalDeals || 0}</span>
                      <span className="text-gray-400 text-xs">/{tenant.settings?.features?.maxDeals || 500}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="w-24 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-primary-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(((tenant.userCount || tenant.usage?.totalUsers || 0) / (tenant.settings?.features?.maxUsers || 100)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(((tenant.userCount || tenant.usage?.totalUsers || 0) / (tenant.settings?.features?.maxUsers || 100)) * 100)}% users used
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowViewModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(tenant._id, tenant.status, tenant.name)}
                          className={`p-2 rounded-lg transition-colors ${
                            tenant.status === 'active'
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          title={tenant.status === 'active' ? 'Suspend' : 'Activate'}
                        >
                          {tenant.status === 'active' ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleLockdown(tenant._id, tenant.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Emergency Lockdown"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleScheduleDeactivation(tenant._id, tenant.name)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Schedule Deactivation"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTenantModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadTenants}
        />
      )}
      {showViewModal && selectedTenant && (
        <ViewDetailsModal
          tenant={selectedTenant}
          onClose={() => {
            setShowViewModal(false);
            setSelectedTenant(null);
          }}
        />
      )}
      {showEditModal && selectedTenant && (
        <EditModal
          tenant={selectedTenant}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTenant(null);
          }}
          onUpdated={loadTenants}
        />
      )}
      {showDeleteModal && selectedTenant && (
        <DeleteModal
          tenant={selectedTenant}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTenant(null);
          }}
          onDeleted={() => {
            setShowDeleteModal(false);
            setSelectedTenant(null);
            loadTenants();
          }}
        />
      )}
    </div>
  );
};

export default TenantManagement;
