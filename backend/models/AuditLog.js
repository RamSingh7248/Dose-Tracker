const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userEmail: {
    type: String,
    default: 'Anonymous'
  },
  userRole: {
    type: String,
    default: 'guest'
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  resource: {
    type: String,
    default: 'System'
  },
  ipAddress: {
    type: String,
    default: '0.0.0.0'
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'WARNING', 'DENIED'],
    default: 'SUCCESS'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true,
    index: true
  }
}, {
  timestamps: false
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
