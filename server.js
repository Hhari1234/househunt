const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const databaseConfig = require('./backend/config/database');

// Connect to MongoDB before starting the server
async function initializeApp() {
  try {
    await databaseConfig.connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
  }
}

// Initialize the application
initializeApp().then(() => {
  // API v1 routes
  const apiRoutes = require('./backend/routes/api.v1');
  app.use('/api/v1', apiRoutes);

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
  app.use(require('./backend/middleware/error.middleware').general);

  // Start server
  app.listen(PORT, () => {
    console.log(`HouseHunt API server running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize application:', error.message);
  process.exit(1);
});

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
