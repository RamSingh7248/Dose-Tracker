const mongoose = require('mongoose');

const ExtractedMedicineSchema = new mongoose.Schema(
  {
    name:             { type: String, default: '' },
    dosage:           { type: String, default: '' },
    frequency:        { type: String, default: '' },
    duration:         { type: String, default: '' },
    instructions:     { type: String, default: '' },
    morning:          { type: Boolean, default: false },
    afternoon:        { type: Boolean, default: false },
    night:            { type: Boolean, default: false },
    foodInstructions: { type: String, enum: ['before_food', 'after_food', 'with_food', 'no_preference', ''], default: 'no_preference' },
  },
  { _id: false }
);

const PrescriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
      required: [true, 'File URL is required'],
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image'],
      required: true,
    },
    originalName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    extractedData: {
      medicines: [ExtractedMedicineSchema],
      rawText: { type: String, default: '' },
      notes: { type: String, default: '' },
      confidence: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'failed'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

PrescriptionSchema.index({ user: 1, createdAt: -1 });
PrescriptionSchema.index({ doctor: 1, createdAt: -1 });
PrescriptionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', PrescriptionSchema);
