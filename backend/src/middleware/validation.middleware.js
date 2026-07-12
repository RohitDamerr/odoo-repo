const ApiError = require('../errors/ApiError');

/**
 * Returns Express middleware that validates the given request property
 * against a Joi schema. If validation fails a 400 ApiError is thrown.
 *
 * The validated (sanitised + defaulted) value is written back to
 * `req[source]` AND to a dedicated property:
 *   source = 'body'   → req.validatedBody
 *   source = 'query'  → req.validatedQuery
 *   source = 'params' → req.validatedParams
 *
 * Controllers should prefer the `validated*` properties — they are
 * guaranteed to be the sanitised Joi output, which is important for
 * `query` since Express's `req.query` cannot always be cleanly replaced.
 *
 * Usage:
 *   router.post('/login', validate(loginSchema), authController.login);
 *   router.get('/list', validate(querySchema, 'query'), ctrl.list);
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

        // Write back to the original property
        req[source] = value;

        // Also store on a dedicated validated property
        const validatedKey = `validated${source.charAt(0).toUpperCase() + source.slice(1)}`;
        req[validatedKey] = value;

        next();
    };
};

module.exports = validate;
