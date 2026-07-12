const FuelLog = require('../../models/FuelLog');
const Vehicle = require('../../models/Vehicle');
const Trip = require('../../models/Trip');
const ApiError = require('../../errors/ApiError');

// ══════════════════════════════════════════════════════════════════════
//  CRUD
// ══════════════════════════════════════════════════════════════════════

/**
 * Log a fuel transaction.
 *
 * @param {object} data - { vehicle, trip?, liters, cost, odometer?, date? }
 * @returns {Promise<Document>}
 */
const create = async (data) => {
    // Verify the vehicle exists
    const vehicle = await Vehicle.findById(data.vehicle).lean();
    if (!vehicle) {
        throw ApiError.notFound('Vehicle not found');
    }

    // Verify trip exists if provided
    if (data.trip) {
        const trip = await Trip.findById(data.trip).lean();
        if (!trip) {
            throw ApiError.notFound('Trip not found');
        }
    }

    const fuelLog = await FuelLog.create(data);
    return fuelLog;
};

/**
 * List fuel logs with pagination, filtering, and sort.
 *
 * Query params:
 *  - vehicle      Filter by vehicle ID
 *  - trip         Filter by trip ID
 *  - startDate    Filter from date (inclusive)
 *  - endDate      Filter to date (inclusive)
 *  - page         Page number (default 1)
 *  - limit        Items per page (default 20, max 100)
 *  - sort         Sort field (prefix with - for desc, e.g. -date)
 *
 * @param {object} query - req.query
 * @returns {Promise<{ fuelLogs: Document[], page: number, limit: number, total: number, totalPages: number }>}
 */
const findAll = async (query = {}) => {
    const {
        vehicle,
        trip,
        startDate,
        endDate,
        page = 1,
        limit = 20,
        sort = '-date'
    } = query;

    const filter = {};

    if (vehicle) {
        filter.vehicle = vehicle;
    }

    if (trip) {
        filter.trip = trip;
    }

    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDir = sort.startsWith('-') ? -1 : 1;

    const [fuelLogs, total] = await Promise.all([
        FuelLog.find(filter)
            .populate('vehicle', 'name registrationNumber type')
            .populate('trip', 'source destination status')
            .sort({ [sortField]: sortDir })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        FuelLog.countDocuments(filter)
    ]);

    return {
        fuelLogs,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
    };
};

/**
 * Get a single fuel log by ID.
 *
 * @param {string} id
 * @returns {Promise<Document>}
 */
const findById = async (id) => {
    const fuelLog = await FuelLog.findById(id)
        .populate('vehicle', 'name registrationNumber type')
        .populate('trip', 'source destination status')
        .lean();

    if (!fuelLog) {
        throw ApiError.notFound('Fuel log not found');
    }

    return fuelLog;
};

/**
 * Update a fuel log entry.
 *
 * @param {string} id
 * @param {object} data
 * @returns {Promise<Document>}
 */
const update = async (id, data) => {
    const fuelLog = await FuelLog.findById(id);
    if (!fuelLog) {
        throw ApiError.notFound('Fuel log not found');
    }

    // Verify references if being changed
    if (data.vehicle) {
        const vehicle = await Vehicle.findById(data.vehicle).lean();
        if (!vehicle) {
            throw ApiError.notFound('Vehicle not found');
        }
    }

    if (data.trip) {
        const trip = await Trip.findById(data.trip).lean();
        if (!trip) {
            throw ApiError.notFound('Trip not found');
        }
    }

    Object.assign(fuelLog, data);
    await fuelLog.save();

    return fuelLog.toObject();
};

/**
 * Delete a fuel log entry.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
const remove = async (id) => {
    const fuelLog = await FuelLog.findById(id);
    if (!fuelLog) {
        throw ApiError.notFound('Fuel log not found');
    }

    await FuelLog.findByIdAndDelete(id);
};

// ══════════════════════════════════════════════════════════════════════
//  Fuel Efficiency
// ══════════════════════════════════════════════════════════════════════

/**
 * Calculate fuel efficiency (km/L) for a vehicle over a date range.
 *
 * Uses odometer readings from consecutive fuel logs to compute distance travelled,
 * then divides by total fuel consumed. Falls back to trip planned distances
 * if odometer data is sparse.
 *
 * Returns:
 *  - totalLiters       Total fuel consumed
 *  - totalDistance     Total distance covered (km)
 *  - efficiency        km per liter (totalDistance / totalLiters)
 *  - transactionCount  Number of fuel logs in the range
 *
 * @param {string} vehicleId
 * @param {string} [startDate]
 * @param {string} [endDate]
 * @returns {Promise<{ totalLiters: number, totalDistance: number, efficiency: number | null, transactionCount: number }>}
 */
const getEfficiency = async (vehicleId, startDate, endDate) => {
    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId).lean();
    if (!vehicle) {
        throw ApiError.notFound('Vehicle not found');
    }

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const filter = { vehicle: vehicleId };
    if (Object.keys(dateFilter).length > 0) {
        filter.date = dateFilter;
    }

    const fuelLogs = await FuelLog.find(filter)
        .sort({ date: 1, createdAt: 1 })
        .lean();

    // Sum total liters and cost
    const totalLiters = fuelLogs.reduce((sum, log) => sum + (log.liters || 0), 0);

    // Estimate distance from odometer readings
    let totalDistance = 0;
    const logsWithOdometer = fuelLogs.filter((log) => log.odometer != null);

    if (logsWithOdometer.length >= 2) {
        // Distance = last odometer - first odometer
        const firstOdometer = logsWithOdometer[0].odometer;
        const lastOdometer = logsWithOdometer[logsWithOdometer.length - 1].odometer;
        totalDistance = Math.max(0, lastOdometer - firstOdometer);
    }

    const efficiency = totalLiters > 0 ? +(totalDistance / totalLiters).toFixed(2) : null;

    return {
        totalLiters: +totalLiters.toFixed(2),
        totalDistance,
        efficiency,
        transactionCount: fuelLogs.length
    };
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove,
    getEfficiency
};
