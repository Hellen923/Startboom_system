import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: './.env' });

async function fix(email) {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const user = await User.findOne({ email: normalized });
    if (!user) return console.error('User not found');
    if (!user.otp) return console.error('User has no OTP stored to set as password');

    // Set the plain OTP as password so pre-save hook will hash it exactly once
    user.password = user.otp;
    await user.save();
    console.log('Updated user password to hash of OTP for', normalized);
  } catch (err) {
    console.error('Error:', err.message, err.stack);
  } finally {
    await mongoose.connection.close();
  }
}

fix('hellenkiwagam@gmail.com');
