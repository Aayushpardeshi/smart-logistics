const LocationHistory = require("../models/LocationHistory");

const findByTrip = (tripId) => LocationHistory.find({ trip: tripId }).sort({ timestamp: 1 });

module.exports = { findByTrip };
