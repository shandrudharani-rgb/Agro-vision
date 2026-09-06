import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/AuthContext';

const TAMIL_NADU = 'Tamil Nadu';
const formatPrice = (value) => value == null ? '—' : `₹${Number(value).toLocaleString('en-IN')}`;
const OfficialMarketPrices = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [prices, setPrices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ status: 'live', fetchedAt: null, message: '' });

  const fetchPrices = async (showError = false) => {
    setLoading(true);
    try {
      const { data } = await api.get('/market');
      setPrices(data.prices || []);
      setMeta({ status: 'cached', fetchedAt: new Date().toISOString(), message: '' });
    } catch (error) {
      setPrices([]);
      setMeta({ status: 'unavailable', fetchedAt: null, message: 'Unable to load market prices.' });
      if (showError) toast.error(error.response?.data?.message || t('marketPricesFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const filteredMarkets = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    const userDistrict = String(user?.district || '').trim().toLocaleLowerCase();
    const matchingMarkets = term ? prices.filter((price) => [price.cropName, price.market, price.district]
      .some((value) => String(value || '').toLocaleLowerCase().includes(term))) : [...prices];
    return matchingMarkets.sort((left, right) => {
      if (term) return new Date(right.priceDate || right.createdAt || 0) - new Date(left.priceDate || left.createdAt || 0);
      const leftMatchesDistrict = userDistrict && String(left.district || '').trim().toLocaleLowerCase() === userDistrict;
      const rightMatchesDistrict = userDistrict && String(right.district || '').trim().toLocaleLowerCase() === userDistrict;
      if (leftMatchesDistrict !== rightMatchesDistrict) return leftMatchesDistrict ? -1 : 1;
      return String(left.market || '').localeCompare(String(right.market || ''));
    });
  }, [prices, search, user?.district]);

  /*
  const statusCopy = {
    live: '🟢 Live Official Data',
    cached: '🟡 Cached Official Data',
    unavailable: '🔴 Unable to fetch latest data',
  };

  const dataStatus = meta.status === 'cached' ? 'MongoDB market data' : statusCopy[meta.status];
  */

  return (
    <div className="market-price-page">
      <section className="market-prices-search-bar glass-card p-3 p-md-4 mb-3">
        <div className="mb-3">
          <h5 className="section-title mb-1"><i className="bi bi-shop me-2"></i>{t('marketPricesTitle')}</h5>
          <p className="market-price-subtitle mb-0">Tamil Nadu market prices</p>
        </div>
        <label className="visually-hidden" htmlFor="market-price-search">Search crop, market, or district</label>
        <div className="market-price-search-input"><i className="bi bi-search" aria-hidden="true"></i><input id="market-price-search" className="form-control" placeholder="Search crop, market, or district..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      </section>
      <section className="glass-card p-0 overflow-hidden">
        {loading ? <div className="p-3"><div className="skeleton" style={{ height: 240 }} /></div> : prices.length === 0 ? <p className="text-muted text-center py-5 mb-0">{meta.message || 'No market prices are available for Tamil Nadu right now.'}</p> : <>
          <div className="market-price-table-heading px-3 px-md-4 py-3"><span>{filteredMarkets.length} {filteredMarkets.length === 1 ? 'market' : 'markets'}</span>{search && <span className="text-muted">matching &quot;{search}&quot;</span>}</div>
          {filteredMarkets.length === 0 ? <p className="text-muted text-center py-5 mb-0">No crop, market, or district matches your search.</p> : <div className="table-responsive market-price-table-wrap"><table className="table market-price-table align-middle mb-0"><thead><tr><th>Crop Name</th><th>Market Name</th><th>District</th><th>State</th><th className="text-end">Latest Price</th></tr></thead><tbody>{filteredMarkets.map((price) => <tr key={price._id || `${price.cropName}-${price.market}-${price.district}-${price.priceDate || ''}`}><td data-label="Crop Name" className="fw-semibold">{price.cropName || '-'}</td><td data-label="Market Name">{price.market || '-'}</td><td data-label="District">{price.district || '-'}</td><td data-label="State">{price.state || TAMIL_NADU}</td><td data-label="Latest Price" className="market-price-value">{formatPrice(price.modalPrice ?? price.todayPrice)}</td></tr>)}</tbody></table></div>}
        </>}
      </section>
    </div>
  );
  /* Previous crop-based board retained in comments for reference.
  return (
    <div className="market-price-page">
      <section className="market-prices-search-bar glass-card p-3 p-md-4 mb-3">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
          <div>
            <h5 className="section-title mb-1"><i className="bi bi-graph-up-arrow me-2"></i>{t('marketPricesTitle')}</h5>
            <p className="market-price-subtitle mb-1">Tamil Nadu market prices</p>
            <span className={`market-data-status market-data-status--${meta.status}`}>{statusCopy[meta.status]}</span>
            {meta.fetchedAt && <div className="small text-muted mt-1">Updated {new Date(meta.fetchedAt).toLocaleString()}</div>}
          </div>
          <button className="btn btn-agri-outline" type="button" onClick={() => fetchPrices(true)} disabled={loading}><i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`}></i>Refresh</button>
        </div>
        <label className="visually-hidden" htmlFor="market-price-search">Search by crop or district</label>
        <div className="market-price-search-input"><i className="bi bi-search" aria-hidden="true"></i><input id="market-price-search" className="form-control" placeholder="Search crop or district..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      </section>
      <section className="glass-card p-0 overflow-hidden">
        {loading ? <div className="p-3"><div className="skeleton" style={{ height: 240 }} /></div> : prices.length === 0 ? <p className="text-muted text-center py-5 mb-0">{meta.message || 'No market prices are available for Tamil Nadu right now.'}</p> : <>
          <div className="market-price-table-heading px-3 px-md-4 py-3"><span>{filteredPrices.length} {filteredPrices.length === 1 ? 'record' : 'records'}</span>{search && <span className="text-muted">matching “{search}”</span>}</div>
          {filteredPrices.length === 0 ? <p className="text-muted text-center py-5 mb-0">No crops or districts match your search.</p> : <div className="table-responsive market-price-table-wrap"><table className="table market-price-table align-middle mb-0"><thead><tr><th>Crop Name</th><th>State</th><th>District</th><th className="text-end">Price (Modal Price)</th></tr></thead><tbody>{filteredPrices.map((price, index) => <tr key={`${price.commodity}-${price.district}-${price.market || ''}-${price.arrivalDate || ''}-${index}`}><td data-label="Crop Name" className="fw-semibold">{translateCategory(t, 'cropNames', price.commodity || '—')}</td><td data-label="State">{TAMIL_NADU}</td><td data-label="District">{translateValue(t, price.district || '—')}</td><td data-label="Price (Modal Price)" className="market-price-value">{formatPrice(price.modalPrice)}</td></tr>)}</tbody></table></div>}
        </>}
      </section>
    </div>
  );
  /* Legacy grouped market view retained below temporarily for reference.
  return (
    <div>
      <div className="market-prices-search-bar glass-card p-4 mb-3">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
          <div>
            <h5 className="section-title mb-1"><i className="bi bi-graph-up-arrow me-2"></i>{t('marketPricesTitle')} — {TAMIL_NADU}</h5>
            <div className={`market-data-status market-data-status--${meta.status}`}>{statusCopy[meta.status]}</div>
            {meta.fetchedAt && <div className="small text-muted mt-1">Last Updated: {new Date(meta.fetchedAt).toLocaleString()}</div>}
          </div>
          <button className="btn btn-agri-outline" type="button" onClick={() => fetchPrices(true)} disabled={loading}>
            <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`}></i>Refresh
          </button>
        </div>
        {meta.message && meta.status !== 'live' && <div className="market-data-message small mb-3">{meta.message}</div>}
        <form className="row g-2" onSubmit={handleSearch}>
          <div className="col-md-5"><input className="form-control" placeholder={t('searchCrop')} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <div className="col-md-5"><input className="form-control" placeholder="Search district, city, or market..." value={market} onChange={(event) => setMarket(event.target.value)} /></div>
          <div className="col-md-2"><button className="btn btn-agri w-100" type="submit" disabled={loading}>{t('search')}</button></div>
        </form>
      </div>

      <div className="glass-card p-3">
        {loading ? <div className="skeleton" style={{ height: 200 }} /> : marketGroups.length === 0 ? (
          <p className="text-muted text-center py-4 mb-0">{meta.message || 'No live market price available for Tamil Nadu.'}</p>
        ) : <>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h6 className="mb-0">📍 {translateValue(t, summary.location)}{summary.location !== TAMIL_NADU ? ' District / City' : ''}</h6>
            <span className="badge text-bg-success">Total Markets: {summary.totalMarkets}</span>
          </div>
          {marketGroups.map((group) => <section key={group.district} className="mb-4">
            <h6 className="text-muted mb-2">📍 {translateValue(t, group.district)} District</h6>
            {group.markets.map((marketItem) => <details key={`${group.district}-${marketItem.name}`} className="border rounded p-3 mb-2 bg-white">
              <summary className="fw-semibold" style={{ cursor: 'pointer' }}>🏪 {translateValue(t, marketItem.name)} Market <span className="text-muted small">({marketItem.commodities.length} commodities)</span></summary>
              <div className="pt-3 mt-2 border-top">
                {marketItem.commodities.map((price) => <div key={`${price.commodity}-${price.variety || ''}`} className="mb-3">
                  <div className="fw-semibold">• {translateCategory(t, 'cropNames', price.commodity)}{price.variety ? <span className="text-muted fw-normal"> — {translateValue(t, price.variety)}</span> : ''}</div>
                  <div className="small ms-3">Min: {formatPrice(price.minPrice)}/qtl &nbsp; Max: {formatPrice(price.maxPrice)}/qtl &nbsp; Modal: {formatPrice(price.modalPrice)}/qtl</div>
                </div>)}
              </div>
            </details>)}
          </section>)}
        </>}
        {!loading && marketGroups.length > 0 && <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
          <span className="small text-muted">Showing {displayedMarkets} of {pagination.total} Tamil Nadu markets</span>
          {pagination.hasMore && <button className="btn btn-agri-outline" type="button" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>}
        </div>}
      </div>
    </div>
  );
  */
};

export default OfficialMarketPrices;
