const express = require('express');
const router = express.Router();
const propertyController = require('../../controllers/property.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth.middleware');

// Public routes
router.get('/', propertyController.getAllProperties);
router.get('/:id', optionalAuth, propertyController.getById);

// Protected routes
router.post('/', authenticate, propertyController.createProperty);
router.patch('/:id', authenticate, propertyController.updateProperty);
router.delete('/:id', authenticate, propertyController.deleteProperty);

module.exports = router;