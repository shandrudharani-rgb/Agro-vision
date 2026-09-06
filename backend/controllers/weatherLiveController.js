const { getLiveWeather } = require('../services/weatherService');

// NEW controller — does not modify the existing /api/weather endpoint.
exports.getLive = async (req, res, next) => {
  try {
    const { lat, lon, city } = req.query;
    const profileLocation = req.user?.district || req.user?.city || 'Coimbatore';
    const weather = await getLiveWeather({
      lat: lat !== undefined ? Number(lat) : undefined,
      lon: lon !== undefined ? Number(lon) : undefined,
      // Prefer the authenticated farmer's saved district. City and the
      // Coimbatore fallback keep the weather card useful for incomplete
      // profiles, without relying on a fixed unrelated location.
      city: city || profileLocation,
    });
    res.json({ success: true, weather });
  } catch (err) {
    if (err.code === 'WEATHER_NOT_CONFIGURED') {
      return res.status(503).json({ success: false, message: err.message, code: err.code });
    }
    if (err.code === 'WEATHER_BAD_REQUEST') {
      return res.status(400).json({ success: false, message: err.message, code: err.code });
    }
    next(err);
  }
};
