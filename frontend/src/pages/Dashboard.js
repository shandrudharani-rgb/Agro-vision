import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import LiveWeatherWidget from '../components/LiveWeatherWidget';
import { useAuth } from '../context/AuthContext';
import en from "../locales/en";
import ta from "../locales/ta";
import { useLanguage } from "../LanguageContext";
import { translateCategory } from '../utils/translateValue';

const SummaryCard = ({ icon, title, value, to, accent }) => (
  <Link to={to} className="text-decoration-none">
    <div className="glass-card p-4 h-100">
      <div className="d-flex align-items-center gap-3">
        <div className="stat-badge" style={accent ? { background: accent + '22', color: accent } : {}}>
          <i className={`bi ${icon}`}></i>
        </div>
        <div>
          <div className="text-muted small">{title}</div>
          <div className="fs-5 fw-bold text-dark">{value}</div>
        </div>
      </div>
    </div>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();

  const { language } = useLanguage();
const text = language === "ta" ? ta : en;
const tr = (key, fallback) => key.split('.').reduce((value, part) => value?.[part], text) ?? fallback;

const locationTamil = {
  kailayapuram: "கைலாயபுரம்",
  dharmapuri: "தர்மபுரி",
  "tamil nadu": "தமிழ்நாடு",
};

const cropTamil = {
  Rice: "நெல்",
  Maize: "மக்காச்சோளம்",
  Cotton: "பருத்தி",
  Groundnut: "வேர்க்கடலை",
  Sugarcane: "கரும்பு",
  Millet: "கம்பு",
  Ragi: "கேழ்வரகு",
  Wheat: "கோதுமை",
  Banana: "வாழை",
  Tomato: "தக்காளி",
  Onion: "வெங்காயம்",
};
  
  const [cropHistory, setCropHistory] = useState([]);
  const [soilHistory, setSoilHistory] = useState([]);
  const [profitHistory, setProfitHistory] = useState([]);
  const [diseaseHistory, setDiseaseHistory] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/crop/history'),
      api.get('/soil-health/history'),
      api.get('/profit/history'),
      api.get('/disease/history'),
      api.get('/schemes'),
    ]).then(([crop, soil, profit, disease, scheme]) => {
      if (crop.status === 'fulfilled') setCropHistory(crop.value.data.history);
      if (soil.status === 'fulfilled') setSoilHistory(soil.value.data.history);
      if (profit.status === 'fulfilled') setProfitHistory(profit.value.data.history);
      if (disease.status === 'fulfilled') setDiseaseHistory(disease.value.data.history);
      if (scheme.status === 'fulfilled') setSchemes(scheme.value.data.schemes.slice(0, 3));
      setLoading(false);
    });
  }, []);

  const soilChartData = [...soilHistory].reverse().slice(-10).map((s) => ({
    date: new Date(s.createdAt).toLocaleDateString(),
    score: s.score,
  }));

  

  const latestSoil = soilHistory[0];
  const latestCrop = cropHistory[0];

  return (
    <div>
      <div className="glass-card p-4 mb-3">
        <h3 className="section-title mb-1">{text.dashboardWelcome}, {user?.fullName} 🌾
        </h3>
  
        <p className="text-muted mb-0">
        {language === "ta"
       ? `${locationTamil[user?.village] || user?.village},
       ${locationTamil[user?.district] || user?.district},
       ${locationTamil[user?.state] || user?.state}`
        : `${user?.village}, ${user?.district}, ${user?.state}`}
      </p>
      </div>

      {/* NEW: real, location-based live weather — additive, existing WeatherWidget below is unchanged */}
      <div className="dashboard-grid dashboard-grid--overview mb-3">
        <div className="dashboard-weather">
          <LiveWeatherWidget />
        </div>
        <div className="dashboard-summary">
         <SummaryCard
          icon="bi-moisture"
         title={text.soilHealthScore}
         value={latestSoil ? `${latestSoil.score}/100` : text.noData}
        to="/soil-health"
        accent="#2e9e5b"
          />
        </div>
        <div className="dashboard-summary">
         <SummaryCard
          icon="bi-flower1"
           title={text.bestCrop}
            value={
            latestCrop
             ? (language === "ta"
              ? translateCategory(tr, 'cropNames', latestCrop.result.crop)
             : latestCrop.result.crop)
          : text.noData
          }
            to="/crop-recommendation"
           accent="#1b6b3c"
           />
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--metrics mb-3">
        <div>
          <SummaryCard icon="bi-bug" title={text.diseaseReports} value={diseaseHistory.length} to="/disease-detection" />
        </div>
        <div>
          <SummaryCard icon="bi-calculator" title={text.profitCalculations} value={profitHistory.length} to="/profit-calculator" />
        </div>
        <div>
          <SummaryCard icon="bi-file-earmark-text" title={text.savedReports}
              value={text.viewAll} to="/reports" />
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--insights">
        <div className="dashboard-insight-chart">
          <div className="glass-card p-4 h-100">
            <h6 className="section-title mb-3">{text.soilHealthTrend}</h6>
               {soilChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={soilChartData}>
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2e9e5b" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted small">
                 {text.calculateSoilHealth}
               </p>
            )}
          </div>
        </div>
        <div className="dashboard-insight-schemes">
          <div className="glass-card p-4 h-100">
            <h6 className="section-title mb-3">
                {text.governmentSchemeUpdates}
              </h6>
            {loading ? (
              <div className="skeleton" style={{ height: 100 }} />
            ) : schemes.length === 0 ? (
              <p className="text-muted small">
                   {text.noActiveSchemes}
                </p>
            ) : (
              schemes.map((s) => (
                <div key={s._id} className="border-bottom pb-2 mb-2">
                  <div className="fw-semibold small">{s.title}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {text.lastDate}: {s.lastDate ? new Date(s.lastDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              ))
            )}
            <Link to="/schemes" className="small">{text.viewAllSchemes} →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
