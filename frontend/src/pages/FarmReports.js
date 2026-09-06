import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';
import { translateCategory, translateValue } from '../utils/translateValue';
import { useAuth } from '../context/AuthContext';

const FarmReports = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [active, setActive] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports');
      setReports(data.reports);
    } catch (err) {
      setReports([]);
      toast.error(t('reportsFailed'));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/reports/generate', {});
      toast.success(t('reportGenerated'));
      setReports([data.report, ...reports]);
      setActive(data.report);
    } catch (err) {
      toast.error(t('reportFailed'));
    } finally { setGenerating(false); }
  };

  const formatCurrency = (value) => value == null ? t('noData') : `₹${Number(value).toLocaleString('en-IN')}`;
  const weather = active?.weatherSnapshot;
  const hasWeather = weather && Object.values(weather).some((value) => value !== null && value !== undefined && value !== '');
  const scheme = active?.governmentSchemeRecommendation || active?.schemeRecommendation || active?.governmentScheme;
  const location = [user?.village, user?.district, user?.state].filter(Boolean).join(', ') || t('noData');
  const soilSummary = active?.soilHealth ? `${active.soilHealth.score}/100${active.soilHealth.indicator ? ` — ${translateValue(t, active.soilHealth.indicator)}` : ''}` : t('noData');
  const crop = active?.cropRecommendation?.result?.crop;
  const disease = active?.diseaseDetection?.result?.diseaseName;
  const aiRecommendation = active?.aiRecommendation || active?.finalConclusion || (crop || disease || active?.soilHealth
    ? `Prioritize ${crop ? `${crop} cultivation` : 'the latest crop plan'}${disease ? ` and monitor for ${disease}` : ''}. ${active?.soilHealth?.suggestions?.[0] || 'Continue regular soil, crop, and market monitoring.'}`
    : 'Generate recommendations after recording soil, crop, and field observations.');

  return (
    <div>
      <div className="glass-card p-4 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h5 className="section-title mb-0"><i className="bi bi-file-earmark-text me-2"></i>{t('oneClickFarmReport')}</h5>
        <button className="btn btn-agri" onClick={handleGenerate} disabled={generating}>{generating ? t('generating') : t('generateReport')}</button>
      </div>
      <div className="row g-3">
        <div className="col-md-4">
          <div className="glass-card p-3">
            <h6 className="section-title mb-2">{t('history')}</h6>
            {loading ? <div className="skeleton" style={{ height: 150 }} /> : reports.length === 0 ? <p className="text-muted small">{t('noReports')}</p> : reports.map((report) => (
              <button key={report._id} className={`btn btn-sm w-100 text-start mb-1 ${active?._id === report._id ? 'btn-agri' : 'btn-light'}`} onClick={() => setActive(report)}>{new Date(report.createdAt).toLocaleString()}</button>
            ))}
          </div>
        </div>
        <div className="col-md-8">
          {active ? <div className="glass-card p-4 farm-report" id="report-print-area">
            <div className="d-flex justify-content-between align-items-center mb-3 report-screen-header">
              <h6 className="section-title mb-0">{t('farmReport')} — {new Date(active.createdAt).toLocaleDateString()}</h6>
              <button className="btn btn-sm btn-agri-outline report-print-action" onClick={() => window.print()}><i className="bi bi-printer me-1"></i>{t('printExport')}</button>
            </div>
            <article className="farm-report__document">
              <header className="farm-report__masthead"><div className="farm-report__brand-mark">AV</div><div><div className="farm-report__brand">Agro Vision</div><div className="farm-report__eyebrow">Smart Agriculture Intelligence</div></div><div className="farm-report__date"><strong>{t('farmReport')}</strong><span>Generated {new Date(active.createdAt).toLocaleString()}</span></div></header>
              <section className="farm-report__section farm-report__farmer"><h2>Farmer Details</h2><dl><div><dt>Name</dt><dd>{user?.fullName || t('noData')}</dd></div><div><dt>Location</dt><dd>{location}</dd></div></dl></section>
              <section className="farm-report__section"><h2>Farm Assessment</h2><div className="farm-report__grid"><div className="farm-report__item"><h3>{t('soilHealth')}</h3><p>{soilSummary}</p></div><div className="farm-report__item"><h3>{t('cropRecommendation')}</h3><p>{crop ? translateCategory(t, 'cropNames', crop) : t('noData')}</p></div><div className="farm-report__item"><h3>{t('diseaseDetection')}</h3><p>{disease ? translateCategory(t, 'diseaseNames', disease) : t('noData')}</p></div><div className="farm-report__item"><h3>{t('profitEstimation')}</h3><p>{active.profitEstimation ? formatCurrency(active.profitEstimation.result?.profit) : t('noData')}</p></div></div></section>
              <section className="farm-report__section"><h2>Market Price Summary</h2>{active.marketPrices?.length ? <div className="farm-report__market-list">{active.marketPrices.slice(0, 3).map((market, index) => <div key={market._id || `${market.cropName}-${index}`}><strong>{market.cropName}</strong><span>{market.market || market.district || 'Local market'}</span><em>{formatCurrency(market.modalPrice ?? market.todayPrice)}</em></div>)}</div> : <p className="farm-report__empty">{t('noData')}</p>}</section>
              {hasWeather && <section className="farm-report__section"><h2>Weather Summary</h2><p className="farm-report__summary">{[weather.description, weather.temperature != null && `${Math.round(weather.temperature)}°C`, weather.humidity != null && `${weather.humidity}% humidity`, weather.rainfall != null && `${weather.rainfall} mm rainfall`].filter(Boolean).join(' · ')}</p></section>}
              {scheme && <section className="farm-report__section"><h2>Government Scheme Recommendation</h2><p className="farm-report__summary">{typeof scheme === 'string' ? scheme : scheme.title || scheme.name || scheme.description}</p></section>}
              <section className="farm-report__section farm-report__conclusion"><h2>AI Recommendation / Final Conclusion</h2><p>{aiRecommendation}</p></section>
            </article>
          </div> : <div className="glass-card p-5 text-center text-muted">{t('selectReport')}</div>}
        </div>
      </div>
    </div>
  );
};

export default FarmReports;
