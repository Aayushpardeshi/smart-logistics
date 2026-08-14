const Bid = require("../models/Bid");

const create = (data) => Bid.create(data);
const findById = (id) => Bid.findById(id);
const findByDriver = (driverId) => Bid.find({ driverId }).populate("loadId").sort({ createdAt: -1 });
const findByLoad = (loadId) => Bid.find({ loadId }).populate("driverId", "name").sort({ amount: 1 });
const updateStatus = (id, status) => Bid.findByIdAndUpdate(id, { status }, { new: true });
const rejectOtherBids = (loadId, acceptedBidId) => 
  Bid.updateMany({ loadId, _id: { $ne: acceptedBidId } }, { $set: { status: "REJECTED" } });

module.exports = { create, findById, findByDriver, findByLoad, updateStatus, rejectOtherBids };
