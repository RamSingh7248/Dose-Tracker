const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
    },
    genericName: {
      type: String,
      trim: true,
      default: '',
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
    },
    dosageUnit: {
      type: String,
      enum: ['mg', 'ml', 'mcg', 'g', 'tablet', 'capsule', 'drop', 'unit'],
      default: 'mg',
    },
    frequency: {
      type: String,
      enum: ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed', 'weekly', 'custom'],
      default: 'once_daily',
    },
    times: [{ type: String }], // e.g. ["08:00", "14:00", "20:00"]
    instructions: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['prescription', 'otc', 'supplement', 'vitamin', 'other'],
      default: 'prescription',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    icon: {
      type: String,
      default: '💊',
    },
    pillsRemaining: {
      type: Number,
      default: 0,
    },
    pillsPerDose: {
      type: Number,
      default: 1,
    },
    refillThreshold: {
      type: Number,
      default: 10,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    prescribedBy: {
      type: String,
      default: '',
    },
    pharmacy: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    // ── Extended fields for prescription scanner integration ──
    morning: {
      type: Boolean,
      default: false,
    },
    afternoon: {
      type: Boolean,
      default: false,
    },
    night: {
      type: Boolean,
      default: false,
    },
    foodInstructions: {
      type: String,
      enum: ['before_food', 'after_food', 'with_food', 'no_preference'],
      default: 'no_preference',
    },
    linkedPrescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      default: null,
    },
  },
  { timestamps: true }
);

// ── Performance Indexes ───────────────────────────────────────────────────────
// Without these, every getMedications() call does a full collection scan.
// The compound index covers the most common query pattern:
//   Medication.find({ user: id, isActive: true }).sort('-createdAt')
MedicationSchema.index({ user: 1 });
MedicationSchema.index({ user: 1, isActive: 1 });
MedicationSchema.index({ user: 1, isActive: 1, createdAt: -1 });
MedicationSchema.index({ user: 1, member: 1, isActive: 1 });
MedicationSchema.index({ user: 1, name: 1 });
// For refill-alerts query: { user, isActive: true, pillsRemaining <= refillThreshold }
MedicationSchema.index({ user: 1, isActive: 1, pillsRemaining: 1 });

module.exports = mongoose.model('Medication', MedicationSchema);
