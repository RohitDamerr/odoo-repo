const vehicleService = require('./vehicle.service');

/**
 * POST /api/vehicles
 * Create a new vehicle.
 */
const create = async (req, res) => {
    const vehicle = await vehicleService.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: { vehicle }
    });
};

/**
 * GET /api/vehicles
 * List vehicles with pagination, filtering, and search.
 */
const list = async (req, res) => {
    // Use validatedQuery so Joi defaults (page, limit, sort) are guaranteed
    const { page, limit, sort, status, type, search } = req.validatedQuery || req.query;

    const result = await vehicleService.findAll({
        page, limit, sort, status, type, search
    });

    res.status(200).json({
        success: true,
        data: result
    });
};

/**
 * GET /api/vehicles/stats
 * Get aggregate vehicle counts by status for dashboards.
 */
const stats = async (_req, res) => {
    const result = await vehicleService.getStats();

    res.status(200).json({
        success: true,
        data: result
    });
};

/**
 * GET /api/vehicles/:id
 * Get a single vehicle by ID.
 */
const getById = async (req, res) => {
    const vehicle = await vehicleService.findById(req.params.id);

    res.status(200).json({
        success: true,
        data: { vehicle }
    });
};

/**
 * PUT /api/vehicles/:id
 * Update vehicle fields.
 */
const update = async (req, res) => {
    const vehicle = await vehicleService.update(req.params.id, req.body);

    res.status(200).json({
        success: true,
        message: 'Vehicle updated successfully',
        data: { vehicle }
    });
};

/**
 * PATCH /api/vehicles/:id/status
 * Update vehicle status with business-rule validation.
 */
const updateStatus = async (req, res) => {
    const vehicle = await vehicleService.updateStatus(req.params.id, req.body.status);

    res.status(200).json({
        success: true,
        message: `Vehicle status changed to '${vehicle.status}'`,
        data: { vehicle }
    });
};

/**
 * DELETE /api/vehicles/:id
 * Delete a vehicle (only if no active trips).
 */
const remove = async (req, res) => {
    await vehicleService.remove(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Vehicle deleted successfully'
    });
};

module.exports = {
    create,
    list,
    stats,
    getById,
    update,
    updateStatus,
    remove
};
