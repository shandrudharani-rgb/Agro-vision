const MarketPrice = require('../models/MarketPrice');

exports.list = async (req, res, next) => {
  try {
    const { search, state, market, district, city, cropName } = req.query;
    const filter = {};
    const textFilter = (value) => ({ $regex: escapeRegex(value.trim()), $options: 'i' });
    // General search covers every location/name field. Individual filters are
    // then ANDed with it, allowing state -> district -> market -> crop flows.
    if (search?.trim()) {
      const pattern = textFilter(search);
      filter.$or = [
        { cropName: pattern },
        { district: pattern },
        { city: pattern },
        { market: pattern },
      ];
    }
    if (state?.trim()) filter.state = textFilter(state);
    if (market?.trim()) filter.market = textFilter(market);
    if (district?.trim()) filter.district = textFilter(district);
    if (city?.trim()) filter.city = textFilter(city);
    if (cropName?.trim()) filter.cropName = textFilter(cropName);

    const prices = await MarketPrice.find(filter).sort({ priceDate: -1, createdAt: -1 });
    res.json({ success: true, prices });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const price = await MarketPrice.create(normalizePricePayload(req.body));
    res.status(201).json({ success: true, price });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const price = await MarketPrice.findByIdAndUpdate(req.params.id, normalizePricePayload(req.body), { new: true, runValidators: true });
    if (!price) return res.status(404).json({ success: false, message: 'Price entry not found' });
    res.json({ success: true, price });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await MarketPrice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

function normalizePricePayload(body) {
  const payload = { ...body };
  // Preserve compatibility with the older admin form and documents while new
  // writes use the min/max/modal contract required by the price board.
  const modalPrice = payload.modalPrice ?? payload.todayPrice;
  if (modalPrice !== undefined) payload.modalPrice = Number(modalPrice);
  if (payload.minPrice !== undefined || modalPrice !== undefined) payload.minPrice = Number(payload.minPrice ?? modalPrice);
  if (payload.maxPrice !== undefined || modalPrice !== undefined) payload.maxPrice = Number(payload.maxPrice ?? modalPrice);
  if (!payload.priceDate) payload.priceDate = new Date();
  if (!payload.lastUpdated) payload.lastUpdated = payload.priceDate;
  return payload;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
