const User = require('../models/User');
const CropRecommendation = require('../models/CropRecommendation');
const DiseaseReport = require('../models/DiseaseReport');
const ProfitCalculation = require('../models/ProfitCalculation');
const Post = require('../models/Post');
const GovernmentScheme = require('../models/GovernmentScheme');
const { PestAlert } = require('../models/PestAlert');

exports.getAnalytics = async (req, res, next) => {
  try {
    const [
      totalFarmers, totalCropRecs, totalDiseaseReports,
      totalProfitCalcs, totalPosts, totalSchemes, totalAlerts,
    ] = await Promise.all([
      User.countDocuments({ role: 'farmer' }),
      CropRecommendation.countDocuments(),
      DiseaseReport.countDocuments(),
      ProfitCalculation.countDocuments(),
      Post.countDocuments(),
      GovernmentScheme.countDocuments(),
      PestAlert.countDocuments(),
    ]);

    res.json({
      success: true,
      analytics: {
        totalFarmers, totalCropRecs, totalDiseaseReports,
        totalProfitCalcs, totalPosts, totalSchemes, totalAlerts,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.listFarmers = async (req, res, next) => {
  try {
    const farmers = await User.find({ role: 'farmer' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, farmers });
  } catch (err) {
    next(err);
  }
};

exports.updateFarmerStatus = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.deleteFarmer = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Farmer removed' });
  } catch (err) {
    next(err);
  }
};

exports.listAllDiseaseReports = async (req, res, next) => {
  try {
    const reports = await DiseaseReport.find().populate('user', 'fullName village').sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
};

exports.listAllCropRecommendations = async (req, res, next) => {
  try {
    const history = await CropRecommendation.find().populate('user', 'fullName village').sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
};

exports.listAllProfitReports = async (req, res, next) => {
  try {
    const reports = await ProfitCalculation.find().populate('user', 'fullName village').sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
};
