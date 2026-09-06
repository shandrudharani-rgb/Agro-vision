require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

connectDB();

// Make sure the uploads directory exists before multer or static serving
// try to use it (fresh clones / deployments won't have it otherwise, since
// empty directories aren't tracked by git).
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created missing uploads directory at ${uploadsDir}`);
}

const app = express();

// NOTE: a wildcard origin ('*') cannot be combined with credentials: true —
// browsers reject that combination. Fall back to the common local dev
// origin instead of '*' so cookies/Authorization headers still work.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/crop', require('./routes/cropRoutes'));
app.use('/api/disease', require('./routes/diseaseRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/soil-health', require('./routes/soilHealthRoutes'));
app.use('/api/profit', require('./routes/profitRoutes'));
app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/schemes', require('./routes/schemeRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/pest-alerts', require('./routes/pestRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// --- NEW (additive) routes below. Existing routes above are unchanged. ---
app.use('/api/weather-live', require('./routes/weatherLiveRoutes'));
app.use('/api/market-live', require('./routes/marketLiveRoutes'));
app.use('/api/pest-risk', require('./routes/pestRiskRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is running' }));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
