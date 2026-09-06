import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import LiveMarketPanel from '../components/LiveMarketPanel';
import { useTranslation } from '../hooks/useTranslation';
import { translateCategory, translateValue } from '../utils/translateValue';

const getMarketState = (price) => {
  const apiState = price.state ?? price.State ?? price.state_name ?? price.stateName;
  return typeof apiState === 'string' && apiState.trim() ? apiState : 'Tamil Nadu';
};

const MarketPrices = () => {
  const { t } = useTranslation();
  const [prices, setPrices] = useState([]);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [market, setMarket] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (state.trim()) params.state = state.trim();
      if (market.trim()) params.market = market.trim();
      const { data } = await api.get('/market', { params });
      setPrices(data.prices || []);
    } catch (err) {
      setPrices([]);
      toast.error(err.response?.data?.message || t('marketPricesFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPrices();
  };

  return (
    <div>
      <div className="glass-card p-4 mb-3">
        <h5 className="section-title mb-3"><i className="bi bi-graph-up-arrow me-2"></i>{t('marketPricesTitle')}</h5>
        <form className="row g-2" onSubmit={handleSearch}>
          <div className="col-md-4">
            <input className="form-control" placeholder={t('searchCrop')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="col-md-3">
            <input className="form-control" placeholder={t('filterState')} value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="col-md-3">
            <input className="form-control" placeholder={t('filterMarket')} value={market} onChange={(e) => setMarket(e.target.value)} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-agri w-100" type="submit">{t('search')}</button>
          </div>
        </form>
      </div>

      <div className="glass-card p-3">
        {loading ? (
          <div className="skeleton" style={{ height: 200 }} />
        ) : prices.length === 0 ? (
          <p className="text-muted text-center py-4">{t('noMarketPrices')}</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle w-100" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th>{t('crop')}</th><th>{t('state')}</th><th>{t('market')}</th><th>{t('minimumPrice')}</th><th>{t('maximumPrice')}</th><th>{t('modalPrice')}</th><th>{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p) => {
                  return (
                    <tr key={p._id}>
                      <td className="fw-semibold">{translateCategory(t, 'cropNames', p.cropName)}</td>
                      <td>{translateValue(t, getMarketState(p))}</td>
                      <td>{translateValue(t, p.market)}</td>
                      <td>₹{p.minPrice ?? p.modalPrice ?? p.todayPrice}</td>
                      <td>₹{p.maxPrice ?? p.modalPrice ?? p.todayPrice}</td>
                      <td>₹{p.modalPrice ?? p.todayPrice}</td>
                      <td>{p.priceDate ? new Date(p.priceDate).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW (additive): official/live external mandi price lookup */}
      <LiveMarketPanel />
    </div>
  );
};

export default MarketPrices;
