// create-test-admin.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Tenant from './models/Tenant.js';

dotenv.config();

const createTestAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find or create a test tenant
    let tenant = await Tenant.findOne({ slug: 'test-company' });
    
    if (!tenant) {
      tenant = new Tenant({
        name: 'Test Company',
        slug: 'test-company',
        email: 'admin@test.com',
        status: 'active'
      });
      await tenant.save();
      console.log('✅ Created test tenant');
    } else {
      console.log('✅ Using existing test tenant');
    }
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    
    if (existingAdmin) {
      console.log('\n⚠️  Admin user already exists!');
      console.log('   Email: admin@test.com');
      console.log('\n   Use reset-user-password.js to reset the password\n');
      process.exit(0);
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    
    const admin = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      tenant: tenant._id,
      isActive: true,
      isFirstLogin: false
    });
    
    await admin.save();
    
    console.log('\n✅ TEST ADMIN CREATED SUCCESSFULLY!\n');
    console.log('   📧 Email: admin@test.com');
    console.log('   🔑 Password: Admin@123');
    console.log('   👤 Role: admin');
    console.log('   🏢 Tenant: Test Company');
    console.log('\n🚀 You can now login with these credentials!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestAdmin();
