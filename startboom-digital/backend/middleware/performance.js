import { logWarning } from '../utils/logger.js';

// Track slow API requests
export const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests (> 1000ms)
    if (duration > 1000) {
      logWarning('Slow API Request', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        userId: req.user?.userId,
        tenantId: req.user?.tenantId,
      });
    }

    // Track in headers for client-side monitoring
    res.set('X-Response-Time', `${duration}ms`);
  });

  next();
};

// Memory leak detection
let lastMemoryCheck = process.memoryUsage().heapUsed;
let memoryIncreaseCount = 0;

export const memoryMonitor = () => {
  setInterval(() => {
    const currentMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = currentMemory - lastMemoryCheck;
    const percentIncrease = (memoryIncrease / lastMemoryCheck) * 100;

    // Alert if memory increases by more than 10% consistently
    if (percentIncrease > 10) {
      memoryIncreaseCount++;
      
      if (memoryIncreaseCount > 5) {
        logWarning('Potential Memory Leak Detected', {
          currentMemory: `${Math.round(currentMemory / 1024 / 1024)} MB`,
          lastMemory: `${Math.round(lastMemoryCheck / 1024 / 1024)} MB`,
          increase: `${percentIncrease.toFixed(2)}%`,
          consecutiveIncreases: memoryIncreaseCount,
        });
        memoryIncreaseCount = 0; // Reset after alert
      }
    } else {
      memoryIncreaseCount = 0;
    }

    lastMemoryCheck = currentMemory;
  }, 60000); // Check every minute
};

// Request rate tracking (per tenant)
const requestCounts = new Map();

export const requestRateMonitor = (req, res, next) => {
  const tenantId = req.user?.tenantId || 'anonymous';
  const minute = Math.floor(Date.now() / 60000);
  const key = `${tenantId}-${minute}`;

  const count = requestCounts.get(key) || 0;
  requestCounts.set(key, count + 1);

  // Alert if tenant makes more than 1000 requests per minute
  if (count > 1000) {
    logWarning('High Request Rate from Tenant', {
      tenantId,
      requestCount: count,
      minute: new Date(minute * 60000).toISOString(),
    });
  }

  // Clean up old entries (older than 5 minutes)
  const fiveMinutesAgo = Math.floor(Date.now() / 60000) - 5;
  for (const [k] of requestCounts) {
    const [, keyMinute] = k.split('-');
    if (parseInt(keyMinute) < fiveMinutesAgo) {
      requestCounts.delete(k);
    }
  }

  next();
};

// Database query performance tracking
export class QueryTimer {
  constructor(queryName) {
    this.queryName = queryName;
    this.startTime = Date.now();
  }

  end() {
    const duration = Date.now() - this.startTime;
    
    if (duration > 500) {
      logWarning('Slow Database Query', {
        query: this.queryName,
        duration: `${duration}ms`,
      });
    }
    
    return duration;
  }
}
