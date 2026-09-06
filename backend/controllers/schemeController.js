const GovernmentScheme = require('../models/GovernmentScheme');

exports.list = async (req, res, next) => {
  try {
    // NOTE: govtLevel/state/cropCategory are NEW optional filters. When the
    // client doesn't send them (as the existing Schemes.js page currently
    // doesn't), behavior is identical to before.
    const { search, category, government, govtLevel, state, cropCategory, crop } = req.query;
    const filter = {};
    const andFilters = [];
    if (search?.trim()) filter.title = { $regex: search.trim(), $options: 'i' };
    if (category?.trim()) filter.category = { $regex: category.trim(), $options: 'i' };
    const requestedGovernment = (government || govtLevel)?.trim();
    if (requestedGovernment) {
      const governmentLevels = {
        'Central Government': 'central',
        central: 'central',
        'Tamil Nadu Government': 'tamil_nadu',
        tamil_nadu: 'tamil_nadu',
      };
      const govtLevelValue = governmentLevels[requestedGovernment];
      // `govtLevel` keeps the existing UI compatible; `government` is the
      // readable API/database field required for Tamil Nadu scheme requests.
      filter.$or = govtLevelValue
        ? [{ govtLevel: govtLevelValue }, { government: requestedGovernment }]
        : [{ government: requestedGovernment }, { govtLevel: requestedGovernment }];
    }
    if ((cropCategory || crop)?.trim()) {
      const pattern = { $regex: (cropCategory || crop).trim(), $options: 'i' };
      // The UI's single crop/category field intentionally searches both the
      // crop classification and the scheme's broader category.
      andFilters.push({ $or: [{ cropCategory: pattern }, { category: pattern }] });
    }
    if (state) {
      andFilters.push({ $or: [
        { applicableStates: { $size: 0 } },
        { applicableStates: { $exists: false } },
        { applicableStates: state },
      ] });
    }
    if (andFilters.length) filter.$and = andFilters;

    const schemes = await GovernmentScheme.find(filter).sort({ lastUpdated: -1, createdAt: -1 });
    res.json({ success: true, schemes });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const scheme = await GovernmentScheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    res.json({ success: true, scheme });
  } catch (err) {
    next(err);
  }
};

// Admin only
exports.create = async (req, res, next) => {
  try {
    const scheme = await GovernmentScheme.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, scheme });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const scheme = await GovernmentScheme.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    res.json({ success: true, scheme });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await GovernmentScheme.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
