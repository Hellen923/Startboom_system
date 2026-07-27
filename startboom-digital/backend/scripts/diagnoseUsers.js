import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB\n');

// 1. Check raw field types in users collection
const users = await mongoose.connection.collection('users').find({}).limit(20).toArray();
console.log('=== RAW USER DATA (first 20) ===');
users.forEach(u => {
  console.log(JSON.stringify({
    name: u.name,
    role: u.role,
    dept: u.department,
    deptType: u.department !== undefined && u.department !== null ? typeof u.department : 'null',
    team: u.team,
    teamType: u.team !== undefined && u.team !== null ? typeof u.team : 'null',
    tenant: u.tenant ? String(u.tenant) : null,
    customRole: u.customRole,
    customRoleType: u.customRole !== undefined && u.customRole !== null ? typeof u.customRole : 'null'
  }));
});

// 2. Try to reproduce the exact query from the route
console.log('\n=== TESTING POPULATE QUERY ===');
try {
  const User = (await import('../models/User.js')).default;
  
  // Test superadmin query (no tenant filter)
  const result = await User.find({})
    .select('-password -otp')
    .populate('tenant', 'name slug')
    .populate({ path: 'department', select: 'name', match: { _id: { $exists: true } } })
    .populate({ path: 'team', select: 'name', match: { _id: { $exists: true } } })
    .lean()
    .limit(1000)
    .sort({ createdAt: -1 });
  
  console.log(`SUCCESS: returned ${result.length} users`);
} catch (err) {
  console.error('POPULATE ERROR:', err.message);
  console.error(err.stack);
}

// 3. Check customRole field - could be causing populate issues in tenantAuth
console.log('\n=== CHECKING customRole FIELD ===');
const withCustomRole = users.filter(u => u.customRole !== null && u.customRole !== undefined);
console.log(`Users with customRole set: ${withCustomRole.length}`);
withCustomRole.forEach(u => {
  console.log(`  ${u.name}: customRole = ${JSON.stringify(u.customRole)} (type: ${typeof u.customRole})`);
});

// 4. Check tenant field issues
console.log('\n=== CHECKING TENANT FIELD ===');
const noTenant = users.filter(u => !u.tenant && u.role !== 'superadmin');
console.log(`Non-superadmin users without tenant: ${noTenant.length}`);
noTenant.forEach(u => {
  console.log(`  ${u.name} (${u.role}): no tenant`);
});

await mongoose.disconnect();
console.log('\nDone.');
