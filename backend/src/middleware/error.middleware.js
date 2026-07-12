const ApiError = require('../errors/ApiError');

/**
 * Global error-handling middleware.
 *
 * Must be registered AFTER all routes so that errors thrown (or passed via
 * `next(err)`) anywhere in the request pipeline land here.
 *
 * Express identifies error-handling middleware by its 4-parameter signature.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
    // ── Log the error ──────────────────────────────────────────────
    if (process.env.NODE_ENV !== 'test') {
        console.error(`[ERROR] ${err.message}`);
        if (err.stack && process.env.NODE_ENV === 'development') {
            console.error(err.stack);
        }
    }

    // ── Determine status & message ─────────────────────────────────
    let statusCode = 500;
    let message = 'Internal server error';
    let details = null;

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        details = err.details;
    }
    // Mongoose validation error
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        details = Object.keys(err.errors).map((key) => ({
            field: key,
            message: err.errors[key].message
        }));
    }
    // Mongoose duplicate key
    else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `A record with this ${field} already exists`;
        details = { field, value: err.keyValue[field] };
    }
    // Mongoose CastError (bad ObjectId, etc.)
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid value for ${err.path}: ${err.value}`;
    }
    // JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token has expired';
    }
    // Fallback for unexpected errors in production — hide internals
    else if (process.env.NODE_ENV === 'production') {
        message = 'Internal server error';
    } else {
        message = err.message || 'Internal server error';
    }

    // ── Send response ──────────────────────────────────────────────
    res.status(statusCode).json({
        success: false,
        message,
        ...(details && { details }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
