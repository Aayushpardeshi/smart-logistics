const businessService = require("../services/businessService");
const { profileSchema, shipmentSchema } = require("../validators/businessValidator");

const getProfile = async (req, res) => {
  const profile = await businessService.getProfile(req.user._id);
  res.json({ success: true, data: profile });
};

const updateProfile = async (req, res) => {
  const { error, value } = profileSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }
  const profile = await businessService.updateProfile(req.user._id, value);
  res.json({ success: true, data: profile });
};

const createShipment = async (req, res) => {
  const { error, value } = shipmentSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }
  const shipment = await businessService.createShipment(req.user._id, value);
  res.status(201).json({ success: true, data: shipment });
};

const listShipments = async (req, res) => {
  const shipments = await businessService.listShipments(req.user._id);
  res.json({ success: true, data: shipments });
};

const updateShipment = async (req, res) => {
  const shipment = await businessService.updateShipment(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: shipment });
};

const cancelShipment = async (req, res) => {
  const shipment = await businessService.cancelShipment(req.params.id, req.user._id);
  res.json({ success: true, data: shipment });
};

module.exports = { getProfile, updateProfile, createShipment, listShipments, updateShipment, cancelShipment };