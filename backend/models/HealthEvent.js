const mongoose = require('mongoose');

const HealthEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'appointment', 'medication_start', 'medication_end',
        'vaccination', 'lab_test', 'doctor_visit',
        'surgery', 'diagnosis', 'allergy', 'other',
      ],
      default: 'other',
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    description: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    linkedAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    linkedMedication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      default: null,
    },
    attachments: [{ type: String }],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

HealthEventSchema.index({ user: 1, eventDate: -1 });

module.exports = mongoose.model('HealthEvent', HealthEventSchema);
