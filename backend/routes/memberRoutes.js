const express = require('express');
const router = express.Router();
const { getMembers, createMember, updateMember, deleteMember } = require('../controllers/memberController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getMembers).post(createMember);
router.route('/:id').put(updateMember).delete(deleteMember);

module.exports = router;
