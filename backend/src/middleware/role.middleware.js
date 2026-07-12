const ApiError = require('../errors/ApiError');

/**
 * Returns middleware that restricts access to users whose role is
 * included in the supplied list.
 *
 * Must be used AFTER `authenticate` so that `req.user` is populated.
 *
 * Usage:
 *   // Single role
 *   router.delete('/users/:id', authenticate, authorize('admin'), ctrl.deleteUser);
 *
 *   // Multiple roles
 *   router.get('/reports', authenticate, authorize('admin', 'fleet_manager'), ctrl.getReports);
 *
 * @param  {...string} roles - One or more allowed roles
 */
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw ApiError.unauthorized('Authentication required');
        }

        if (!roles.includes(req.user.role)) {
            throw ApiError.forbidden(
                `Role '${req.user.role}' is not authorised to access this resource`
            );
        }

        next();
    };
};

module.exports = authorize;
