const express = require('express');
const router = express.Router();
const { list, markRead, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// NEW route, mounted at /api/notifications in server.js.
router.get('/', protect, list);
router.put('/:id/read', protect, markRead);
router.put('/read-all', protect, markAllRead);

module.exports = router;
