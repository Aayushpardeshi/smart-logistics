const driverRepository = require("../repositories/driverRepository");
const truckRepository = require("../repositories/truckRepository");
const loadRepository = require("../repositories/loadRepository");
const bidRepository = require("../repositories/bidRepository");
const tripRepository = require("../repositories/tripRepository");
const docVerifyClient = require("./docVerifyClient");
const fs = require("fs");

const getProfile = async (userId) => {
  const profile = await driverRepository.findByUser(userId);
  if (!profile) {
    const err = new Error("Driver profile not found");
    err.statusCode = 404;
    throw err;
  }
  return profile;
};

const updateProfile = (userId, data) => driverRepository.upsertProfile(userId, data);

const addTruck = (driverId, data) => truckRepository.create({ ...data, driver: driverId });

const listTrucks = (driverId) => truckRepository.findByDriver(driverId);

const updateTruck = async (truckId, driverId, data) => {
  const truck = await truckRepository.findById(truckId);
  if (!truck) {
    const err = new Error("Truck not found");
    err.statusCode = 404;
    throw err;
  }
  if (truck.driver.toString() !== driverId.toString()) {
    const err = new Error("Not authorized to modify this truck");
    err.statusCode = 403;
    throw err;
  }
  return truckRepository.updateById(truckId, data);
};

const deleteTruck = async (truckId, driverId) => {
  const truck = await truckRepository.findById(truckId);
  if (!truck) {
    const err = new Error("Truck not found");
    err.statusCode = 404;
    throw err;
  }
  if (truck.driver.toString() !== driverId.toString()) {
    const err = new Error("Not authorized to delete this truck");
    err.statusCode = 403;
    throw err;
  }
  return truckRepository.deleteById(truckId);
};

const verifyLicense = async (userId, frontPath, backPath) => {
  const result = await docVerifyClient.verifyDrivingLicenseCombined(frontPath, backPath);
  fs.unlink(frontPath, () => {});
  fs.unlink(backPath, () => {});
  const verificationStatus = result?.data?.is_valid ? "verified" : "rejected";
  await driverRepository.upsertProfile(userId, {
    licenseNumber: result?.data?.license_number || undefined,
    verificationStatus,
  });
  return result;
};

const verifyAadhaar = async (userId, frontPath, backPath) => {
  const result = await docVerifyClient.verifyAadhaar(frontPath, backPath);
  fs.unlink(frontPath, () => {});
  fs.unlink(backPath, () => {});
  return result;
};

const searchLoads = (filters) => loadRepository.findOpenLoads(filters);

const placeBid = async (driverId, loadId, data) => {
  const load = await loadRepository.findById(loadId);
  if (!load || load.status !== "OPEN") {
    const err = new Error("Load is not open for bidding");
    err.statusCode = 400;
    throw err;
  }
  return bidRepository.create({ ...data, driverId, loadId });
};

const listMyBids = (driverId) => bidRepository.findByDriver(driverId);

const verifyTruckRC = async (truckId, driverId, filePath) => {
  const truck = await truckRepository.findById(truckId);
  if (!truck || truck.driver.toString() !== driverId.toString()) {
    fs.unlink(filePath, () => {});
    const err = new Error("Not authorized to verify this truck");
    err.statusCode = 403;
    throw err;
  }
  const result = await docVerifyClient.verifyRC(filePath);
  fs.unlink(filePath, () => {});

  const rcStatus = result?.fraud_status === "clean" ? "verified" : "rejected";
  await truckRepository.updateById(truckId, {
    rcStatus,
    rcDetails: result?.rc_fields
  });
  return result;
};

const verifyTruckPUC = async (truckId, driverId, filePath) => {
  const truck = await truckRepository.findById(truckId);
  if (!truck || truck.driver.toString() !== driverId.toString()) {
    fs.unlink(filePath, () => {});
    const err = new Error("Not authorized to verify this truck");
    err.statusCode = 403;
    throw err;
  }
  const result = await docVerifyClient.verifyPUC(filePath);
  fs.unlink(filePath, () => {});

  const pucStatus = result?.fraud_status === "clean" ? "verified" : "rejected";
  await truckRepository.updateById(truckId, {
    pucStatus,
    pucDetails: result?.puc_fields
  });
  return result;
};

const listMyTrips = (driverId) => tripRepository.findByDriver(driverId);

const getTripDetails = async (tripId, driverId) => {
  const trip = await tripRepository.findById(tripId).populate("loadId").populate("businessId", "name phone companyName");
  if (!trip || trip.driverId.toString() !== driverId.toString()) {
    const err = new Error("Trip not found or unauthorized");
    err.statusCode = 404;
    throw err;
  }
  return trip;
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
  listMyTrips,
  getTripDetails,
};