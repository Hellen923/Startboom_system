import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
dotenv.config();

import User from './models/User.js';
import Tenant from './models/Tenant.js';
import Subscription from './models/Subscription.js';
import Client from './models/Client.js';
import Deal from './models/Deal.js';
import Sale from './models/Sale.js';
import Schedule from './models/Schedule.js';
import Meeting from './models/Meeting.js';
import Stock from './models/Stock.js';

async function fixExistingData() {
    try {
        console.log('🔧 Fixing existing data for multi-tenancy...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Create a default subscription if none exists
        console.log('📋 Step 1: Creating default subscription...');
        let defaultSubscription = await Subscription.findOne({ planName: 'starter' });
        
        if (!defaultSubscription) {
            defaultSubscription = new Subscription({
                planName: 'starter',
                planDisplayName: 'Starter Plan',
                pricing: {
                    amount: 0,
                    currency: 'USD',
                    interval: 'monthly'
                },
                features: {
                    maxUsers: 5,
                    maxClients: 100,
                    maxDeals: 50,
                    maxStorage: 1000,
                    advancedReports: false,
                    apiAccess: false,
                    customBranding: false
                },
                status: 'active'
            });
            await defaultSubscription.save();
            console.log('✅ Created default subscription');
        } else {
            console.log('✅ Default subscription already exists');
        }

        // Step 2: Create a default tenant if none exists
        console.log('\n🏢 Step 2: Creating default tenant...');
        let defaultTenant = await Tenant.findOne({ slug: 'default-company' });
        
        if (!defaultTenant) {
            defaultTenant = new Tenant({
                name: 'Default Company',
                email: 'admin@defaultcompany.com',
                subscription: defaultSubscription._id,
                settings: {
                    primaryColor: '#f97316',
                    secondaryColor: '#1f2937',
                    timezone: 'UTC',
                    currency: 'USD',
                    language: 'en',
                    dateFormat: 'MM/DD/YYYY'
                },
                usage: {
                    totalUsers: 0,
                    totalClients: 0,
                    totalDeals: 0,
                    storageUsed: 0
                },
                status: 'active'
            });
            await defaultTenant.save();
            console.log('✅ Created default tenant');
        } else {
            console.log('✅ Default tenant already exists');
        }

        // Step 3: Update existing users without tenant assignments
        console.log('\n👤 Step 3: Updating existing users...');
        const usersWithoutTenant = await User.find({ 
            $or: [
                { tenant: { $exists: false } },
                { tenant: null }
            ]
        });

        console.log(`Found ${usersWithoutTenant.length} users without tenant assignments`);

        for (const user of usersWithoutTenant) {
            user.tenant = defaultTenant._id;
            await user.save();
            console.log(`✅ Updated user: ${user.email}`);
        }

        // Step 4: Update tenant usage count
        console.log('\n📊 Step 4: Updating tenant usage...');
        const totalUsers = await User.countDocuments({ tenant: defaultTenant._id });
        await Tenant.findByIdAndUpdate(defaultTenant._id, {
            'usage.totalUsers': totalUsers
        });
        console.log(`✅ Updated tenant usage - Users: ${totalUsers}`);

        // Step 5: Update existing clients without tenant assignments
        console.log('\n👥 Step 5: Updating existing clients...');
        const clientsWithoutTenant = await Client.find({ 
            $or: [
                { tenant: { $exists: false } },
                { tenant: null }
            ]
        });

        console.log(`Found ${clientsWithoutTenant.length} clients without tenant assignments`);

        for (const client of clientsWithoutTenant) {
            client.tenant = defaultTenant._id;
            await client.save();
            console.log(`✅ Updated client: ${client.email}`);
        }

        // Update client usage count
        const totalClients = await Client.countDocuments({ tenant: defaultTenant._id });
        await Tenant.findByIdAndUpdate(defaultTenant._id, {
            'usage.totalClients': totalClients
        });
        console.log(`✅ Updated tenant usage - Clients: ${totalClients}`);

        // Step 6: Update existing deals without tenant assignments
        console.log('\n💼 Step 6: Updating existing deals...');
        const dealsWithoutTenant = await Deal.find({ 
            $or: [
                { tenant: { $exists: false } },
                { tenant: null }
            ]
        });

        console.log(`Found ${dealsWithoutTenant.length} deals without tenant assignments`);

        for (const deal of dealsWithoutTenant) {
            deal.tenant = defaultTenant._id;
            await deal.save();
            console.log(`✅ Updated deal: ${deal.title}`);
        }

        // Update deals usage count
        const totalDeals = await Deal.countDocuments({ tenant: defaultTenant._id });
        await Tenant.findByIdAndUpdate(defaultTenant._id, {
            'usage.totalDeals': totalDeals
        });
        console.log(`✅ Updated tenant usage - Deals: ${totalDeals}`);

        // Step 7: Update existing sales without tenant assignments
        console.log('\n💰 Step 7: Updating existing sales...');
        const salesWithoutTenant = await Sale.find({ 
            $or: [
                { tenant: { $exists: false } },
                { tenant: null }
            ]
        });

        console.log(`Found ${salesWithoutTenant.length} sales without tenant assignments`);

        for (const sale of salesWithoutTenant) {
            sale.tenant = defaultTenant._id;
            await sale.save();
            console.log(`✅ Updated sale: ${sale.customerName}`);
        }

        // Step 8: Create a test admin user if needed
        console.log('\n🔑 Step 8: Creating test admin user...');
        const testAdmin = await User.findOne({ email: 'admin@test.com' });
        
        if (!testAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const newAdmin = new User({
                name: 'Test Admin',
                email: 'admin@test.com',
                password: hashedPassword,
                role: 'admin',
                tenant: defaultTenant._id,
                isActive: true,
                isFirstLogin: false
            });
            await newAdmin.save();
            console.log('✅ Created test admin user: admin@test.com / admin123');
        } else {
            // Update existing test admin to have tenant
            if (!testAdmin.tenant) {
                testAdmin.tenant = defaultTenant._id;
                await testAdmin.save();
            }
            console.log('✅ Test admin user already exists and updated');
        }

        console.log('\n🎉 Data migration completed successfully!');
        console.log('\n🔑 LOGIN CREDENTIALS:');
        console.log('Email: admin@test.com');
        console.log('Password: admin123');
        console.log(`Tenant: ${defaultTenant.name} (${defaultTenant._id})`);

        // Step 9: Update existing schedules without tenant
        console.log('\n📅 Step 9: Updating existing schedules...');
        const schedulesWithoutTenant = await Schedule.find({ $or: [{ tenant: { $exists: false } }, { tenant: null }] });
        console.log(`Found ${schedulesWithoutTenant.length} schedules without tenant`);
        for (const s of schedulesWithoutTenant) {
            s.tenant = defaultTenant._id;
            await s.save();
            console.log(`✅ Updated schedule: ${s.title}`);
        }

        // Step 10: Update existing meetings without tenant
        console.log('\n🤝 Step 10: Updating existing meetings...');
        const meetingsWithoutTenant = await Meeting.find({ $or: [{ tenant: { $exists: false } }, { tenant: null }] });
        console.log(`Found ${meetingsWithoutTenant.length} meetings without tenant`);
        for (const m of meetingsWithoutTenant) {
            m.tenant = defaultTenant._id;
            await m.save();
            console.log(`✅ Updated meeting: ${m.title}`);
        }

        // Step 11: Update existing stock without tenant
        console.log('\n📦 Step 11: Updating existing stock items...');
        const stockWithoutTenant = await Stock.find({ $or: [{ tenant: { $exists: false } }, { tenant: null }] });
        console.log(`Found ${stockWithoutTenant.length} stock items without tenant`);
        for (const item of stockWithoutTenant) {
            item.tenant = defaultTenant._id;
            await item.save();
            console.log(`✅ Updated stock: ${item.itemName}`);
        }

        console.log('\n🎉 Full data migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the migration
fixExistingData();