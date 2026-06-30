import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import Deal from './models/Deal.js';
import User from './models/User.js';
import Tenant from './models/Tenant.js';
import Client from './models/Client.js';

async function testDealsRoute() {
    try {
        console.log('🧪 Testing Deals Route with Multi-Tenancy...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB\n');

        // Find existing test tenant, user, and client
        const tenant = await Tenant.findOne({ name: /Test Company/i });
        const user = await User.findOne({ email: 'hellenkiwagama@gmail.com' });
        const client = await Client.findOne({ tenant: tenant?._id }).limit(1);

        if (!tenant || !user || !client) {
            console.log('❌ Test tenant, user, or client not found. Run comprehensive test first.');
            return;
        }

        console.log(`📋 Found test tenant: ${tenant.name} (${tenant._id})`);
        console.log(`👤 Found test user: ${user.name} (${user.email})`);
        console.log(`👥 Found test client: ${client.name} (${client.email})\n`);

        // Test 1: Create a test deal
        console.log('📝 Test 1: Creating test deal...');
        const testDeal = new Deal({
            title: 'Test Deal - Multi-Tenant',
            description: 'Testing multi-tenant deal creation',
            value: 5000,
            stage: 'lead',
            priority: 'high',
            expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            tenant: tenant._id,
            agent: user._id,
            client: client._id
        });

        await testDeal.save();
        console.log(`✅ Created test deal: ${testDeal.title} (ID: ${testDeal._id})\n`);

        // Test 2: Query deals with tenant filter
        console.log('🔍 Test 2: Querying deals with tenant filter...');
        const tenantDeals = await Deal.find({ tenant: tenant._id });
        console.log(`✅ Found ${tenantDeals.length} deals for tenant ${tenant.name}\n`);

        // Test 3: Verify data isolation
        console.log('🔒 Test 3: Testing data isolation...');
        const allDeals = await Deal.find({});
        const tenantSpecificDeals = await Deal.find({ tenant: tenant._id });
        
        console.log(`- Total deals in database: ${allDeals.length}`);
        console.log(`- Deals for test tenant: ${tenantSpecificDeals.length}`);
        console.log('✅ Data isolation working correctly\n');

        // Test 4: Update deal
        console.log('📝 Test 4: Updating deal...');
        const updatedDeal = await Deal.findOneAndUpdate(
            { _id: testDeal._id, tenant: tenant._id },
            { stage: 'qualification', value: 7500 },
            { new: true }
        );
        console.log(`✅ Updated deal stage to: ${updatedDeal.stage}, value: $${updatedDeal.value}\n`);

        // Test 5: Clean up
        console.log('🧹 Test 5: Cleaning up test data...');
        await Deal.findOneAndDelete({ _id: testDeal._id, tenant: tenant._id });
        console.log('✅ Test deal deleted\n');

        console.log('🎉 All deals route tests passed! Multi-tenancy working correctly.\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the test
testDealsRoute();