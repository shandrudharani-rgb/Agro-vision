const express = require('express');
const router = express.Router();
const { calculate, getHistory } = require('../controllers/soilHealthController');
const { protect } = require('../middleware/auth');

router.post('/calculate', protect, calculate);
router.get('/history', protect, getHistory);

module.exports = router;
