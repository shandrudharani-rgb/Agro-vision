const CropRecommendation = require('../models/CropRecommendation');
const { recommendCrop } = require('../utils/cropEngine');

exports.getRecommendation = async (req, res, next) => {
  try {
    const { soilType, nitrogen, phosphorus, potassium, ph, temperature, humidity, rainfall } = req.body;

    const inputs = {
      soilType,
      nitrogen: Number(nitrogen),
      phosphorus: Number(phosphorus),
      potassium: Number(potassium),
      ph: Number(ph),
      temperature: Number(temperature),
      humidity: Number(humidity),
      rainfall: Number(rainfall),
    };

    const result = recommendCrop(inputs);

    const record = await CropRecommendation.create({
      user: req.user._id,
      inputs,
      result,
    });

    res.status(201).json({ success: true, recommendation: record });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const history = await CropRecommendation.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
};
