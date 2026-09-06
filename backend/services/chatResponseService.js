const MarketPrice = require('../models/MarketPrice');
const GovernmentScheme = require('../models/GovernmentScheme');
const CropRecommendation = require('../models/CropRecommendation');
const SoilHealth = require('../models/SoilHealth');
const PestRiskPrediction = require('../models/PestRiskPrediction');

const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const responseCache = new Map();

const normalise = (text) => text.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
const cacheKey = (userId, message) => `${userId}:${normalise(message)}`;

function getCachedReply(userId, message) {
  const key = cacheKey(userId, message);
  const cached = responseCache.get(key);
  if (!cached || cached.expiresAt < Date.now()) {
    responseCache.delete(key);
    return null;
  }
  // Refresh recency without extending the freshness window.
  responseCache.delete(key);
  responseCache.set(key, cached);
  return cached.reply;
}

function cacheReply(userId, message, reply) {
  const key = cacheKey(userId, message);
  responseCache.set(key, { reply, expiresAt: Date.now() + CACHE_TTL_MS });
  if (responseCache.size > MAX_CACHE_ENTRIES) responseCache.delete(responseCache.keys().next().value);
}

const isGreeting = (question) => /^(hi|hello|hey|vanakkam|வணக்கம்|ஹாய்|ஹலோ)[!. ]*$/iu.test(question);
const isSchemeQuestion = (question) => /\b(scheme|schemes|subsidy|pm-kisan|pm kisan|pmfby|kisan credit)\b|திட்டம்|மானியம்/iu.test(question);
const isPriceQuestion = (question) => /\b(price|prices|rate|rates|market price|market rates)\b|விலை|ரேட்/iu.test(question);

const makeSchemeReply = (schemes) => schemes.slice(0, 3).map((scheme) => {
  const benefit = scheme.benefits?.[0] || scheme.description;
  return `${scheme.title}: ${benefit}${scheme.applyLink ? ` Apply: ${scheme.applyLink}` : ''}`;
}).join('\n');

const makePriceReply = (prices) => prices.slice(0, 3).map((price) => (
  `${price.cropName} — ₹${price.modalPrice} ${price.unit || 'per quintal'} at ${price.market}${price.priceDate ? ` (${new Date(price.priceDate).toLocaleDateString('en-IN')})` : ''}`
)).join('\n');

// Returns an answer only when the application already has a direct source for it.
// Undefined means Gemini is needed; this prevents generic questions from receiving
// an invented rule-based answer.
async function getLocalReply({ userId, message }) {
  const question = normalise(message);
  if (isGreeting(question)) return /[\u0B80-\u0BFF]/u.test(message)
    ? 'வணக்கம்! பயிர், மண், பூச்சி, சந்தை விலை அல்லது அரசு திட்டம் பற்றி கேளுங்கள்.'
    : 'Hello! Ask me about crops, soil, pests, market prices, or government schemes.';

  if (/\b(my |latest )(crop recommendation|crop result)\b|என் பயிர் பரிந்துரை/iu.test(question)) {
    const crop = await CropRecommendation.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
    if (crop?.result) return `Your latest crop recommendation: ${typeof crop.result === 'string' ? crop.result : JSON.stringify(crop.result)}`;
  }

  if (/\b(my |latest )(soil health|soil result)\b|என் மண்/iu.test(question)) {
    const soil = await SoilHealth.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
    if (soil) return `Your latest soil health result: ${soil.indicator || 'Available'}${soil.score != null ? ` (score: ${soil.score})` : ''}${soil.suggestions?.length ? `. ${soil.suggestions.slice(0, 2).join(' ')}` : ''}`;
  }

  if (/\b(my |latest )(pest risk|pest result)\b|என் பூச்சி/iu.test(question)) {
    const pest = await PestRiskPrediction.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
    if (pest) return `Latest pest risk: ${pest.riskLevel || 'available'}${pest.pestName ? ` for ${pest.pestName}` : ''}. ${pest.recommendedAction || pest.reason || ''}`.trim();
  }

  if (isSchemeQuestion(question)) {
    const terms = question.split(/[^\p{L}\p{N}-]+/u).filter((term) => term.length > 3).slice(0, 5);
    const filter = terms.length ? { $or: terms.flatMap((term) => [
      { title: new RegExp(term, 'i') }, { category: new RegExp(term, 'i') }, { cropCategory: new RegExp(term, 'i') },
    ]) } : {};
    const schemes = await GovernmentScheme.find(filter).sort({ lastUpdated: -1 }).limit(3).lean();
    if (schemes.length) return makeSchemeReply(schemes);
  }

  if (isPriceQuestion(question)) {
    const prices = await MarketPrice.find({
      $or: [{ cropName: new RegExp(question.replace(/\b(price|prices|rate|rates|market|what|is|the|for|in)\b/gi, '').trim(), 'i') }],
    }).sort({ priceDate: -1, lastUpdated: -1 }).limit(3).lean();
    if (prices.length) return makePriceReply(prices);
  }

  return undefined;
}

module.exports = { getCachedReply, cacheReply, getLocalReply };
