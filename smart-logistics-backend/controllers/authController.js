const authService = require("../services/authService");
const { registerSchema, loginSchema } = require("../validators/authValidator");

const register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const result = await authService.register(value);
  res.status(201).json({ success: true, data: result });
};

const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const result = await authService.login(value);
  res.status(200).json({ success: true, data: result });
};

module.exports = { register, login };