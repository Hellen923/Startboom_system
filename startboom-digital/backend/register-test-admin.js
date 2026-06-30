import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models and services
import User from './models/User.js';
import Tenant from './models/Tenant.js';
import { sendEmail, generateOTP } from './services/emailService.js';

async function registerTestAdmin() {
    try {
        console.log('👤 Registering Test Admin User...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB\n');

        const email = 'htkiwagama@student.refactory.academy';
        const name = 'Hellen Test Admin';

        // Get the default tenant
        const defaultTenant = await Tenant.findOne({ slug: 'default-company' });
        if (!defaultTenant) {
            console.log('❌ Default tenant not found. Please run fix-existing-data.js first.');
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('⚠️ User already exists. Generating new OTP and sending email...');
            
            // Generate new OTP
            const otp = generateOTP();
            const hashedPassword = await bcrypt.hash(otp, 10);
            
            // Update existing user
            existingUser.password = hashedPassword;
            existingUser.otp = otp;
            existingUser.otpExpires = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
            existingUser.isFirstLogin = true;
            
            await existingUser.save();
            
            console.log('✅ Updated existing user with new OTP');
            console.log(`🔑 New OTP: ${otp}`);
            
        } else {
            console.log('👤 Creating new admin user...');
            
            // Generate OTP for initial login
            const otp = generateOTP();
            const hashedPassword = await bcrypt.hash(otp, 10);
            
            // Create new admin user
            const newAdmin = new User({
                name,
                email,
                password: hashedPassword,
                role: 'admin',
                tenant: defaultTenant._id,
                otp: otp,
                otpExpires: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
                isFirstLogin: true,
                isActive: true,
                phone: '+256700000000', // Default phone
                status: 'online'
            });
            
            await newAdmin.save();
            
            console.log('✅ Admin user created successfully!');
            console.log(`📧 Email: ${email}`);
            console.log(`👤 Name: ${name}`);
            console.log(`👑 Role: admin`);
            console.log(`🔑 OTP: ${otp}`);
            
            // Update tenant usage
            await Tenant.findByIdAndUpdate(defaultTenant._id, {
                $inc: { 'usage.totalUsers': 1 }
            });
        }

        // Get the OTP for email sending
        const currentUser = await User.findOne({ email });
        const otpToSend = currentUser.otp;

        // Send welcome email
        console.log('\n📨 Sending welcome email...');
        const emailResult = await sendEmail(
            email,
            'agentWelcome',
            { 
                name, 
                email, 
                otp: otpToSend
            }
        );
        
        if (emailResult.success) {
            console.log('✅ Welcome email sent successfully!');
            console.log('📬 Check your inbox at:', email);
            if (emailResult.previewUrl) {
                console.log('🔗 Preview URL:', emailResult.previewUrl);
            }
        } else {
            console.log('❌ Failed to send welcome email:', emailResult.error);
            console.log('🔑 Manual OTP for login:', otpToSend);
        }

        console.log('\n🎉 Test admin registration completed!');
        console.log('\n🔑 LOGIN INSTRUCTIONS:');
        console.log('1. Go to http://localhost:3000/login');
        console.log(`2. Email: ${email}`);
        console.log('3. Password: Use the OTP from the email');
        console.log('4. You will be prompted to create a new password after first login');

    } catch (error) {
        console.error('❌ Failed to register test admin:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the script
registerTestAdmin();