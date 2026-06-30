import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { sendEmail, generateOTP } from '../services/emailService.js';

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const email = 'hellenkiwagama@gmail.com';
  const name = 'Hellen Kiwagama';
  const existing = await User.findOne({ email });
  const otp = generateOTP();
  if (existing) {
    existing.role = 'superadmin';
    existing.password = otp;
    existing.otp = otp;
    existing.otpExpires = new Date(Date.now() + 12 * 60 * 60 * 1000);
    existing.isFirstLogin = true;
    existing.isActive = true;
    existing.tenant = null;
    await existing.save();
    console.log('Updated existing user to superadmin');
  } else {
    const user = new User({
      name,
      email,
      password: otp,
      role: 'superadmin',
      otp,
      otpExpires: new Date(Date.now() + 12 * 60 * 60 * 1000),
      isFirstLogin: true,
      isActive: true,
      tenant: null,
      phone: '+256700000000',
      status: 'online'
    });
    await user.save();
    console.log('Created new superadmin user');
  }
  console.log('Email:', email);
  console.log('OTP:', otp);
  await mongoose.disconnect();
}

main();
