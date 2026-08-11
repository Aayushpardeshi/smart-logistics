const Trip = require("../models/Trip");

const create = (data) => Trip.create(data);
const findById = (id) => Trip.findById(id);
const findByDriver = (driverId) => Trip.find({ driverId }).populate("loadId").populate("businessId", "name phone");
const findByBusiness = (businessId) => Trip.find({ businessId }).populate("loadId").populate("driverId", "name phone");
const updateStatus = (id, status, extraFields = {}) => Trip.findByIdAndUpdate(id, { status, ...extraFields }, { new: true });

module.exports = { create, findById, findByDriver, findByBusiness, updateStatus };
