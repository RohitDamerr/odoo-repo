const MaintenanceLog = require('../../models/MaintenanceLog');
const Vehicle = require('../../models/Vehicle');
const ApiError = require('../../errors/ApiError');
const { onCreateMaintenanceExpense } = require('../../services/integration.service');

// ────────────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────────────

/**
 * Safely set a vehicle's status, throwing if the transition is invalid.
 * Wraps the Vehicle model's business rules so the maintenance module
 * stays decoupled from vehicle-internal transition logic.
 */
const transitionVehicle = async (vehicleId, newStatus) => {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
        throw ApiError.notFound('Vehicle not found');
    }

    const allowed = {
        'Available': ['On Trip', 'In Shop', 'Retired'],
        'On Trip': ['Available', 'Retired'],
        'In Shop': ['Available', 'Retired'],
        'Retired': []
    };

    const current = vehicle.status;

    // Already in the target status — not an error for our use case
    if (current === newStatus) {
        return;
    }

    if (!allowed[current].includes(newStatus)) {
        throw ApiError.badRequest(
            `Cannot change vehicle status from '${current}' to '${newStatus}'`
        );
    }

    vehicle.status = newStatus;
    await vehicle.save();
};

// ────────────────────────────────────────────────────────────────────
//  Service
// ────────────────────────────────────────────────────────────────────

/**
 * Open a new maintenance job.
 *
 * Side-effect: if the vehicle is 'Available', it is automatically
 * moved to 'In Shop'. If the vehicle is 'On Trip' or 'Retired' the
 * operation is rejected.
 *
 * @param {object} data — Validated maintenance fields (vehicle, description, type, ...)
 * @returns {Promise<object>} Created MaintenanceLog (populated)
 */
const create = async (data) => {
    const vehicle = await Vehicle.findById(data.vehicle);
    if (!vehicle) {
        throw ApiError.notFound('Vehicle not found');
    }

    // Business guard: cannot open maintenance for a vehicle on trip or retired
    if (vehicle.status === 'On Trip') {
        throw ApiError.badRequest(
            'Cannot open maintenance for a vehicle that is currently on a trip. Return the vehicle first.'
        );
    }
    if (vehicle.status === 'Retired') {
        throw ApiError.badRequest('Cannot open maintenance for a retired vehicle.');
    }

    // Create the maintenance log
    const log = await MaintenanceLog.create({
        vehicle: data.vehicle,
        description: data.description,
        type: data.type,
        cost: data.cost || 0,
        startDate: data.startDate || new Date(),
        notes: data.notes || '',
        status: 'Active'
    });

    // Auto-move vehicle to In Shop if currently Available
    if (vehicle.status === 'Available') {
        await transitionVehicle(data.vehicle, 'In Shop');
    }
    // If vehicle is already 'In Shop' — leave as-is (second concurrent job)

    // Return populated
    return MaintenanceLog.findById(log._id).populate('vehicle').lean();
};

/**
 * Update fields on an Active maintenance log.
 * Closed logs cannot be updated.
 *
 * @param {string} id   — MaintenanceLog _id
 * @param {object} data — Partial fields
 * @returns {Promise<object>} Updated log (populated)
 */
const update = async (id, data) => {
    const log = await MaintenanceLog.findById(id);
    if (!log) {
        throw ApiError.notFound('Maintenance log not found');
    }

    if (log.status === 'Closed') {
        throw ApiError.badRequest('Cannot update a closed maintenance log. Re-open it first if changes are needed.');
    }

    Object.assign(log, data);
    await log.save();

    return MaintenanceLog.findById(log._id).populate('vehicle').lean();
};

/**
 * Close a maintenance job — marks it complete.
 *
 * Side-effect: if the vehicle is 'In Shop', it is auto-restored to
 * 'Available'. Also sets endDate to now and optionally updates cost.
 *
 * @param {string} id   — MaintenanceLog _id
 * @param {object} opts — { cost?, notes? }
 * @returns {Promise<object>} Closed log (populated)
 */
const close = async (id, opts = {}) => {
    const log = await MaintenanceLog.findById(id);
    if (!log) {
        throw ApiError.notFound('Maintenance log not found');
    }

    if (log.status === 'Closed') {
        throw ApiError.badRequest('Maintenance log is already closed');
    }

    // Update cost if provided
    if (opts.cost !== undefined) {
        log.cost = opts.cost;
    }
    if (opts.notes !== undefined) {
        log.notes = opts.notes;
    }

    log.status = 'Closed';
    log.endDate = new Date();
    await log.save();

    // Auto-restore vehicle to Available if it's currently In Shop
    const vehicle = await Vehicle.findById(log.vehicle);
    if (vehicle && vehicle.status === 'In Shop') {
        // Check if there are other Active maintenance logs for this vehicle
        const otherActive = await MaintenanceLog.countDocuments({
            vehicle: log.vehicle,
            status: 'Active',
            _id: { $ne: log._id }
        });

        if (otherActive === 0) {
            await transitionVehicle(log.vehicle, 'Available');
        }
    }

    // Cross-integration: closed maintenance → expense record
    const populated = await MaintenanceLog.findById(log._id).populate('vehicle').lean();
    await onCreateMaintenanceExpense(populated).catch(() => {}); // fire-and-forget, non-blocking

    return populated;
};

/**
 * Re-open a previously closed maintenance log.
 * Sets status back to Active, clears endDate.
 * Also moves vehicle to In Shop if currently Available.
 *
 * @param {string} id — MaintenanceLog _id
 * @returns {Promise<object>} Re-opened log (populated)
 */
const reopen = async (id) => {
    const log = await MaintenanceLog.findById(id);
    if (!log) {
        throw ApiError.notFound('Maintenance log not found');
    }

    if (log.status === 'Active') {
        throw ApiError.badRequest('Maintenance log is already active');
    }

    const vehicle = await Vehicle.findById(log.vehicle);
    if (!vehicle) {
        throw ApiError.notFound('Associated vehicle not found');
    }
    if (vehicle.status === 'Retired') {
        throw ApiError.badRequest('Cannot re-open maintenance for a retired vehicle');
    }
    if (vehicle.status === 'On Trip') {
        throw ApiError.badRequest('Cannot re-open maintenance for a vehicle currently on a trip');
    }

    log.status = 'Active';
    log.endDate = null;
    await log.save();

    // Move vehicle back to In Shop if Available
    if (vehicle.status === 'Available') {
        await transitionVehicle(log.vehicle, 'In Shop');
    }

    return MaintenanceLog.findById(log._id).populate('vehicle').lean();
};

/**
 * List maintenance logs with filtering and pagination.
 *
 * @param {object} query — { page, limit, sort, status, type, vehicle }
 * @returns {Promise<{ logs: object[], total: number, page: number, totalPages: number }>}
 */
const findAll = async ({ page, limit, sort, status, type, vehicle }) => {
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (vehicle) filter.vehicle = vehicle;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        MaintenanceLog.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('vehicle', 'registrationNumber name type status')
            .lean(),
        MaintenanceLog.countDocuments(filter)
    ]);

    return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Get a single maintenance log by ID.
 *
 * @param {string} id — MaintenanceLog _id
 * @returns {Promise<object>} Populated log
 */
const findById = async (id) => {
    const log = await MaintenanceLog.findById(id)
        .populate('vehicle', 'registrationNumber name type status')
        .lean();

    if (!log) {
        throw ApiError.notFound('Maintenance log not found');
    }

    return log;
};

/**
 * Get summary stats for the maintenance dashboard.
 *
 * @returns {Promise<{ total: number, active: number, closed: number, totalCost: number, byType: object }>}
 */
const getStats = async () => {
    const [total, active, closed, costAgg, byType] = await Promise.all([
        MaintenanceLog.countDocuments(),
        MaintenanceLog.countDocuments({ status: 'Active' }),
        MaintenanceLog.countDocuments({ status: 'Closed' }),
        MaintenanceLog.aggregate([
            { $group: { _id: null, totalCost: { $sum: '$cost' } } }
        ]),
        MaintenanceLog.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 }, totalCost: { $sum: '$cost' } } },
            { $sort: { count: -1 } }
        ])
    ]);

    return {
        total,
        active,
        closed,
        totalCost: costAgg[0]?.totalCost || 0,
        byType
    };
};

/**
 * Delete a maintenance log.
 * Only Closed logs can be deleted (safety: don't lose active work).
 *
 * @param {string} id — MaintenanceLog _id
 */
const remove = async (id) => {
    const log = await MaintenanceLog.findById(id);
    if (!log) {
        throw ApiError.notFound('Maintenance log not found');
    }

    if (log.status === 'Active') {
        throw ApiError.badRequest(
            'Cannot delete an active maintenance log. Close it first.'
        );
    }

    await MaintenanceLog.findByIdAndDelete(id);
};

module.exports = {
    create,
    update,
    close,
    reopen,
    findAll,
    findById,
    getStats,
    remove
};
