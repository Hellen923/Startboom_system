import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { testEmailConfig, sendEmail, getEmailConfigSummary } from '../services/emailService.js';

dotenv.config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  try {
    console.log('Testing email transporter...');
    const ok = await testEmailConfig();
    console.log('Email config ok:', ok);
    console.log('Email config summary:', getEmailConfigSummary());

    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const email = 'hellenkiwagam@gmail.com';
    const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const user = await User.findOne({ email: normalized });
    if (!user) {
      console.error('User not found:', normalized);
      return;
    }

    const otp = user.otp || '(no otp stored)';
    console.log(`Found user ${user.name} <${user.email}> - OTP: ${otp}`);

    console.log('Resending welcome email with OTP...');
    const res = await sendEmail(normalized, 'agentWelcome', { name: user.name || 'User', email: normalized, otp });
    console.log('sendEmail result:', res);

  } catch (err) {
    console.error('Error:', err.message, err.stack);
  } finally {
    await mongoose.connection.close();
  }
}

run();
