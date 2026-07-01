import rateLimit from 'express-rate-limit';

// General API rate limiter - 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth rate limiter - 5 login attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Login limiter - alias for authLimiter for backwards compatibility
export const loginLimiter = authLimiter;

// OTP rate limiter - 3 OTP requests per hour
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 OTP requests per hour
  message: { message: 'Too many OTP requests from this IP, please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset limiter - 3 attempts per hour
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { message: 'Too many password reset requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Forgot password limiter - alias for passwordResetLimiter
export const forgotPasswordLimiter = passwordResetLimiter;

// Sale creation limiter - 30 sales per minute (prevent spam)
export const saleCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 sales per minute should be enough
  message: { message: 'Too many sales being created, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload limiter - 10 uploads per minute
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'Too many file uploads, please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Export limiter - 5 exports per 5 minutes (heavy operations)
export const exportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: { message: 'Too many export requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Bulk operations limiter - 3 bulk operations per 10 minutes
export const bulkOperationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: { message: 'Too many bulk operations, please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});
