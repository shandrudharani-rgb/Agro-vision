const express = require('express');
const router = express.Router();
const { detectDisease, getHistory } = require('../controllers/diseaseController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/detect', protect, upload.single('leafImage'), detectDisease);
router.get('/history', protect, getHistory);

module.exports = router;
