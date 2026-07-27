import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URI);

// Register ALL models exactly as server.js does
await import('../models/User.js');
await import('../models/Tenant.js');
await import('../models/Subscription.js');
await import('../models/Role.js');
await import('../models/Department.js');
await import('../models/Team.js');
await import('../models/Branch.js');
await import('../models/Client.js');
await import('../models/Deal.js');
await import('../models/Sale.js');

const User = mongoose.model('User');
const Tenant = mongoose.model('Tenant');

// Import middleware helpers
const { addTenantFilter } = await import('../middleware/tenantAuth.js');

console.log('=== SIMULATING GET /api/users FOR EACH ROLE ===\n');

const allUsers = await User.find({}).populate('tenant').lean();

for (const u of allUsers) {
  console.log(`\n--- Testing as: ${u.name} (${u.role}) ---`);
  
  // Simulate what tenantAuth sets on req
  const isSuperAdmin = u.role === 'superadmin';
  const req = {
    user: { userId: u._id, role: u.role, tenantId: u.tenant?._id },
    isSuperAdmin,
    tenantId: u.tenant?._id || null,
    tenant: u.tenant || null,
    isPlatformManager: false
  };

  // Simulate addTenantFilter
  const query = isSuperAdmin ? {} : { tenant: req.tenantId };
  console.log(`  Query filter: ${JSON.stringify(query)}`);

  try {
    const users = await User.find(query)
      .select('-password -otp')
      .populate('tenant', 'name slug')
      .populate({ path: 'department', select: 'name', match: { _id: { $exists: true } } })
      .populate({ path: 'team', select: 'name', match: { _id: { $exists: true } } })
      .lean()
      .limit(1000)
      .sort({ createdAt: -1 });
    
    console.log(`  ✅ SUCCESS: ${users.length} users returned`);
  } catch (err) {
    console.error(`  ❌ ERROR: ${err.message}`);
    console.error(`     Stack: ${err.stack?.split('\n')[1]}`);
  }
}

// Also check if there's a problem with the Subscription model schema
console.log('\n=== CHECKING Subscription MODEL SCHEMA ===');
try {
  const Subscription = mongoose.model('Subscription');
  const sub = await Subscription.findOne({}).lean();
  console.log('Subscription schema fields:', sub ? Object.keys(sub).join(', ') : 'no documents');
} catch (err) {
  console.error('Subscription model error:', err.message);
}

// Check if there's a "name" field issue in Subscription
console.log('\n=== CHECKING Subscription SCHEMA DEFINITION ===');
const subSchema = mongoose.model('Subscription').schema;
console.log('Subscription schema paths:', Object.keys(subSchema.paths).join(', '));

await mongoose.disconnect();
console.log('\nDone.');
