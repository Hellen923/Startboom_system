import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const email = 'florencenamukisa08@gmail.com';
  const u = await mongoose.connection.db.collection('users').findOne({ email });
  console.log('FOUND:', !!u);
  console.log('pw prefix:', u?.password?.substring(0, 40));
  console.log('bcrypt compare Hellen@123:', await bcrypt.compare('Hellen@123', u.password));
  console.log('bcrypt compare admin123:', await bcrypt.compare('admin123', u.password));
  await mongoose.disconnect();
}

main();
