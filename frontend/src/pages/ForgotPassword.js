import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(t('resetInstructionsGenerated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card p-5" style={{ maxWidth: 420, width: '100%' }}>
        <h3 className="section-title mb-3">{t('forgotPasswordTitle')}</h3>
        {sent ? (
          <div className="alert alert-success">
            {t('resetEmailMessage')}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">{t('email')}</label>
              <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-agri w-100" disabled={loading}>
              {loading ? t('sending') : t('sendResetLink')}
            </button>
          </form>
        )}
        <p className="text-center mt-4 small">
          <Link to="/login">{t('backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
