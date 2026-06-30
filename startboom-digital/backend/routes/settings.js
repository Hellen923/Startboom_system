import express from 'express';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant-aware middleware to all routes
router.use(tenantAuth);

// Get settings (Admin only)
router.get('/', async (req, res) => {
  try {
    // Return tenant-specific settings
    const settings = {
      companyName: req.tenant?.name || 'CRM System',
      theme: req.tenant?.settings?.primaryColor || '#f97316',
      secondaryColor: req.tenant?.settings?.secondaryColor || '#1f2937',
      logo: req.tenant?.settings?.logo || null,
      timezone: req.tenant?.settings?.timezone || 'UTC',
      currency: req.tenant?.settings?.currency || 'USD',
      language: req.tenant?.settings?.language || 'en',
      dateFormat: req.tenant?.settings?.dateFormat || 'MM/DD/YYYY',
      performanceCriteria: {
        minDeals: 10,
        targetRevenue: 50000,
        ratingThreshold: 3.5
      },
      notificationSettings: {
        emailNotifications: true,
        dealAlerts: true,
        weeklyReports: true
      },
      subscription: {
        plan: req.tenant?.subscription?.planName || 'starter',
        features: req.tenant?.subscription?.features || {},
        usage: req.tenant?.usage || {}
      }
    };
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update settings (Admin only)
router.put('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { companyName, theme, performanceCriteria, notificationSettings, branding } = req.body;
    
    // Update tenant settings
    const updateData = {};
    if (companyName) updateData.name = companyName;
    if (theme) updateData['settings.primaryColor'] = theme;
    if (branding) {
      if (branding.logo) updateData['settings.logo'] = branding.logo;
      if (branding.secondaryColor) updateData['settings.secondaryColor'] = branding.secondaryColor;
    }

    if (Object.keys(updateData).length > 0) {
      await req.tenant.updateOne(updateData);
    }
    
    res.json({ 
      message: 'Settings updated successfully',
      settings: {
        companyName,
        theme,
        performanceCriteria,
        notificationSettings,
        branding
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as settingsRoutes };
