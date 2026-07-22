const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    time: {
      type: String, // "HH:MM" format
      required: true,
    },
    days: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    label: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
    vibrationEnabled: {
      type: Boolean,
      default: true,
    },
    // ── Enterprise Reminder Engine Fields ──
    voiceEnabled: {
      type: Boolean,
      default: true,
    },
    browserNotifyEnabled: {
      type: Boolean,
      default: true,
    },
    emailNotifyEnabled: {
      type: Boolean,
      default: true,
    },
    pushNotifyEnabled: {
      type: Boolean,
      default: true,
    },
    snoozedUntil: {
      type: Date,
      default: null,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    recurringType: {
      type: String,
      enum: ['daily', 'custom_days', 'interval'],
      default: 'daily',
    },
    intervalDays: {
      type: Number,
      default: 1,
    },
    lastTriggeredAt: {
      type: Date,
      default: null,
    },
    completionDate: {
      type: Date,
      default: null,
    },
    completionTracked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', ReminderSchema);
