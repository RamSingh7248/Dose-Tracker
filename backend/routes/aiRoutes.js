const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { askAI, explainMedication, checkInteractions } = require('../controllers/aiController');

router.use(protect);

router.post('/ask', askAI);
router.post('/explain-medication', explainMedication);
router.post('/check-interactions', checkInteractions);

module.exports = router;
