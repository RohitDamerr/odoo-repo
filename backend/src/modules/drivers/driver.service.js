const Driver = require('../../models/Driver');
const ApiError = require('../../errors/ApiError');

// ══════════════════════════════════════════════════════════════════════
//  Valid status transitions anyone OTHER than TripService is allowed to make.
//  TripService calls markOnTrip() / markAvailable() directly — those bypass
//  this guard.
// ══════════════════════════════════════════════════════════════════════

const VALID_MANUAL_TRANSITIONS = {
    Available: ['Off Duty', 'Suspended'],
    'Off Duty': ['Available', 'Suspended'],
    Suspended: ['Available'],
    // 'On Trip' is NOT listed — only TripService may transition out of it
};

// ══════════════════════════════════════════════════════════════════════
//  CRUD
// ══════════════════════════════════════════════════════════════════════

/**
 * Register a new driver.
 * Status always starts as 'Available'.
 *
 * @param {object} data - { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore? }
 * @returns {Promise<Document>}
 */
const create = async (data) => {
    const driver = await Driver.create({
        ...data,
        status: 'Available'          // never trust caller-supplied status
    });
    return driver;
};

/**
 * List drivers with pagination, filtering, search, and sort.
 *
 * Query params:
 *  - status       Filter by exact status
 *  - licenseCategory  Filter by license category
 *  - search       Free-text search across name & licenseNumber
 *  - page         Page number (default 1)
 *  - limit        Items per page (default 20, max 100)
 *  - sort         Field to sort by (prefix with - for desc, e.g. -createdAt)
 *
 * @param {object} query - req.query
 * @returns {Promise<{ drivers: Document[], page: number, limit: number, total: number, totalPages: number }>}
 */
const findAll = async (query = {}) => {
    const {
        status,
        licenseCategory,
        search,
        page = 1,
        limit = 20,
        sort = '-createdAt'
    } = query;

    const filter = {};

    if (status) {
        filter.status = status;
    }

    if (licenseCategory) {
        filter.licenseCategory = { $regex: licenseCategory, $options: 'i' };
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { licenseNumber: { $regex: search, $options: 'i' } }
        ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Parse sort field — remove leading '-' for the field name
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDir = sort.startsWith('-') ? -1 : 1;

    const [drivers, total] = await Promise.all([
        Driver.find(filter)
            .sort({ [sortField]: sortDir })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Driver.countDocuments(filter)
    ]);

    return {
        drivers,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
    };
};

/**
 * Get a single driver by ID.
 *
 * @param {string} id
 * @returns {Promise<Document>}
 */
const findById = async (id) => {
    const driver = await Driver.findById(id).lean();
    if (!driver) {
        throw ApiError.notFound('Driver not found');
    }
    return driver;
};

/**
 * Update driver information.
 * The `status` field is stripped from the update — status changes must
 * go through `updateStatus()` or be triggered by the Trip module.
 *
 * @param {string} id
 * @param {object} data
 * @returns {Promise<Document>}
 */
const update = async (id, data) => {
    const driver = await Driver.findById(id);
    if (!driver) {
        throw ApiError.notFound('Driver not found');
    }

    // Status must NOT be changed via generic update.
    // Use the dedicated status endpoint or let the Trip module handle it.
    delete data.status;

    Object.assign(driver, data);
    await driver.save();

    return driver.toObject();
};

/**
 * Delete a driver. Blocked if the driver is currently 'On Trip'.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
const remove = async (id) => {
    const driver = await Driver.findById(id);
    if (!driver) {
        throw ApiError.notFound('Driver not found');
    }

    if (driver.status === 'On Trip') {
        throw ApiError.badRequest(
            'Cannot delete a driver who is currently on a trip. Complete or cancel the trip first.'
        );
    }

    await Driver.findByIdAndDelete(id);
};

// ══════════════════════════════════════════════════════════════════════
//  Status Management
// ══════════════════════════════════════════════════════════════════════

/**
 * Manually change a driver's status.
 *
 * Allowed transitions:
 *   Available → Off Duty | Suspended
 *   Off Duty  → Available | Suspended
 *   Suspended → Available
 *
 * Transitions TO 'On Trip' are REJECTED — only TripService.markOnTrip()
 * can set that status.
 *
 * Transitions FROM 'On Trip' are REJECTED — only TripService.markAvailable()
 * may release a driver from a trip.
 *
 * @param {string} id
 * @param {string} newStatus
 * @returns {Promise<Document>}
 */
const updateStatus = async (id, newStatus) => {
    const driver = await Driver.findById(id);
    if (!driver) {
        throw ApiError.notFound('Driver not found');
    }

    const current = driver.status;

    // Guard: On Trip transitions are exclusively managed by the Trip module
    if (current === 'On Trip') {
        throw ApiError.badRequest(
            'Drivers on a trip cannot have their status changed manually. ' +
            'Complete or cancel the trip first.'
        );
    }

    if (newStatus === 'On Trip') {
        throw ApiError.badRequest(
            '"On Trip" status cannot be set manually. It is assigned automatically when a trip is dispatched.'
        );
    }

    // No change
    if (current === newStatus) {
        return driver.toObject();
    }

    // Validate the transition
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

// ══════════════════════════════════════════════════════════════════════
//  Dispatch Gate  (called by TripService when dispatching)
// ══════════════════════════════════════════════════════════════════════

/**
 * Check whether a driver is eligible to be dispatched on a trip.
 *
 * Enforces:
 *   R4 — License must not be expired
 *   R5 — Driver must not be Suspended
 *   R6 — Driver must not already be On Trip
 *
 * Returns { ok: boolean, reason?: string } — never throws.
 * The TRIP module decides whether to abort the dispatch based on this.
 *
 * @param {string} driverId
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
const isAvailableForDispatch = async (driverId) => {
    const driver = await Driver.findById(driverId).lean();
    if (!driver) {
        return { ok: false, reason: 'Driver not found.' };
    }

    if (driver.status === 'Suspended') {
        return { ok: false, reason: 'Driver is suspended and cannot be dispatched.' };
    }

    if (driver.status === 'On Trip') {
        return { ok: false, reason: 'Driver is already on another trip.' };
    }

    if (driver.status === 'Off Duty') {
        return { ok: false, reason: 'Driver is off duty and not available for dispatch.' };
    }

    if (new Date(driver.licenseExpiryDate) < new Date()) {
        return { ok: false, reason: 'Driver\'s license has expired.' };
    }

    return { ok: true };
};

/**
 * Check whether a driver's license is still valid (not expired).
 *
 * @param {string} driverId
 * @returns {Promise<boolean>}
 */
const isLicenseValid = async (driverId) => {
    const driver = await Driver.findById(driverId).lean();
    if (!driver) {
        throw ApiError.notFound('Driver not found');
    }
    return new Date(driver.licenseExpiryDate) >= new Date();
};

// ══════════════════════════════════════════════════════════════════════
//  Trip Module Hooks  (called exclusively by TripService)
// ══════════════════════════════════════════════════════════════════════

/**
 * Mark a driver as 'On Trip'.
 * Called by TripService during dispatch — MUST NOT be called from anywhere else.
 *
 * Only transitions from 'Available' are accepted.
 *
 * @param {string} driverId
 * @returns {Promise<Document>}
 */
const markOnTrip = async (driverId) => {
    const driver = await Driver.findById(driverId);
    if (!driver) {
        throw ApiError.notFound('Driver not found');
    }

    if (driver.status !== 'Available') {
        throw ApiError.badRequest(
            `Cannot dispatch driver. Expected status 'Available' but driver is '${driver.status}'.`
        );
    }

    driver.status = 'On Trip';
    await driver.save();
    return driver.toObject();
};

/**
 * Mark a driver as 'Available'.
 * Called by TripService during trip complete / cancel.
 *
 * Accepts transitions from 'On Trip' or 'Off Duty'.
 *
 * @param {string} driverId
 * @returns {Promise<Document>}
 */
const markAvailable = async (driverId) => {
    const driver = await Driver.findById(driverId);
    if (!driver) {
        throw ApiError.notFound('Driver not found');
    }

    if (driver.status !== 'On Trip' && driver.status !== 'Off Duty') {
        throw ApiError.badRequest(
            `Cannot set driver to Available. Current status is '${driver.status}'. ` +
            `Expected 'On Trip' or 'Off Duty'.`
        );
    }

    driver.status = 'Available';
    await driver.save();
    return driver.toObject();
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove,
    updateStatus,
    isAvailableForDispatch,
    isLicenseValid,
    markOnTrip,
    markAvailable
};
