const { PestAlert, PestAlertSubscription } = require('../models/PestAlert');

exports.list = async (req, res, next) => {
  try {
    const { state, district, crop, season } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (district) filter.district = district;
    if (crop) filter.crop = crop;
    if (season) filter.season = season;

    const alerts = await PestAlert.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, alerts });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const alert = await PestAlert.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};

exports.subscribe = async (req, res, next) => {
  try {
    const sub = await PestAlertSubscription.findOneAndUpdate(
      { user: req.user._id },
      { subscribed: true },
      { upsert: true, new: true }
    );
    res.json({ success: true, subscription: sub });
  } catch (err) {
    next(err);
  }
};

exports.unsubscribe = async (req, res, next) => {
  try {
    const sub = await PestAlertSubscription.findOneAndUpdate(
      { user: req.user._id },
      { subscribed: false },
      { upsert: true, new: true }
    );
    res.json({ success: true, subscription: sub });
  } catch (err) {
    next(err);
  }
};
