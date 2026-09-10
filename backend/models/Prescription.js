const mongoose = require('mongoose');

const ExtractedMedicineSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    duration: { type: String, default: '' },
    instructions: { type: String, default: '' },
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },
    night: { type: Boolean, default: false },
    foodInstructions: { type: String, default: 'no_preference' },
  },
  { _id: false }
);

const PrescriptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    doctorName: {
      type: String,
      default: '',
    },
    hospitalName: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image', 'digital', ''],
      default: 'digital',
    },
    originalName: {
      type: String,
      default: '',
    },
    medicines: [ExtractedMedicineSchema],
    diagnosis: {
      type: String,
      default: '',
    },
    instructions: {
      type: String,
      default: '',
    },
    prescriptionDate: {
      type: Date,
      default: Date.now,
    },
    extractedData: {
      medicines: [ExtractedMedicineSchema],
      rawText: { type: String, default: '' },
      notes: { type: String, default: '' },
      confidence: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'failed', 'active'],
      default: 'processed',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

PrescriptionSchema.pre('save', function (next) {
  if (!this.patientId && this.user) this.patientId = this.user;
  if (!this.user && this.patientId) this.user = this.patientId;
  if (!this.doctorId && this.doctor) this.doctorId = this.doctor;
  if (!this.doctor && this.doctorId) this.doctor = this.doctorId;
  next();
});

PrescriptionSchema.index({ patientId: 1, createdAt: -1 });
PrescriptionSchema.index({ user: 1, createdAt: -1 });
PrescriptionSchema.index({ doctorId: 1, createdAt: -1 });
PrescriptionSchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);
