/**
 * Heuristic soil health scoring (0-100), based on how close each
 * parameter is to its agronomically ideal range. Not a trained model.
 */

const IDEAL = {
  nitrogen: [80, 140],
  phosphorus: [30, 60],
  potassium: [30, 60],
  ph: [6.0, 7.5],
  moisture: [40, 70],
  organicCarbon: [0.5, 1.0],
};

function paramScore(value, [min, max]) {
  if (value === undefined || value === null || isNaN(value)) return 50;
  if (value >= min && value <= max) return 100;
  const span = max - min || 1;
  const distance = value < min ? min - value : value - max;
  return Math.max(0, 100 - (distance / span) * 100);
}

function calculateSoilHealth(inputs) {
  const { nitrogen, phosphorus, potassium, ph, moisture, organicCarbon } = inputs;

  const scores = {
    nitrogen: paramScore(nitrogen, IDEAL.nitrogen),
    phosphorus: paramScore(phosphorus, IDEAL.phosphorus),
    potassium: paramScore(potassium, IDEAL.potassium),
    ph: paramScore(ph, IDEAL.ph),
    moisture: paramScore(moisture, IDEAL.moisture),
    organicCarbon: paramScore(organicCarbon, IDEAL.organicCarbon),
  };

  const score = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
  );

  let indicator = 'poor';
  if (score >= 85) indicator = 'excellent';
  else if (score >= 65) indicator = 'good';
  else if (score >= 40) indicator = 'moderate';

  const suggestions = [];
  if (scores.nitrogen < 70) suggestions.push('Apply nitrogen-rich fertilizer (urea) or green manure.');
  if (scores.phosphorus < 70) suggestions.push('Add phosphate fertilizer (DAP/SSP) or rock phosphate.');
  if (scores.potassium < 70) suggestions.push('Apply potash (MOP) to improve potassium levels.');
  if (scores.ph < 70) {
    if (ph !== undefined && ph < 6.0) suggestions.push('Soil is acidic — apply agricultural lime.');
    else suggestions.push('Soil is alkaline — apply gypsum or organic matter.');
  }
  if (scores.moisture < 70) suggestions.push('Improve irrigation scheduling or add mulch to retain moisture.');
  if (scores.organicCarbon < 70) suggestions.push('Increase organic carbon with compost, FYM, or crop residue.');
  if (suggestions.length === 0) suggestions.push('Soil parameters are within healthy ranges. Maintain current practices.');

  return { score, indicator, suggestions };
}

module.exports = { calculateSoilHealth };
