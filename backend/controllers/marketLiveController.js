const { getOfficialMarketPrices } = require('../services/officialMarketDataService');

// NEW controller — does not modify the existing /api/market CRUD endpoints.
exports.getLive = async (req, res, next) => {
  try {
    const { commodity, district, market, page, limit } = req.query;
    // State is intentionally excluded from client input; the service is
    // permanently scoped to Tamil Nadu.
    const result = await getOfficialMarketPrices({ commodity, district, market }, { page, limit });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
