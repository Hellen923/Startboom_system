import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URI);

await import('../models/User.js');
await import('../models/Tenant.js');
await import('../models/Subscription.js');
await import('../models/Role.js');

const Tenant = mongoose.model('Tenant');
const Subscription = mongoose.model('Subscription');

console.log('=== SUBSCRIPTION DOCUMENTS ===');
const subs = await Subscription.find({}).lean();
console.log(`Found ${subs.length} subscription(s)`);
subs.forEach(s => console.log(JSON.stringify({ id: String(s._id), name: s.name, plan: s.plan, features: s.features })));

console.log('\n=== TENANT WITH POPULATED SUBSCRIPTION ===');
const tenants = await Tenant.find({}).populate('subscription').lean();
tenants.forEach(t => {
  console.log(JSON.stringify({
    name: t.name,
    status: t.status,
    subscription: t.subscription ? { id: String(t.subscription._id), features: t.subscription.features } : null,
    settingsFeatures: t.settings?.features
  }));
});

console.log('\n=== SIMULATING checkUsageLimit("users") ===');
for (const t of tenants) {
  const currentUsage = t.usage?.totalUsers || 0;
  const limit = t.subscription?.features?.maxUsers || t.settings?.features?.maxUsers || 250;
  const canAdd = currentUsage < limit;
  console.log(`${t.name}: usage=${currentUsage}, limit=${limit}, canAdd=${canAdd}`);
}

// Check if the GET /users route would work end-to-end for each role
console.log('\n=== CHECKING addTenantFilter BEHAVIOR ===');
const User = mongoose.model('User');

// Simulate admin query (with tenant filter)
const tenant1 = tenants[0];
if (tenant1) {
  try {
    const adminUsers = await User.find({ tenant: tenant1._id })
      .select('-password -otp')
      .populate('tenant', 'name slug')
      .populate({ path: 'department', select: 'name', match: { _id: { $exists: true } } })
      .populate({ path: 'team', select: 'name', match: { _id: { $exists: true } } })
      .lean()
      .limit(1000)
      .sort({ createdAt: -1 });
    console.log(`✅ Admin query for "${tenant1.name}": ${adminUsers.length} users`);
  } catch (err) {
    console.error(`❌ Admin query error: ${err.message}`);
  }
}

await mongoose.disconnect();
console.log('\nDone.');
