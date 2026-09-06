const mongoose = require('mongoose');

const pestAlertSchema = new mongoose.Schema(
  {
    pestName: { type: String, required: true },
    crop: String,
    season: String,
    state: String,
    district: String,
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    prevention: [String],
    recommendedActions: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    subscribed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = {
  PestAlert: mongoose.model('PestAlert', pestAlertSchema),
  PestAlertSubscription: mongoose.model('PestAlertSubscription', subscriptionSchema),
};
