const Shipment = require("../models/Shipment");

const create = (data) => Shipment.create(data);
const findByBusiness = (businessId) => Shipment.find({ business: businessId }).sort({ createdAt: -1 });
const findById = (id) => Shipment.findById(id);
const updateById = (id, data) => Shipment.findByIdAndUpdate(id, { $set: data }, { new: true });
const deleteById = (id) => Shipment.findByIdAndDelete(id);

module.exports = { create, findByBusiness, findById, updateById, deleteById };