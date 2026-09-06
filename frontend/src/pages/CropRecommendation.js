import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';
import { translateCategory, translateValue } from '../utils/translateValue';

const initial = {
  soilType: 'Loamy', nitrogen: '', phosphorus: '', potassium: '',
  ph: '', temperature: '', humidity: '', rainfall: '',
};

const CropRecommendation = () => {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/crop/recommend', form);
      setResult(data.recommendation.result);
      toast.success(t('recommendationGenerated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('recommendationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-3">
      <div className="col-md-6">
        <div className="glass-card p-4">
          <h5 className="section-title mb-3"><i className="bi bi-flower1 me-2"></i>{t('soilBasedCropRecommendation')}</h5>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">{t('soilType')}</label>
              <select className="form-select" value={form.soilType} onChange={update('soilType')}>
                {['Loamy', 'Sandy', 'Clayey', 'Silty', 'Black', 'Red', 'Alluvial'].map((s) => (
                  <option key={s} value={s}>{translateCategory(t, 'soilTypes', s)}</option>
                ))}
              </select>
            </div>
            <div className="row g-2">
              {[
                ['nitrogen', 'Nitrogen (kg/ha)'], ['phosphorus', 'Phosphorus (kg/ha)'],
                ['potassium', 'Potassium (kg/ha)'], ['ph', 'pH'],
                ['temperature', 'Temperature (°C)'], ['humidity', 'Humidity (%)'],
                ['rainfall', 'Rainfall (mm)'],
              ].map(([field, label]) => (
                <div className="col-6" key={field}>
                  <label className="form-label small">{label}</label>
                  <input type="number" step="any" className="form-control" required value={form[field]} onChange={update(field)} />
                </div>
              ))}
            </div>
            <button type="submit" className="btn btn-agri w-100 mt-3" disabled={loading}>
              {loading ? t('analyzing') : t('getRecommendation')}
            </button>
          </form>
        </div>
      </div>
      <div className="col-md-6">
        <div className="glass-card p-4 h-100">
          <h5 className="section-title mb-3">{t('result')}</h5>
          {!result ? (
            <p className="text-muted small">{t('cropRecommendationHelp')}</p>
          ) : (
            <div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="stat-badge"><i className="bi bi-flower1"></i></div>
                <div>
                  <div className="fs-4 fw-bold">{translateCategory(t, 'cropNames', result.crop)}</div>
                  <div className="text-muted small">{t('confidence')}: {result.confidence}%</div>
                </div>
              </div>
              <ul className="list-group list-group-flush">
                <li className="list-group-item bg-transparent"><strong>{t('suitableSeason')}:</strong> {translateCategory(t, 'seasons', result.season)}</li><li className="list-group-item bg-transparent"><strong>{t('waterRequirement')}:</strong> {translateValue(t, result.waterRequirement)}</li><li className="list-group-item bg-transparent"><strong>{t('fertilizerSuggestion')}:</strong> {translateCategory(t, 'fertilizerRecommendations', result.fertilizerSuggestion)}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;
