import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Tenant from './models/Tenant.js';
import Subscription from './models/Subscription.js';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

// Lift existing tenants that are still below the production-ready baseline.
const tenantUpdate = await Tenant.updateMany(
  {
    $or: [
      { 'settings.features.maxUsers': { $exists: false } },
      { 'settings.features.maxUsers': { $lt: 250 } }
    ]
  },
  {
    'settings.features.maxUsers': 250,
    'settings.features.maxClients': 1000,
    'settings.features.maxDeals': 500,
    'settings.features.advancedReports': true,
    'settings.features.apiAccess': true,
    'settings.features.customBranding': true,
    'settings.features.bulkOperations': true
  }
);

console.log('✅ Updated tenant limits:');
console.log(`- Matched tenants: ${tenantUpdate.matchedCount}`);
console.log(`- Modified tenants: ${tenantUpdate.modifiedCount}`);
console.log('- Max Users: 250');
console.log('- Max Clients: 1000');
console.log('- Max Deals: 500');

// Also lift existing subscription plans that are still below the baseline.
const subscriptionUpdate = await Subscription.updateMany(
  {
    $or: [
      { 'features.maxUsers': { $exists: false } },
      { 'features.maxUsers': { $lt: 250 } }
    ]
  },
  {
    'features.maxUsers': 250,
    'features.maxClients': 1000,
    'features.maxDeals': 500,
    'features.advancedReports': true,
    'features.apiAccess': true,
    'features.customBranding': true,
    'features.bulkOperations': true
  }
);

console.log('\n✅ Updated subscription limits:');
console.log(`- Matched subscriptions: ${subscriptionUpdate.matchedCount}`);
console.log(`- Modified subscriptions: ${subscriptionUpdate.modifiedCount}`);
console.log('- Max Users: 250');
console.log('- Max Clients: 1000');
console.log('- Max Deals: 500');

console.log('\n🎉 You can now register more than 100 users!');

await mongoose.connection.close();
