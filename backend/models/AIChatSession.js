const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  disclaimer: {
    type: String,
    default: '',
  },
  aiPowered: {
    type: Boolean,
    default: true,
  },
  provider: {
    type: String,
    default: 'gemini',
  },
  tokensUsed: {
    type: Number,
    default: 0,
  },
  fileAttachment: {
    name: { type: String, default: '' },
    type: { type: String, default: '' },
    url:  { type: String, default: '' },
    parsedSummary: { type: String, default: '' },
  },
});

const AIChatSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New AI Conversation',
      trim: true,
    },
    category: {
      type: String,
      enum: ['patient_health', 'doctor_clinical', 'prescription_scan', 'report_summary', 'general'],
      default: 'patient_health',
      index: true,
    },
    provider: {
      type: String,
      default: 'gemini',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

AIChatSessionSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('AIChatSession', AIChatSessionSchema);
