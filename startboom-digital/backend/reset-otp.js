import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Tenant from './models/Tenant.js';
import { sendEmail, generateOTP } from './services/emailService.js';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const email = 'htkiwagama@student.refactory.academy';
const otp = generateOTP();
const hashed = await bcrypt.hash(otp, 10);

const user = await User.findOneAndUpdate(
  { email },
  { 
    password: hashed, 
    otp, 
    otpExpires: new Date(Date.now() + 12 * 60 * 60 * 1000), 
    isFirstLogin: true 
  },
  { new: true }
);

console.log('✅ User updated:', user.email);
console.log('🔑 New OTP:', otp);

const result = await sendEmail(email, 'agentWelcome', { name: user.name, email, otp });
console.log('📧 Email sent:', result.success);
if (!result.success) console.log('❌ Error:', result.error);

await mongoose.connection.close();
console.log('Done!');