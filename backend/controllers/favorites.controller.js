const favoritesService = require('../services/favorites.service');

const favoritesController = {
  // GET /api/v1/favorites
  async getAllFavorites(req, res) {
    try {
      const { page, limit, ...filters } = req.query;
      const pagination = { page, limit };
      const result = await favoritesService.getAllFavorites(req.userId, filters, pagination);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /api/v1/favorites/:propertyId
  async addFavorite(req, res) {
    try {
      const userId = req.userId; // From auth middleware
      const favorite = await favoritesService.addFavorite(req.params.propertyId, userId);
      res.status(201).json(favorite);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // DELETE /api/v1/favorites/:propertyId
  async removeFavorite(req, res) {
    try {
      const userId = req.userId; // From auth middleware
      const result = await favoritesService.removeFavorite(req.params.propertyId, userId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
};

module.exports = favoritesController;
