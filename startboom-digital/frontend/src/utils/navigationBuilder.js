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
  Settings
} from 'lucide-react';

// Define all possible navigation items with required permissions
const ALL_NAV_ITEMS = {
  superadmin: [
    {
      title: 'Platform',
      items: [
        { path: '/dashboard', icon: PieChart, label: 'Dashboard', requiredRole: ['superadmin'] },
        { path: '/superadmin', icon: ShieldCheck, label: 'Command Center', requiredRole: ['superadmin'] },
        { path: '/superadmin/tenants', icon: Building2, label: 'Tenants', requiredRole: ['superadmin'] },
      ]
    },
    {
      title: 'Organization',
      items: [
        { path: '/admin', icon: Home, label: 'Admin View', requiredRole: ['superadmin'] },
        { path: '/admin/users', icon: UserPlus, label: 'User Management', requiredRole: ['superadmin', 'admin', 'manager'] },
        { path: '/admin/settings', icon: Settings, label: 'Settings', requiredRole: ['superadmin', 'admin'] },
      ]
    }
  ],
  
  admin: [
    {
      title: 'Workspace',
      items: [
        { path: '/admin', icon: PieChart, label: 'Dashboard', requiredRole: ['admin', 'manager'] },
        { path: '/admin/users', icon: UserPlus, label: 'User Management', requiredRole: ['admin', 'manager'], requiredPermission: 'users:view' },
        { path: '/admin/departments', icon: Layers, label: 'Departments & Teams', requiredRole: ['admin', 'manager'], requiredPermission: 'departments:view' },
        { path: '/admin/branches', icon: Building2, label: 'Branch Locations', requiredRole: ['admin', 'manager'], requiredPermission: 'branches:view' },
        { path: '/admin/pipelines', icon: GitBranch, label: 'Pipeline Builder', requiredRole: ['admin', 'manager'], requiredPermission: 'pipelines:view' },
        { path: '/admin/custom-fields', icon: Sliders, label: 'Custom Fields', requiredRole: ['admin', 'manager'], requiredPermission: 'custom_fields:view' },
        { path: '/admin/goals', icon: Target, label: 'Goals & Targets', requiredRole: ['admin', 'manager'], requiredPermission: 'goals:view' },
        { path: '/admin/activities', icon: Trophy, label: 'Performance Battle Card', requiredRole: ['admin', 'manager'], requiredPermission: 'activities:view' },
        { path: '/admin/workflows', icon: Zap, label: 'Workflow Automation', requiredRole: ['admin', 'manager'], requiredPermission: 'workflows:view' },
        { path: '/admin/forecasts', icon: BarChart3, label: 'Revenue Forecasts', requiredRole: ['admin', 'manager'], requiredPermission: 'forecasts:view' },
        { path: '/predictive-analytics', icon: Zap, label: 'Predictive Analytics', requiredRole: ['admin', 'manager'] },
        { path: '/admin/intelligence', icon: Brain, label: 'Business Intelligence', requiredRole: ['admin', 'manager'] },
        { path: '/admin/custom-reports', icon: FileText, label: 'Custom Reports', requiredRole: ['admin', 'manager'], requiredPermission: 'reports:view' },
      ]
    },
    {
      title: 'Products & Territory',
      items: [
        { path: '/admin/products', icon: Package, label: 'Products', requiredRole: ['admin', 'manager'], requiredPermission: 'products:view' },
        { path: '/admin/territories', icon: MapPin, label: 'Territories', requiredRole: ['admin', 'manager'], requiredPermission: 'territories:view' },
        { path: '/admin/analytics', icon: TrendingUp, label: 'Analytics', requiredRole: ['admin', 'manager'] },
      ]
    },
    {
      title: 'Operations',
      items: [
        { path: '/admin/bulk-operations', icon: ArrowLeftRight, label: 'Bulk Operations', requiredRole: ['admin', 'manager'] },
        { path: '/admin/settings', icon: Settings, label: 'Settings', requiredRole: ['admin', 'manager'] },
      ]
    },
    {
      title: 'Reports',
      items: [
        { path: '/admin/reports', icon: PieChart, label: 'Reports', requiredRole: ['admin', 'manager'], requiredPermission: 'reports:view' },
      ]
    }
  ],
  
  agent: [
    {
      title: 'Workspace',
      items: [
        { path: '/agent', icon: PieChart, label: 'Dashboard', requiredRole: ['agent'] },
        { path: '/agent/clients', icon: Users, label: 'Clients & Organizations', requiredRole: ['agent'], requiredPermission: 'clients:view' },
        { path: '/agent/contacts', icon: BookUser, label: 'Contacts', requiredRole: ['agent'], requiredPermission: 'contacts:view' },
        { path: '/agent/leads', icon: UserCheck, label: 'Leads', requiredRole: ['agent'], requiredPermission: 'leads:view' },
        { path: '/agent/deals', icon: Target, label: 'Sales Pipeline', requiredRole: ['agent'], requiredPermission: 'deals:view' },
        { path: '/agent/sales', icon: TrendingUp, label: 'Sales', requiredRole: ['agent'], requiredPermission: 'sales:view' },
        { path: '/agent/products', icon: Package, label: 'Product Catalogue', requiredRole: ['agent'], requiredPermission: 'products:view' },
        { path: '/agent/my-territory', icon: MapPin, label: 'My Territory', requiredRole: ['agent'], requiredPermission: 'territories:view' },
      ]
    },
    {
      title: 'Activities',
      items: [
        { path: '/agent/schedules', icon: Calendar, label: 'Schedules & Calendar', requiredRole: ['agent'] },
        { path: '/agent/tasks', icon: ListTodo, label: 'Tasks', requiredRole: ['agent'] },
        { path: '/agent/issues', icon: AlertTriangle, label: 'Issues & Support', requiredRole: ['agent'] },
        { path: '/agent/notes', icon: FileText, label: 'Notes', requiredRole: ['agent'] },
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
  if (!user || !user.role) {
    return [];
  }

  // Get base navigation for user's role
  let baseNav = [];
  
  if (user.role === 'superadmin') {
    baseNav = ALL_NAV_ITEMS.superadmin;
  } else if (user.role === 'admin' || user.role === 'manager') {
    baseNav = ALL_NAV_ITEMS.admin;
  } else if (user.role === 'agent') {
    baseNav = ALL_NAV_ITEMS.agent;
  }

  // Filter navigation based on permissions
  const filteredNav = baseNav.map(section => {
    const filteredItems = section.items.filter(item => {
      // Check role requirement
      if (item.requiredRole && !item.requiredRole.includes(user.role)) {
        return false;
      }

      // Check permission requirement (if permissions object provided)
      if (item.requiredPermission && permissions) {
        const [module, action] = item.requiredPermission.split(':');
        if (permissions[module] && !permissions[module][action]) {
          return false;
        }
      }

      return true;
    });

    return {
      ...section,
      items: filteredItems
    };
  }).filter(section => section.items.length > 0); // Remove empty sections

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

export default {
  generateNavigation,
  canAccessRoute,
  getUserHomeRoute
};
