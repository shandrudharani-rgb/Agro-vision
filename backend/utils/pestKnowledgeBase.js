/**
 * Reference knowledge base of well-established, general agronomic
 * conditions under which common crop pests/diseases are more likely to
 * develop. This is standard extension-service knowledge (the kind found in
 * ICAR / state agriculture department advisories), NOT a live feed of
 * actual reported outbreaks. It is used only to power a rule-based risk
 * *prediction* (see pestRiskEngine.js) and every prediction generated from
 * it is labeled "System Risk Prediction" in the UI — never presented as a
 * confirmed, real-world pest sighting.
 *
 * Each rule's `matches(conditions)` function decides whether the current
 * weather/season conditions for a crop fall inside the known risk window.
 */

const RULES = [
  {
    crop: 'rice',
    pestName: 'Rice Blast (Magnaporthe oryzae)',
    matches: ({ humidity, temperature, rainfall }) =>
      humidity >= 85 && temperature >= 20 && temperature <= 30,
    reason: 'High humidity (≥85%) combined with moderate temperatures (20–30°C) favors rice blast fungus sporulation.',
    symptoms: ['Diamond-shaped lesions on leaves', 'Grayish-white centers with brown margins', 'Neck rot at panicle base'],
    prevention: ['Use resistant varieties', 'Avoid excess nitrogen', 'Ensure field drainage', 'Apply recommended fungicide preventively in high-risk windows'],
    recommendedAction: 'Scout fields closely over the next 3-5 days; consult local Krishi Vigyan Kendra if lesions appear.',
  },
  {
    crop: 'rice',
    pestName: 'Brown Planthopper',
    matches: ({ humidity, temperature }) => humidity >= 80 && temperature >= 25 && temperature <= 32,
    reason: 'Warm (25–32°C) and humid (≥80%) conditions accelerate brown planthopper breeding cycles.',
    symptoms: ['Yellowing and drying of lower leaves ("hopper burn")', 'Stunted tillers', 'Sooty mold from honeydew'],
    prevention: ['Avoid excess nitrogen fertilizer', 'Maintain field drainage intermittently', 'Conserve natural predators (spiders, mirid bugs)'],
    recommendedAction: 'Inspect base of plants for hoppers; consider recommended insecticide only if population crosses economic threshold.',
  },
  {
    crop: 'cotton',
    pestName: 'Cotton Bollworm (Helicoverpa armigera)',
    matches: ({ temperature, humidity, rainfall }) => temperature >= 25 && temperature <= 35 && rainfall < 5,
    reason: 'Warm, relatively dry conditions (25–35°C, low rainfall) are favorable for bollworm moth activity and egg-laying.',
    symptoms: ['Holes in bolls/squares', 'Frass near feeding sites', 'Shed squares and flowers'],
    prevention: ['Install pheromone traps', 'Encourage natural enemies', 'Timely destruction of crop residue'],
    recommendedAction: 'Set up pheromone traps if not already in place; monitor trap catches over the coming week.',
  },
  {
    crop: 'wheat',
    pestName: 'Wheat Rust (Puccinia spp.)',
    matches: ({ humidity, temperature }) => humidity >= 70 && temperature >= 15 && temperature <= 22,
    reason: 'Cool, humid conditions (15–22°C, ≥70% humidity) favor rust spore germination and spread.',
    symptoms: ['Orange/brown pustules on leaves and stems', 'Premature drying of leaves'],
    prevention: ['Use rust-resistant varieties', 'Avoid late sowing', 'Timely fungicide application if early symptoms are seen'],
    recommendedAction: 'Inspect lower leaves for early pustules; report to local agriculture office if found.',
  },
  {
    crop: 'tomato',
    pestName: 'Tomato Late Blight (Phytophthora infestans)',
    matches: ({ humidity, temperature, rainfall }) => humidity >= 85 && temperature >= 15 && temperature <= 25 && rainfall > 0,
    reason: 'Cool, wet, humid conditions (15–25°C, ≥85% humidity, recent rainfall) are classic late blight triggers.',
    symptoms: ['Water-soaked dark green/brown lesions on leaves', 'White fungal growth on leaf undersides in humid mornings', 'Rapid foliage collapse'],
    prevention: ['Improve field drainage and airflow', 'Avoid overhead irrigation, especially in evenings', 'Apply protectant fungicide before disease onset in known high-risk weather'],
    recommendedAction: 'Check plants after early morning dew for leaf lesions; act quickly if found, as late blight spreads fast.',
  },
  {
    crop: 'sugarcane',
    pestName: 'Early Shoot Borer',
    matches: ({ temperature, humidity }) => temperature >= 28 && temperature <= 35 && humidity < 70,
    reason: 'Warm and moderately dry conditions (28–35°C, <70% humidity) favor early shoot borer moth activity.',
    symptoms: ['Dead heart in central shoot', 'Bore holes near ground level'],
    prevention: ['Remove and destroy affected shoots', 'Maintain field sanitation', 'Use recommended intercropping to disrupt pest cycles'],
    recommendedAction: 'Check young shoots for dead-heart symptoms over the next week.',
  },
  {
    crop: 'groundnut',
    pestName: 'Groundnut Leaf Spot',
    matches: ({ humidity, temperature, rainfall }) => humidity >= 80 && temperature >= 20 && temperature <= 30 && rainfall > 0,
    reason: 'Warm, humid, wet conditions (20–30°C, ≥80% humidity, rainfall present) support leaf spot fungal development.',
    symptoms: ['Dark brown/black circular spots on leaves', 'Yellow halo around spots', 'Premature defoliation'],
    prevention: ['Crop rotation with non-host crops', 'Timely need-based fungicide spray', 'Use certified disease-free seed'],
    recommendedAction: 'Inspect older leaves first; consult local agriculture extension if spots are spreading.',
  },
];

const SUPPORTED_CROPS = [...new Set(RULES.map((r) => r.crop))];

module.exports = { RULES, SUPPORTED_CROPS };
