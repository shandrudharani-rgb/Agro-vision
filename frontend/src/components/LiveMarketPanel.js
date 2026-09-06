import React, { useState } from 'react';
import api from '../services/api';

// Official/live mandi price lookup via the /api/market-live endpoint.
// Rendered additionally inside the existing MarketPrices.js page, below the
// existing table, and does not touch any existing state, request, or markup
// on that page.
const LiveMarketPanel = () => {
  const [commodity, setCommodity] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const runSearch = async () => {
    setLoading(true);
    setSearched(true);
    setNetworkError(false);
    try {
      const { data } = await api.get('/market-live', { params: { commodity, state, district } });
      setRecords(data.records || []);
      setMeta({ live: data.live, stale: data.stale, message: data.message, code: data.code });
    } catch (err) {
      setRecords([]);
      if (!err.response) {
        // No response at all = network failure (backend unreachable, offline, etc.)
        setNetworkError(true);
        setMeta({ live: false, message: 'Could not reach the server. Check your connection and try again.' });
      } else {
        setMeta({
          live: false,
          message: err.response?.data?.message || 'Live market data is currently unavailable.',
          code: err.response?.data?.code,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch();
  };

  const alertClass = networkError || meta?.code
    ? 'alert-warning'
    : meta?.live
      ? 'alert-info'
      : 'alert-secondary';

  // return (
  //   <div className="glass-card p-4 mt-3">
  //     <h6 className="section-title mb-1">
  //       <i className="bi bi-broadcast me-2"></i>Official Live Mandi Prices (AGMARKNET / data.gov.in)
  //     </h6>
  //     <p className="text-muted small mb-3">
  //       Looks up real government mandi price data. Falls back to the most recent cached data if the
  //       live source is temporarily unavailable.
  //     </p>
  //     <form className="row g-2" onSubmit={handleSearch}>
  //       <div className="col-md-4">
  //         <input className="form-control" placeholder="Commodity (e.g. Onion)" value={commodity} onChange={(e) => setCommodity(e.target.value)} />
  //       </div>
  //       <div className="col-md-3">
  //         <input className="form-control" placeholder="State (e.g. Tamil Nadu)" value={state} onChange={(e) => setState(e.target.value)} />
  //       </div>
  //       <div className="col-md-3">
  //         <input className="form-control" placeholder="District" value={district} onChange={(e) => setDistrict(e.target.value)} />
  //       </div>
  //       <div className="col-md-2">
  //         <button className="btn btn-agri w-100" type="submit" disabled={loading}>
  //           {loading ? '...' : 'Search'}
  //         </button>
  //       </div>
  //     </form>

  //     {meta?.message && (
  //       <div className={`alert ${alertClass} small mt-3 mb-0 d-flex justify-content-between align-items-center flex-wrap gap-2`}>
  //         <span>{meta.message}</span>
  //         {(networkError || meta?.code) && (
  //           <button type="button" className="btn btn-sm btn-outline-secondary" onClick={runSearch} disabled={loading}>
  //             <i className="bi bi-arrow-clockwise me-1"></i>Retry
  //           </button>
  //         )}
  //       </div>
  //     )}

  //     {searched && !loading && records.length > 0 && (
  //       <div className="table-responsive mt-3">
  //         <table className="table table-sm align-middle">
  //           <thead>
  //             <tr>
  //               <th>Commodity</th><th>Market</th><th>State</th><th>District</th>
  //               <th>Min</th><th>Max</th><th>Modal</th><th>Date</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             {records.map((r, i) => (
  //               <tr key={r._id || i}>
  //                 <td>{r.commodity || '—'}</td>
  //                 <td>{r.market || '—'}</td>
  //                 <td>{r.state || '—'}</td>
  //                 <td>{r.district || '—'}</td>
  //                 <td>{r.minPrice != null ? `₹${r.minPrice}` : '—'}</td>
  //                 <td>{r.maxPrice != null ? `₹${r.maxPrice}` : '—'}</td>
  //                 <td>{r.modalPrice != null ? `₹${r.modalPrice}` : '—'}</td>
  //                 <td>{r.arrivalDate ? new Date(r.arrivalDate).toLocaleDateString() : '—'}</td>
  //               </tr>
  //             ))}
  //           </tbody>
  //         </table>
  //         <div className="small text-muted" style={{ fontSize: 11 }}>
  //           {meta.live ? 'Live data' : 'Cached data'}{meta.stale ? ' (may be outdated)' : ''} · Source: data.gov.in (AGMARKNET)
  //         </div>
  //       </div>
  //     )}

  //     {searched && !loading && records.length === 0 && !meta?.message && (
  //       <p className="text-muted small text-center py-3 mb-0">No matching live market records found.</p>
  //     )}
  //   </div>
  // );
};

export default LiveMarketPanel;
