const express = require('express');
const router = express.Router();
const { getRecommendation, getHistory } = require('../controllers/cropController');
const { protect } = require('../middleware/auth');

router.post('/recommend', protect, getRecommendation);
router.get('/history', protect, getHistory);

module.exports = router;
