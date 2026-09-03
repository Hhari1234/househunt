const userService = require('../services/user.service');

const userController = {
  // GET /api/v1/users/me
  async getMe(req, res) {
    try {
      const result = await userService.getUserProfile(req.userId);
      res.json(result);
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  },

  // PATCH /api/v1/users/me
  async updateMe(req, res) {
    try {
      const updateData = {};
      if (req.body.firstName) updateData.firstName = req.body.firstName;
      if (req.body.lastName) updateData.lastName = req.body.lastName;
      if (req.body.email) updateData.email = req.body.email.toLowerCase().trim();

      const result = await userService.updateUserProfile(req.userId, updateData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // DELETE /api/v1/users/me
  async deleteMe(req, res) {
    try {
      const result = await userService.deleteUserAccount(req.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = userController;