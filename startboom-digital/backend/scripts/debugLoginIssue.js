import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function debugLogin() {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:admin@cluster0.m6zkv.mongodb.net/crm');
    console.log('✅ Connected to MongoDB');

    // Find the user
    const email = process.argv[2] || 'htkiwagama@student.refactory.academy';
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found in database');
      process.exit(1);
    }

    console.log('\n📋 User Found:');
    console.log('  - Name:', user.name);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - IsFirstLogin:', user.isFirstLogin);
    console.log('  - Tenant:', user.tenant);
    console.log('  - OTP Expires:', user.otpExpires);

    // Check OTP - try common OTPs
    const testOTPs = ['915322', '123456', '000000'];

    for (const testOTP of testOTPs) {
      console.log('\n🔐 Testing OTP:', testOTP);

      // Try bcrypt compare against password field (for first login)
      const passMatch = await bcrypt.compare(testOTP, user.password);
      console.log('  - bcrypt.compare(password) result:', passMatch);

      // Try bcrypt compare against OTP field
      if (user.otp) {
        const otpMatch = await bcrypt.compare(testOTP, user.otp);
        console.log('  - bcrypt.compare(otp) result:', otpMatch);
        if (otpMatch) {
          console.log('\n✅ SUCCESS! OTP matches hashed otp field. User can login with:', testOTP);
          process.exit(0);
        }
      }

      // Direct string match
      if (user.otp === testOTP) {
        console.log('  - Direct string match:', true);
      }
    }

    // Check if OTP is expired
    const now = new Date();
    const isExpired = user.otpExpires && user.otpExpires < now;
    console.log('\n  - OTP Expired?', isExpired, `(expires ${user.otpExpires?.toISOString()})`);

    console.log('\n⚠️  No OTP matched. Suggest:');
    console.log('  1. Run resetAgentPassword.js script with a known password');
    console.log('  2. Or use resendFreshOtpForEmail.js to generate a new OTP');
    console.log('\n     node scripts/resetAgentPassword.js ' + email + ' NewPassword123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugLogin();
