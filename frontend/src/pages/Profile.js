import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';

const Profile = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '', phone: user?.phone || '',
    state: user?.state || '', district: user?.district || '', village: user?.village || '',
    primaryCrop: user?.primaryCrop || '', // NEW (optional) — used to default the Pest Risk crop selector
  });
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', form);
      setUser(data.user);
      localStorage.setItem('agri_user', JSON.stringify(data.user));
      toast.success(t('profileUpdated'));
    } catch (err) {
      toast.error(t('updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-4" style={{ maxWidth: 560 }}>
      <h5 className="section-title mb-3"><i className="bi bi-person-circle me-2"></i>{t('farmerProfile')}</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="form-label small">{t('fullName')}</label>
          <input className="form-control" value={form.fullName} onChange={update('fullName')} />
        </div>
        <div className="mb-2">
          <label className="form-label small">{t('phone')}</label>
          <input className="form-control" value={form.phone} onChange={update('phone')} />
        </div>
        <div className="row g-2">
          <div className="col-4">
            <label className="form-label small">{t('state')}</label>
            <input className="form-control" value={form.state} onChange={update('state')} />
          </div>
          <div className="col-4">
            <label className="form-label small">{t('district')}</label>
            <input className="form-control" value={form.district} onChange={update('district')} />
          </div>
          <div className="col-4">
            <label className="form-label small">{t('village')}</label>
            <input className="form-control" value={form.village} onChange={update('village')} />
          </div>
        </div>
        <div className="mb-2 mt-2">
          <label className="form-label small">{t('primaryCrop')}</label>
          <input className="form-control" value={form.primaryCrop} onChange={update('primaryCrop')} placeholder={t('primaryCropPlaceholder')} />
        </div>
        <button type="submit" className="btn btn-agri mt-3" disabled={loading}>
          {loading ? t('saving') : t('saveChanges')}
        </button>
      </form>
    </div>
  );
};

export default Profile;
