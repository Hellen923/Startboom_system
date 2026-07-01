import { logError } from '../utils/logger.js';

// Custom error class for operational errors
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logError('Global Error Handler', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.userId,
    tenantId: req.user?.tenantId,
  });

  // Development mode - send full error
  if (process.env.NODE_ENV !== 'production') {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  // Production mode - send clean error message
  if (err.isOperational) {
    // Operational, trusted error: send message to client
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming or unknown error: don't leak error details
  console.error('UNEXPECTED ERROR 💥', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server',
  });
};

// Handle 404 errors
export const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(err);
};

// Async error wrapper to catch async errors
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Mongoose validation error handler
export const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Mongoose duplicate key error handler
export const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} = "${value}". Please use another value.`;
  return new AppError(message, 400);
};

// Mongoose cast error handler (invalid ID)
export const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// JWT error handlers
export const handleJWTError = () => 
  new AppError('Invalid token. Please log in again.', 401);

export const handleJWTExpiredError = () => 
  new AppError('Your token has expired. Please log in again.', 401);

// Standardized error responses
export const sendErrorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  };
  
  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
