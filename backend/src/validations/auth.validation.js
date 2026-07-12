const Joi = require('joi');

/**
 * Schema for user registration / sign-up.
 */
const registerSchema = Joi.object({
    name: Joi.string().trim().max(100).required().messages({
        'string.empty': 'Name is required',
        'string.max': 'Name must not exceed 100 characters',
        'any.required': 'Name is required'
    }),

    email: Joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
    }),

    password: Joi.string().min(6).max(128).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password must not exceed 128 characters',
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
    }),

    role: Joi.string()
        .valid('admin', 'fleet_manager', 'driver', 'safety_officer', 'financial_analyst')
        .default('driver')
        .messages({
            'any.only': 'Role must be one of: admin, fleet_manager, driver, safety_officer, financial_analyst'
        })
});

/**
 * Schema for user login.
 */
const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
    }),

    password: Joi.string().required().messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
    })
});

/**
 * Schema for refreshing an access token.
 */
const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
        'string.empty': 'Refresh token is required',
        'any.required': 'Refresh token is required'
    })
});

/**
 * Schema for changing password (authenticated user).
 */
const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required().messages({
        'string.empty': 'Current password is required',
        'any.required': 'Current password is required'
    }),

    newPassword: Joi.string().min(6).max(128).required().messages({
        'string.min': 'New password must be at least 6 characters',
        'string.max': 'New password must not exceed 128 characters',
        'string.empty': 'New password is required',
        'any.required': 'New password is required'
    })
});

module.exports = {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    changePasswordSchema
};
