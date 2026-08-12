const driverService = require("../services/driverService");
const { profileSchema, truckSchema, bidSchema } = require("../validators/driverValidator");

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
    req.files.front[0],
    req.files.back[0]
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
    req.files.front[0],
    req.files.back[0]
  );
  res.json({ success: true, data: result });
};

const searchLoads = async (req, res) => {
  const loads = await driverService.searchLoads(req.query);
  res.json({ success: true, data: loads });
};

const placeBid = async (req, res) => {
  const { error, value } = bidSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }
  try {
    const bid = await driverService.placeBid(req.user._id, req.params.loadId, value);
    res.status(201).json({ success: true, data: bid });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      throw new Error("You have already placed a bid on this load.");
    }
    throw err;
  }
};

const listMyBids = async (req, res) => {
  const bids = await driverService.listMyBids(req.user._id);
  res.json({ success: true, data: bids });
};

const verifyTruckRC = async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("RC image is required");
  }
  const result = await driverService.verifyTruckRC(req.params.id, req.user._id, req.file);
  res.json({ success: true, data: result });
};

const verifyTruckPUC = async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("PUC image is required");
  }
  const result = await driverService.verifyTruckPUC(req.params.id, req.user._id, req.file);
  res.json({ success: true, data: result });
};

const verifyTruckInsurance = async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Insurance document image is required");
  }
  const result = await driverService.verifyTruckInsurance(req.params.id, req.user._id, req.file);
  res.json({ success: true, data: result });
};

const verifyTruckPermit = async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Permit document image is required");
  }
  const result = await driverService.verifyTruckPermit(req.params.id, req.user._id, req.file);
  res.json({ success: true, data: result });
};

const listMyTrips = async (req, res) => {
  const trips = await driverService.listMyTrips(req.user._id);
  res.json({ success: true, data: trips });
};

const getTripDetails = async (req, res) => {
  const trip = await driverService.getTripDetails(req.params.id, req.user._id);
  res.json({ success: true, data: trip });
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
  searchLoads,
  placeBid,
  listMyBids,
  verifyTruckRC,
  verifyTruckPUC,
  verifyTruckInsurance,
  verifyTruckPermit,
  listMyTrips,
  getTripDetails,
};