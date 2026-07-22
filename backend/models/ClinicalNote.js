const mongoose = require('mongoose');

const ClinicalNoteSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    note: {
      type: String,
      required: [true, 'Clinical note content is required'],
    },
    category: {
      type: String,
      enum: ['general', 'diagnosis', 'prescription_note', 'follow_up', 'urgent'],
      default: 'general',
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// High Performance Compound Indexes
ClinicalNoteSchema.index({ patient: 1, doctor: 1, createdAt: -1 });
ClinicalNoteSchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.model('ClinicalNote', ClinicalNoteSchema);
