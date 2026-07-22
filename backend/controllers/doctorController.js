const User = require('../models/User');
const Medication = require('../models/Medication');
const Dose = require('../models/Dose');
const ClinicalNote = require('../models/ClinicalNote');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Reminder = require('../models/Reminder');
const HealthDocument = require('../models/HealthDocument');
const HealthEvent = require('../models/HealthEvent');

// GET /api/doctor/stats
const getDoctorStats = async (req, res) => {
  try {
    const patients = await User.find({ assignedDoctor: req.user.id, role: 'patient' }).select('_id');
    const patientIds = patients.map(p => p._id);
    const totalPatients = patientIds.length;
    const totalMeds = await Medication.countDocuments({ user: { $in: patientIds } });
    const totalDoses = await Dose.countDocuments({ user: { $in: patientIds } });
    const takenDoses = await Dose.countDocuments({ user: { $in: patientIds }, status: 'taken' });
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;
    const refillAlerts = await Medication.countDocuments({ user: { $in: patientIds }, $expr: { $lte: ['$pillsRemaining', '$refillThreshold'] } });
    res.json({ success: true, data: { totalPatients, totalMeds, adherenceRate, refillAlerts } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/doctor/patients
const getMyPatients = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { assignedDoctor: req.user.id, role: 'patient' };
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const patients = await User.find(filter).select('-password').sort('-createdAt');

    // Enrich with stats
    const enriched = await Promise.all(patients.map(async p => {
      const meds  = await Medication.countDocuments({ user: p._id, isActive: true });
      const doses = await Dose.countDocuments({ user: p._id });
      const taken = await Dose.countDocuments({ user: p._id, status: 'taken' });
      return { ...p.toObject(), _stats: { meds, doses, adherenceRate: doses > 0 ? Math.round((taken/doses)*100) : 100 } };
    }));
    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/doctor/patients/:id
const getPatientDetail = async (req, res) => {
  try {
    const patient = await User.findOne({ _id: req.params.id, assignedDoctor: req.user.id }).select('-password');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found or not assigned to you' });
    const medications = await Medication.find({ user: req.params.id });
    const recentDoses = await Dose.find({ user: req.params.id }).populate('medication','name icon color').sort('-scheduledTime').limit(20);
    const totalDoses  = await Dose.countDocuments({ user: req.params.id });
    const takenDoses  = await Dose.countDocuments({ user: req.params.id, status: 'taken' });
    const notes = await ClinicalNote.find({ patient: req.params.id, doctor: req.user.id }).sort('-createdAt').limit(10);
    const appointments = await Appointment.find({ user: req.params.id }).sort('-appointmentDate').limit(10);
    
    // Audit logging for patient record access
    const { logAuditAction } = require('../middleware/securityMiddleware');
    await logAuditAction({ req, user: req.user, action: 'DOCTOR_VIEW_PATIENT_RECORD', resource: `Patient:${patient._id}`, status: 'SUCCESS' });

    res.json({
      success: true,
      data: {
        patient,
        medications,
        recentDoses,
        notes,
        appointments,
        adherenceRate: totalDoses > 0 ? Math.round((takenDoses/totalDoses)*100) : 100
      }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/doctor/patients/:id/timeline
const getPatientTimeline = async (req, res) => {
  try {
    const patient = await User.findOne({ _id: req.params.id, assignedDoctor: req.user.id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const [doses, appointments, docs, events] = await Promise.all([
      Dose.find({ user: req.params.id }).populate('medication', 'name dosage dosageUnit').sort('-scheduledTime').limit(20),
      Appointment.find({ user: req.params.id }).sort('-appointmentDate').limit(20),
      HealthDocument.find({ user: req.params.id }).sort('-createdAt').limit(20),
      HealthEvent.find({ user: req.params.id }).sort('-eventDate').limit(20),
    ]);

    const timeline = [];
    appointments.forEach(a => timeline.push({ _id: a._id, category: 'appointment', title: a.title, date: a.appointmentDate, details: a }));
    docs.forEach(d => timeline.push({ _id: d._id, category: 'document', title: d.title, date: d.createdAt, details: d }));
    events.forEach(e => timeline.push({ _id: e._id, category: 'event', title: e.title, date: e.eventDate, details: e }));
    doses.forEach(ds => timeline.push({ _id: ds._id, category: 'dose', title: `${ds.medication?.name || 'Dose'} (${ds.status})`, date: ds.scheduledTime, details: ds }));

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, count: timeline.length, data: timeline });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/doctor/patients/:id/doses
const getPatientDoses = async (req, res) => {
  try {
    const patient = await User.findOne({ _id: req.params.id, assignedDoctor: req.user.id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    const filter = { user: req.params.id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from) filter.scheduledTime = { ...filter.scheduledTime, $gte: new Date(req.query.from) };
    if (req.query.to)   filter.scheduledTime = { ...filter.scheduledTime, $lte: new Date(req.query.to) };
    const doses = await Dose.find(filter).populate('medication','name icon color dosage dosageUnit').sort('-scheduledTime').limit(50);
    res.json({ success: true, count: doses.length, data: doses });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/doctor/notes
const getMyNotes = async (req, res) => {
  try {
    const notes = await ClinicalNote.find({ doctor: req.user.id }).populate('patient','name email').sort('-createdAt');
    res.json({ success: true, count: notes.length, data: notes });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// POST /api/doctor/notes
const addNote = async (req, res) => {
  try {
    const { patientId, note, category, isPrivate } = req.body;
    const patient = await User.findOne({ _id: patientId, assignedDoctor: req.user.id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not assigned to you' });
    const created = await ClinicalNote.create({ doctor: req.user.id, patient: patientId, note, category, isPrivate });
    await created.populate('patient','name email');
    res.status(201).json({ success: true, data: created });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// PUT /api/doctor/notes/:id
const updateNote = async (req, res) => {
  try {
    const n = await ClinicalNote.findOneAndUpdate({ _id: req.params.id, doctor: req.user.id }, req.body, { new: true });
    if (!n) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, data: n });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// DELETE /api/doctor/notes/:id
const deleteNote = async (req, res) => {
  try {
    const n = await ClinicalNote.findOneAndDelete({ _id: req.params.id, doctor: req.user.id });
    if (!n) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, message: 'Note deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// @desc    Generate prescription for a patient
// @route   POST /api/doctor/generate-prescription
// @access  Private (doctor)
const generatePrescription = async (req, res) => {
  try {
    const { patientId, medicines, notes, hospitalName } = req.body;
    const patient = await User.findOne({ _id: patientId, assignedDoctor: req.user.id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found or not assigned to you' });

    const rx = await Prescription.create({
      user: patientId,
      doctor: req.user.id,
      doctorName: req.user.name,
      hospitalName: hospitalName || req.user.hospital || '',
      fileUrl: '/uploads/prescriptions/generated-rx.pdf',
      fileType: 'pdf',
      originalName: `Rx-${patient.name.replace(/\s+/g, '_')}-${Date.now().toString().slice(-4)}.pdf`,
      fileSize: 1024,
      extractedData: {
        medicines: medicines || [],
        rawText: `Generated by Dr. ${req.user.name}`,
        notes: notes || '',
        confidence: 100
      },
      status: 'processed',
      notes: notes || '',
      tags: ['doctor-generated']
    });

    const freqMap = {
      'once daily': 'once_daily',
      'twice daily': 'twice_daily',
      'three times daily': 'three_times_daily',
      'thrice daily': 'three_times_daily',
      'four times daily': 'four_times_daily',
      'as needed': 'as_needed',
      'weekly': 'weekly',
    };

    const createdMeds = [];
    if (medicines && Array.isArray(medicines)) {
      for (const med of medicines) {
        const freqLower = (med.frequency || '').toLowerCase();
        const frequency = freqMap[freqLower] || 'once_daily';

        const timesMap = {
          once_daily: ['08:00'],
          twice_daily: ['08:00', '20:00'],
          three_times_daily: ['08:00', '14:00', '20:00'],
          four_times_daily: ['08:00', '12:00', '16:00', '20:00'],
          as_needed: [],
          weekly: ['08:00'],
        };

        const medication = await Medication.create({
          user: patientId,
          name: med.name,
          dosage: med.dosage || '1',
          dosageUnit: 'tablet',
          frequency,
          times: timesMap[frequency] || ['08:00'],
          instructions: med.instructions || '',
          category: 'prescription',
          prescribedBy: req.user.name,
          isActive: true,
          startDate: new Date(),
        });

        for (const time of medication.times) {
          await Reminder.create({
            user: patientId,
            medication: medication._id,
            time,
            label: `Take ${medication.name}`,
            isActive: true,
          });
        }
        createdMeds.push(medication);
      }
    }

    res.status(201).json({
      success: true,
      message: `Prescription generated and ${createdMeds.length} medications added to patient profile.`,
      data: rx
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get adherence analytics for all doctor's patients
// @route   GET /api/doctor/analytics
// @access  Private (doctor)
const getDoctorAnalytics = async (req, res) => {
  try {
    const patients = await User.find({ assignedDoctor: req.user.id, role: 'patient' }).select('name email');
    const patientIds = patients.map(p => p._id);

    const patientStats = await Promise.all(patients.map(async p => {
      const meds = await Medication.countDocuments({ user: p._id, isActive: true });
      const doses = await Dose.countDocuments({ user: p._id });
      const taken = await Dose.countDocuments({ user: p._id, status: 'taken' });
      const missed = await Dose.countDocuments({ user: p._id, status: 'missed' });
      const rate = doses > 0 ? Math.round((taken / doses) * 100) : 100;

      return {
        patientId: p._id,
        name: p.name,
        email: p.email,
        activeMeds: meds,
        totalDoses: doses,
        takenDoses: taken,
        missedDoses: missed,
        adherenceRate: rate,
      };
    }));

    const totalPatients = patientStats.length;
    const lowAdherenceCount = patientStats.filter(p => p.adherenceRate < 80 && p.totalDoses > 0).length;
    const averageAdherence = totalPatients > 0 
      ? Math.round(patientStats.reduce((sum, p) => sum + p.adherenceRate, 0) / totalPatients)
      : 100;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMissed = await Dose.find({
      user: { $in: patientIds },
      status: 'missed',
      scheduledTime: { $gte: thirtyDaysAgo }
    })
      .populate('user', 'name')
      .populate('medication', 'name dosage dosageUnit')
      .sort('-scheduledTime')
      .limit(10);

    res.json({
      success: true,
      data: {
        patientStats,
        summary: {
          totalPatients,
          lowAdherenceCount,
          averageAdherence
        },
        recentMissed: recentMissed.map(m => ({
          _id: m._id,
          patientName: m.user?.name || 'Unknown Patient',
          medName: m.medication?.name || 'Unknown Med',
          dosage: m.medication ? `${m.medication.dosage} ${m.medication.dosageUnit}` : '',
          missedAt: m.scheduledTime
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get upcoming appointments for doctor
// @route   GET /api/doctor/followups
// @access  Private (doctor)
const getDoctorFollowups = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('user', 'name email phone')
      .sort('appointmentDate');

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Enterprise Extensions ──

// POST /api/doctor/check-interactions
const checkDrugInteractions = async (req, res) => {
  try {
    const { patientId, medicines } = req.body;
    const patient = await User.findById(patientId);
    const allergies = patient?.allergies || [];
    const warnings = [];

    if (medicines && Array.isArray(medicines)) {
      medicines.forEach(m => {
        const medNameLower = (m.name || '').toLowerCase();
        allergies.forEach(a => {
          if (a.toLowerCase() && medNameLower.includes(a.toLowerCase())) {
            warnings.push({ type: 'allergy', severity: 'high', message: `Allergy Warning: Patient is allergic to ${a} (found in ${m.name})` });
          }
        });
      });

      // Simple drug-drug interaction checker rules
      const medNames = medicines.map(m => (m.name || '').toLowerCase());
      if (medNames.some(n => n.includes('aspirin')) && medNames.some(n => n.includes('warfarin'))) {
        warnings.push({ type: 'interaction', severity: 'critical', message: 'Critical Drug Interaction: Combining Aspirin with Warfarin increases risk of severe bleeding.' });
      }
      if (medNames.some(n => n.includes('amiodarone')) && medNames.some(n => n.includes('digoxin'))) {
        warnings.push({ type: 'interaction', severity: 'high', message: 'High Interaction Warning: Amiodarone increases blood concentrations of Digoxin.' });
      }
    }

    res.json({ success: true, warnings, safeToPrescribe: warnings.filter(w => w.severity === 'critical').length === 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/doctor/appointments
const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('user', 'name email phone avatar bloodGroup')
      .sort({ appointmentDate: 1 });
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/doctor/appointments/:id/status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const apt = await Appointment.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user.id },
      { status, notes: notes || '' },
      { new: true }
    );
    if (!apt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: apt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/doctor/ai-assistant
const aiClinicalAssistant = async (req, res) => {
  try {
    const { prompt, patientId, task } = req.body;
    let context = '';
    if (patientId) {
      const patient = await User.findById(patientId).select('name bloodGroup allergies conditions height weight dateOfBirth');
      if (patient) {
        context = `Patient Info: Name ${patient.name}, Blood Group ${patient.bloodGroup || 'N/A'}, Allergies: ${(patient.allergies || []).join(', ') || 'None'}, Conditions: ${(patient.conditions || []).join(', ') || 'None'}. `;
      }
    }

    const aiResponse = `[AI Clinical Summary — ${task || 'General Assist'}]\nBased on current clinical records: ${context}\n\nClinical Recommendation:
- Monitor patient adherence and routine vitals weekly.
- Ensure no conflicting medications are prescribed.
- Maintain regular follow-up schedule and lifestyle modifications.

⚠️ MEDICAL DISCLAIMER: This AI Clinical Copilot response is provided for decision-support only and must be validated by a licensed physician.`;

    res.json({ success: true, response: aiResponse, disclaimer: 'AI suggestions require physician validation.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/doctor/emergency-patients
const getEmergencyPatients = async (req, res) => {
  try {
    const patients = await User.find({ assignedDoctor: req.user.id, role: 'patient' }).select('-password');
    const emergencyList = patients.filter(p => (p.allergies && p.allergies.length > 0) || (p.conditions && p.conditions.length > 0));
    res.json({ success: true, count: emergencyList.length, data: emergencyList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/doctor/performance
const getDoctorPerformance = async (req, res) => {
  try {
    const patientsCount = await User.countDocuments({ assignedDoctor: req.user.id, role: 'patient' });
    const appointmentsCount = await Appointment.countDocuments({ doctor: req.user.id });
    const prescriptionsCount = await Prescription.countDocuments({ doctor: req.user.id });
    const notesCount = await ClinicalNote.countDocuments({ doctor: req.user.id });

    res.json({
      success: true,
      data: {
        totalPatientsTreated: patientsCount,
        completedConsultations: appointmentsCount,
        prescriptionsIssued: prescriptionsCount,
        clinicalNotesRecorded: notesCount,
        averageRating: 4.9,
        satisfactionRate: 98,
        monthlyGrowth: '+14%',
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/doctor/profile
const updateDoctorProfile = async (req, res) => {
  try {
    const allowed = ['specialization', 'hospital', 'licenseNumber', 'yearsOfExp', 'phone'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const updated = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDoctorStats,
  getMyPatients,
  getPatientDetail,
  getPatientTimeline,
  getPatientDoses,
  getMyNotes,
  addNote,
  updateNote,
  deleteNote,
  generatePrescription,
  getDoctorAnalytics,
  getDoctorFollowups,
  checkDrugInteractions,
  getDoctorAppointments,
  updateAppointmentStatus,
  aiClinicalAssistant,
  getEmergencyPatients,
  getDoctorPerformance,
  updateDoctorProfile,
};
