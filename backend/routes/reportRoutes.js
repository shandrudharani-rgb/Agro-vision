const express = require('express');
const router = express.Router();
const { generate, list, getOne } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.post('/generate', protect, generate);
router.get('/', protect, list);
router.get('/:id', protect, getOne);

module.exports = router;
