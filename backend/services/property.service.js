const Property = require('../models/Property');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Escape user input so it can be used safely inside a RegExp
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const propertyService = {
  // GET /api/v1/properties
  async getAllProperties(filters = {}, pagination = {}) {
    try {
      // Apply filters
      const query = {};
      if (filters.city) query.city = filters.city;
      if (filters.state) query.state = filters.state;
      if (filters.country) query.country = filters.country;
      if (filters.propertyType) query.propertyType = filters.propertyType;
      if (filters.listingType) query.listingType = filters.listingType;
      if (filters.price) query.price = filters.price;
      if (filters.minPrice) query.price = { ...query.price, $gte: filters.minPrice };
      if (filters.maxPrice) query.price = { ...query.price, $lte: filters.maxPrice };
      if (filters.bedrooms) query.bedrooms = { $gte: filters.bedrooms };
      if (filters.bathrooms) query.bathrooms = { $gte: filters.bathrooms };
      if (filters.status) query.status = filters.status;
      if (filters.featured) query.featured = filters.featured === 'true';
      // Text search across title / description / property type
      if (filters.keyword) {
        const regex = new RegExp(escapeRegExp(filters.keyword), 'i');
        query.$or = [{ title: regex }, { description: regex }, { propertyType: regex }];
      }
      
      // Get all properties with pagination
      const page = pagination.page || 1;
      const limit = pagination.limit || 12;
      const skip = (page - 1) * limit;

      const properties = await Property.find(query)
        .populate('owner', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Property.countDocuments(query);

      return {
        success: true,
        data: properties,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch properties: ${error.message}`);
    }
  },

  // GET /api/v1/properties/:id — returns null when the id does not exist so
  // controllers can respond 404 (an unknown id is a client error, not a 500).
  async getById(id) {
    try {
      const property = await Property.findById(id).populate('owner', 'firstName lastName email');
      return property || null;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // POST /api/v1/properties
  async createProperty(data) {
    try {
      // Validate required fields
      if (!data.title || !data.description || !data.price) {
        throw new Error('Missing required fields: title, description, price');
      }

      const property = await Property.create(data);
      return property;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // PATCH /api/v1/properties/:id
  async updateProperty(id, data, userId) {
    try {
      const property = await Property.findById(id);
      if (!property) {
        throw new Error('Property not found');
      }

      if (property.owner.toString() !== userId) {
        throw new Error('Cannot modify other users\' property');
      }

      const updated = await Property.updateOne(
        { _id: id },
        { $set: data }
      );

      if (!updated) {
        throw new Error('Property not found');
      }

      return await Property.findById(id);
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // DELETE /api/v1/properties/:id
  async deleteProperty(id) {
    try {
      const result = await Property.deleteOne({ _id: id });
      if (result.deletedCount === 0) {
        throw new Error('Property not found');
      }
      return { success: true };
    } catch (error) {
      throw new Error(error.message);
    } finally {
      // Also delete associated bookings
      await Booking.deleteMany({ property: id });
    }
  }
};

module.exports = propertyService;
