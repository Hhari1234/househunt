const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Property = require('../models/Property');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Favorite = require('../models/Favorite');

// Token signing/verification must never fall back to a hardcoded secret.
// Local dev refuses to start without JWT_SECRET (see server.js); on serverless
// hosts this throws a descriptive error instead of signing with a weak default.
const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured on this server');
  }
  return process.env.JWT_SECRET;
};

const authService = {
  // Register new user
  async register(userData) {
    try {
      const { firstName, lastName, email, password } = userData;

      if (!firstName || !lastName || !email || !password) {
        throw new Error('Missing required fields: firstName, lastName, email, password');
      }

      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = await User.create({
        firstName,
        lastName,
        email: normalizedEmail,
        password: hashedPassword,
        role: userData.role || 'user'
      });

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        getJwtSecret(),
        { expiresIn: '24h' }
      );

      return {
        success: true,
        token,
        user: {
          _id: user._id,
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

  // Login user
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const normalizedEmail = email.toLowerCase().trim();

      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        getJwtSecret(),
        { expiresIn: '24h' }
      );

      return {
        success: true,
        token,
        user: {
          _id: user._id,
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

  // Logout user (invalidate token in real implementation)
  async logout() {
    return { success: true, message: 'Logged out successfully' };
  },

  // Get user profile
  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        user: {
          _id: user._id,
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
          _id: user._id,
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

module.exports = authService;