import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
import { sendEmail, generateOTP } from './services/emailService.js';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Prompt for email
    const email = process.argv[2] || 'superadmin@crm.com';
    const name = process.argv[3] || 'Super Administrator';

    // Check if super admin already exists with this email
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('❌ User with this email already exists');
      console.log('   Email:', existing.email);
      console.log('   Name:', existing.name);
      console.log('   Role:', existing.role);
      
      if (existing.role !== 'superadmin') {
        console.log('\n🔄 Updating existing user to superadmin role...');
        existing.role = 'superadmin';
        existing.tenant = null; // Super admin has no tenant
        await existing.save();
        console.log('✅ User role updated to superadmin');
      }
      
      await mongoose.connection.close();
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Create super admin
    const superAdmin = new User({
      name,
      email,
      password: otp, // Will be hashed by pre-save hook
      role: 'superadmin',
      isFirstLogin: true,
      isActive: true,
      otp: otp, // Store plain OTP for first login
      otpExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      tenant: null, // Super admin has no tenant
      phone: '',
      status: 'offline'
    });

    await superAdmin.save();

    console.log('\n✅ Super Admin created successfully!');
    console.log('👤 Name:', name);
    console.log('📧 Email:', email);
    console.log('🔑 OTP:', otp);
    console.log('⏰ OTP expires in: 24 hours');
    console.log('🔗 Login URL: https://crm-system-brown-kappa.vercel.app/login');

    // Try to send welcome email
    console.log('\n📧 Sending welcome email...');
    const emailResult = await sendEmail(email, 'agentWelcome', {
      name,
      email,
      otp
    });

    if (emailResult.success) {
      console.log('✅ Welcome email sent successfully!');
    } else {
      console.log('❌ Failed to send email:', emailResult.error);
      console.log('⚠️  Please share the OTP manually with the user');
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Usage instructions
if (process.argv.length < 3) {
  console.log('📝 Usage: node create-superadmin.js <email> [name]');
  console.log('📝 Example: node create-superadmin.js admin@example.com "John Doe"');
  console.log('\n🚀 Creating default super admin...\n');
}

createSuperAdmin();
