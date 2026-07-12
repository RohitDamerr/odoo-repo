const Joi = require('joi');

const createTripSchema = Joi.object({
    source: Joi.string().trim().required().messages({
        'string.empty': 'Source is required',
        'any.required': 'Source is required'
    }),
    destination: Joi.string().trim().required().messages({
        'string.empty': 'Destination is required',
        'any.required': 'Destination is required'
    }),
    vehicle: Joi.string().required().messages({
        'string.empty': 'Vehicle ID is required',
        'any.required': 'Vehicle ID is required'
    }),
    driver: Joi.string().required().messages({
        'string.empty': 'Driver ID is required',
        'any.required': 'Driver ID is required'
    }),
    cargoWeight: Joi.number().min(0).required().messages({
        'number.base': 'Cargo weight must be a number',
        'number.min': 'Cargo weight cannot be negative',
        'any.required': 'Cargo weight is required'
    }),
    plannedDistance: Joi.number().min(0).required().messages({
        'number.base': 'Planned distance must be a number',
        'number.min': 'Planned distance cannot be negative',
        'any.required': 'Planned distance is required'
    }),
    revenue: Joi.number().min(0).default(0)
});

const updateTripSchema = Joi.object({
    source: Joi.string().trim(),
    destination: Joi.string().trim(),
    vehicle: Joi.string(),
    driver: Joi.string(),
    cargoWeight: Joi.number().min(0),
    plannedDistance: Joi.number().min(0),
    revenue: Joi.number().min(0)
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

const completeTripSchema = Joi.object({
    actualOdometer: Joi.number().min(0).required().messages({
        'number.base': 'Actual odometer reading must be a number',
        'number.min': 'Actual odometer reading cannot be negative',
        'any.required': 'Actual odometer reading is required'
    }),
    fuelConsumed: Joi.number().min(0).default(null)
});

module.exports = { createTripSchema, updateTripSchema, completeTripSchema };
