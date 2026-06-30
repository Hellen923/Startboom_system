// routes/otp.js
import express from 'express';
import crypto from 'crypto';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Generate and send OTP
router.post('/send', tenantAuth, async (req, res) => {
  try {
    const { email, purpose = 'settings_change' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + (10 * 60 * 1000);

    const key = `${req.user.userId}_${purpose}`;
    otpStore.set(key, { otp, email, expiresAt, attempts: 0 });

    await sendEmail(email, 'passwordReset', { name: req.user.name || email, otp });

    cleanupExpiredOTPs();

    res.json({ message: 'OTP sent successfully', expiresIn: 600 });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

// Verify OTP
router.post('/verify', tenantAuth, async (req, res) => {
  try {
    const { otp, purpose = 'settings_change' } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const key = `${req.user.userId}_${purpose}`;
    const storedOTP = otpStore.get(key);

    if (!storedOTP) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (storedOTP.attempts >= 3) {
      otpStore.delete(key);
      return res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (storedOTP.otp !== otp) {
      storedOTP.attempts++;
      otpStore.set(key, storedOTP);
      return res.status(400).json({
        message: 'Invalid OTP',
        attemptsLeft: 3 - storedOTP.attempts
      });
    }

    // OTP is valid
    otpStore.delete(key);

    res.json({
      message: 'OTP verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
});

// Clean up expired OTPs
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
    }
  }
};

// Clean up expired OTPs every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

export { router as otpRoutes };









