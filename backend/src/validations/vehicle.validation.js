const Joi = require('joi');

const VEHICLE_TYPES = ['Truck', 'Van', 'Pickup', 'Trailer', 'Bus', 'Car', 'Other'];
const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];

/**
 * Create a new vehicle.
 */
const createVehicleSchema = Joi.object({
    registrationNumber: Joi.string().trim().uppercase().required().messages({
        'string.empty': 'Registration number is required',
        'any.required': 'Registration number is required'
    }),

    name: Joi.string().trim().required().messages({
        'string.empty': 'Vehicle name/model is required',
        'any.required': 'Vehicle name/model is required'
    }),

    type: Joi.string().valid(...VEHICLE_TYPES).required().messages({
        'any.only': `Type must be one of: ${VEHICLE_TYPES.join(', ')}`,
        'any.required': 'Vehicle type is required'
    }),

    maxLoadCapacity: Joi.number().min(0).required().messages({
        'number.min': 'Max load capacity cannot be negative',
        'any.required': 'Maximum load capacity is required'
    }),

    odometer: Joi.number().min(0).default(0).messages({
        'number.min': 'Odometer cannot be negative'
    }),

    acquisitionCost: Joi.number().min(0).required().messages({
        'number.min': 'Acquisition cost cannot be negative',
        'any.required': 'Acquisition cost is required'
    }),

    status: Joi.string().valid(...VEHICLE_STATUSES).default('Available').messages({
        'any.only': `Status must be one of: ${VEHICLE_STATUSES.join(', ')}`
    })
});

/**
 * Update an existing vehicle (all fields optional).
 */
const updateVehicleSchema = Joi.object({
    registrationNumber: Joi.string().trim().uppercase().messages({
        'string.empty': 'Registration number cannot be empty'
    }),

    name: Joi.string().trim().messages({
        'string.empty': 'Vehicle name/model cannot be empty'
    }),

    type: Joi.string().valid(...VEHICLE_TYPES).messages({
        'any.only': `Type must be one of: ${VEHICLE_TYPES.join(', ')}`
    }),

    maxLoadCapacity: Joi.number().min(0).messages({
        'number.min': 'Max load capacity cannot be negative'
    }),

    odometer: Joi.number().min(0).messages({
        'number.min': 'Odometer cannot be negative'
    }),

    acquisitionCost: Joi.number().min(0).messages({
        'number.min': 'Acquisition cost cannot be negative'
    }),

    status: Joi.string().valid(...VEHICLE_STATUSES).messages({
        'any.only': `Status must be one of: ${VEHICLE_STATUSES.join(', ')}`
    })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

/**
 * Update only the vehicle status.
 */
const updateStatusSchema = Joi.object({
    status: Joi.string().valid(...VEHICLE_STATUSES).required().messages({
        'any.only': `Status must be one of: ${VEHICLE_STATUSES.join(', ')}`,
        'any.required': 'Status is required'
    })
});

/**
 * Query parameters for listing vehicles.
 */
const listVehiclesQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('name', 'registrationNumber', 'type', 'status', 'odometer', 'acquisitionCost', 'createdAt', '-name', '-registrationNumber', '-type', '-status', '-odometer', '-acquisitionCost', '-createdAt').default('-createdAt'),
    status: Joi.string().valid(...VEHICLE_STATUSES),
    type: Joi.string().valid(...VEHICLE_TYPES),
    search: Joi.string().trim().max(100)
});

module.exports = {
    createVehicleSchema,
    updateVehicleSchema,
    updateStatusSchema,
    listVehiclesQuerySchema
};
