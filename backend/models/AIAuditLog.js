const mongoose = require('mongoose');

const AIAuditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedProvider: {
      type: String,
      required: true,
    },
    actualProvider: {
      type: String,
      required: true,
    },
    modelUsed: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true,
      enum: ['CHAT', 'PRESCRIPTION_SCAN', 'FILE_ANALYSIS', 'CLINICAL_ASSISTANT', 'INTERACTION_CHECK', 'VOICE_TTS'],
    },
    promptLength: {
      type: Number,
      default: 0,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    estimatedCostUsd: {
      type: Number,
      default: 0.0001,
    },
    wasFailover: {
      type: Boolean,
      default: false,
    },
    failoverTrace: [
      {
        provider: String,
        error: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILOVER_SUCCESS', 'FALLBACK_LOCAL', 'ERROR'],
      default: 'SUCCESS',
    },
  },
  { timestamps: true }
);

AIAuditLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AIAuditLog', AIAuditLogSchema);
