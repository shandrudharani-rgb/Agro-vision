const axios = require('axios');
const MarketPriceCache = require('../models/MarketPriceCache');

const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;
const PUBLIC_SAMPLE_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
const CACHE_FRESHNESS_MS = 15 * 60 * 1000;
const OFFICIAL_SOURCE = 'AGMARKNET (data.gov.in)';
const TAMIL_NADU = 'Tamil Nadu';
// data.gov.in / AGMARKNET supports offset pagination. Keep each request at
// the documented 100-record page size and collect every page below.
const PAGE_SIZE = 100;
const API_TIMEOUT_MS = 10 * 1000;
const DEFAULT_RESPONSE_LIMIT = 100;
const MAX_RESPONSE_LIMIT = 50000;

const parseArrivalDate = (value) => {
  if (!value || typeof value !== 'string') return undefined;
  const [day, month, year] = value.split('/');
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const mapOfficialRecord = (record, fetchedAt) => ({
  commodity: record.commodity,
  market: record.market,
  state: TAMIL_NADU,
  district: record.district,
  variety: record.variety,
  minPrice: record.min_price == null ? undefined : Number(record.min_price),
  maxPrice: record.max_price == null ? undefined : Number(record.max_price),
  modalPrice: record.modal_price == null ? undefined : Number(record.modal_price),
  unit: 'per quintal',
  arrivalDate: parseArrivalDate(record.arrival_date),
  source: OFFICIAL_SOURCE,
  fetchedAt,
});

function cacheFilter({ commodity, market, district }) {
  const filter = { state: TAMIL_NADU };
  if (commodity) filter.commodity = new RegExp(escapeRegExp(commodity), 'i');
  const location = market || district;
  if (location && !isTamilNaduSearch(location)) {
    const locationPattern = new RegExp(escapeRegExp(location), 'i');
    filter.$or = [{ market: locationPattern }, { district: locationPattern }];
  }
  return filter;
}

function isTamilNaduRecord(record) {
  return String(record?.state || '').trim().toLowerCase() === TAMIL_NADU.toLowerCase();
}

function includesSearch(value, search) {
  return String(value || '').toLowerCase().includes(search);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesSearch(record, { commodity, market, district }) {
  const commoditySearch = String(commodity || '').trim().toLowerCase();
  // The location search must match either an AGMARKNET market name or district.
  const locationSearch = String(market || district || '').trim().toLowerCase();
  return (!commoditySearch || includesSearch(record.commodity, commoditySearch))
    && (!locationSearch || isTamilNaduSearch(locationSearch)
      || includesSearch(record.market, locationSearch)
      || includesSearch(record.district, locationSearch));
}

function isTamilNaduSearch(value) {
  return String(value || '').trim().toLowerCase() === TAMIL_NADU.toLowerCase();
}

function requestedLocation(filters) {
  return String(filters.market || filters.district || '').trim();
}

function errorMessage(error) {
  if (error.response?.status === 401 || error.response?.status === 403) return 'The configured DATA_GOV_API_KEY was rejected.';
  if (error.response?.status === 429) return 'The government market data service is temporarily rate limited.';
  if (error.code === 'ECONNABORTED') return 'The government market data request timed out.';
  return 'Unable to reach the official government market data service.';
}

async function fetchOfficialRecords(filters) {
  const configuredKey = process.env.DATA_GOV_API_KEY?.trim();
  const usingSampleKey = !configuredKey;
  const baseParams = { 'api-key': configuredKey || PUBLIC_SAMPLE_KEY, format: 'json' };
  // Never accept a caller-selected state for the official request.
  baseParams['filters[state]'] = TAMIL_NADU;
  // Location and commodity searches are partial and case-insensitive, while
  // AGMARKNET's filters are exact-only. Fetch the complete Tamil Nadu dataset
  // first, then apply state, district and commodity filters locally.

  const fetchPages = async (params) => {
    const records = [];
    let offset = 0;
    while (true) {
      const { data } = await axios.get(BASE_URL, {
        params: { ...params, limit: PAGE_SIZE, offset },
        timeout: API_TIMEOUT_MS,
      });
      const page = Array.isArray(data?.records) ? data.records : [];
      if (page.length === 0) break;
      records.push(...page);
      offset += PAGE_SIZE;
    }
    return records;
  };

  const queriedRecords = await fetchPages(baseParams);
  const records = [...new Map(queriedRecords.map((record) => [
    `${record.state}|${record.commodity}|${record.market}|${record.district}|${record.variety}|${record.arrival_date}`,
    record,
  ])).values()];
  return { records, usingSampleKey };
}

async function saveOfficialCache(records) {
  await Promise.all(records.map((record) => MarketPriceCache.findOneAndUpdate(
    { commodity: record.commodity, market: record.market, state: record.state, district: record.district, variety: record.variety },
    record,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )));
}

function buildLiveResponse(records, usingSampleKey, filters) {
  const fetchedAt = new Date();
  const officialRecords = records
    .filter(isTamilNaduRecord)
    .filter((record) => matchesSearch(record, filters))
    .map((record) => mapOfficialRecord(record, fetchedAt))
    .filter(isTamilNaduRecord);
  if (officialRecords.length) {
    saveOfficialCache(officialRecords).catch((error) => console.error('Official market-price cache write failed:', error.message));
  }
  return {
    records: officialRecords,
    status: 'live',
    live: true,
    fetchedAt,
    source: OFFICIAL_SOURCE,
    message: usingSampleKey
      ? 'Live Official Data (AGMARKNET public access). Configure DATA_GOV_API_KEY for unrestricted statewide results.'
      : 'Live Official Data.',
  };
}

function paginateMarkets(records, { page = 1, limit = DEFAULT_RESPONSE_LIMIT } = {}) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(MAX_RESPONSE_LIMIT, Math.max(1, Number.parseInt(limit, 10) || DEFAULT_RESPONSE_LIMIT));
  const byMarket = new Map();

  records.forEach((record) => {
    const market = record.market || 'Market not provided';
    const marketKey = market.trim().toLowerCase();
    const existing = byMarket.get(marketKey);
    const recordDate = new Date(record.arrivalDate || 0).getTime();
    const existingDate = new Date(existing?.arrivalDate || 0).getTime();
    // A market can publish prices for many crops and varieties. The market
    // board deliberately shows one row: its newest available modal price.
    if (!existing || recordDate > existingDate) byMarket.set(marketKey, record);
  });

  const allMarkets = [...byMarket.values()]
    .sort((left, right) => String(left.market).localeCompare(String(right.market)));
  const total = allMarkets.length;
  const start = (safePage - 1) * safeLimit;
  const currentMarkets = allMarkets.slice(start, start + safeLimit);
  return {
    records: currentMarkets,
    marketGroups: [],
    totalMarkets: total,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasMore: start + safeLimit < total,
    },
  };
}

function presentMarketResponse(response, filters, pagination) {
  const marketPresentation = paginateMarkets(response.records, pagination);
  const location = requestedLocation(filters);
  const noMatchesMessage = location && response.records.length === 0
    ? `No official markets found for '${location}'. Please try another district or search 'Tamil Nadu'.`
    : response.message;
  return {
    ...response,
    ...marketPresentation,
    summary: {
      location: location || TAMIL_NADU,
      totalMarkets: marketPresentation.totalMarkets,
    },
    message: noMatchesMessage,
  };
}

async function getCachedResponse(filters) {
  const cached = await MarketPriceCache.find(cacheFilter(filters)).sort({ fetchedAt: -1, arrivalDate: -1 }).lean();
  const records = cached.filter(isTamilNaduRecord).filter((record) => matchesSearch(record, filters));
  if (!records.length) return null;
  const fetchedAt = records[0].fetchedAt;
  return {
    records,
    status: 'cached',
    live: false,
    stale: Date.now() - new Date(fetchedAt).getTime() > CACHE_FRESHNESS_MS,
    fetchedAt,
    source: OFFICIAL_SOURCE,
    message: 'Showing last available official market prices.',
  };
}

async function getOfficialMarketPrices(filters = {}, pagination = {}) {
  // State is permanently fixed so external callers cannot override it.
  const tamilNaduFilters = { ...filters, state: TAMIL_NADU };
  // The cache is only a fallback. Returning it before the live statewide
  // request completes can expose a partial previous fetch (for example, a
  // single district) instead of the complete Tamil Nadu result set.
  const cachedPromise = getCachedResponse(tamilNaduFilters).catch(() => null);
  const livePromise = fetchOfficialRecords(tamilNaduFilters);
  try {
    const { records, usingSampleKey } = await livePromise;
    const response = buildLiveResponse(records, usingSampleKey, tamilNaduFilters);
    return presentMarketResponse(response, tamilNaduFilters, pagination);
  } catch (error) {
    const cached = await cachedPromise;
    if (cached) return presentMarketResponse(cached, tamilNaduFilters, pagination);
    return {
      records: [],
      status: 'unavailable',
      live: false,
      fetchedAt: null,
      source: OFFICIAL_SOURCE,
      message: errorMessage(error),
      ...presentMarketResponse({ records: [], message: errorMessage(error) }, tamilNaduFilters, pagination),
    };
  }
}

module.exports = { getOfficialMarketPrices, TAMIL_NADU, isTamilNaduRecord, matchesSearch };
