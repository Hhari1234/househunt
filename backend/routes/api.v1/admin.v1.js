const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Admin routes - all require admin authentication
router.get('/dashboard', authenticate, authorize('admin'), adminController.getDashboard);
router.get('/users', authenticate, authorize('admin'), adminController.getUsers);
router.get('/properties', authenticate, authorize('admin'), adminController.getProperties);
router.get('/bookings', authenticate, authorize('admin'), adminController.getBookings);
router.patch('/properties/:id/status', authenticate, authorize('admin'), adminController.updatePropertyStatus);
router.patch('/users/:id/status', authenticate, authorize('admin'), adminController.updateUserStatus);

module.exports = router;
