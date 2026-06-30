import AuditLog from '../models/AuditLog.js';

/**
 * Valid audit log actions — must match the AuditLog model enum exactly.
 * Centralised here so callers get a clear reference.
 */
export const AUDIT_ACTIONS = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CHANGE_PASSWORD: 'CHANGE_PASSWORD',
  // Users
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  SET_TARGETS: 'SET_TARGETS',
  // Clients
  CREATE_CLIENT: 'CREATE_CLIENT',
  UPDATE_CLIENT: 'UPDATE_CLIENT',
  DELETE_CLIENT: 'DELETE_CLIENT',
  // Deals
  CREATE_DEAL: 'CREATE_DEAL',
  UPDATE_DEAL: 'UPDATE_DEAL',
  DELETE_DEAL: 'DELETE_DEAL',
  // Sales
  CREATE_SALE: 'CREATE_SALE',
  UPDATE_SALE: 'UPDATE_SALE',
  // Schedules
  CREATE_SCHEDULE: 'CREATE_SCHEDULE',
  UPDATE_SCHEDULE: 'UPDATE_SCHEDULE',
  DELETE_SCHEDULE: 'DELETE_SCHEDULE',
  // Meetings
  CREATE_MEETING: 'CREATE_MEETING',
  UPDATE_MEETING: 'UPDATE_MEETING',
  DELETE_MEETING: 'DELETE_MEETING',
  // Stock
  CREATE_STOCK: 'CREATE_STOCK',
  UPDATE_STOCK: 'UPDATE_STOCK',
  DELETE_STOCK: 'DELETE_STOCK',
  // Settings & Tenants
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  CREATE_TENANT: 'CREATE_TENANT',
  UPDATE_TENANT: 'UPDATE_TENANT',
  SUSPEND_TENANT: 'SUSPEND_TENANT',
  // Data operations
  EXPORT_DATA: 'EXPORT_DATA',
  IMPORT_DATA: 'IMPORT_DATA',
  BULK_OPERATION: 'BULK_OPERATION',
  // Fallback
  OTHER: 'OTHER'
};

/**
 * Parse browser name from user-agent string.
 */
const getBrowser = (ua = '') => {
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown Browser';
};

/**
 * Parse device type from user-agent string.
 */
const getDevice = (ua = '') => {
  if (ua.includes('Mobile') || ua.includes('Android')) return 'Mobile';
  if (ua.includes('Tablet') || ua.includes('iPad')) return 'Tablet';
  return 'Desktop';
};

/**
 * Log an auditable action.
 *
 * @param {import('express').Request} req  - Express request (provides user + IP context)
 * @param {string}  action      - One of AUDIT_ACTIONS
 * @param {string}  description - Human-readable description of what happened
 * @param {object}  options
 * @param {string}  [options.entityType]  - Model name, e.g. 'Client', 'Deal'
 * @param {*}       [options.entityId]    - MongoDB ObjectId of the affected document
 * @param {'success'|'failed'} [options.status]
 * @param {object}  [options.metadata]    - Any extra data to store
 */
export const logAction = async (req, action, description, options = {}) => {
  try {
    const {
      entityType = '',
      entityId = null,
      status = 'success',
      metadata = {}
    } = options;

    // Resolve IP — handle proxies (Render, Vercel, Nginx, etc.)
    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '';

    const userAgent = req.headers['user-agent'] || '';

    await AuditLog.create({
      action,
      description,
      user: req.user?.userId,
      userName: req.user?.name || '',
      userEmail: req.user?.email || '',
      userRole: req.user?.role || '',
      tenant: req.user?.tenantId || null,
      entityType,
      entityId,
      ipAddress,
      status,
      metadata: {
        ...metadata,
        browser: getBrowser(userAgent),
        device: getDevice(userAgent),
        userAgent
      }
    });
  } catch (error) {
    // Audit logging must never crash the main request flow
    console.error('Audit log error:', error.message);
  }
};
