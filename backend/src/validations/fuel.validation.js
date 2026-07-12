const Joi = require('joi');

const createFuelSchema = Joi.object({
    vehicle: Joi.string().required().messages({
        'string.empty': 'Vehicle ID is required',
        'any.required': 'Vehicle ID is required'
    }),
    trip: Joi.string().allow(null).default(null),
    liters: Joi.number().min(0).required().messages({
        'number.base': 'Fuel quantity (liters) must be a number',
        'number.min': 'Fuel quantity cannot be negative',
        'any.required': 'Fuel quantity is required'
    }),
    cost: Joi.number().min(0).required().messages({
        'number.base': 'Fuel cost must be a number',
        'number.min': 'Fuel cost cannot be negative',
        'any.required': 'Fuel cost is required'
    }),
    odometer: Joi.number().min(0).allow(null).default(null),
    date: Joi.date().iso().default(() => new Date())
});

const updateFuelSchema = Joi.object({
    vehicle: Joi.string(),
    trip: Joi.string().allow(null),
    liters: Joi.number().min(0),
    cost: Joi.number().min(0),
    odometer: Joi.number().min(0).allow(null),
    date: Joi.date().iso()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

module.exports = { createFuelSchema, updateFuelSchema };
