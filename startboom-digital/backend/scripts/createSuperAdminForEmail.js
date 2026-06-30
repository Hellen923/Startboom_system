import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import { sendEmail, generateOTP } from '../services/emailService.js';

async function createSuperAdmin(email, name = 'Super Admin') {
  try {
    console.log(`Creating/Updating superadmin for ${email}...`);
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail) {
      console.error('Invalid email provided');
      return;
    }

    const existing = await User.findOne({ email: normalizedEmail });
    const otp = generateOTP();
    const hashed = await bcrypt.hash(otp, 10);

    if (existing) {
      existing.role = 'superadmin';
      existing.password = hashed;
      existing.otp = otp;
      existing.otpExpires = new Date(Date.now() + 12 * 60 * 60 * 1000);
      existing.isFirstLogin = true;
      existing.isActive = true;
      existing.tenant = null;
      await existing.save();
      console.log('Updated existing user to superadmin.');
    } else {
      const user = new User({
        name,
        email: normalizedEmail,
        password: hashed,
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
      console.log('Created new superadmin user.');
    }

    console.log(`OTP for ${normalizedEmail}: ${otp}`);

    const emailResult = await sendEmail(normalizedEmail, 'agentWelcome', { name, email: normalizedEmail, otp });
    if (emailResult.success) console.log('Welcome email sent');
    else console.log('Failed to send email, manual OTP shown above');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.connection.close();
  }
}

// Run with desired email
createSuperAdmin('hellenkiwagam@gmail.com', 'Hellen Kiwagama');
