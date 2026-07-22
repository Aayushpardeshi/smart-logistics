const businessRepository = require("../repositories/businessRepository");
const shipmentRepository = require("../repositories/shipmentRepository");

const getProfile = async (userId) => {
  const profile = await businessRepository.findByUser(userId);
  if (!profile) {
    const err = new Error("Business profile not found");
    err.statusCode = 404;
    throw err;
  }
  return profile;
};

const updateProfile = (userId, data) => businessRepository.upsertProfile(userId, data);

const createShipment = (businessId, data) => shipmentRepository.create({ ...data, business: businessId });

const listShipments = (businessId) => shipmentRepository.findByBusiness(businessId);

const updateShipment = async (shipmentId, businessId, data) => {
  const shipment = await shipmentRepository.findById(shipmentId);
  if (!shipment) {
    const err = new Error("Shipment not found");
    err.statusCode = 404;
    throw err;
  }
  if (shipment.business.toString() !== businessId.toString()) {
    const err = new Error("Not authorized to modify this shipment");
    err.statusCode = 403;
    throw err;
  }
  return shipmentRepository.updateById(shipmentId, data);
};

const cancelShipment = async (shipmentId, businessId) => {
  const shipment = await shipmentRepository.findById(shipmentId);
  if (!shipment) {
    const err = new Error("Shipment not found");
    err.statusCode = 404;
    throw err;
  }
  if (shipment.business.toString() !== businessId.toString()) {
    const err = new Error("Not authorized to cancel this shipment");
    err.statusCode = 403;
    throw err;
  }
  return shipmentRepository.updateById(shipmentId, { status: "cancelled" });
};

module.exports = { getProfile, updateProfile, createShipment, listShipments, updateShipment, cancelShipment };