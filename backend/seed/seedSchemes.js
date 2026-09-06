/**
 * Seeds the GovernmentScheme collection with real, well-established central
 * government farmer welfare schemes.
 *
 * WHY THIS EXISTS
 * ----------------
 * The Government Schemes feature (backend/controllers/schemeController.js,
 * frontend/src/pages/Schemes.js) is intentionally MongoDB-backed rather than
 * calling a live external API: there is no official, keyless, machine-
 * readable real-time API for scheme listings equivalent to AGMARKNET for
 * market prices (myscheme.gov.in does not publish a public API). Building
 * against an unofficial/reverse-engineered endpoint would be fragile and
 * cannot honestly be called "an official government API integration", so
 * MongoDB — populated with real scheme data from official sources — is the
 * correct, stable data source here, exactly the way the existing admin
 * "Add Scheme" form already works.
 *
 * A brand-new database has zero scheme documents, so the Schemes page shows
 * an empty state until an admin adds some. This script seeds a starter set
 * of real, verified central schemes so the feature is immediately usable —
 * this is NOT placeholder/fake data, it reflects each scheme's actual
 * official name, purpose, and application channel as published by the
 * respective ministries. Because scheme terms (amounts, deadlines, portals)
 * can change, `dataSource` and `lastUpdated` are set so the UI can show
 * "please verify on the official site" — admins can edit/refresh these via
 * the existing Admin Dashboard at any time.
 *
 * USAGE
 * -----
 *   cd backend
 *   node seed/seedSchemes.js
 *
 * Safe to re-run: existing schemes are matched by `title` and updated
 * in place rather than duplicated.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const GovernmentScheme = require('../models/GovernmentScheme');

const SCHEMES = [
  {
    title: 'PM Kisan Samman Nidhi (PM-KISAN)',
    description:
      'Central income-support scheme providing direct cash assistance to landholding farmer families to help meet input and household expenses.',
    eligibility: [
      'All landholding farmer families (subject to standard exclusions such as institutional landholders, income-tax payers, and constitutional post holders)',
      'Valid land records in the farmer\u2019s name with the state/UT',
      'Aadhaar-seeded bank account for Direct Benefit Transfer (DBT)',
    ],
    requiredDocuments: ['Aadhaar card', 'Land ownership records', 'Bank account passbook (Aadhaar-linked)'],
    benefits: ['₹6,000 per year, paid in 3 equal installments of ₹2,000 via DBT'],
    applyLink: 'https://pmkisan.gov.in/',
    category: 'Income Support',
    department: 'Ministry of Agriculture & Farmers Welfare',
    govtLevel: 'central',
    applicationProcess:
      'Apply online at pmkisan.gov.in (Farmers Corner > New Farmer Registration) or through the nearest Common Service Centre (CSC). Complete e-KYC to receive installments.',
    cropCategory: 'All crops',
    applicableStates: [],
    dataSource: 'Official scheme details (pmkisan.gov.in) — verify current installment amounts/dates on the portal',
  },
  {
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    description:
      'Crop insurance scheme protecting farmers against crop loss/damage from natural calamities, pests, and diseases, at a low, farmer-borne premium.',
    eligibility: [
      'All farmers growing notified crops in notified areas, including sharecroppers and tenant farmers',
      'Both loanee and non-loanee farmers can enroll',
    ],
    requiredDocuments: ['Aadhaar card', 'Land ownership/tenancy documents', 'Bank account details', 'Sowing declaration'],
    benefits: [
      'Low uniform premium: 2% of sum insured for Kharif crops, 1.5% for Rabi crops, 5% for commercial/horticultural crops',
      'Comprehensive risk cover from pre-sowing to post-harvest losses',
    ],
    applyLink: 'https://pmfby.gov.in/',
    category: 'Crop Insurance',
    department: 'Ministry of Agriculture & Farmers Welfare',
    govtLevel: 'central',
    applicationProcess:
      'Apply online at pmfby.gov.in, through your bank (for loanee farmers, enrollment can be automatic unless opted out), or via the nearest CSC before the state-notified cut-off date for each crop season.',
    cropCategory: 'Notified Kharif, Rabi, and horticultural/commercial crops',
    applicableStates: [],
    dataSource: 'Official scheme details (pmfby.gov.in) — verify current premium rates and season cut-off dates on the portal',
  },
  {
    title: 'Kisan Credit Card (KCC)',
    description:
      'Provides farmers with timely, affordable, short-term formal credit for crop production, post-harvest expenses, and allied agricultural activities.',
    eligibility: [
      'Farmers (owner-cultivators, tenant farmers, oral lessees, and sharecroppers)',
      'Self Help Group (SHG) or Joint Liability Group (JLG) members engaged in farming',
    ],
    requiredDocuments: ['Identity proof (Aadhaar)', 'Address proof', 'Land ownership/tenancy documents', 'Passport-size photograph'],
    benefits: [
      'Short-term credit at subsidised interest rates for crop and allied-activity expenses',
      'Interest subvention available on prompt repayment',
      'Flexible repayment aligned with harvest/marketing cycles',
    ],
    applyLink: 'https://www.myscheme.gov.in/schemes/kcc',
    category: 'Credit / Loan',
    department: 'Ministry of Agriculture & Farmers Welfare / RBI-NABARD',
    govtLevel: 'central',
    applicationProcess:
      'Apply at any participating bank branch (public sector, private, cooperative, or regional rural bank) with the required documents, or through the PM-KISAN portal for pre-filled KCC applications.',
    cropCategory: 'All crops and allied activities (dairy, fisheries, animal husbandry)',
    applicableStates: [],
    dataSource: 'Official scheme details (myscheme.gov.in / NABARD) — verify current interest rates with your bank',
  },
  {
    title: 'Soil Health Card Scheme',
    description:
      'Provides farmers with a Soil Health Card every 2 years, reporting nutrient status and crop-wise fertilizer/soil-amendment recommendations for their farm.',
    eligibility: ['All farmers with agricultural land'],
    requiredDocuments: ['Land details', 'Aadhaar card (for registration in some states)'],
    benefits: [
      'Free soil testing and a personalised Soil Health Card',
      'Recommended dosage of nutrients and fertilizers to improve soil fertility and reduce input costs',
    ],
    applyLink: 'https://soilhealth.dac.gov.in/',
    category: 'Soil & Input Advisory',
    department: 'Ministry of Agriculture & Farmers Welfare',
    govtLevel: 'central',
    applicationProcess:
      'Soil samples are collected by the state Department of Agriculture / local Krishi Vigyan Kendra (KVK); farmers can also request testing through the soilhealth.dac.gov.in portal.',
    cropCategory: 'All crops',
    applicableStates: [],
    dataSource: 'Official scheme details (soilhealth.dac.gov.in) — verify testing cycle with your local agriculture office',
  },
  {
    title: 'Pradhan Mantri Kisan Maandhan Yojana (PM-KMY)',
    description:
      'Voluntary, contributory pension scheme for small and marginal farmers, providing a fixed monthly pension after the age of 60.',
    eligibility: [
      'Small and marginal farmers aged 18–40 years',
      'Cultivable landholding up to 2 hectares as per state land records',
      'Not already covered under another statutory social security scheme (e.g. PM-SYM, NPS, ESIC) or an income-tax payer',
    ],
    requiredDocuments: ['Aadhaar card', 'Bank account (savings/Jan Dhan) with IFSC', 'Age proof / land records'],
    benefits: [
      '₹3,000 per month guaranteed pension after age 60',
      'Government contributes a matching share to the pension fund',
    ],
    applyLink: 'https://maandhan.in/',
    category: 'Pension / Social Security',
    department: 'Ministry of Agriculture & Farmers Welfare',
    govtLevel: 'central',
    applicationProcess:
      'Enroll through the nearest Common Service Centre (CSC) with Aadhaar and bank details, or online via maandhan.in. Monthly contribution amount depends on the entry age.',
    cropCategory: 'All crops',
    applicableStates: [],
    dataSource: 'Official scheme details (maandhan.in) — verify current contribution slabs on the portal',
  },
  {
    title: 'Uzhavar Aluvalar Thodarbu Thittam (UATT)', government: 'Tamil Nadu Government', govtLevel: 'tamil_nadu', category: 'Farmer Extension Services', cropCategory: 'All crops',
    description: 'Connects Tamil Nadu farmers with field-level agriculture officers for timely technical guidance and scheme support.', benefits: ['Local agricultural extension advice', 'Timely crop, input, and service information'], eligibility: ['Farmers in Tamil Nadu'], requiredDocuments: ['Aadhaar card', 'Farmer and land details where requested'], officialWebsite: 'https://www.tnagrisnet.tn.gov.in/', applyLink: 'https://www.tnagrisnet.tn.gov.in/', applicableStates: ['Tamil Nadu'], department: 'Department of Agriculture and Farmers Welfare, Tamil Nadu', dataSource: 'Tamil Nadu Agriculture Department',
  },
  {
    title: 'Collective Farming Scheme', government: 'Tamil Nadu Government', govtLevel: 'tamil_nadu', category: 'Farmer Producer Groups', cropCategory: 'All crops',
    description: 'Supports small and marginal farmers to form farmer interest groups for collective cultivation, inputs, value addition, and marketing.', benefits: ['Support for farmer collectives and common assets', 'Improved input, technology, and market access'], eligibility: ['Small and marginal farmers in Tamil Nadu who join an eligible collective'], requiredDocuments: ['Aadhaar card', 'Land or farmer details', 'Group details where applicable'], officialWebsite: 'https://www.tnagrisnet.tn.gov.in/', applyLink: 'https://www.tnagrisnet.tn.gov.in/', applicableStates: ['Tamil Nadu'], department: 'Department of Agriculture and Farmers Welfare, Tamil Nadu', dataSource: 'Tamil Nadu Agriculture Department',
  },
  {
    title: 'Tamil Nadu Mission for Sustainable Dry Land Development (TNMSDD)', government: 'Tamil Nadu Government', govtLevel: 'tamil_nadu', category: 'Dryland Agriculture', cropCategory: 'Dryland crops, millets, pulses, oilseeds',
    description: 'Promotes climate-resilient dryland farming, soil-moisture conservation, diversified cropping, and rainfed productivity.', benefits: ['Dryland crop and conservation support', 'Training and demonstrations for sustainable practices'], eligibility: ['Farmers cultivating in identified rainfed and dryland areas of Tamil Nadu'], requiredDocuments: ['Aadhaar card', 'Land records', 'Bank account details where benefit transfer applies'], officialWebsite: 'https://www.tnagrisnet.tn.gov.in/', applyLink: 'https://www.tnagrisnet.tn.gov.in/', applicableStates: ['Tamil Nadu'], department: 'Department of Agriculture and Farmers Welfare, Tamil Nadu', dataSource: 'Tamil Nadu Agriculture Department',
  },
  {
    title: 'Tamil Nadu Irrigated Agriculture Modernization Project (TNIAMP)', government: 'Tamil Nadu Government', govtLevel: 'tamil_nadu', category: 'Irrigation Modernization', cropCategory: 'Irrigated crops and horticulture',
    description: 'Modernizes irrigation service delivery and supports climate-resilient, market-oriented agriculture in covered sub-basins.', benefits: ['Improved irrigation and water-use practices', 'Crop diversification and market-linkage support in covered areas'], eligibility: ['Farmers in notified TNIAMP project areas and sub-basins'], requiredDocuments: ['Aadhaar card', 'Land and location details', 'Bank account details where required'], officialWebsite: 'https://www.tniamp.tn.gov.in/', applyLink: 'https://www.tniamp.tn.gov.in/', applicableStates: ['Tamil Nadu'], department: 'Tamil Nadu Irrigated Agriculture Modernization Project', dataSource: 'TNIAMP, Government of Tamil Nadu',
  },
  {
    title: 'Kuruvai Special Package', government: 'Tamil Nadu Government', govtLevel: 'tamil_nadu', category: 'Seasonal Crop Support', cropCategory: 'Kuruvai paddy',
    description: 'Season-specific support for eligible Kuruvai paddy cultivation areas, subject to the current Tamil Nadu notification.', benefits: ['Season-notified input and cultivation support', 'Department advisory for Kuruvai cultivation'], eligibility: ['Eligible paddy farmers in areas notified for the applicable Kuruvai season'], requiredDocuments: ['Aadhaar card', 'Land cultivation details', 'Farmer registration details'], officialWebsite: 'https://www.tnagrisnet.tn.gov.in/', applyLink: 'https://www.tnagrisnet.tn.gov.in/', applicableStates: ['Tamil Nadu'], department: 'Department of Agriculture and Farmers Welfare, Tamil Nadu', dataSource: 'Tamil Nadu Agriculture Department — subject to seasonal notification',
  },
  {
    title: 'Free Tree Saplings Scheme', government: 'Tamil Nadu Government', govtLevel: 'tamil_nadu', category: 'Agroforestry and Environment', cropCategory: 'Agroforestry, horticulture, farm boundaries',
    description: 'Facilitates tree-sapling distribution to encourage farm forestry, agroforestry, green cover, and long-term farm income.', benefits: ['Tree saplings through notified channels', 'Support for agroforestry and environmental conservation'], eligibility: ['Eligible farmers, institutions, or residents under the local notification'], requiredDocuments: ['Identity proof', 'Location or land details where required'], officialWebsite: 'https://www.tnforest.tn.gov.in/', applyLink: 'https://www.tnforest.tn.gov.in/', applicableStates: ['Tamil Nadu'], department: 'Government of Tamil Nadu', dataSource: 'Tamil Nadu Government — availability subject to local notification',
  },
  {
    title: 'Velan e-Sevai Maiyam', government: 'Tamil Nadu Government', govtLevel: 'tamil_nadu', category: 'Digital Farmer Services', cropCategory: 'All crops',
    description: 'Agriculture e-service centre that assists farmers with department services, registrations, applications, and digital agriculture information.', benefits: ['Assisted access to agricultural e-services', 'Farmer registration, application support, and scheme information'], eligibility: ['Farmers in Tamil Nadu'], requiredDocuments: ['Aadhaar card', 'Mobile number', 'Farmer and land details for the requested service'], officialWebsite: 'https://www.tnagrisnet.tn.gov.in/', applyLink: 'https://www.tnagrisnet.tn.gov.in/', applicableStates: ['Tamil Nadu'], department: 'Department of Agriculture and Farmers Welfare, Tamil Nadu', dataSource: 'Tamil Nadu Agriculture Department',
  },
  {
    title: "Chief Minister's Farmers Welfare Service Centre", government: 'Tamil Nadu Government', govtLevel: 'tamil_nadu', category: 'Farmer Welfare Services', cropCategory: 'All crops and allied activities',
    description: 'Local farmer service centre for integrated access to agricultural advisory, inputs, machinery, and welfare-related services.', benefits: ['Single-point access to farmer welfare and agriculture services', 'Guidance on available schemes and local support'], eligibility: ['Farmers and eligible agricultural beneficiaries in Tamil Nadu'], requiredDocuments: ['Aadhaar card', 'Farmer or land details for the requested service'], officialWebsite: 'https://www.tnagrisnet.tn.gov.in/', applyLink: 'https://www.tnagrisnet.tn.gov.in/', applicableStates: ['Tamil Nadu'], department: 'Department of Agriculture and Farmers Welfare, Tamil Nadu', dataSource: 'Tamil Nadu Agriculture Department',
  },
];

async function seedSchemes() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set in backend/.env — cannot seed.');
    process.exit(1);
  }

  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) {
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB for seeding: ${mongoose.connection.host}`);
  }

  let created = 0;
  let updated = 0;

  for (const scheme of SCHEMES) {
    const result = await GovernmentScheme.findOneAndUpdate(
      { title: scheme.title },
      { $set: scheme },
      { upsert: true, new: true, rawResult: true }
    );
    if (result.lastErrorObject?.updatedExisting) updated += 1;
    else created += 1;
  }

  console.log(`Government Schemes seeded: ${created} created, ${updated} updated (of ${SCHEMES.length} total).`);
  if (ownsConnection) await mongoose.disconnect();
  return { created, updated, total: SCHEMES.length };
}

module.exports = { SCHEMES, seedSchemes };

if (require.main === module) {
  seedSchemes().catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  });
}
