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
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Select only the fields needed for auth/RBAC — avoids fetching the full user
    // document on every request (smaller payload = faster query).
    req.user = await User.findById(decoded.id)
      .select('_id name email role isActive')
      .lean();
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user.id = req.user._id.toString();
    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact admin.' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// Role-based access guard with RBAC normalization & ADMIN_EMAILS whitelist check
const authorize = (...roles) => (req, res, next) => {
  const userRole = normalizeRole(req.user.role);
  const normalizedAllowedRoles = roles.map(r => normalizeRole(r));

  // If user has ROLE_ADMIN role, strictly enforce ADMIN_EMAILS whitelist check
  if (userRole === 'ROLE_ADMIN') {
    const adminEmailsEnv = process.env.ADMIN_EMAILS || 'ramub9349@gmail.com';
    const allowedAdminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase());

    if (!req.user?.email || !allowedAdminEmails.includes(req.user.email.toLowerCase())) {
      const { logAuditAction } = require('./securityMiddleware');
      logAuditAction({ req, action: 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT', status: 'DENIED', details: { email: req.user?.email } });
      return res.status(403).json({
        success: false,
        message: '403 Forbidden: Access denied. Email is not authorized for Admin Portal.',
      });
    }
    // Whitelisted admin has full access across all protected endpoints
    return next();
  }

  if (!normalizedAllowedRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: `Forbidden: Access denied for role '${userRole}'`,
    });
  }
  next();
};

module.exports = { protect, authorize, normalizeRole };

