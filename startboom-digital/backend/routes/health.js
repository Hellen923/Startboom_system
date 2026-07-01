import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Basic health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Detailed health check with database status
router.get('/health/detailed', async (req, res) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'checking...',
      memory: 'ok',
      cpu: 'ok',
    },
  };

  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    
    healthcheck.checks.database = {
      status: dbState === 1 ? 'ok' : 'error',
      state: dbStates[dbState] || 'unknown',
    };

    // Memory usage
    const memUsage = process.memoryUsage();
    healthcheck.checks.memory = {
      status: 'ok',
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    };

    // CPU usage
    const cpuUsage = process.cpuUsage();
    healthcheck.checks.cpu = {
      status: 'ok',
      user: `${cpuUsage.user / 1000} ms`,
      system: `${cpuUsage.system / 1000} ms`,
    };

    // Overall status
    if (dbState !== 1) {
      healthcheck.status = 'degraded';
    }

    res.status(dbState === 1 ? 200 : 503).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'error';
    healthcheck.checks.database = { status: 'error', message: error.message };
    res.status(503).json(healthcheck);
  }
});

// Readiness check (for Kubernetes/Docker)
router.get('/ready', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'Database not connected',
      });
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      reason: error.message,
    });
  }
});

// Liveness check (for Kubernetes/Docker)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRoutes };
