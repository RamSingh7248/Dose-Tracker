const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/doctorController');

router.use(protect, authorize('doctor', 'admin'));

router.get('/stats', getDoctorStats);
router.get('/patients', getMyPatients);
router.get('/patients/:id', getPatientDetail);
router.get('/patients/:id/timeline', getPatientTimeline);
router.get('/patients/:id/doses', getPatientDoses);
router.get('/notes', getMyNotes);
router.post('/notes', addNote);
router.put('/notes/:id', updateNote);
router.delete('/notes/:id', deleteNote);

// ── Doctor Portal Extensions ──
router.post('/generate-prescription', generatePrescription);
router.get('/analytics', getDoctorAnalytics);
router.get('/followups', getDoctorFollowups);

// ── Enterprise Modules ──
router.post('/check-interactions', checkDrugInteractions);
router.get('/appointments', getDoctorAppointments);
router.put('/appointments/:id/status', updateAppointmentStatus);
router.post('/ai-assistant', aiClinicalAssistant);
router.get('/emergency-patients', getEmergencyPatients);
router.get('/performance', getDoctorPerformance);
router.put('/profile', updateDoctorProfile);

module.exports = router;
