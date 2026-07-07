// scripts/seed-permissions.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Permission from '../models/Permission.js';
import Tenant from '../models/Tenant.js';

dotenv.config();

const defaultPermissions = [
  // SUPERADMIN - Can do everything
  {
    role: 'superadmin',
    module: 'clients',
    actions: {
      view: true, create: true, edit: true, delete: true, export: true, import: true,
      viewAll: true, viewDepartment: true, viewTeam: true, viewOwn: true,
      approve: true, assignOwnership: true
    }
  },
  {
    role: 'superadmin',
    module: 'deals',
    actions: {
      view: true, create: true, edit: true, delete: true, export: true, import: true,
      viewAll: true, viewDepartment: true, viewTeam: true, viewOwn: true,
      approve: true, assignOwnership: true
    }
  },
  
  // ADMIN - Full access within their tenant
  {
    role: 'admin',
    module: 'clients',
    actions: {
      view: true, create: true, edit: true, delete: true, export: true, import: true,
      viewAll: true, viewDepartment: false, viewTeam: false, viewOwn: false,
      approve: true, assignOwnership: true
    }
  },
  {
    role: 'admin',
    module: 'deals',
    actions: {
      view: true, create: true, edit: true, delete: true, export: true, import: true,
      viewAll: true, viewDepartment: false, viewTeam: false, viewOwn: false,
      approve: true, assignOwnership: true
    }
  },
  {
    role: 'admin',
    module: 'sales',
    actions: {
      view: true, create: true, edit: true, delete: true, export: true, import: false,
      viewAll: true, viewDepartment: false, viewTeam: false, viewOwn: false,
      approve: true, assignOwnership: false
    }
  },
  {
    role: 'admin',
    module: 'products',
    actions: {
      view: true, create: true, edit: true, delete: true, export: true, import: true,
      viewAll: true, viewDepartment: false, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: false
    }
  },
  {
    role: 'admin',
    module: 'territories',
    actions: {
      view: true, create: true, edit: true, delete: true, export: false, import: false,
      viewAll: true, viewDepartment: false, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: true
    }
  },
  {
    role: 'admin',
    module: 'users',
    actions: {
      view: true, create: true, edit: true, delete: true, export: true, import: false,
      viewAll: true, viewDepartment: false, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: false
    }
  },
  {
    role: 'admin',
    module: 'settings',
    actions: {
      view: true, create: true, edit: true, delete: true, export: false, import: false,
      viewAll: true, viewDepartment: false, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: false
    }
  },
  {
    role: 'admin',
    module: 'analytics',
    actions: {
      view: true, create: false, edit: false, delete: false, export: true, import: false,
      viewAll: true, viewDepartment: false, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: false
    }
  },
  {
    role: 'admin',
    module: 'audit_logs',
    actions: {
      view: true, create: false, edit: false, delete: false, export: true, import: false,
      viewAll: true, viewDepartment: false, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: false
    }
  },
  
  // MANAGER - Can see department data, manage team
  {
    role: 'manager',
    module: 'clients',
    actions: {
      view: true, create: true, edit: true, delete: false, export: true, import: false,
      viewAll: false, viewDepartment: true, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: true
    }
  },
  {
    role: 'manager',
    module: 'deals',
    actions: {
      view: true, create: true, edit: true, delete: false, export: true, import: false,
      viewAll: false, viewDepartment: true, viewTeam: false, viewOwn: false,
      approve: true, assignOwnership: true
    }
  },
  {
    role: 'manager',
    module: 'sales',
    actions: {
      view: true, create: true, edit: true, delete: false, export: true, import: false,
      viewAll: false, viewDepartment: true, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: false
    }
  },
  {
    role: 'manager',
    module: 'products',
    actions: {
      view: true, create: true, edit: true, delete: false, export: true, import: false,
      viewAll: true, viewDepartment: false, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: false
    }
  },
  {
    role: 'manager',
    module: 'territories',
    actions: {
      view: true, create: false, edit: true, delete: false, export: false, import: false,
      viewAll: false, viewDepartment: true, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: true
    }
  },
  {
    role: 'manager',
    module: 'users',
    actions: {
      view: true, create: false, edit: false, delete: false, export: false, import: false,
      viewAll: false, viewDepartment: true, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: false
    }
  },
  {
    role: 'manager',
    module: 'analytics',
    actions: {
      view: true, create: false, edit: false, delete: false, export: true, import: false,
      viewAll: false, viewDepartment: true, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: false
    }
  },
  
  // AGENT - Can only see own data
  {
    role: 'agent',
    module: 'clients',
    actions: {
      view: true, create: true, edit: true, delete: false, export: false, import: false,
      viewAll: false, viewDepartment: false, viewTeam: false, viewOwn: true,
      approve: false, assignOwnership: false
    }
  },
  {
    role: 'agent',
    module: 'deals',
    actions: {
      view: true, create: true, edit: true, delete: false, export: false, import: false,
      viewAll: false, viewDepartment: false, viewTeam: false, viewOwn: true,
      approve: false, assignOwnership: false
    }
  },
  {
    role: 'agent',
    module: 'sales',
    actions: {
      view: true, create: true, edit: false, delete: false, export: false, import: false,
      viewAll: false, viewDepartment: false, viewTeam: false, viewOwn: true,
      approve: false, assignOwnership: false
    }
  },
  {
    role: 'agent',
    module: 'products',
    actions: {
      view: true, create: false, edit: false, delete: false, export: false, import: false,
      viewAll: true, viewDepartment: false, viewTeam: false, viewOwn: false,
      approve: false, assignOwnership: false
    }
  },
  {
    role: 'agent',
    module: 'territories',
    actions: {
      view: true, create: false, edit: false, delete: false, export: false, import: false,
      viewAll: false, viewDepartment: false, viewTeam: false, viewOwn: true,
      approve: false, assignOwnership: false
    }
  },
  {
    role: 'agent',
    module: 'analytics',
    actions: {
      view: true, create: false, edit: false, delete: false, export: false, import: false,
      viewAll: false, viewDepartment: false, viewTeam: false, viewOwn: true,
      approve: false, assignOwnership: false
    }
  }
];

const seedPermissions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all tenants
    const tenants = await Tenant.find();
    console.log(`Found ${tenants.length} tenant(s)`);
    
    if (tenants.length === 0) {
      console.log('⚠️  No tenants found. Please create a tenant first.');
      process.exit(0);
    }
    
    let totalCreated = 0;
    let totalSkipped = 0;
    
    // Create permissions for each tenant
    for (const tenant of tenants) {
      console.log(`\n📋 Seeding permissions for tenant: ${tenant.companyName}`);
      
      for (const permData of defaultPermissions) {
        const existing = await Permission.findOne({
          tenant: tenant._id,
          role: permData.role,
          module: permData.module,
          department: null
        });
        
        if (existing) {
          totalSkipped++;
          continue;
        }
        
        const permission = new Permission({
          tenant: tenant._id,
          role: permData.role,
          module: permData.module,
          actions: permData.actions,
          isActive: true,
          description: `Default ${permData.role} permissions for ${permData.module}`
        });
        
        await permission.save();
        totalCreated++;
      }
      
      console.log(`✅ Permissions seeded for ${tenant.companyName}`);
    }
    
    console.log(`\n✨ COMPLETE:`);
    console.log(`   Created: ${totalCreated} permissions`);
    console.log(`   Skipped: ${totalSkipped} existing permissions`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    process.exit(1);
  }
};

seedPermissions();
