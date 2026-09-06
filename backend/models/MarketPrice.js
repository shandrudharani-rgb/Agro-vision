const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    cropName: { type: String, required: true },
    market: { type: String, required: true },
    state: String,
    district: { type: String, index: true },
    city: { type: String, index: true },
    minPrice: { type: Number, required: true, min: 0 },
    maxPrice: { type: Number, required: true, min: 0 },
    modalPrice: { type: Number, required: true, min: 0 },
    priceDate: { type: Date, required: true, default: Date.now },
    lastUpdated: { type: Date, required: true, default: Date.now },
    // Stable key used only by the backend sample generator to avoid duplicate
    // automatic seed records on later server starts.
    seedKey: { type: String, unique: true, sparse: true },
    // Optional legacy fields allow old documents to remain readable.
    todayPrice: Number,
    yesterdayPrice: Number,
    weeklyTrend: [{ date: Date, price: Number }],
    unit: { type: String, default: 'per quintal' },
  },
  { timestamps: true }
);

marketPriceSchema.index({ state: 1, district: 1, city: 1, market: 1, cropName: 1, priceDate: -1 });
marketPriceSchema.index({ district: 1, market: 1, cropName: 1, priceDate: -1 });
marketPriceSchema.index({ city: 1, market: 1, priceDate: -1 });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
