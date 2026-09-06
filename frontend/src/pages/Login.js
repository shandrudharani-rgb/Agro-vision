import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';
import loginBg from '../assets/login-bg.jpg';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success(t('welcomeBack'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="auth-wrapper login-page"
      style={{
              backgroundImage: `url(${loginBg})`,
             backgroundSize: 'cover',
               backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
               minHeight: '100vh',
            }}
            >
      <section className="glass-card login-card" aria-labelledby="login-title">
        <div className="text-center login-card__header">
          <div className="login-card__brand" aria-label="Agro Vision">
            <span className="login-card__icon" aria-hidden="true"><i className="bi bi-leaf-fill"></i></span>
            <span>Agro Vision</span>
          </div>
          <h1 id="login-title" className="section-title login-card__title">{t('welcomeBackFarmer')}</h1>
          <p className="text-muted login-card__subtitle">{t('loginSubtitle')}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">{t('email')}</label>
            <div className="login-card__input-wrap">
              <i className="bi bi-envelope" aria-hidden="true"></i>
              <input
                type="email"
                className="form-control"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">{t('password')}</label>
            <div className="login-card__input-wrap">
              <i className="bi bi-shield-lock" aria-hidden="true"></i>
              <input
                type="password"
                className="form-control"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end mb-3">
            <Link to="/forgot-password" className="small text-decoration-none">{t('forgotPassword')}</Link>
          </div>
          <button type="submit" className="btn btn-agri w-100" disabled={loading}>
            {loading ? t('loggingIn') : t('login')}
          </button>
        </form>
        <p className="text-center mt-4 small">
          {t('newFarmer')} <Link to="/register">{t('createAccount')}</Link>
        </p>
      </section>
    </main>
  );
};

export default Login;
