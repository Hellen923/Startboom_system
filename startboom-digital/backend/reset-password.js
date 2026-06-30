import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const User = await import('./models/User.js').then(m => m.default);

async function resetPassword() {
  try {
    console.log('🔄 Resetting password...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'admin@test.com' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ Found user:', user.email);
    
    // Set new password
    const newPassword = 'admin123';
    user.password = newPassword; // This will trigger the pre-save hook to hash it
    user.isFirstLogin = false;
    
    await user.save();

    console.log('\n✅ Password reset successfully!\n');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');
    console.log('\n🌐 Login URL: http://localhost:3000/login\n');

    await mongoose.connection.close();
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetPassword();
