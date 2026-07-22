const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, updateMe, changePassword, exportUserData } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);
router.get('/export-data', protect, exportUserData);

module.exports = router;
