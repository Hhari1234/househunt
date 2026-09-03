const express = require('express');
const router = express.Router();
const favoritesController = require('../../controllers/favorites.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Favorites routes - all require authentication
router.get('/', authenticate, favoritesController.getAllFavorites);
router.post('/:propertyId', authenticate, favoritesController.addFavorite);
router.delete('/:propertyId', authenticate, favoritesController.removeFavorite);

module.exports = router;
