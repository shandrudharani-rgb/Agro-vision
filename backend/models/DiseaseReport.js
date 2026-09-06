const mongoose = require('mongoose');

const diseaseReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    result: {
      diseaseName: String,
      confidence: Number,
      cause: String,
      symptoms: [String],
      prevention: [String],
      treatment: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DiseaseReport', diseaseReportSchema);
