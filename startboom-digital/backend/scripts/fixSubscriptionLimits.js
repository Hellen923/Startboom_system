/**
 * Fix subscription maxUsers limit and sync tenant usage.totalUsers
 * to match the actual number of users in the database.
 *
 * Run: node scripts/fixSubscriptionLimits.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB\n');

// 1. Update subscription maxUsers to a reasonable limit
const subResult = await mongoose.connection.collection('subscriptions').updateMany(
  {},
  { $set: { 'features.maxUsers': 100, 'features.maxClients': 1000, 'features.maxDeals': 500 } }
);
console.log(`Updated ${subResult.modifiedCount} subscription(s): maxUsers=100, maxClients=1000, maxDeals=500`);

// 2. Sync tenant usage.totalUsers to actual user count
const tenants = await mongoose.connection.collection('tenants').find({}).toArray();
for (const tenant of tenants) {
  const actualCount = await mongoose.connection.collection('users').countDocuments({ tenant: tenant._id });
  await mongoose.connection.collection('tenants').updateOne(
    { _id: tenant._id },
    { $set: { 'usage.totalUsers': actualCount } }
  );
  console.log(`Tenant "${tenant.name}": usage.totalUsers synced to ${actualCount}`);
}

// 3. Also update tenant settings.features.maxUsers
await mongoose.connection.collection('tenants').updateMany(
  {},
  { $set: { 'settings.features.maxUsers': 100, 'settings.features.maxClients': 1000, 'settings.features.maxDeals': 500 } }
);
console.log('\nUpdated tenant settings.features limits');

await mongoose.disconnect();
console.log('\nDone. Push to Render to deploy the code fixes.');
