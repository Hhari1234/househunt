const Property = require('../models/Property');
const Favorite = require('../models/Favorite');

const favoritesService = {
  // GET /api/v1/favorites
  async getAllFavorites(userId, filters = {}, pagination = {}) {
    try {
      // Get user's favorite property IDs
      const favorites = await Favorite.find({ user: userId }).populate('property');
      
      // Get all properties with pagination
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const skip = (page - 1) * limit;

      // Filter favorites based on criteria
      const filteredFavorites = favorites.filter(favorite => {
        const property = favorite.property;
        if (filters.city && property.city !== filters.city) return false;
        if (filters.propertyType && property.propertyType !== filters.propertyType) return false;
        if (filters.listingType && property.listingType !== filters.listingType) return false;
        if (filters.minPrice && property.price < filters.minPrice) return false;
        if (filters.maxPrice && property.price > filters.maxPrice) return false;
        return true;
      });

      const total = filteredFavorites.length;

      return {
        success: true,
        data: filteredFavorites.map(fav => fav.property),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch favorites: ${error.message}`);
    }
  },

  // POST /api/v1/favorites/:propertyId
  async addFavorite(propertyId, userId) {
    try {
      // Check if property exists
      const property = await Property.findById(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      // Check if user already favorited this property
      const existingFavorite = await Favorite.findOne({ user: userId, property: propertyId });
      if (existingFavorite) {
        throw new Error('Already favorited');
      }

      // Create new favorite
      const favorite = await Favorite.create({
        user: userId,
        property: propertyId
      });

      return favorite;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // DELETE /api/v1/favorites/:propertyId
  async removeFavorite(propertyId, userId) {
    try {
      const result = await Favorite.deleteOne({ user: userId, property: propertyId });
      
      if (result.deletedCount === 0) {
        throw new Error('No favorites found for this property');
      }

      return { success: true };
    } catch (error) {
      throw new Error(error.message);
    }
  }
};

module.exports = favoritesService;
