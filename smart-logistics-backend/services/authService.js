const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/userRepository");
const generateToken = require("../utils/generateToken");

const register = async ({ name, email, password, role, phone }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    const err = new Error("Email already registered");
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepository.createUser({ name, email, password: hashedPassword, role, phone });

  const token = generateToken(user._id, user.role);
  return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token };
};

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user._id, user.role);
  return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token };
};

module.exports = { register, login };