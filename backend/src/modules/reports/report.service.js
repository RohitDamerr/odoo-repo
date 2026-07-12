const Vehicle = require('../../models/Vehicle');
const Driver = require('../../models/Driver');
const FuelLog = require('../../models/FuelLog');
const MaintenanceLog = require('../../models/MaintenanceLog');
const Trip = require('../../models/Trip');
const Expense = require('../../models/Expense');

// ═══════════════════════════════════════════════════════════════════
//  Helper — build a date filter for Mongoose queries
// ═══════════════════════════════════════════════════════════════════

const dateFilter = (startDate, endDate, field = 'date') => {
    const filter = {};
    if (startDate || endDate) {
        filter[field] = {};
        if (startDate) filter[field].$gte = new Date(startDate);
        if (endDate) filter[field].$lte = new Date(endDate);
    }
    return filter;
};

// ═══════════════════════════════════════════════════════════════════
//  VEHICLE REPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Fleet overview — total vehicles, breakdown by status and type,
 * plus odometer totals.
 */
const vehicleOverview = async () => {
    const [total, byStatus, byType, odometerAgg] = await Promise.all([
        Vehicle.countDocuments(),
        Vehicle.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
        Vehicle.aggregate([{ $group: { _id: '$type', count: { $sum: 1 }, avgOdometer: { $avg: '$odometer' } } }, { $sort: { count: -1 } }]),
        Vehicle.aggregate([{ $group: { _id: null, totalOdometer: { $sum: '$odometer' }, avgOdometer: { $avg: '$odometer' }, maxOdometer: { $max: '$odometer' } } }])
    ]);

    // Convert arrays to keyed objects
    const statusMap = { Available: 0, 'On Trip': 0, 'In Shop': 0, Retired: 0 };
    for (const entry of byStatus) statusMap[entry._id] = entry.count;

    return {
        total,
        byStatus: statusMap,
        byType: byType.map(e => ({ type: e._id, count: e.count, avgOdometer: Math.round(e.avgOdometer || 0) })),
        odometer: odometerAgg[0] ? {
            total: odometerAgg[0].totalOdometer,
            average: Math.round(odometerAgg[0].avgOdometer),
            max: odometerAgg[0].maxOdometer
        } : { total: 0, average: 0, max: 0 }
    };
};

/**
 * Fleet value — total and average acquisition cost, breakdown by type.
 */
const vehicleValue = async () => {
    const [totalAgg, byType] = await Promise.all([
        Vehicle.aggregate([
            { $group: { _id: null, totalCost: { $sum: '$acquisitionCost' }, avgCost: { $avg: '$acquisitionCost' }, count: { $sum: 1 } } }
        ]),
        Vehicle.aggregate([
            { $group: { _id: '$type', totalCost: { $sum: '$acquisitionCost' }, avgCost: { $avg: '$acquisitionCost' }, count: { $sum: 1 } } },
            { $sort: { totalCost: -1 } }
        ])
    ]);

    const agg = totalAgg[0] || { totalCost: 0, avgCost: 0, count: 0 };

    return {
        totalAcquisitionCost: agg.totalCost,
        averageCost: Math.round(agg.avgCost),
        totalVehicles: agg.count,
        byType: byType.map(e => ({
            type: e._id,
            count: e.count,
            totalCost: e.totalCost,
            averageCost: Math.round(e.avgCost)
        }))
    };
};

// ═══════════════════════════════════════════════════════════════════
//  DRIVER REPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Driver overview — headcount by status, average safety score.
 */
const driverOverview = async () => {
    const [total, byStatus, safetyAgg] = await Promise.all([
        Driver.countDocuments(),
        Driver.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Driver.aggregate([{ $group: { _id: null, avgSafety: { $avg: '$safetyScore' }, minSafety: { $min: '$safetyScore' }, maxSafety: { $max: '$safetyScore' } } }])
    ]);

    const statusMap = { Available: 0, 'On Trip': 0, 'Off Duty': 0, Suspended: 0 };
    for (const entry of byStatus) statusMap[entry._id] = entry.count;

    const safety = safetyAgg[0] || { avgSafety: 0, minSafety: 0, maxSafety: 0 };

    return {
        total,
        byStatus: statusMap,
        safetyScore: {
            average: Math.round(safety.avgSafety),
            minimum: safety.minSafety,
            maximum: safety.maxSafety
        }
    };
};

/**
 * License expiry report — expired + upcoming expiries within 30/60/90 days.
 */
const driverLicenseExpiry = async () => {
    const now = new Date();
    const d30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const d60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const drivers = await Driver.find({}, 'name licenseNumber licenseCategory licenseExpiryDate status safetyScore').lean();

    const expired = [];
    const within30 = [];
    const within60 = [];
    const within90 = [];
    const valid = [];

    for (const d of drivers) {
        const exp = new Date(d.licenseExpiryDate);
        const record = { _id: d._id, name: d.name, licenseNumber: d.licenseNumber, licenseCategory: d.licenseCategory, licenseExpiryDate: d.licenseExpiryDate, status: d.status, safetyScore: d.safetyScore };
        if (exp < now) expired.push(record);
        else if (exp <= d30) within30.push(record);
        else if (exp <= d60) within60.push(record);
        else if (exp <= d90) within90.push(record);
        else valid.push(record);
    }

    return {
        total: drivers.length,
        expired: { count: expired.length, drivers: expired },
        within30Days: { count: within30.length, drivers: within30 },
        within60Days: { count: within60.length, drivers: within60 },
        within90Days: { count: within90.length, drivers: within90 },
        valid: { count: valid.length }
    };
};

// ═══════════════════════════════════════════════════════════════════
//  FUEL REPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Fuel consumption summary — total liters, total cost, breakdown by
 * vehicle. Supports optional date range.
 */
const fuelSummary = async ({ startDate, endDate }) => {
    const dateF = dateFilter(startDate, endDate, 'date');

    const [totalAgg, byVehicle] = await Promise.all([
        FuelLog.aggregate([
            { $match: dateF },
            { $group: { _id: null, totalLiters: { $sum: '$liters' }, totalCost: { $sum: '$cost' }, avgCostPerLiter: { $avg: { $cond: [{ $gt: ['$liters', 0] }, { $divide: ['$cost', '$liters'] }, 0] } }, transactionCount: { $sum: 1 } } }
        ]),
        FuelLog.aggregate([
            { $match: dateF },
            { $group: { _id: '$vehicle', totalLiters: { $sum: '$liters' }, totalCost: { $sum: '$cost' }, transactionCount: { $sum: 1 } } },
            { $sort: { totalCost: -1 } },
            { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
            { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
            { $project: { vehicleId: '$_id', registrationNumber: '$vehicle.registrationNumber', vehicleName: '$vehicle.name', totalLiters: 1, totalCost: 1, transactionCount: 1, _id: 0 } }
        ])
    ]);

    const agg = totalAgg[0] || { totalLiters: 0, totalCost: 0, avgCostPerLiter: 0, transactionCount: 0 };

    return {
        ...agg,
        totalLiters: +agg.totalLiters.toFixed(2),
        totalCost: +agg.totalCost.toFixed(2),
        avgCostPerLiter: +agg.avgCostPerLiter.toFixed(2),
        dateRange: { startDate: startDate || null, endDate: endDate || null },
        byVehicle
    };
};

/**
 * Fuel efficiency by vehicle — uses odometer readings from fuel logs
 * to calculate km driven and km/L efficiency per vehicle.
 */
const fuelEfficiency = async ({ startDate, endDate }) => {
    const dateF = dateFilter(startDate, endDate, 'date');

    // Get all fuel logs with odometer, grouped by vehicle, sorted by date
    const logs = await FuelLog.find({ ...dateF, odometer: { $ne: null } })
        .sort({ date: 1 })
        .populate('vehicle', 'registrationNumber name')
        .lean();

    // Group by vehicle
    const byVehicle = {};
    for (const log of logs) {
        const vid = log.vehicle?._id?.toString() || 'unknown';
        if (!byVehicle[vid]) {
            byVehicle[vid] = {
                vehicleId: vid,
                registrationNumber: log.vehicle?.registrationNumber || 'N/A',
                vehicleName: log.vehicle?.name || 'Unknown',
                logs: []
            };
        }
        byVehicle[vid].logs.push(log);
    }

    // Calculate efficiency per vehicle
    const results = [];
    for (const entry of Object.values(byVehicle)) {
        const sorted = entry.logs;
        const totalLiters = sorted.reduce((s, l) => s + l.liters, 0);

        let totalDistance = 0;
        if (sorted.length >= 2) {
            totalDistance = Math.max(0, sorted[sorted.length - 1].odometer - sorted[0].odometer);
        }

        results.push({
            vehicleId: entry.vehicleId,
            registrationNumber: entry.registrationNumber,
            vehicleName: entry.vehicleName,
            totalLiters: +totalLiters.toFixed(2),
            totalDistance,
            efficiency: totalLiters > 0 ? +(totalDistance / totalLiters).toFixed(2) : null,
            dataPoints: sorted.length
        });
    }

    // Sort by efficiency descending
    results.sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0));

    return {
        dateRange: { startDate: startDate || null, endDate: endDate || null },
        vehicles: results
    };
};

// ═══════════════════════════════════════════════════════════════════
//  MAINTENANCE REPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Maintenance summary — active/closed counts, total cost, breakdown
 * by type. Supports optional date range (on startDate).
 */
const maintenanceSummary = async ({ startDate, endDate }) => {
    const dateF = dateFilter(startDate, endDate, 'startDate');

    const [total, active, closed, costAgg, byType] = await Promise.all([
        MaintenanceLog.countDocuments(dateF),
        MaintenanceLog.countDocuments({ ...dateF, status: 'Active' }),
        MaintenanceLog.countDocuments({ ...dateF, status: 'Closed' }),
        MaintenanceLog.aggregate([
            { $match: dateF },
            { $group: { _id: null, totalCost: { $sum: '$cost' }, avgCost: { $avg: '$cost' } } }
        ]),
        MaintenanceLog.aggregate([
            { $match: dateF },
            { $group: { _id: '$type', count: { $sum: 1 }, totalCost: { $sum: '$cost' }, avgCost: { $avg: '$cost' } } },
            { $sort: { count: -1 } }
        ])
    ]);

    const cost = costAgg[0] || { totalCost: 0, avgCost: 0 };

    return {
        total,
        active,
        closed,
        totalCost: +cost.totalCost.toFixed(2),
        averageCost: +cost.avgCost.toFixed(2),
        dateRange: { startDate: startDate || null, endDate: endDate || null },
        byType: byType.map(e => ({
            type: e._id,
            count: e.count,
            totalCost: +e.totalCost.toFixed(2),
            averageCost: +(e.avgCost.toFixed(2))
        }))
    };
};

/**
 * Maintenance cost by vehicle — grouped + sorted by total cost.
 */
const maintenanceCostByVehicle = async ({ startDate, endDate }) => {
    const dateF = dateFilter(startDate, endDate, 'startDate');

    const byVehicle = await MaintenanceLog.aggregate([
        { $match: dateF },
        { $group: { _id: '$vehicle', totalCost: { $sum: '$cost' }, jobCount: { $sum: 1 }, avgCost: { $avg: '$cost' } } },
        { $sort: { totalCost: -1 } },
        { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
        { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
        { $project: { vehicleId: '$_id', registrationNumber: '$vehicle.registrationNumber', vehicleName: '$vehicle.name', totalCost: { $round: ['$totalCost', 2] }, jobCount: 1, avgCost: { $round: ['$avgCost', 2] }, _id: 0 } }
    ]);

    return {
        dateRange: { startDate: startDate || null, endDate: endDate || null },
        byVehicle
    };
};

/**
 * Vehicle downtime — days in maintenance per vehicle.
 * Only considers Closed logs with both startDate and endDate.
 */
const maintenanceDowntime = async ({ startDate, endDate }) => {
    const dateF = dateFilter(startDate, endDate, 'startDate');

    const logs = await MaintenanceLog.find({
        ...dateF,
        status: 'Closed',
        endDate: { $ne: null }
    })
        .populate('vehicle', 'registrationNumber name')
        .lean();

    // Group by vehicle and sum downtime days
    const byVehicle = {};
    for (const log of logs) {
        const vid = log.vehicle?._id?.toString() || 'unknown';
        if (!byVehicle[vid]) {
            byVehicle[vid] = {
                vehicleId: vid,
                registrationNumber: log.vehicle?.registrationNumber || 'N/A',
                vehicleName: log.vehicle?.name || 'Unknown',
                totalDays: 0,
                jobCount: 0,
                jobs: []
            };
        }
        const start = new Date(log.startDate);
        const end = new Date(log.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        byVehicle[vid].totalDays += days;
        byVehicle[vid].jobCount += 1;
        byVehicle[vid].jobs.push({
            type: log.type,
            description: log.description,
            startDate: log.startDate,
            endDate: log.endDate,
            days
        });
    }

    const results = Object.values(byVehicle);
    results.sort((a, b) => b.totalDays - a.totalDays);

    return {
        dateRange: { startDate: startDate || null, endDate: endDate || null },
        byVehicle: results,
        grandTotal: {
            totalDowntimeDays: results.reduce((s, v) => s + v.totalDays, 0),
            vehiclesWithDowntime: results.length
        }
    };
};

// ═══════════════════════════════════════════════════════════════════
//  TRIP REPORTS
// ═══════════════════════════════════════════════════════════════════

const tripSummary = async ({ startDate, endDate }) => {
    const dateF = dateFilter(startDate, endDate, 'createdAt');

    const [total, byStatus, revenueAgg, byVehicle] = await Promise.all([
        Trip.countDocuments(dateF),
        Trip.aggregate([{ $match: dateF }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        Trip.aggregate([{ $match: { ...dateF, status: 'Completed' } }, { $group: { _id: null, totalRevenue: { $sum: '$revenue' }, avgRevenue: { $avg: '$revenue' }, totalDistance: { $sum: '$plannedDistance' }, tripCount: { $sum: 1 } } }]),
        Trip.aggregate([
            { $match: dateF },
            { $group: { _id: '$vehicle', tripCount: { $sum: 1 }, totalRevenue: { $sum: '$revenue' }, totalDistance: { $sum: '$plannedDistance' } } },
            { $sort: { tripCount: -1 } },
            { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'v' } },
            { $unwind: { path: '$v', preserveNullAndEmptyArrays: true } },
            { $project: { vehicleId: '$_id', registrationNumber: '$v.registrationNumber', vehicleName: '$v.name', tripCount: 1, totalRevenue: { $round: ['$totalRevenue', 2] }, totalDistance: 1, _id: 0 } }
        ])
    ]);

    const statusMap = { Draft: 0, Dispatched: 0, Completed: 0, Cancelled: 0 };
    for (const e of byStatus) statusMap[e._id] = e.count;

    const rev = revenueAgg[0] || { totalRevenue: 0, avgRevenue: 0, totalDistance: 0, tripCount: 0 };

    return {
        total, byStatus: statusMap,
        revenue: { total: +rev.totalRevenue.toFixed(2), average: +rev.avgRevenue.toFixed(2), completedTrips: rev.tripCount },
        totalPlannedDistance: rev.totalDistance,
        dateRange: { startDate: startDate || null, endDate: endDate || null },
        byVehicle
    };
};

const tripRevenue = async ({ startDate, endDate }) => {
    const dateF = dateFilter(startDate, endDate, 'completedAt');

    const trips = await Trip.find({ ...dateF, status: 'Completed' })
        .populate('vehicle', 'registrationNumber name acquisitionCost')
        .populate('driver', 'name')
        .sort({ completedAt: -1 })
        .lean();

    const summary = {
        totalRevenue: 0, totalFuelConsumed: 0, totalDistance: 0, tripCount: trips.length, trips: []
    };

    for (const t of trips) {
        summary.totalRevenue += t.revenue || 0;
        summary.totalFuelConsumed += t.fuelConsumed || 0;
        summary.totalDistance += t.plannedDistance || 0;
        summary.trips.push({
            _id: t._id, source: t.source, destination: t.destination,
            vehicle: t.vehicle?.registrationNumber || 'N/A',
            driver: t.driver?.name || 'N/A',
            plannedDistance: t.plannedDistance, cargoWeight: t.cargoWeight,
            revenue: t.revenue, fuelConsumed: t.fuelConsumed,
            completedAt: t.completedAt
        });
    }

    return {
        summary: {
            totalRevenue: +summary.totalRevenue.toFixed(2),
            totalFuelConsumed: +summary.totalFuelConsumed.toFixed(2),
            totalDistance: summary.totalDistance,
            tripCount: summary.tripCount,
            avgRevenuePerTrip: summary.tripCount > 0 ? +(summary.totalRevenue / summary.tripCount).toFixed(2) : 0
        },
        dateRange: { startDate: startDate || null, endDate: endDate || null },
        trips: summary.trips
    };
};

// ═══════════════════════════════════════════════════════════════════
//  EXPENSE REPORTS
// ═══════════════════════════════════════════════════════════════════

const expenseSummary = async ({ startDate, endDate }) => {
    const dateF = dateFilter(startDate, endDate, 'date');

    const [totalAgg, byType, byVehicle] = await Promise.all([
        Expense.aggregate([{ $match: dateF }, { $group: { _id: null, totalAmount: { $sum: '$amount' }, avgAmount: { $avg: '$amount' }, count: { $sum: 1 } } }]),
        Expense.aggregate([{ $match: dateF }, { $group: { _id: '$type', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { totalAmount: -1 } }]),
        Expense.aggregate([
            { $match: dateF },
            { $group: { _id: '$vehicle', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { totalAmount: -1 } },
            { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'v' } },
            { $unwind: { path: '$v', preserveNullAndEmptyArrays: true } },
            { $project: { vehicleId: '$_id', registrationNumber: '$v.registrationNumber', vehicleName: '$v.name', totalAmount: { $round: ['$totalAmount', 2] }, count: 1, _id: 0 } }
        ])
    ]);

    const agg = totalAgg[0] || { totalAmount: 0, avgAmount: 0, count: 0 };

    return {
        totalAmount: +agg.totalAmount.toFixed(2),
        averageAmount: +agg.avgAmount.toFixed(2),
        transactionCount: agg.count,
        dateRange: { startDate: startDate || null, endDate: endDate || null },
        byType: byType.map(e => ({ type: e._id, totalAmount: +e.totalAmount.toFixed(2), count: e.count })),
        byVehicle
    };
};

// ═══════════════════════════════════════════════════════════════════
//  ROI & FLEET UTILIZATION
// ═══════════════════════════════════════════════════════════════════

const vehicleROI = async () => {
    const vehicles = await Vehicle.find().lean();

    const [maintCosts, fuelCosts, tripRevenues, expenseCosts] = await Promise.all([
        MaintenanceLog.aggregate([{ $group: { _id: '$vehicle', totalCost: { $sum: '$cost' } } }]),
        FuelLog.aggregate([{ $group: { _id: '$vehicle', totalCost: { $sum: '$cost' } } }]),
        Trip.aggregate([{ $match: { status: 'Completed' } }, { $group: { _id: '$vehicle', totalRevenue: { $sum: '$revenue' } } }]),
        Expense.aggregate([{ $group: { _id: '$vehicle', totalAmount: { $sum: '$amount' } } }])
    ]);

    const costMap = {};
    for (const m of maintCosts) costMap[m._id] = { ...(costMap[m._id] || {}), maint: m.totalCost };
    for (const f of fuelCosts) costMap[f._id] = { ...(costMap[f._id] || {}), fuel: f.totalCost };
    for (const e of expenseCosts) costMap[e._id] = { ...(costMap[e._id] || {}), expense: e.totalAmount };

    const revenueMap = {};
    for (const t of tripRevenues) revenueMap[t._id] = t.totalRevenue;

    const results = vehicles.map(v => {
        const vid = v._id.toString();
        const costs = costMap[vid] || {};
        const maint = costs.maint || 0;
        const fuel = costs.fuel || 0;
        const expense = costs.expense || 0;
        const totalOpCost = maint + fuel + expense;
        const revenue = revenueMap[vid] || 0;
        const roi = v.acquisitionCost > 0
            ? +(((revenue - totalOpCost) / v.acquisitionCost) * 100).toFixed(2)
            : null;

        return {
            vehicleId: vid,
            registrationNumber: v.registrationNumber,
            vehicleName: v.name,
            type: v.type,
            status: v.status,
            acquisitionCost: v.acquisitionCost,
            revenue: +revenue.toFixed(2),
            maintenanceCost: maint,
            fuelCost: fuel,
            otherExpenses: expense,
            totalOperationalCost: +totalOpCost.toFixed(2),
            netReturn: +(revenue - totalOpCost).toFixed(2),
            roi
        };
    });

    results.sort((a, b) => (b.roi ?? -Infinity) - (a.roi ?? -Infinity));

    return {
        formula: 'ROI (%) = ((Revenue - (Maintenance + Fuel + Other Expenses)) / AcquisitionCost) × 100',
        vehicles: results
    };
};

const fleetUtilization = async ({ startDate, endDate } = {}) => {
    const periodStart = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const periodEnd = endDate ? new Date(endDate) : new Date();

    const [totalVehicles, retiredVehicles] = await Promise.all([
        Vehicle.countDocuments(),
        Vehicle.countDocuments({ status: 'Retired' })
    ]);

    const activeFleet = totalVehicles - retiredVehicles;

    const tripCounts = await Trip.aggregate([
        { $match: { dispatchedAt: { $ne: null }, dispatchedAt: { $gte: periodStart, $lte: periodEnd } } },
        { $group: { _id: '$vehicle', tripCount: { $sum: 1 }, totalDistance: { $sum: '$plannedDistance' } } }
    ]);

    const vehicles = await Vehicle.find({ status: { $ne: 'Retired' } }, 'registrationNumber name type status odometer').lean();

    const usageMap = {};
    for (const t of tripCounts) usageMap[t._id.toString()] = t;

    const results = vehicles.map(v => {
        const usage = usageMap[v._id.toString()] || { tripCount: 0, totalDistance: 0 };
        return {
            vehicleId: v._id,
            registrationNumber: v.registrationNumber,
            vehicleName: v.name,
            type: v.type,
            status: v.status,
            odometer: v.odometer,
            tripCount: usage.tripCount,
            totalDistance: usage.totalDistance
        };
    });

    const utilizedVehicles = results.filter(v => v.tripCount > 0).length;
    const utilizationPct = activeFleet > 0 ? +((utilizedVehicles / activeFleet) * 100).toFixed(1) : 0;

    return {
        period: { startDate: periodStart.toISOString(), endDate: periodEnd.toISOString() },
        fleetSize: { total: totalVehicles, active: activeFleet, retired: retiredVehicles },
        utilizationPct,
        utilizedVehicles,
        idleVehicles: activeFleet - utilizedVehicles,
        byVehicle: results
    };
};

module.exports = {
    vehicleOverview,
    vehicleValue,
    driverOverview,
    driverLicenseExpiry,
    fuelSummary,
    fuelEfficiency,
    maintenanceSummary,
    maintenanceCostByVehicle,
    maintenanceDowntime,
    tripSummary,
    tripRevenue,
    expenseSummary,
    vehicleROI,
    fleetUtilization
};
