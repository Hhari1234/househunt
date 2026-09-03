const mongoose = require('mongoose');

// Favorites model for user favorites tracking
const FavoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound unique index to prevent duplicate favorites
FavoriteSchema.index({ user: 1, property: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', FavoriteSchema);

module.exports = Favorite;
