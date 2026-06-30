import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Check backend/.env');
  process.exit(1);
}

async function listUsers() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const users = await User.find({}).select('name email role isActive isFirstLogin createdAt tenant').limit(200).lean();
    console.log(`Found ${users.length} users:\n`);
    users.forEach(u => {
      console.log(`- ${u.name || '(no name)'} <${u.email}> | role: ${u.role} | active: ${u.isActive} | firstLogin: ${u.isFirstLogin} | tenant: ${u.tenant ? u.tenant : 'none'} | created: ${u.createdAt}`);
    });
    if (users.length === 0) console.log('\nNo users found in the database.');
  } catch (err) {
    console.error('Error listing users:', err.message);
  } finally {
    await mongoose.connection.close();
  }
}

listUsers();
