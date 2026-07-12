const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const ApiError = require('../errors/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Middleware that protects routes by verifying the JWT access token
 * sent in the `Authorization` header (Bearer scheme).
 *
 * On success, the decoded user is loaded from the database and attached
 * to `req.user` so downstream handlers / middleware can access it.
 *
 * Usage:
 *   router.get('/profile', authenticate, profileController.getProfile);
 */
const authenticate = asyncHandler(async (req, _res, next) => {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw ApiError.unauthorized('Access token is missing. Please provide a Bearer token in the Authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        throw ApiError.unauthorized('Access token is missing');
    }

    // 2. Verify the token (will throw JsonWebTokenError / TokenExpiredError on failure)
    const decoded = verifyAccessToken(token);

    // 3. Fetch the user from the database to ensure they still exist
    //    and have the latest role / status.
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
        throw ApiError.unauthorized('The user belonging to this token no longer exists');
    }

    // 4. Attach user to request
    req.user = user;
    next();
});

module.exports = authenticate;
