import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import User from './models/User.js';
import Client from './models/Client.js';
import Tenant from './models/Tenant.js';

const createTestClient = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get first tenant and first user
    const tenant = await Tenant.findOne();
    if (!tenant) {
      console.log('❌ No tenant found. Please create a tenant first.');
      process.exit(1);
    }

    // Get first admin/agent user to assign as agent
    const agent = await User.findOne({ 
      tenant: tenant._id, 
      role: { $in: ['admin', 'agent'] } 
    });
    
    if (!agent) {
      console.log('❌ No agent found. Please create an admin or agent user first.');
      process.exit(1);
    }

    console.log(`📊 Using tenant: ${tenant.companyName || tenant.name}`);
    console.log(`👤 Using agent: ${agent.name}\n`);

    // Create portal user account
    const email = 'client@test.com';
    const password = 'Client123!';

    // Check if user already exists
    let portalUser = await User.findOne({ email });
    
    if (portalUser) {
      console.log(`ℹ️  Portal user already exists: ${email}`);
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      portalUser = await User.create({
        name: 'Test Client',
        email: email,
        password: hashedPassword,
        role: 'client',
        tenant: tenant._id,
        isActive: true
      });
      
      console.log('✅ Created portal user account');
    }

    // Create or update client record
    let client = await Client.findOne({ email });
    
    if (client) {
      console.log(`ℹ️  Client record already exists: ${client.name}`);
      // Update to link portal user
      client.portalUser = portalUser._id;
      client.portalEnabled = true;
      client.portalActivatedAt = new Date();
      await client.save();
      console.log('✅ Updated client with portal access');
    } else {
      client = await Client.create({
        name: 'ABC Investment Ltd',
        email: email,
        phone: '+256-700-123456',
        company: 'ABC Investment Ltd',
        position: 'Managing Director',
        industry: 'Investment',
        address: '123 Main Street',
        city: 'Kampala',
        country: 'Uganda',
        status: 'active',
        tenant: tenant._id,
        agent: agent._id,
        portalUser: portalUser._id,
        portalEnabled: true,
        portalActivatedAt: new Date(),
        tags: ['investor', 'vip']
      });
      
      console.log('✅ Created client record');
    }

    console.log('\n🎉 SUCCESS! Test client is ready!\n');
    console.log('═══════════════════════════════════════════');
    console.log('📋 CLIENT PORTAL LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('═══════════════════════════════════════════');
    console.log(`\n🔗 Portal URL: /client-portal/login`);
    console.log('\n✨ You can now login to the client portal!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTestClient();
