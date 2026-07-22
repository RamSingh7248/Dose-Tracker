const express = require('express');
const router = express.Router();
const { getReminders, createReminder, updateReminder, snoozeReminder, deleteReminder, testAlert } = require('../controllers/reminderController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/test-alert', testAlert);
router.route('/').get(getReminders).post(createReminder);
router.put('/:id/snooze', snoozeReminder);
router.route('/:id').put(updateReminder).delete(deleteReminder);

module.exports = router;
