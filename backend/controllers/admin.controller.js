const PropertyService = require('../services/property.service');
const UserService = require('../services/user.service');
const BookingService = require('../services/booking.service');
const Property = require('../models/Property');
const User = require('../models/User');

const PROPERTY_STATUSES = ['draft', 'published', 'rejected', 'sold', 'rented', 'archived'];

const adminController = {
  // GET /api/v1/admin/dashboard
  async getDashboard(req, res) {
    try {
      // Get all users count
      const users = await UserService.getAllUsers({});
      const activeUsers = await UserService.getAllUsers({ isActive: 'true' });
      
      // Get all properties count
      const properties = await PropertyService.getAllProperties({});
      const publishedProperties = await PropertyService.getAllProperties({ status: 'published' });
      
      // Get all bookings count
      const bookings = await BookingService.getAllBookings({});
      const completedBookings = await BookingService.getAllBookings({ status: 'completed' });
      
      res.json({
        success: true,
        data: {
          totalUsers: users.pagination.total,
          activeUsers: activeUsers.pagination.total,
          totalProperties: properties.pagination.total,
          publishedProperties: publishedProperties.pagination.total,
          totalBookings: bookings.pagination.total,
          completedBookings: completedBookings.pagination.total
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/v1/admin/users
  async getUsers(req, res) {
    try {
      const { page, limit, ...filters } = req.query;
      const pagination = { page, limit };
      const result = await UserService.getAllUsers(filters, pagination);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/v1/admin/properties
  async getProperties(req, res) {
    try {
      const { page, limit, ...filters } = req.query;
      const pagination = { page, limit };
      const result = await PropertyService.getAllProperties(filters, pagination);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/v1/admin/bookings
  async getBookings(req, res) {
    try {
      const { page, limit, ...filters } = req.query;
      const pagination = { page, limit };
      const result = await BookingService.getAllBookings(filters, pagination);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // PATCH /api/v1/admin/properties/:id/status
  async updatePropertyStatus(req, res) {
    try {
      const { status } = req.body;
      if (!status || !PROPERTY_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, error: `Status must be one of: ${PROPERTY_STATUSES.join(', ')}` });
      }

      const property = await Property.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      );

      if (!property) {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }

      res.json({ success: true, data: property });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // PATCH /api/v1/admin/users/:id/status
  async updateUserStatus(req, res) {
    try {
      const { status } = req.body;
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ success: false, error: "Status must be 'active' or 'inactive'" });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: status === 'active' },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = adminController;
