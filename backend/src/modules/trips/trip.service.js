const Trip = require('../../models/Trip');
const Vehicle = require('../../models/Vehicle');
const Driver = require('../../models/Driver');
const ApiError = require('../../errors/ApiError');

// --- CRUD ---

const create = async (data) => {
    const vehicle = await Vehicle.findById(data.vehicle).lean();
    if (!vehicle) throw ApiError.notFound('Vehicle not found');

    const driver = await Driver.findById(data.driver).lean();
    if (!driver) throw ApiError.notFound('Driver not found');

    if (data.cargoWeight > vehicle.maxLoadCapacity) {
        throw ApiError.badRequest(
            `Cargo weight (${data.cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxLoadCapacity} kg).`
        );
    }

    return await Trip.create({ ...data, status: 'Draft' });
};

const findAll = async (query = {}) => {
    const { status, vehicle, driver, startDate, endDate, page = 1, limit = 20, sort = '-createdAt' } = query;

    const filter = {};
    if (status) filter.status = status;
    if (vehicle) filter.vehicle = vehicle;
    if (driver) filter.driver = driver;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDir = sort.startsWith('-') ? -1 : 1;

    const [trips, total] = await Promise.all([
        Trip.find(filter)
            .populate('vehicle', 'name registrationNumber type maxLoadCapacity status')
            .populate('driver', 'name licenseNumber licenseCategory status')
            .sort({ [sortField]: sortDir }).skip(skip).limit(limitNum).lean(),
        Trip.countDocuments(filter)
    ]);

    return { trips, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) };
};

const findById = async (id) => {
    const trip = await Trip.findById(id)
        .populate('vehicle', 'name registrationNumber type maxLoadCapacity status')
        .populate('driver', 'name licenseNumber licenseCategory licenseExpiryDate status safetyScore contactNumber')
        .lean();

    if (!trip) throw ApiError.notFound('Trip not found');
    return trip;
};

const update = async (id, data) => {
    const trip = await Trip.findById(id);
    if (!trip) throw ApiError.notFound('Trip not found');

    if (trip.status !== 'Draft') {
        throw ApiError.badRequest('Only Draft trips can be edited.');
    }

    if (data.vehicle) {
        const vehicle = await Vehicle.findById(data.vehicle).lean();
        if (!vehicle) throw ApiError.notFound('Vehicle not found');
    }
    if (data.driver) {
        const driver = await Driver.findById(data.driver).lean();
        if (!driver) throw ApiError.notFound('Driver not found');
    }

    Object.assign(trip, data);
    await trip.save();
    return trip.toObject();
};

const remove = async (id) => {
    const trip = await Trip.findById(id);
    if (!trip) throw ApiError.notFound('Trip not found');

    if (trip.status !== 'Draft') {
        throw ApiError.badRequest('Only Draft trips can be deleted.');
    }

    await Trip.findByIdAndDelete(id);
};

// --- Dispatch (R4-R10 enforced) ---

const dispatch = async (id) => {
    const trip = await Trip.findById(id).populate('vehicle driver');
    if (!trip) throw ApiError.notFound('Trip not found');

    if (trip.status !== 'Draft') {
        throw ApiError.badRequest(`Cannot dispatch a trip with status '${trip.status}'. Only Draft trips can be dispatched.`);
    }

    const vehicle = trip.vehicle;
    const driver = trip.driver;

    if (!vehicle) throw ApiError.notFound('Vehicle not found for this trip');
    if (vehicle.status === 'Retired') throw ApiError.badRequest('Retired vehicles cannot be dispatched.');
    if (vehicle.status === 'In Shop') throw ApiError.badRequest('Vehicles in the shop cannot be dispatched.');
    if (vehicle.status === 'On Trip') throw ApiError.badRequest('Vehicle is already on another trip.');

    if (vehicle.status !== 'Available') {
        throw ApiError.badRequest(`Vehicle is not available. Current status: ${vehicle.status}.`);
    }

    if (!driver) throw ApiError.notFound('Driver not found for this trip');
    if (driver.status === 'Suspended') throw ApiError.badRequest('Suspended drivers cannot be dispatched.');
    if (driver.status === 'On Trip') throw ApiError.badRequest('Driver is already on another trip.');
    if (driver.status === 'Off Duty') throw ApiError.badRequest('Driver is off duty and not available for dispatch.');
    if (driver.status !== 'Available') {
        throw ApiError.badRequest(`Driver is not available. Current status: ${driver.status}.`);
    }
    if (new Date(driver.licenseExpiryDate) < new Date()) {
        throw ApiError.badRequest('Driver license has expired.');
    }

    if (trip.cargoWeight > vehicle.maxLoadCapacity) {
        throw ApiError.badRequest(
            `Cargo weight (${trip.cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxLoadCapacity} kg).`
        );
    }

    await Vehicle.findByIdAndUpdate(vehicle._id, { status: 'On Trip' });
    await Driver.findByIdAndUpdate(driver._id, { status: 'On Trip' });

    trip.status = 'Dispatched';
    trip.dispatchedAt = new Date();
    await trip.save();

    return await Trip.findById(id)
        .populate('vehicle', 'name registrationNumber type status')
        .populate('driver', 'name licenseNumber status')
        .lean();
};

// --- Complete (R11-R12 enforced) ---

const complete = async (id, { actualOdometer, fuelConsumed }) => {
    const trip = await Trip.findById(id).populate('vehicle driver');
    if (!trip) throw ApiError.notFound('Trip not found');

    if (trip.status !== 'Dispatched') {
        throw ApiError.badRequest(`Cannot complete a trip with status '${trip.status}'. Only Dispatched trips can be completed.`);
    }

    const vehicleUpdate = { status: 'Available' };
    if (actualOdometer != null && actualOdometer > trip.vehicle.odometer) {
        vehicleUpdate.odometer = actualOdometer;
    }

    await Vehicle.findByIdAndUpdate(trip.vehicle._id, vehicleUpdate);
    await Driver.findByIdAndUpdate(trip.driver._id, { status: 'Available' });

    trip.status = 'Completed';
    trip.actualOdometer = actualOdometer;
    trip.completedAt = new Date();
    if (fuelConsumed != null) trip.fuelConsumed = fuelConsumed;
    await trip.save();

    return await Trip.findById(id)
        .populate('vehicle', 'name registrationNumber type status')
        .populate('driver', 'name licenseNumber status')
        .lean();
};

// --- Cancel (R13 enforced) ---

const cancel = async (id) => {
    const trip = await Trip.findById(id).populate('vehicle driver');
    if (!trip) throw ApiError.notFound('Trip not found');

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
        throw ApiError.badRequest(`Cannot cancel a trip with status '${trip.status}'. It is already terminal.`);
    }

    const wasDispatched = trip.status === 'Dispatched';

    if (wasDispatched) {
        await Vehicle.findByIdAndUpdate(trip.vehicle._id, { status: 'Available' });
        await Driver.findByIdAndUpdate(trip.driver._id, { status: 'Available' });
    }

    trip.status = 'Cancelled';
    trip.cancelledAt = new Date();
    await trip.save();

    return await Trip.findById(id)
        .populate('vehicle', 'name registrationNumber type status')
        .populate('driver', 'name licenseNumber status')
        .lean();
};

module.exports = { create, findAll, findById, update, remove, dispatch, complete, cancel };
