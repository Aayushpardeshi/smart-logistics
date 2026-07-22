const driverService = require("../services/driverService");
const { profileSchema, truckSchema } = require("../validators/driverValidator");

const getProfile = async (req, res) => {
  const profile = await driverService.getProfile(req.user._id);
  res.json({ success: true, data: profile });
};

const updateProfile = async (req, res) => {
  const { error, value } = profileSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }
  const profile = await driverService.updateProfile(req.user._id, value);
  res.json({ success: true, data: profile });
};

const addTruck = async (req, res) => {
  const { error, value } = truckSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }
  const truck = await driverService.addTruck(req.user._id, value);
  res.status(201).json({ success: true, data: truck });
};

const listTrucks = async (req, res) => {
  const trucks = await driverService.listTrucks(req.user._id);
  res.json({ success: true, data: trucks });
};

const updateTruck = async (req, res) => {
  const truck = await driverService.updateTruck(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: truck });
};

const deleteTruck = async (req, res) => {
  await driverService.deleteTruck(req.params.id, req.user._id);
  res.json({ success: true, message: "Truck deleted" });
};

const verifyLicense = async (req, res) => {
  if (!req.files?.front || !req.files?.back) {
    res.status(400);
    throw new Error("Both front and back license images are required");
  }
  const result = await driverService.verifyLicense(
    req.user._id,
    req.files.front[0].path,
    req.files.back[0].path
  );
  res.json({ success: true, data: result });
};

const verifyAadhaar = async (req, res) => {
  if (!req.files?.front || !req.files?.back) {
    res.status(400);
    throw new Error("Both Aadhaar front and back images are required");
  }
  const result = await driverService.verifyAadhaar(
    req.user._id,
    req.files.front[0].path,
    req.files.back[0].path
  );
  res.json({ success: true, data: result });
};

module.exports = {
  getProfile,
  updateProfile,
  addTruck,
  listTrucks,
  updateTruck,
  deleteTruck,
  verifyLicense,
  verifyAadhaar,
};