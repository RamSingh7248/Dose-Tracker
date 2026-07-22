const mongoose = require('mongoose');

const DoseSchema = new mongoose.Schema(
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
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    scheduledTime: {
      type: Date,
      required: true,
      index: true,
    },
    takenAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'taken', 'skipped', 'missed'],
      default: 'pending',
      index: true,
    },
    pillsTaken: {
      type: Number,
      default: 1,
    },
    notes: {
      type: String,
      default: '',
    },
    sideEffects: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// High Performance Compound Indexes
DoseSchema.index({ user: 1, scheduledTime: -1 });
DoseSchema.index({ user: 1, status: 1, scheduledTime: -1 });
DoseSchema.index({ medication: 1, scheduledTime: -1 });

module.exports = mongoose.model('Dose', DoseSchema);
