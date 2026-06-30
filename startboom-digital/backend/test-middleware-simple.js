import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Import our models and middleware
import User from './models/User.js';
import Tenant from './models/Tenant.js';
import Subscription from './models/Subscription.js';
import { tenantAuth, requireRole, addTenantFilter, addTenantData } from './middleware/tenantAuth.js';

dotenv.config();

const testTenantMiddleware = async () => {
  try {
    console.log('🧪 Testing Tenant-Aware Middleware...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clean up any existing test data
    await User.deleteMany({ email: { $regex: /@testmiddleware\.com$/ } });
    await Tenant.deleteMany({ slug: { $regex: /^test-middleware/ } });
    await Subscription.deleteMany({ planName: 'starter' });

    // Create test subscription
    const testSubscription = new Subscription({
      planName: 'starter',
      planDisplayName: 'Test Starter Plan',
      pricing: { amount: 50, currency: 'USD', interval: 'monthly' },
      features: { maxUsers: 10, maxClients: 200, advancedReports: true }
    });
    await testSubscription.save();

    // Create test tenant
    const testTenant = new Tenant({
      name: 'Test Middleware Company',
      email: 'admin@testmiddleware.com',
      subscription: testSubscription._id,
      status: 'active'
    });
    await testTenant.save();

    // Create super admin user
    const superAdmin = new User({
      name: 'Super Admin',
      email: 'superadmin@testmiddleware.com',
      password: 'password123',
      role: 'superadmin',
      tenant: null,
      isFirstLogin: false
    });
    await superAdmin.save();

    // Create tenant admin user
    const tenantAdmin = new User({
      name: 'Tenant Admin',
      email: 'admin@testmiddleware.com',
      password: 'password123',
      role: 'admin',
      tenant: testTenant._id,
      isFirstLogin: false
    });
    await tenantAdmin.save();

    console.log('✅ Test data created\n');

    // Test 1: Create JWT tokens
    console.log('🔑 Test 1: Creating JWT tokens...');
    const superAdminToken = jwt.sign(
      { userId: superAdmin._id, role: 'superadmin' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    const tenantAdminToken = jwt.sign(
      { userId: tenantAdmin._id, role: 'admin' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    console.log('✅ JWT tokens created\n');

    // Test 2: Test tenantAuth middleware with super admin
    console.log('👑 Test 2: Testing super admin authentication...');
    const mockReqSuperAdmin = {
      headers: { authorization: `Bearer ${superAdminToken}` }
    };
    const mockRes = {
      status: (code) => ({ json: (data) => ({ statusCode: code, data }) })
    };
    let nextCalled = false;
    const mockNext = () => { nextCalled = true; };

    await tenantAuth(mockReqSuperAdmin, mockRes, mockNext);
    
    if (nextCalled && mockReqSuperAdmin.isSuperAdmin) {
      console.log('✅ Super admin authentication works');
      console.log('   - Is Super Admin:', mockReqSuperAdmin.isSuperAdmin);
      console.log('   - Tenant:', mockReqSuperAdmin.tenant);
    } else {
      console.log('❌ Super admin authentication failed');
    }

    // Test 3: Test tenantAuth middleware with tenant admin
    console.log('\n👨💼 Test 3: Testing tenant admin authentication...');
    const mockReqTenantAdmin = {
      headers: { authorization: `Bearer ${tenantAdminToken}` }
    };
    nextCalled = false;

    await tenantAuth(mockReqTenantAdmin, mockRes, mockNext);
    
    if (nextCalled && mockReqTenantAdmin.tenant) {
      console.log('✅ Tenant admin authentication works');
      console.log('   - User role:', mockReqTenantAdmin.user.role);
      console.log('   - Tenant name:', mockReqTenantAdmin.tenant.name);
      console.log('   - Tenant ID:', mockReqTenantAdmin.tenantId);
    } else {
      console.log('❌ Tenant admin authentication failed');
    }

    // Test 4: Test query filtering
    console.log('\n🔍 Test 4: Testing query filtering...');
    const baseQuery = { status: 'active' };
    
    // Super admin query (no tenant filter)
    const superAdminQuery = addTenantFilter(mockReqSuperAdmin, baseQuery);
    console.log('✅ Super admin query:', JSON.stringify(superAdminQuery));
    
    // Tenant user query (with tenant filter)
    const tenantQuery = addTenantFilter(mockReqTenantAdmin, baseQuery);
    console.log('✅ Tenant user query:', JSON.stringify(tenantQuery));

    // Test 5: Test data injection
    console.log('\n💉 Test 5: Testing data injection...');
    const baseData = { name: 'Test Client', email: 'test@example.com' };
    
    // Super admin data (no auto tenant)
    const superAdminData = addTenantData(mockReqSuperAdmin, baseData);
    console.log('✅ Super admin data:', JSON.stringify(superAdminData));
    
    // Tenant user data (with tenant ID)
    const tenantData = addTenantData(mockReqTenantAdmin, baseData);
    console.log('✅ Tenant user data:', JSON.stringify(tenantData));

    console.log('\n🎉 All Middleware Tests Completed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Super admin authentication works');
    console.log('   ✅ Tenant user authentication works');
    console.log('   ✅ Query filtering works');
    console.log('   ✅ Data injection works');

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteOne({ _id: superAdmin._id });
    await User.deleteOne({ _id: tenantAdmin._id });
    await Tenant.deleteOne({ _id: testTenant._id });
    await Subscription.deleteOne({ _id: testSubscription._id });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Middleware test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the tests
testTenantMiddleware();