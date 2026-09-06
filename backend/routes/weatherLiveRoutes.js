const express = require('express');
const router = express.Router();
const { getLive } = require('../controllers/weatherLiveController');
const { protect } = require('../middleware/auth');

// NEW route, mounted at /api/weather-live in server.js.
// Does not touch the existing /api/weather route/controller.
router.get('/', protect, getLive);

module.exports = router;
