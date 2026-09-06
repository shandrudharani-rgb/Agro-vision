const mongoose = require('mongoose');
const ensureSampleData = require('../seed/ensureSampleData');

// How long to wait for the initial server selection before giving up on a
// single attempt (kept short so the app doesn't hang for mongoose's 30s
// default before we can log something useful and retry).
const SERVER_SELECTION_TIMEOUT_MS = 8000;
// How long to wait between reconnect attempts if MongoDB is unreachable.
const RETRY_DELAY_MS = 5000;

let retryTimer = null;
let hasLoggedInitialFailure = false;

/**
 * Connects to MongoDB using MONGO_URI from environment variables.
 *
 * IMPORTANT: This intentionally never calls process.exit() on failure.
 * The Express app is started independently of this connection (see
 * server.js), so routes that don't touch the database (health check,
 * static file serving, etc.) keep working even while MongoDB is down.
 * Database-dependent routes will fail individually with a clear 500/503
 * until the connection is established, at which point they start working
 * automatically without a server restart.
 */
const connectDB = () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error(
      'MongoDB connection error: MONGO_URI is not set. Add it to backend/.env (see .env.example). ' +
        'The server will keep running, but all database-dependent features will fail until this is fixed.'
    );
    scheduleRetry();
    return;
  }

  mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    })
    .then(async (conn) => {
      hasLoggedInitialFailure = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      console.log(`MongoDB connected: ${conn.connection.host}`);
      try {
        await ensureSampleData();
      } catch (seedError) {
        // The connection remains usable; log the issue so a bad seed never
        // prevents the API from starting.
        console.error(`Initial sample-data seed failed: ${seedError.message}`);
      }
    })
    .catch((err) => {
      if (!hasLoggedInitialFailure) {
        console.error(`MongoDB connection error: ${err.message}`);
        console.error(
          `Server will keep running and retry the MongoDB connection every ${RETRY_DELAY_MS / 1000}s. Database-dependent features will be unavailable until it connects.`
        );
        hasLoggedInitialFailure = true;
      }
      scheduleRetry();
    });
};

function scheduleRetry() {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connectDB();
  }, RETRY_DELAY_MS);
}

// Keep retrying/logging if an established connection later drops.
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Will attempt to reconnect...');
  scheduleRetry();
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB runtime error: ${err.message}`);
});

module.exports = connectDB;
