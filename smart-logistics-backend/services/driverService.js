const driverRepository = require("../repositories/driverRepository");
const truckRepository = require("../repositories/truckRepository");
const loadRepository = require("../repositories/loadRepository");
const bidRepository = require("../repositories/bidRepository");
const tripRepository = require("../repositories/tripRepository");
const docVerifyClient = require("./docVerifyClient");
const fs = require("fs");

const User = require("../models/User");

const getProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");
  let profile = await driverRepository.findByUser(userId);
  if (!profile) {
    profile = await driverRepository.upsertProfile(userId, {});
  }
  return {
    ...profile.toObject(),
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "driver"
  };
};

const updateProfile = async (userId, data) => {
  const { name, phone, ...profileData } = data;
  if (name || phone) {
    const userUpdate = {};
    if (name) userUpdate.name = name.trim();
    if (phone) userUpdate.phone = phone.trim();
    await User.findByIdAndUpdate(userId, { $set: userUpdate });
  }
  const updatedProfile = await driverRepository.upsertProfile(userId, profileData);
  const updatedUser = await User.findById(userId).select("-password");
  return {
    ...updatedProfile.toObject(),
    name: updatedUser?.name || "",
    email: updatedUser?.email || "",
    phone: updatedUser?.phone || "",
    role: updatedUser?.role || "driver"
  };
};

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

const crypto = require("crypto");
const DocumentStore = require("../models/DocumentStore");
const logger = require("../utils/logger");

const saveDocumentToDb = async (userId, docType, fileObj, truckId = null) => {
  if (!fileObj || !fileObj.buffer) return null;

  // Calculate SHA-256 hash of file buffer for de-duplication
  const fileHash = crypto.createHash("sha256").update(fileObj.buffer).digest("hex");

  // Check if duplicate document already exists in DB for this user
  let existingDoc = await DocumentStore.findOne({ user: userId, docType, fileHash });
  if (existingDoc) {
    logger.info(`Duplicate document detected (Hash: ${fileHash.substring(0, 10)}...). Reusing existing document ID.`);
    return existingDoc;
  }

  // Create Base64 Data URL to store directly in MongoDB (no local uploads folder!)
  const dataUrl = `data:${fileObj.mimetype};base64,${fileObj.buffer.toString("base64")}`;

  const newDoc = await DocumentStore.create({
    user: userId,
    docType,
    truck: truckId,
    filename: fileObj.originalname,
    contentType: fileObj.mimetype,
    dataUrl,
    fileHash,
    fileSize: fileObj.size,
  });

  return newDoc;
};

const verifyLicense = async (userId, frontObj, backObj) => {
  const frontDoc = await saveDocumentToDb(userId, "license_front", frontObj);
  const backDoc = await saveDocumentToDb(userId, "license_back", backObj);

  const result = await docVerifyClient.verifyDrivingLicenseCombined(frontObj, backObj);
  const verificationStatus = result?.fraud_status === "clean" ? "verified" : (result?.front?.licence_number ? "verified" : "rejected");
  
  await driverRepository.upsertProfile(userId, {
    licenseNumber: result?.front?.licence_number || result?.data?.license_number || undefined,
    licenseDocUrl: frontDoc?.dataUrl,
    verificationStatus,
    licenseDetails: { front: result?.front, back: result?.back }
  });
  return result;
};

const verifyAadhaar = async (userId, frontObj, backObj) => {
  const frontDoc = await saveDocumentToDb(userId, "aadhaar_front", frontObj);
  const backDoc = await saveDocumentToDb(userId, "aadhaar_back", backObj);

  const result = await docVerifyClient.verifyAadhaar(frontObj, backObj);
  const extractedNum = result?.front?.aadhaar_number || result?.back?.aadhaar_number;
  const aadhaarStatus = (result?.fraud_status === "clean" || extractedNum || result?.front?.name) ? "verified" : "rejected";
  
  await driverRepository.upsertProfile(userId, {
    aadhaarNumber: extractedNum || undefined,
    aadhaarDocUrl: frontDoc?.dataUrl,
    aadhaarStatus,
    aadhaarDetails: { front: result?.front, back: result?.back }
  });
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

const verifyTruckRC = async (truckId, driverId, fileObj) => {
  const truck = await truckRepository.findById(truckId);
  if (!truck || truck.driver.toString() !== driverId.toString()) {
    const err = new Error("Not authorized to verify this truck");
    err.statusCode = 403;
    throw err;
  }
  
  const rcDoc = await saveDocumentToDb(driverId, "rc", fileObj, truckId);
  const result = await docVerifyClient.verifyRC(fileObj);

  const rcStatus = result?.fraud_status === "clean" ? "verified" : "rejected";
  await truckRepository.updateById(truckId, {
    rcDocUrl: rcDoc?.dataUrl,
    rcStatus,
    rcDetails: result?.rc_fields
  });
  return result;
};

const verifyTruckPUC = async (truckId, driverId, fileObj) => {
  const truck = await truckRepository.findById(truckId);
  if (!truck || truck.driver.toString() !== driverId.toString()) {
    const err = new Error("Not authorized to verify this truck");
    err.statusCode = 403;
    throw err;
  }

  const pucDoc = await saveDocumentToDb(driverId, "puc", fileObj, truckId);

  // Bypass OCR for complex document
  const pucStatus = "uploaded";
  await truckRepository.updateById(truckId, {
    pucDocUrl: pucDoc?.dataUrl,
    pucStatus,
    pucDetails: { note: "Manual verification pending" }
  });
  return { success: true, message: "PUC document uploaded successfully" };
};

const verifyTruckInsurance = async (truckId, driverId, fileObj) => {
  const truck = await truckRepository.findById(truckId);
  if (!truck || truck.driver.toString() !== driverId.toString()) {
    const err = new Error("Not authorized to verify this truck");
    err.statusCode = 403;
    throw err;
  }

  const insuranceDoc = await saveDocumentToDb(driverId, "insurance", fileObj, truckId);

  // Bypass OCR for complex document
  const insuranceStatus = "uploaded";
  await truckRepository.updateById(truckId, {
    insuranceDocUrl: insuranceDoc?.dataUrl,
    insuranceStatus,
    insuranceDetails: { note: "Manual verification pending" }
  });
  return { success: true, message: "Insurance document uploaded successfully" };
};

const verifyTruckPermit = async (truckId, driverId, fileObj) => {
  const truck = await truckRepository.findById(truckId);
  if (!truck || truck.driver.toString() !== driverId.toString()) {
    const err = new Error("Not authorized to verify this truck");
    err.statusCode = 403;
    throw err;
  }

  const permitDoc = await saveDocumentToDb(driverId, "permit", fileObj, truckId);

  // Bypass OCR for complex document
  const permitStatus = "uploaded";
  await truckRepository.updateById(truckId, {
    permitDocUrl: permitDoc?.dataUrl,
    permitStatus,
    permitDetails: { note: "Manual verification pending" }
  });
  return { success: true, message: "Permit document uploaded successfully" };
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
  verifyTruckInsurance,
  verifyTruckPermit,
  listMyTrips,
  getTripDetails,
};