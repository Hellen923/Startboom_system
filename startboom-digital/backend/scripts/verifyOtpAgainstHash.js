import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config({ path: './.env' });

async function verify(email, otp) {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const user = await User.findOne({ email: normalized });
    if (!user) return console.error('User not found');
    const match = await bcrypt.compare(otp, user.password);
    console.log(`bcrypt compare result for ${normalized}:`, match);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

verify('hellenkiwagam@gmail.com', '724239');
