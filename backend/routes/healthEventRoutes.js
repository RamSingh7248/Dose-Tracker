const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getHealthEvents, createHealthEvent, updateHealthEvent, deleteHealthEvent } = require('../controllers/healthEventController');

router.use(protect);

router.get('/', getHealthEvents);
router.post('/', createHealthEvent);
router.put('/:id', updateHealthEvent);
router.delete('/:id', deleteHealthEvent);

module.exports = router;
