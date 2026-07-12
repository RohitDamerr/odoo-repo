const Vehicle = require('../../models/Vehicle');
const Trip = require('../../models/Trip');
const ApiError = require('../../errors/ApiError');

/**
 * Create a new vehicle.
 *
 * @param {object} data — Validated vehicle fields
 * @returns {Promise<object>} Created vehicle document
 */
const create = async (data) => {
    // Guard against duplicate registration number
    const existing = await Vehicle.findOne({ registrationNumber: data.registrationNumber });
    if (existing) {
        throw ApiError.conflict(
            `A vehicle with registration number '${data.registrationNumber}' already exists`
        );
    }

    const vehicle = await Vehicle.create(data);
    return vehicle;
};

/**
 * List vehicles with filtering, search, and pagination.
 *
 * @param {object} query
 * @param {number} query.page       — 1-based page number
 * @param {number} query.limit      — Items per page (max 100)
 * @param {string} query.sort       — Sort field (prefix with - for descending)
 * @param {string} [query.status]   — Filter by status
 * @param {string} [query.type]     — Filter by vehicle type
 * @param {string} [query.search]   — Search registrationNumber or name
 * @returns {Promise<{ vehicles: object[], total: number, page: number, totalPages: number }>}
 */
const findAll = async ({ page, limit, sort, status, type, search }) => {
    const filter = {};

    if (status) {
        filter.status = status;
    }

    if (type) {
        filter.type = type;
    }

    if (search) {
        // Case-insensitive regex search on registrationNumber and name
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
            { registrationNumber: { $regex: escaped, $options: 'i' } },
            { name: { $regex: escaped, $options: 'i' } }
        ];
    }

    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
        Vehicle.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Vehicle.countDocuments(filter)
    ]);

    return {
        vehicles,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Get a single vehicle by ID.
 *
 * @param {string} id — Vehicle MongoDB _id
 * @returns {Promise<object>} Vehicle document
 */
const findById = async (id) => {
    const vehicle = await Vehicle.findById(id).lean();
    if (!vehicle) {
        throw ApiError.notFound('Vehicle not found');
    }
    return vehicle;
};

/**
 * Update a vehicle's fields.
 *
 * @param {string} id   — Vehicle MongoDB _id
 * @param {object} data — Partial vehicle fields
 * @returns {Promise<object>} Updated vehicle document
 */
const update = async (id, data) => {
    // If registrationNumber is being changed, check uniqueness
    if (data.registrationNumber) {
        const existing = await Vehicle.findOne({
            registrationNumber: data.registrationNumber,
            _id: { $ne: id }
        });
        if (existing) {
            throw ApiError.conflict(
                `A vehicle with registration number '${data.registrationNumber}' already exists`
            );
        }
    }

    const vehicle = await Vehicle.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    }).lean();

    if (!vehicle) {
        throw ApiError.notFound('Vehicle not found');
    }

    return vehicle;
};

/**
 * Update a vehicle's status with business-rule validation.
 *
 * Valid transitions:
 *   Available  → On Trip   (dispatch)
 *   On Trip    → Available (return from trip)
 *   Available  → In Shop   (send to maintenance)
 *   On Trip    → In Shop   (breakdown — requires trip resolution first)
 *   In Shop    → Available (maintenance complete)
 *   Any status → Retired   (decommission)
 *
 * @param {string} id     — Vehicle MongoDB _id
 * @param {string} status — New status
 * @returns {Promise<object>} Updated vehicle document
 */
const updateStatus = async (id, status) => {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
        throw ApiError.notFound('Vehicle not found');
    }

    const current = vehicle.status;

    // Same status — no-op
    if (current === status) {
        throw ApiError.badRequest(`Vehicle is already '${status}'`);
    }

    // Enforce transition rules
    const allowed = {
        'Available': ['On Trip', 'In Shop', 'Retired'],
        'On Trip': ['Available', 'Retired'],
        'In Shop': ['Available', 'Retired'],
        'Retired': [] // Once retired, cannot transition back
    };

    if (!allowed[current].includes(status)) {
        throw ApiError.badRequest(
            `Cannot change status from '${current}' to '${status}'. ` +
            `Allowed transitions: ${allowed[current].join(', ') || 'none'}`
        );
    }

    // Prevent retiring a vehicle that's currently on an active trip
    if (status === 'Retired' && current === 'On Trip') {
        const activeTrip = await Trip.findOne({
            vehicle: id,
            status: { $in: ['Draft', 'Dispatched'] }
        });
        if (activeTrip) {
            throw ApiError.badRequest(
                'Cannot retire vehicle while it has an active trip. Complete or cancel the trip first.'
            );
        }
    }

    vehicle.status = status;
    await vehicle.save();

    return vehicle.toObject();
};

/**
 * Delete a vehicle.
 *
 * Safety: cannot delete a vehicle that has active trips.
 *
 * @param {string} id — Vehicle MongoDB _id
 */
const remove = async (id) => {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
        throw ApiError.notFound('Vehicle not found');
    }

    // Guard: don't allow deleting a vehicle with active trips
    const activeTrip = await Trip.findOne({
        vehicle: id,
        status: { $in: ['Draft', 'Dispatched'] }
    });
    if (activeTrip) {
        throw ApiError.badRequest(
            'Cannot delete vehicle while it has active or dispatched trips. Complete or cancel them first.'
        );
    }

    await Vehicle.findByIdAndDelete(id);
};

/**
 * Get aggregate counts grouped by status for dashboard summaries.
 *
 * @returns {Promise<{ total: number, byStatus: object }>}
 */
const getStats = async () => {
    const [total, byStatus] = await Promise.all([
        Vehicle.countDocuments(),
        Vehicle.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
    ]);

    // Convert [{ _id: 'Available', count: 5 }, ...] → { Available: 5, ... }
    const statusCounts = {
        Available: 0,
        'On Trip': 0,
        'In Shop': 0,
        Retired: 0
    };
    for (const entry of byStatus) {
        statusCounts[entry._id] = entry.count;
    }

    return { total, byStatus: statusCounts };
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    updateStatus,
    remove,
    getStats
};
