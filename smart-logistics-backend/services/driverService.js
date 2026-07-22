const driverRepository = require("../repositories/driverRepository");
const truckRepository = require("../repositories/truckRepository");
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