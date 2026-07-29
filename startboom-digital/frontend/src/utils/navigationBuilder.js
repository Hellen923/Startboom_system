// Dynamic Navigation Builder - Generate menu based on user role and permissions
import {
  Home,
  PieChart,
  Users,
  UserPlus,
  Target,
  TrendingUp,
  Building2,
  ShieldCheck,
  ArrowLeftRight,
  Zap,
  UserCheck,
  BookUser,
  ListTodo,
  AlertTriangle,
  Package,
  MapPin,
  Brain,
  Layers,
  Trophy,
  GitBranch,
  Sliders,
  FileText,
  BarChart3,
  Calendar,
  Settings,
  Video
} from 'lucide-react';
import { MODULE_ROUTE_MAP, isModuleEnabled as isTenantModuleEnabled } from './moduleRegistry';

// Define all possible navigation items with required permissions
const ALL_NAV_ITEMS = {
  superadmin: [
    {
      title: 'Platform',
      items: [
        { path: '/dashboard', icon: PieChart, label: 'Dashboard', description: 'Welcome to HoneyPot CRM — manage every tenant, user, and platform signal from one place.', requiredRole: ['superadmin'] },
        { path: '/superadmin', icon: ShieldCheck, label: 'Command Center', description: 'Welcome to HoneyPot CRM — manage every tenant, user, and platform signal from one place.', requiredRole: ['superadmin'] },
        { path: '/superadmin/tenants', icon: Building2, label: 'Tenants', description: 'View, create, suspend, and manage all tenant organisations on the platform.', requiredRole: ['superadmin'] },
      ]
    },
    {
      title: 'Organization',
      items: [
        { path: '/admin', icon: Home, label: 'Admin View', description: 'Switch to the admin dashboard for organisation-level management.', requiredRole: ['superadmin'] },
        { path: '/admin/users', icon: UserPlus, label: 'User Management', description: 'Manage users, roles, and access across the organisation.', requiredRole: ['superadmin', 'admin', 'manager'] },
        { path: '/admin/settings', icon: Settings, label: 'Settings', description: 'Update application and account settings.', requiredRole: ['superadmin', 'admin'] },
      ]
    }
  ],
  
  admin: [
    {
      title: 'Workspace',
      items: [
        { path: '/admin', icon: PieChart, label: 'Dashboard', description: 'Welcome to HoneyPot CRM — your organisation summary with quick access to key metrics.', requiredRole: ['admin', 'manager'] },
        { path: '/admin/departments', icon: Layers, label: 'Departments & Teams', description: 'Organise your company structure, manage teams, and assign custom roles.', requiredRole: ['admin', 'manager'], requiredPermission: 'departments:view' },
        { path: '/admin/users', icon: UserPlus, label: 'User Management', description: 'Add, edit, and manage users, roles, departments, and access permissions.', requiredRole: ['admin', 'manager'], requiredPermission: 'users:view' },
        { path: '/admin/branches', icon: Building2, label: 'Branch Locations', description: 'Manage multi-location offices and hierarchical branch structure.', requiredRole: ['admin', 'manager'], requiredPermission: 'branches:view' },
        { path: '/admin/pipelines', icon: GitBranch, label: 'Pipeline Builder', description: 'Customise sales stages and business process workflows for your team.', requiredRole: ['admin', 'manager'], requiredPermission: 'pipelines:view' },
        { path: '/admin/custom-fields', icon: Sliders, label: 'Custom Fields', description: 'Add custom fields to capture industry-specific data across records.', requiredRole: ['admin', 'manager'], requiredPermission: 'custom_fields:view' },
        { path: '/admin/goals', icon: Target, label: 'Goals & Targets', description: 'Set and track progress on individual, team, and company goals.', requiredRole: ['admin', 'manager'], requiredPermission: 'goals:view' },
        { path: '/admin/activities', icon: Trophy, label: 'Performance Battle Card', description: 'Real-time leaderboard showing top performers and gamification scores.', requiredRole: ['admin', 'manager'], requiredPermission: 'activities:view' },
        { path: '/admin/workflows', icon: Zap, label: 'Workflow Automation', description: 'Automate repetitive tasks and business processes with trigger-based rules.', requiredRole: ['admin', 'manager'], requiredPermission: 'workflows:view' },
        { path: '/admin/forecasts', icon: BarChart3, label: 'Revenue Forecasts', description: 'Weighted pipeline forecasting and revenue predictions for the period ahead.', requiredRole: ['admin', 'manager'], requiredPermission: 'forecasts:view' },
        { path: '/predictive-analytics', icon: Zap, label: 'Predictive Analytics', description: 'Use AI-driven insights to make smarter decisions and accurate forecasts.', requiredRole: ['admin', 'manager'] },
        { path: '/admin/intelligence', icon: Brain, label: 'Business Intelligence', description: 'Proactive alerts, anomaly detection, and actionable insights for your business.', requiredRole: ['admin', 'manager'] },
        { path: '/admin/custom-reports', icon: FileText, label: 'Custom Reports', description: 'Build and execute custom reports with advanced filtering and export options.', requiredRole: ['admin', 'manager'], requiredPermission: 'reports:view' },
      ]
    },
    {
      title: 'Products & Territory',
      items: [
        { path: '/admin/products', icon: Package, label: 'Products', description: 'Manage your product catalogue, pricing, categories, and bulk CSV imports.', requiredRole: ['admin', 'manager'], requiredPermission: 'products:view' },
        { path: '/admin/territories', icon: MapPin, label: 'Territories', description: 'Assign agents to geographic territories and manage location-based coverage.', requiredRole: ['admin', 'manager'], requiredPermission: 'territories:view' },
        { path: '/admin/analytics', icon: TrendingUp, label: 'Analytics', description: 'Conversion rates, active vs dormant clients, and agent leaderboard by department.', requiredRole: ['admin', 'manager'] },
      ]
    },
    {
      title: 'Operations',
      items: [
        { path: '/admin/targets', icon: Target, label: 'Targets', description: 'Set monthly deal, revenue, and client targets with commission rates per agent.', requiredRole: ['admin', 'manager'] },
        { path: '/admin/tenant-settings', icon: Building2, label: 'Company Settings', description: 'Configure company profile, branding, module toggles, and advanced preferences.', requiredRole: ['admin', 'manager'] },
        { path: '/admin/bulk-operations', icon: ArrowLeftRight, label: 'Bulk Operations', description: 'Execute bulk tasks — reassign, update, or export records quickly and efficiently.', requiredRole: ['admin', 'manager'] },
        { path: '/admin/settings', icon: Settings, label: 'Settings', description: 'Update your profile, password, email templates, and security preferences.', requiredRole: ['admin', 'manager'] },
      ]
    },
    {
      title: 'Reports',
      items: [
        { path: '/admin/reports', icon: PieChart, label: 'Reports', description: 'Review sales transactions, agent performance, and deal activity across the business.', requiredRole: ['admin', 'manager'], requiredPermission: 'reports:view' },
      ]
    }
  ],
  
  agent: [
    {
      title: 'Workspace',
      items: [
        { path: '/agent', icon: PieChart, label: 'Dashboard', description: 'Welcome to HoneyPot CRM — where every opportunity finds its value.', requiredRole: ['agent'] },
        { path: '/agent/clients', icon: Users, label: 'Clients & Organizations', description: 'Manage your client accounts, track engagement, and build lasting relationships.', requiredRole: ['agent'], requiredPermission: 'clients:view' },
        { path: '/agent/contacts', icon: BookUser, label: 'Contacts', description: 'Your full contact directory — people, positions, and organisations in one place.', requiredRole: ['agent'], requiredPermission: 'contacts:view' },
        { path: '/agent/leads', icon: UserCheck, label: 'Leads', description: 'Capture, qualify, and convert prospects through your sales funnel.', requiredRole: ['agent'], requiredPermission: 'leads:view' },
        { path: '/agent/deals', icon: Target, label: 'Sales Pipeline', description: 'Track every deal from first contact to close — table, kanban, or charts.', requiredRole: ['agent'], requiredPermission: 'deals:view' },
        { path: '/agent/sales', icon: TrendingUp, label: 'Sales', description: 'Record transactions, download receipts, and monitor your revenue performance.', requiredRole: ['agent'], requiredPermission: 'sales:view' },
        { path: '/agent/products', icon: Package, label: 'Product Catalogue', description: 'Browse available products and pricing to quote clients accurately.', requiredRole: ['agent'], requiredPermission: 'products:view' },
        { path: '/agent/my-territory', icon: MapPin, label: 'My Territory', description: 'View your assigned territory, coverage area, and team members in your zone.', requiredRole: ['agent'], requiredPermission: 'territories:view' },
      ]
    },
    {
      title: 'Activities',
      items: [
        { path: '/agent/schedules', icon: Calendar, label: 'Schedules & Calendar', description: 'Plan meetings, calls, and follow-ups — list view or calendar.', requiredRole: ['agent'] },
        { path: '/agent/tasks', icon: ListTodo, label: 'Tasks', description: 'Stay on top of your daily work items and client follow-ups.', requiredRole: ['agent'] },
        { path: '/agent/meetings', icon: Video, label: 'Meetings', description: 'Schedule and track client meetings — in-person, Google Meet, Zoom, or phone.', requiredRole: ['agent'] },
        { path: '/agent/issues', icon: AlertTriangle, label: 'Issues & Support', description: 'Log and track client issues until they are fully resolved.', requiredRole: ['agent'] },
        { path: '/agent/notes', icon: FileText, label: 'Notes', description: 'Personal notes linked to clients — capture insights and follow-up reminders.', requiredRole: ['agent'] },
      ]
    }
  ]
};

/**
 * Generate navigation sections based on user role and permissions
 * @param {Object} user - Current user object with role and permissions
 * @param {Object} permissions - User's permission map (optional)
 * @returns {Array} Filtered navigation sections
 */
export const generateNavigation = (user, permissions = null) => {
  if (!user || !user.role) return [];

  let baseNav = [];
  if (user.role === 'superadmin') {
    baseNav = ALL_NAV_ITEMS.superadmin;
  } else if (user.role === 'admin' || user.role === 'manager') {
    baseNav = ALL_NAV_ITEMS.admin;
  } else if (user.role === 'agent') {
    baseNav = ALL_NAV_ITEMS.agent;
  }

  // Get enabled modules from tenant — if no modules set, everything is enabled
  const tenantModules = user.tenant?.modules || null;

  const isModuleEnabled = (path) => {
    if (!tenantModules) return true; // no restrictions set
    const moduleId = MODULE_ROUTE_MAP[path];
    if (!moduleId) return true; // not mapped = always show
    return isTenantModuleEnabled(tenantModules, moduleId);
  };

  const filteredNav = baseNav.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.requiredRole && !item.requiredRole.includes(user.role)) return false;
      if (item.requiredPermission && permissions) {
        const [module, action] = item.requiredPermission.split(':');
        if (permissions[module] && !permissions[module][action]) return false;
      }
      return isModuleEnabled(item.path);
    })
  })).filter(section => section.items.length > 0);

  return filteredNav;
};

/**
 * Check if user can access a specific route
 * @param {string} path - Route path
 * @param {Object} user - Current user object
 * @param {Object} permissions - User's permission map (optional)
 * @returns {boolean} Whether user can access the route
 */
export const canAccessRoute = (path, user, permissions = null) => {
  if (!user) return false;

  const navigation = generateNavigation(user, permissions);
  
  for (const section of navigation) {
    const hasAccess = section.items.some(item => item.path === path);
    if (hasAccess) return true;
  }

  return false;
};

/**
 * Get user's home route based on role
 * @param {Object} user - Current user object
 * @returns {string} Home route path
 */
export const getUserHomeRoute = (user) => {
  if (!user || !user.role) {
    return '/login';
  }

  const roleHomeRoutes = {
    superadmin: '/superadmin',
    admin: '/admin',
    manager: '/admin',
    agent: '/agent'
  };

  return roleHomeRoutes[user.role] || '/dashboard';
};
// eslint-disable-next-line
export default {
  generateNavigation,
  canAccessRoute,
  getUserHomeRoute
};
