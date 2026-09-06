import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useLanguage } from "../LanguageContext";
import en from "../locales/en";
import ta from "../locales/ta";
import { translateCategory } from '../utils/translateValue';

// NEW component — calls the NEW /api/weather-live endpoint (real
// OpenWeatherMap data). Does NOT replace or modify the existing
// WeatherWidget.js, which continues to render exactly as before.
const LiveWeatherWidget = () => {
  const { language } = useLanguage();
  const text = language === "ta" ? ta : en;
  const tr = (key, fallback) => key.split('.').reduce((value, part) => value?.[part], text) ?? fallback;

  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = (params) =>
      api
        .get('/weather-live', { params })
        .then(({ data }) => {
          if (!cancelled) setWeather(data.weather);
        })
        .catch((err) => {
  const message = err.response?.data?.message;

  if (!cancelled) {
    setError(message || "LIVE_WEATHER_ERROR");
  }
})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    // The authenticated backend route resolves the farmer's district, then
    // city, then Coimbatore. Do not override the saved profile with browser
    // geolocation or a hardcoded city.
    load({});

    return () => {
      cancelled = true;
    };
  }, [language]);

  if (loading) return <div className="skeleton" style={{ height: 140 }} />;

  if (error) {
    return (
      <div className="glass-card p-4 h-100">
        <h6 className="section-title">
             <i className="bi bi-cloud-sun me-2"></i>
               {text.liveWeather}
           </h6>
        <p className="text-muted small mb-0">
  {error === "Provide lat/lon or city"
    ? text.enterLocation
    : error === "LIVE_WEATHER_ERROR"
    ? text.unableToLoadLiveWeather
    : error}
</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 h-100">
      <h6 className="section-title mb-3">
        <i className="bi bi-cloud-sun me-2"></i>
            {text.liveWeather}{weather?.location ? ` — ${weather.location}` : ''}
      </h6>
      <div className="row text-center g-2">
        <div className="col-6 col-md-3">
          <div className="fs-4 fw-bold">{weather?.temperature != null ? `${Math.round(weather.temperature)}°C` : '—'}</div>
          <div className="small text-muted">{text.temperature}</div>
        </div>
        <div className="col-6 col-md-3">
          <div className="fs-4 fw-bold">{weather?.humidity != null ? `${weather.humidity}%` : '—'}</div>
          <div className="small text-muted">{text.humidity}</div>
        </div>
        <div className="col-6 col-md-3">
          <div className="fs-4 fw-bold">{weather?.windSpeed != null ? `${weather.windSpeed} m/s` : '—'}</div>
          <div className="small text-muted">{text.wind}</div> 
        </div>
        <div className="col-6 col-md-3">
          <div className="fs-4 fw-bold">{weather?.rainfall != null ? `${weather.rainfall} mm` : '—'}</div>
          <div className="small text-muted">{text.rainfall}</div>
        </div>
      </div>
      {weather?.description && <div className="small text-muted mt-2 text-capitalize">{translateCategory(tr, 'weatherConditions', weather.description)}</div>}
      <div className="small text-muted mt-2" style={{ fontSize: 11 }}>{text.source}: {weather?.source || 'OpenWeatherMap'}</div>
    </div>
  );
};

export default LiveWeatherWidget;
