const ApiError = require('../errors/ApiError');

/**
 * Returns Express middleware that validates `req.body` against the given
 * Joi schema.  If validation fails a 400 ApiError is thrown with the
 * per-field messages so the global error handler can return them.
 *
 * Usage:
 *   router.post('/login', validate(loginSchema), authController.login);
 *
 * @param {import('joi').ObjectSchema} schema - Joi validation schema
 * @param {'body'|'query'|'params'} [source='body'] - Request property to validate
 */
const validate = (schema, source = 'body') => {
    return (req, _res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const details = error.details.map((d) => ({
                field: d.path.join('.'),
                message: d.message
            }));

            throw ApiError.badRequest('Validation failed', details);
        }

        // Replace with the sanitised / defaulted values
        req[source] = value;
        next();
    };
};

module.exports = validate;
