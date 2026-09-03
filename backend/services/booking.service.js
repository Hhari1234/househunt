const Booking = require('../models/Booking');
const User = require('../models/User');
const Property = require('../models/Property');

const bookingService = {
  // GET /api/v1/bookings
  async getAllBookings(filters = {}, pagination = {}) {
    try {
      const query = {};
      if (filters.userId) query.customerId = filters.userId;
      if (filters.propertyId) query.listingId = filters.propertyId;
      if (filters.startDate) query.startDate = filters.startDate;
      if (filters.endDate) query.endDate = filters.endDate;
      if (filters.status) query.status = filters.status;

      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const skip = (page - 1) * limit;

      const bookings = await Booking.find(query)
        .populate('listingId', 'title price listingPhotoPaths propertyType listingType')
        .populate('customerId', 'firstName lastName email')
        .populate('hostId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Booking.countDocuments(query);

      return {
        success: true,
        data: bookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
  },

  // GET /api/v1/bookings/:id
  async getById(id, userId) {
    try {
      const booking = await Booking.findById(id);
      if (!booking) {
        throw new Error('Booking not found');
      }
      if (booking.customerId.toString() !== userId) {
        throw new Error('Not authorized to access this booking');
      }
      return booking;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // POST /api/v1/bookings
  async createBooking(data) {
    try {
      // Validate required fields
      if (!data.hostId || !data.listingId || !data.startDate || !data.endDate) {
        throw new Error('Missing required booking fields: hostId, listingId, startDate, endDate');
      }

      // Check if listing exists and is available
      const listing = await Property.findById(data.listingId);
      if (!listing) {
        throw new Error('Property not found');
      }

      // Check if property is already booked during the period
      const conflicts = await Booking.find({
        listingId: data.listingId,
        startDate: { $lte: data.endDate },
        endDate: { $gte: data.startDate }
      }).countDocuments();

      if (conflicts > 0) {
        throw new Error('Property already has conflicting bookings');
      }

      const booking = await Booking.create(data);
      return booking;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // PATCH /api/v1/bookings/:id
  async updateBooking(id, data, userId) {
    try {
      // Check ownership
      const booking = await Booking.findById(id);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Prevent modifying other users' bookings
      if (!userId || booking.customerId.toString() !== userId) {
        throw new Error("Cannot modify other users' booking");
      }

      const updated = await Booking.updateOne(
        { _id: id },
        { $set: data }
      );

      if (!updated) {
        throw new Error('Booking not found');
      }

      return await Booking.findById(id);
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // DELETE /api/v1/bookings/:id
  async deleteBooking(id) {
    try {
      const booking = await Booking.findById(id);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Delete associated property listing if it has no other bookings
      // (optional cleanup)

      await Booking.deleteOne({ _id: id });
      return { success: true };
    } catch (error) {
      throw new Error(error.message);
    } finally {
      // Release lock
    }
  }
};

module.exports = bookingService;
