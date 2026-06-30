import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const email = process.argv[2] || 'hellenkiwagama@gmail.com';
  const u = await mongoose.connection.db.collection('users').findOne({ email });
  console.log('EMAIL:', email, '| FOUND:', !!u);
  if (!u) { await mongoose.disconnect(); process.exit(0); }
  console.log('role:', u.role, '| firstLogin:', u.isFirstLogin);
  console.log('password prefix:', u.password?.substring(0, 60));
  console.log('password looks hash:', typeof u.password === 'string' ? u.password.startsWith('$2') : false);
  console.log('otp:', u.otp, '| otpExpires:', u.otpExpires);
  await mongoose.disconnect();
}

main();
