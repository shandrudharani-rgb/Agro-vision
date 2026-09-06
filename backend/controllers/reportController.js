const SavedReport = require('../models/SavedReport');
const CropRecommendation = require('../models/CropRecommendation');
const DiseaseReport = require('../models/DiseaseReport');
const SoilHealth = require('../models/SoilHealth');
const ProfitCalculation = require('../models/ProfitCalculation');
const MarketPrice = require('../models/MarketPrice');

// Compiles the latest data across modules into one report and saves it.
// Weather is left to the frontend to attach (it already has a live snapshot),
// but can also be posted in as `weatherSnapshot`.
exports.generate = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [latestCrop, latestDisease, latestSoil, latestProfit, marketPrices] = await Promise.all([
      CropRecommendation.findOne({ user: userId }).sort({ createdAt: -1 }),
      DiseaseReport.findOne({ user: userId }).sort({ createdAt: -1 }),
      SoilHealth.findOne({ user: userId }).sort({ createdAt: -1 }),
      ProfitCalculation.findOne({ user: userId }).sort({ createdAt: -1 }),
      MarketPrice.find().limit(10),
    ]);

    const report = await SavedReport.create({
      user: userId,
      weatherSnapshot: req.body.weatherSnapshot || {},
      soilHealth: latestSoil,
      cropRecommendation: latestCrop,
      diseaseDetection: latestDisease,
      marketPrices,
      profitEstimation: latestProfit,
    });

    res.status(201).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const reports = await SavedReport.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const report = await SavedReport.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
};
