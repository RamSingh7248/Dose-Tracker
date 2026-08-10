const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { emitDashboardEvent } = require('../services/socketEmitter');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    if (req.query.type && req.query.type !== 'all') filter.type = req.query.type;
    if (req.query.isFollowUp) filter.isFollowUp = req.query.isFollowUp === 'true';
    
    if (req.query.from || req.query.to) {
      filter.appointmentDate = {};
      if (req.query.from) filter.appointmentDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.appointmentDate.$lte = new Date(req.query.to);
    }

    const appointments = await Appointment.find(filter)
      .populate('doctor', 'name email specialization hospital')
      .populate('followUpOf', 'title appointmentDate doctorName')
      .sort('appointmentDate')
      .lean();

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get upcoming appointments (next 30 days)
// @route   GET /api/appointments/upcoming
// @access  Private
const getUpcoming = async (req, res) => {
  try {
    const now = new Date();
    now.setHours(0,0,0,0);
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    const appointments = await Appointment.find({
      user: req.user.id,
      appointmentDate: { $gte: now, $lte: nextMonth },
      status: { $in: ['scheduled', 'rescheduled'] },
    })
      .populate('doctor', 'name specialization')
      .populate('followUpOf', 'title appointmentDate')
      .sort('appointmentDate')
      .lean();

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, user: req.user.id })
      .populate('doctor', 'name email specialization hospital')
      .populate('followUpOf', 'title appointmentDate doctorName')
      .lean();
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
  try {
    req.body.user = req.user.id;
    if (!req.body.doctor) req.body.doctor = null;
    if (!req.body.followUpOf) req.body.followUpOf = null;

    // Prevent duplicate record creation on double submit
    if (req.body.title && req.body.appointmentDate) {
      const existing = await Appointment.findOne({
        user: req.user.id,
        title: req.body.title,
        appointmentDate: new Date(req.body.appointmentDate),
        appointmentTime: req.body.appointmentTime || '09:00',
      }).populate('doctor', 'name email specialization hospital');

      if (existing) {
        return res.status(200).json({ success: true, data: existing, message: 'Existing appointment retrieved' });
      }
    }

    const appointment = await Appointment.create(req.body);
    await appointment.populate('doctor', 'name email specialization hospital');

    // Create automatic notification for appointment
    const dateStr = new Date(appointment.appointmentDate).toLocaleDateString();
    await Notification.create({
      user: req.user.id,
      title: `📅 Appointment Scheduled: ${appointment.title}`,
      message: `Appointment with ${appointment.doctorName || 'Doctor'} set for ${dateStr} at ${appointment.appointmentTime || 'scheduled time'}.`,
      type: 'followup',
      referenceId: appointment._id,
      referenceModel: 'Appointment',
    });

    // 🔴 Real-time dashboard update
    emitDashboardEvent('appointment.created', {
      appointmentId: appointment._id,
      userId: req.user.id,
      title: appointment.title,
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Schedule Doctor Follow-Up Appointment
// @route   POST /api/appointments/follow-up
// @access  Private
const scheduleFollowUp = async (req, res) => {
  try {
    const { doctorName, title, appointmentDate, appointmentTime, location, type, notes, followUpOf, followUpReason } = req.body;

    const followUpData = {
      user: req.user.id,
      doctorName: doctorName || 'Doctor',
      title: title || `Follow-up with ${doctorName || 'Doctor'}`,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime || '09:00',
      location: location || 'Clinic / Online',
      type: type || 'clinic',
      notes: notes || '',
      isFollowUp: true,
      followUpOf: followUpOf || null,
      followUpReason: followUpReason || 'Routine Follow-Up',
      status: 'scheduled',
    };

    const appointment = await Appointment.create(followUpData);

    const dateStr = new Date(appointment.appointmentDate).toLocaleDateString();
    await Notification.create({
      user: req.user.id,
      title: `🩺 Doctor Follow-Up Scheduled`,
      message: `Follow-up with ${appointment.doctorName} scheduled for ${dateStr} at ${appointment.appointmentTime}.`,
      type: 'followup',
      referenceId: appointment._id,
      referenceModel: 'Appointment',
    });

    // 🔴 Real-time dashboard update
    emitDashboardEvent('appointment.created', {
      appointmentId: appointment._id,
      userId: req.user.id,
      isFollowUp: true,
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('doctor', 'name email specialization hospital');

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // 🔴 Real-time: status change (e.g. completed, cancelled)
    emitDashboardEvent('appointment.updated', {
      appointmentId: appointment._id,
      status: appointment.status,
      userId: req.user.id,
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private
const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentDate, appointmentTime, notes } = req.body;
    
    const existing = await Appointment.findOne({ _id: req.params.id, user: req.user.id });
    if (!existing) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const rescheduledFromDate = existing.appointmentDate;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        appointmentDate: new Date(appointmentDate),
        appointmentTime: appointmentTime || existing.appointmentTime,
        status: 'rescheduled',
        notes: notes !== undefined ? notes : existing.notes,
        rescheduledFromDate,
        reminderSent: false,
      },
      { new: true, runValidators: true }
    ).populate('doctor', 'name email specialization hospital');

    const newDateStr = new Date(appointment.appointmentDate).toLocaleDateString();
    await Notification.create({
      user: req.user.id,
      title: `🔄 Appointment Rescheduled: ${appointment.title}`,
      message: `Your appointment with ${appointment.doctorName || 'Doctor'} has been moved to ${newDateStr} at ${appointment.appointmentTime}.`,
      type: 'followup',
      referenceId: appointment._id,
      referenceModel: 'Appointment',
    });

    // 🔴 Real-time dashboard update
    emitDashboardEvent('appointment.updated', {
      appointmentId: appointment._id,
      status: appointment.status,
      userId: req.user.id,
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download iCalendar (.ics) export
// @route   GET /api/appointments/:id/ics
// @access  Private
const downloadIcs = async (req, res) => {
  try {
    const app = await Appointment.findOne({ _id: req.params.id, user: req.user.id });
    if (!app) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const startDate = new Date(app.appointmentDate);
    if (app.appointmentTime) {
      const [h, m] = app.appointmentTime.split(':').map(Number);
      startDate.setHours(h, m, 0, 0);
    }
    const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 minutes duration

    const formatDateForIcs = (date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DoseTracker//Health Appointments//EN',
      'BEGIN:VEVENT',
      `UID:${app._id}@dosetracker.app`,
      `DTSTAMP:${formatDateForIcs(new Date())}`,
      `DTSTART:${formatDateForIcs(startDate)}`,
      `DTEND:${formatDateForIcs(endDate)}`,
      `SUMMARY:${app.title} - ${app.doctorName || 'Doctor Consultation'}`,
      `DESCRIPTION:${app.notes || 'DoseTracker scheduled medical appointment'}`,
      `LOCATION:${app.location || 'Clinic / Virtual Medical Room'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="appointment-${app._id}.ics"`);
    res.send(icsContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // 🔴 Real-time
    emitDashboardEvent('appointment.deleted', { appointmentId: req.params.id, userId: req.user.id });

    res.json({ success: true, message: 'Appointment removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAppointments,
  getUpcoming,
  getAppointment,
  createAppointment,
  scheduleFollowUp,
  updateAppointment,
  rescheduleAppointment,
  downloadIcs,
  deleteAppointment,
};
