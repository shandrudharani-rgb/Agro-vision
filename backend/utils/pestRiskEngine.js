const { RULES, SUPPORTED_CROPS } = require('./pestKnowledgeBase');

/**
 * Rule-based Pest Risk Analysis Engine.
 *
 * NOTE ON HONESTY / SAFETY: This engine never invents a real-world pest
 * sighting. It only checks whether current weather conditions for a given
 * crop fall within a documented risk window from `pestKnowledgeBase.js`.
 * If the crop isn't in the knowledge base, or weather data is missing, it
 * returns an "insufficient_data" result instead of guessing.
 *
 * Every result must be labeled by the frontend as a "System Risk
 * Prediction" — distinct from admin-verified/official PestAlert records.
 */

function getSeasonFromDate(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12
  if (month >= 6 && month <= 9) return 'kharif'; // Jun-Sep (monsoon)
  if (month >= 10 && month <= 12) return 'rabi-early';
  if (month >= 1 && month <= 3) return 'rabi';
  return 'zaid'; // Apr-May
}

function analyzePestRisk({ crop, weather, season }) {
  if (!crop) {
    return { insufficient: true, reason: 'No crop specified for this farmer.' };
  }
  const normalizedCrop = crop.trim().toLowerCase();

  if (!weather || weather.temperature === undefined || weather.humidity === undefined) {
    return { insufficient: true, reason: 'Current weather data is unavailable, so risk cannot be assessed reliably.' };
  }

  if (!SUPPORTED_CROPS.includes(normalizedCrop)) {
    return {
      insufficient: true,
      reason: `No pest-risk reference rules are available yet for "${crop}". Supported crops: ${SUPPORTED_CROPS.join(', ')}.`,
    };
  }

  const conditions = {
    temperature: weather.temperature,
    humidity: weather.humidity,
    rainfall: weather.rainfall || 0,
  };

  const matchedRules = RULES.filter((r) => r.crop === normalizedCrop && r.matches(conditions));

  if (matchedRules.length === 0) {
    return {
      insufficient: false,
      riskLevel: 'low',
      pestName: 'No specific elevated risk detected',
      affectedCrop: crop,
      reason: 'Current weather conditions do not match any known high-risk pattern for this crop in our reference rules.',
      symptoms: [],
      prevention: ['Continue routine field monitoring.'],
      recommendedAction: 'No action required beyond regular crop monitoring.',
    };
  }

  // If multiple pests match, surface the first (rules are ordered by
  // specificity/severity in the knowledge base) but note the others.
  const primary = matchedRules[0];
  const riskLevel = matchedRules.length > 1 ? 'high' : 'medium';

  return {
    insufficient: false,
    riskLevel,
    pestName: primary.pestName,
    affectedCrop: crop,
    reason: primary.reason,
    symptoms: primary.symptoms,
    prevention: primary.prevention,
    recommendedAction: primary.recommendedAction,
    otherRisks: matchedRules.slice(1).map((r) => r.pestName),
  };
}

module.exports = { analyzePestRisk, getSeasonFromDate, SUPPORTED_CROPS };
