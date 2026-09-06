const User = require('../models/User');

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['fullName', 'phone', 'state', 'district', 'village', 'avatar', 'primaryCrop'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.getNearbyFarmers = async (req, res, next) => {
  try {
    const { state, district } = req.user;
    const farmers = await User.find({
      _id: { $ne: req.user._id },
      role: 'farmer',
      state,
      district,
    }).select('fullName village district state avatar');

    res.json({ success: true, farmers });
  } catch (err) {
    next(err);
  }
};

exports.searchFarmers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = { role: 'farmer' };
    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { village: { $regex: q, $options: 'i' } },
        { district: { $regex: q, $options: 'i' } },
      ];
    }
    const farmers = await User.find(filter).select('fullName village district state avatar').limit(50);
    res.json({ success: true, farmers });
  } catch (err) {
    next(err);
  }
};
