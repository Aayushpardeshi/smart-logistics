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

const shipmentSchema = Joi.object({
  goodsType: Joi.string().required(),
  weightTons: Joi.number().positive().required(),
  pickupLocation: locationSchema.required(),
  dropLocation: locationSchema.required(),
  priceOffered: Joi.number().positive().optional(),
});

module.exports = { profileSchema, shipmentSchema };