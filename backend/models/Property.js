const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    propertyType: {
      type: String,
      enum: [
        "Apartment",
        "House",
        "Villa",
        "Studio",
        "Condo",
        "Plot",
        "Office",
        "Other"
      ],
      required: true
    },
    listingType: {
      type: String,
      enum: ["Rent", "Sale"],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "USD"
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 0
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 0
    },
    area: {
      type: Number,
      required: true,
      min: 0
    },
    amenities: [{
      type: String
    }],
    listingPhotoPaths: [{ type: String }],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["draft", "published", "rejected", "sold", "rented", "archived"],
      default: "draft"
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Property = mongoose.model("Property", PropertySchema);

module.exports = Property;
