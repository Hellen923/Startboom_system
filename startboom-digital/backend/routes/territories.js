import express from 'express';
import axios from 'axios';
import Territory from '../models/Territory.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// OpenStreetMap Nominatim configuration
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const NOMINATIM_USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'StartboomDigitalSalesApp/1.0';

// @route   GET /api/territories/search-location
// @desc    Search for locations in Uganda using OpenStreetMap
// @access  Private
router.get('/search-location', auth, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }

    // Search specifically in Uganda
    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        q: `${query}, Uganda`,
        format: 'json',
        addressdetails: 1,
        limit: 10,
        countrycodes: 'ug'  // Limit to Uganda
      },
      headers: {
        'User-Agent': NOMINATIM_USER_AGENT
      },
      timeout: 10000
    });

    const locations = response.data.map(location => ({
      osmId: location.osm_id,
      osmType: location.osm_type,
      displayName: location.display_name,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
      boundingBox: {
        south: parseFloat(location.boundingbox[0]),
        north: parseFloat(location.boundingbox[1]),
        west: parseFloat(location.boundingbox[2]),
        east: parseFloat(location.boundingbox[3])
      },
      address: {
        region: location.address.region || location.address.state,
        district: location.address.county || location.address.state_district,
        county: location.address.municipality,
        subcounty: location.address.suburb || location.address.village,
        city: location.address.city || location.address.town,
        village: location.address.village
      }
    }));

    res.json({ locations });
  } catch (error) {
    console.error('Error searching location:', error.message);
    res.status(500).json({ error: 'Error searching location' });
  }
});

// @route   GET /api/territories
// @desc    Get all territories for tenant
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { isActive, region, district } = req.query;

    const query = { tenant: req.user.tenant };

    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (region) query.region = region;
    if (district) query.district = district;

    const territories = await Territory.find(query)
      .populate('manager', 'firstName lastName email')
      .populate('assignedAgents.user', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName email')
      .sort({ name: 1 })
      .lean();

    res.json({ territories });
  } catch (error) {
    console.error('Error fetching territories:', error);
    res.status(500).json({ error: 'Server error fetching territories' });
  }
});

// @route   GET /api/territories/my-territory
// @desc    Get territory assigned to current user
// @access  Private (Agent)
router.get('/my-territory', auth, async (req, res) => {
  try {
    const territory = await Territory.findOne({
      tenant: req.user.tenant,
      'assignedAgents.user': req.user.id,
      'assignedAgents.isActive': true,
      isActive: true
    })
      .populate('manager', 'firstName lastName email')
      .populate('assignedAgents.user', 'firstName lastName email role phone')
      .lean();

    if (!territory) {
      return res.status(404).json({ error: 'No territory assigned' });
    }

    // Get only active teammates in this territory
    const teammates = territory.assignedAgents
      .filter(a => a.isActive && a.user._id.toString() !== req.user.id)
      .map(a => a.user);

    res.json({ territory, teammates });
  } catch (error) {
    console.error('Error fetching my territory:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/territories/:id
// @desc    Get single territory
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const territory = await Territory.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    })
      .populate('manager', 'firstName lastName email')
      .populate('assignedAgents.user', 'firstName lastName email role phone')
      .populate('createdBy updatedBy', 'firstName lastName email');

    if (!territory) {
      return res.status(404).json({ error: 'Territory not found' });
    }

    res.json({ territory });
  } catch (error) {
    console.error('Error fetching territory:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/territories
// @desc    Create new territory
// @access  Private (Admin/Manager)
router.post('/', auth, async (req, res) => {
  try {
    const territoryData = {
      ...req.body,
      tenant: req.user.tenant,
      createdBy: req.user.id
    };

    const territory = new Territory(territoryData);
    await territory.save();

    // Audit log
    await AuditLog.create({
      tenant: req.user.tenant,
      user: req.user.id,
      action: 'territory.create',
      resource: 'Territory',
      resourceId: territory._id,
      details: { name: territory.name, location: territory.location?.displayName }
    });

    res.status(201).json({ territory });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Territory name already exists' });
    }
    console.error('Error creating territory:', error);
    res.status(500).json({ error: 'Server error creating territory' });
  }
});

// @route   PUT /api/territories/:id
// @desc    Update territory
// @access  Private (Admin/Manager)
router.put('/:id', auth, async (req, res) => {
  try {
    const territory = await Territory.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!territory) {
      return res.status(404).json({ error: 'Territory not found' });
    }

    Object.assign(territory, req.body);
    territory.updatedBy = req.user.id;
    await territory.save();

    // Audit log
    await AuditLog.create({
      tenant: req.user.tenant,
      user: req.user.id,
      action: 'territory.update',
      resource: 'Territory',
      resourceId: territory._id,
      details: { name: territory.name }
    });

    res.json({ territory });
  } catch (error) {
    console.error('Error updating territory:', error);
    res.status(500).json({ error: 'Server error updating territory' });
  }
});

// @route   POST /api/territories/:id/assign-agent
// @desc    Assign agent to territory
// @access  Private (Admin/Manager)
router.post('/:id/assign-agent', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Verify user exists and belongs to same tenant
    const user = await User.findOne({
      _id: userId,
      tenant: req.user.tenant
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const territory = await Territory.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!territory) {
      return res.status(404).json({ error: 'Territory not found' });
    }

    await territory.addAgent(userId);

    // Audit log
    await AuditLog.create({
      tenant: req.user.tenant,
      user: req.user.id,
      action: 'territory.assign_agent',
      resource: 'Territory',
      resourceId: territory._id,
      details: {
        territory: territory.name,
        assignedUser: `${user.firstName} ${user.lastName}`
      }
    });

    res.json({ message: 'Agent assigned successfully', territory });
  } catch (error) {
    console.error('Error assigning agent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/territories/:id/remove-agent
// @desc    Remove agent from territory
// @access  Private (Admin/Manager)
router.post('/:id/remove-agent', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const territory = await Territory.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!territory) {
      return res.status(404).json({ error: 'Territory not found' });
    }

    await territory.removeAgent(userId);

    // Audit log
    await AuditLog.create({
      tenant: req.user.tenant,
      user: req.user.id,
      action: 'territory.remove_agent',
      resource: 'Territory',
      resourceId: territory._id,
      details: { territory: territory.name }
    });

    res.json({ message: 'Agent removed successfully', territory });
  } catch (error) {
    console.error('Error removing agent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/territories/:id
// @desc    Delete territory (soft delete)
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const territory = await Territory.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!territory) {
      return res.status(404).json({ error: 'Territory not found' });
    }

    territory.isActive = false;
    territory.updatedBy = req.user.id;
    await territory.save();

    // Audit log
    await AuditLog.create({
      tenant: req.user.tenant,
      user: req.user.id,
      action: 'territory.delete',
      resource: 'Territory',
      resourceId: territory._id,
      details: { name: territory.name }
    });

    res.json({ message: 'Territory deleted successfully' });
  } catch (error) {
    console.error('Error deleting territory:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
