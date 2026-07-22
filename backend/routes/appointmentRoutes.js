const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAppointments,
  getUpcoming,
  getAppointment,
  createAppointment,
  scheduleFollowUp,
  updateAppointment,
  rescheduleAppointment,
  downloadIcs,
  deleteAppointment,
} = require('../controllers/appointmentController');

router.use(protect);

router.get('/', getAppointments);
router.get('/upcoming', getUpcoming);
router.post('/', createAppointment);
router.post('/follow-up', scheduleFollowUp);
router.get('/:id', getAppointment);
router.get('/:id/ics', downloadIcs);
router.put('/:id', updateAppointment);
router.put('/:id/reschedule', rescheduleAppointment);
router.delete('/:id', deleteAppointment);

module.exports = router;
