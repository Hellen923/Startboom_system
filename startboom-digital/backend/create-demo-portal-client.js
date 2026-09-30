import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function createDemoClient() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = (await import('./models/User.js')).default;
    const Client = (await import('./models/Client.js')).default;
    const Tenant = (await import('./models/Tenant.js')).default;

    // Get the first tenant
    const tenant = await Tenant.findOne();
    if (!tenant) {
      console.log('❌ No tenant found. Please create a tenant first.');
      process.exit(1);
    }

    console.log(`📍 Using tenant: ${tenant.companyName}`);

    // Get an agent from this tenant
    const agent = await User.findOne({ tenant: tenant._id, role: 'agent' });
    if (!agent) {
      console.log('❌ No agent found in this tenant. Please create an agent first.');
      process.exit(1);
    }

    console.log(`👤 Using agent: ${agent.name}`);

    // Delete existing demo client if exists
    await Client.deleteOne({ email: 'demo@portal.test' });
    await User.deleteOne({ email: 'demo@portal.test' });
    
    console.log('🗑️  Cleared existing demo client');

    // Create client
    const client = await Client.create({
      name: 'Demo Portal Client',
      email: 'demo@portal.test',
      phone: '+256 700 123 456',
      company: 'Demo Company',
      position: 'CEO',
      status: 'active',
      priority: 'high',
      engagementScore: 85,
      tenant: tenant._id,
      agent: agent._id
    });

    console.log('✅ Created client');

    // Create portal user with KNOWN password
    // NOTE: User model has a pre-save hook that will hash the password
    const password = 'Demo123!';

    const portalUser = await User.create({
      name: client.name,
      email: client.email,
      phone: client.phone,
      password: password, // Pass plain text - model will hash it
      role: 'client',
      tenant: tenant._id,
      isActive: true,
      isFirstLogin: false,
      otp: null,
      otpExpires: null
    });

    console.log('✅ Created portal user (password will be hashed by model hook)');

    // Link client to portal user
    client.portalUser = portalUser._id;
    client.portalEnabled = true;
    client.portalInvitedAt = new Date();
    client.portalActivatedAt = new Date();
    await client.save();

    console.log('\n🎉 Demo Portal Client Created Successfully!\n');
    console.log('📧 Email: demo@portal.test');
    console.log('🔑 Password: Demo123!');
    console.log('🌐 Login URL: https://honeypot-crm.vercel.app/client-portal/login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createDemoClient();
