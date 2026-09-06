const express = require('express');
const router = express.Router();
const { getLive } = require('../controllers/marketLiveController');
const { protect } = require('../middleware/auth');

// NEW route, mounted at /api/market-live in server.js.
// Does not touch the existing /api/market CRUD routes/controller.
router.get('/', protect, getLive);

module.exports = router;
