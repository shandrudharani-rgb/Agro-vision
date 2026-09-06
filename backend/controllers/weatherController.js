const { getLiveWeather } = require('../services/weatherService');

// Uses OpenWeatherMap via the shared weatherService (WEATHER_API_KEY in
// backend/.env). The API key is never exposed to the frontend — this route
// makes the external call server-side and only returns the parsed weather
// fields the UI needs.
exports.getWeather = async (req, res, next) => {
  try {
    const { lat, lon, city } = req.query;

    const weather = await getLiveWeather({
      lat: lat !== undefined ? Number(lat) : undefined,
      lon: lon !== undefined ? Number(lon) : undefined,
      // Default to the farmer's district/state if no location was supplied
      // and geolocation isn't available on the client, so the widget still
      // shows something useful instead of an error.
      city: city || req.user?.district || req.user?.city || 'Coimbatore',
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
