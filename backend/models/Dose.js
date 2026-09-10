const mongoose = require('mongoose');

const DoseSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
    },
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    takenAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Taken', 'Skipped', 'Missed', 'pending', 'taken', 'skipped', 'missed'],
      default: 'Scheduled',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

DoseSchema.pre('save', function (next) {
  if (!this.patientId && this.user) this.patientId = this.user;
  if (!this.user && this.patientId) this.user = this.patientId;
  if (!this.medicineId && this.medication) this.medicineId = this.medication;
  if (!this.medication && this.medicineId) this.medication = this.medicineId;
  next();
});

DoseSchema.index({ patientId: 1, scheduledDate: -1 });
DoseSchema.index({ user: 1, scheduledDate: -1 });

module.exports = mongoose.models.Dose || mongoose.model('Dose', DoseSchema);
