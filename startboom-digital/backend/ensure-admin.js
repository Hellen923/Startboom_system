import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://florence:Florah@cse-js-4-cluster.mdufr.mongodb.net/crm_db?retryWrites=true&w=majority';

async function ensureAdmin() {
  try {
    console.log('🔄 Ensuring admin user exists in MongoDB Atlas...\n');

    // Connect to Atlas
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    // Check if admin exists with either email
    let adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('✅ Admin user found:');
      console.log(`   Email: ${adminExists.email}`);
      console.log(`   Name: ${adminExists.name}`);
      console.log(`   Active: ${adminExists.isActive}`);
      
      // Update email to xtreative@crm.com if different
      if (adminExists.email !== 'xtreative@crm.com') {
        console.log('\n🔧 Updating admin email to xtreative@crm.com...');
        adminExists.email = 'xtreative@crm.com';
      }
      
      // Reset admin password to admin123
      console.log('\n🔧 Resetting admin password to "admin123"...');
      adminExists.password = 'admin123';
      adminExists.isFirstLogin = false;
      adminExists.isActive = true;
      adminExists.otp = null;
      adminExists.otpExpires = null;
      await adminExists.save();
      console.log('✅ Admin updated successfully');
    } else {
      console.log('🔧 Creating default admin user...');
      const newAdmin = await User.create({
        name: 'System Administrator',
        email: 'xtreative@crm.com',
        password: 'admin123',
        role: 'admin',
        isFirstLogin: false,
        isActive: true
      });
      console.log('✅ Admin user created successfully:');
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Password: admin123`);
    }

    console.log('\n✅ Admin setup completed!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: xtreative@crm.com');
    console.log('   Password: admin123');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ensuring admin:', error);
    process.exit(1);
  }
}

ensureAdmin();
