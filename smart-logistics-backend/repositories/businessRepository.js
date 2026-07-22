const BusinessProfile = require("../models/BusinessProfile");

const findByUser = (userId) => BusinessProfile.findOne({ user: userId });
const upsertProfile = (userId, data) =>
  BusinessProfile.findOneAndUpdate({ user: userId }, { $set: data }, { new: true, upsert: true });

module.exports = { findByUser, upsertProfile };