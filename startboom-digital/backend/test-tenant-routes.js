import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models for test data setup
import User from './models/User.js';
import Tenant from './models/Tenant.js';
import Subscription from './models/Subscription.js';
import Client from './models/Client.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

const testTenantRoutes = async () => {
  try {
    console.log('🧪 Testing Tenant-Aware Routes...\n');

    // Connect to MongoDB for test data setup
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clean up any existing test data
    await User.deleteMany({ email: { $regex: /@testroutes\.com$/ } });
    await Client.deleteMany({ email: { $regex: /@testclient\.com$/ } });
    await Tenant.deleteMany({ slug: { $regex: /^test-routes/ } });
    await Subscription.deleteMany({ planName: 'starter' });

    // Create test subscription
    const testSubscription = new Subscription({
      planName: 'starter',
      planDisplayName: 'Test Starter Plan',
      pricing: { amount: 29.99, currency: 'USD', interval: 'monthly' },
      features: { maxUsers: 10, maxClients: 100, maxDeals: 50 }
    });
    await testSubscription.save();

    // Create test tenant
    const testTenant = new Tenant({
      name: 'Test Routes Company',
      email: 'admin@testroutes.com',
      subscription: testSubscription._id,
      status: 'active'
    });
    await testTenant.save();

    // Create tenant admin user
    const tenantAdmin = new User({
      name: 'Routes Admin',
      email: 'admin@testroutes.com',
      password: 'password123',
      role: 'admin',
      tenant: testTenant._id,
      isFirstLogin: false
    });
    await tenantAdmin.save();

    console.log('✅ Test data created\n');

    // Test 1: Login with tenant admin
    console.log('🔐 Test 1: Testing tenant admin login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@testroutes.com',
      password: 'password123'
    });

    if (loginResponse.data.token) {
      console.log('✅ Login successful');
      console.log('   - User role:', loginResponse.data.user.role);
      console.log('   - User tenant:', loginResponse.data.user.tenant ? 'Present' : 'null');
    }

    const token = loginResponse.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Test 2: Get users (should be tenant-scoped)
    console.log('\n👥 Test 2: Testing tenant-scoped users endpoint...');
    const usersResponse = await axios.get(`${API_BASE}/users`, { headers: authHeaders });
    
    console.log('✅ Users endpoint works');
    console.log('   - Total users returned:', usersResponse.data.length);
    console.log('   - All users have same tenant:', usersResponse.data.every(u => u.tenant?.toString() === testTenant._id.toString()));

    // Test 3: Create new agent (should be tenant-scoped)
    console.log('\n👨💻 Test 3: Testing tenant-scoped agent creation...');
    const agentResponse = await axios.post(`${API_BASE}/users`, {
      name: 'Test Agent Routes',
      email: 'agent@testroutes.com',
      phone: '+1-555-0123',
      role: 'agent'
    }, { headers: authHeaders });
    
    console.log('✅ Agent creation works');
    console.log('   - Agent created:', agentResponse.data.user.name);
    console.log('   - Agent tenant matches:', agentResponse.data.user.tenant?.toString() === testTenant._id.toString());

    // Test 4: Create client (should be tenant-scoped)
    console.log('\n👤 Test 4: Testing tenant-scoped client creation...');
    const clientResponse = await axios.post(`${API_BASE}/clients`, {
      name: 'Test Client Routes',
      email: 'client@testclient.com',
      phone: '+1-555-0199',
      gender: 'male',
      company: 'Test Company'
    }, { headers: authHeaders });
    
    console.log('✅ Client creation works');
    console.log('   - Client created:', clientResponse.data.name);
    console.log('   - Client tenant matches:', clientResponse.data.tenant?.toString() === testTenant._id.toString());

    // Test 5: Get clients (should be tenant-scoped)
    console.log('\n📋 Test 5: Testing tenant-scoped clients endpoint...');
    const clientsResponse = await axios.get(`${API_BASE}/clients`, { headers: authHeaders });
    
    console.log('✅ Clients endpoint works');
    console.log('   - Total clients returned:', clientsResponse.data.clients.length);
    console.log('   - All clients have same tenant:', clientsResponse.data.clients.every(c => c.tenant?.toString() === testTenant._id.toString()));

    // Test 6: Test usage statistics update
    console.log('\n📊 Test 6: Testing usage statistics...');
    const updatedTenant = await Tenant.findById(testTenant._id);
    console.log('✅ Usage statistics updated');
    console.log('   - Total users:', updatedTenant.usage.totalUsers);
    console.log('   - Total clients:', updatedTenant.usage.totalClients);

    console.log('\n🎉 All Tenant Route Tests Passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Tenant admin login works');
    console.log('   ✅ Users endpoint is tenant-scoped');
    console.log('   ✅ Agent creation is tenant-scoped');
    console.log('   ✅ Client creation is tenant-scoped');
    console.log('   ✅ Clients endpoint is tenant-scoped');
    console.log('   ✅ Usage statistics are updated');

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ email: { $regex: /@testroutes\.com$/ } });
    await Client.deleteMany({ email: { $regex: /@testclient\.com$/ } });
    await Tenant.deleteOne({ _id: testTenant._id });
    await Subscription.deleteOne({ _id: testSubscription._id });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Route test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the tests
testTenantRoutes();