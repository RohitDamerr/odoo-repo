const fuelService = require('./fuel.service');

// ══════════════════════════════════════════════════════════════════════
//  CRUD Handlers
// ══════════════════════════════════════════════════════════════════════

/**
 * POST /api/v1/fuel
 * Log a new fuel transaction.
 */
const create = async (req, res) => {
    const fuelLog = await fuelService.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Fuel transaction logged successfully',
        data: { fuelLog }
    });
};

/**
 * GET /api/v1/fuel
 * List fuel logs with pagination and filters.
 */
const findAll = async (req, res) => {
    const result = await fuelService.findAll(req.query);

    res.status(200).json({
        success: true,
        data: {
            fuelLogs: result.fuelLogs,
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
 * GET /api/v1/fuel/:id
 * Get a single fuel log by ID.
 */
const findById = async (req, res) => {
    const fuelLog = await fuelService.findById(req.params.id);

    res.status(200).json({
        success: true,
        data: { fuelLog }
    });
};

/**
 * PATCH /api/v1/fuel/:id
 * Update a fuel log entry.
 */
const update = async (req, res) => {
    const fuelLog = await fuelService.update(req.params.id, req.body);

    res.status(200).json({
        success: true,
        message: 'Fuel log updated successfully',
        data: { fuelLog }
    });
};

/**
 * DELETE /api/v1/fuel/:id
 * Remove a fuel log entry.
 */
const remove = async (req, res) => {
    await fuelService.remove(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Fuel log deleted successfully'
    });
};

// ══════════════════════════════════════════════════════════════════════
//  Fuel Efficiency
// ══════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/fuel/efficiency/:vehicleId
 * Calculate fuel efficiency (km/L) for a vehicle over a date range.
 */
const getEfficiency = async (req, res) => {
    const { startDate, endDate } = req.query;
    const result = await fuelService.getEfficiency(req.params.vehicleId, startDate, endDate);

    res.status(200).json({
        success: true,
        data: result
    });
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove,
    getEfficiency
};
