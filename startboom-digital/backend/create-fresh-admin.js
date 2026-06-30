import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const User = await import('./models/User.js').then(m => m.default);
const Tenant = await import('./models/Tenant.js').then(m => m.default);

async function createFreshAdmin() {
  try {
    console.log('🔄 Creating fresh admin for Startboom Digital...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get or create tenant
    let tenant = await Tenant.findOne({ name: 'Startboom Digital' });
    
    if (!tenant) {
      tenant = await Tenant.create({
        name: 'Startboom Digital',
        subdomain: 'startboom',
        email: 'admin@startboomdigital.com',
        phone: '+256-000-000-000',
        industry: 'Sales Management',
        size: 'small',
        isActive: true,
        features: {
          maxUsers: 100,
          maxClients: 10000,
          maxDeals: 10000,
          customDomains: true,
          apiAccess: true,
          advancedReporting: true,
          whiteLabel: true
        }
      });
      console.log('✅ Created Startboom Digital tenant');
    }

    // Delete existing admin if exists
    await User.deleteOne({ email: 'admin@startboom.com' });
    
    // Create new admin with known password
    const hashedPassword = await bcrypt.hash('StartBoom2026!', 10);
    
    const admin = await User.create({
      email: 'admin@startboom.com',
      password: hashedPassword,
      name: 'Startboom Admin',
      role: 'admin',
      tenant: tenant._id,
      isActive: true,
      isFirstLogin: false,
      emailVerified: true
    });

    console.log('\n✅ Admin created successfully!\n');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('   Email: admin@startboom.com');
    console.log('   Password: StartBoom2026!');
    console.log('\n🌐 Login URL: http://localhost:3000/login\n');

    await mongoose.connection.close();
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createFreshAdmin();
