const Joi = require('joi');

/**
 * Schema for logging a fuel transaction.
 */
const createFuelSchema = Joi.object({
    vehicle: Joi.string().required().messages({
        'string.empty': 'Vehicle ID is required',
        'any.required': 'Vehicle ID is required'
    }),

    trip: Joi.string().allow(null).default(null).messages({
        'string.empty': 'Trip ID must be a valid ObjectId or null'
    }),

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

    odometer: Joi.number().min(0).allow(null).default(null).messages({
        'number.base': 'Odometer reading must be a number',
        'number.min': 'Odometer reading cannot be negative'
    }),

    date: Joi.date().iso().default(() => new Date()).messages({
        'date.base': 'Date must be a valid date',
        'date.format': 'Date must be in ISO format'
    })
});

/**
 * Schema for updating a fuel transaction.
 */
const updateFuelSchema = Joi.object({
    vehicle: Joi.string(),

    trip: Joi.string().allow(null),

    liters: Joi.number().min(0).messages({
        'number.base': 'Fuel quantity (liters) must be a number',
        'number.min': 'Fuel quantity cannot be negative'
    }),

    cost: Joi.number().min(0).messages({
        'number.base': 'Fuel cost must be a number',
        'number.min': 'Fuel cost cannot be negative'
    }),

    odometer: Joi.number().min(0).allow(null).messages({
        'number.base': 'Odometer reading must be a number',
        'number.min': 'Odometer reading cannot be negative'
    }),

    date: Joi.date().iso().messages({
        'date.base': 'Date must be a valid date',
        'date.format': 'Date must be in ISO format'
    })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

module.exports = {
    createFuelSchema,
    updateFuelSchema
};
