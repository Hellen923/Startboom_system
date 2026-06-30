import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models and services
import User from './models/User.js';
import Tenant from './models/Tenant.js';
import { sendEmail, generateOTP } from './services/emailService.js';

async function createSuperAdmin() {
    try {
        console.log('👑 Creating Super Admin User...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB\n');

        const email = 'htkiwagama@student.refactory.academy';
        const name = 'Hellen Kiwagama';

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('⚠️ User already exists. Updating to super admin...');
            
            const otp = generateOTP();
            
            existingUser.role = 'superadmin';
            existingUser.password = otp;
            existingUser.otp = otp;
            existingUser.otpExpires = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
            existingUser.isFirstLogin = true;
            existingUser.isActive = true;
            existingUser.tenant = null; // Super admin doesn't belong to specific tenant
            
            await existingUser.save();
            
            console.log('✅ Updated existing user to super admin');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 New OTP: ${otp}`);
            
            // Send welcome email
            console.log('\n📨 Sending welcome email...');
            const emailResult = await sendEmail(
                email,
                'agentWelcome',
                { 
                    name, 
                    email, 
                    otp
                }
            );
            
            if (emailResult.success) {
                console.log('✅ Welcome email sent successfully!');
            } else {
                console.log('❌ Failed to send welcome email:', emailResult.error);
                console.log('🔑 Manual OTP for login:', otp);
            }
            
        } else {
            console.log('👤 Creating new super admin user...');
            
            // Generate OTP for initial login
            const otp = generateOTP();
            
            // Create new super admin user (password will be hashed by pre-save hook)
            const superAdmin = new User({
                name,
                email,
                password: otp,
                role: 'superadmin',
                otp: otp,
                otpExpires: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
                isFirstLogin: true,
                isActive: true,
                tenant: null, // Super admin doesn't belong to specific tenant
                phone: '+256700000000', // Default phone
                status: 'online'
            });
            
            await superAdmin.save();
            
            console.log('✅ Super admin user created successfully!');
            console.log(`📧 Email: ${email}`);
            console.log(`👤 Name: ${name}`);
            console.log(`👑 Role: superadmin`);
            console.log(`🔑 OTP: ${otp}`);
            
            // Send welcome email
            console.log('\n📨 Sending welcome email...');
            const emailResult = await sendEmail(
                email,
                'agentWelcome',
                { 
                    name, 
                    email, 
                    otp
                }
            );
            
            if (emailResult.success) {
                console.log('✅ Welcome email sent successfully!');
                console.log('📬 Check your inbox at:', email);
            } else {
                console.log('❌ Failed to send welcome email:', emailResult.error);
                console.log('🔑 Manual OTP for login:', otp);
            }
        }

        // Show all tenants (super admin can see all)
        console.log('\n🏢 Available Tenants (Super Admin View):');
        const tenants = await Tenant.find({}).populate('subscription', 'planDisplayName');
        tenants.forEach((tenant, index) => {
            console.log(`${index + 1}. ${tenant.name} (${tenant.slug})`);
            console.log(`   📧 ${tenant.email}`);
            console.log(`   📋 Plan: ${tenant.subscription?.planDisplayName || 'No subscription'}`);
            console.log(`   👥 Users: ${tenant.usage?.totalUsers || 0}`);
            console.log(`   👤 Clients: ${tenant.usage?.totalClients || 0}`);
            console.log(`   💼 Deals: ${tenant.usage?.totalDeals || 0}`);
            console.log('');
        });

        console.log('🎉 Super Admin setup completed!');
        console.log('\n🔑 LOGIN INSTRUCTIONS:');
        console.log('1. Go to http://localhost:3000/login');
        console.log(`2. Email: ${email}`);
        console.log('3. Password: Use the OTP from the email (or the one shown above if email failed)');
        console.log('4. As super admin, you can access all tenants and create new ones');

    } catch (error) {
        console.error('❌ Failed to create super admin:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the script
createSuperAdmin();