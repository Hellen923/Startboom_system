/**
 * Fix legacy string department/team fields on User documents.
 * Some users were created before the department field was changed to ObjectId,
 * so they have a plain string stored there which causes Mongoose CastError on populate.
 *
 * Run: node scripts/fixLegacyDepartmentField.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(v) && String(new mongoose.Types.ObjectId(v)) === String(v);

const result = await mongoose.connection.collection('users').updateMany(
  {
    $or: [
      { department: { $type: 'string' } },
      { team: { $type: 'string' } }
    ]
  },
  [
    {
      $set: {
        departmentLegacy: {
          $cond: [{ $eq: [{ $type: '$department' }, 'string'] }, '$department', '$departmentLegacy']
        },
        department: {
          $cond: [{ $eq: [{ $type: '$department' }, 'string'] }, null, '$department']
        },
        team: {
          $cond: [{ $eq: [{ $type: '$team' }, 'string'] }, null, '$team']
        }
      }
    }
  ]
);

console.log(`Fixed ${result.modifiedCount} user(s) with legacy string department/team fields`);
await mongoose.disconnect();
