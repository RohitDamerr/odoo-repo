const maintenanceService = require('./maintenance.service');

/**
 * POST /api/maintenance
 * Open a new maintenance job. Auto-sets vehicle to In Shop.
 */
const create = async (req, res) => {
    const log = await maintenanceService.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Maintenance job opened — vehicle set to In Shop',
        data: { maintenance: log }
    });
};

/**
 * GET /api/maintenance
 * List maintenance logs with pagination and filters.
 */
const list = async (req, res) => {
    const { page, limit, sort, status, type, vehicle } = req.validatedQuery || req.query;

    const result = await maintenanceService.findAll({
        page, limit, sort, status, type, vehicle
    });

    res.status(200).json({
        success: true,
        data: result
    });
};

/**
 * GET /api/maintenance/stats
 * Maintenance dashboard summary.
 */
const stats = async (_req, res) => {
    const result = await maintenanceService.getStats();

    res.status(200).json({
        success: true,
        data: result
    });
};

/**
 * GET /api/maintenance/:id
 * Get a single maintenance log by ID.
 */
const getById = async (req, res) => {
    const log = await maintenanceService.findById(req.params.id);

    res.status(200).json({
        success: true,
        data: { maintenance: log }
    });
};

/**
 * PUT /api/maintenance/:id
 * Update fields on an Active maintenance log.
 */
const update = async (req, res) => {
    const log = await maintenanceService.update(req.params.id, req.body);

    res.status(200).json({
        success: true,
        message: 'Maintenance log updated',
        data: { maintenance: log }
    });
};

/**
 * PATCH /api/maintenance/:id/close
 * Close a maintenance job — marks complete, restores vehicle to Available.
 */
const close = async (req, res) => {
    const log = await maintenanceService.close(req.params.id, req.body);

    res.status(200).json({
        success: true,
        message: 'Maintenance job closed — vehicle restored to Available',
        data: { maintenance: log }
    });
};

/**
 * PATCH /api/maintenance/:id/reopen
 * Re-open a previously closed maintenance log.
 */
const reopen = async (req, res) => {
    const log = await maintenanceService.reopen(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Maintenance log re-opened — vehicle set to In Shop',
        data: { maintenance: log }
    });
};

/**
 * DELETE /api/maintenance/:id
 * Delete a Closed maintenance log (admin only).
 */
const remove = async (req, res) => {
    await maintenanceService.remove(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Maintenance log deleted successfully'
    });
};

module.exports = {
    create,
    list,
    stats,
    getById,
    update,
    close,
    reopen,
    remove
};
