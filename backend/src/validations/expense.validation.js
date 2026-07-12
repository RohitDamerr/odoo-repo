const Joi = require('joi');

const createExpenseSchema = Joi.object({
    vehicle: Joi.string().required().messages({
        'string.empty': 'Vehicle ID is required',
        'any.required': 'Vehicle ID is required'
    }),
    trip: Joi.string().allow(null).default(null),
    type: Joi.string().valid('fuel', 'toll', 'maintenance', 'parking', 'repair', 'miscellaneous').required().messages({
        'any.only': 'Type must be one of: fuel, toll, maintenance, parking, repair, miscellaneous',
        'any.required': 'Expense type is required'
    }),
    amount: Joi.number().min(0).required().messages({
        'number.base': 'Amount must be a number',
        'number.min': 'Amount cannot be negative',
        'any.required': 'Amount is required'
    }),
    description: Joi.string().trim().allow('').default(''),
    date: Joi.date().iso().default(() => new Date())
});

const updateExpenseSchema = Joi.object({
    vehicle: Joi.string(),
    trip: Joi.string().allow(null),
    type: Joi.string().valid('fuel', 'toll', 'maintenance', 'parking', 'repair', 'miscellaneous').messages({
        'any.only': 'Type must be one of: fuel, toll, maintenance, parking, repair, miscellaneous'
    }),
    amount: Joi.number().min(0),
    description: Joi.string().trim().allow(''),
    date: Joi.date().iso()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

module.exports = { createExpenseSchema, updateExpenseSchema };
