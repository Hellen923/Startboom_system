import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory
const logsDir = path.join(__dirname, '../logs');

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Transport for all logs (daily rotate)
const allLogsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d', // Keep logs for 14 days
  format: logFormat,
});

// Transport for error logs only
const errorLogsTransport = new DailyRotateFile({
  level: 'error',
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d', // Keep error logs longer
  format: logFormat,
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    allLogsTransport,
    errorLogsTransport,
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Handle uncaught exceptions
logger.exceptions.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'exceptions-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
  })
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'rejections-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
  })
);

// Helper methods for structured logging
export const logInfo = (message, metadata = {}) => {
  logger.info(message, metadata);
};

export const logError = (message, error = null, metadata = {}) => {
  if (error) {
    logger.error(message, {
      error: {
        message: error.message,
        stack: error.stack,
        ...error,
      },
      ...metadata,
    });
  } else {
    logger.error(message, metadata);
  }
};

export const logWarning = (message, metadata = {}) => {
  logger.warn(message, metadata);
};

export const logDebug = (message, metadata = {}) => {
  logger.debug(message, metadata);
};

// Middleware for Express to log all requests
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.userId,
      tenantId: req.user?.tenantId,
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request Failed', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// Middleware for error logging
export const errorLogger = (err, req, res, next) => {
  logError('Express Error Handler', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.userId,
    tenantId: req.user?.tenantId,
    body: req.body,
  });

  next(err);
};

export default logger;
