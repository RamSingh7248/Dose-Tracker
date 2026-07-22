const express = require('express');
const router = express.Router();
const {
  getSystemSettings,
  updateSystemSettings,
  backupDatabase,
  resetSystemSettings,
} = require('../controllers/systemSettingsController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', getSystemSettings);
router.put('/', updateSystemSettings);
router.post('/backup', backupDatabase);
router.post('/reset', resetSystemSettings);

module.exports = router;
