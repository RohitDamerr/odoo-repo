const Joi = require('joi');

const MAINTENANCE_TYPES = [
    'Oil Change',
    'Tire Replacement',
    'Engine Repair',
    'Brake Service',
    'General Service',
    'Inspection',
    'Other'
];

/**
 * Create a new maintenance log (opens a maintenance job).
 */
const createMaintenanceSchema = Joi.object({
    vehicle: Joi.string().required().messages({
        'string.empty': 'Vehicle ID is required',
        'any.required': 'Vehicle ID is required'
    }),

    description: Joi.string().trim().required().messages({
        'string.empty': 'Description is required',
        'any.required': 'Description is required'
    }),

    type: Joi.string().valid(...MAINTENANCE_TYPES).required().messages({
        'any.only': `Type must be one of: ${MAINTENANCE_TYPES.join(', ')}`,
        'any.required': 'Maintenance type is required'
    }),

    cost: Joi.number().min(0).default(0).messages({
        'number.min': 'Cost cannot be negative'
    }),

    startDate: Joi.date().default(() => new Date()),

    notes: Joi.string().trim().allow('', null)
});

/**
 * Update an existing maintenance log (Active logs only for most fields).
 */
const updateMaintenanceSchema = Joi.object({
    description: Joi.string().trim().messages({
        'string.empty': 'Description cannot be empty'
    }),

    type: Joi.string().valid(...MAINTENANCE_TYPES).messages({
        'any.only': `Type must be one of: ${MAINTENANCE_TYPES.join(', ')}`
    }),

    cost: Joi.number().min(0).messages({
        'number.min': 'Cost cannot be negative'
    }),

    startDate: Joi.date(),

    endDate: Joi.date(),

    notes: Joi.string().trim().allow('', null)
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

/**
 * Close a maintenance log (complete the job).
 * Optionally set the final cost.
 */
const closeMaintenanceSchema = Joi.object({
    cost: Joi.number().min(0).messages({
        'number.min': 'Cost cannot be negative'
    }),

    notes: Joi.string().trim().allow('', null)
});

/**
 * Query parameters for listing maintenance logs.
 */
const listMaintenanceQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('startDate', '-startDate', 'cost', '-cost', 'createdAt', '-createdAt').default('-createdAt'),
    status: Joi.string().valid('Active', 'Closed'),
    type: Joi.string().valid(...MAINTENANCE_TYPES),
    vehicle: Joi.string() // filter by vehicle ID
});

module.exports = {
    createMaintenanceSchema,
    updateMaintenanceSchema,
    closeMaintenanceSchema,
    listMaintenanceQuerySchema
};
