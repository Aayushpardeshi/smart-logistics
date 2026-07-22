const Truck = require("../models/Truck");

const create = (data) => Truck.create(data);
const findByDriver = (driverId) => Truck.find({ driver: driverId });
const findById = (id) => Truck.findById(id);
const updateById = (id, data) => Truck.findByIdAndUpdate(id, { $set: data }, { new: true });
const deleteById = (id) => Truck.findByIdAndDelete(id);

module.exports = { create, findByDriver, findById, updateById, deleteById };