import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { translateCategory, translateList, translateValue } from '../utils/translateValue';

const RISK_COLOR = { low: 'success', medium: 'warning', high: 'danger', insufficient_data: 'secondary' };

// NEW component — automatic, weather-driven pest risk predictions.
// Rendered ADDITIONALLY inside the existing PestAlerts.js page, below the
// existing manual/admin alert list, and clearly labeled "System Risk
// Prediction" so farmers never confuse it with an official/verified alert.
const PestRiskPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [crop, setCrop] = useState(user?.primaryCrop?.toLowerCase() || '');
  const [supportedCrops, setSupportedCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState('');

  const fetchPredictions = async () => {
    try {
      const { data } = await api.get('/pest-risk');
      setPredictions(data.predictions || []);
    } catch {
      // fail quietly — this is an additive feature
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
    api
      .get('/pest-risk/supported-crops')
      .then(({ data }) => setSupportedCrops(data.crops || []))
      .catch(() => {});
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!crop) return;
    setGenerating(true);
    setNotice('');
    try {
      const { data } = await api.post('/pest-risk/generate', { crop });
      if (data.insufficientData) {
        setNotice(translateValue(t, data.message, t('noRiskPredictions')));
      } else {
        toast.success(`${t('systemRiskPrediction')}: ${translateCategory(t, 'riskLevels', data.prediction.riskLevel)} ${t('risk')}`);
        fetchPredictions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('predictionFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await api.put(`/pest-risk/${id}/dismiss`);
      setPredictions((prev) => prev.filter((p) => p._id !== id));
    } catch {
      toast.error(t('dismissFailed'));
    }
  };

  return (
    <div className="mt-4">
      <div className="glass-card p-4 mb-3">
        <h5 className="section-title mb-1">
          <i className="bi bi-robot me-2"></i>{t('automaticPestRisk')}
        </h5>
        <p className="text-muted small mb-3">
          {t('riskDisclaimer')}
        </p>
        <form className="row g-2" onSubmit={handleGenerate}>
          <div className="col-md-8">
            <select className="form-select" value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option value="">{t('selectCrop')}</option>
              {supportedCrops.map((c) => (
                <option key={c} value={c}>
                  {translateCategory(t, 'cropNames', c)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <button className="btn btn-agri w-100" type="submit" disabled={generating || !crop}>
              {generating ? t('analyzing') : t('checkRisk')}
            </button>
          </div>
        </form>
        {notice && <div className="alert alert-secondary small mt-3 mb-0">{notice}</div>}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 120 }} />
      ) : predictions.length === 0 ? (
        <div className="glass-card p-4 text-center text-muted small">
          {t('noRiskPredictions')}
        </div>
      ) : (
        <div className="row g-3">
          {predictions.map((p) => (
            <div className="col-md-6" key={p._id}>
              <div className="glass-card p-4 h-100 border-start border-4" style={{ borderColor: 'var(--bs-warning)' }}>
                <div className="d-flex justify-content-between align-items-start">
                  <span className="badge bg-secondary mb-2">{t('systemRiskPrediction')}</span>
                  <span className={`badge bg-${RISK_COLOR[p.riskLevel]}`}>{translateCategory(t, 'riskLevels', p.riskLevel)} {t('risk')}</span>
                </div>
                <h6 className="fw-bold">{translateValue(t, p.pestName)}</h6>
                <p className="text-muted small mb-1">{t('cropLabel')}: {translateCategory(t, 'cropNames', p.affectedCrop)} · {translateValue(t, p.district)}, {translateValue(t, p.state)}</p><p className="small mb-1"><strong>{t('why')}:</strong> {translateValue(t, p.reason)}</p>
                {p.symptoms?.length > 0 && (
                  <p className="small mb-1"><strong>{t('symptoms')}:</strong> {translateList(t, p.symptoms)}</p>
                )}
                {p.prevention?.length > 0 && (
                  <p className="small mb-1"><strong>{t('prevention')}:</strong> {translateList(t, p.prevention)}</p>
                )}
                {p.recommendedAction && (
                  <p className="small mb-2"><strong>{t('recommendedAction')}:</strong> {translateValue(t, p.recommendedAction)}</p>
                )}
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted" style={{ fontSize: 11 }}>
                    {new Date(p.createdAt).toLocaleString()} · {t('source')}: {translateValue(t, p.source)}
                  </span>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => handleDismiss(p._id)}>
                    {t('dismiss')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PestRiskPanel;
