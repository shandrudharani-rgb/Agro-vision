import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';
import { translateValue } from '../utils/translateValue';

const initial = { nitrogen: '', phosphorus: '', potassium: '', ph: '', moisture: '', organicCarbon: '' };

const INDICATOR_COLOR = { poor: '#d9534f', moderate: '#f0ad4e', good: '#2e9e5b', excellent: '#1b6b3c' };

const SoilHealth = () => {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/soil-health/calculate', form);
      setResult(data.soilHealth);
      toast.success(t('soilHealthCalculated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('calculationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-3">
      <div className="col-md-6">
        <div className="glass-card p-4">
          <h5 className="section-title mb-3"><i className="bi bi-moisture me-2"></i>{t('soilHealthScore')}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-2">
              {[
                ['nitrogen', 'Nitrogen (kg/ha)'], ['phosphorus', 'Phosphorus (kg/ha)'],
                ['potassium', 'Potassium (kg/ha)'], ['ph', 'pH'],
                ['moisture', 'Moisture (%)'], ['organicCarbon', 'Organic Carbon (%)'],
              ].map(([field, label]) => (
                <div className="col-6" key={field}>
                  <label className="form-label small">{label}</label>
                  <input type="number" step="any" className="form-control" required value={form[field]} onChange={update(field)} />
                </div>
              ))}
            </div>
            <button type="submit" className="btn btn-agri w-100 mt-3" disabled={loading}>
              {loading ? t('calculating') : t('calculateScore')}
            </button>
          </form>
        </div>
      </div>
      <div className="col-md-6">
        <div className="glass-card p-4 h-100 text-center">
          <h5 className="section-title mb-3">{t('result')}</h5>
          {!result ? (
            <p className="text-muted small">{t('soilHelp')}</p>
          ) : (
            <div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: 140, height: 140, border: `10px solid ${INDICATOR_COLOR[result.indicator]}` }}
              >
                <div>
                  <div className="fs-2 fw-bold">{result.score}</div>
                  <div className="small text-muted">/ 100</div>
                </div>
              </div>
              <div className="badge mb-3" style={{ background: INDICATOR_COLOR[result.indicator] }}>
                {translateValue(t, result.indicator)}
              </div>
              <div className="text-start">
                <strong>{t('suggestions')}:</strong>
                <ul>{result.suggestions.map((s, i) => <li key={i}>{translateValue(t, s)}</li>)}</ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoilHealth;
