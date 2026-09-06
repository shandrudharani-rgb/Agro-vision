const PestRiskPrediction = require('../models/PestRiskPrediction');
const { getLiveWeather } = require('../services/weatherService');
const { analyzePestRisk, getSeasonFromDate, SUPPORTED_CROPS } = require('../utils/pestRiskEngine');
const { createNotification } = require('../services/notificationService');

/**
 * Flow implemented here:
 *   Farmer Profile (state/district/location, from req.user)
 *   -> crop (provided by the farmer for this request)
 *   -> Real Weather API (weatherService)
 *   -> Pest Risk Analysis Engine (pestRiskEngine)
 *   -> Risk Level + Pest Alert record (PestRiskPrediction)
 *   -> Farmer Dashboard Notification (Notification model)
 */
exports.generate = async (req, res, next) => {
  try {
    const { crop, growthStage } = req.body;
    if (!crop) {
      return res.status(400).json({ success: false, message: 'crop is required' });
    }

    const user = req.user;
    if (!user.state || !user.district) {
      return res.status(400).json({
        success: false,
        message: 'Your profile is missing state/district. Please update your profile to receive location-based pest risk predictions.',
      });
    }

    // 1. Get real weather for the farmer's location
    let weather = null;
    let weatherError = null;
    try {
      if (user.location?.lat && user.location?.lng) {
        weather = await getLiveWeather({ lat: user.location.lat, lon: user.location.lng });
      } else {
        weather = await getLiveWeather({ city: `${user.district},IN` });
      }
    } catch (err) {
      weatherError = err.message;
    }

    const season = getSeasonFromDate();

    // 2. Run the rule-based risk engine
    const analysis = analyzePestRisk({ crop, weather, season });

    if (analysis.insufficient) {
      return res.json({
        success: true,
        insufficientData: true,
        message: analysis.reason,
        weatherError,
        supportedCrops: SUPPORTED_CROPS,
      });
    }

    // 3. Persist the prediction
    const prediction = await PestRiskPrediction.create({
      user: user._id,
      crop,
      growthStage,
      state: user.state,
      district: user.district,
      season,
      pestName: analysis.pestName,
      affectedCrop: analysis.affectedCrop,
      riskLevel: analysis.riskLevel,
      reason: analysis.reason,
      symptoms: analysis.symptoms,
      prevention: analysis.prevention,
      recommendedAction: analysis.recommendedAction,
      weatherSnapshot: weather
        ? {
            temperature: weather.temperature,
            humidity: weather.humidity,
            rainfall: weather.rainfall,
            description: weather.description,
            source: weather.source,
          }
        : undefined,
    });

    // 4. Notify the farmer if risk is medium/high
    if (analysis.riskLevel === 'medium' || analysis.riskLevel === 'high') {
      await createNotification({
        user: user._id,
        type: 'pest_risk_alert',
        title: `${analysis.riskLevel === 'high' ? 'High' : 'Medium'} pest risk predicted for ${crop}`,
        message: `${analysis.pestName}: ${analysis.reason}`,
        link: '/pest-alerts',
        relatedId: prediction._id,
      });
    }

    res.status(201).json({ success: true, prediction });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const predictions = await PestRiskPrediction.find({ user: req.user._id, status: 'active' }).sort({ createdAt: -1 });
    res.json({ success: true, predictions });
  } catch (err) {
    next(err);
  }
};

exports.dismiss = async (req, res, next) => {
  try {
    const prediction = await PestRiskPrediction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'dismissed' },
      { new: true }
    );
    if (!prediction) return res.status(404).json({ success: false, message: 'Prediction not found' });
    res.json({ success: true, prediction });
  } catch (err) {
    next(err);
  }
};

exports.supportedCrops = async (req, res) => {
  res.json({ success: true, crops: SUPPORTED_CROPS });
};
