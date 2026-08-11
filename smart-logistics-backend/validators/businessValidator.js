const Joi = require("joi");

const profileSchema = Joi.object({
  companyName: Joi.string().min(2).required(),
  gstNumber: Joi.string().allow("").optional(),
  address: Joi.string().allow("").optional(),
  city: Joi.string().allow("").optional(),
  state: Joi.string().allow("").optional(),
});

const locationSchema = Joi.object({
  address: Joi.string().required(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
});

const loadSchema = Joi.object({
  source: locationSchema.required(),
  destination: locationSchema.required(),
  cargoType: Joi.string().required(),
  cargoWeight: Joi.number().positive().required(),
  vehicleType: Joi.string().required(),
  pickupDate: Joi.date().iso().required(),
  deliveryDate: Joi.date().iso().required(),
  budget: Joi.number().positive().required(),
  description: Joi.string().allow("").optional(),
});

module.exports = { profileSchema, loadSchema };