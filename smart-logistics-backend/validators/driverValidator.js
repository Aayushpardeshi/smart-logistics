const Joi = require("joi");

const profileSchema = Joi.object({
  licenseNumber: Joi.string().allow("").optional(),
  address: Joi.string().allow("").optional(),
  city: Joi.string().allow("").optional(),
  state: Joi.string().allow("").optional(),
});

const truckSchema = Joi.object({
  truckNumber: Joi.string().required(),
  truckType: Joi.string().valid("mini", "medium", "heavy", "trailer").required(),
  capacityTons: Joi.number().positive().required(),
});

const bidSchema = Joi.object({
  amount: Joi.number().positive().required(),
  estimatedDelivery: Joi.date().iso().required(),
  message: Joi.string().allow("").optional(),
});

module.exports = { profileSchema, truckSchema, bidSchema };