const express = require('express');
const router = express.Router();
const { list, create, toggleLike, addComment, remove } = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, list);
router.post('/', protect, upload.single('image'), create);
router.put('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, addComment);
router.delete('/:id', protect, remove);

module.exports = router;
