/**
 * Cross-Module Integration Service
 *
 * Hooks that keep data synchronised across modules without tight coupling.
 * Each module calls these hooks after completing its own operation.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Maintenance close  →  Expense record (type: maintenance)       │
 * │  Trip complete      →  Fuel log (if fuelConsumed)               │
 * │  Fuel log create    →  Expense record (type: fuel)              │
 * │  Trip complete      →  Expense record (fuel cost)               │
 * └─────────────────────────────────────────────────────────────────┘
 */

const Expense = require('../models/Expense');
const FuelLog = require('../models/FuelLog');

/**
 * After closing a maintenance job, create a corresponding expense record
 * if the job had a cost.
 *
 * Called from: maintenance.service.js → close()
 *
 * @param {object} maintenanceLog — populated maintenance log document
 */
const onCreateMaintenanceExpense = async (maintenanceLog) => {
    if (!maintenanceLog.cost || maintenanceLog.cost <= 0) return null;

    const exists = await Expense.findOne({
        description: `[Auto] Maintenance: ${maintenanceLog.description}`,
        vehicle: maintenanceLog.vehicle?._id || maintenanceLog.vehicle,
        type: 'maintenance'
    });

    if (exists) return null; // already synced

    return Expense.create({
        vehicle: maintenanceLog.vehicle?._id || maintenanceLog.vehicle,
        type: 'maintenance',
        amount: maintenanceLog.cost,
        description: `[Auto] Maintenance: ${maintenanceLog.description}`,
        date: maintenanceLog.endDate || new Date()
    });
};

/**
 * After completing a trip with fuel consumed, create a fuel log
 * and a corresponding expense record.
 *
 * Called from: trip.service.js → complete()
 *
 * @param {object} trip — populated trip document (after completion)
 */
const onTripCompleteFuel = async (trip) => {
    if (!trip.fuelConsumed || trip.fuelConsumed <= 0) return null;

    // Create fuel log
    const fuelLog = await FuelLog.create({
        vehicle: trip.vehicle?._id || trip.vehicle,
        trip: trip._id,
        liters: trip.fuelConsumed,
        cost: 0, // cost is unknown at trip-completion time
        odometer: trip.actualOdometer || null,
        date: trip.completedAt || new Date()
    });

    return fuelLog;
};

/**
 * After creating a fuel log with a cost, create a corresponding
 * expense record.
 *
 * Called from: fuel.service.js → create()
 *
 * @param {object} fuelLog — created fuel log document
 */
const onFuelLogExpense = async (fuelLog) => {
    if (!fuelLog.cost || fuelLog.cost <= 0) return null;

    const exists = await Expense.findOne({
        vehicle: fuelLog.vehicle,
        type: 'fuel',
        date: fuelLog.date
    });

    if (exists) return null;

    return Expense.create({
        vehicle: fuelLog.vehicle,
        trip: fuelLog.trip || null,
        type: 'fuel',
        amount: fuelLog.cost,
        description: `[Auto] Fuel: ${fuelLog.liters}L`,
        date: fuelLog.date || new Date()
    });
};

module.exports = {
    onCreateMaintenanceExpense,
    onTripCompleteFuel,
    onFuelLogExpense
};
