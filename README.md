
# 🌱 AGRO VISION

### Smart Agriculture Management System

AGRO VISION is a full-stack MERN application designed to help
farmers with smart crop recommendations, disease detection,
weather information, market prices, soil health, profit calculation,
pest alerts, government schemes, farmer community features,
and AI-powered agricultural assistance.

## Stack
- Frontend: React 18, React Router, Bootstrap 5, Recharts, Axios
- Backend: Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Multer
- Design: Green/white glassmorphism theme (see `frontend/src/theme.css`)

## Project structure
```
smart-agri/
  backend/
    config/        # DB connection
    controllers/    # Route handlers (MVC "C")
    middleware/     # auth, error handling, file upload
    models/         # Mongoose schemas (MVC "M")
    routes/         # Express routers
    utils/          # rule-based crop/soil/disease engines, JWT helper
    uploads/        # uploaded images (leaf photos, community posts)
    server.js
  frontend/
    src/
      components/   # Layout, ProtectedRoute, WeatherWidget, OfflineBanner
      context/       # AuthContext (JWT session)
      pages/         # one file per route/feature
      services/      # axios instance, offline sync queue
      theme.css       # design tokens (colors, glass cards, buttons)
```

## Setup

### 1. Backend
```bash
cd backend
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, WEATHER_API_KEY
npm install
npm run dev             # nodemon, http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm start                # http://localhost:3000
```

Set `REACT_APP_API_URL` in a `frontend/.env` file if your backend isn't on
`http://localhost:5000/api`.

## What's implemented vs. what needs a real integration

This was built from scratch (no prior codebase was supplied) with a rule-based
"AI" layer everywhere a full ML pipeline was requested, so the app is fully
wired end-to-end and runnable, but two areas are intentionally simplified —
swap them out without touching routes/DB/frontend contracts:

- **Crop recommendation** (`backend/utils/cropEngine.js`) — scores a small
  agronomy knowledge base against your inputs. Replace with a trained model
  or an external ML API call.
- **Disease detection** (`backend/utils/diseaseEngine.js`) — clearly labeled
  placeholder that returns a deterministic result from the uploaded image so
  the upload → store → diagnose → report flow works end-to-end. Real leaf
  disease detection needs a trained CNN on labeled image data; plug a hosted
  inference API into `analyzeImage()` when you have one.
- **Weather** — calls the real OpenWeatherMap API; you must supply
  `WEATHER_API_KEY` in `backend/.env`.
- **Chatbot** — keyword/rule-based (`backend/controllers/chatbotController.js`),
  covers all required topics; swap `getBotReply()` for a hosted LLM call if
  you want free-form answers.
- **Offline mode** — the dashboard/reports/tools work from cached data when
  offline, and a lightweight localStorage queue
  (`frontend/src/services/offlineSync.js`) retries failed writes once the
  connection returns. This is not a full service-worker/IndexedDB PWA setup.
- **PDF export** — "Generate Report" produces a printable page (browser
  Print → Save as PDF). A dedicated server-side PDF renderer (e.g. Puppeteer)
  can be added to `reportController.js` for a one-click download instead.

## Database collections
Users, CropRecommendations, DiseaseReports, SoilHealth, ProfitCalculations,
MarketPrices, GovernmentSchemes, Posts (+ comments), PestAlerts (+
subscriptions), SavedReports, ChatMessages — all defined under
`backend/models/`.

## Auth
JWT-based; register/login/forgot-password/reset-password are implemented.
`middleware/auth.js` exposes `protect` (any logged-in user) and `adminOnly`.
To create an admin, register normally then flip `role` to `"admin"` directly
in MongoDB (or via another existing admin using the admin panel).

## Not yet built (flagged rather than faked)
Given the size of the original spec, these were left out of this pass so
nothing shipped is a broken placeholder — happy to build any of them next:
- Push/SMS delivery for pest alert subscriptions (currently stores the
  subscription; there's no notification sender yet)
- Server-rendered PDF generation (currently uses browser print)
- Full offline-first PWA (service worker, IndexedDB, background sync)
=======
