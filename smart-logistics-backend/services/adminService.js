const User = require("../models/User");
const Load = require("../models/Load");
const Trip = require("../models/Trip");
const Truck = require("../models/Truck");

const getSystemStats = async () => {
  const [totalUsers, drivers, businesses, activeLoads, activeTrips] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "driver" }),
    User.countDocuments({ role: "business" }),
    Load.countDocuments({ status: "OPEN" }),
    Trip.countDocuments({ status: { $in: ["ASSIGNED", "READY", "IN_TRANSIT"] } })
  ]);

  return {
    totalUsers,
    drivers,
    businesses,
    activeLoads,
    activeTrips
  };
};

const getAllUsers = async () => {
  return User.find().select("-password").sort({ createdAt: -1 });
};

const getPendingDocuments = async () => {
  // Find all trucks that have any uploaded (pending verification) documents
  return Truck.find({
    $or: [
      { pucStatus: "uploaded" },
      { insuranceStatus: "uploaded" },
      { permitStatus: "uploaded" }
    ]
  })
    .populate("driver", "name email phone")
    .sort({ updatedAt: -1 });
};

const verifyDocument = async (truckId, docType, action) => {
  const truck = await Truck.findById(truckId);
  if (!truck) {
    const err = new Error("Truck not found");
    err.statusCode = 404;
    throw err;
  }

  if (!["puc", "insurance", "permit"].includes(docType)) {
    const err = new Error("Invalid document type");
    err.statusCode = 400;
    throw err;
  }

  if (!["approve", "reject"].includes(action)) {
    const err = new Error("Invalid action. Must be 'approve' or 'reject'");
    err.statusCode = 400;
    throw err;
  }

  const newStatus = action === "approve" ? "verified" : "rejected";
  const note = action === "approve" ? "Manually verified by Admin" : "Manually rejected by Admin";

  const updatePayload = {};
  if (docType === "puc") {
    updatePayload.pucStatus = newStatus;
    updatePayload["pucDetails.note"] = note;
  } else if (docType === "insurance") {
    updatePayload.insuranceStatus = newStatus;
    updatePayload["insuranceDetails.note"] = note;
  } else if (docType === "permit") {
    updatePayload.permitStatus = newStatus;
    updatePayload["permitDetails.note"] = note;
  }

  const updatedTruck = await Truck.findByIdAndUpdate(
    truckId,
    { $set: updatePayload },
    { new: true }
  );

  return updatedTruck;
};

module.exports = {
  getSystemStats,
  getAllUsers,
  getPendingDocuments,
  verifyDocument
};
