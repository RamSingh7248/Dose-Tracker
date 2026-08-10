const Dose = require('../models/Dose');
const Appointment = require('../models/Appointment');
const HealthEvent = require('../models/HealthEvent');
const Medication = require('../models/Medication');
const HealthDocument = require('../models/HealthDocument');

// @desc    Get aggregated health timeline with search & category filters
// @route   GET /api/timeline
// @access  Private
const getTimeline = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 100;
    const { search, category } = req.query; // category: 'all', 'appointment', 'medication', 'report', 'doctor_visit', 'lab_test', 'vaccination', 'hospital_visit'

    const searchRegex = search ? new RegExp(search, 'i') : null;
    let timelineItems = [];

    // 1. Appointments & Doctor Visits
    if (!category || category === 'all' || category === 'appointment' || category === 'doctor_visit') {
      const appFilter = { user: userId };
      if (searchRegex) appFilter.$or = [{ title: searchRegex }, { doctorName: searchRegex }, { notes: searchRegex }, { location: searchRegex }];

      const appointments = await Appointment.find(appFilter)
        .populate('doctor', 'name specialization')
        .sort('-appointmentDate')
        .limit(limit)
        .lean();

      appointments.forEach(a => {
        timelineItems.push({
          _id: a._id,
          category: 'appointment',
          subType: a.type || 'doctor_visit',
          title: a.title,
          date: a.appointmentDate,
          icon: a.type === 'online' ? '💻' : a.type === 'lab' ? '🧪' : '👨‍⚕️',
          color: '#6366f1',
          status: a.status,
          details: {
            doctor: a.doctorName || a.doctor?.name || 'Doctor',
            location: a.location || 'Clinic',
            type: a.type,
            time: a.appointmentTime,
            notes: a.notes,
          },
        });
      });
    }

    // 2. Medications
    if (!category || category === 'all' || category === 'medication') {
      const medFilter = { user: userId };
      if (searchRegex) medFilter.$or = [{ name: searchRegex }, { instructions: searchRegex }, { category: searchRegex }];

      const meds = await Medication.find(medFilter).sort('-createdAt').limit(limit).lean();
      meds.forEach(m => {
        timelineItems.push({
          _id: m._id,
          category: 'medication',
          subType: 'medication_start',
          title: `Started ${m.name}`,
          date: m.startDate || m.createdAt,
          icon: m.icon || '💊',
          color: m.color || '#8b5cf6',
          status: m.isActive ? 'active' : 'completed',
          details: {
            dosage: `${m.dosage} ${m.dosageUnit}`,
            frequency: m.frequency,
            prescribedBy: m.prescribedBy,
            instructions: m.instructions,
          },
        });
        if (m.endDate) {
          timelineItems.push({
            _id: `${m._id}-end`,
            category: 'medication',
            subType: 'medication_end',
            title: `Completed ${m.name}`,
            date: m.endDate,
            icon: '✅',
            color: '#10b981',
            status: 'completed',
            details: { dosage: `${m.dosage} ${m.dosageUnit}` },
          });
        }
      });
    }

    // 3. Health Vault Documents (Reports, Lab Tests, Scans)
    if (!category || category === 'all' || category === 'report' || category === 'lab_test') {
      const docFilter = { user: userId, isDeleted: false };
      if (searchRegex) docFilter.$or = [{ title: searchRegex }, { notes: searchRegex }, { type: searchRegex }];

      const docs = await HealthDocument.find(docFilter).sort('-createdAt').limit(limit).lean();
      docs.forEach(d => {
        const iconMap = {
          prescription: '📋', blood_report: '🩸', lab_report: '🧪',
          scan: '🩻', x_ray: '🩻', mri: '🧠', ct_scan: '🏥',
          vaccination: '💉', insurance: '🛡️', discharge_summary: '📑', other: '📁'
        };

        timelineItems.push({
          _id: d._id,
          category: 'report',
          subType: d.type,
          title: d.title,
          date: d.createdAt,
          icon: iconMap[d.type] || '📄',
          color: '#06b6d4',
          status: 'uploaded',
          details: {
            fileUrl: d.fileUrl,
            fileSize: d.fileSize,
            fileType: d.fileType,
            typeLabel: d.type.replace('_', ' '),
            notes: d.notes,
          },
        });
      });
    }

    // 4. Health Events (Vaccinations, Hospital Visits, Lab Tests, Symptoms)
    if (!category || category === 'all' || category === 'events' || category === 'vaccination' || category === 'hospital_visit' || category === 'lab_test') {
      const eventFilter = { user: userId };
      if (searchRegex) eventFilter.$or = [{ title: searchRegex }, { description: searchRegex }, { type: searchRegex }];

      const events = await HealthEvent.find(eventFilter).sort('-eventDate').limit(limit).lean();
      events.forEach(e => {
        const iconMap = {
          vaccination: '💉', lab_test: '🧪', doctor_visit: '👨‍⚕️',
          surgery: '🏥', hospital_visit: '🏥', diagnosis: '📋', allergy: '⚠️', other: '📌',
        };

        timelineItems.push({
          _id: e._id,
          category: 'event',
          subType: e.type,
          title: e.title,
          date: e.eventDate,
          icon: iconMap[e.type] || '📌',
          color: e.severity === 'high' ? '#f43f5e' : e.severity === 'medium' ? '#f59e0b' : '#10b981',
          status: e.severity || 'info',
          details: {
            type: e.type,
            description: e.description,
            severity: e.severity,
          },
        });
      });
    }

    // Filter by specific sub-category if requested
    if (category && !['all', 'appointment', 'medication', 'report', 'events'].includes(category)) {
      timelineItems = timelineItems.filter(item => item.subType === category);
    }

    // Sort all timeline items by date descending
    timelineItems.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      count: timelineItems.length,
      data: timelineItems.slice(0, limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTimeline };
