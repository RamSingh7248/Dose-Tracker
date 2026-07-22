const mongoose = require('mongoose');

const AISettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    defaultProvider: {
      type: String,
      enum: ['gemini', 'gpt', 'claude', 'deepseek', 'llama', 'mistral', 'grok', 'perplexity'],
      default: 'gemini',
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0.0,
      max: 1.0,
    },
    responseLength: {
      type: String,
      enum: ['concise', 'balanced', 'detailed'],
      default: 'balanced',
    },
    language: {
      type: String,
      default: 'en',
    },
    streamingEnabled: {
      type: Boolean,
      default: true,
    },
    voiceEnabled: {
      type: Boolean,
      default: true,
    },
    conversationHistoryEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AISettings', AISettingsSchema);
