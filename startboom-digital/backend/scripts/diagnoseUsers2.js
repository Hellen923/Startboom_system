import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URI);

// Import ALL models so they register with mongoose (same as server.js does)
await import('../models/User.js');
await import('../models/Tenant.js');
await import('../models/Subscription.js');
await import('../models/Role.js');
await import('../models/Department.js');
await import('../models/Team.js');

const User = mongoose.model('User');
const Tenant = mongoose.model('Tenant');

console.log('=== TENANT STATUS CHECK ===');
const tenants = await Tenant.find({}).select('name slug status trial subscription').lean();
tenants.forEach(t => {
  console.log(JSON.stringify({
    id: String(t._id),
    name: t.name,
    status: t.status,
    trialEnd: t.trial?.endDate,
    trialExpired: t.trial?.endDate ? new Date() > new Date(t.trial.endDate) : null,
    subscription: t.subscription
  }));
});

console.log('\n=== SIMULATING tenantAuth FOR EACH USER ===');
const users = await User.find({}).populate('tenant').populate('customRole').select('-password -otp').lean();

for (const user of users) {
  const issues = [];
  
  if (user.role === 'superadmin') {
    console.log(`✅ ${user.name} (superadmin) - bypasses tenant check`);
    continue;
  }
  
  if (!user.tenant) {
    issues.push('NO_TENANT');
  } else {
    const t = user.tenant;
    if (t.status !== 'active' && t.status !== 'trial') {
      issues.push(`TENANT_SUSPENDED (status: ${t.status})`);
    }
    if (t.status === 'trial') {
      const expired = t.trial?.endDate && new Date() > new Date(t.trial.endDate);
      if (expired) issues.push(`TRIAL_EXPIRED (ended: ${t.trial.endDate})`);
    }
    if (t.metadata?.lockdownMode) {
      issues.push('TENANT_LOCKDOWN');
    }
  }
  
  if (issues.length > 0) {
    console.log(`❌ ${user.name} (${user.role}): ${issues.join(', ')}`);
  } else {
    console.log(`✅ ${user.name} (${user.role}) - tenant OK (${user.tenant?.name}, ${user.tenant?.status})`);
  }
}

console.log('\n=== TESTING FULL POPULATE QUERY (with all models registered) ===');
try {
  const result = await User.find({})
    .select('-password -otp')
    .populate('tenant', 'name slug')
    .populate({ path: 'department', select: 'name', match: { _id: { $exists: true } } })
    .populate({ path: 'team', select: 'name', match: { _id: { $exists: true } } })
    .lean()
    .limit(1000)
    .sort({ createdAt: -1 });
  console.log(`✅ Query SUCCESS: returned ${result.length} users`);
} catch (err) {
  console.error('❌ QUERY ERROR:', err.message);
}

await mongoose.disconnect();
console.log('\nDone.');
