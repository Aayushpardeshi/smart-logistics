const mongoose = require("mongoose");

const driverProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    licenseNumber: { type: String, trim: true },
    licenseDocUrl: { type: String },
    aadhaarDocUrl: { type: String },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DriverProfile", driverProfileSchema);