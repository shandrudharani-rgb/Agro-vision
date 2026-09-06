const mongoose = require('mongoose');

const governmentSchemeSchema = new mongoose.Schema(
  {
    // --- Existing fields (unchanged) ---
    title: { type: String, required: true },
    description: String,
    eligibility: [String],
    requiredDocuments: [String],
    benefits: [String],
    lastDate: Date,
    applyLink: String,
    officialWebsite: String,
    category: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // --- NEW (optional, additive) fields ---
    // All new fields are optional so existing documents/queries/UI keep
    // working exactly as before even though they won't have these set.
    department: { type: String }, // e.g. "Dept. of Agriculture & Farmers Welfare"
    govtLevel: { type: String, enum: ['central', 'tamil_nadu', 'other_state'], default: undefined },
    // Human-readable government type used by the public API and seed data.
    government: {
      type: String,
      enum: ['Central Government', 'Tamil Nadu Government', 'Other State Government'],
      default: function defaultGovernment() {
        if (this.govtLevel === 'central') return 'Central Government';
        if (this.govtLevel === 'tamil_nadu') return 'Tamil Nadu Government';
        return undefined;
      },
    },
    applicationProcess: { type: String }, // free-text steps to apply
    cropCategory: { type: String }, // e.g. "Paddy", "Horticulture", "All crops"
    applicableStates: [String], // e.g. ["Tamil Nadu"] or [] for all-India
    applicableDistricts: [String], // optional finer targeting
    lastUpdated: { type: Date, default: Date.now }, // when scheme info was last verified/updated
    dataSource: { type: String, default: 'admin' }, // 'admin' or the name of an official source, if auto-synced later
  },
  { timestamps: true }
);

// Keep lastUpdated fresh whenever a scheme document is saved or updated,
// without touching any existing field or behavior.
governmentSchemeSchema.pre('save', function (next) {
  if (!this.government) {
    if (this.govtLevel === 'central') this.government = 'Central Government';
    if (this.govtLevel === 'tamil_nadu') this.government = 'Tamil Nadu Government';
  }
  this.lastUpdated = new Date();
  next();
});
governmentSchemeSchema.pre('findOneAndUpdate', function (next) {
  this.set({ lastUpdated: new Date() });
  next();
});

module.exports = mongoose.model('GovernmentScheme', governmentSchemeSchema);
