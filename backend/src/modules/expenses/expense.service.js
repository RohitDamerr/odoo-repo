const Expense = require('../../models/Expense');
const Vehicle = require('../../models/Vehicle');
const Trip = require('../../models/Trip');
const ApiError = require('../../errors/ApiError');

const create = async (data) => {
    const vehicle = await Vehicle.findById(data.vehicle).lean();
    if (!vehicle) throw ApiError.notFound('Vehicle not found');

    if (data.trip) {
        const trip = await Trip.findById(data.trip).lean();
        if (!trip) throw ApiError.notFound('Trip not found');
    }

    return await Expense.create(data);
};

const findAll = async (query = {}) => {
    const { vehicle, trip, type, startDate, endDate, page = 1, limit = 20, sort = '-date' } = query;

    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (trip) filter.trip = trip;
    if (type) filter.type = type;
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

    const [expenses, total] = await Promise.all([
        Expense.find(filter)
            .populate('vehicle', 'name registrationNumber type')
            .populate('trip', 'source destination status')
            .sort({ [sortField]: sortDir }).skip(skip).limit(limitNum).lean(),
        Expense.countDocuments(filter)
    ]);

    return { expenses, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) };
};

const findById = async (id) => {
    const expense = await Expense.findById(id)
        .populate('vehicle', 'name registrationNumber type')
        .populate('trip', 'source destination status')
        .lean();

    if (!expense) throw ApiError.notFound('Expense not found');
    return expense;
};

const update = async (id, data) => {
    const expense = await Expense.findById(id);
    if (!expense) throw ApiError.notFound('Expense not found');

    if (data.vehicle) {
        const vehicle = await Vehicle.findById(data.vehicle).lean();
        if (!vehicle) throw ApiError.notFound('Vehicle not found');
    }
    if (data.trip) {
        const trip = await Trip.findById(data.trip).lean();
        if (!trip) throw ApiError.notFound('Trip not found');
    }

    Object.assign(expense, data);
    await expense.save();
    return expense.toObject();
};

const remove = async (id) => {
    const expense = await Expense.findById(id);
    if (!expense) throw ApiError.notFound('Expense not found');
    await Expense.findByIdAndDelete(id);
};

const aggregateByVehicle = async (vehicleId) => {
    const vehicle = await Vehicle.findById(vehicleId).lean();
    if (!vehicle) throw ApiError.notFound('Vehicle not found');

    const result = await Expense.aggregate([
        { $match: { vehicle: vehicle._id } },
        { $group: { _id: '$type', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { totalAmount: -1 } }
    ]);

    const breakdown = result.map((r) => ({ type: r._id, totalAmount: r.totalAmount, count: r.count }));
    const grandTotal = breakdown.reduce((sum, b) => sum + b.totalAmount, 0);

    return { vehicleId: vehicle._id, breakdown, grandTotal };
};

const aggregateByTrip = async (tripId) => {
    const trip = await Trip.findById(tripId).lean();
    if (!trip) throw ApiError.notFound('Trip not found');

    const result = await Expense.aggregate([
        { $match: { trip: trip._id } },
        { $group: { _id: '$type', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { totalAmount: -1 } }
    ]);

    const breakdown = result.map((r) => ({ type: r._id, totalAmount: r.totalAmount, count: r.count }));
    const grandTotal = breakdown.reduce((sum, b) => sum + b.totalAmount, 0);

    return { tripId: trip._id, breakdown, grandTotal };
};

module.exports = { create, findAll, findById, update, remove, aggregateByVehicle, aggregateByTrip };
