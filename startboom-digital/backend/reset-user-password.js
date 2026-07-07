// reset-user-password.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Show existing users
    const users = await User.find().select('name email role');
    console.log('📋 EXISTING USERS:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - ${user.name}`);
    });
    console.log('');
    
    const email = await question('Enter user email to reset password: ');
    const newPassword = await question('Enter new password: ');
    
    const user = await User.findOne({ email: email.trim() });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    
    // Save without triggering pre-save hook that would hash again
    await User.updateOne({ _id: user._id }, { password: hashedPassword });
    
    console.log('\n✅ Password reset successfully!');
    console.log(`   Email: ${user.email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log('\n🔐 You can now login with these credentials\n');
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  }
};

resetPassword();
