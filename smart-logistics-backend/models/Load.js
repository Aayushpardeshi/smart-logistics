const mongoose = require("mongoose");

const loadSchema = new mongoose.Schema(
  {
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
    cargoType: { type: String, required: true },
    cargoWeight: { type: Number, required: true }, // in tons
    vehicleType: { type: String, required: true },
    pickupDate: { type: Date, required: true },
    deliveryDate: { type: Date, required: true },
    budget: { type: Number, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["OPEN", "BIDDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "COMPLETED"],
      default: "OPEN",
    },
  },
  { timestamps: true }
);

loadSchema.index({ status: 1 });
loadSchema.index({ businessId: 1 });
loadSchema.index({ "source.address": "text", "destination.address": "text" });

module.exports = mongoose.model("Load", loadSchema);
