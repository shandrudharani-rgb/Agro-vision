const fs = require('fs');
const DiseaseReport = require('../models/DiseaseReport');
const { analyzeImage } = require('../utils/diseaseEngine');

exports.detectDisease = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Leaf image is required' });
    }

    const stats = fs.statSync(req.file.path);
    const result = analyzeImage(req.file.filename, stats.size);
    const imageUrl = `/uploads/${req.file.filename}`;

    const report = await DiseaseReport.create({
      user: req.user._id,
      imageUrl,
      result,
    });

    res.status(201).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const history = await DiseaseReport.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
};
