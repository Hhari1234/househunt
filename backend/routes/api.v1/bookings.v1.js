const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/booking.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// All booking routes require authentication
router.post('/', authenticate, bookingController.createBooking);
router.get('/', authenticate, bookingController.getAllBookings);
router.get('/:id', authenticate, bookingController.getById);
router.patch('/:id', authenticate, bookingController.updateBooking);
router.delete('/:id', authenticate, bookingController.deleteBooking);

module.exports = router;
