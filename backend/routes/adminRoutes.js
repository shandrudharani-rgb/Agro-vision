const express = require('express');
const router = express.Router();
const {
  getAnalytics, listFarmers, updateFarmerStatus, deleteFarmer,
  listAllDiseaseReports, listAllCropRecommendations, listAllProfitReports,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/analytics', getAnalytics);
router.get('/farmers', listFarmers);
router.put('/farmers/:id/role', updateFarmerStatus);
router.delete('/farmers/:id', deleteFarmer);
router.get('/disease-reports', listAllDiseaseReports);
router.get('/crop-recommendations', listAllCropRecommendations);
router.get('/profit-reports', listAllProfitReports);

module.exports = router;
