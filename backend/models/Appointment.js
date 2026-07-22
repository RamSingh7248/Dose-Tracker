const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    doctorName: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Appointment title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['clinic', 'online', 'hospital', 'lab'],
      default: 'clinic',
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true,
    },
    appointmentTime: {
      type: String,
      default: '09:00',
    },
    location: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    isFollowUp: {
      type: Boolean,
      default: false,
    },
    followUpReason: {
      type: String,
      default: '',
    },
    rescheduledFromDate: {
      type: Date,
      default: null,
    },
    calendarExportToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// High Performance Compound Indexes
AppointmentSchema.index({ user: 1, appointmentDate: -1 });
AppointmentSchema.index({ doctor: 1, appointmentDate: -1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
