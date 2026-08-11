const businessRepository = require("../repositories/businessRepository");
const loadRepository = require("../repositories/loadRepository");
const bidRepository = require("../repositories/bidRepository");
const tripRepository = require("../repositories/tripRepository");

const locationHistoryRepository = require("../repositories/locationHistoryRepository");

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

const createLoad = (businessId, data) => loadRepository.create({ ...data, businessId });

const listLoads = (businessId) => loadRepository.findByBusiness(businessId);

const updateLoad = async (loadId, businessId, data) => {
  const load = await loadRepository.findById(loadId);
  if (!load) {
    const err = new Error("Load not found");
    err.statusCode = 404;
    throw err;
  }
  if (load.businessId.toString() !== businessId.toString()) {
    const err = new Error("Not authorized to modify this load");
    err.statusCode = 403;
    throw err;
  }
  return loadRepository.updateById(loadId, data);
};

const cancelLoad = async (loadId, businessId) => {
  const load = await loadRepository.findById(loadId);
  if (!load) {
    const err = new Error("Load not found");
    err.statusCode = 404;
    throw err;
  }
  if (load.businessId.toString() !== businessId.toString()) {
    const err = new Error("Not authorized to cancel this load");
    err.statusCode = 403;
    throw err;
  }
  return loadRepository.updateById(loadId, { status: "CANCELLED" });
};

const listLoadBids = async (loadId, businessId) => {
  const load = await loadRepository.findById(loadId);
  if (!load || load.businessId.toString() !== businessId.toString()) {
    const err = new Error("Not authorized to view bids for this load");
    err.statusCode = 403;
    throw err;
  }
  return bidRepository.findByLoad(loadId);
};

const acceptBid = async (bidId, businessId) => {
  const bid = await bidRepository.findById(bidId);
  if (!bid) {
    const err = new Error("Bid not found");
    err.statusCode = 404;
    throw err;
  }
  const load = await loadRepository.findById(bid.loadId);
  if (!load || load.businessId.toString() !== businessId.toString()) {
    const err = new Error("Not authorized to accept bids for this load");
    err.statusCode = 403;
    throw err;
  }
  if (load.status !== "OPEN") {
    const err = new Error("Load is no longer open");
    err.statusCode = 400;
    throw err;
  }

  await bidRepository.updateStatus(bidId, "ACCEPTED");
  await bidRepository.rejectOtherBids(load._id, bidId);
  
  await loadRepository.updateById(load._id, { status: "ASSIGNED" });

  const trip = await tripRepository.create({
    loadId: load._id,
    bidId: bid._id,
    driverId: bid.driverId,
    businessId: load.businessId,
    source: load.source,
    destination: load.destination,
    status: "ASSIGNED"
  });

  return trip;
};

const rejectBid = async (bidId, businessId) => {
  const bid = await bidRepository.findById(bidId);
  if (!bid) {
    const err = new Error("Bid not found");
    err.statusCode = 404;
    throw err;
  }
  const load = await loadRepository.findById(bid.loadId);
  if (!load || load.businessId.toString() !== businessId.toString()) {
    const err = new Error("Not authorized to reject this bid");
    err.statusCode = 403;
    throw err;
  }
  
  return bidRepository.updateStatus(bidId, "REJECTED");
};

const listMyTrips = (businessId) => tripRepository.findByBusiness(businessId);

const getTripDetails = async (tripId, businessId) => {
  const trip = await tripRepository.findById(tripId).populate("loadId").populate("driverId", "name phone");
  if (!trip || trip.businessId.toString() !== businessId.toString()) {
    const err = new Error("Trip not found or unauthorized");
    err.statusCode = 404;
    throw err;
  }
  return trip;
};

const getTripLocationHistory = async (tripId, businessId) => {
  await getTripDetails(tripId, businessId);
  return locationHistoryRepository.findByTrip(tripId);
};

module.exports = { 
  getProfile, updateProfile, createLoad, listLoads, updateLoad, cancelLoad, 
  listLoadBids, acceptBid, rejectBid, listMyTrips, getTripDetails, getTripLocationHistory
};