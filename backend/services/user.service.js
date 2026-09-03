const mongoose = require('mongoose');

const User = mongoose.model('User');

const userService = {
  // Get current user profile
  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Get all users (admin)
  async getAllUsers(filters = {}, pagination = {}) {
    try {
      const query = {};
      if (filters.isActive) {
        // 'true' also matches legacy documents that predate the isActive field
        query.isActive = filters.isActive === 'true' ? { $ne: false } : false;
      }

      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const skip = (page - 1) * limit;

      const users = await User.find(query)
        .skip(skip)
        .limit(limit)
        .select('-password');

      const total = await User.countDocuments(query);

      return {
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Delete user account
  async deleteUserAccount(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false, deletedAt: new Date() },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return { success: true, message: 'Account deactivated' };
    } catch (error) {
      throw error;
    }
  }
};

module.exports = userService;