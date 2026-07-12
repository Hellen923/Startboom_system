import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Palette, Globe, Users, UserPlus, CheckCircle,
  ArrowRight, ArrowLeft, X, Upload, Loader2, Sparkles, LayoutGrid
} from 'lucide-react';
import { tenantsAPI, usersAPI, clientsAPI, uploadAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 'welcome',      label: 'Welcome',      icon: Sparkles    },
  { id: 'branding',     label: 'Branding',     icon: Palette     },
  { id: 'localization', label: 'Localization', icon: Globe       },
  { id: 'modules',      label: 'Modules',      icon: LayoutGrid  },
  { id: 'team',         label: 'Team',         icon: Users       },
  { id: 'client',       label: 'First Client', icon: UserPlus    },
  { id: 'done',         label: 'Done',         icon: CheckCircle },
];

const MODULE_GROUPS = [
  {
    group: 'Core CRM',
    modules: [
      { id: 'clients',     label: 'Clients',     desc: 'Manage your customer base' },
      { id: 'deals',       label: 'Deals',       desc: 'Track sales pipeline' },
      { id: 'sales',       label: 'Sales',       desc: 'Record completed sales' },
      { id: 'products',    label: 'Products',    desc: 'Product catalog & inventory' },
      { id: 'territories', label: 'Territories', desc: 'Agent location assignments' },
      { id: 'meetings',    label: 'Meetings',    desc: 'Schedule & track meetings' },
      { id: 'schedules',   label: 'Schedules',   desc: 'Tasks & reminders' },
      { id: 'dashboards',  label: 'Dashboards',  desc: 'Custom dashboard views' },
      { id: 'analytics',   label: 'Analytics',   desc: 'Performance insights' },
      { id: 'reports',     label: 'Reports',     desc: 'Export & custom reports' },
    ]
  },
  {
    group: 'Finance',
    modules: [
      { id: 'finance',   label: 'Finance',   desc: 'Financial overview' },
      { id: 'invoices',  label: 'Invoices',  desc: 'Create & send invoices' },
      { id: 'payments',  label: 'Payments',  desc: 'Track payments received' },
      { id: 'expenses',  label: 'Expenses',  desc: 'Manage business expenses' },
    ]
  },
  {
    group: 'HR & People',
    modules: [
      { id: 'hr',          label: 'HR',          desc: 'Human resources management' },
      { id: 'employees',   label: 'Employees',   desc: 'Employee records' },
      { id: 'payroll',     label: 'Payroll',     desc: 'Payroll processing' },
      { id: 'recruitment', label: 'Recruitment', desc: 'Hiring & onboarding' },
    ]
  },
  {
    group: 'Marketing',
    modules: [
      { id: 'marketing',  label: 'Marketing',  desc: 'Marketing overview' },
      { id: 'campaigns',  label: 'Campaigns',  desc: 'Run marketing campaigns' },
      { id: 'emails',     label: 'Email Blasts', desc: 'Bulk email sending' },
    ]
  },
  {
    group: 'Support',
    modules: [
      { id: 'support',       label: 'Support',        desc: 'Customer support hub' },
      { id: 'tickets',       label: 'Tickets',        desc: 'Issue & ticket tracking' },
      { id: 'knowledgeBase', label: 'Knowledge Base', desc: 'Internal documentation' },
    ]
  },
  {
    group: 'Inventory',
    modules: [
      { id: 'inventory',   label: 'Inventory',   desc: 'Stock & warehouse management' },
      { id: 'warehouses',  label: 'Warehouses',  desc: 'Manage warehouse locations' },
      { id: 'stock',       label: 'Stock',       desc: 'Stock levels & alerts' },
    ]
  },
  {
    group: 'Projects',
    modules: [
      { id: 'projects',    label: 'Projects',    desc: 'Project management' },
      { id: 'tasks',       label: 'Tasks',       desc: 'Task tracking & assignment' },
      { id: 'timesheets',  label: 'Timesheets',  desc: 'Time tracking' },
    ]
  },
];

const ALL_MODULES = MODULE_GROUPS.flatMap(g => g.modules);

const CURRENCIES = ['UGX','USD','EUR','GBP','KES','TZS','RWF','NGN','GHS','ZAR'];
const TIMEZONES  = [
  'UTC','Africa/Kampala','Africa/Nairobi','Africa/Lagos','Africa/Accra',
  'Africa/Johannesburg','Africa/Cairo','Europe/London','Europe/Paris',
  'America/New_York','America/Los_Angeles','Asia/Dubai',
];
const DATE_FORMATS = ['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD'];

// ─── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ current, total }) => (
  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
    <motion.div
      className="bg-primary-500 h-1.5 rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${Math.round((current / (total - 1)) * 100)}%` }}
      transition={{ duration: 0.4 }}
    />
  </div>
);

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ steps, currentIndex }) => (
  <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
    {steps.map((step, i) => {
      const Icon = step.icon;
      const done    = i < currentIndex;
      const active  = i === currentIndex;
      return (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            done   ? 'bg-green-100 text-green-700' :
            active ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' :
                     'bg-gray-100 text-gray-400'
          }`}>
            {done
              ? <CheckCircle className="w-3.5 h-3.5" />
              : <Icon className="w-3.5 h-3.5" />
            }
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-4 h-px mx-1 ${i < currentIndex ? 'bg-green-300' : 'bg-gray-200'}`} />
          )}
        </div>
      );
    })}
  </div>
);

// ─── Step: Welcome ────────────────────────────────────────────────────────────
const StepWelcome = ({ tenantName, onNext }) => (
  <div className="text-center py-6">
    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Sparkles className="w-10 h-10 text-primary-500" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-3">
      Welcome to your CRM, {tenantName}!
    </h2>
    <p className="text-gray-500 max-w-md mx-auto mb-8">
      Let's take 2 minutes to set up your workspace. You can skip any step and come back later from Settings.
    </p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-8">
      {[
        { icon: Palette,   label: 'Brand it'     },
        { icon: Globe,     label: 'Localise'     },
        { icon: Users,     label: 'Add agents'   },
        { icon: UserPlus,  label: 'First client' },
      ].map(({ icon: Icon, label }) => (
        <div key={label} className="bg-primary-50 rounded-xl p-3 text-center">
          <Icon className="w-5 h-5 text-primary-500 mx-auto mb-1" />
          <span className="text-xs text-gray-600">{label}</span>
        </div>
      ))}
    </div>
    <button
      onClick={onNext}
      className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-colors"
    >
      Let's get started <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

// ─── Step: Branding ───────────────────────────────────────────────────────────
const StepBranding = ({ data, onChange, onUploadLogo, uploading }) => {
  const fileRef = useRef();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Brand your workspace</h2>
        <p className="text-gray-500 text-sm mt-1">Upload your logo and pick your brand colour.</p>
      </div>

      {/* Logo upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
        >
          {data.logo ? (
            <img src={data.logo} alt="logo" className="h-16 mx-auto object-contain" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click to upload logo (PNG, JPG — max 5 MB)</p>
            </>
          )}
          {uploading && (
            <div className="flex items-center justify-center gap-2 mt-2 text-primary-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files[0] && onUploadLogo(e.target.files[0])}
        />
      </div>

      {/* Company name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
        <input
          type="text"
          value={data.companyName}
          onChange={(e) => onChange('companyName', e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="e.g. Xtreative Ltd"
        />
      </div>

      {/* Primary colour */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Brand Colour</label>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={data.primaryColor}
            onChange={(e) => onChange('primaryColor', e.target.value)}
            className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer p-1"
          />
          <div className="flex gap-2 flex-wrap">
            {['#0066FF','#3b82f6','#10b981','#8b5cf6','#ef4444','#f59e0b','#06b6d4','#ec4899'].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => onChange('primaryColor', c)}
                style={{ background: c }}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  data.primaryColor === c ? 'border-gray-800 scale-110' : 'border-transparent'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Step: Localization ───────────────────────────────────────────────────────
const StepLocalization = ({ data, onChange }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-gray-900">Localise your workspace</h2>
      <p className="text-gray-500 text-sm mt-1">Set your timezone, currency and date format.</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
      <select
        value={data.timezone}
        onChange={(e) => onChange('timezone', e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {CURRENCIES.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onChange('currency', c)}
            className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
              data.currency === c
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
      <div className="flex gap-3 flex-wrap">
        {DATE_FORMATS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => onChange('dateFormat', f)}
            className={`py-2 px-4 rounded-xl border text-sm font-medium transition-colors ${
              data.dateFormat === f
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ─── Step: Modules ───────────────────────────────────────────────────────────
const StepModules = ({ enabled, onToggle }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-gray-900">Choose your modules</h2>
      <p className="text-gray-500 text-sm mt-1">Enable only what your business needs. You can change this anytime in Settings.</p>
    </div>
    {MODULE_GROUPS.map(group => (
      <div key={group.group}>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group.group}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {group.modules.map(mod => {
            const isOn = enabled[mod.id] !== false;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onToggle(mod.id, !isOn)}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  isOn ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`w-5 h-5 mt-0.5 rounded flex-shrink-0 border-2 flex items-center justify-center ${
                  isOn ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                }`}>
                  {isOn && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${isOn ? 'text-primary-700' : 'text-gray-700'}`}>{mod.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{mod.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

// ─── Step: Team ───────────────────────────────────────────────────────────────
const StepTeam = ({ onAgentCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'agent' });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState([]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      await usersAPI.registerAgent(form);
      toast.success(`${form.name} invited — OTP sent to ${form.email}`);
      setCreated(prev => [...prev, form.name]);
      setForm({ name: '', email: '', phone: '', role: 'agent' });
      onAgentCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create agent');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Add your first team member</h2>
        <p className="text-gray-500 text-sm mt-1">
          They'll receive a welcome email with a one-time password. You can add more later.
        </p>
      </div>

      {created.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-sm text-green-700 font-medium">Invited so far:</p>
          <ul className="mt-1 space-y-0.5">
            {created.map(n => (
              <li key={n} className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="jane@company.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="+256 700 000 000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={form.role}
            onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="agent">Sales Agent</option>
            <option value="manager">Manager</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={saving}
        className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {saving ? 'Sending invite...' : 'Send Invite'}
      </button>
    </div>
  );
};

// ─── Step: First Client ───────────────────────────────────────────────────────
const StepClient = ({ onClientCreated }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Name, email and phone are required');
      return;
    }
    setSaving(true);
    try {
      await clientsAPI.create({ ...form, agent: user?.id || user?._id });
      toast.success(`${form.name} added as your first client`);
      setDone(true);
      onClientCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add client');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">{form.name} added!</h3>
        <p className="text-gray-500 text-sm mt-1">You can add more clients from the Clients page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Add your first client</h2>
        <p className="text-gray-500 text-sm mt-1">
          Get started with one client. You can import more later.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="John Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="+256 700 000 000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <input
            value={form.company}
            onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Acme Ltd"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={saving}
        className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {saving ? 'Adding...' : 'Add Client'}
      </button>
    </div>
  );
};

// ─── Step: Done ───────────────────────────────────────────────────────────────
const StepDone = ({ stepsCompleted, onFinish }) => {
  const completedCount = Object.values(stepsCompleted).filter(Boolean).length;
  return (
    <div className="text-center py-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
      <p className="text-gray-500 max-w-sm mx-auto mb-6">
        {completedCount === 4
          ? 'You completed all setup steps. Your CRM is ready to go.'
          : `You completed ${completedCount} of 4 steps. You can finish the rest from Settings anytime.`}
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-8">
        {[
          { key: 'branding',     label: 'Branding'     },
          { key: 'localization', label: 'Localization' },
          { key: 'team',         label: 'Team'         },
          { key: 'client',       label: 'First Client' },
        ].map(({ key, label }) => (
          <div
            key={key}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              stepsCompleted[key]
                ? 'bg-green-50 text-green-700'
                : 'bg-gray-50 text-gray-400'
            }`}
          >
            <CheckCircle className={`w-4 h-4 ${stepsCompleted[key] ? 'text-green-500' : 'text-gray-300'}`} />
            {label}
          </div>
        ))}
      </div>

      <button
        onClick={onFinish}
        className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-colors"
      >
        Go to Dashboard <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── Main Wizard Component ────────────────────────────────────────────────────
const OnboardingWizard = ({ onComplete }) => {
  const { user, updateUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving]             = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState({
    branding: false, localization: false, team: false, client: false
  });

  // Modules state — all on by default
  const [modules, setModules] = useState(
    Object.fromEntries(ALL_MODULES.map(m => [m.id, true]))
  );

  // Branding state
  const [branding, setBranding] = useState({
    companyName:  user?.tenant?.name || '',
    logo:         '',
    primaryColor: '#FFD700',
  });

  // Localization state
  const [localization, setLocalization] = useState({
    timezone:   'Africa/Kampala',
    currency:   'UGX',
    dateFormat: 'DD/MM/YYYY',
  });

  // Load existing onboarding state on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await tenantsAPI.getOnboarding();
        const d   = res.data;
        if (d.currentStep)    setCurrentIndex(d.currentStep);
        if (d.stepsCompleted) setStepsCompleted(d.stepsCompleted);
        if (d.settings) {
          setBranding(prev => ({
            ...prev,
            companyName:  d.name || prev.companyName,
            logo:         d.settings.logo         || prev.logo,
            primaryColor: d.settings.primaryColor || prev.primaryColor,
          }));
          setLocalization(prev => ({
            ...prev,
            timezone:   d.settings.timezone   || prev.timezone,
            currency:   d.settings.currency   || prev.currency,
            dateFormat: d.settings.dateFormat  || prev.dateFormat,
          }));
        }
      } catch {
        // Non-critical — use defaults
      }
    };
    load();
  }, []);

  const handleModuleToggle = async (moduleId, value) => {
    setModules(prev => ({ ...prev, [moduleId]: value }));
    try {
      await tenantsAPI.updateModule(moduleId, value);
    } catch {
      // revert on failure
      setModules(prev => ({ ...prev, [moduleId]: !value }));
      toast.error('Failed to update module');
    }
  };

  const saveStep = async (step, completed, extraData = {}) => {
    try {
      await tenantsAPI.saveOnboarding({
        step,
        completed,
        currentStep: currentIndex,
        ...extraData
      });
      if (completed) {
        setStepsCompleted(prev => ({ ...prev, [step]: true }));
      }
    } catch {
      // Non-blocking — wizard continues even if save fails
    }
  };

  const handleUploadLogo = async (file) => {
    setUploading(true);
    try {
      const res = await uploadAPI.uploadFile(file);
      const url = res.data?.url || res.data?.path;
      setBranding(prev => ({ ...prev, logo: url }));
      toast.success('Logo uploaded');
    } catch {
      toast.error('Logo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    const stepId = STEPS[currentIndex].id;
    setSaving(true);

    try {
      if (stepId === 'branding') {
        await saveStep('branding', true, {
          logo:         branding.logo,
          primaryColor: branding.primaryColor,
          companyName:  branding.companyName,
        });
      } else if (stepId === 'localization') {
        await saveStep('localization', true, localization);
      }
    } finally {
      setSaving(false);
    }

    const next = currentIndex + 1;
    setCurrentIndex(next);
    // Persist current step position
    tenantsAPI.saveOnboarding({ step: stepId, completed: false, currentStep: next }).catch(() => {});
  };

  const handleSkip = () => {
    const stepId = STEPS[currentIndex].id;
    const next   = currentIndex + 1;
    tenantsAPI.saveOnboarding({ step: stepId, completed: false, currentStep: next }).catch(() => {});
    setCurrentIndex(next);
  };

  const handleBack = () => setCurrentIndex(prev => Math.max(0, prev - 1));

  const handleFinish = async () => {
    try {
      await tenantsAPI.saveOnboarding({ step: 'complete', completed: true, currentStep: STEPS.length - 1 });
    } catch { /* non-critical */ }
    onComplete();
  };

  const stepId = STEPS[currentIndex].id;
  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === STEPS.length - 1;
  const skippable = !['welcome', 'done'].includes(stepId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Setup Wizard</span>
            </div>
            <button
              onClick={handleFinish}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              title="Skip setup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <ProgressBar current={currentIndex} total={STEPS.length} />
          <StepIndicator steps={STEPS} currentIndex={currentIndex} />
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-8 pb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {stepId === 'welcome' && (
                <StepWelcome tenantName={branding.companyName || 'there'} onNext={handleNext} />
              )}
              {stepId === 'branding' && (
                <StepBranding
                  data={branding}
                  onChange={(k, v) => setBranding(prev => ({ ...prev, [k]: v }))}
                  onUploadLogo={handleUploadLogo}
                  uploading={uploading}
                />
              )}
              {stepId === 'localization' && (
                <StepLocalization
                  data={localization}
                  onChange={(k, v) => setLocalization(prev => ({ ...prev, [k]: v }))}
                />
              )}
              {stepId === 'modules' && (
                <StepModules enabled={modules} onToggle={handleModuleToggle} />
              )}
              {stepId === 'team' && (
                <StepTeam onAgentCreated={() => setStepsCompleted(p => ({ ...p, team: true }))} />
              )}
              {stepId === 'client' && (
                <StepClient onClientCreated={() => setStepsCompleted(p => ({ ...p, client: true }))} />
              )}
              {stepId === 'done' && (
                <StepDone stepsCompleted={stepsCompleted} onFinish={handleFinish} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav — hidden on welcome and done steps (they have their own CTAs) */}
        {!['welcome', 'done'].includes(stepId) && (
          <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={isFirst}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-3">
              {skippable && (
                <button
                  onClick={handleSkip}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Skip for now
                </button>
              )}
              {!isLast && (
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    : <>Next <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              )}
              {/* On team/client steps, "Next" moves forward after optional action */}
              {(stepId === 'team' || stepId === 'client') && (
                <button
                  onClick={() => {
                    saveStep(stepId, stepsCompleted[stepId], {}).catch(() => {});
                    setCurrentIndex(prev => prev + 1);
                  }}
                  className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default OnboardingWizard;
