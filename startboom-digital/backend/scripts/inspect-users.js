import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const uri = 'mongodb+srv://florence:Florah@cse-js-4-cluster.mdufr.mongodb.net/crm_db?retryWrites=true&w=majority';

async function main() {
  await mongoose.connect(uri);
  const emails = [
    'hellenkiwagam@gmail.com',
    'htkiwagama@student.refactory.academy',
    'xtreative@crm.com'
  ];
  for (const email of emails) {
    const u = await mongoose.connection.db.collection('users').findOne({ email });
    console.log('---');
    console.log('USER:', email, u ? 'FOUND' : 'MISSING');
    if (u) {
      console.log('name:', u.name);
      console.log('role:', u.role);
      console.log('isActive:', u.isActive);
      console.log('isFirstLogin:', u.isFirstLogin);
      console.log('tenant:', u.tenant);
      console.log('passwordPrefix:', u.password?.substring(0, 30));
      console.log('otp:', u.otp);
      console.log('otpExpires:', u.otpExpires);
    }
  }
  await mongoose.disconnect();
}

main();
