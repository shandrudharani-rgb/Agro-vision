import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { useLanguage } from "../LanguageContext";
import en from '../locales/en';
import ta from '../locales/ta';
import { useTheme } from '../context/ThemeContext';



const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const { language, changeLanguage } = useLanguage();


const text = language === "ta" ? ta : en;

const NAV_ITEMS = [
  { to: "/dashboard", label: text.dashboard, icon: "bi-speedometer2" },
  { to: "/crop-recommendation", label: text.cropRecommendation, icon: "bi-flower1" },
  { to: "/disease-detection", label: text.diseaseDetection, icon: "bi-bug" },
  { to: "/soil-health", label: text.soilHealth, icon: "bi-moisture" },
  { to: "/market-prices", label: text.marketPrice, icon: "bi-graph-up-arrow" },
  { to: "/profit-calculator", label: text.profitCalculator, icon: "bi-calculator" },
  { to: "/pest-alerts", label: text.pestAlerts, icon: "bi-exclamation-triangle" },
  { to: "/schemes", label: text.governmentSchemes, icon: "bi-bank" },
  { to: "/community", label: text.community, icon: "bi-people" },
  { to: "/chatbot", label: text.aiChat, icon: "bi-chat-dots" },
  { to: "/reports", label: text.savedReports, icon: "bi-file-earmark-text" },
];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell dashboard-shell position-relative">
      {/* Backdrop closes the mobile nav when tapping outside of it */}
      {mobileNavOpen && (
        <div className="sidebar-backdrop d-lg-none" onClick={() => setMobileNavOpen(false)} />
      )}
      <div
        className={`sidebar p-3 ${mobileNavOpen ? 'sidebar-open' : ''}`}
        style={{ width: 260 }}
      >
        <div className="d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-flower2 fs-3"></i>
          <span className="fs-5 fw-bold brand-font">{text.appName}</span>
        </div>
        <nav className="nav flex-column">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="nav-link px-3 py-2 d-flex align-items-center gap-2"
              onClick={() => setMobileNavOpen(false)}
            >
              <i className={`bi ${item.icon}`}></i> {item.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className="nav-link px-3 py-2 d-flex align-items-center gap-2"
              onClick={() => setMobileNavOpen(false)}
            >
              <i className="bi bi-shield-lock"></i> {text.adminPanel}
            </NavLink>
          )}
        </nav>
      </div>

      <div className="dashboard-main">
        <div className="app-header dashboard-header d-flex justify-content-between align-items-center px-4 py-3 glass-card m-3">
          <button className="btn btn-sm btn-agri-outline d-lg-none" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            <i className="bi bi-list"></i>
          </button>
          <div className="fw-semibold section-title">{text.welcome}, {user?.fullName}</div>
           <div className="d-flex align-items-center gap-3">
            <button className="btn btn-sm btn-agri-outline" onClick={toggleTheme} aria-label="Toggle light and dark theme">
              <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'}`}></i>
            </button>
            <button 
            className="btn btn-sm btn-success"
             onClick={() => {
             changeLanguage(language === "en" ? "ta" : "en");
                }}
             >
             {language === "ta" ? text.english : text.tamil}
                </button>
            <NotificationBell />
            <NavLink to="/profile" className="text-decoration-none text-dark">
              <i className="bi bi-person-circle fs-5"></i>
            </NavLink>
            <button className="btn btn-sm btn-agri" onClick={handleLogout}>{text.logout}</button>
  
          </div>
        </div>
        <main className="dashboard-content px-3 pb-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
