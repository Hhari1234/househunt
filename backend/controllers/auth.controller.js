const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const authService = require('../services/auth.service');

const authController = {
  // POST /api/v1/auth/register
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // POST /api/v1/auth/login
  async login(req, res) {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.json(result);
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('Email and password')) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(401).json({ success: false, error: error.message });
      }
    }
  },

  // POST /api/v1/auth/logout
  async logout(req, res) {
    try {
      const result = await authService.logout();
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/v1/auth/me
  async getMe(req, res) {
    try {
      const result = await authService.getUserProfile(req.userId);
      res.json(result);
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  },

  // PUT /api/v1/auth/me
  async updateMe(req, res) {
    try {
      const updateData = {};
      if (req.body.firstName) updateData.firstName = req.body.firstName;
      if (req.body.lastName) updateData.lastName = req.body.lastName;
      if (req.body.email) updateData.email = req.body.email.toLowerCase().trim();

      const result = await authService.updateUserProfile(req.userId, updateData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // DELETE /api/v1/auth/me
  async deleteMe(req, res) {
    try {
      const result = await authService.deleteUserAccount(req.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = authController;