import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';

const initialForm = {
  fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  state: '', district: '', village: '',
};

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success(t('accountCreated'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || t('registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card p-5" style={{ maxWidth: 560, width: '100%' }}>
        <div className="text-center mb-4">
          <i className="bi bi-flower2 fs-1" style={{ color: 'var(--agri-green-700)' }}></i>
          <h3 className="section-title mt-2">{t('createFarmerAccount')}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">{t('fullName')}</label>
              <input className="form-control" required value={form.fullName} onChange={update('fullName')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">{t('email')}</label>
              <input type="email" className="form-control" required value={form.email} onChange={update('email')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">{t('phone')}</label>
              <input className="form-control" required value={form.phone} onChange={update('phone')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">{t('state')}</label>
              <input className="form-control" required value={form.state} onChange={update('state')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">{t('district')}</label>
              <input className="form-control" required value={form.district} onChange={update('district')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">{t('village')}</label>
              <input className="form-control" required value={form.village} onChange={update('village')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">{t('password')}</label>
              <input type="password" className="form-control" required value={form.password} onChange={update('password')} />
            </div>
            <div className="col-md-6">
              <label className="form-label">{t('confirmPassword')}</label>
              <input type="password" className="form-control" required value={form.confirmPassword} onChange={update('confirmPassword')} />
            </div>
          </div>
          <button type="submit" className="btn btn-agri w-100 mt-4" disabled={loading}>
            {loading ? t('creatingAccount') : t('register')}
          </button>
        </form>
        <p className="text-center mt-4 small">
          {t('alreadyHaveAccount')} <Link to="/login">{t('login')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
