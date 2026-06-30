import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log(`Total users: ${users.length}\n`);
  users.forEach((u) => {
    const looksLikeBcrypt = typeof u.password === 'string' && u.password.startsWith('$2');
    console.log(`${u.email} | role=${u.role} | firstLogin=${u.isFirstLogin} | active=${u.isActive} | hash=${looksLikeBcrypt}`);
  });
  await mongoose.disconnect();
}

main();
