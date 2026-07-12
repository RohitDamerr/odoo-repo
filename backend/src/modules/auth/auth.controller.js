const authService = require('./auth.service');

/**
 * POST /api/auth/register
 * Create a new user account and return JWT tokens.
 */
const register = async (req, res) => {
    const { name, email, password, role } = req.body;

    const result = await authService.register({ name, email, password, role });

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: result.user,
            tokens: result.tokens
        }
    });
};

/**
 * POST /api/auth/login
 * Authenticate with email + password and return JWT tokens.
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: result.user,
            tokens: result.tokens
        }
    });
};

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token for a new token pair.
 */
const refresh = async (req, res) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refresh(refreshToken);

    res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens }
    });
};

/**
 * GET /api/auth/profile
 * Return the currently authenticated user's profile.
 */
const getProfile = async (req, res) => {
    const user = await authService.getProfile(req.user._id);

    res.status(200).json({
        success: true,
        data: { user }
    });
};

/**
 * POST /api/auth/change-password
 * Change the authenticated user's password.
 */
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.user._id, currentPassword, newPassword);

    res.status(200).json({
        success: true,
        message: 'Password changed successfully'
    });
};

module.exports = {
    register,
    login,
    refresh,
    getProfile,
    changePassword
};
