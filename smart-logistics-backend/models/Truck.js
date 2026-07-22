const mongoose = require("mongoose");

const truckSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    truckNumber: { type: String, required: true, unique: true, trim: true },
    truckType: { type: String, enum: ["mini", "medium", "heavy", "trailer"], required: true },
    capacityTons: { type: Number, required: true },
    imageUrls: [{ type: String }],
    rcDocUrl: { type: String },
    isActive: { type: Boolean, default: true },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Truck", truckSchema);