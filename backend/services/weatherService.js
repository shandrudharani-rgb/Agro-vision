const axios = require('axios');


/**
 * NEW SERVICE — real weather data via OpenWeatherMap.
 *
 * This is intentionally separate from backend/controllers/weatherController.js
 * (the existing, hardcoded-data endpoint used by the existing Weather widget).
 * That existing endpoint is NOT modified. This service powers:
 *   - the new "live" weather route (/api/weather-live), and
 *   - the new automatic Pest Risk engine, which needs current
 *     temperature/humidity/rainfall for its rule-based analysis.
 *
 * If WEATHER_API_KEY is not configured, callers receive a clear error object
 * instead of fabricated data, so the UI can show a graceful fallback.
 */

const getLiveWeather = async ({ lat, lon, city }) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const base = process.env.WEATHER_API_BASE || 'https://api.openweathermap.org/data/2.5';

  if (!apiKey) {
    const err = new Error('Weather API key not configured. Set WEATHER_API_KEY in backend/.env');
    err.code = 'WEATHER_NOT_CONFIGURED';
    throw err;
  }

  let url = `${base}/weather?appid=${apiKey}&units=metric`;
  if (lat !== undefined && lon !== undefined) {
    url += `&lat=${lat}&lon=${lon}`;
  } else if (city) {
    url += `&q=${encodeURIComponent(city)}`;
  } else {
    const err = new Error("Provide lat/lon or city");
    err.code = 'WEATHER_BAD_REQUEST';
    throw err;
  }

  const { data } = await axios.get(url, { timeout: 8000 });
  let tamilLocation = data.name;

try {
  const response = await axios.get(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${data.coord.lat}&lon=${data.coord.lon}&accept-language=ta`,
    {
      headers: {
        "User-Agent": "SmartAgri/1.0"
      }
    }
  );

  const address = response.data.address;

  tamilLocation =
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    data.name;
} catch (err) {
  tamilLocation = data.name;
}

  return {
    location: tamilLocation,
    temperature: data.main?.temp,
    humidity: data.main?.humidity,
    windSpeed: data.wind?.speed,
    rainfall: data.rain ? data.rain['1h'] || data.rain['3h'] || 0 : 0,
    description: data.weather?.[0]?.description,
    sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000) : null,
    sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000) : null,
    fetchedAt: new Date(),
    source: 'OpenWeatherMap',
  };
};

module.exports = { getLiveWeather };
