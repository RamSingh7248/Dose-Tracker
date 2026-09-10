const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      default: 'once_daily',
    },
    times: [{ type: String }],
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    instructions: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Discontinued'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

MedicineSchema.pre('save', function (next) {
  if (!this.user && this.patientId) {
    this.user = this.patientId;
  } else if (!this.patientId && this.user) {
    this.patientId = this.user;
  }
  next();
});

MedicineSchema.index({ patientId: 1, status: 1 });
MedicineSchema.index({ user: 1, status: 1 });

module.exports = mongoose.models.Medicine || mongoose.model('Medicine', MedicineSchema);
