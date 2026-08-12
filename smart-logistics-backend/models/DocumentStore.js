const mongoose = require("mongoose");

const documentStoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    docType: {
      type: String,
      enum: ["license_front", "license_back", "aadhaar_front", "aadhaar_back", "rc", "puc", "insurance", "permit"],
      required: true,
    },
    truck: { type: mongoose.Schema.Types.ObjectId, ref: "Truck" },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    dataUrl: { type: String, required: true },
    fileHash: { type: String, required: true, index: true },
    fileSize: { type: Number, required: true },
  },
  { timestamps: true }
);

documentStoreSchema.index({ user: 1, docType: 1, fileHash: 1 }, { unique: true });

module.exports = mongoose.model("DocumentStore", documentStoreSchema);
