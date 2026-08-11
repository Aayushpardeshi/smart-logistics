const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    documentType: { 
      type: String, 
      enum: ["DRIVING_LICENCE", "AADHAAR", "RC", "PUC", "INSURANCE", "PERMIT"],
      required: true 
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "VERIFIED", "REJECTED", "EXPIRED"],
      default: "PENDING",
    },
    fileUrls: [{ type: String, required: true }],
    extractedData: { type: mongoose.Schema.Types.Mixed, default: {} },
    confidence: { type: Number },
    fraudFlags: [{ type: String }],
    warnings: [{ type: String }],
    expiryDate: { type: Date },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

documentSchema.index({ driverId: 1 });

module.exports = mongoose.model("Document", documentSchema);
