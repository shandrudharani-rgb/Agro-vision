import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';

const initial = {
  crop: '', seedCost: '', fertilizerCost: '', pesticideCost: '', labourCost: '',
  irrigationCost: '', machineryCost: '', transportationCost: '', sellingPrice: '', yieldAmount: '',
};

const ProfitCalculator = () => {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/profit/calculate', form);
      setResult(data.calculation.result);
      toast.success(t('profitCalculated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('calculationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const chartData = result
    ? [
        { name: t('totalCost'), value: result.totalCost }, { name: t('totalRevenue'), value: result.totalRevenue }, { name: t('profit'), value: result.profit }, { name: t('loss'), value: result.loss },
      ]
    : [];

  return (
    <div className="row g-3">
      <div className="col-md-6">
        <div className="glass-card p-4">
          <h5 className="section-title mb-3"><i className="bi bi-calculator me-2"></i>{t('profitCalculatorTitle')}</h5>
          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label className="form-label small">{t('crop')}</label>
              <input className="form-control" required value={form.crop} onChange={update('crop')} />
            </div>
            <div className="row g-2">
              {[
                ['seedCost', 'Seed Cost'], ['fertilizerCost', 'Fertilizer Cost'],
                ['pesticideCost', 'Pesticide Cost'], ['labourCost', 'Labour Cost'],
                ['irrigationCost', 'Irrigation Cost'], ['machineryCost', 'Machinery Cost'],
                ['transportationCost', 'Transportation Cost'], ['sellingPrice', 'Selling Price (per unit)'],
                ['yieldAmount', 'Yield (units)'],
              ].map(([field, label]) => (
                <div className="col-6" key={field}>
                  <label className="form-label small">{label}</label>
                  <input type="number" step="any" className="form-control" required value={form[field]} onChange={update(field)} />
                </div>
              ))}
            </div>
            <button type="submit" className="btn btn-agri w-100 mt-3" disabled={loading}>
            {loading ? t('calculating') : t('calculateProfit')}
            </button>
          </form>
        </div>
      </div>
      <div className="col-md-6">
        <div className="glass-card p-4 h-100">
          <h5 className="section-title mb-3">{t('result')}</h5>
          {!result ? (
            <p className="text-muted small">{t('profitHelp')}</p>
          ) : (
            <div>
              <div className="row text-center mb-3">
                <div className="col-6">
                  <div className="fs-5 fw-bold">₹{result.totalCost.toLocaleString()}</div>
                  <div className="small text-muted">{t('totalCost')}</div>
                </div>
                <div className="col-6">
                  <div className="fs-5 fw-bold">₹{result.totalRevenue.toLocaleString()}</div>
                  <div className="small text-muted">{t('totalRevenue')}</div>
                </div>
                <div className="col-6 mt-2">
                  <div className="fs-5 fw-bold text-success">₹{result.profit.toLocaleString()}</div>
                  <div className="small text-muted">{t('profit')}</div>
                </div>
                <div className="col-6 mt-2">
                  <div className="fs-5 fw-bold text-danger">₹{result.loss.toLocaleString()}</div>
                  <div className="small text-muted">{t('loss')}</div>
                </div>
              </div>
              <div className="text-center mb-3">
                <span className={`badge ${result.profitPercentage >= 0 ? 'bg-success' : 'bg-danger'}`}>
                  {result.profitPercentage}% {result.profitPercentage >= 0 ? t('profit') : t('loss')}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2e9e5b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfitCalculator;
