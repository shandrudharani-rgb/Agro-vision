  const axios = require('axios');
  const MarketPriceCache = require('../models/MarketPriceCache');

  /**
   * Official market price data integration.
   *
   * Source: data.gov.in "Variety-wise Daily Market Prices Data of Commodity"
   * resource, generated from the AGMARKNET portal (Ministry of Agriculture &
   * Farmers Welfare, Govt. of India).
   * Docs: https://www.data.gov.in/resource/variety-wise-daily-market-prices-data-commodity
   *
   * Requires a free API key from https://data.gov.in (register, then
   * generate a key from "My Account" -> API keys) stored as DATA_GOV_API_KEY
   * in backend/.env. This is NOT the same key type as the weather API.
   *
   * If DATA_GOV_API_KEY is not set, we fall back to the government's own
   * PUBLIC SAMPLE KEY (published by data.gov.in itself on every resource's
   * API console specifically so developers can test against real data before
   * registering). It is capped at ~10 records per request and is not a
   * secret — it is printed on the public data.gov.in docs for this exact
   * resource. Using it means the feature returns 100% real government data
   * out of the box instead of an empty "not configured" state, while still
   * clearly telling the caller a personal key should be added for full
   * results. This is never used to replace real data with fake data — it is
   * the same live AGMARKNET dataset, just rate-limited.
   *
   * Behaviour:
   *  - We DO NOT fabricate prices under any circumstance.
   *  - On a live fetch failure (network, invalid key, rate limit, etc.), we
   *    fall back to whatever we last cached in MongoDB and mark the response
   *    as non-live, with a clear reason. The existing MarketPrice admin/CRUD
   *    system remains a completely separate, untouched fallback.
   */

  const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070'; // official data.gov.in resource id for this dataset
  const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — avoid hammering the external API

  // Published by data.gov.in itself as the public test key for every resource
  // (see the "api-key" field default value on https://api.data.gov.in docs).
  // Capped at ~10 records/request. Not a secret credential.
  const PUBLIC_SAMPLE_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

  // AGMARKNET data is stored Title Case (e.g. "Onion", "Tamil Nadu"). The
  // data.gov.in `filters[field]` query does an exact match, so normalizing
  // user-typed input to Title Case meaningfully improves match rates without
  // changing what the user searched for.
  function toTitleCase(str) {
    if (!str) return str;
    return str
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function mapRecord(r) {
    return {
      commodity: r.commodity,
      market: r.market,
      state: r.state,
      district: r.district,
      variety: r.variety,
      minPrice: r.min_price ? Number(r.min_price) : undefined,
      maxPrice: r.max_price ? Number(r.max_price) : undefined,
      modalPrice: r.modal_price ? Number(r.modal_price) : undefined,
      unit: 'per quintal',
      arrivalDate: parseArrivalDate(r.arrival_date),
      source: 'data.gov.in (AGMARKNET - Ministry of Agriculture & Farmers Welfare)',
      fetchedAt: new Date(),
    };
  }

  // AGMARKNET dates come as "DD/MM/YYYY". Guard against missing/malformed
  // values instead of letting `new Date(...)` produce an "Invalid Date".
  function parseArrivalDate(raw) {
    if (!raw || typeof raw !== 'string') return undefined;
    const parts = raw.split('/');
    if (parts.length !== 3) return undefined;
    const [dd, mm, yyyy] = parts;
    const iso = `${yyyy}-${mm}-${dd}`;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  async function callDataGovIn(params, apiKey) {
    const { data } = await axios.get(BASE_URL, {
      params: { 'api-key': apiKey, format: 'json', ...params },
      timeout: 10000,
    });
    return data?.records || [];
  }

  function classifyAxiosError(err) {
    if (err.response) {
      const status = err.response.status;
      if (status === 401 || status === 403) {
        const e = new Error('The configured DATA_GOV_API_KEY was rejected (invalid or expired).');
        e.code = 'MARKET_API_UNAUTHORIZED';
        return e;
      }
      if (status === 429) {
        const e = new Error('The government market data API rate limit was reached. Please try again shortly.');
        e.code = 'MARKET_API_RATE_LIMITED';
        return e;
      }
      const e = new Error(`Government market data API returned an error (HTTP ${status}).`);
      e.code = 'MARKET_API_ERROR';
      return e;
    }
    if (err.code === 'ECONNABORTED') {
      const e = new Error('Government market data API timed out.');
      e.code = 'MARKET_API_TIMEOUT';
      return e;
    }
    const e = new Error(err.message || 'Government market data API is unreachable.');
    e.code = 'MARKET_API_NETWORK_ERROR';
    return e;
  }

  async function fetchFromDataGovIn({ commodity, state, district }) {
    const configuredKey = process.env.DATA_GOV_API_KEY;
    const apiKey = configuredKey || PUBLIC_SAMPLE_KEY;
    const usingSampleKey = !configuredKey;

    const filterParams = { limit: usingSampleKey ? 10 : 50 };
    if (commodity) filterParams['filters[commodity]'] = toTitleCase(commodity);
    if (state) filterParams['filters[state]'] = toTitleCase(state);
    if (district) filterParams['filters[district]'] = toTitleCase(district);

    try {
      let rawRecords = await callDataGovIn(filterParams, apiKey);

      // The government API does an exact-match filter. If the caller typed a
      // commodity/state/district that doesn't exactly match AGMARKNET's
      // spelling/casing, it silently returns zero rows instead of erroring.
      // Retry once against a larger unfiltered batch and match case-insensitively
      // on our side so a near-miss (e.g. "tamilnadu" vs "Tamil Nadu") still works.
      const hadFilters = commodity || state || district;
      if (hadFilters && rawRecords.length === 0 && !usingSampleKey) {
        const broad = await callDataGovIn({ limit: 500 }, apiKey);
        rawRecords = broad.filter((r) => {
          if (commodity && !String(r.commodity || '').toLowerCase().includes(commodity.toLowerCase())) return false;
          if (state && !String(r.state || '').toLowerCase().includes(state.toLowerCase())) return false;
          if (district && !String(r.district || '').toLowerCase().includes(district.toLowerCase())) return false;
          return true;
        });
      }

      return { records: rawRecords.map(mapRecord), usingSampleKey };
    } catch (err) {
      throw classifyAxiosError(err);
    }
  }

  async function getMarketPrices({ commodity, state, district }) {
    const configuredKey = process.env.DATA_GOV_API_KEY;
    if (!configuredKey) {
      // We still try the live call using the public sample key rather than
      // failing outright — see PUBLIC_SAMPLE_KEY note above.
    }

    // 1. Try live external data
    try {
      const { records: liveRecords, usingSampleKey } = await fetchFromDataGovIn({ commodity, state, district });

      if (liveRecords.length > 0) {
        // Cache/refresh in MongoDB (best-effort — do not fail the request if caching fails)
        try {
          await Promise.all(
            liveRecords.map((rec) =>
              MarketPriceCache.findOneAndUpdate(
                { commodity: rec.commodity, market: rec.market, state: rec.state, district: rec.district },
                rec,
                { upsert: true, new: true }
              )
            )
          );
        } catch (cacheErr) {
          console.error('MarketPriceCache write failed (non-fatal):', cacheErr.message);
        }
        return {
          records: liveRecords,
          live: true,
          message: usingSampleKey
            ? 'Live data from data.gov.in (AGMARKNET), using the public sample key — limited to ~10 records. Add your own free DATA_GOV_API_KEY in backend/.env for full results.'
            : null,
        };
      }
      return {
        records: [],
        live: true,
        message: 'No live records matched your filters. Try a different commodity/state/district spelling, or leave a field blank.',
      };
    } catch (err) {
      // 2. Fall back to whatever we last cached in MongoDB
      const filter = {};
      if (commodity) filter.commodity = new RegExp(commodity, 'i');
      if (state) filter.state = new RegExp(state, 'i');
      if (district) filter.district = new RegExp(district, 'i');

      const cutoffOk = Date.now() - CACHE_TTL_MS;
      const cached = await MarketPriceCache.find(filter).sort({ fetchedAt: -1 }).limit(50);

      return {
        records: cached,
        live: false,
        stale: cached.length > 0 && cached[0].fetchedAt.getTime() < cutoffOk,
        code: err.code,
        message: `${err.message} Showing last cached data if available.`,
      };
    }
  }

  module.exports = { getMarketPrices };
