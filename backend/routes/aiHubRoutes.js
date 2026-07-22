const express = require('express');
const router = express.Router();
const {
  processChat,
  analyzeFile,
  scanPrescription,
  clinicalAssistant,
  getSettings,
  updateSettings,
  getHistory,
  updateSession,
  deleteSession,
  getAnalytics,
} = require('../controllers/aiHubController');
const { protect } = require('../middleware/auth');

router.post('/chat', protect, processChat);
router.post('/analyze-file', protect, analyzeFile);
router.post('/scan-prescription', protect, scanPrescription);
router.post('/clinical-assistant', protect, clinicalAssistant);

router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSettings);

router.get('/history', protect, getHistory);
router.put('/session/:id', protect, updateSession);
router.delete('/session/:id', protect, deleteSession);

router.get('/analytics', protect, getAnalytics);

module.exports = router;
