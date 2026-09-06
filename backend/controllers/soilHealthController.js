const SoilHealth = require('../models/SoilHealth');
const { calculateSoilHealth } = require('../utils/soilHealthEngine');

exports.calculate = async (req, res, next) => {
  try {
    const { nitrogen, phosphorus, potassium, ph, moisture, organicCarbon } = req.body;
    const inputs = {
      nitrogen: Number(nitrogen),
      phosphorus: Number(phosphorus),
      potassium: Number(potassium),
      ph: Number(ph),
      moisture: Number(moisture),
      organicCarbon: Number(organicCarbon),
    };

    const { score, indicator, suggestions } = calculateSoilHealth(inputs);

    const record = await SoilHealth.create({
      user: req.user._id,
      inputs,
      score,
      indicator,
      suggestions,
    });

    res.status(201).json({ success: true, soilHealth: record });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const history = await SoilHealth.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
};
