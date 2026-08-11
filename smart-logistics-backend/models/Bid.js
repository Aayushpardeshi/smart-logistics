const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    loadId: { type: mongoose.Schema.Types.ObjectId, ref: "Load", required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    estimatedDelivery: { type: Date, required: true },
    message: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

bidSchema.index({ loadId: 1 });
bidSchema.index({ driverId: 1 });
bidSchema.index({ loadId: 1, driverId: 1 }, { unique: true });

module.exports = mongoose.model("Bid", bidSchema);
