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
