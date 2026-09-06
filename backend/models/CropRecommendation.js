const mongoose = require('mongoose');

const cropRecommendationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inputs: {
      soilType: String,
      nitrogen: Number,
      phosphorus: Number,
      potassium: Number,
      ph: Number,
      temperature: Number,
      humidity: Number,
      rainfall: Number,
    },
    result: {
      crop: String,
      confidence: Number,
      season: String,
      waterRequirement: String,
      fertilizerSuggestion: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CropRecommendation', cropRecommendationSchema);
