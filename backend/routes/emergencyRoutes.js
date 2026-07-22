const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getEmergencyCard, updateEmergencyCard, getPublicEmergencyCard } = require('../controllers/emergencyController');

// Public route (for QR scan)
router.get('/qr/:userId', getPublicEmergencyCard);

// Protected routes
router.get('/', protect, getEmergencyCard);
router.put('/', protect, updateEmergencyCard);

module.exports = router;
