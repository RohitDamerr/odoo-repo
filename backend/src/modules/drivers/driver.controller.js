const driverService = require('./driver.service');

// ══════════════════════════════════════════════════════════════════════
//  CRUD Handlers
// ══════════════════════════════════════════════════════════════════════

/**
 * POST /api/v1/drivers
 * Register a new driver.
 */
const create = async (req, res) => {
    const driver = await driverService.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Driver registered successfully',
        data: { driver }
    });
};

/**
 * GET /api/v1/drivers
 * List drivers with pagination, filtering, and search.
 */
const findAll = async (req, res) => {
    const result = await driverService.findAll(req.query);

    res.status(200).json({
        success: true,
        data: {
            drivers: result.drivers,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }
        }
    });
};

/**
 * GET /api/v1/drivers/:id
 * Get a single driver by ID.
 */
const findById = async (req, res) => {
    const driver = await driverService.findById(req.params.id);

    res.status(200).json({
        success: true,
        data: { driver }
    });
};

/**
 * PATCH /api/v1/drivers/:id
 * Update driver fields (status NOT allowed here).
 */
const update = async (req, res) => {
    const driver = await driverService.update(req.params.id, req.body);

    res.status(200).json({
        success: true,
        message: 'Driver updated successfully',
        data: { driver }
    });
};

/**
 * DELETE /api/v1/drivers/:id
 * Remove a driver (blocked if currently On Trip).
 */
const remove = async (req, res) => {
    await driverService.remove(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Driver deleted successfully'
    });
};

// ══════════════════════════════════════════════════════════════════════
//  Status Handler
// ══════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/v1/drivers/:id/status
 * Manually change driver status (available → off duty, suspended → available, etc.)
 *
 * "On Trip" is rejected — it can only be set by the Trip module during dispatch.
 */
const updateStatus = async (req, res) => {
    const driver = await driverService.updateStatus(req.params.id, req.body.status);

    res.status(200).json({
        success: true,
        message: `Driver status updated to '${driver.status}'`,
        data: { driver }
    });
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove,
    updateStatus
};
