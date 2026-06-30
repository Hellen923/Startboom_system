import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.js';
import Tenant from './models/Tenant.js';
import jwt from 'jsonwebtoken';

await mongoose.connect(process.env.MONGODB_URI);

const user = await User.findOne({ email: 'xtreative@crm.com' }).populate('tenant');
console.log('User:', user?.email, '| Role:', user?.role, '| Tenant:', user?.tenant?.name);

const token = jwt.sign(
  { userId: user._id, role: user.role, tenantId: user.tenant?._id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
console.log('TOKEN:', token);
await mongoose.connection.close();
