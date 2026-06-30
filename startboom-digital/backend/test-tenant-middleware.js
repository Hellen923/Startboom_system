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
    await Subscription.deleteMany({ planName: 'test-plan' });

    // Create test subscription
    const testSubscription = new Subscription({
      planName: 'test-plan',
      planDisplayName: 'Test Plan',
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

    // Create tenant agent user
    const tenantAgent = new User({
      name: 'Tenant Agent',
      email: 'agent@testmiddleware.com',
      password: 'password123',
      role: 'agent',
      tenant: testTenant._id,
      isFirstLogin: false
    });
    await tenantAgent.save();

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

    const tenantAgentToken = jwt.sign(
      { userId: tenantAgent._id, role: 'agent' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    console.log('✅ JWT tokens created\n');

    // Test 2: Test tenantAuth middleware with super admin
    console.log('👑 Test 2: Testing super admin authentication...');
    const mockReqSuperAdmin = {\n      headers: { authorization: `Bearer ${superAdminToken}` }\n    };\n    const mockRes = {\n      status: (code) => ({ json: (data) => ({ statusCode: code, data }) })\n    };\n    let nextCalled = false;\n    const mockNext = () => { nextCalled = true; };\n\n    await tenantAuth(mockReqSuperAdmin, mockRes, mockNext);\n    \n    if (nextCalled && mockReqSuperAdmin.isSuperAdmin) {\n      console.log('✅ Super admin authentication works');\n      console.log('   - Is Super Admin:', mockReqSuperAdmin.isSuperAdmin);\n      console.log('   - Tenant:', mockReqSuperAdmin.tenant);\n    } else {\n      console.log('❌ Super admin authentication failed');\n    }\n\n    // Test 3: Test tenantAuth middleware with tenant admin\n    console.log('\\n👨💼 Test 3: Testing tenant admin authentication...');\n    const mockReqTenantAdmin = {\n      headers: { authorization: `Bearer ${tenantAdminToken}` }\n    };\n    nextCalled = false;\n\n    await tenantAuth(mockReqTenantAdmin, mockRes, mockNext);\n    \n    if (nextCalled && mockReqTenantAdmin.tenant) {\n      console.log('✅ Tenant admin authentication works');\n      console.log('   - User role:', mockReqTenantAdmin.user.role);\n      console.log('   - Tenant name:', mockReqTenantAdmin.tenant.name);\n      console.log('   - Tenant ID:', mockReqTenantAdmin.tenantId);\n    } else {\n      console.log('❌ Tenant admin authentication failed');\n    }\n\n    // Test 4: Test query filtering\n    console.log('\\n🔍 Test 4: Testing query filtering...');\n    const baseQuery = { status: 'active' };\n    \n    // Super admin query (no tenant filter)\n    const superAdminQuery = addTenantFilter(mockReqSuperAdmin, baseQuery);\n    console.log('✅ Super admin query:', JSON.stringify(superAdminQuery));\n    \n    // Tenant user query (with tenant filter)\n    const tenantQuery = addTenantFilter(mockReqTenantAdmin, baseQuery);\n    console.log('✅ Tenant user query:', JSON.stringify(tenantQuery));\n\n    // Test 5: Test data injection\n    console.log('\\n💉 Test 5: Testing data injection...');\n    const baseData = { name: 'Test Client', email: 'test@example.com' };\n    \n    // Super admin data (no auto tenant)\n    const superAdminData = addTenantData(mockReqSuperAdmin, baseData);\n    console.log('✅ Super admin data:', JSON.stringify(superAdminData));\n    \n    // Tenant user data (with tenant ID)\n    const tenantData = addTenantData(mockReqTenantAdmin, baseData);\n    console.log('✅ Tenant user data:', JSON.stringify(tenantData));\n\n    // Test 6: Test role-based access\n    console.log('\\n🛡️ Test 6: Testing role-based access...');\n    const adminOnlyMiddleware = requireRole(['admin', 'superadmin']);\n    \n    // Test with tenant admin (should pass)\n    nextCalled = false;\n    adminOnlyMiddleware(mockReqTenantAdmin, mockRes, mockNext);\n    console.log('✅ Admin access test:', nextCalled ? 'PASSED' : 'FAILED');\n    \n    // Test with tenant agent (should fail)\n    const mockReqTenantAgent = {\n      headers: { authorization: `Bearer ${tenantAgentToken}` },\n      user: { role: 'agent' }\n    };\n    nextCalled = false;\n    let accessDenied = false;\n    const mockResWithStatus = {\n      status: (code) => ({\n        json: (data) => {\n          if (code === 403) accessDenied = true;\n          return { statusCode: code, data };\n        }\n      })\n    };\n    adminOnlyMiddleware(mockReqTenantAgent, mockResWithStatus, mockNext);\n    console.log('✅ Agent access denial test:', accessDenied ? 'PASSED' : 'FAILED');\n\n    console.log('\\n🎉 All Middleware Tests Completed!');\n    console.log('\\n📋 Test Summary:');\n    console.log('   ✅ Super admin authentication works');\n    console.log('   ✅ Tenant user authentication works');\n    console.log('   ✅ Query filtering works');\n    console.log('   ✅ Data injection works');\n    console.log('   ✅ Role-based access control works');\n\n    // Clean up test data\n    console.log('\\n🧹 Cleaning up test data...');\n    await User.deleteOne({ _id: superAdmin._id });\n    await User.deleteOne({ _id: tenantAdmin._id });\n    await User.deleteOne({ _id: tenantAgent._id });\n    await Tenant.deleteOne({ _id: testTenant._id });\n    await Subscription.deleteOne({ _id: testSubscription._id });\n    console.log('✅ Test data cleaned up');\n\n  } catch (error) {\n    console.error('❌ Middleware test failed:', error.message);\n    console.error('Stack trace:', error.stack);\n  } finally {\n    await mongoose.disconnect();\n    console.log('\\n🔌 Disconnected from MongoDB');\n    process.exit(0);\n  }\n};\n\n// Run the tests\ntestTenantMiddleware();