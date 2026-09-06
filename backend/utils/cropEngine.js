/**
 * Rule-based crop recommendation engine.
 * NOTE: This is a heuristic/rule-based scoring system, NOT a trained ML model.
 * It scores a fixed crop knowledge base against farmer inputs and returns the
 * best match with a confidence score. Swap this module out for a real model
 * or external ML API later without changing the controller/route contract.
 */

const CROP_RULES = [
  {
    crop: 'Rice',
    n: [80, 120], p: [40, 60], k: [40, 60], ph: [5.5, 6.5],
    temp: [20, 35], humidity: [70, 90], rainfall: [150, 300],
    season: 'Kharif (Jun-Nov)', water: 'High', fertilizer: 'Urea + DAP + Potash split doses',
  },
  {
    crop: 'Wheat',
    n: [100, 140], p: [50, 70], k: [40, 60], ph: [6.0, 7.5],
    temp: [10, 25], humidity: [40, 60], rainfall: [50, 100],
    season: 'Rabi (Oct-Mar)', water: 'Medium', fertilizer: 'NPK 120:60:40 kg/ha',
  },
  {
    crop: 'Maize',
    n: [80, 120], p: [40, 60], k: [40, 60], ph: [5.5, 7.0],
    temp: [18, 32], humidity: [50, 75], rainfall: [60, 110],
    season: 'Kharif/Rabi', water: 'Medium', fertilizer: 'NPK 120:60:40 kg/ha',
  },
  {
    crop: 'Cotton',
    n: [80, 120], p: [30, 60], k: [30, 60], ph: [6.0, 8.0],
    temp: [21, 35], humidity: [50, 70], rainfall: [60, 100],
    season: 'Kharif (Apr-Oct)', water: 'Medium', fertilizer: 'NPK 100:50:50 kg/ha',
  },
  {
    crop: 'Sugarcane',
    n: [150, 250], p: [60, 100], k: [100, 150], ph: [6.0, 7.5],
    temp: [21, 38], humidity: [65, 85], rainfall: [100, 200],
    season: 'Year-round (Feb-Mar sowing)', water: 'High', fertilizer: 'NPK 250:100:100 kg/ha',
  },
  {
    crop: 'Groundnut',
    n: [20, 40], p: [40, 60], k: [40, 60], ph: [6.0, 7.0],
    temp: [20, 30], humidity: [50, 70], rainfall: [50, 100],
    season: 'Kharif/Rabi', water: 'Low-Medium', fertilizer: 'NPK 20:40:40 kg/ha + Gypsum',
  },
  {
    crop: 'Chickpea (Gram)',
    n: [15, 25], p: [40, 60], k: [15, 25], ph: [6.0, 7.5],
    temp: [10, 25], humidity: [30, 50], rainfall: [30, 65],
    season: 'Rabi (Oct-Mar)', water: 'Low', fertilizer: 'NPK 20:40:20 kg/ha',
  },
  {
    crop: 'Millet (Bajra)',
    n: [40, 60], p: [20, 40], k: [20, 40], ph: [6.5, 8.0],
    temp: [25, 35], humidity: [30, 50], rainfall: [30, 60],
    season: 'Kharif (Jun-Sep)', water: 'Low', fertilizer: 'NPK 40:20:20 kg/ha',
  },
];

function scoreRange(value, [min, max]) {
  if (value === undefined || value === null || isNaN(value)) return 0.5;
  if (value >= min && value <= max) return 1;
  const span = max - min || 1;
  const distance = value < min ? min - value : value - max;
  return Math.max(0, 1 - distance / span);
}

function recommendCrop(inputs) {
  const { nitrogen, phosphorus, potassium, ph, temperature, humidity, rainfall } = inputs;

  const scored = CROP_RULES.map((rule) => {
    const scores = [
      scoreRange(nitrogen, rule.n),
      scoreRange(phosphorus, rule.p),
      scoreRange(potassium, rule.k),
      scoreRange(ph, rule.ph),
      scoreRange(temperature, rule.temp),
      scoreRange(humidity, rule.humidity),
      scoreRange(rainfall, rule.rainfall),
    ];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return { rule, avg };
  });

  scored.sort((a, b) => b.avg - a.avg);
  const best = scored[0];

  return {
    crop: best.rule.crop,
    confidence: Math.round(best.avg * 100),
    season: best.rule.season,
    waterRequirement: best.rule.water,
    fertilizerSuggestion: best.rule.fertilizer,
  };
}

module.exports = { recommendCrop, CROP_RULES };
