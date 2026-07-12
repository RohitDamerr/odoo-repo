const Vehicle = require('../../models/Vehicle');
const Driver = require('../../models/Driver');
const Trip = require('../../models/Trip');
const MaintenanceLog = require('../../models/MaintenanceLog');
const FuelLog = require('../../models/FuelLog');
const Expense = require('../../models/Expense');

const getKPIs = async ({ startDate, endDate } = {}) => {
    const now = new Date();
    const monthStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const period = (field) => ({ [field]: { $gte: monthStart, $lte: monthEnd } });

    const [
        totalVehicles, availableVehicles, inShopVehicles, onTripVehicles, retiredVehicles,
        totalDrivers, availableDrivers, onTripDrivers, offDutyDrivers, suspendedDrivers,
        activeTrips, pendingTrips, completedThisMonth, cancelledThisMonth,
        activeMaintenance,
        tripRevenueAgg, maintCostAgg, fuelAgg, expenseAgg, expenseByType
    ] = await Promise.all([
        Vehicle.countDocuments(),
        Vehicle.countDocuments({ status: 'Available' }),
        Vehicle.countDocuments({ status: 'In Shop' }),
        Vehicle.countDocuments({ status: 'On Trip' }),
        Vehicle.countDocuments({ status: 'Retired' }),
        Driver.countDocuments(),
        Driver.countDocuments({ status: 'Available' }),
        Driver.countDocuments({ status: 'On Trip' }),
        Driver.countDocuments({ status: 'Off Duty' }),
        Driver.countDocuments({ status: 'Suspended' }),
        Trip.countDocuments({ status: 'Dispatched' }),
        Trip.countDocuments({ status: 'Draft' }),
        Trip.countDocuments({ status: 'Completed', ...period('completedAt') }),
        Trip.countDocuments({ status: 'Cancelled', ...period('cancelledAt') }),
        MaintenanceLog.countDocuments({ status: 'Active' }),
        Trip.aggregate([{ $match: { status: 'Completed', ...period('completedAt') } }, { $group: { _id: null, totalRevenue: { $sum: '$revenue' }, tripCount: { $sum: 1 } } }]),
        MaintenanceLog.aggregate([{ $match: period('startDate') }, { $group: { _id: null, totalCost: { $sum: '$cost' }, jobCount: { $sum: 1 } } }]),
        FuelLog.aggregate([{ $match: period('date') }, { $group: { _id: null, totalLiters: { $sum: '$liters' }, totalCost: { $sum: '$cost' }, logCount: { $sum: 1 } } }]),
        Expense.aggregate([{ $match: period('date') }, { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }]),
        Expense.aggregate([{ $match: period('date') }, { $group: { _id: '$type', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { totalAmount: -1 } }])
    ]);

    const activeFleet = totalVehicles - retiredVehicles;
    const fleetUtilization = activeFleet > 0 ? +((onTripVehicles / activeFleet) * 100).toFixed(1) : 0;

    const maintCost = maintCostAgg[0]?.totalCost || 0;
    const fuelCost = fuelAgg[0]?.totalCost || 0;
    const expAmount = expenseAgg[0]?.totalAmount || 0;

    return {
        period: { startDate: monthStart.toISOString(), endDate: monthEnd.toISOString() },
        fleet: {
            totalVehicles, activeFleet, availableVehicles, onTripVehicles,
            inShopVehicles, retiredVehicles, fleetUtilization
        },
        drivers: {
            totalDrivers, availableDrivers, onTripDrivers, offDutyDrivers, suspendedDrivers
        },
        trips: {
            activeTrips, pendingTrips, completedThisMonth, cancelledThisMonth,
            revenueThisMonth: tripRevenueAgg[0]?.totalRevenue || 0,
            avgRevenuePerTrip: tripRevenueAgg[0] ? +((tripRevenueAgg[0].totalRevenue / tripRevenueAgg[0].tripCount).toFixed(2)) : 0
        },
        maintenance: {
            activeJobs: activeMaintenance,
            jobsThisMonth: maintCostAgg[0]?.jobCount || 0,
            costThisMonth: maintCost
        },
        fuel: {
            litersThisMonth: +(fuelAgg[0]?.totalLiters || 0).toFixed(2),
            costThisMonth: fuelCost,
            logsThisMonth: fuelAgg[0]?.logCount || 0
        },
        expenses: {
            totalThisMonth: +expAmount.toFixed(2),
            countThisMonth: expenseAgg[0]?.count || 0,
            byType: expenseByType.map(e => ({ type: e._id, amount: +e.totalAmount.toFixed(2), count: e.count }))
        },
        operationalCostThisMonth: +(maintCost + fuelCost + expAmount).toFixed(2)
    };
};

module.exports = { getKPIs };
