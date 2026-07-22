const jwt = require('jsonwebtoken');
const User = require('../models/User');

const normalizeRole = (role) => {
  if (!role) return 'ROLE_PATIENT';
  if (role === 'admin' || role === 'ROLE_ADMIN') return 'ROLE_ADMIN';
  if (role === 'doctor' || role === 'ROLE_DOCTOR') return 'ROLE_DOCTOR';
  if (role === 'patient' || role === 'ROLE_PATIENT') return 'ROLE_PATIENT';
  return role.startsWith('ROLE_') ? role : `ROLE_${role.toUpperCase()}`;
};

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact admin.' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// Role-based access guard with RBAC normalization
const authorize = (...roles) => (req, res, next) => {
  const userRole = normalizeRole(req.user.role);
  const normalizedAllowedRoles = roles.map(r => normalizeRole(r));
  if (!normalizedAllowedRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: `Forbidden: Access denied for role '${userRole}'`,
    });
  }
  next();
};

module.exports = { protect, authorize, normalizeRole };

