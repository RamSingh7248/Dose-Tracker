const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, updateMe, changePassword, exportUserData, refreshTokenEndpoint, logout, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/refresh', refreshTokenEndpoint);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-password/:resetToken', resetPassword);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);
router.get('/export-data', protect, exportUserData);

module.exports = router;
