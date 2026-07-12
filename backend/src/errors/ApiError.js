/**
 * Custom API Error class for consistent error responses.
 * Use this throughout the application instead of generic Error.
 */
class ApiError extends Error {
    /**
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Human-readable error message
     * @param {object} [details] - Optional additional error details (e.g. validation errors)
     */
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }

    // ── Factory methods for common errors ──────────────────────────

    static badRequest(message = 'Bad request', details = null) {
        return new ApiError(400, message, details);
    }

    static unauthorized(message = 'Authentication required') {
        return new ApiError(401, message);
    }

    static forbidden(message = 'You do not have permission to perform this action') {
        return new ApiError(403, message);
    }

    static notFound(message = 'Resource not found') {
        return new ApiError(404, message);
    }

    static conflict(message = 'Resource already exists') {
        return new ApiError(409, message);
    }

    static internal(message = 'Internal server error') {
        return new ApiError(500, message);
    }
}

module.exports = ApiError;
