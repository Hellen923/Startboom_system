import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const email = 'hellenkiwagama@gmail.com';
  const u = await mongoose.connection.db.collection('users').findOne({ email });
  if (!u) { console.log('user not found'); process.exit(1); }
  const otp = '667129';
  console.log('bcrypt.compare(otp, password):', await bcrypt.compare(otp, u.password));
  console.log('bcrypt.compare(otp, otp):', await bcrypt.compare(otp, u.otp));
  console.log('plain equals otp:', otp === u.otp);
  console.log('password startsWith $2:', u.password && u.password.startsWith('$2'));
  console.log('otp startsWith $2:', u.otp && u.otp.startsWith('$2'));
  await mongoose.disconnect();
}

main();
