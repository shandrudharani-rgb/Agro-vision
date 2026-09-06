import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';
import { translateCategory, translateValue } from '../utils/translateValue';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
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
    } finally {
      setLoading(false);
    }
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
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => window.print();

  const formatCurrency = (value) => value == null ? t('noData') : `₹${Number(value).toLocaleString('en-IN')}`;
  const weather = active?.weatherSnapshot;
  const hasWeather = weather && Object.values(weather).some((value) => value !== null && value !== undefined && value !== '');
  const scheme = active?.governmentSchemeRecommendation || active?.schemeRecommendation || active?.governmentScheme;
  const location = [user?.village, user?.district, user?.state].filter(Boolean).join(', ') || t('noData');
  const soilSummary = active?.soilHealth
    ? `${active.soilHealth.score}/100${active.soilHealth.indicator ? ` — ${translateValue(t, active.soilHealth.indicator)}` : ''}`
    : t('noData');
  const crop = active?.cropRecommendation?.result?.crop;
  const disease = active?.diseaseDetection?.result?.diseaseName;
  const aiRecommendation = active?.aiRecommendation || active?.finalConclusion ||
    (crop || disease || active?.soilHealth
      ? `Prioritize ${crop ? `${crop} cultivation` : 'the latest crop plan'}${disease ? ` and monitor for ${disease}` : ''}. ${active?.soilHealth?.suggestions?.[0] || 'Continue regular soil, crop, and market monitoring.'}`
      : 'Generate recommendations after recording soil, crop, and field observations.');

  return (
    <div>
      <div className="glass-card p-4 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h5 className="section-title mb-0"><i className="bi bi-file-earmark-text me-2"></i>{t('oneClickFarmReport')}</h5>
        <button className="btn btn-agri" onClick={handleGenerate} disabled={generating}>
          {generating ? t('generating') : t('generateReport')}
        </button>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <div className="glass-card p-3">
            <h6 className="section-title mb-2">{t('history')}</h6>
            {loading ? (
              <div className="skeleton" style={{ height: 150 }} />
            ) : reports.length === 0 ? (
              <p className="text-muted small">{t('noReports')}</p>
            ) : (
              reports.map((r) => (
                <button
                  key={r._id}
                  className={`btn btn-sm w-100 text-start mb-1 ${active?._id === r._id ? 'btn-agri' : 'btn-light'}`}
                  onClick={() => setActive(r)}
                >
                  {new Date(r.createdAt).toLocaleString()}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="col-md-8">
          {active ? (
            <div className="glass-card p-4" id="report-print-area">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="section-title mb-0">{t('farmReport')} — {new Date(active.createdAt).toLocaleDateString()}</h6>
                <button className="btn btn-sm btn-agri-outline" onClick={handlePrint}>
                  <i className="bi bi-printer me-1"></i>{t('printExport')}
                </button>
              </div>
              <p><strong>{t('soilHealth')}:</strong> {active.soilHealth ? `${active.soilHealth.score}/100 (${translateValue(t, active.soilHealth.indicator)})` : t('noData')}</p><p><strong>{t('cropRecommendation')}:</strong> {active.cropRecommendation?.result?.crop ? translateCategory(t, 'cropNames', active.cropRecommendation.result.crop) : t('noData')}</p><p><strong>{t('diseaseDetection')}:</strong> {active.diseaseDetection?.result?.diseaseName ? translateCategory(t, 'diseaseNames', active.diseaseDetection.result.diseaseName) : t('noData')}</p><p><strong>{t('profitEstimation')}:</strong> {active.profitEstimation ? `₹${active.profitEstimation.result.profit}` : t('noData')}</p><p><strong>{t('marketPricesSnapshot')}:</strong> {active.marketPrices?.length || 0} {t('cropsRecorded')}</p>
            </div>
          ) : (
            <div className="glass-card p-5 text-center text-muted">{t('selectReport')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
