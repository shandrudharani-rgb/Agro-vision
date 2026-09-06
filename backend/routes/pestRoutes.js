const express = require('express');
const router = express.Router();
const { list, create, subscribe, unsubscribe } = require('../controllers/pestController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, list);
router.post('/', protect, adminOnly, create);
router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);

module.exports = router;
