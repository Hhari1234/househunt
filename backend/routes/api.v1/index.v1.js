const express = require('express');
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'househunt-api'
  });
});

// Auth routes
const authRoutes = require('./auth.v1');
router.use('/auth', authRoutes);

// User routes
const userRoutes = require('./user.v1');
router.use('/users', userRoutes);

// Property routes
const propertyRoutes = require('./property.v1');
router.use('/properties', propertyRoutes);

// Favorites routes
const favoritesRoutes = require('./favorites.v1');
router.use('/favorites', favoritesRoutes);

// Booking routes
const bookingRoutes = require('./bookings.v1');
router.use('/bookings', bookingRoutes);

// Upload routes
const uploadRoutes = require('./upload.v1');
router.use('/upload', uploadRoutes);

// Admin routes
const adminRoutes = require('./admin.v1');
router.use('/admin', adminRoutes);

module.exports = router;