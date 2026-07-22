const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getWeekly, getMonthly, getYearly, getHealthScore } = require('../controllers/adherenceController');

router.use(protect);

router.get('/weekly', getWeekly);
router.get('/monthly', getMonthly);
router.get('/yearly', getYearly);
router.get('/health-score', getHealthScore);

module.exports = router;
