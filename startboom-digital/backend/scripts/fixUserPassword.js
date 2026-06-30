import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function fixExistingUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:admin@cluster0.m6zkv.mongodb.net/crm');
    console.log('✅ Connected to MongoDB');

    const email = 'htkiwagama@student.refactory.academy';
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    const otp = user.otp || '915322';
    console.log('🔄 Fixing user password for email:', email);
    console.log('   OTP:', otp);

    // Hash the OTP (single hash, like the pre-save hook would do)
    const hashedPassword = await bcrypt.hash(otp, 12);
    
    // Update directly to bypass the pre-save hook
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      otp: otp // Keep plain OTP for first login check
    });

    console.log('✅ Password updated successfully');
    console.log('   User can now login with OTP:', otp);

    // Verify the fix
    const updatedUser = await User.findOne({ email });
    const testMatch = await bcrypt.compare(otp, updatedUser.password);
    console.log('\n✅ Verification: bcrypt.compare(OTP, password) =', testMatch);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixExistingUser();
