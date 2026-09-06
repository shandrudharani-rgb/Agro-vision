import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import OfflineBanner from './components/OfflineBanner';
import api from './services/api';
import { initOfflineSync, flushQueue } from './services/offlineSync';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import CropRecommendation from './pages/CropRecommendation';
import DiseaseDetection from './pages/DiseaseDetection';
import SoilHealth from './pages/SoilHealth';
import MarketPrices from './pages/OfficialMarketPrices';
import ProfitCalculator from './pages/ProfitCalculator';
import PestAlerts from './pages/PestAlerts';
import Schemes from './pages/Schemes';
import Community from './pages/Community';
import Chatbot from './pages/Chatbot';
import Reports from './pages/FarmReports';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  useEffect(() => {
    initOfflineSync(api);
    if (navigator.onLine) flushQueue(api);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <OfflineBanner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/crop-recommendation" element={<CropRecommendation />} />
            <Route path="/disease-detection" element={<DiseaseDetection />} />
            <Route path="/soil-health" element={<SoilHealth />} />
            <Route path="/market-prices" element={<MarketPrices />} />
            <Route path="/profit-calculator" element={<ProfitCalculator />} />
            <Route path="/pest-alerts" element={<PestAlerts />} />
            <Route path="/schemes" element={<Schemes />} />
            <Route path="/community" element={<Community />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
