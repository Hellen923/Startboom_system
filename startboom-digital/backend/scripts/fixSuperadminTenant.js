/**
 * Fix superadmin users that have a tenant assigned.
 * Superadmins should always have tenant: null so they don't appear
 * in tenant-scoped queries and tenantAuth works correctly.
 *
 * Run: node scripts/fixSuperadminTenant.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

const result = await mongoose.connection.collection('users').updateMany(
  { role: 'superadmin', tenant: { $ne: null } },
  { $set: { tenant: null } }
);

console.log(`Fixed ${result.modifiedCount} superadmin user(s) with incorrect tenant assignment`);

// Show current superadmins
const superadmins = await mongoose.connection.collection('users')
  .find({ role: 'superadmin' })
  .project({ name: 1, email: 1, tenant: 1 })
  .toArray();

console.log('\nCurrent superadmins:');
superadmins.forEach(u => console.log(`  ${u.name} (${u.email}): tenant = ${u.tenant}`));

await mongoose.disconnect();
console.log('\nDone.');
