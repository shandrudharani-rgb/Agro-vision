const mongoose = require('mongoose');

const profitCalculationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    crop: { type: String, required: true },
    costs: {
      seed: Number,
      fertilizer: Number,
      pesticide: Number,
      labour: Number,
      irrigation: Number,
      machinery: Number,
      transportation: Number,
    },
    sellingPrice: Number,
    yield: Number,
    result: {
      totalCost: Number,
      totalRevenue: Number,
      profit: Number,
      loss: Number,
      profitPercentage: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProfitCalculation', profitCalculationSchema);
