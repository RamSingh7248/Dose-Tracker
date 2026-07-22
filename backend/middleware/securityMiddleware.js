const AuditLog = require('../models/AuditLog');

// Audit Logging helper
const logAuditAction = async ({ req, user, action, resource, status = 'SUCCESS', details = {} }) => {
  try {
    const userObj = user || req?.user;
    await AuditLog.create({
      user: userObj?._id || userObj?.id || null,
      userEmail: userObj?.email || 'Anonymous',
      userRole: userObj?.role || 'guest',
      action,
      resource: resource || req?.originalUrl || 'API',
      ipAddress: req?.ip || req?.connection?.remoteAddress || '0.0.0.0',
      userAgent: req?.headers?.['user-agent'] || 'Unknown',
      status,
      details
    });
  } catch (err) {
    console.error('AuditLog writing failed:', err.message);
  }
};

// IDOR Verification Middleware
const verifyResourceOwnership = (modelGetter) => async (req, res, next) => {
  try {
    const resourceId = req.params.id;
    if (!resourceId) return next();

    const Model = typeof modelGetter === 'function' ? modelGetter() : modelGetter;
    if (!Model) return next();

    const doc = await Model.findById(resourceId);
    if (!doc) return res.status(404).json({ success: false, message: 'Resource not found' });

    // Admins bypass IDOR check
    if (req.user.role === 'admin') return next();

    // Check doctor assigned patient ownership
    if (req.user.role === 'doctor') {
      if (doc.assignedDoctor && doc.assignedDoctor.toString() === req.user.id.toString()) return next();
      if (doc.doctor && doc.doctor.toString() === req.user.id.toString()) return next();
    }

    // Check patient resource ownership
    const ownerId = doc.user ? doc.user.toString() : doc.patient ? doc.patient.toString() : null;
    if (ownerId && ownerId !== req.user.id.toString()) {
      await logAuditAction({ req, action: 'UNAUTHORIZED_IDOR_ATTEMPT', resource: req.originalUrl, status: 'DENIED', details: { resourceId } });
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this resource' });
    }

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Security check error' });
  }
};

// File Security Upload Filter (Whitelisting images and PDFs only)
const secureFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  const forbiddenExts = ['.exe', '.sh', '.php', '.bat', '.js', '.vbs', '.py', '.cmd', '.jar'];
  
  const ext = (file.originalname || '').toLowerCase().slice((file.originalname || '').lastIndexOf('.'));
  
  if (forbiddenExts.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Security Alert: File type not permitted. Executable or non-medical formats rejected.'), false);
  }
  cb(null, true);
};

module.exports = {
  logAuditAction,
  verifyResourceOwnership,
  secureFileFilter
};
