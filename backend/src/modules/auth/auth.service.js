const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const ApiError = require('../../errors/ApiError');
const { generateTokenPair, verifyRefreshToken } = require('../../utils/jwt');

/**
 * Register a new user account.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.role='driver']
 * @returns {Promise<{ user: object, tokens: { accessToken: string, refreshToken: string } }>}
 */
const register = async ({ name, email, password, role }) => {
    // Check for existing user with the same email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw ApiError.conflict('A user with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'driver'
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, tokens };
};

/**
 * Authenticate a user by email and password.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ user: object, tokens: { accessToken: string, refreshToken: string } }>}
 */
const login = async ({ email, password }) => {
    // Find user — explicitly select password since it's excluded by default
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, tokens };
};

/**
 * Refresh an expired access token using a valid refresh token.
 *
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
const refresh = async (refreshToken) => {
    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Ensure the user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
        throw ApiError.unauthorized('The user belonging to this token no longer exists');
    }

    // Issue a fresh token pair (rotation)
    const tokens = generateTokenPair(user);

    return tokens;
};

/**
 * Get the currently authenticated user's profile.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getProfile = async (userId) => {
    const user = await User.findById(userId).select('-password');

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    return user;
};

/**
 * Change the authenticated user's password.
 *
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw ApiError.badRequest('Current password is incorrect');
    }

    // Hash and update
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
};

module.exports = {
    register,
    login,
    refresh,
    getProfile,
    changePassword
};
