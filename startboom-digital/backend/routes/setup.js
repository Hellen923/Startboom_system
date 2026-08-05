import express from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/permission.js';
import { getIndustries, getIndustryTemplate, isValidIndustry } from '../config/industryTemplates.js';
import Tenant from '../models/Tenant.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import User from '../models/User.js';

const router = express.Router();

// Get all available industry templates
router.get('/industry-templates', auth, async (req, res) => {
  try {
    const industries = getIndustries();
    res.json(industries);
  } catch (error) {
    console.error('Error fetching industry templates:', error);
    res.status(500).json({ 
      message: 'Failed to fetch industry templates', 
      error: error.message 
    });
  }
});

// Get specific industry template
router.get('/industry-templates/:industryId', auth, async (req, res) => {
  try {
    const { industryId } = req.params;
    
    if (!isValidIndustry(industryId)) {
      return res.status(404).json({ 
        message: 'Industry template not found' 
      });
    }
    
    const template = getIndustryTemplate(industryId);
    res.json({ id: industryId, ...template });
  } catch (error) {
    console.error('Error fetching industry template:', error);
    res.status(500).json({ 
      message: 'Failed to fetch industry template', 
      error: error.message 
    });
  }
});

// Initialize organization with industry template
router.post('/initialize-organization', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { industryId, organizationSize, customDepartments } = req.body;
    const tenantId = req.user.tenant;
    
    // Validate industry
    if (!industryId || !isValidIndustry(industryId)) {
      return res.status(400).json({ 
        message: 'Invalid or missing industry type' 
      });
    }
    
    // Get tenant
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // Check if already configured
    if (tenant.isConfigured) {
      return res.status(400).json({ 
        message: 'Organization is already configured' 
      });
    }
    
    // Get industry template
    const template = getIndustryTemplate(industryId);
    
    // Update tenant with industry information
    tenant.industryType = industryId;
    tenant.organizationSize = organizationSize || '';
    tenant.isConfigured = true;
    tenant.setupCompletedAt = new Date();
    await tenant.save();
    
    // Create departments from template or custom departments
    const departmentsToCreate = customDepartments && customDepartments.length > 0 
      ? customDepartments 
      : template.defaultDepartments;
    
    const createdDepartments = [];
    const departmentMap = new Map(); // For team creation
    
    for (const deptConfig of departmentsToCreate) {
      const department = await Department.create({
        tenant: tenantId,
        name: deptConfig.name,
        description: deptConfig.description || '',
        modules: deptConfig.modules || [],
        icon: deptConfig.icon || 'Briefcase',
        industryType: industryId,
        activeModules: deptConfig.modules || [],
        isCore: deptConfig.isCore !== undefined ? deptConfig.isCore : false,
        createdBy: req.user._id
      });
      
      createdDepartments.push(department);
      departmentMap.set(deptConfig.name, department._id);
    }
    
    // Create default teams if specified in template
    const createdTeams = [];
    if (template.defaultTeams && Object.keys(template.defaultTeams).length > 0) {
      for (const [deptName, teamNames] of Object.entries(template.defaultTeams)) {
        const deptId = departmentMap.get(deptName);
        
        if (deptId && Array.isArray(teamNames)) {
          for (const teamName of teamNames) {
            const team = await Team.create({
              tenant: tenantId,
              department: deptId,
              name: teamName,
              createdBy: req.user._id
            });
            createdTeams.push(team);
          }
        }
      }
    }
    
    res.status(201).json({
      message: 'Organization initialized successfully',
      data: {
        tenant: {
          id: tenant._id,
          name: tenant.name,
          industryType: tenant.industryType,
          organizationSize: tenant.organizationSize,
          isConfigured: tenant.isConfigured
        },
        departments: createdDepartments.map(d => ({
          id: d._id,
          name: d.name,
          modules: d.modules,
          icon: d.icon
        })),
        teams: createdTeams.map(t => ({
          id: t._id,
          name: t.name,
          department: t.department
        }))
      }
    });
    
  } catch (error) {
    console.error('Error initializing organization:', error);
    res.status(500).json({ 
      message: 'Failed to initialize organization', 
      error: error.message 
    });
  }
});

// Get organization setup status
router.get('/status', auth, async (req, res) => {
  try {
    const tenantId = req.user.tenant;
    
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    const departmentCount = await Department.countDocuments({ 
      tenant: tenantId, 
      isActive: true 
    });
    
    const teamCount = await Team.countDocuments({ 
      tenant: tenantId, 
      isActive: true 
    });
    
    const userCount = await User.countDocuments({ 
      tenant: tenantId, 
      isActive: true,
      role: { $ne: 'superadmin' }
    });
    
    res.json({
      isConfigured: tenant.isConfigured || false,
      industryType: tenant.industryType || null,
      organizationSize: tenant.organizationSize || null,
      setupCompletedAt: tenant.setupCompletedAt || null,
      stats: {
        departments: departmentCount,
        teams: teamCount,
        users: userCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching setup status:', error);
    res.status(500).json({ 
      message: 'Failed to fetch setup status', 
      error: error.message 
    });
  }
});

export const setupRoutes = router;
export default router;
