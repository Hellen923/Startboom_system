import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.js';
import Tenant from './models/Tenant.js';
import Subscription from './models/Subscription.js';
import jwt from 'jsonwebtoken';

await mongoose.connect(process.env.MONGODB_URI);

const user = await User.findOne({ email: 'xtreative@crm.com' }).populate('tenant');
const token = jwt.sign(
  { userId: user._id, role: user.role, tenantId: user.tenant?._id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
await mongoose.connection.close();

const BASE = 'http://localhost:5000/api';
const headers = { Authorization: `Bearer ${token}` };

const routes = [
  { name: 'Users',         url: `${BASE}/users` },
  { name: 'Clients',       url: `${BASE}/clients` },
  { name: 'Deals',         url: `${BASE}/deals` },
  { name: 'Sales',         url: `${BASE}/sales` },
  { name: 'Schedules',     url: `${BASE}/schedules` },
  { name: 'Meetings',      url: `${BASE}/meetings` },
  { name: 'Performance',   url: `${BASE}/performance/overall` },
  { name: 'Stock',         url: `${BASE}/stock` },
  { name: 'Notifications', url: `${BASE}/notifications` },
  { name: 'Reports',       url: `${BASE}/reports/analytics` },
  { name: 'Settings',      url: `${BASE}/settings` },
];

console.log('\n🧪 Testing All Routes with Multi-Tenancy...\n');
console.log('='.repeat(45));

let passed = 0;
let failed = 0;

for (const route of routes) {
  try {
    const res = await fetch(route.url, { headers });
    const status = res.status;
    const ok = status === 200;
    if (ok) {
      passed++;
      console.log(`✅ ${route.name.padEnd(15)} → ${status} OK`);
    } else {
      failed++;
      const body = await res.json();
      console.log(`❌ ${route.name.padEnd(15)} → ${status} - ${body.message || 'Error'}`);
    }
  } catch (err) {
    failed++;
    console.log(`❌ ${route.name.padEnd(15)} → FAILED - ${err.message}`);
  }
}

console.log('='.repeat(45));
console.log(`\n✅ Passed: ${passed}/${routes.length}`);
if (failed > 0) console.log(`❌ Failed: ${failed}/${routes.length}`);
else console.log('\n🎉 All routes are working perfectly!');
