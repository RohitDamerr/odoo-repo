const Joi = require('joi');

/**
 * Schema for creating a new driver.
 *
 * Status is NOT included — it always defaults to 'Available' on creation.
 */
const createDriverSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Driver name is required',
        'string.min': 'Driver name must be at least 2 characters',
        'string.max': 'Driver name must not exceed 100 characters',
        'any.required': 'Driver name is required'
    }),

    licenseNumber: Joi.string().trim().required().messages({
        'string.empty': 'License number is required',
        'any.required': 'License number is required'
    }),

    licenseCategory: Joi.string().trim().required().messages({
        'string.empty': 'License category is required',
        'any.required': 'License category is required'
    }),

    licenseExpiryDate: Joi.date().iso().required().messages({
        'date.base': 'License expiry date must be a valid date',
        'date.format': 'License expiry date must be in ISO format (YYYY-MM-DD)',
        'any.required': 'License expiry date is required'
    }),

    contactNumber: Joi.string().trim().min(7).max(15).required().messages({
        'string.empty': 'Contact number is required',
        'string.min': 'Contact number must be at least 7 digits',
        'string.max': 'Contact number must not exceed 15 digits',
        'any.required': 'Contact number is required'
    }),

    safetyScore: Joi.number().integer().min(0).max(100).default(100).messages({
        'number.base': 'Safety score must be a number',
        'number.min': 'Safety score must be between 0 and 100',
        'number.max': 'Safety score must be between 0 and 100'
    })
});

/**
 * Schema for updating a driver.
 * All fields are optional, but at least one must be provided.
 *
 * Status is intentionally excluded — use the dedicated PATCH
 * /api/v1/drivers/:id/status endpoint for status changes.
 */
const updateDriverSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).messages({
        'string.min': 'Driver name must be at least 2 characters',
        'string.max': 'Driver name must not exceed 100 characters'
    }),

    licenseNumber: Joi.string().trim(),

    licenseCategory: Joi.string().trim(),

    licenseExpiryDate: Joi.date().iso().messages({
        'date.base': 'License expiry date must be a valid date',
        'date.format': 'License expiry date must be in ISO format (YYYY-MM-DD)'
    }),

    contactNumber: Joi.string().trim().min(7).max(15).messages({
        'string.min': 'Contact number must be at least 7 digits',
        'string.max': 'Contact number must not exceed 15 digits'
    }),

    safetyScore: Joi.number().integer().min(0).max(100).messages({
        'number.base': 'Safety score must be a number',
        'number.min': 'Safety score must be between 0 and 100',
        'number.max': 'Safety score must be between 0 and 100'
    })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

/**
 * Schema for manually changing a driver's status.
 *
 * 'On Trip' is intentionally excluded — it can only be set
 * by the Trip module during dispatch (via DriverService.markOnTrip).
 */
const updateDriverStatusSchema = Joi.object({
    status: Joi.string()
        .valid('Available', 'Off Duty', 'Suspended')
        .required()
        .messages({
            'any.only': 'Status must be one of: Available, Off Duty, Suspended. "On Trip" is set automatically during trip dispatch.',
            'any.required': 'Status is required'
        })
});

module.exports = {
    createDriverSchema,
    updateDriverSchema,
    updateDriverStatusSchema
};
