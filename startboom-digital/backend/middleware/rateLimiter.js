import rateLimit from 'express-rate-limit';

const parseLimit = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseLimit(process.env.LOGIN_RATE_LIMIT_MAX, 600),
    message: {
        message: 'Too many login attempts from this network, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    validate: { trustProxy: false }
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseLimit(process.env.AUTH_RATE_LIMIT_MAX, 200),
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    validate: { trustProxy: false }
});

export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 forgot password requests per hour
    message: {
        message: 'Too many password reset requests, please try again after an hour'
    },
    validate: { trustProxy: false }
});
