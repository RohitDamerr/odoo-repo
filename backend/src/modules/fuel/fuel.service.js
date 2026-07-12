const FuelLog = require('../../models/FuelLog');
const Vehicle = require('../../models/Vehicle');
const Trip = require('../../models/Trip');
const ApiError = require('../../errors/ApiError');

const create = async (data) => {
    const vehicle = await Vehicle.findById(data.vehicle);
    if (!vehicle) throw ApiError.notFound('Vehicle not found');

    // Guard: cannot log fuel for a Retired vehicle
    if (vehicle.status === 'Retired') {
        throw ApiError.badRequest('Cannot log fuel for a retired vehicle.');
    }

    if (data.trip) {
        const trip = await Trip.findById(data.trip).lean();
        if (!trip) throw ApiError.notFound('Trip not found');
    }

    const fuelLog = await FuelLog.create(data);

    // Sync odometer forward if the fuel-log reading is higher
    if (data.odometer != null && data.odometer > vehicle.odometer) {
        vehicle.odometer = data.odometer;
        await vehicle.save();
    }

    return fuelLog;
};

const findAll = async (query = {}) => {
    const { vehicle, trip, startDate, endDate, page = 1, limit = 20, sort = '-date' } = query;

    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (trip) filter.trip = trip;
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
            .sort({ [sortField]: sortDir }).skip(skip).limit(limitNum).lean(),
        FuelLog.countDocuments(filter)
    ]);

    return { fuelLogs, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) };
};

const findById = async (id) => {
    const fuelLog = await FuelLog.findById(id)
        .populate('vehicle', 'name registrationNumber type')
        .populate('trip', 'source destination status')
        .lean();

    if (!fuelLog) throw ApiError.notFound('Fuel log not found');
    return fuelLog;
};

const update = async (id, data) => {
    const fuelLog = await FuelLog.findById(id);
    if (!fuelLog) throw ApiError.notFound('Fuel log not found');

    if (data.vehicle) {
        const vehicle = await Vehicle.findById(data.vehicle);
        if (!vehicle) throw ApiError.notFound('Vehicle not found');

        // Guard: cannot reassign fuel log to a Retired vehicle
        if (vehicle.status === 'Retired') {
            throw ApiError.badRequest('Cannot reassign a fuel log to a retired vehicle.');
        }

        // Sync odometer forward if the new reading is higher
        if (data.odometer != null && data.odometer > vehicle.odometer) {
            vehicle.odometer = data.odometer;
            await vehicle.save();
        }
    }
    if (data.trip) {
        const trip = await Trip.findById(data.trip).lean();
        if (!trip) throw ApiError.notFound('Trip not found');
    }

    Object.assign(fuelLog, data);
    await fuelLog.save();
    return fuelLog.toObject();
};

const remove = async (id) => {
    const fuelLog = await FuelLog.findById(id);
    if (!fuelLog) throw ApiError.notFound('Fuel log not found');
    await FuelLog.findByIdAndDelete(id);
};

// --- Efficiency ---

const getEfficiency = async (vehicleId, startDate, endDate) => {
    const vehicle = await Vehicle.findById(vehicleId).lean();
    if (!vehicle) throw ApiError.notFound('Vehicle not found');

    const filter = { vehicle: vehicleId };
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }

    const fuelLogs = await FuelLog.find(filter).sort({ date: 1, createdAt: 1 }).lean();

    const totalLiters = fuelLogs.reduce((sum, log) => sum + (log.liters || 0), 0);

    let totalDistance = 0;
    const logsWithOdometer = fuelLogs.filter((log) => log.odometer != null);
    if (logsWithOdometer.length >= 2) {
        totalDistance = Math.max(0, logsWithOdometer[logsWithOdometer.length - 1].odometer - logsWithOdometer[0].odometer);
    }

    const efficiency = totalLiters > 0 ? +(totalDistance / totalLiters).toFixed(2) : null;

    return {
        totalLiters: +totalLiters.toFixed(2),
        totalDistance,
        efficiency,
        transactionCount: fuelLogs.length
    };
};

module.exports = { create, findAll, findById, update, remove, getEfficiency };
