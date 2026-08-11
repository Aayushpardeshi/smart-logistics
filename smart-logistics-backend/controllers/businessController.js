const businessService = require("../services/businessService");
const { profileSchema, loadSchema } = require("../validators/businessValidator");

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

const createLoad = async (req, res) => {
  const { error, value } = loadSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }
  const load = await businessService.createLoad(req.user._id, value);
  res.status(201).json({ success: true, data: load });
};

const listLoads = async (req, res) => {
  const loads = await businessService.listLoads(req.user._id);
  res.json({ success: true, data: loads });
};

const updateLoad = async (req, res) => {
  const load = await businessService.updateLoad(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: load });
};

const cancelLoad = async (req, res) => {
  const load = await businessService.cancelLoad(req.params.id, req.user._id);
  res.json({ success: true, data: load });
};

const listLoadBids = async (req, res) => {
  const bids = await businessService.listLoadBids(req.params.loadId, req.user._id);
  res.json({ success: true, data: bids });
};

const acceptBid = async (req, res) => {
  const trip = await businessService.acceptBid(req.params.bidId, req.user._id);
  res.json({ success: true, data: trip, message: "Bid accepted and Trip assigned." });
};

const rejectBid = async (req, res) => {
  const bid = await businessService.rejectBid(req.params.bidId, req.user._id);
  res.json({ success: true, data: bid, message: "Bid rejected." });
};

const listMyTrips = async (req, res) => {
  const trips = await businessService.listMyTrips(req.user._id);
  res.json({ success: true, data: trips });
};

const getTripDetails = async (req, res) => {
  const trip = await businessService.getTripDetails(req.params.id, req.user._id);
  res.json({ success: true, data: trip });
};

const getTripLocationHistory = async (req, res) => {
  const history = await businessService.getTripLocationHistory(req.params.id, req.user._id);
  res.json({ success: true, data: history });
};

module.exports = { 
  getProfile, updateProfile, createLoad, listLoads, updateLoad, cancelLoad,
  listLoadBids, acceptBid, rejectBid, listMyTrips, getTripDetails, getTripLocationHistory
};