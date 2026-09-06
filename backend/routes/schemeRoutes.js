const express = require('express');
const router = express.Router();
const { list, getOne, create, update, remove } = require('../controllers/schemeController');
const { protect, adminOnly } = require('../middleware/auth');

// Scheme information is public. Keep mutations behind the existing admin
// authentication so the page can load before a user signs in.
router.get('/', list);
router.get('/:id', getOne);
router.post('/', protect, adminOnly, create);
router.put('/:id', protect, adminOnly, update);
router.delete('/:id', protect, adminOnly, remove);

module.exports = router;
