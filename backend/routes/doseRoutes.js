const express = require('express');
const router = express.Router();
const { getTodayDoses, getDoseHistory, markDoseTaken, markDoseSkipped, getPatientDoseHistory, getDoses } = require('../controllers/doseController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/today', getTodayDoses);
router.get('/history', getDoseHistory);
router.get('/', getDoses);
router.put('/:id/taken', markDoseTaken);
router.put('/:id/skipped', markDoseSkipped);
router.get('/patient/:patientId', authorize('doctor', 'admin', 'ROLE_DOCTOR', 'ROLE_ADMIN'), getPatientDoseHistory);

module.exports = router;
