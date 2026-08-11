const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    loadId: { type: mongoose.Schema.Types.ObjectId, ref: "Load", required: true },
    bidId: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    source: {
      address: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    destination: {
      address: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    status: {
      type: String,
      enum: ["ASSIGNED", "READY", "IN_TRANSIT", "DELIVERED", "COMPLETED"],
      default: "ASSIGNED",
    },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      timestamp: { type: Date, default: null }
    },
    startedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

tripSchema.index({ driverId: 1, status: 1 });
tripSchema.index({ businessId: 1, status: 1 });

module.exports = mongoose.model("Trip", tripSchema);
