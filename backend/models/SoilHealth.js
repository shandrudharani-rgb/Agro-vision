const mongoose = require('mongoose');

const soilHealthSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    inputs: {
      nitrogen: Number,
      phosphorus: Number,
      potassium: Number,
      ph: Number,
      moisture: Number,
      organicCarbon: Number,
    },
    score: Number,
    indicator: { type: String, enum: ['poor', 'moderate', 'good', 'excellent'] },
    suggestions: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SoilHealth', soilHealthSchema);
