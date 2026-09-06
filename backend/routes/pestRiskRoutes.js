const express = require('express');
const router = express.Router();
const { generate, list, dismiss, supportedCrops } = require('../controllers/pestRiskController');
const { protect } = require('../middleware/auth');

// NEW route, mounted at /api/pest-risk in server.js.
// Does not touch the existing /api/pest-alerts route/controller.
router.get('/', protect, list);
router.get('/supported-crops', protect, supportedCrops);
router.post('/generate', protect, generate);
router.put('/:id/dismiss', protect, dismiss);

module.exports = router;
