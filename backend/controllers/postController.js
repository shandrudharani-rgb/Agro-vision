const Post = require('../models/Post');

exports.list = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('user', 'fullName village avatar')
      .populate('comments.user', 'fullName avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    const post = await Post.create({ user: req.user._id, text: req.body.text, image });
    await post.populate('user', 'fullName village avatar');
    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const idx = post.likes.findIndex((u) => u.toString() === req.user._id.toString());
    if (idx > -1) post.likes.splice(idx, 1);
    else post.likes.push(req.user._id);

    await post.save();
    res.json({ success: true, likes: post.likes });
  } catch (err) {
    next(err);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    post.comments.push({ user: req.user._id, text: req.body.text });
    await post.save();
    await post.populate('comments.user', 'fullName avatar');

    res.status(201).json({ success: true, comments: post.comments });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};
