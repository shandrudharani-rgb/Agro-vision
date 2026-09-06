const crypto = require('crypto');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const generateToken = require('../utils/generateToken');

// @route POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, confirmPassword, state, district, village } = req.body;

    if (!fullName || !email || !phone || !password || !confirmPassword || !state || !district || !village) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ fullName, email, phone, password, state, district, village });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // A successful sign-in starts a new private AI-chat session. The user
    // filter ensures no other farmer's conversation can be removed.
    await ChatMessage.deleteMany({ user: user._id });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });

    // Always respond success to avoid leaking which emails exist
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been generated.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // In production this would be emailed. Returned here so the flow is testable end-to-end.
    res.json({
      success: true,
      message: 'Password reset token generated.',
      resetToken,
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};
