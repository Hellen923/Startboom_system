import Role from '../models/Role.js';

// Universal permission presets — action-based, not job-title-based
// Fits any industry: real estate, SACCO, car dealership, FMCG, etc.
export const DEFAULT_ROLES = [
  {
    name: 'Full Access Agent',
    description: 'All agent modules with full create, edit, and delete rights. For senior field staff.',
    permissions: [
      'clients:view', 'clients:create', 'clients:edit', 'clients:delete',
      'deals:view', 'deals:create', 'deals:edit', 'deals:delete', 'deals:change_stage',
      'sales:view', 'sales:create', 'sales:edit', 'sales:export',
      'products:view',
      'schedules:view', 'schedules:create', 'schedules:edit',
      'tasks:view', 'tasks:create', 'tasks:edit',
      'issues:view', 'issues:create',
      'reports:view', 'reports:export',
      'analytics:view',
    ],
  },
  {
    name: 'Standard Agent',
    description: 'Core CRM access — clients, deals, and sales. No delete or export. For most regular agents.',
    permissions: [
      'clients:view', 'clients:create', 'clients:edit',
      'deals:view', 'deals:create', 'deals:edit', 'deals:change_stage',
      'sales:view', 'sales:create',
      'products:view',
      'schedules:view', 'schedules:create',
      'tasks:view', 'tasks:create',
      'issues:view', 'issues:create',
    ],
  },
  {
    name: 'View Only',
    description: 'Read everything, create or edit nothing. For auditors, observers, and interns.',
    permissions: [
      'clients:view',
      'deals:view',
      'sales:view',
      'products:view',
      'schedules:view',
      'tasks:view',
      'issues:view',
      'reports:view',
      'analytics:view',
    ],
  },
  {
    name: 'Team Supervisor',
    description: 'All agent permissions plus visibility into team members\' data. For team leads without full manager access.',
    permissions: [
      'clients:view', 'clients:create', 'clients:edit',
      'deals:view', 'deals:create', 'deals:edit', 'deals:change_stage',
      'sales:view', 'sales:create', 'sales:edit', 'sales:export',
      'products:view',
      'schedules:view', 'schedules:create', 'schedules:edit',
      'tasks:view', 'tasks:create', 'tasks:edit', 'tasks:assign',
      'issues:view', 'issues:create', 'issues:resolve',
      'reports:view',
      'analytics:view',
      'users:view_team',
    ],
  },
  {
    name: 'Data Entry',
    description: 'Create clients, deals, and sales only. No edit, delete, or export. For data clerks and support staff.',
    permissions: [
      'clients:view', 'clients:create',
      'deals:view', 'deals:create',
      'sales:view', 'sales:create',
      'products:view',
      'tasks:view', 'tasks:create',
    ],
  },
  {
    name: 'Reporting Agent',
    description: 'View and export reports and analytics. No create or edit. For finance reviewers and compliance officers.',
    permissions: [
      'clients:view',
      'deals:view',
      'sales:view', 'sales:export',
      'products:view',
      'reports:view', 'reports:export',
      'analytics:view',
    ],
  },
];

/**
 * Seeds the 6 default roles for a tenant if they don't already exist.
 * Safe to call multiple times — skips roles that already exist.
 * @param {string|ObjectId} tenantId
 * @param {string|ObjectId} createdBy - userId of the admin creating the tenant
 */
const seedDefaultRoles = async (tenantId, createdBy = null) => {
  try {
    const existing = await Role.find({ tenant: tenantId }).select('name').lean();
    const existingNames = new Set(existing.map(r => r.name));

    const toInsert = DEFAULT_ROLES
      .filter(r => !existingNames.has(r.name))
      .map(r => ({
        tenant: tenantId,
        name: r.name,
        description: r.description,
        permissions: r.permissions,
        isSystem: true, // marks these as defaults so they show a badge in the UI
        createdBy: createdBy || null,
      }));

    if (toInsert.length > 0) {
      await Role.insertMany(toInsert, { ordered: false });
      console.log(`✅ Seeded ${toInsert.length} default roles for tenant ${tenantId}`);
    }
  } catch (err) {
    // Non-critical — don't crash tenant creation if seeding fails
    console.error('⚠️ Failed to seed default roles:', err.message);
  }
};

export default seedDefaultRoles;
