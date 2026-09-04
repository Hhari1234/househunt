const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware — public property images must be embeddable cross-origin,
// so disable helmet's Cross-Origin-Resource-Policy (same-origin blocks <img>)
app.use(helmet({ crossOriginResourcePolicy: false }));
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without an Origin header (curl, tests, same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));
// 4 MB matches the serverless request-body ceiling; local dev rarely needs more
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

// Database connection
const databaseConfig = require('./config/database');

// Connect lazily so the exported Express app works in serverless environments
// (Vercel) where there is no boot-time entry point. Development still connects
// up front via initializeApp() below.
let dbConnectionPromise = null;
function ensureDatabaseConnection() {
  if (!dbConnectionPromise) {
    dbConnectionPromise = databaseConfig.connect().catch((error) => {
      dbConnectionPromise = null; // allow a retry on the next request
      throw error;
    });
  }
  return dbConnectionPromise;
}

// API + uploaded-image requests need the database; anything else (static
// assets, /health) stays reachable even before the first successful connect.
app.use(['/api', '/uploads', '/health'], async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    next();
  } catch {
    res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' }
    });
  }
});

// Serve uploaded property images through the storage driver (disk locally,
// MongoDB GridFS in production) so photos survive redeploys.
const imageStore = require('./services/image.store');
app.get('/uploads/:key', async (req, res) => {
  try {
    const saved = await imageStore.openSaved(req.params.key);
    if (!saved) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }
    res.setHeader('Content-Type', saved.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    saved.stream.on('error', () => {
      if (!res.headersSent) res.status(500).json({ success: false, error: 'Image read failed' });
    });
    saved.stream.pipe(res);
  } catch {
    res.status(500).json({ success: false, error: 'Image read failed' });
  }
});

// API v1 routes
const apiRoutes = require('./routes/api.v1/index.v1');
app.use('/api/v1', apiRoutes);

// Health check endpoint (DB-aware; never leaks configuration)
app.get('/health', async (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'househunt-api',
    time: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found'
    }
  });
});

// Error handling middleware
app.use(require('./middleware/error.middleware').general);

module.exports = app;

// Connect to MongoDB before starting the server
async function initializeApp() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error(
        'JWT_SECRET is not set. Copy backend/.env.example to backend/.env and set a strong secret before starting.'
      );
    }
    await ensureDatabaseConnection();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
  }
}

// Start server only when run directly (Vercel imports the app instead)
if (require.main === module) {
  initializeApp().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`HouseHunt API server running on port ${PORT}`);
    });
  }).catch(error => {
    console.error('Failed to initialize application:', error.message);
    process.exit(1);
  });
}

// Exported for serverless hosting so the runtime can ensure a DB connection
// before serving the first request.
module.exports.ensureDatabaseConnection = ensureDatabaseConnection;


// Graceful shutdown handling
process.on('SIGINT', async () => {
  try {
    await databaseConfig.disconnect();
    console.log('Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await databaseConfig.disconnect();
    console.log('Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
