const mongoose = require('mongoose');

const savedReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weatherSnapshot: Object,
    soilHealth: Object,
    cropRecommendation: Object,
    diseaseDetection: Object,
    marketPrices: Object,
    profitEstimation: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavedReport', savedReportSchema);
