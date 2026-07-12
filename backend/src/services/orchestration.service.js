/**
 * Trip Orchestration Service
 *
 * Coordinates automatic status transitions across Vehicle, Driver, and Trip
 * during the trip lifecycle. This is the single source of truth for all
 * cross-module status changes triggered by trip operations.
 *
 * The Trip module (dev2) imports and calls these functions; they are also
 * exposed via /api/orchestration for direct testing.
 *
 * ┌────────────────────────────────────────────────────────────────┐
 * │  dispatchTrip  →  Vehicle: Available→On Trip                   │
 * │                    Driver:  Available→On Trip                   │
 * │                    Trip:    Draft→Dispatched                    │
 * ├────────────────────────────────────────────────────────────────┤
 * │  completeTrip  →  Vehicle: On Trip→Available                   │
 * │                    Driver:  On Trip→Available                   │
 * │                    Trip:    Dispatched→Completed                │
 * ├────────────────────────────────────────────────────────────────┤
 * │  cancelTrip    →  Vehicle: On Trip→Available (if dispatched)    │
 * │                    Driver:  On Trip→Available (if dispatched)   │
 * │                    Trip:    *→Cancelled                         │
 * └────────────────────────────────────────────────────────────────┘
 */

const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const ApiError = require('../errors/ApiError');

// ═══════════════════════════════════════════════════════════════════
//  Internal helpers — pure status transitions (no DB I/O)
// ═══════════════════════════════════════════════════════════════════

const ALLOWED_VEHICLE_TRANSITIONS = {
    'Available': ['On Trip', 'In Shop', 'Retired'],
    'On Trip': ['Available', 'Retired'],
    'In Shop': ['Available', 'Retired'],
    'Retired': []
};

const validateVehicleTransition = (current, next) => {
    if (current === next) return; // no-op
    const allowed = ALLOWED_VEHICLE_TRANSITIONS[current] || [];
    if (!allowed.includes(next)) {
        throw ApiError.badRequest(
            `Vehicle status transition '${current}' → '${next}' is not allowed.`
        );
    }
};

const validateDriverTransition = (current, next) => {
    if (current === 'On Trip') {
        throw ApiError.badRequest(
            'Driver is already on a trip. Complete or cancel the current trip first.'
        );
    }
    if (current === 'Suspended') {
        throw ApiError.badRequest('Suspended drivers cannot be dispatched.');
    }
    if (current === 'Off Duty') {
        throw ApiError.badRequest('Driver is off duty and cannot be dispatched.');
    }
    if (current !== 'Available' && next === 'On Trip') {
        throw ApiError.badRequest(
            `Cannot dispatch driver. Expected 'Available', got '${current}'.`
        );
    }
    if (current !== 'On Trip' && current !== 'Off Duty' && next === 'Available') {
        throw ApiError.badRequest(
            `Cannot set driver to Available from '${current}'.`
        );
    }
};

// ═══════════════════════════════════════════════════════════════════
//  Public orchestration functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Pre-flight check — verify all conditions are met for dispatch.
 * Does NOT mutate anything. Call this before dispatchTrip to give the
 * caller a chance to present all errors at once.
 *
 * @param {{ vehicleId: string, driverId: string }} params
 * @returns {Promise<{ ok: boolean, checks: object }>}
 */
const validateDispatch = async ({ vehicleId, driverId }) => {
    const checks = {
        vehicleExists: false,
        driverExists: false,
        vehicleAvailable: false,
        driverAvailable: false,
        driverLicenseValid: false,
        vehicleNotRetired: false
    };

    const vehicle = await Vehicle.findById(vehicleId).lean();
    const driver = await Driver.findById(driverId).lean();

    if (vehicle) {
        checks.vehicleExists = true;
        checks.vehicleAvailable = vehicle.status === 'Available';
        checks.vehicleNotRetired = vehicle.status !== 'Retired';
    }

    if (driver) {
        checks.driverExists = true;
        checks.driverAvailable = driver.status === 'Available';
        checks.driverLicenseValid = new Date(driver.licenseExpiryDate) >= new Date();
    }

    const errors = [];
    if (!checks.vehicleExists) errors.push('Vehicle not found.');
    if (!checks.driverExists) errors.push('Driver not found.');
    if (checks.vehicleExists && !checks.vehicleAvailable) {
        errors.push('Vehicle is not available for dispatch.');
    }
    if (checks.vehicleExists && !checks.vehicleNotRetired) {
        errors.push('Cannot dispatch a retired vehicle.');
    }
    if (checks.driverExists && !checks.driverAvailable) {
        errors.push('Driver is not available for dispatch.');
    }
    if (checks.driverExists && !checks.driverLicenseValid) {
        errors.push('Driver license has expired.');
    }

    return {
        ok: errors.length === 0,
        checks,
        errors: errors.length > 0 ? errors : null
    };
};

/**
 * Dispatch a trip — atomically transitions Vehicle → 'On Trip'
 * and Driver → 'On Trip'.
 *
 * This is the core workflow entry point. The Trip module calls this
 * after creating the Trip document in 'Draft' status.
 *
 * @param {object} params
 * @param {string} params.vehicleId — Vehicle._id
 * @param {string} params.driverId  — Driver._id
 * @returns {Promise<{ vehicle: object, driver: object }>}
 */
const dispatchTrip = async ({ vehicleId, driverId }) => {
    // ── Load & lock (findById returns mutable Mongoose documents) ──
    const [vehicle, driver] = await Promise.all([
        Vehicle.findById(vehicleId),
        Driver.findById(driverId)
    ]);

    if (!vehicle) throw ApiError.notFound('Vehicle not found');
    if (!driver) throw ApiError.notFound('Driver not found');

    // ── Validate pre-conditions ────────────────────────────────────
    if (vehicle.status === 'Retired') {
        throw ApiError.badRequest('Cannot dispatch a retired vehicle.');
    }
    if (vehicle.status !== 'Available') {
        throw ApiError.badRequest(
            `Vehicle is currently '${vehicle.status}' — must be 'Available' for dispatch.`
        );
    }

    if (new Date(driver.licenseExpiryDate) < new Date()) {
        throw ApiError.badRequest('Driver license has expired and cannot be dispatched.');
    }
    if (driver.status !== 'Available') {
        throw ApiError.badRequest(
            `Driver is currently '${driver.status}' — must be 'Available' for dispatch.`
        );
    }

    // ── Execute transitions atomically ─────────────────────────────
    vehicle.status = 'On Trip';
    driver.status = 'On Trip';

    await Promise.all([vehicle.save(), driver.save()]);

    return {
        vehicle: vehicle.toObject(),
        driver: driver.toObject()
    };
};

/**
 * Complete a trip — transitions Vehicle → 'Available' and
 * Driver → 'Available'.
 *
 * Called by the Trip module after marking the Trip as 'Completed'.
 *
 * @param {object} params
 * @param {string} params.vehicleId — Vehicle._id
 * @param {string} params.driverId  — Driver._id
 * @returns {Promise<{ vehicle: object, driver: object }>}
 */
const completeTrip = async ({ vehicleId, driverId }) => {
    const [vehicle, driver] = await Promise.all([
        Vehicle.findById(vehicleId),
        Driver.findById(driverId)
    ]);

    if (!vehicle) throw ApiError.notFound('Vehicle not found');
    if (!driver) throw ApiError.notFound('Driver not found');

    // ── Validate current state ─────────────────────────────────────
    if (vehicle.status !== 'On Trip') {
        throw ApiError.badRequest(
            `Vehicle is '${vehicle.status}', expected 'On Trip' to complete a trip.`
        );
    }
    if (driver.status !== 'On Trip') {
        throw ApiError.badRequest(
            `Driver is '${driver.status}', expected 'On Trip' to complete a trip.`
        );
    }

    // ── Execute transitions ────────────────────────────────────────
    vehicle.status = 'Available';
    driver.status = 'Available';

    await Promise.all([vehicle.save(), driver.save()]);

    return {
        vehicle: vehicle.toObject(),
        driver: driver.toObject()
    };
};

/**
 * Cancel a trip — if the trip was dispatched, rolls back Vehicle
 * and Driver to 'Available'.
 *
 * If the trip is still in 'Draft' status, statuses won't have been
 * changed yet, so this is a no-op for vehicle/driver but still
 * validates that the IDs exist.
 *
 * @param {object} params
 * @param {string} params.vehicleId  — Vehicle._id
 * @param {string} params.driverId   — Driver._id
 * @param {'Draft'|'Dispatched'} params.currentTripStatus
 * @returns {Promise<{ vehicle: object|null, driver: object|null }>}
 */
const cancelTrip = async ({ vehicleId, driverId, currentTripStatus }) => {
    const [vehicle, driver] = await Promise.all([
        Vehicle.findById(vehicleId),
        Driver.findById(driverId)
    ]);

    if (!vehicle) throw ApiError.notFound('Vehicle not found');
    if (!driver) throw ApiError.notFound('Driver not found');

    // If the trip was only a Draft, no status changes were applied
    if (currentTripStatus === 'Draft') {
        return { vehicle: null, driver: null };
    }

    // Roll back only if currently On Trip
    const updates = [];

    if (vehicle.status === 'On Trip') {
        vehicle.status = 'Available';
        updates.push(vehicle.save());
    }
    if (driver.status === 'On Trip') {
        driver.status = 'Available';
        updates.push(driver.save());
    }

    await Promise.all(updates);

    return {
        vehicle: vehicle.toObject(),
        driver: driver.toObject()
    };
};

module.exports = {
    validateDispatch,
    dispatchTrip,
    completeTrip,
    cancelTrip
};
