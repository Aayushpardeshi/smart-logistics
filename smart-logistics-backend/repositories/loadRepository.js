const Load = require("../models/Load");

const create = (data) => Load.create(data);
const findByBusiness = (businessId) => Load.find({ businessId }).sort({ createdAt: -1 });
const findById = (id) => Load.findById(id);
const updateById = (id, data) => Load.findByIdAndUpdate(id, { $set: data }, { new: true });
const deleteById = (id) => Load.findByIdAndDelete(id);

const findOpenLoads = (filters = {}) => {
  const query = { status: "OPEN" };
  if (filters.cargoType) query.cargoType = filters.cargoType;
  if (filters.vehicleType) query.vehicleType = filters.vehicleType;
  
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  return Load.find(query).populate("businessId", "name phone companyName").sort({ createdAt: -1 });
};

module.exports = { create, findByBusiness, findById, updateById, deleteById, findOpenLoads };
