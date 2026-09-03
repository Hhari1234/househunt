const PropertyService = require('../services/property.service');

const propertyController = {
  // GET /api/v1/properties
  async getAllProperties(req, res) {
    try {
      // Public listings only surface published homes; admins manage
      // drafts through the dedicated /admin endpoints.
      const filters = { ...req.query, status: req.query.status || 'published' };
      const result = await PropertyService.getAllProperties(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/v1/properties/:id
  async getById(req, res) {
    try {
      const property = await PropertyService.getById(req.params.id);
      if (!property) {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }
      // Unpublished homes are only visible to their owner or an admin;
      // everyone else sees the same 404 as a missing property.
      const ownerId = property.owner ? (property.owner._id || property.owner) : null;
      const isOwner = req.userId && ownerId && String(ownerId) === String(req.userId);
      const isAdmin = req.userRole === 'admin';
      if (property.status !== 'published' && !isOwner && !isAdmin) {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /api/v1/properties
  async createProperty(req, res) {
    try {
      const property = await PropertyService.createProperty(req.body);
      res.status(201).json(property);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // PATCH /api/v1/properties/:id
  async updateProperty(req, res) {
    try {
      const property = await PropertyService.updateProperty(req.params.id, req.body, req.userId);
      if (!property) {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }
      res.json(property);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // DELETE /api/v1/properties/:id
  async deleteProperty(req, res) {
    try {
      const result = await PropertyService.deleteProperty(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Property not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = propertyController;
