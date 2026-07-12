const jwt = require('jsonwebtoken');

/**
 * Generate an access token for a given user payload.
 * @param {object} payload - Typically { id, email, role }
 * @returns {string} Signed JWT access token
 */
const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });
};

/**
 * Generate a refresh token for a given user payload.
 * @param {object} payload - Typically { id }
 * @returns {string} Signed JWT refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
};

/**
 * Verify an access token and return the decoded payload.
 * @param {string} token - JWT access token
 * @returns {object} Decoded token payload
 * @throws {jwt.JsonWebTokenError} If token is invalid or expired
 */
const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify a refresh token and return the decoded payload.
 * @param {string} token - JWT refresh token
 * @returns {object} Decoded token payload
 * @throws {jwt.JsonWebTokenError} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Generate both access and refresh tokens for a user.
 * @param {object} user - Mongoose user document
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokenPair = (user) => {
    const payload = { id: user._id, email: user.email, role: user.role };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ id: user._id });

    return { accessToken, refreshToken };
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateTokenPair
};
