const mongoose = require('mongoose');

/**
 * NEW MODULE — cache for the external, official market-price data source
 * (data.gov.in / AGMARKNET). This is intentionally a separate collection
 * from the existing `MarketPrice` model so the existing Market Price page
 * and admin CRUD system are completely untouched. Records are refreshed
 * periodically (see backend/services/marketDataService.js) to avoid
 * exceeding the external API's rate limits.
 */
const marketPriceCacheSchema = new mongoose.Schema(
  {
    commodity: { type: String, required: true, index: true },
    market: { type: String, required: true },
    state: { type: String, required: true, index: true },
    district: { type: String, index: true },
    variety: { type: String },
    minPrice: { type: Number },
    maxPrice: { type: Number },
    modalPrice: { type: Number },
    unit: { type: String, default: 'per quintal' },
    arrivalDate: { type: Date },
    source: { type: String, default: 'data.gov.in (AGMARKNET - Ministry of Agriculture & Farmers Welfare)' },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

marketPriceCacheSchema.index({ commodity: 1, state: 1, district: 1, arrivalDate: -1 });
marketPriceCacheSchema.index({ state: 1, district: 1, market: 1, commodity: 1 });

module.exports = mongoose.model('MarketPriceCache', marketPriceCacheSchema);
