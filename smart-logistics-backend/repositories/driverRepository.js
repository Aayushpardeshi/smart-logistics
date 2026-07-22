const DriverProfile = require("../models/DriverProfile");

const findByUser = (userId) => DriverProfile.findOne({ user: userId });
const upsertProfile = (userId, data) =>
  DriverProfile.findOneAndUpdate({ user: userId }, { $set: data }, { new: true, upsert: true });

module.exports = { findByUser, upsertProfile };