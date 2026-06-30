import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import SecurityBlock from '../models/SecurityBlock.js';
import { sendEmail, generateOTP } from '../services/emailService.js';
import { forgotPasswordLimiter, authLimiter, loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Login with OTP support
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.ip ||
      '';
    const userAgent = req.headers['user-agent'] || '';
    const browser = userAgent.includes('Chrome') && !userAgent.includes('Edg') ? 'Chrome' :
      userAgent.includes('Firefox') ? 'Firefox' :
      userAgent.includes('Safari') && !userAgent.includes('Chrome') ? 'Safari' :
      userAgent.includes('Edg') ? 'Edge' :
      userAgent ? 'Other' : 'Unknown';
    const device = userAgent.includes('Mobile') || userAgent.includes('Android') ? 'Mobile' :
      userAgent.includes('Tablet') || userAgent.includes('iPad') ? 'Tablet' :
      userAgent ? 'Desktop' : 'Unknown';

    // Validate input
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists and populate tenant
    const user = await User.findOne({ email: normalizedEmail }).populate('tenant');
    if (!user) {
      try {
        const fallbackUser = await User.findOne({ role: 'superadmin' });
        if (fallbackUser) {
          await AuditLog.create({
            action: 'LOGIN',
            description: `Failed login attempt for ${email}`,
            user: fallbackUser._id,
            userName: 'Unknown user',
            userEmail: email || '',
            userRole: 'unknown',
            tenant: null,
            ipAddress,
            status: 'failed',
            metadata: { browser, device, userAgent, reason: 'unknown_user' }
          });
        }
      } catch (err) {}
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Prevent deactivated users from logging in
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account has been deactivated. Please contact your administrator.' });
    }

    const activeBlock = await SecurityBlock.findOne({
      isActive: true,
      $or: [
        { type: 'ip', value: ipAddress, tenant: user.tenant?._id || null },
        { type: 'ip', value: ipAddress, tenant: null },
        { type: 'device', value: userAgent, tenant: user.tenant?._id || null },
        { type: 'device', value: userAgent, tenant: null }
      ]
    });

    if (activeBlock) {
      return res.status(403).json({ message: 'Login blocked by security policy.' });
    }

    // Check password/OTP
    let isMatch = false;
    const hasStoredPassword = typeof user.password === 'string' && user.password.length > 0;

    console.log(`🔐 Login attempt for ${normalizedEmail}:`, {
      isFirstLogin: user.isFirstLogin,
      hasOTP: !!user.otp,
      hasPassword: hasStoredPassword,
      otpExpired: user.otpExpires ? (new Date() > user.otpExpires) : null
    });

    // For first login, check against OTP field (may be hashed)
    if (user.isFirstLogin && user.otp) {
      // OTP may be hashed - try bcrypt first, then plain text
      try {
        isMatch = await bcrypt.compare(password, user.otp);
        if (isMatch) console.log('✅ OTP matched (from otp field)');
      } catch (e) {
        console.log('❌ Error comparing OTP:', e.message);
      }
      // Fallback: plain text comparison for direct OTP storage
      if (!isMatch && password === user.otp) {
        isMatch = true;
        console.log('✅ OTP matched (plain text)');
      }
      // Also check password field for hashed OTP
      if (!isMatch && hasStoredPassword) {
        try {
          isMatch = await bcrypt.compare(password, user.password);
          if (isMatch) console.log('✅ OTP matched (from password field)');
        } catch (e) {
          console.log('❌ Error comparing password:', e.message);
        }
      }
    } else if (hasStoredPassword) {
      // For subsequent logins, use bcrypt comparison
      isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) console.log('✅ Password matched');
      else console.log('❌ Password did not match');
    } else {
      // If the user has no stored password and is not using OTP, reject safely
      try {
        await AuditLog.create({
          action: 'LOGIN',
          description: `Failed login attempt for ${user.email}: missing password`,
          user: user._id,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          tenant: user.tenant || null,
          ipAddress,
          status: 'failed',
          metadata: { browser, device, userAgent, reason: 'missing_password' }
        });
      } catch (err) {}

      return res.status(400).json({
        message: 'Invalid email or password. This account must be initialized by an administrator before use.'
      });
    }
    
    if (!isMatch) {
      try {
        await AuditLog.create({
          action: 'LOGIN',
          description: `Failed login attempt for ${user.email}`,
          user: user._id,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          tenant: user.tenant || null,
          ipAddress,
          status: 'failed',
          metadata: { browser, device, userAgent, reason: 'bad_password' }
        });
      } catch (err) {}
      return res.status(400).json({
        message: user.isFirstLogin
          ? 'Invalid credentials. For first login, please use the OTP sent to your email or reset your password.'
          : 'Invalid email or password'
      });
    }

    // Check if OTP has expired (for first login)
    if (user.isFirstLogin && user.otpExpires && new Date() > user.otpExpires) {
      return res.status(400).json({
        message: 'OTP has expired. Please request a new one from your administrator.'
      });
    }

    // Create token with tenant context
    const tokenPayload = {
      userId: user._id,
      role: user.role
    };
    
    // Add tenant ID to token for regular users
    if (user.tenant) {
      tokenPayload.tenantId = user.tenant._id;
    }
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // Mark user as online
    try {
      user.status = 'online';
      await user.save();
    } catch (err) {
      // Silent fail - status update is not critical
    }

    // Log the login action
    try {
      await AuditLog.create({
        action: 'LOGIN',
        description: `${user.name} logged in`,
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        tenant: user.tenant || null,
        ipAddress,
        status: 'success'
        ,
        metadata: { browser, device, userAgent }
      });
    } catch (err) {}

    // Return user data without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      nin: user.nin || null,
      tenant: user.tenant ? {
        id: user.tenant._id,
        name: user.tenant.name,
        slug: user.tenant.slug
      } : null,
      isFirstLogin: user.isFirstLogin,
      isActive: user.isActive,
      status: user.status,
      profileImage: user.profileImage || null,
      performanceScore: user.performanceScore,
      totalDeals: user.totalDeals,
      successfulDeals: user.successfulDeals,
      failedDeals: user.failedDeals,
      createdAt: user.createdAt
    };

    res.json({
      token,
      user: userResponse,
      requiresPasswordChange: user.isFirstLogin
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password (for first login and regular password changes)
router.post('/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const passwordComplexity = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
    if (!passwordComplexity.test(newPassword)) {
      return res.status(400).json({ message: 'Password must include uppercase, lowercase, number, and special character' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    let user = null;

    // Prefer authenticated user when token is present.
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        user = await User.findById(decoded.userId);
      } catch (tokenError) {
        // Fall back to email lookup for backward compatibility.
      }
    }

    if (!user && normalizedEmail) {
      user = await User.findOne({ email: normalizedEmail });
    }

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (normalizedEmail && user.email !== normalizedEmail) {
      return res.status(403).json({ message: 'You can only change your own password' });
    }

    const wasFirstLogin = user.isFirstLogin;

    // For first login, verify the OTP
    if (wasFirstLogin) {
      const isOTPMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isOTPMatch) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      // Check if OTP expired
      if (user.otpExpires && new Date() > user.otpExpires) {
        return res.status(400).json({
          message: 'OTP has expired. Please request a new one from your administrator.'
        });
      }
    } else {
      // For regular password change, verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    }

    // Update password and clear OTP fields
    user.password = newPassword;
    user.isFirstLogin = false;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    res.json({
      message: wasFirstLogin ? 'Password set successfully' : 'Password changed successfully',
      requiresPasswordChange: false
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('-password -otp');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account has been deactivated' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Logout: mark user offline (optional)
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(200).json({ message: 'Logged out' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId);
    if (user) {
      user.status = 'offline';
      await user.save();
    }

    res.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(200).json({ message: 'Logged out' });
  }
});

// Forgot Password - Initiate reset process
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    // Find user - SILENT FAILURE if not found to prevent enumeration
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Fake delay to thwart timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
    }

    // Generate and save OTP
    const otp = generateOTP();
    user.otp = otp; // Will be hashed implies we should hash it? 
    // Wait, the User model stores otp as String. 
    // Ideally we should hash it, but the existing code "user.otp = null" suggests basic storage.
    // For now, let's store it as is since email is the transport. 
    // NOTE: Production best practice is to hash OTPs in DB. 
    // Given the prompt "secure ... production-ready", I should PROBABLY hash it.
    // But the `User` model shows `otp` field usage in `change-password` (step 190 line 94) uses `bcrypt.compare(currentPassword, user.password)`.
    // Wait, line 94 `bcrypt.compare` is verifying `currentPassword` against `user.password` for first login.
    // Line 31 checks `user.otpExpires`.
    // The current `User.js` schema does NOT hash `otp` automatically. 
    // Let's stick to storing it, but for "production-ready" I'll hash it if I can easily verify it.
    // Actually, `User` model defines `otp` as String.
    // Let's store plain OTP for simplicity consistent with `User` model for now, or hash it manually.
    // If I hash it, I need `bcrypt.hash`.

    // DECISION: Store hashed OTP for security.
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    user.otp = hashedOtp;
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    // Send email with PLAIN OTP
    await sendEmail(email, 'passwordReset', {
      name: user.name,
      otp: otp
    });

    res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP - Step 1 of Reset Password
router.post('/verify-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Check expiry
    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    res.json({ message: 'Code verified successfully' });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Password - Verify OTP and set new password
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Check expiry
    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Set new password (will be hashed by User model pre-save hook)
    user.password = newPassword;

    // Clear OTP fields
    user.otp = null;
    user.otpExpires = null;

    // Mark as not first login
    user.isFirstLogin = false;

    await user.save();

    // Optional: Revoke tokens? JWTs are stateless, can't revoke without blacklist. 
    // We can increment a `tokenVersion` on user if we had one.
    // For now, logging them out by state (optional).

    res.json({ message: 'Password reset successfully. You can now login.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DEBUG: Reset admin password (Development only - remove in production)
router.post('/reset-admin', async (req, res) => {
  try {
    // Find admin user
    const admin = await User.findOne({ role: 'admin' });

    if (!admin) {
      // Create admin if doesn't exist
      const newAdmin = new User({
        name: 'System Administrator',
        email: 'xtreative@crm.com',
        password: 'admin123',
        role: 'admin',
        isFirstLogin: false,
        isActive: true
      });
      await newAdmin.save();
      return res.json({
        message: 'Admin created successfully',
        email: 'xtreative@crm.com',
        password: 'admin123'
      });
    }

    // Reset admin password to 'admin123'
    admin.password = 'admin123';
    admin.isFirstLogin = false;
    admin.isActive = true;
    admin.otp = null;
    admin.otpExpires = null;
    await admin.save();

    res.json({
      message: 'Admin password reset successfully',
      email: admin.email,
      password: 'admin123',
      note: 'Please change this password after login'
    });
  } catch (error) {
    console.error('Reset admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as authRoutes };
