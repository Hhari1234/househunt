const bookingService = require('../services/booking.service');

const bookingController = {
  // POST /api/v1/bookings
  async createBooking(req, res) {
    try {
      const booking = await bookingService.createBooking(req.body);
      res.status(201).json(booking);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // GET /api/v1/bookings
  async getAllBookings(req, res) {
    try {
      const { userId, propertyId, startDate, endDate, page, limit } = req.query;
      const filters = {};
      if (userId) filters.userId = userId;
      if (propertyId) filters.propertyId = propertyId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const pagination = { page, limit };
      
      const result = await bookingService.getAllBookings(filters, pagination);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/v1/bookings/:id
  async getById(req, res) {
    try {
      const booking = await bookingService.getById(req.params.id, req.userId);
      res.json(booking);
    } catch (error) {
      if (error.message.includes('Not authorized')) {
        res.status(403).json({ success: false, error: error.message });
      } else {
        res.status(404).json({ success: false, error: error.message });
      }
    }
  },

  // PATCH /api/v1/bookings/:id
  async updateBooking(req, res) {
    try {
      const booking = await bookingService.updateBooking(req.params.id, req.body, req.userId);
      res.json(booking);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // DELETE /api/v1/bookings/:id
  async deleteBooking(req, res) {
    try {
      const result = await bookingService.deleteBooking(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
};

module.exports = bookingController;
