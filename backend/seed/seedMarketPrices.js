require('dotenv').config();
const mongoose = require('mongoose');
const MarketPrice = require('../models/MarketPrice');

// Backend-only sample generator: 38 Tamil Nadu districts × 3 markets × 5
// crops = 570 MongoDB records. Values are clearly sample records, not live
// AGMARKNET quotations; live data remains available through /api/market-live.
const DISTRICTS = [
  ['Ariyalur', 'Ariyalur'], ['Chengalpattu', 'Chengalpattu'], ['Chennai', 'Chennai'], ['Coimbatore', 'Coimbatore'], ['Cuddalore', 'Cuddalore'], ['Dharmapuri', 'Dharmapuri'], ['Dindigul', 'Dindigul'], ['Erode', 'Erode'], ['Kallakurichi', 'Kallakurichi'], ['Kancheepuram', 'Kancheepuram'], ['Karur', 'Karur'], ['Krishnagiri', 'Krishnagiri'], ['Madurai', 'Madurai'], ['Mayiladuthurai', 'Mayiladuthurai'], ['Nagapattinam', 'Nagapattinam'], ['Kanyakumari', 'Nagercoil'], ['Namakkal', 'Namakkal'], ['Nilgiris', 'Udhagamandalam'], ['Perambalur', 'Perambalur'], ['Pudukottai', 'Pudukottai'], ['Ramanathapuram', 'Ramanathapuram'], ['Ranipet', 'Ranipet'], ['Salem', 'Salem'], ['Sivagangai', 'Sivagangai'], ['Tenkasi', 'Tenkasi'], ['Thanjavur', 'Thanjavur'], ['Theni', 'Theni'], ['Thoothukudi', 'Thoothukudi'], ['Tiruchirappalli', 'Trichy'], ['Tirunelveli', 'Tirunelveli'], ['Tirupathur', 'Tirupathur'], ['Tiruppur', 'Tiruppur'], ['Tiruvallur', 'Tiruvallur'], ['Tiruvannamalai', 'Tiruvannamalai'], ['Tiruvarur', 'Thiruvarur'], ['Vellore', 'Vellore'], ['Villupuram', 'Villupuram'], ['Virudhunagar', 'Virudhunagar'],
];

const CROPS = [
  ['Paddy', 2200], ['Tomato', 2400], ['Onion', 2000], ['Maize', 2100], ['Cotton', 6500],
];

const MARKET_PRICES = DISTRICTS.flatMap(([district, city], districtIndex) =>
  [`${city} Regulated Market`, `${district} Central Regulated Market`, `${city} Agricultural Market`].flatMap((market, marketIndex) =>
    CROPS.map(([cropName, basePrice], cropIndex) => {
      const variation = (districtIndex * 37 + marketIndex * 19 + cropIndex * 13) % 180;
      const modalPrice = basePrice + variation;
      const lastUpdated = new Date(Date.UTC(2026, 6, 20 - ((districtIndex + marketIndex + cropIndex) % 7)));
      return {
        seedKey: `tn-${districtIndex}-${marketIndex}-${cropIndex}`,
        cropName,
        district,
        city,
        market,
        state: 'Tamil Nadu',
        minPrice: modalPrice - 120,
        maxPrice: modalPrice + 140,
        modalPrice,
        priceDate: lastUpdated,
        lastUpdated,
        unit: 'per quintal',
      };
    })
  )
);

async function seedMarketPrices() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set in backend/.env — cannot seed.');

  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) await mongoose.connect(uri);
  const result = await ensureMarketPriceSeed();
  if (ownsConnection) await mongoose.disconnect();
  return result;
}

async function ensureMarketPriceSeed() {
  const existingKeys = new Set(await MarketPrice.distinct('seedKey', { seedKey: { $in: MARKET_PRICES.map((price) => price.seedKey) } }));
  const missingPrices = MARKET_PRICES.filter((price) => !existingKeys.has(price.seedKey));
  if (missingPrices.length) await MarketPrice.insertMany(missingPrices, { ordered: false });
  return { created: missingPrices.length, total: MARKET_PRICES.length };
}

module.exports = { MARKET_PRICES, seedMarketPrices, ensureMarketPriceSeed };

if (require.main === module) {
  seedMarketPrices()
    .then(({ created }) => console.log(`Market prices seeded: ${created} created.`))
    .catch((err) => { console.error('Seeding failed:', err.message); process.exitCode = 1; });
}
