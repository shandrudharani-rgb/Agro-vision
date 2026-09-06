import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useLanguage } from "../LanguageContext";
import en from "../locales/en";
import ta from "../locales/ta";
import { translateCategory } from '../utils/translateValue';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
const text = language === "ta" ? ta : en;
const tr = (key, fallback) => key.split('.').reduce((value, part) => value?.[part], text) ?? fallback;

const weatherTamil = {
  "Clear Sky": "தெளிவான வானம்",
  "Clear": "தெளிவான வானம்",

  "Few Clouds": "சில மேகங்கள்",
  "Scattered Clouds": "சிதறிய மேகங்கள்",
  "Broken Clouds": "உடைந்த மேகங்கள்",
  "Overcast Clouds": "முழு மேகமூட்டம்",
  "Clouds": "மேகமூட்டம்",

  "Light Rain": "லேசான மழை",
  "Moderate Rain": "மிதமான மழை",
  "Heavy Rain": "கனமழை",
  "Rain": "மழை",

  "Thunderstorm": "இடியுடன் கூடிய மழை",

  "Mist": "மூடுபனி",
  "Fog": "பனிமூட்டம்",
  "Haze": "மங்கலான வானிலை",
  "Smoke": "புகைமூட்டம்",

  "clear sky": "தெளிவான வானம்",
"clear": "தெளிவான வானம்",

"few clouds": "சில மேகங்கள்",
"scattered clouds": "சிதறிய மேகங்கள்",
"broken clouds": "உடைந்த மேகங்கள்",
"overcast clouds": "முழு மேகமூட்டம்",
"clouds": "மேகமூட்டம்",

"light rain": "லேசான மழை",
"moderate rain": "மிதமான மழை",
"heavy rain": "கனமழை",
"rain": "மழை",

"thunderstorm": "இடியுடன் கூடிய மழை",

"mist": "மூடுபனி",
"fog": "பனிமூட்டம்",
"haze": "மங்கலான வானிலை",
"smoke": "புகைமூட்டம்",
};

  useEffect(() => {
    let cancelled = false;

    const load = (params) =>
      api
        .get('/weather', { params })
        .then(({ data }) => {
          if (!cancelled) setWeather(data.weather);
        })
        .catch((err) => {
          if (!cancelled) setError(err.response?.data?.message || 'Unable to load weather');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => load({}) // permission denied — fall back to the farmer's profile location on the backend
      );
    } else {
      load({});
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="skeleton" style={{ height: 140 }} />;

  if (error) {
    return (
      <div className="glass-card p-4 h-100">
        <h6 className="section-title">
          <i className="bi bi-cloud-sun me-2"></i>{text.weather}
        </h6>
        <p className="text-muted small mb-0">{error}</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 h-100">
      <h6 className="section-title mb-3">
        <i className="bi bi-cloud-sun me-2"></i>
           {text.weather}
          {weather?.location ? ` — ${weather.location}` : ""}
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
      {weather?.description && (
        <div className="small text-muted mt-2">
         {language === "ta"
          ? translateCategory(tr, 'weatherConditions', weather.description)
          : weather.description}
        </div>
          )}
      {(weather?.sunrise || weather?.sunset) && (
        <div className="d-flex justify-content-between mt-3 small text-muted">
          {weather?.sunrise && <span><i className="bi bi-sunrise me-1"></i>{new Date(weather.sunrise).toLocaleTimeString()}</span>}
          {weather?.sunset && <span><i className="bi bi-sunset me-1"></i>{new Date(weather.sunset).toLocaleTimeString()}</span>}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
