import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';
import { translateList, translateValue } from '../utils/translateValue';

const Schemes = () => {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState([]);
  const [search, setSearch] = useState('');
  const [govtLevel, setGovtLevel] = useState(''); // NEW optional filter
  const [cropCategory, setCropCategory] = useState(''); // NEW optional filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSchemes = async () => {
    setLoading(true);
    setError('');
    try {
      // NEW: govtLevel/cropCategory are optional and default to '', which
      // the backend treats identically to not sending them at all —
      // existing search-only behavior is unchanged when they're left blank.
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (govtLevel) {
        params.government = govtLevel === 'tamil_nadu'
          ? 'Tamil Nadu Government'
          : 'Central Government';
      }
      if (cropCategory.trim()) params.crop = cropCategory.trim();
      const { data } = await api.get('/schemes', { params });
      setSchemes(data.schemes || []);
    } catch (err) {
      setSchemes([]);
      const message = !err.response
        ? t('serverUnavailable') : err.response?.data?.message || t('schemesFailed');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchemes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="glass-card p-4 mb-3">
        <h5 className="section-title mb-3"><i className="bi bi-bank me-2"></i>{t('governmentSchemesTitle')}</h5>
        <form className="row g-2" onSubmit={(e) => { e.preventDefault(); fetchSchemes(); }}>
          <div className="col-md-5">
            <input className="form-control" placeholder={t('searchSchemes')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="col-md-3">
            <select className="form-select" value={govtLevel} onChange={(e) => setGovtLevel(e.target.value)}>
              <option value="">{t('allGovernments')}</option><option value="central">{t('centralGovernment')}</option><option value="tamil_nadu">{t('tamilNaduGovernment')}</option>
            </select>
          </div>
          <div className="col-md-2">
            <input className="form-control" placeholder={t('cropCategory')} value={cropCategory} onChange={(e) => setCropCategory(e.target.value)} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-agri w-100" type="submit">{t('search')}</button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : error ? (
        <div className="glass-card p-5 text-center">
          <p className="text-muted mb-3">{error}</p>
          <button className="btn btn-agri-outline btn-sm" onClick={fetchSchemes}>
            <i className="bi bi-arrow-clockwise me-1"></i>{t('retry')}
          </button>
        </div>
      ) : schemes.length === 0 ? (
        <div className="glass-card p-5 text-center text-muted">
          {t('noSchemes')}
        </div>
      ) : (
        <div className="row g-3">
          {schemes.map((s) => (
            <div className="col-md-6" key={s._id}>
              <div className="glass-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-1">
                  <h6 className="fw-bold mb-0">{s.title}</h6>
                  {s.govtLevel && (
                    <span className="badge bg-secondary">
                      {s.govtLevel === 'tamil_nadu' ? t('tamilNaduGovt') : s.govtLevel === 'central' ? t('centralGovt') : translateValue(t, s.govtLevel)}
                    </span>
                  )}
                </div>
                {s.department && <p className="text-muted small mb-1">{s.department}</p>}
                <p className="text-muted small">{translateValue(t, s.description, t('noDescription'))}</p>
                <p className="small mb-1"><strong>{t('eligibility')}:</strong> {s.eligibility?.length > 0 ? translateList(t, s.eligibility) : t('notAvailable')}</p><p className="small mb-1"><strong>{t('documents')}:</strong> {s.requiredDocuments?.length > 0 ? translateList(t, s.requiredDocuments) : t('notAvailable')}</p><p className="small mb-1"><strong>{t('benefits')}:</strong> {s.benefits?.length > 0 ? translateList(t, s.benefits) : t('notAvailable')}</p>
                {s.applicationProcess && (
                  <p className="small mb-1"><strong>{t('howToApply')}:</strong> {translateValue(t, s.applicationProcess)}</p>
                )}
                {s.cropCategory && (
                  <p className="small mb-1"><strong>{t('cropCategory')}:</strong> {translateValue(t, s.cropCategory)}</p>
                )}
                {s.applicableStates?.length > 0 && (
                  <p className="small mb-1"><strong>{t('applicableIn')}:</strong> {translateList(t, s.applicableStates)}</p>
                )}
                <p className="small mb-1"><strong>{t('lastDate')}:</strong> {s.lastDate ? new Date(s.lastDate).toLocaleDateString() : t('notAvailable')}</p>
                {s.dataSource && (
                  <p className="small text-muted mb-1" style={{ fontSize: 11 }}>
                    <strong>{t('source')}:</strong> {s.dataSource}
                  </p>
                )}
                {s.lastUpdated && (
                  <p className="small text-muted mb-2" style={{ fontSize: 11 }}>
                    {t('lastUpdated')}: {new Date(s.lastUpdated).toLocaleDateString()}
                  </p>
                )}
                {s.applyLink && (
                  <a href={s.applyLink} target="_blank" rel="noreferrer" className="btn btn-agri btn-sm">{t('applyNow')}</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schemes;
