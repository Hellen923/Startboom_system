import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log('Users with firstLogin=true and their OTP status:\n');
  users.forEach((u) => {
    if (u.isFirstLogin) {
      console.log(`Email: ${u.email}`);
      console.log(`  OTP value: ${u.otp}`);
      console.log(`  OTP type: ${typeof u.otp}`);
      console.log(`  OTP length: ${u.otp?.length}`);
      console.log(`  OTP looks hash: ${typeof u.otp === 'string' && u.otp.startsWith('$2')}`);
      console.log(`  OTP expires: ${u.otpExpires}`);
    }
  });
  await mongoose.disconnect();
}

main();
