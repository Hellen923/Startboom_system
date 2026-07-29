// Run: node backend/scripts/seedRolesForExistingTenants.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import Tenant from '../models/Tenant.js';
import Role from '../models/Role.js';
import seedDefaultRoles from '../utils/seedDefaultRoles.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected to MongoDB');

const tenants = await Tenant.find({}).select('_id name').lean();
console.log(`Found ${tenants.length} tenant(s)`);

for (const tenant of tenants) {
  const existingCount = await Role.countDocuments({ tenant: tenant._id });
  if (existingCount === 0) {
    console.log(`Seeding roles for: ${tenant.name}`);
    await seedDefaultRoles(tenant._id);
  } else {
    console.log(`Skipping ${tenant.name} — already has ${existingCount} role(s)`);
  }
}

console.log('✅ Done');
await mongoose.disconnect();
