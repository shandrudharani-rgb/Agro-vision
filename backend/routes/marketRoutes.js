const express = require('express');
const router = express.Router();
const { list, create, update, remove } = require('../controllers/marketController');
const { protect, adminOnly } = require('../middleware/auth');

// Market prices are public read-only data; only administrators may change it.
router.get('/', list);
router.post('/', protect, adminOnly, create);
router.put('/:id', protect, adminOnly, update);
router.delete('/:id', protect, adminOnly, remove);

module.exports = router;
