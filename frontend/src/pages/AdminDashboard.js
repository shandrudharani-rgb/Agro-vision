import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';

const TABS = ['Analytics', 'Farmers', 'Schemes', 'Market Prices', 'Pest Alerts'];

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState('Analytics');
  const [analytics, setAnalytics] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [schemeForm, setSchemeForm] = useState({
    title: '', description: '', eligibility: '', requiredDocuments: '', benefits: '', lastDate: '', applyLink: '',
    // NEW (optional) fields — additive only, existing fields above are unchanged
    department: '', govtLevel: '', applicationProcess: '', cropCategory: '', applicableStates: '',
  });
  const [marketForm, setMarketForm] = useState({ cropName: '', market: '', state: '', district: '', todayPrice: '', yesterdayPrice: '' });
  const [pestForm, setPestForm] = useState({ pestName: '', crop: '', season: '', state: '', district: '', riskLevel: 'medium', prevention: '', recommendedActions: '' });

  useEffect(() => {
    api
      .get('/admin/analytics')
      .then(({ data }) => setAnalytics(data.analytics))
      .catch(() => toast.error(t('analyticsFailed')));
  }, []);

  useEffect(() => {
    if (tab === 'Farmers') {
      api
        .get('/admin/farmers')
        .then(({ data }) => setFarmers(data.farmers))
        .catch(() => toast.error(t('farmersFailed')));
    }
    if (tab === 'Schemes') {
      api
        .get('/schemes')
        .then(({ data }) => setSchemes(data.schemes))
        .catch(() => toast.error(t('schemesFailed')));
    }
  }, [tab]);

  const handleAddScheme = async (e) => {
    e.preventDefault();
    try {
      await api.post('/schemes', {
        ...schemeForm,
        eligibility: schemeForm.eligibility.split(',').map((s) => s.trim()).filter(Boolean),
        requiredDocuments: schemeForm.requiredDocuments.split(',').map((s) => s.trim()).filter(Boolean),
        benefits: schemeForm.benefits.split(',').map((s) => s.trim()).filter(Boolean),
        applicableStates: schemeForm.applicableStates
          ? schemeForm.applicableStates.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      });
      toast.success(t('schemeAdded'));
      setSchemeForm({
        title: '', description: '', eligibility: '', requiredDocuments: '', benefits: '', lastDate: '', applyLink: '',
        department: '', govtLevel: '', applicationProcess: '', cropCategory: '', applicableStates: '',
      });
      const { data } = await api.get('/schemes');
      setSchemes(data.schemes);
    } catch {
      toast.error(t('schemeAddFailed'));
    }
  };

  const handleAddMarketPrice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/market', marketForm);
      toast.success(t('marketPriceAdded'));
      setMarketForm({ cropName: '', market: '', state: '', district: '', todayPrice: '', yesterdayPrice: '' });
    } catch {
      toast.error(t('priceAddFailed'));
    }
  };

  const handleAddPestAlert = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pest-alerts', {
        ...pestForm,
        prevention: pestForm.prevention.split(',').map((s) => s.trim()).filter(Boolean),
        recommendedActions: pestForm.recommendedActions.split(',').map((s) => s.trim()).filter(Boolean),
      });
      toast.success(t('pestAlertAdded'));
      setPestForm({ pestName: '', crop: '', season: '', state: '', district: '', riskLevel: 'medium', prevention: '', recommendedActions: '' });
    } catch {
      toast.error(t('alertAddFailed'));
    }
  };

  const removeFarmer = async (id) => {
    if (!window.confirm(t('removeFarmerConfirmation'))) return;
    try {
      await api.delete(`/admin/farmers/${id}`);
      setFarmers(farmers.filter((f) => f._id !== id));
      toast.success(t('farmerRemoved'));
    } catch (err) {
      toast.error(t('farmerRemoveFailed'));
    }
  };

  return (
    <div>
      <div className="glass-card p-3 mb-3 d-flex gap-2 flex-wrap">
        {TABS.map((tabLabel) => (
          <button key={tabLabel} className={`btn btn-sm ${tab === tabLabel ? 'btn-agri' : 'btn-light'}`} onClick={() => setTab(tabLabel)}>{t(tabLabel.toLowerCase().replace(' ', ''))}</button>
        ))}
      </div>

      {tab === 'Analytics' && (
        <div className="row g-3">
          {analytics && Object.entries(analytics).map(([key, value]) => (
            <div className="col-md-3 col-6" key={key}>
              <div className="glass-card p-3 text-center">
                <div className="fs-3 fw-bold">{value}</div>
                <div className="small text-muted text-capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Farmers' && (
        <div className="glass-card p-3">
          <div className="table-responsive">
            <table className="table">
              <thead><tr><th>{t('name')}</th><th>{t('email')}</th><th>{t('village')}</th><th>{t('role')}</th><th></th></tr></thead>
              <tbody>
                {farmers.map((f) => (
                  <tr key={f._id}>
                    <td>{f.fullName}</td><td>{f.email}</td><td>{f.village}</td><td>{f.role}</td>
                    <td><button className="btn btn-sm btn-outline-danger" onClick={() => removeFarmer(f._id)}>{t('remove')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Schemes' && (
        <div className="row g-3">
          <div className="col-md-5">
            <div className="glass-card p-3">
              <h6 className="section-title mb-2">{t('addScheme')}</h6>
              <form onSubmit={handleAddScheme}>
                <input className="form-control mb-2" placeholder={t('title')} required value={schemeForm.title} onChange={(e) => setSchemeForm({ ...schemeForm, title: e.target.value })} />
                <textarea className="form-control mb-2" placeholder={t('description')} value={schemeForm.description} onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })} />
                <input className="form-control mb-2" placeholder={t('eligibilityComma')} value={schemeForm.eligibility} onChange={(e) => setSchemeForm({ ...schemeForm, eligibility: e.target.value })} /><input className="form-control mb-2" placeholder={t('documentsComma')} value={schemeForm.requiredDocuments} onChange={(e) => setSchemeForm({ ...schemeForm, requiredDocuments: e.target.value })} /><input className="form-control mb-2" placeholder={t('benefitsComma')} value={schemeForm.benefits} onChange={(e) => setSchemeForm({ ...schemeForm, benefits: e.target.value })} />
                <input type="date" className="form-control mb-2" value={schemeForm.lastDate} onChange={(e) => setSchemeForm({ ...schemeForm, lastDate: e.target.value })} />
                <input className="form-control mb-2" placeholder={t('applyLink')} value={schemeForm.applyLink} onChange={(e) => setSchemeForm({ ...schemeForm, applyLink: e.target.value })} />
                {/* NEW (optional) fields below — existing fields above are unchanged */}
                <input className="form-control mb-2" placeholder={t('governmentDepartment')} value={schemeForm.department} onChange={(e) => setSchemeForm({ ...schemeForm, department: e.target.value })} />
                <select className="form-select mb-2" value={schemeForm.govtLevel} onChange={(e) => setSchemeForm({ ...schemeForm, govtLevel: e.target.value })}>
                  <option value="">{t('governmentLevelOptional')}</option><option value="central">{t('centralGovernment')}</option><option value="tamil_nadu">{t('tamilNaduGovernment')}</option><option value="other_state">{t('otherStateGovernment')}</option>
                </select>
                <textarea className="form-control mb-2" placeholder={t('applicationProcessOptional')} value={schemeForm.applicationProcess} onChange={(e) => setSchemeForm({ ...schemeForm, applicationProcess: e.target.value })} /><input className="form-control mb-2" placeholder={t('cropCategoryOptional')} value={schemeForm.cropCategory} onChange={(e) => setSchemeForm({ ...schemeForm, cropCategory: e.target.value })} /><input className="form-control mb-2" placeholder={t('applicableStates')} value={schemeForm.applicableStates} onChange={(e) => setSchemeForm({ ...schemeForm, applicableStates: e.target.value })} /><button className="btn btn-agri w-100" type="submit">{t('addScheme')}</button>
              </form>
            </div>
          </div>
          <div className="col-md-7">
            {schemes.map((s) => (
              <div key={s._id} className="glass-card p-3 mb-2">
                <strong>{s.title}</strong>
                <p className="small text-muted mb-0">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Market Prices' && (
        <div className="glass-card p-3" style={{ maxWidth: 500 }}>
          <h6 className="section-title mb-2">{t('addMarketPrice')}</h6>
          <form onSubmit={handleAddMarketPrice}>
            <input className="form-control mb-2" placeholder={t('cropName')} required value={marketForm.cropName} onChange={(e) => setMarketForm({ ...marketForm, cropName: e.target.value })} /><input className="form-control mb-2" placeholder={t('market')} required value={marketForm.market} onChange={(e) => setMarketForm({ ...marketForm, market: e.target.value })} />
            <div className="row g-2">
              <div className="col-6"><input className="form-control" placeholder={t('state')} value={marketForm.state} onChange={(e) => setMarketForm({ ...marketForm, state: e.target.value })} /></div><div className="col-6"><input className="form-control" placeholder={t('district')} value={marketForm.district} onChange={(e) => setMarketForm({ ...marketForm, district: e.target.value })} /></div><div className="col-6"><input type="number" className="form-control" placeholder={t('todayPrice')} required value={marketForm.todayPrice} onChange={(e) => setMarketForm({ ...marketForm, todayPrice: e.target.value })} /></div><div className="col-6"><input type="number" className="form-control" placeholder={t('yesterdayPrice')} required value={marketForm.yesterdayPrice} onChange={(e) => setMarketForm({ ...marketForm, yesterdayPrice: e.target.value })} /></div>
            </div>
            <button className="btn btn-agri w-100 mt-2" type="submit">{t('addPrice')}</button>
          </form>
        </div>
      )}

      {tab === 'Pest Alerts' && (
        <div className="glass-card p-3" style={{ maxWidth: 500 }}>
          <h6 className="section-title mb-2">{t('addPestAlert')}</h6>
          <form onSubmit={handleAddPestAlert}>
            <input className="form-control mb-2" placeholder={t('pestName')} required value={pestForm.pestName} onChange={(e) => setPestForm({ ...pestForm, pestName: e.target.value })} />
            <div className="row g-2">
              <div className="col-6"><input className="form-control" placeholder={t('crop')} value={pestForm.crop} onChange={(e) => setPestForm({ ...pestForm, crop: e.target.value })} /></div><div className="col-6"><input className="form-control" placeholder={t('season')} value={pestForm.season} onChange={(e) => setPestForm({ ...pestForm, season: e.target.value })} /></div><div className="col-6"><input className="form-control" placeholder={t('state')} value={pestForm.state} onChange={(e) => setPestForm({ ...pestForm, state: e.target.value })} /></div><div className="col-6"><input className="form-control" placeholder={t('district')} value={pestForm.district} onChange={(e) => setPestForm({ ...pestForm, district: e.target.value })} /></div>
            </div>
            <select className="form-select my-2" value={pestForm.riskLevel} onChange={(e) => setPestForm({ ...pestForm, riskLevel: e.target.value })}>
              <option value="low">{t('lowRisk')}</option><option value="medium">{t('mediumRisk')}</option><option value="high">{t('highRisk')}</option>
            </select>
            <input className="form-control mb-2" placeholder={t('preventionComma')} value={pestForm.prevention} onChange={(e) => setPestForm({ ...pestForm, prevention: e.target.value })} /><input className="form-control mb-2" placeholder={t('actionsComma')} value={pestForm.recommendedActions} onChange={(e) => setPestForm({ ...pestForm, recommendedActions: e.target.value })} /><button className="btn btn-agri w-100" type="submit">{t('addAlert')}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
