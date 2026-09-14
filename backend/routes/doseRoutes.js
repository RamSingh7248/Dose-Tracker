const express = require('express');
const router = express.Router();
const {
  getTodayDoses,
  getDoseHistory,
  getDoseStats,
  markDoseTaken,
  markDoseSkipped,
  logDose,
  deleteDose,
  getPatientDoseHistory,
  getDoses,
} = require('../controllers/doseController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/today', getTodayDoses);
router.get('/history', getDoseHistory);
router.get('/stats', getDoseStats);
router.get('/', getDoses);
router.post('/log', logDose);
router.post('/', logDose);
router.put('/:id/taken', markDoseTaken);
router.put('/:id/skipped', markDoseSkipped);
router.delete('/:id', deleteDose);
router.get('/patient/:patientId', authorize('doctor', 'admin', 'ROLE_DOCTOR', 'ROLE_ADMIN'), getPatientDoseHistory);

module.exports = router;
