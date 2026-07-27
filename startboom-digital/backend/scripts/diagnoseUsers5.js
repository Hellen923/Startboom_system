import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URI);

const { default: AuditLog } = await import('../models/AuditLog.js');

console.log('=== TESTING AuditLog IMMUTABILITY GUARDS ===');

try {
  await AuditLog.deleteMany({ user: new mongoose.Types.ObjectId() });
  console.log('deleteMany: OK (no throw)');
} catch(e) {
  console.log('deleteMany THROWS:', e.message);
}

try {
  await AuditLog.findOneAndDelete({ _id: new mongoose.Types.ObjectId() });
  console.log('findOneAndDelete: OK (no throw)');
} catch(e) {
  console.log('findOneAndDelete THROWS:', e.message);
}

try {
  await AuditLog.deleteOne({ _id: new mongoose.Types.ObjectId() });
  console.log('deleteOne: OK (no throw)');
} catch(e) {
  console.log('deleteOne THROWS:', e.message);
}

// Check if the issue is in the GET /users route itself - maybe it's a different error
// Let's check what happens when we call the route handler directly
console.log('\n=== CHECKING ROUTE HANDLER DIRECTLY ===');

// Import all models
await import('../models/User.js');
await import('../models/Tenant.js');
await import('../models/Subscription.js');
await import('../models/Role.js');
await import('../models/Department.js');
await import('../models/Team.js');

const User = mongoose.model('User');

// Simulate the exact GET /users handler for an admin user
const adminUser = await User.findOne({ role: 'admin' }).populate('tenant').lean();
if (adminUser) {
  console.log(`Testing as admin: ${adminUser.name}, tenant: ${adminUser.tenant?.name}`);
  
  const query = { tenant: adminUser.tenant?._id };
  console.log('Query:', JSON.stringify(query));
  
  try {
    const users = await User.find(query)
      .select('-password -otp')
      .populate('tenant', 'name slug')
      .populate({ path: 'department', select: 'name', match: { _id: { $exists: true } } })
      .populate({ path: 'team', select: 'name', match: { _id: { $exists: true } } })
      .lean()
      .limit(1000)
      .sort({ createdAt: -1 });
    
    const sanitized = users.map(u => ({
      ...u,
      department: u.department && typeof u.department === 'object' ? u.department : null,
      team: u.team && typeof u.team === 'object' ? u.team : null
    }));
    
    console.log(`✅ Admin GET /users: ${sanitized.length} users`);
    sanitized.forEach(u => console.log(`  - ${u.name} (${u.role}), dept: ${JSON.stringify(u.department)}, team: ${JSON.stringify(u.team)}`));
  } catch (err) {
    console.error('❌ Admin GET /users error:', err.message);
    console.error(err.stack);
  }
}

// Check if there's a problem with the Subscription model's 'name' field
// The checkUsageLimit middleware does: tenant.subscription?.features?.maxUsers
// But Subscription schema has 'planName' not 'name'
console.log('\n=== CHECKING Subscription FIELD NAMES ===');
const { default: Subscription } = await import('../models/Subscription.js');
const sub = await Subscription.findOne({}).lean();
if (sub) {
  console.log('Subscription fields:', Object.keys(sub).join(', '));
  console.log('Has "name" field:', 'name' in sub);
  console.log('Has "planName" field:', 'planName' in sub);
  console.log('features.maxUsers:', sub.features?.maxUsers);
}

await mongoose.disconnect();
console.log('\nDone.');
