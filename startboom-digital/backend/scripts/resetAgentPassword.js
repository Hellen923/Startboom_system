import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function resetPassword(email, newPassword) {
  try {
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    };
    
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log('Connected to MongoDB');

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log('User not found:', email);
      process.exit(1);
    }

    console.log('User found:', user.name, '(' + user.email + ')');
    console.log('Current isFirstLogin:', user.isFirstLogin);
    console.log('Current role:', user.role);
    console.log('Current password raw:', user.password);
    console.log('Current password length:', user.password?.length);

    if (!user.password) {
      console.log('❌ User has NO password! This is the issue.');
      process.exit(1);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('New hash created (first 30):', hashedPassword.substring(0, 30));

    // Update directly using updateOne with runValidators: false
    await mongoose.connection.db.collection('users').updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword, otp: null, otpExpires: null, isFirstLogin: false, isActive: true } }
    );
    console.log('Update sent to MongoDB');

    // Fetch fresh from DB (bypass mongoose cache)
    const fromDb = await mongoose.connection.db.collection('users').findOne({ email: normalizedEmail });
    console.log('From DB raw password:', fromDb.password?.substring(0, 30));
    console.log('From DB password length:', fromDb.password?.length);

    // Verify
    const testMatch = await bcrypt.compare(newPassword, fromDb.password);
    console.log('\nbcrypt.compare verification:', testMatch);

    if (testMatch) {
      console.log('\n✅ Password reset complete! Login with:', newPassword);
    } else {
      // Check if the stored hash is valid
      console.log('\n❌ Still failing. Let me check hash format...');
      if (fromDb.password?.startsWith('$2')) {
        console.log('Hash format looks valid (bcrypt)');
      } else {
        console.log('Hash format is INVALID:', fromDb.password?.substring(0, 10));
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message, error.stack);
    process.exit(1);
  }
}

const email = process.argv[2] || 'isaacnewtonk12@gmail.com';
const password = process.argv[3] || 'Isaacnewton@123';

resetPassword(email, password);