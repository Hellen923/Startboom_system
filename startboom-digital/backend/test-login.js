import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import User from './models/User.js';
import Tenant from './models/Tenant.js';

async function testLogin() {
    try {
        console.log('🔍 Testing Login Issue...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB\n');

        const email = 'htkiwagama@student.refactory.academy';
        const otp = '878310'; // The OTP we generated

        // Find the user
        const user = await User.findOne({ email }).populate('tenant');
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('👤 User found:');
        console.log(`- Email: ${user.email}`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Role: ${user.role}`);
        console.log(`- IsActive: ${user.isActive}`);
        console.log(`- IsFirstLogin: ${user.isFirstLogin}`);
        console.log(`- OTP Expires: ${user.otpExpires}`);
        console.log(`- Tenant: ${user.tenant ? user.tenant.name : 'None'}`);

        // Test password comparison
        console.log('\n🔐 Testing password comparison...');
        const isMatch = await bcrypt.compare(otp, user.password);
        console.log(`- OTP Match: ${isMatch}`);

        // Check if OTP expired
        if (user.otpExpires) {
            const now = new Date();
            const expired = now > user.otpExpires;
            console.log(`- Current time: ${now}`);
            console.log(`- OTP expires: ${user.otpExpires}`);
            console.log(`- Is expired: ${expired}`);
        }

        // Test what the login endpoint would do
        console.log('\n🧪 Simulating login process...');
        
        if (!user.isActive) {
            console.log('❌ Account is deactivated');
            return;
        }

        if (!isMatch) {
            console.log('❌ Password/OTP does not match');
            return;
        }

        if (user.isFirstLogin && user.otpExpires && new Date() > user.otpExpires) {
            console.log('❌ OTP has expired');
            return;
        }

        console.log('✅ Login should succeed!');
        console.log('\n📋 Expected login response data:');
        console.log({
            userId: user._id,
            role: user.role,
            tenantId: user.tenant ? user.tenant._id : null,
            email: user.email,
            name: user.name,
            isFirstLogin: user.isFirstLogin
        });

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the test
testLogin();