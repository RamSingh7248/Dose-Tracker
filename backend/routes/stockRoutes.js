const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPredictions, restock } = require('../controllers/stockController');

router.use(protect);

router.get('/predictions', getPredictions);
router.put('/:id/restock', restock);

module.exports = router;
