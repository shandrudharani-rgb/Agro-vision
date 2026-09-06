const mongoose = require('mongoose');

/**
 * NEW MODULE — In-app notifications.
 * Does not replace or modify any existing model. Used primarily to notify
 * farmers when the automatic Pest Risk Alert engine generates a new
 * medium/high risk prediction for their location + crop, but written
 * generically so it can be reused by other features later.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['pest_risk_alert', 'system', 'scheme', 'market'],
      default: 'system',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // frontend route/id to deep-link to, e.g. '/pest-alerts'
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // e.g. PestRiskPrediction._id
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
