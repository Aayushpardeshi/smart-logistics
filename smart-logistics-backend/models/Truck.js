const mongoose = require("mongoose");

const truckSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    truckNumber: { type: String, required: true, unique: true, trim: true },
    truckType: { type: String, enum: ["mini", "medium", "heavy", "trailer"], required: true },
    capacityTons: { type: Number, required: true },
    imageUrls: [{ type: String }],
    rcDocUrl: { type: String },
    pucDocUrl: { type: String },
    insuranceDocUrl: { type: String },
    permitDocUrl: { type: String },
    isActive: { type: Boolean, default: true },
    rcStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    pucStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    insuranceStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    permitStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    rcDetails: { type: Object },
    pucDetails: { type: Object },
    insuranceDetails: { type: Object },
    permitDetails: { type: Object },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Truck", truckSchema);