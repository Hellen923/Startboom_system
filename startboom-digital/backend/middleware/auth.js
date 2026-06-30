import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Legacy Auth Middleware (Backward Compatibility)
 * 
 * This maintains compatibility with existing routes that don't need tenant isolation
 * For new routes, use tenantAuth from tenantAuth.js instead
 */
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Legacy Role Authorization (Backward Compatibility)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'User role not authorized to access this route' 
      });
    }
    next();
  };
};

export { auth, authorize };