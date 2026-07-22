const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTruck: { type: mongoose.Schema.Types.ObjectId, ref: "Truck", default: null },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    goodsType: { type: String, required: true, trim: true },
    weightTons: { type: Number, required: true },
    goodsImageUrls: [{ type: String }],

    pickupLocation: {
      address: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    dropLocation: {
      address: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
    },

    status: {
      type: String,
      enum: ["pending", "matched", "accepted", "in_transit", "delivered", "cancelled"],
      default: "pending",
    },

    priceOffered: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);