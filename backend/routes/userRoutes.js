const express = require('express');
const router = express.Router();
const { updateProfile, getNearbyFarmers, searchFarmers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.put('/profile', protect, updateProfile);
router.get('/nearby', protect, getNearbyFarmers);
router.get('/search', protect, searchFarmers);

module.exports = router;
