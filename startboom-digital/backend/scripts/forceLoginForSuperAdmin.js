import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const email = 'hellenkiwagama@gmail.com';
  const password = 'Hellen@123';
  const hashed = await bcrypt.hash(password, 12);
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email },
    { $set: { password: hashed, otp: null, otpExpires: null, isFirstLogin: false, isActive: true, role: 'superadmin', tenant: null, name: 'Hellen Kiwagama' } }
  );
  console.log('matched:', result.matchedCount, 'modified:', result.modifiedCount, 'email:', email, 'password:', password);
  await mongoose.disconnect();
}

main();
