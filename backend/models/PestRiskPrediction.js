const mongoose = require('mongoose');

/**
 * NEW MODULE — Automatic Pest Risk Prediction.
 *
 * IMPORTANT: This is a SEPARATE collection from the existing `PestAlert`
 * model (backend/models/PestAlert.js). The existing model continues to
 * represent admin-created / official pest alerts, unchanged.
 *
 * Documents created here are always system-generated risk *predictions*
 * derived from weather + crop + season conditions using a rule-based
 * knowledge base (see backend/utils/pestRiskEngine.js). They must never be
 * presented to farmers as confirmed/official outbreaks — the frontend is
 * required to label them "System Risk Prediction" and keep them visually
 * distinct from "Official / Verified Alert" (the existing PestAlert data).
 */
const pestRiskPredictionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    crop: { type: String, required: true },
    growthStage: { type: String }, // optional, if farmer provided it
    state: { type: String, required: true },
    district: { type: String, required: true },
    season: { type: String },

    pestName: { type: String, required: true },
    affectedCrop: { type: String, required: true },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'insufficient_data'], required: true },
    reason: { type: String, required: true },
    symptoms: [String],
    prevention: [String],
    recommendedAction: { type: String },

    weatherSnapshot: {
      temperature: Number,
      humidity: Number,
      rainfall: Number,
      description: String,
      source: String,
    },

    alertType: {
      type: String,
      enum: ['system_prediction'],
      default: 'system_prediction',
      immutable: true,
    },
    source: { type: String, default: 'Agro Vision Pest Risk Engine (rule-based, not an official advisory)' },
    status: { type: String, enum: ['active', 'dismissed'], default: 'active' },
  },
  { timestamps: true }
);

pestRiskPredictionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PestRiskPrediction', pestRiskPredictionSchema);
