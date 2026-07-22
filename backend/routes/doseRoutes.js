const express = require('express');
const router = express.Router();
const { getDoses, logDose, getDoseStats, deleteDose } = require('../controllers/doseController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats', getDoseStats);
router.get('/', getDoses);
router.post('/log', logDose);
router.delete('/:id', deleteDose);

module.exports = router;
