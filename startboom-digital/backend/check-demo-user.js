import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = (await import('./models/User.js')).default;

    const user = await User.findOne({ email: 'demo@portal.test' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('📋 User Details:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   isActive:', user.isActive);
    console.log('   isFirstLogin:', user.isFirstLogin);
    console.log('   Has Password:', !!user.password);
    console.log('   Has OTP:', !!user.otp);
    console.log('   OTP Expires:', user.otpExpires);
    
    // Test password
    const testPassword = 'Demo123!';
    const matches = await bcrypt.compare(testPassword, user.password);
    console.log('\n🔐 Password Test:');
    console.log('   Testing:', testPassword);
    console.log('   Matches:', matches ? '✅ YES' : '❌ NO');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUser();
