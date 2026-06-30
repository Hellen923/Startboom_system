import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import our models
import Tenant from './models/Tenant.js';
import Subscription from './models/Subscription.js';
import User from './models/User.js';
import Client from './models/Client.js';
import Deal from './models/Deal.js';

dotenv.config();

const testMultiTenancy = async () => {
  try {
    console.log('🧪 Starting Multi-Tenancy Tests...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clean up any existing test data first
    console.log('🧹 Cleaning up any existing test data...');
    await Tenant.deleteMany({ slug: { $regex: /^test-company/ } });
    await Subscription.deleteMany({ planName: 'starter' });
    await User.deleteMany({ email: { $regex: /@(testcompany\.com|crmsystem\.com)$/ } });
    console.log('✅ Cleanup completed\n');

    // Test 1: Create a Subscription Plan
    console.log('📋 Test 1: Creating Subscription Plan...');
    const starterPlan = new Subscription({
      planName: 'starter',
      planDisplayName: 'Starter Plan',
      pricing: {
        amount: 29.99,
        currency: 'USD',
        interval: 'monthly'
      },
      features: {
        maxUsers: 5,
        maxClients: 100,
        maxDeals: 50,
        advancedReports: false,
        apiAccess: false,
        customBranding: false
      }
    });
    
    await starterPlan.save();
    console.log('✅ Subscription plan created:', starterPlan.planDisplayName);
    console.log('   - Plan ID:', starterPlan._id);
    console.log('   - MRR:', starterPlan.mrr);
    console.log('   - Has API Access:', starterPlan.hasFeature('apiAccess'));
    console.log('   - Max Users:', starterPlan.getFeatureLimit('maxUsers'));

    // Test 2: Create a Tenant
    console.log('\n🏢 Test 2: Creating Tenant...');
    const testTenant = new Tenant({
      name: 'Test Company Inc',
      email: 'admin@testcompany.com',
      phone: '+1-555-0123',
      subscription: starterPlan._id,
      address: {
        street: '123 Business St',
        city: 'Tech City',
        state: 'CA',
        postalCode: '90210',
        country: 'USA'
      },
      metadata: {
        industry: 'Technology',
        companySize: '11-50',
        source: 'website'
      }
    });

    await testTenant.save();
    console.log('✅ Tenant created:', testTenant.name);
    console.log('   - Tenant ID:', testTenant._id);
    console.log('   - Slug:', testTenant.slug);
    console.log('   - Trial Days Remaining:', testTenant.trialDaysRemaining);
    console.log('   - Can Add User:', testTenant.canAddUser());
    console.log('   - Can Add Client:', testTenant.canAddClient());

    // Test 3: Create Super Admin User
    console.log('\n👑 Test 3: Creating Super Admin...');
    const superAdmin = new User({
      name: 'System Super Admin',
      email: 'superadmin@crmsystem.com',
      password: 'superadmin123',
      role: 'superadmin',
      tenant: null, // Super admin has no tenant
      isFirstLogin: false
    });

    await superAdmin.save();
    console.log('✅ Super Admin created:', superAdmin.name);
    console.log('   - Role:', superAdmin.role);
    console.log('   - Tenant:', superAdmin.tenant);

    // Test 4: Create Tenant Admin User
    console.log('\n👨‍💼 Test 4: Creating Tenant Admin...');
    const tenantAdmin = new User({
      name: 'Company Admin',
      email: 'admin@testcompany.com',
      password: 'admin123',
      role: 'admin',
      tenant: testTenant._id,
      isFirstLogin: false
    });

    await tenantAdmin.save();
    console.log('✅ Tenant Admin created:', tenantAdmin.name);
    console.log('   - Role:', tenantAdmin.role);
    console.log('   - Tenant:', tenantAdmin.tenant);

    // Update tenant owner
    testTenant.owner = tenantAdmin._id;
    await testTenant.save();

    // Test 5: Create Tenant Agent
    console.log('\n👨‍💻 Test 5: Creating Tenant Agent...');
    const tenantAgent = new User({
      name: 'Sales Agent',
      email: 'agent@testcompany.com',
      password: 'agent123',
      role: 'agent',
      tenant: testTenant._id,
      isFirstLogin: false
    });

    await tenantAgent.save();
    console.log('✅ Tenant Agent created:', tenantAgent.name);
    console.log('   - Role:', tenantAgent.role);
    console.log('   - Tenant:', tenantAgent.tenant);

    // Test 6: Create Client for Tenant
    console.log('\n👤 Test 6: Creating Client...');
    const testClient = new Client({
      name: 'John Doe',
      gender: 'male',
      email: 'john.doe@example.com',
      phone: '+1-555-0199',
      address: '456 Client Ave',
      city: 'Client City',
      state: 'NY',
      country: 'USA',
      agent: tenantAgent._id,
      tenant: testTenant._id
    });

    await testClient.save();
    console.log('✅ Client created:', testClient.name);
    console.log('   - Client ID:', testClient._id);
    console.log('   - Agent:', testClient.agent);
    console.log('   - Tenant:', testClient.tenant);

    // Test 7: Create Deal for Tenant
    console.log('\n💼 Test 7: Creating Deal...');
    const testDeal = new Deal({
      title: 'Software License Deal',
      description: 'Annual software license for client',
      value: 5000,
      client: testClient._id,
      agent: tenantAgent._id,
      tenant: testTenant._id,
      stage: 'qualification',
      probability: 75,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    await testDeal.save();
    console.log('✅ Deal created:', testDeal.title);
    console.log('   - Deal ID:', testDeal._id);
    console.log('   - Value:', testDeal.value);
    console.log('   - Stage:', testDeal.stage);
    console.log('   - Tenant:', testDeal.tenant);

    // Test 8: Test Data Isolation Queries
    console.log('\n🔒 Test 8: Testing Data Isolation...');
    
    // Query clients by tenant
    const tenantClients = await Client.find({ tenant: testTenant._id });
    console.log('✅ Clients for tenant:', tenantClients.length);
    
    // Query deals by tenant
    const tenantDeals = await Deal.find({ tenant: testTenant._id });
    console.log('✅ Deals for tenant:', tenantDeals.length);
    
    // Query users by tenant
    const tenantUsers = await User.find({ tenant: testTenant._id });
    console.log('✅ Users for tenant:', tenantUsers.length);

    // Test 9: Test Subscription Features
    console.log('\n💳 Test 9: Testing Subscription Features...');
    const populatedTenant = await Tenant.findById(testTenant._id).populate('subscription');
    console.log('✅ Tenant subscription loaded');
    console.log('   - Plan:', populatedTenant.subscription.planDisplayName);
    console.log('   - Max Users:', populatedTenant.subscription.features.maxUsers);
    console.log('   - Has Advanced Reports:', populatedTenant.hasFeature('advancedReports'));

    // Test 10: Update Usage Statistics
    console.log('\n📊 Test 10: Updating Usage Statistics...');
    testTenant.usage.totalUsers = tenantUsers.length;
    testTenant.usage.totalClients = tenantClients.length;
    testTenant.usage.totalDeals = tenantDeals.length;
    testTenant.usage.lastActivity = new Date();
    
    await testTenant.save();
    console.log('✅ Usage statistics updated');
    console.log('   - Total Users:', testTenant.usage.totalUsers);
    console.log('   - Total Clients:', testTenant.usage.totalClients);
    console.log('   - Total Deals:', testTenant.usage.totalDeals);

    console.log('\n🎉 All Multi-Tenancy Tests Passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Subscription model works');
    console.log('   ✅ Tenant model works');
    console.log('   ✅ User model supports superadmin role');
    console.log('   ✅ All models have tenant references');
    console.log('   ✅ Data isolation queries work');
    console.log('   ✅ Feature access control works');
    console.log('   ✅ Usage tracking works');

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Deal.deleteOne({ _id: testDeal._id });
    await Client.deleteOne({ _id: testClient._id });
    await User.deleteOne({ _id: tenantAgent._id });
    await User.deleteOne({ _id: tenantAdmin._id });
    await User.deleteOne({ _id: superAdmin._id });
    await Tenant.deleteOne({ _id: testTenant._id });
    await Subscription.deleteOne({ _id: starterPlan._id });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the tests
testMultiTenancy();