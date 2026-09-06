const ProfitCalculation = require('../models/ProfitCalculation');

exports.calculate = async (req, res, next) => {
  try {
    const {
      crop, seedCost, fertilizerCost, pesticideCost, labourCost,
      irrigationCost, machineryCost, transportationCost, sellingPrice, yieldAmount,
    } = req.body;

    const costs = {
      seed: Number(seedCost) || 0,
      fertilizer: Number(fertilizerCost) || 0,
      pesticide: Number(pesticideCost) || 0,
      labour: Number(labourCost) || 0,
      irrigation: Number(irrigationCost) || 0,
      machinery: Number(machineryCost) || 0,
      transportation: Number(transportationCost) || 0,
    };

    const totalCost = Object.values(costs).reduce((a, b) => a + b, 0);
    const totalRevenue = (Number(sellingPrice) || 0) * (Number(yieldAmount) || 0);
    const net = totalRevenue - totalCost;
    const profit = net > 0 ? net : 0;
    const loss = net < 0 ? Math.abs(net) : 0;
    const profitPercentage = totalCost > 0 ? Number(((net / totalCost) * 100).toFixed(2)) : 0;

    const record = await ProfitCalculation.create({
      user: req.user._id,
      crop,
      costs,
      sellingPrice: Number(sellingPrice) || 0,
      yield: Number(yieldAmount) || 0,
      result: { totalCost, totalRevenue, profit, loss, profitPercentage },
    });

    res.status(201).json({ success: true, calculation: record });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const history = await ProfitCalculation.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
};
