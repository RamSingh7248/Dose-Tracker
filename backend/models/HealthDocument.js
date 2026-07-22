const mongoose = require('mongoose');

const HealthDocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['prescription', 'report', 'scan', 'lab', 'insurance', 'vaccination', 'health_certificate', 'blood_report', 'x_ray', 'mri', 'ct_scan', 'lab_report', 'discharge_summary', 'other'],
      default: 'other',
    },
    folder: {
      type: String,
      default: 'General',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    versions: [
      {
        fileUrl: { type: String, required: true },
        originalName: { type: String, required: true },
        fileSize: { type: Number, required: true },
        fileType: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      }
    ],
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileType: {
      type: String,
      default: '',
    },
    originalName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    tags: [{ type: String }],
    notes: {
      type: String,
      default: '',
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedToken: {
      type: String,
      default: null,
    },
    sharedAt: {
      type: Date,
      default: null,
    },
    linkedPrescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      default: null,
    },
  },
  { timestamps: true }
);

HealthDocumentSchema.index({ user: 1, type: 1, createdAt: -1 });
HealthDocumentSchema.index({ user: 1, folder: 1 });

module.exports = mongoose.model('HealthDocument', HealthDocumentSchema);
