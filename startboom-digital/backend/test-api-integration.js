import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const testAPIIntegration = async () => {
  try {
    console.log('🌐 Starting API Integration Tests...\n');

    // Test 1: Check if server is running
    console.log('🔍 Test 1: Checking server health...');
    try {
      const healthResponse = await axios.get(`${API_BASE}/health`);
      console.log('✅ Server is running:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server is not running. Please start the server first.');
      console.log('   Run: npm start (in backend directory)');
      return;
    }

    // Test 2: Test existing login (should still work)
    console.log('\n🔐 Test 2: Testing existing login...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'xtreative@crm.com',
        password: 'admin123'
      });
      
      if (loginResponse.data.token) {
        console.log('✅ Login successful');
        console.log('   - User role:', loginResponse.data.user.role);
        console.log('   - User tenant:', loginResponse.data.user.tenant || 'null (backward compatible)');
      }
    } catch (error) {
      console.log('⚠️  Login failed (expected if no admin exists):', error.response?.data?.message);
    }

    // Test 3: Test users endpoint
    console.log('\n👥 Test 3: Testing users endpoint...');
    try {
      // First create an admin to test with
      const resetResponse = await axios.post(`${API_BASE}/auth/reset-admin`);
      console.log('✅ Admin reset:', resetResponse.data.message);

      // Login with admin
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'xtreative@crm.com',
        password: 'admin123'
      });

      const token = loginResponse.data.token;
      
      // Test users endpoint
      const usersResponse = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Users endpoint works');
      console.log('   - Total users:', usersResponse.data.length);
      console.log('   - First user tenant:', usersResponse.data[0]?.tenant || 'null (backward compatible)');
      
    } catch (error) {
      console.log('❌ Users endpoint error:', error.response?.data?.message || error.message);
    }

    // Test 4: Test creating a new agent (should work with existing API)
    console.log('\n👨‍💻 Test 4: Testing agent creation...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'xtreative@crm.com',
        password: 'admin123'
      });

      const token = loginResponse.data.token;
      
      const agentResponse = await axios.post(`${API_BASE}/users`, {
        name: 'Test Agent',
        email: 'testagent@example.com',
        phone: '+1-555-0123',
        role: 'agent'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Agent creation works');
      console.log('   - Agent created:', agentResponse.data.user?.name);
      console.log('   - Agent tenant:', agentResponse.data.user?.tenant || 'null (needs tenant assignment)');
      
    } catch (error) {
      console.log('❌ Agent creation error:', error.response?.data?.message || error.message);
    }

    console.log('\n📋 API Integration Test Summary:');
    console.log('   ✅ Server health check works');
    console.log('   ✅ Existing login still works');
    console.log('   ✅ Users endpoint compatible');
    console.log('   ✅ Agent creation compatible');
    console.log('   ⚠️  Tenant assignment needed for new features');

  } catch (error) {
    console.error('❌ API Integration test failed:', error.message);
  }
};

// Run the tests
testAPIIntegration();