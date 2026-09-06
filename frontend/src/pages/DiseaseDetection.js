import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';
import { translateCategory, translateValue } from '../utils/translateValue';

const DiseaseDetection = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
  };

  const handleDetect = async () => {
    if (!file) {
      toast.error(t('uploadLeafFirst'));
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('leafImage', file);
      const { data } = await api.post('/disease/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.report.result);
      toast.success(t('detectionComplete'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('detectionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-3">
      <div className="col-md-5">
        <div className="glass-card p-4 text-center">
          <h5 className="section-title mb-3"><i className="bi bi-bug me-2"></i>{t('diseaseDetectionTitle')}</h5>
          <div className="border rounded-3 p-3 mb-3" style={{ borderStyle: 'dashed' }}>
            {preview ? (
              <img src={preview} alt={t('leafPreview')} className="img-fluid rounded-3" style={{ maxHeight: 260 }} />
            ) : (
              <div className="text-muted py-5">
                <i className="bi bi-image fs-1"></i>
                <p className="mb-0">{t('uploadLeafImage')}</p>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" className="form-control mb-3" onChange={handleFileChange} />
          <button className="btn btn-agri w-100" onClick={handleDetect} disabled={loading}>
            {loading ? t('detecting') : t('detectDisease')}
          </button>
        </div>
      </div>
      <div className="col-md-7">
        <div className="glass-card p-4 h-100">
          <h5 className="section-title mb-3">{t('diagnosis')}</h5>
          {!result ? (
            <p className="text-muted small">{t('diseaseHelp')}</p>
          ) : (
            <div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="stat-badge"><i className="bi bi-bug"></i></div>
                <div>
                  <div className="fs-4 fw-bold">{translateCategory(t, 'diseaseNames', result.diseaseName)}</div>
                  <div className="text-muted small">{t('confidence')}: {result.confidence}%</div>
                </div>
              </div>
              <p><strong>{t('cause')}:</strong> {translateValue(t, result.cause)}</p><p><strong>{t('symptoms')}:</strong></p>
              <ul>{result.symptoms.map((s, i) => <li key={i}>{translateValue(t, s)}</li>)}</ul>
              <p><strong>{t('prevention')}:</strong></p>
              <ul>{result.prevention.map((s, i) => <li key={i}>{translateValue(t, s)}</li>)}</ul>
              <p><strong>{t('recommendedTreatment')}:</strong> {translateValue(t, result.treatment)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetection;
