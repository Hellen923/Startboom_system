import express from 'express';
import axios from 'axios';
import Territory from '../models/Territory.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { tenantAuth, requireRole } from '../middleware/tenantAuth.js';

const router = express.Router();

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const NOMINATIM_USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'Swavelink SalesApp/1.0';

// Apply tenant-aware auth to ALL routes
router.use(tenantAuth);

// GET /api/territories/search-location
router.get('/search-location', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) return res.status(400).json({ error: 'Search query too short' });
    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: { q: `${query}, Uganda`, format: 'json', addressdetails: 1, limit: 10, countrycodes: 'ug' },
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
      timeout: 10000
    });
    const locations = response.data.map(loc => ({
      osmId: loc.osm_id,
      osmType: loc.osm_type,
      displayName: loc.display_name,
      latitude: parseFloat(loc.lat),
      longitude: parseFloat(loc.lon),
      boundingBox: {
        south: parseFloat(loc.boundingbox[0]),
        north: parseFloat(loc.boundingbox[1]),
        west: parseFloat(loc.boundingbox[2]),
        east: parseFloat(loc.boundingbox[3])
      },
      address: {
        region: loc.address.region || loc.address.state,
        district: loc.address.county || loc.address.state_district,
        county: loc.address.municipality,
        subcounty: loc.address.suburb || loc.address.village,
        city: loc.address.city || loc.address.town,
        village: loc.address.village
      }
    }));
    res.json({ locations });
  } catch (error) {
    console.error('Error searching location:', error.message);
    res.status(500).json({ error: 'Error searching location' });
  }
});

// GET /api/territories — all authenticated roles
router.get('/', async (req, res) => {
  try {
    const { isActive, region, district } = req.query;
    const query = { ...req.tenantQuery };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (region) query.region = region;
    if (district) query.district = district;
    // Agents only see their own territory
    if (req.user.role === 'agent') {
      query['assignedAgents.user'] = req.user.userId;
      query['assignedAgents.isActive'] = true;
    }
    const territories = await Territory.find(query)
      .populate('manager', 'name email')
      .populate('assignedAgents.user', 'name email role phone')
      .populate('createdBy', 'name email')
      .sort({ name: 1 })
      .lean();
    res.json({ territories });
  } catch (error) {
    console.error('Error fetching territories:', error);
    res.status(500).json({ error: 'Server error fetching territories' });
  }
});

// GET /api/territories/my-territory — agent sees their territory + teammates
router.get('/my-territory', async (req, res) => {
  try {
    const territory = await Territory.findOne({
      ...req.tenantQuery,
      'assignedAgents.user': req.user.userId,
      'assignedAgents.isActive': true,
      isActive: true
    })
      .populate('manager', 'name email')
      .populate('assignedAgents.user', 'name email role phone')
      .lean();
    
    if (!territory) {
      return res.status(404).json({ error: 'No territory assigned' });
    }
    
    // Include all teammates (including current user) with full info
    const teammates = territory.assignedAgents
      .filter(a => a.isActive && a.user)
      .map(a => ({
        _id: a.user._id,
        name: a.user.name,
        email: a.user.email,
        phone: a.user.phone,
        role: a.user.role
      }));
    
    res.json({ territory, teammates });
  } catch (error) {
    console.error('Error fetching my territory:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/territories/:id
router.get('/:id', async (req, res) => {
  try {
    const territory = await Territory.findOne({ _id: req.params.id, ...req.tenantQuery })
      .populate('manager', 'name email')
      .populate('assignedAgents.user', 'name email role phone')
      .populate('createdBy updatedBy', 'name email');
    if (!territory) return res.status(404).json({ error: 'Territory not found' });
    res.json({ territory });
  } catch (error) {
    console.error('Error fetching territory:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/territories — admin/manager only
router.post('/', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const territory = new Territory({ ...req.body, tenant: req.tenantId, createdBy: req.user.userId });
    await territory.save();
    await AuditLog.create({
      tenant: req.tenantId, user: req.user.userId, action: 'territory.create',
      resource: 'Territory', resourceId: territory._id,
      details: { name: territory.name, location: territory.location?.displayName }
    });
    res.status(201).json({ territory });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Territory name already exists' });
    console.error('Error creating territory:', error);
    res.status(500).json({ error: 'Server error creating territory' });
  }
});

// PUT /api/territories/:id — admin/manager only
router.put('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const territory = await Territory.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!territory) return res.status(404).json({ error: 'Territory not found' });
    Object.assign(territory, req.body);
    territory.updatedBy = req.user.userId;
    await territory.save();
    await AuditLog.create({
      tenant: req.tenantId, user: req.user.userId, action: 'territory.update',
      resource: 'Territory', resourceId: territory._id, details: { name: territory.name }
    });
    res.json({ territory });
  } catch (error) {
    console.error('Error updating territory:', error);
    res.status(500).json({ error: 'Server error updating territory' });
  }
});

// POST /api/territories/:id/assign-agent — admin/manager only
router.post('/:id/assign-agent', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    const user = await User.findOne({ _id: userId, tenant: req.tenantId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const territory = await Territory.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!territory) return res.status(404).json({ error: 'Territory not found' });
    await territory.addAgent(userId);
    await AuditLog.create({
      tenant: req.tenantId, user: req.user.userId, action: 'territory.assign_agent',
      resource: 'Territory', resourceId: territory._id,
      details: { territory: territory.name, assignedUser: user.name }
    });
    res.json({ message: 'Agent assigned successfully', territory });
  } catch (error) {
    console.error('Error assigning agent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/territories/:id/remove-agent — admin/manager only
router.post('/:id/remove-agent', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    const territory = await Territory.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!territory) return res.status(404).json({ error: 'Territory not found' });
    await territory.removeAgent(userId);
    await AuditLog.create({
      tenant: req.tenantId, user: req.user.userId, action: 'territory.remove_agent',
      resource: 'Territory', resourceId: territory._id, details: { territory: territory.name }
    });
    res.json({ message: 'Agent removed successfully', territory });
  } catch (error) {
    console.error('Error removing agent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/territories/:id — soft delete, admin only
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const territory = await Territory.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!territory) return res.status(404).json({ error: 'Territory not found' });
    territory.isActive = false;
    territory.updatedBy = req.user.userId;
    await territory.save();
    await AuditLog.create({
      tenant: req.tenantId, user: req.user.userId, action: 'territory.delete',
      resource: 'Territory', resourceId: territory._id, details: { name: territory.name }
    });
    res.json({ message: 'Territory deleted successfully' });
  } catch (error) {
    console.error('Error deleting territory:', error);
    res.status(500).json({ error: 'Server error deleting territory' });
  }
});

export default router;
