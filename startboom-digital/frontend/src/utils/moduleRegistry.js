export const TENANT_MODULES = [
  {
    id: 'clients',
    label: 'Clients, Contacts & Leads',
    description: 'Client organizations, contact records, and lead capture for agents.',
    adminPaths: [],
    agentPaths: ['/agent/clients', '/agent/contacts', '/agent/leads'],
  },
  {
    id: 'deals',
    label: 'Deals & Pipeline',
    description: 'Sales opportunities, deal stages, and pipeline movement.',
    adminPaths: ['/admin/pipelines'],
    agentPaths: ['/agent/deals'],
  },
  {
    id: 'sales',
    label: 'Sales',
    description: 'Sales recording, conversion tracking, and revenue activity.',
    adminPaths: [],
    agentPaths: ['/agent/sales'],
  },
  {
    id: 'products',
    label: 'Products',
    description: 'Product catalogue and product access for sales teams.',
    adminPaths: ['/admin/products'],
    agentPaths: ['/agent/products'],
  },
  {
    id: 'territories',
    label: 'Territories',
    description: 'Territory setup for admins and assigned territory view for agents.',
    adminPaths: ['/admin/territories'],
    agentPaths: ['/agent/my-territory'],
  },
  {
    id: 'schedules',
    label: 'Schedules & Calendar',
    description: 'Meetings, calendars, reminders, and planned follow-ups.',
    adminPaths: [],
    agentPaths: ['/agent/schedules'],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    description: 'Task tracking and daily follow-up work for agents.',
    adminPaths: [],
    agentPaths: ['/agent/tasks'],
  },
  {
    id: 'issues',
    label: 'Issues & Support',
    description: 'Issue reporting and support requests from field teams.',
    adminPaths: [],
    agentPaths: ['/agent/issues'],
  },
  {
    id: 'departments',
    label: 'Departments & Teams',
    description: 'Company structure, departments, and team assignment.',
    adminPaths: ['/admin/departments'],
    agentPaths: [],
  },
  {
    id: 'branches',
    label: 'Branch Locations',
    description: 'Office, branch, and location structure for the organization.',
    adminPaths: ['/admin/branches'],
    agentPaths: [],
  },
  {
    id: 'goals',
    label: 'Goals & Targets',
    description: 'Individual, team, and company goals for performance tracking.',
    adminPaths: ['/admin/goals'],
    agentPaths: [],
  },
  {
    id: 'activities',
    label: 'Performance Battle Card',
    description: 'Activity scoring, performance cards, and gamified leaderboards.',
    adminPaths: ['/admin/activities'],
    agentPaths: [],
  },
  {
    id: 'workflows',
    label: 'Workflow Automation',
    description: 'Automated business rules and repetitive process handling.',
    adminPaths: ['/admin/workflows'],
    agentPaths: [],
  },
  {
    id: 'forecasts',
    label: 'Revenue Forecasts',
    description: 'Weighted forecasts and forward-looking revenue planning.',
    adminPaths: ['/admin/forecasts'],
    agentPaths: [],
  },
  {
    id: 'analytics',
    label: 'Analytics & Intelligence',
    description: 'Analytics, predictive insights, and business intelligence views.',
    adminPaths: ['/admin/analytics', '/admin/intelligence', '/predictive-analytics'],
    agentPaths: [],
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Standard reports, custom reports, and export-ready views.',
    adminPaths: ['/admin/reports', '/admin/custom-reports'],
    agentPaths: [],
  },
  {
    id: 'pipelines',
    label: 'Pipeline Builder',
    description: 'Customize deal stages and pipeline structure for your industry.',
    adminPaths: ['/admin/pipelines'],
    agentPaths: [],
  },
  {
    id: 'customFields',
    label: 'Custom Fields',
    description: 'Company-specific fields for capturing industry-specific data.',
    adminPaths: ['/admin/custom-fields'],
    agentPaths: [],
    aliases: ['custom_fields'],
  },
];

export const MODULE_ROUTE_MAP = TENANT_MODULES.reduce((acc, module) => {
  [...module.adminPaths, ...module.agentPaths].forEach((path) => {
    acc[path] = module.id;
  });
  return acc;
}, {});

const getModuleValue = (modules, moduleId) => {
  const module = TENANT_MODULES.find((item) => item.id === moduleId);
  const keys = [moduleId, ...(module?.aliases || [])];

  for (const key of keys) {
    const value = modules?.[key];
    if (value !== undefined) return value;
  }

  return undefined;
};

export const isModuleEnabled = (modules, moduleId) => {
  if (!modules || !moduleId) return true;
  const value = getModuleValue(modules, moduleId);
  if (value === undefined) return true;
  if (typeof value === 'object' && value !== null) return value.enabled !== false && value.enabled !== 'false';
  return value !== false && value !== 'false';
};

/**
 * Check if a hierarchical module is enabled
 * @param {Object} tenantModules - Tenant module configuration
 * @param {String} mainModuleId - Main module ID (e.g., 'sales_pipeline')
 * @param {String} subModuleId - Optional sub-module ID (e.g., 'deals')
 * @returns {Boolean}
 */
export const isHierarchicalModuleEnabled = (tenantModules, mainModuleId, subModuleId = null) => {
  if (!tenantModules) return true; // No restrictions
  
  // Check if main module is enabled
  const mainEnabled = isModuleEnabled(tenantModules, mainModuleId);
  if (!mainEnabled) return false;
  
  // If checking sub-module
  if (subModuleId) {
    const subEnabled = isModuleEnabled(tenantModules, subModuleId);
    return subEnabled;
  }
  
  return true;
};

/**
 * Get all enabled modules from hierarchy for a tenant
 * @param {Object} tenantModules - Tenant module configuration
 * @returns {Array} List of enabled module IDs (flat)
 */
export const getEnabledModuleIds = (tenantModules) => {
  if (!tenantModules) {
    // Return all module IDs if no restrictions
    const allIds = ['dashboard', 'user_management', 'users', 'departments', 'branches', 'territories', 'clients', 'settings', 'messages'];
    
    // Add all optional modules (hardcoded since MODULE_HIERARCHY is defined before this)
    const optionalModuleIds = [
      'sales_pipeline', 'deals', 'sales', 'forecasts',
      'products_inventory', 'products',
      'performance_analytics', 'reports', 'analytics', 'goals',
      'automation', 'workflows', 'custom_fields', 'customFields',
      'activities_scheduling', 'schedules', 'tasks', 'meetings', 'issues'
    ];
    allIds.push(...optionalModuleIds);
    
    return allIds;
  }
  
  const enabled = ['dashboard', 'user_management', 'users', 'departments', 'clients', 'settings', 'messages']; // Always visible core
  
  // Check optional branches and territories
  if (isModuleEnabled(tenantModules, 'branches')) enabled.push('branches');
  if (isModuleEnabled(tenantModules, 'territories')) enabled.push('territories');
  
  // Check optional main modules and their sub-modules
  // Sales & Pipeline
  if (isModuleEnabled(tenantModules, 'sales_pipeline')) {
    enabled.push('sales_pipeline');
    if (isModuleEnabled(tenantModules, 'deals')) enabled.push('deals');
    if (isModuleEnabled(tenantModules, 'sales')) enabled.push('sales');
    if (isModuleEnabled(tenantModules, 'forecasts')) enabled.push('forecasts');
  }
  
  // Products & Inventory
  if (isModuleEnabled(tenantModules, 'products_inventory') || isModuleEnabled(tenantModules, 'products')) {
    enabled.push('products_inventory');
    enabled.push('products');
  }
  
  // Performance & Analytics
  if (isModuleEnabled(tenantModules, 'performance_analytics')) {
    enabled.push('performance_analytics');
    if (isModuleEnabled(tenantModules, 'reports')) enabled.push('reports');
    if (isModuleEnabled(tenantModules, 'analytics')) enabled.push('analytics');
    if (isModuleEnabled(tenantModules, 'goals')) enabled.push('goals');
  }
  
  // Automation
  if (isModuleEnabled(tenantModules, 'automation')) {
    enabled.push('automation');
    if (isModuleEnabled(tenantModules, 'workflows')) enabled.push('workflows');
    if (isModuleEnabled(tenantModules, 'custom_fields') || isModuleEnabled(tenantModules, 'customFields')) {
      enabled.push('custom_fields');
      enabled.push('customFields');
    }
  }
  
  // Activities & Scheduling
  if (isModuleEnabled(tenantModules, 'activities_scheduling')) {
    enabled.push('activities_scheduling');
    if (isModuleEnabled(tenantModules, 'schedules')) enabled.push('schedules');
    if (isModuleEnabled(tenantModules, 'tasks')) enabled.push('tasks');
    if (isModuleEnabled(tenantModules, 'meetings')) enabled.push('meetings');
    if (isModuleEnabled(tenantModules, 'issues')) enabled.push('issues');
  }
  
  return enabled;
};
