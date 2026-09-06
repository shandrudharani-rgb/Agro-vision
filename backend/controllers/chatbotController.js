const ChatMessage = require('../models/ChatMessage');
const CropRecommendation = require('../models/CropRecommendation');
const DiseaseReport = require('../models/DiseaseReport');
const SoilHealth = require('../models/SoilHealth');
const ProfitCalculation = require('../models/ProfitCalculation');
const PestRiskPrediction = require('../models/PestRiskPrediction');
const MarketPrice = require('../models/MarketPrice');
const GovernmentScheme = require('../models/GovernmentScheme');
const { getGeminiReply } = require('../services/geminiService');
const { getCachedReply, cacheReply, getLocalReply } = require('../services/chatResponseService');

const compact = (value) => JSON.stringify(value, (_key, field) => field instanceof Date ? field.toISOString() : field);

// Only pass recent, already-owned records to Gemini. This gives useful context
// without exposing another farmer's data or making prompts unnecessarily large.
const getFarmContext = async (userId) => {
  const [crop, soil, disease, profit, pestRisk, prices, schemes] = await Promise.all([
    CropRecommendation.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    SoilHealth.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    DiseaseReport.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    ProfitCalculation.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    PestRiskPrediction.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    MarketPrice.find({}).sort({ lastUpdated: -1 }).limit(5).lean(),
    GovernmentScheme.find({}).sort({ lastUpdated: -1 }).limit(5).lean(),
  ]);

  return compact({
    latestCropRecommendation: crop && { inputs: crop.inputs, result: crop.result, createdAt: crop.createdAt },
    latestSoilHealth: soil && { inputs: soil.inputs, score: soil.score, indicator: soil.indicator, suggestions: soil.suggestions, createdAt: soil.createdAt },
    latestDiseaseDetection: disease && { result: disease.result, createdAt: disease.createdAt },
    latestProfitCalculation: profit && { crop: profit.crop, costs: profit.costs, sellingPrice: profit.sellingPrice, yield: profit.yield, result: profit.result, createdAt: profit.createdAt },
    latestPestRisk: pestRisk && {
      crop: pestRisk.crop,
      pestName: pestRisk.pestName,
      riskLevel: pestRisk.riskLevel,
      reason: pestRisk.reason,
      symptoms: pestRisk.symptoms,
      prevention: pestRisk.prevention,
      recommendedAction: pestRisk.recommendedAction,
      weatherSnapshot: pestRisk.weatherSnapshot,
      createdAt: pestRisk.createdAt,
    },
    latestMarketPrices: prices.map(({ cropName, market, state, district, modalPrice, unit, priceDate }) => ({ cropName, market, state, district, modalPrice, unit, priceDate })),
    availableGovernmentSchemes: schemes.map(({ title, benefits, eligibility, lastDate, applyLink, officialWebsite, lastUpdated }) => ({ title, benefits, eligibility, lastDate, applyLink, officialWebsite, lastUpdated })),
  });
};

exports.sendMessage = async (req, res, next) => {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });
    if (message.length > 12000) return res.status(400).json({ success: false, message: 'Message must be 12,000 characters or fewer' });

    const userId = req.user._id;
    await ChatMessage.create({ user: userId, sender: 'user', text: message });
    const cachedReply = getCachedReply(userId, message);
    if (cachedReply) {
      const botMsg = await ChatMessage.create({ user: userId, sender: 'bot', text: cachedReply });
      return res.status(201).json({ success: true, reply: botMsg, source: 'cache' });
    }

    const localReply = await getLocalReply({ userId, message });
    if (localReply) {
      cacheReply(userId, message, localReply);
      const botMsg = await ChatMessage.create({ user: userId, sender: 'bot', text: localReply });
      return res.status(201).json({ success: true, reply: botMsg, source: 'local' });
    }
    const [conversation, farmContext] = await Promise.all([
      // The just-saved message is supplied separately to Gemini with farm
      // context, so exclude it from prior conversation to avoid duplication.
      ChatMessage.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(1).limit(12).lean(),
      getFarmContext(req.user._id),
    ]);
    const reply = await getGeminiReply({ conversation: conversation.reverse(), message, farmContext });
    cacheReply(userId, message, reply);
    const botMsg = await ChatMessage.create({ user: userId, sender: 'bot', text: reply });
    return res.status(201).json({ success: true, reply: botMsg });
  } catch (err) {
    return next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const history = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
};

exports.ChatMessage = ChatMessage;
