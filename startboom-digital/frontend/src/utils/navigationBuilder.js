// Dynamic Navigation Builder - Generate menu based on user role and permissions
// Now supports hierarchical module structure with collapsible main modules
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
  Video,
  MessageSquare
} from 'lucide-react';
import { 
  MODULE_ROUTE_MAP, 
  isModuleEnabled as isTenantModuleEnabled, 
  MODULE_HIERARCHY,
  isHierarchicalModuleEnabled 
} from './moduleRegistry';

// Icon mapping for module hierarchy
const ICON_MAP = {
  PieChart, Users, UserPlus, Target, TrendingUp, Building2, ShieldCheck,
  ArrowLeftRight, Zap, UserCheck, BookUser, ListTodo, AlertTriangle,
  Package, MapPin, Brain, Layers, Trophy, GitBranch, Sliders, FileText,
  BarChart3, Calendar, Settings, Video, MessageSquare, Home
};

/**
 * Generate hierarchical navigation with collapsible main modules
 * @param {Object} user - Current user object with role and tenant info
 * @param {Object} permissions - User's permission map (optional)
 * @param {Array} departmentModules - User's department enabled modules (optional)
 * @returns {Array} Navigation sections with hierarchical modules
 */
export const generateHierarchicalNavigation = (user, permissions = null, departmentModules = null) => {
  if (!user || !user.role) return [];

  // Superadmin gets platform-level navigation only (no hierarchical modules)
  if (user.role === 'superadmin') {
    return ALL_NAV_ITEMS.superadmin;
  }

  const isAdmin = user.role === 'admin' || user.role === 'manager';
  const isAgent = user.role === 'agent';
  const tenantModules = user.tenant?.modules || null;
  
  const navigation = [];

  // ========== WORKSPACE SECTION (Core Always-Visible + Optional Main Modules) ==========
  const workspaceItems = [];

  // 1. Dashboard (always visible)
  if (isAdmin) {
    workspaceItems.push({
      path: '/admin',
      icon: PieChart,
      label: 'Dashboard',
      description: 'Your organization summary with quick access to key metrics.',
      isMainModule: false,
    });
  } else if (isAgent) {
    workspaceItems.push({
      path: '/agent',
      icon: PieChart,
      label: 'Dashboard',
      description: 'Welcome to CoreMint CRM — where every opportunity finds its value.',
      isMainModule: false,
    });
  }

  // 2. User Management (always visible for admins, with optional sub-modules)
  if (isAdmin) {
    const userMgmtSubModules = [];
    
    // Users (always)
    userMgmtSubModules.push({
      path: '/admin/users',
      icon: UserPlus,
      label: 'Users',
      description: 'Add, edit, and manage users, roles, and access permissions.',
    });
    
    // Departments (always)
    userMgmtSubModules.push({
      path: '/admin/departments',
      icon: Layers,
      label: 'Departments & Teams',
      description: 'Organize your company structure and manage teams.',
    });
    
    // Branches (optional)
    if (isHierarchicalModuleEnabled(tenantModules, 'branches')) {
      userMgmtSubModules.push({
        path: '/admin/branches',
        icon: Building2,
        label: 'Branch Locations',
        description: 'Manage multi-location offices and hierarchical structure.',
      });
    }
    
    // Territories (optional)
    if (isHierarchicalModuleEnabled(tenantModules, 'territories')) {
      userMgmtSubModules.push({
        path: '/admin/territories',
        icon: MapPin,
        label: 'Territories',
        description: 'Assign employees to geographic territories.',
      });
    }

    workspaceItems.push({
      id: 'user_management',
      icon: Users,
      label: 'User Management',
      description: 'Users, departments, branches, and territories',
      isMainModule: true,
      isCollapsible: true,
      subModules: userMgmtSubModules,
    });
  }

  // 3. Clients (always visible)
  if (isAdmin) {
    workspaceItems.push({
      path: '/admin/clients',
      icon: Users,
      label: 'Clients',
      description: 'View and manage all client accounts and enable portal access.',
      isMainModule: false,
    });
  } else if (isAgent) {
    const clientsSubModules = [
      {
        path: '/agent/clients',
        icon: Users,
        label: 'Clients & Organizations',
        description: 'Manage your client accounts and build lasting relationships.',
      },
      {
        path: '/agent/contacts',
        icon: BookUser,
        label: 'Contacts',
        description: 'Your full contact directory in one place.',
      },
      {
        path: '/agent/leads',
        icon: UserCheck,
        label: 'Leads',
        description: 'Capture, qualify, and convert prospects.',
      },
    ];

    workspaceItems.push({
      id: 'clients',
      icon: Users,
      label: 'Clients',
      description: 'Client organizations, contacts, and leads',
      isMainModule: true,
      isCollapsible: true,
      subModules: clientsSubModules,
    });
  }

  // 4. OPTIONAL: Sales & Pipeline
  if (isHierarchicalModuleEnabled(tenantModules, 'sales_pipeline') || isHierarchicalModuleEnabled(tenantModules, 'deals')) {
    const salesSubModules = [];
    
    if (isAdmin) {
      if (isHierarchicalModuleEnabled(tenantModules, 'deals')) {
        salesSubModules.push({
          path: '/admin/pipelines',
          icon: GitBranch,
          label: 'Pipeline Builder',
          description: 'Customize sales stages and business workflows.',
        });
      }
      if (isHierarchicalModuleEnabled(tenantModules, 'forecasts')) {
        salesSubModules.push({
          path: '/admin/forecasts',
          icon: BarChart3,
          label: 'Revenue Forecasts',
          description: 'Weighted pipeline forecasting and revenue predictions.',
        });
      }
    } else if (isAgent) {
      if (isHierarchicalModuleEnabled(tenantModules, 'deals')) {
        salesSubModules.push({
          path: '/agent/deals',
          icon: Target,
          label: 'Sales Pipeline',
          description: 'Track every deal from first contact to close.',
        });
      }
      if (isHierarchicalModuleEnabled(tenantModules, 'sales')) {
        salesSubModules.push({
          path: '/agent/sales',
          icon: TrendingUp,
          label: 'Sales',
          description: 'Record transactions and monitor revenue performance.',
        });
      }
    }

    if (salesSubModules.length > 0) {
      workspaceItems.push({
        id: 'sales_pipeline',
        icon: TrendingUp,
        label: 'Sales & Pipeline',
        description: 'Deal management, pipeline stages, and sales tracking',
        isMainModule: true,
        isCollapsible: true,
        subModules: salesSubModules,
      });
    }
  }

  // 5. OPTIONAL: Products & Inventory
  if (isHierarchicalModuleEnabled(tenantModules, 'products_inventory') || isHierarchicalModuleEnabled(tenantModules, 'products')) {
    const productsSubModules = [];
    
    if (isAdmin) {
      productsSubModules.push({
        path: '/admin/products',
        icon: Package,
        label: 'Products',
        description: 'Manage product catalogue, pricing, and inventory.',
      });
    } else if (isAgent) {
      productsSubModules.push({
        path: '/agent/products',
        icon: Package,
        label: 'Product Catalogue',
        description: 'Browse available products and pricing.',
      });
    }

    if (productsSubModules.length > 0) {
      workspaceItems.push({
        id: 'products_inventory',
        icon: Package,
        label: 'Products & Inventory',
        description: 'Product catalog and stock management',
        isMainModule: true,
        isCollapsible: true,
        subModules: productsSubModules,
      });
    }
  }

  // 6. OPTIONAL: Performance & Analytics
  if (isAdmin && (isHierarchicalModuleEnabled(tenantModules, 'performance_analytics') || 
      isHierarchicalModuleEnabled(tenantModules, 'reports') || 
      isHierarchicalModuleEnabled(tenantModules, 'analytics'))) {
    const analyticsSubModules = [];
    
    if (isHierarchicalModuleEnabled(tenantModules, 'reports')) {
      analyticsSubModules.push({
        path: '/admin/reports',
        icon: FileText,
        label: 'Reports',
        description: 'Review performance and activity reports.',
      });
      analyticsSubModules.push({
        path: '/admin/custom-reports',
        icon: FileText,
        label: 'Custom Reports',
        description: 'Build custom reports with advanced filtering.',
      });
    }
    
    if (isHierarchicalModuleEnabled(tenantModules, 'analytics')) {
      analyticsSubModules.push({
        path: '/admin/analytics',
        icon: BarChart3,
        label: 'Analytics',
        description: 'Performance metrics and conversion tracking.',
      });
      analyticsSubModules.push({
        path: '/predictive-analytics',
        icon: Zap,
        label: 'Predictive Analytics',
        description: 'AI-driven insights and forecasts.',
      });
      analyticsSubModules.push({
        path: '/admin/intelligence',
        icon: Brain,
        label: 'Business Intelligence',
        description: 'Proactive alerts and insights.',
      });
    }
    
    if (isHierarchicalModuleEnabled(tenantModules, 'goals')) {
      analyticsSubModules.push({
        path: '/admin/goals',
        icon: Target,
        label: 'Goals & Targets',
        description: 'Set and track individual, team, and company goals.',
      });
    }

    if (analyticsSubModules.length > 0) {
      workspaceItems.push({
        id: 'performance_analytics',
        icon: BarChart3,
        label: 'Performance & Analytics',
        description: 'Reports, analytics, and business intelligence',
        isMainModule: true,
        isCollapsible: true,
        subModules: analyticsSubModules,
      });
    }
  }

  // 7. OPTIONAL: Automation
  if (isAdmin && (isHierarchicalModuleEnabled(tenantModules, 'automation') || 
      isHierarchicalModuleEnabled(tenantModules, 'workflows'))) {
    const automationSubModules = [];
    
    if (isHierarchicalModuleEnabled(tenantModules, 'workflows')) {
      automationSubModules.push({
        path: '/admin/workflows',
        icon: Zap,
        label: 'Workflow Automation',
        description: 'Automate repetitive tasks and business processes.',
      });
    }
    
    if (isHierarchicalModuleEnabled(tenantModules, 'custom_fields') || isHierarchicalModuleEnabled(tenantModules, 'customFields')) {
      automationSubModules.push({
        path: '/admin/custom-fields',
        icon: Sliders,
        label: 'Custom Fields',
        description: 'Industry-specific custom fields.',
      });
    }

    if (automationSubModules.length > 0) {
      workspaceItems.push({
        id: 'automation',
        icon: Zap,
        label: 'Automation',
        description: 'Workflow automation and business rules',
        isMainModule: true,
        isCollapsible: true,
        subModules: automationSubModules,
      });
    }
  }

  // 8. OPTIONAL: Activities & Scheduling
  if (isHierarchicalModuleEnabled(tenantModules, 'activities_scheduling') || 
      isHierarchicalModuleEnabled(tenantModules, 'schedules')) {
    const activitiesSubModules = [];
    
    if (isAgent) {
      if (isHierarchicalModuleEnabled(tenantModules, 'schedules')) {
        activitiesSubModules.push({
          path: '/agent/schedules',
          icon: Calendar,
          label: 'Schedules & Calendar',
          description: 'Plan meetings, calls, and follow-ups.',
        });
      }
      
      if (isHierarchicalModuleEnabled(tenantModules, 'tasks')) {
        activitiesSubModules.push({
          path: '/agent/tasks',
          icon: ListTodo,
          label: 'Tasks',
          description: 'Stay on top of daily work items.',
        });
      }
      
      if (isHierarchicalModuleEnabled(tenantModules, 'meetings')) {
        activitiesSubModules.push({
          path: '/agent/meetings',
          icon: Video,
          label: 'Meetings',
          description: 'Schedule and track client meetings.',
        });
      }
      
      if (isHierarchicalModuleEnabled(tenantModules, 'issues')) {
        activitiesSubModules.push({
          path: '/agent/issues',
          icon: AlertTriangle,
          label: 'Issues & Support',
          description: 'Log and track client issues.',
        });
      }
    }

    if (activitiesSubModules.length > 0) {
      workspaceItems.push({
        id: 'activities_scheduling',
        icon: Calendar,
        label: 'Activities & Scheduling',
        description: 'Meetings, tasks, and calendar management',
        isMainModule: true,
        isCollapsible: true,
        subModules: activitiesSubModules,
      });
    }
  }

  // Add Workspace section
  if (workspaceItems.length > 0) {
    navigation.push({
      title: 'Workspace',
      items: workspaceItems,
    });
  }

  // ========== SETTINGS SECTION (Always visible) ==========
  const settingsItems = [];
  
  if (isAdmin) {
    settingsItems.push({
      path: '/admin/tenant-settings',
      icon: Building2,
      label: 'Company Settings',
      description: 'Configure company profile, branding, and modules.',
      isMainModule: false,
    });
    settingsItems.push({
      path: '/admin/settings',
      icon: Settings,
      label: 'Settings',
      description: 'Update account preferences and system settings.',
      isMainModule: false,
    });
  }

  if (settingsItems.length > 0) {
    navigation.push({
      title: 'Settings',
      items: settingsItems,
    });
  }

  // ========== COMMUNICATION SECTION (Always visible) ==========
  const communicationItems = [];
  
  if (isAdmin) {
    communicationItems.push({
      path: '/admin/messages',
      icon: MessageSquare,
      label: 'Messages',
      description: 'Internal team communication.',
      isMainModule: false,
    });
  } else if (isAgent) {
    communicationItems.push({
      path: '/agent/messages',
      icon: MessageSquare,
      label: 'Messages',
      description: 'Chat with team members.',
      isMainModule: false,
    });
  }

  if (communicationItems.length > 0) {
    navigation.push({
      title: 'Communication',
      items: communicationItems,
    });
  }

  return navigation;
};

// Define all possible navigation items with required permissions
const ALL_NAV_ITEMS = {
  superadmin: [
    {
      title: 'Platform',
      items: [
        { path: '/dashboard', icon: PieChart, label: 'Dashboard', description: 'Welcome to CoreMint CRM — manage every tenant, user, and platform signal from one place.', requiredRole: ['superadmin'] },
        { path: '/superadmin', icon: ShieldCheck, label: 'Command Center', description: 'Welcome to CoreMint CRM — manage every tenant, user, and platform signal from one place.', requiredRole: ['superadmin'] },
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
        { path: '/admin', icon: PieChart, label: 'Dashboard', description: 'Welcome to CoreMint CRM — your organisation summary with quick access to key metrics.', requiredRole: ['admin', 'manager'] },
        { path: '/admin/branches', icon: Building2, label: 'Branch Locations', description: 'Manage multi-location offices and hierarchical branch structure.', requiredRole: ['admin', 'manager'], requiredPermission: 'branches:view' },
        { path: '/admin/departments', icon: Layers, label: 'Departments & Teams', description: 'Organise your company structure, manage teams, and assign custom roles.', requiredRole: ['admin', 'manager'], requiredPermission: 'departments:view' },
        { path: '/admin/users', icon: UserPlus, label: 'User Management', description: 'Add, edit, and manage users, roles, departments, and access permissions.', requiredRole: ['admin', 'manager'], requiredPermission: 'users:view' },
        { path: '/admin/clients', icon: Users, label: 'Clients', description: 'View and manage all client accounts and enable portal access.', requiredRole: ['admin', 'manager'] },
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
        { path: '/admin/territories', icon: MapPin, label: 'Territories', description: 'Assign employees to geographic territories and manage location-based coverage.', requiredRole: ['admin', 'manager'], requiredPermission: 'territories:view' },
        { path: '/admin/analytics', icon: TrendingUp, label: 'Analytics', description: 'Conversion rates, active vs dormant clients, and team leaderboard by department.', requiredRole: ['admin', 'manager'] },
      ]
    },
    {
      title: 'Operations',
      items: [
        { path: '/admin/targets', icon: Target, label: 'Targets', description: 'Set monthly deal, revenue, and client targets with commission rates per employee.', requiredRole: ['admin', 'manager'] },
        { path: '/admin/tenant-settings', icon: Building2, label: 'Company Settings', description: 'Configure company profile, branding, module toggles, and advanced preferences.', requiredRole: ['admin', 'manager'] },
        { path: '/admin/bulk-operations', icon: ArrowLeftRight, label: 'Bulk Operations', description: 'Execute bulk tasks — reassign, update, or export records quickly and efficiently.', requiredRole: ['admin', 'manager'] },
        { path: '/admin/settings', icon: Settings, label: 'Settings', description: 'Update your profile, password, email templates, and security preferences.', requiredRole: ['admin', 'manager'] },
      ]
    },
    {
      title: 'Communication',
      items: [
        { path: '/admin/messages', icon: MessageSquare, label: 'Messages', description: 'Internal team communication and direct messaging.', requiredRole: ['admin', 'manager'] },
      ]
    },
    {
      title: 'Reports',
      items: [
        { path: '/admin/reports', icon: PieChart, label: 'Reports', description: 'Review sales transactions, team performance, and deal activity across the business.', requiredRole: ['admin', 'manager'], requiredPermission: 'reports:view' },
      ]
    }
  ],
  
  agent: [
    {
      title: 'Workspace',
      items: [
        { path: '/agent', icon: PieChart, label: 'Dashboard', description: 'Welcome to CoreMint CRM — where every opportunity finds its value.', requiredRole: ['agent'], requiredModule: null },
        { path: '/agent/clients', icon: Users, label: 'Clients & Organizations', description: 'Manage your client accounts, track engagement, and build lasting relationships.', requiredRole: ['agent'], requiredPermission: 'clients:view', requiredModule: 'clients' },
        { path: '/agent/contacts', icon: BookUser, label: 'Contacts', description: 'Your full contact directory — people, positions, and organisations in one place.', requiredRole: ['agent'], requiredPermission: 'contacts:view', requiredModule: 'clients' },
        { path: '/agent/leads', icon: UserCheck, label: 'Leads', description: 'Capture, qualify, and convert prospects through your sales funnel.', requiredRole: ['agent'], requiredPermission: 'leads:view', requiredModule: 'clients' },
        { path: '/agent/deals', icon: Target, label: 'Sales Pipeline', description: 'Track every deal from first contact to close — table, kanban, or charts.', requiredRole: ['agent'], requiredPermission: 'deals:view', requiredModule: 'deals' },
        { path: '/agent/sales', icon: TrendingUp, label: 'Sales', description: 'Record transactions, download receipts, and monitor your revenue performance.', requiredRole: ['agent'], requiredPermission: 'sales:view', requiredModule: 'sales' },
        { path: '/agent/products', icon: Package, label: 'Product Catalogue', description: 'Browse available products and pricing to quote clients accurately.', requiredRole: ['agent'], requiredPermission: 'products:view', requiredModule: 'products' },
        { path: '/agent/my-territory', icon: MapPin, label: 'My Territory', description: 'View your assigned territory, coverage area, and team members in your zone.', requiredRole: ['agent'], requiredPermission: 'territories:view', requiredModule: 'territories' },
      ]
    },
    {
      title: 'Activities',
      items: [
        { path: '/agent/schedules', icon: Calendar, label: 'Schedules & Calendar', description: 'Plan meetings, calls, and follow-ups — list view or calendar.', requiredRole: ['agent'], requiredModule: 'schedules' },
        { path: '/agent/tasks', icon: ListTodo, label: 'Tasks', description: 'Stay on top of your daily work items and client follow-ups.', requiredRole: ['agent'], requiredModule: 'schedules' },
        { path: '/agent/meetings', icon: Video, label: 'Meetings', description: 'Schedule and track client meetings — in-person, Google Meet, Zoom, or phone.', requiredRole: ['agent'], requiredModule: 'meetings' },
        { path: '/agent/issues', icon: AlertTriangle, label: 'Issues & Support', description: 'Log and track client issues until they are fully resolved.', requiredRole: ['agent'], requiredModule: 'issues' },
        { path: '/agent/notes', icon: FileText, label: 'Notes', description: 'Personal notes linked to clients — capture insights and follow-up reminders.', requiredRole: ['agent'], requiredModule: null },
      ]
    },
    {
      title: 'Communication',
      items: [
        { path: '/agent/messages', icon: MessageSquare, label: 'Messages', description: 'Chat with team members and collaborate on deals and tasks.', requiredRole: ['agent'] },
      ]
    }
  ]
};

/**
 * Generate navigation sections based on user role, permissions, and department modules
 * Now uses hierarchical module structure with collapsible main modules
 * @param {Object} user - Current user object with role and permissions
 * @param {Object} permissions - User's permission map (optional)
 * @param {Array} departmentModules - User's department enabled modules (optional)
 * @returns {Array} Filtered navigation sections
 */
export const generateNavigation = (user, permissions = null, departmentModules = null) => {
  // Use new hierarchical navigation by default
  return generateHierarchicalNavigation(user, permissions, departmentModules);
  
  // Legacy flat navigation is preserved below for reference but not used
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
  generateHierarchicalNavigation,
  canAccessRoute,
  getUserHomeRoute
};
