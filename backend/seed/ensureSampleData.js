const GovernmentScheme = require('../models/GovernmentScheme');
const { SCHEMES } = require('./seedSchemes');
const { ensureMarketPriceSeed } = require('./seedMarketPrices');

// Called after a successful MongoDB connection. It inserts only missing named
// seed schemes, so Central-only databases receive the Tamil Nadu additions
// without overwriting administrator-managed records.
async function ensureSampleData() {
  const [existingSchemeTitles] = await Promise.all([
    GovernmentScheme.distinct('title', { title: { $in: SCHEMES.map((scheme) => scheme.title) } }),
  ]);
  const existingTitles = new Set(existingSchemeTitles);
  const missingSchemes = SCHEMES.filter((scheme) => !existingTitles.has(scheme.title));

  const operations = [];
  if (missingSchemes.length) operations.push(GovernmentScheme.insertMany(missingSchemes));
  const [, marketSeed] = await Promise.all([Promise.all(operations), ensureMarketPriceSeed()]);

  if (operations.length || marketSeed.created) {
    console.log(`Inserted missing sample data: ${missingSchemes.length} schemes, ${marketSeed.created} market prices.`);
  }
}

module.exports = ensureSampleData;
