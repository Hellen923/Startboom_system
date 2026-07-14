import express from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes imports
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { clientRoutes } from './routes/clients.js';
import { dealRoutes } from './routes/deals.js';
import { scheduleRoutes } from './routes/schedules.js';
import { performanceRoutes } from './routes/performance.js';
import { reportsRoutes } from './routes/reports.js';
import { salesRoutes } from './routes/sales.js';
import { stockRoutes } from './routes/stock.js';
import { notificationRoutes } from './routes/notifications.js';
import { uploadRoutes } from './routes/upload.js';
import { meetingRoutes } from './routes/meetings.js';
import { settingsRoutes } from './routes/settings.js';
import { tenantRoutes } from './routes/tenants.js';
import { auditLogRoutes } from './routes/auditLogs.js';
import { emailTemplateRoutes } from './routes/emailTemplates.js';
import { scheduledExportRoutes } from './routes/scheduledExports.js';
import { roleRoutes } from './routes/roles.js';
import { dashboardRoutes } from './routes/dashboards.js';
import { predictiveAnalyticsRoutes } from './routes/predictiveAnalytics.js';
import { issueRoutes } from './routes/issues.js';
import productRoutes from './routes/products.js';
import territoryRoutes from './routes/territories.js';
import analyticsRoutes from './routes/analytics.js';
import departmentRoutes from './routes/departments.js';
import teamRoutes from './routes/teams.js';
import pipelineRoutes from './routes/pipelines.js';
import customFieldRoutes from './routes/customFields.js';
import goalRoutes from './routes/goals.js';
import activityRoutes from './routes/activities.js';
import forecastRoutes from './routes/forecasts.js';
import branchRoutes from './routes/branches.js';
import intelligenceRoutes from './routes/intelligence.js';
import workflowRoutes from './routes/workflows.js';
import commentRoutes from './routes/comments.js';
import noteRoutes from './routes/notes.js';
import reports2Routes from './routes/reports2.js';
import permissionRoutes from './routes/permissions.js';
import { testEmailConfig } from './services/emailService.js';
import { startTaskReminderJob } from './jobs/taskReminderJob.js';
import { startScheduledExportJob } from './jobs/scheduledExportJob.js';
import Client from './models/Client.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable trust proxy for Render deployment
app.set('trust proxy', true);

// CORS configuration with environment support
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://crm-dbs.vercel.app',
  'https://crm-tool-ebon.vercel.app',
  'https://crm-tool-indol.vercel.app',
  'https://crm.xtreative.com',
  'https://www.crm.xtreative.com'
];

const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [];

const corsOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (if needed for public assets)
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection with improved timeout settings
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  minPoolSize: 5,
};

// Validate MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  process.exit(1);
}

if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
  console.error('❌ Invalid MongoDB URI format. Must start with mongodb:// or mongodb+srv://');
  console.error('Current value:', MONGODB_URI);
  process.exit(1);
}

const cleanupLegacyClientIndexes = async () => {
  try {
    const indexes = await Client.collection.indexes();
    const legacyNinIndex = indexes.find((index) => index.name === 'nin_1');

    if (legacyNinIndex) {
      await Client.collection.dropIndex('nin_1');
      if (process.env.NODE_ENV !== 'production') {
        console.log('Dropped legacy clients.nin_1 index');
      }
    }
  } catch (error) {
    if (error.codeName !== 'IndexNotFound' && process.env.NODE_ENV !== 'production') {
      console.warn('Could not clean up legacy client indexes:', error.message);
    }
  }
};

mongoose.connect(MONGODB_URI, mongoOptions)
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
    
    await cleanupLegacyClientIndexes();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/scheduled-exports', scheduledExportRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/predictive-analytics', predictiveAnalyticsRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/products', productRoutes);
app.use('/api/territories', territoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/custom-fields', customFieldRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/reports-custom', reports2Routes);
app.use('/api/permissions', permissionRoutes);

// Lightweight health/version endpoints for deployed debugging
app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'ok' });
});

// Test email endpoint (temporary - for verification)
app.get('/api/test-email', async (req, res) => {
  try {
    const { sendEmail } = await import('./services/emailService.js');
    const testEmail = req.query.email || 'hellenkiwagama@gmail.com';
    
    const result = await sendEmail(
      testEmail,
      'agentWelcome',
      {
        name: 'Test User',
        email: testEmail,
        otp: '123456',
        companyName: 'HoneyPot CRM Test'
      }
    );

    if (result.success) {
      res.json({ 
        success: true, 
        message: `Test email sent successfully to ${testEmail}!`,
        messageId: result.messageId,
        note: 'Check your inbox (and spam folder)'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Email sending failed',
        error: result.error 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error sending test email',
      error: error.message 
    });
  }
});

app.get('/api/version', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    service: 'crm-backend',
    node: process.version,
    env: process.env.NODE_ENV || 'unknown',
    db: mongoose.connection?.readyState === 1 ? mongoose.connection.name : null,
    commit: process.env.RENDER_GIT_COMMIT || null,
    branch: process.env.RENDER_GIT_BRANCH || null,
    timestamp: new Date().toISOString()
  });
});


// Serve frontend static files
const SERVE_FRONTEND = process.env.SERVE_FRONTEND === 'true';
const frontendBuildCandidates = [
  path.join(__dirname, '../frontend/build'),
  path.join(__dirname, '../frontend/dist')
];

const frontendStaticDir = frontendBuildCandidates.find((dir) =>
  fs.existsSync(path.join(dir, 'index.html'))
);

if (SERVE_FRONTEND && frontendStaticDir) {
  app.use(express.static(frontendStaticDir));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }

    // Serve React app's index.html for all other routes
    const indexPath = path.join(frontendStaticDir, 'index.html');
    return res.sendFile(indexPath);
  });
} else {
  app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'crm-backend', message: 'API is running' });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
}

// Create default admin on startup
const createDefaultAdmin = async () => {
  const User = await import('./models/User.js');
  try {
    const adminExists = await User.default.findOne({ role: 'admin' });

    if (!adminExists) {
      await User.default.create({
        name: 'System Administrator',
        email: 'xtreative@crm.com',
        password: 'admin123',
        role: 'admin',
        isFirstLogin: false
      });
    }
  } catch (error) {
    console.error('Error creating default users:', error);
  }
};

// Update agent rankings based on performance
const updateAgentRankings = async () => {
  try {
    const User = await import('./models/User.js');
    const Deal = await import('./models/Deal.js');
    const Sale = await import('./models/Sale.js');

    // Get all agents
    const agents = await User.default.find({ role: 'agent', isActive: true });

    // Calculate performance scores for each agent
    const agentPerformances = await Promise.all(
      agents.map(async (agent) => {
        // Get deals stats
        const deals = await Deal.default.find({
          agent: agent._id,
          stage: 'won'
        });

        // Get sales stats for the current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const sales = await Sale.default.find({
          agent: agent._id,
          saleDate: { $gte: startOfMonth },
          status: 'completed'
        });

        const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.finalAmount, 0);

        // Calculate performance score (weighted combination)
        const performanceScore = (deals.length * 100) + (totalSalesAmount * 0.1);

        return {
          agentId: agent._id,
          performanceScore,
          successfulDeals: deals.length,
          monthlySalesAmount: totalSalesAmount,
          totalSales: sales.length
        };
      })
    );

    // Sort by performance score (descending)
    agentPerformances.sort((a, b) => b.performanceScore - a.performanceScore);

    // Update rankings
    for (let i = 0; i < agentPerformances.length; i++) {
      const performance = agentPerformances[i];
      await User.default.findByIdAndUpdate(performance.agentId, {
        agentRank: i + 1,
        performanceScore: performance.performanceScore,
        successfulDeals: performance.successfulDeals,
        monthlySalesAmount: performance.monthlySalesAmount,
        totalSales: performance.totalSales,
        lastRankUpdate: new Date()
      });
    }

  } catch (error) {
    console.error('❌ Error updating agent rankings:', error);
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔗 Login URL: http://localhost:${PORT}`);
  }

  // Test email configuration on startup
  console.log('📧 Testing email configuration...');
  const emailConfigured = await testEmailConfig();
  if (emailConfigured) {
    console.log('✅ Email service is ready');
  } else {
    console.log('❌ Email service configuration failed - check your EMAIL_ environment variables');
  }

  await createDefaultAdmin();

  // Update agent rankings every 6 hours
  setInterval(updateAgentRankings, 6 * 60 * 60 * 1000);

  // Update rankings immediately on startup
  updateAgentRankings();

  // Start task reminder cron job (runs every hour)
  startTaskReminderJob();
  startScheduledExportJob();
});
