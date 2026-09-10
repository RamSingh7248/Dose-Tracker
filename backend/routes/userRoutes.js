const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getDoctorsList } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.get('/doctors', getDoctorsList);

module.exports = router;
