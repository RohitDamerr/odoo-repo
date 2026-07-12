/**
 * Wraps an async Express route handler so that any rejected promise
 * or thrown error is forwarded to the Express error-handling middleware.
 *
 * This eliminates the need for try/catch blocks in every controller.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncHandler;
