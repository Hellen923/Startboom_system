import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { sendEmail, generateOTP } from '../services/emailService.js';

dotenv.config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  const email = process.argv[2] || 'hellenkiwagam@gmail.com';
  const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';

  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const user = await User.findOne({ email: normalized });
    if (!user) {
      console.error('User not found:', normalized);
      return;
    }

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    user.password = hashedOTP;
    user.otp = hashedOTP;
    user.otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.isFirstLogin = true;
    await user.save();

    console.log(`Updated OTP for ${user.name} <${user.email}>: ${otp}`);

    const result = await sendEmail(normalized, 'agentWelcome', {
      name: user.name || 'User',
      email: normalized,
      otp
    });

    console.log('Email send result:', result);
    if (result.success) {
      console.log('A fresh OTP was sent to the user.');
    } else {
      console.log('Failed to send email; use the OTP above to login manually.');
    }
  } catch (error) {
    console.error('Error resending fresh OTP:', error.message, error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

run();
