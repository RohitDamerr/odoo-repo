const Driver = require('../../models/Driver');
const ApiError = require('../../errors/ApiError');

const VALID_MANUAL_TRANSITIONS = {
    Available: ['Off Duty', 'Suspended'],
    'Off Duty': ['Available', 'Suspended'],
    Suspended: ['Available'],
};

const create = async (data) => {
    const driver = await Driver.create({ ...data, status: 'Available' });
    return driver;
};

const findAll = async (query = {}) => {
    const { status, licenseCategory, search, page = 1, limit = 20, sort = '-createdAt' } = query;

    const filter = {};
    if (status) filter.status = status;
    if (licenseCategory) filter.licenseCategory = { $regex: licenseCategory, $options: 'i' };
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { licenseNumber: { $regex: search, $options: 'i' } }
        ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDir = sort.startsWith('-') ? -1 : 1;

    const [drivers, total] = await Promise.all([
        Driver.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limitNum).lean(),
        Driver.countDocuments(filter)
    ]);

    return { drivers, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) };
};

const findById = async (id) => {
    const driver = await Driver.findById(id).lean();
    if (!driver) throw ApiError.notFound('Driver not found');
    return driver;
};

const update = async (id, data) => {
    const driver = await Driver.findById(id);
    if (!driver) throw ApiError.notFound('Driver not found');

    delete data.status; // status changes only via updateStatus() or Trip module

    Object.assign(driver, data);
    await driver.save();
    return driver.toObject();
};

const remove = async (id) => {
    const driver = await Driver.findById(id);
    if (!driver) throw ApiError.notFound('Driver not found');

    if (driver.status === 'On Trip') {
        throw ApiError.badRequest(
            'Cannot delete a driver who is currently on a trip. Complete or cancel the trip first.'
        );
    }

    await Driver.findByIdAndDelete(id);
};

// --- Status management ---

const updateStatus = async (id, newStatus) => {
    const driver = await Driver.findById(id);
    if (!driver) throw ApiError.notFound('Driver not found');

    const current = driver.status;

    if (current === 'On Trip') {
        throw ApiError.badRequest(
            'Drivers on a trip cannot have their status changed manually. Complete or cancel the trip first.'
        );
    }

    if (newStatus === 'On Trip') {
        throw ApiError.badRequest(
            '"On Trip" status cannot be set manually. It is assigned automatically when a trip is dispatched.'
        );
    }

    if (current === newStatus) return driver.toObject();

    const allowed = VALID_MANUAL_TRANSITIONS[current] || [];
    if (!allowed.includes(newStatus)) {
        throw ApiError.badRequest(
            `Invalid status transition: '${current}' → '${newStatus}'. ` +
            `Allowed transitions from '${current}': ${allowed.length ? allowed.join(', ') : 'none'}.`
        );
    }

    driver.status = newStatus;
    await driver.save();
    return driver.toObject();
};

// --- Dispatch gate (called by TripService) ---

const isAvailableForDispatch = async (driverId) => {
    const driver = await Driver.findById(driverId).lean();
    if (!driver) return { ok: false, reason: 'Driver not found.' };

    if (driver.status === 'Suspended') return { ok: false, reason: 'Driver is suspended and cannot be dispatched.' };
    if (driver.status === 'On Trip') return { ok: false, reason: 'Driver is already on another trip.' };
    if (driver.status === 'Off Duty') return { ok: false, reason: 'Driver is off duty and not available for dispatch.' };
    if (new Date(driver.licenseExpiryDate) < new Date()) return { ok: false, reason: 'Driver\'s license has expired.' };

    return { ok: true };
};

const isLicenseValid = async (driverId) => {
    const driver = await Driver.findById(driverId).lean();
    if (!driver) throw ApiError.notFound('Driver not found');
    return new Date(driver.licenseExpiryDate) >= new Date();
};

// --- Trip module hooks ---

const markOnTrip = async (driverId) => {
    const driver = await Driver.findById(driverId);
    if (!driver) throw ApiError.notFound('Driver not found');

    if (driver.status !== 'Available') {
        throw ApiError.badRequest(
            `Cannot dispatch driver. Expected status 'Available' but driver is '${driver.status}'.`
        );
    }

    driver.status = 'On Trip';
    await driver.save();
    return driver.toObject();
};

const markAvailable = async (driverId) => {
    const driver = await Driver.findById(driverId);
    if (!driver) throw ApiError.notFound('Driver not found');

    if (driver.status !== 'On Trip' && driver.status !== 'Off Duty') {
        throw ApiError.badRequest(
            `Cannot set driver to Available. Current status is '${driver.status}'. Expected 'On Trip' or 'Off Duty'.`
        );
    }

    driver.status = 'Available';
    await driver.save();
    return driver.toObject();
};

module.exports = { create, findAll, findById, update, remove, updateStatus, isAvailableForDispatch, isLicenseValid, markOnTrip, markAvailable };
