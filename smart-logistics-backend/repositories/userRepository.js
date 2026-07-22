const User = require("../models/User");

const findByEmail = (email) => User.findOne({ email });
const createUser = (data) => User.create(data);
const findById = (id) => User.findById(id).select("-password");

module.exports = { findByEmail, createUser, findById };